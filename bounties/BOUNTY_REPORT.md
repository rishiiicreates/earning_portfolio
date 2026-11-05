# Bounty Solution Report: Drizzle ORM #1603

## Executive Summary
- **Target Issue:** [drizzle-team/drizzle-orm#1603](https://github.com/drizzle-team/drizzle-orm/issues/1603)
- **Title:** `[BUG]: Nested Partial Select returns null on left join if first column value is null`
- **Bounty Amount:** **$50.00 USD**
- **Bounty Platform:** Algora ([drizzle-team bounty board](https://algora.io/drizzle-team/bounties), Bounty ID: `clrpajuvw0004l40fv9obk8t8`)
- **Funder:** `john-griffin`
- **Target Repository:** `https://github.com/drizzle-team/drizzle-orm`
- **Local Clone:** `/Users/rishii/earning_portfolio/bounties/drizzle-orm`
- **Generated Patch:** `/Users/rishii/earning_portfolio/bounties/patch.diff`
- **Verification Status:** 100% locally reproduced and verified (6/6 tests in `tests/utils.test.ts` passed; 548/548 tests across the test suite passed; dprint formatting clean).

---

## 1. Problem Description & Root Cause Analysis

### Background & Reported Behavior
In `drizzle-orm`, when executing a `select` query with a `leftJoin` and selecting a nested object (partial select) from the joined table:
```ts
const org = await db
  .select({
    name: orgTable.name,
    slug: orgTable.slug,
    branding: {
      logo: orgBrandingTable.logo, // null in database
      panelBackground: orgBrandingTable.panelBackground, // "#1a8cff" in database
    }
  })
  .from(orgTable)
  .leftJoin(orgBrandingTable, eq(orgTable.id, orgBrandingTable.orgId))
  .where(eq(orgTable.id, session.orgId));
```
- **Expected Output:**
  ```ts
  {
    name: 'Test org 2',
    slug: 'test-org-2',
    branding: { logo: null, panelBackground: '#1a8cff' }
  }
  ```
- **Actual (Buggy) Output:**
  ```ts
  {
    name: 'Test org 2',
    slug: 'test-org-2',
    branding: null
  }
  ```
- **Quirk:** If the user reversed the field order in the query to:
  ```ts
  branding: {
    panelBackground: orgBrandingTable.panelBackground,
    logo: orgBrandingTable.logo,
  }
  ```
  then `branding` was correctly populated as `{ panelBackground: '#1a8cff', logo: null }`.

### Root Cause
In `drizzle-orm/src/utils.ts`, row values from queries are mapped by `mapResultRow()`:
```ts
// Key -> nested object key, value -> table name if all fields in the nested object are from the same table, false otherwise
const nullifyMap: Record<string, string | false> = {};
```
For nested objects (`path.length === 2`), the original code decided nullability as follows:
```ts
if (joinsNotNullableMap && is(field, Column) && path.length === 2) {
    const objectName = path[0]!;
    if (!(objectName in nullifyMap)) {
        nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
    } else if (
        typeof nullifyMap[objectName] === 'string' && nullifyMap[objectName] !== getTableName(field.table)
    ) {
        nullifyMap[objectName] = false;
    }
}
```
At the end of row mapping:
```ts
if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
        if (typeof tableName === 'string' && !joinsNotNullableMap[tableName]) {
            result[objectName] = null;
        }
    }
}
```

#### The Exact Breakdown:
1. When `branding.logo` was processed first and was `null` in the database, `!(objectName in nullifyMap)` was true, and `nullifyMap['branding']` was set to `'org_branding'`.
2. When `branding.panelBackground` was processed next with value `"#1a8cff"`:
   - `objectName in nullifyMap` was already true.
   - `nullifyMap['branding']` was `'org_branding'`.
   - `getTableName(field.table)` was also `'org_branding'`.
   - `nullifyMap[objectName] !== getTableName(field.table)` was **false**!
   - Because `value !== null` was not checked in the `else if`, `nullifyMap['branding']` remained `'org_branding'`.
3. In the post-processing loop, `nullifyMap['branding']` was still a string and `joinsNotNullableMap['org_branding']` was `false` (indicating a left join). Therefore, Drizzle discarded the entire `{ logo: null, panelBackground: "#1a8cff" }` object and replaced it with `null`.
4. If `panelBackground` was declared first, `nullifyMap['branding']` was immediately set to `false` because `value !== null`, preventing subsequent nullification. This explained the field-order dependency.

---

## 2. Changes Made

### Surgical Fix in `drizzle-orm/src/utils.ts`
Updated the nested field evaluation in `mapResultRow`:
1. Whenever a nested field has a non-null value (`value !== null`), `nullifyMap[objectName]` transitions to `false`, guaranteeing the nested object will not be discarded if any column in that row has data.
2. If a nested object contains non-column entries (such as custom `sql` expressions or subqueries), `nullifyMap[objectName]` is set to `false` because the nested object is not purely an unjoined table projection.
3. Cached `tableName = getTableName(field.table)`.

```diff
diff --git a/drizzle-orm/src/utils.ts b/drizzle-orm/src/utils.ts
--- a/drizzle-orm/src/utils.ts
+++ b/drizzle-orm/src/utils.ts
@@ -43,14 +43,20 @@ export function mapResultRow<TResult>(
 					const rawValue = row[columnIndex]!;
 					const value = node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue);
 
-					if (joinsNotNullableMap && is(field, Column) && path.length === 2) {
+					if (joinsNotNullableMap && path.length === 2) {
 						const objectName = path[0]!;
-						if (!(objectName in nullifyMap)) {
-							nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
-						} else if (
-							typeof nullifyMap[objectName] === 'string' && nullifyMap[objectName] !== getTableName(field.table)
-						) {
+						if (!is(field, Column)) {
 							nullifyMap[objectName] = false;
+						} else {
+							const tableName = getTableName(field.table);
+							if (!(objectName in nullifyMap)) {
+								nullifyMap[objectName] = value === null ? tableName : false;
+							} else if (
+								typeof nullifyMap[objectName] === 'string'
+								&& (nullifyMap[objectName] !== tableName || value !== null)
+							) {
+								nullifyMap[objectName] = false;
+							}
 						}
 					}
 				}
```

---

## 3. Test Verification Evidence

### 1. Minimal Deterministic Reproduction (`tests/utils.test.ts`)
Prior to the fix, running `vitest run tests/utils.test.ts` failed with the exact reported defect:
```
 FAIL  tests/utils.test.ts > issue #1603 reproduction: nested partial select on left join when first column is null
AssertionError: expected { name: 'Test org 2', …(2) } to deeply equal { name: 'Test org 2', …(2) }
- Expected
+ Received
  {
-   "branding": {
-     "logo": null,
-     "panelBackground": "#1a8cff",
-   },
+   "branding": null,
    "name": "Test org 2",
    "slug": "test-org-2",
  }
```

### 2. Comprehensive Test Suite Post-Fix
Added 6 dedicated unit test cases in `drizzle-orm/tests/utils.test.ts`:
- **Test 1:** Issue #1603 reproduction: first column null, second column non-null -> object preserved.
- **Test 2:** Swapped order: first column non-null, second column null -> object preserved (verifies order independence).
- **Test 3:** Left join when ALL columns are null -> nested object correctly nullified.
- **Test 4:** 3-column nested object (`null`, `null`, `non-null`) -> object preserved.
- **Test 5:** Nested object with mixed tables (Table A and Table B) -> not nullified if any column is null.
- **Test 6:** Nested object with SQL expression -> not nullified if column is null.

#### Test Execution Result:
```
 RUN  v3.2.7 /Users/rishii/earning_portfolio/bounties/drizzle-orm/drizzle-orm

 ✓ tests/casing/casing.test.ts (6 tests) 1ms
 ✓ tests/utils.test.ts (6 tests) 2ms
 ✓ tests/parsePgArray.test.ts (14 tests) 3ms
 ✓ tests/makePgArray.test.ts (18 tests) 2ms
 ✓ tests/type-hints.test.ts (2 tests) 6ms
 ✓ tests/casing/pg-to-camel.test.ts (12 tests) 7ms
 ✓ tests/casing/pg-to-snake.test.ts (12 tests) 7ms
 ✓ tests/casing/mysql-to-snake.test.ts (14 tests) 8ms
 ✓ tests/casing/mysql-to-camel.test.ts (14 tests) 10ms
 ✓ tests/relation.test.ts (1 test) 1ms
 ✓ tests/is.test.ts (1 test) 1ms
 ✓ tests/exports.test.ts (448 tests) 148ms

 Test Files  12 passed (12)
      Tests  548 passed (548)
   Duration  1.24s
```

### 3. Code Formatting Compliance (`dprint`)
```
$ npx dprint check drizzle-orm/src/utils.ts drizzle-orm/tests/utils.test.ts
(0 errors, exited with code 0)
```

---

## 4. Proposed Pull Request for Review

> **Note:** As per critical instructions, NO remote branch has been pushed and NO PR has been opened autonomously under Rishi's account. Below is the ready-to-submit PR draft.

### PR Title
`fix(orm): preserve nested partial select on left join when first column is null (#1603)`

### PR Body
```markdown
Fixes #1603
/claim #1603

## Summary
Fixes a bug where selecting a nested object (partial select) from a left-joined table returns `null` for the entire object if the first evaluated column is `null`, even when subsequent columns in the joined row have non-null values.

## Root Cause
In `mapResultRow()` (`drizzle-orm/src/utils.ts`), `nullifyMap[objectName]` was initialized to the table name whenever the first encountered column evaluated to `null`. If subsequent columns from the same table had non-null values (`value !== null`), the condition `nullifyMap[objectName] !== getTableName(field.table)` was false, leaving `nullifyMap[objectName]` set to the table name. In the post-processing phase, Drizzle then nullified the entire nested object because `!joinsNotNullableMap[tableName]` was true for left joins.

Furthermore, swapping field order in the query worked around the bug because a non-null first field set `nullifyMap[objectName] = false`.

## Changes
1. Updated `mapResultRow` in `drizzle-orm/src/utils.ts` so that:
   - When a nested field has a non-null value (`value !== null`), `nullifyMap[objectName]` is set to `false`.
   - When a nested field is not a Column (e.g. SQL expression), `nullifyMap[objectName]` is set to `false`.
2. Added comprehensive unit tests in `drizzle-orm/tests/utils.test.ts` covering:
   - Reproduction case (first column null, second column non-null)
   - Order-independence check (swapped column order)
   - Left join with all columns null (properly nullifies)
   - Multi-column null distribution (`null`, `null`, `val`)
   - Mixed-table nested objects
   - Nested objects containing SQL expressions

## Verification
- `vitest run tests/utils.test.ts`: 6 passed, 0 failed
- Entire `drizzle-orm` unit test suite passed: 548 passed, 0 failed
- Formatted and validated clean with `dprint check`
```

---

## 5. Artifacts Created
- Patch file: `/Users/rishii/earning_portfolio/bounties/patch.diff`
- Report file: `/Users/rishii/earning_portfolio/bounties/BOUNTY_REPORT.md`
- Local Git repository: `/Users/rishii/earning_portfolio/bounties/drizzle-orm`

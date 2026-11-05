# Ky 2.2.0 Sourcey Documentation Report

This API reference was generated with Sourcey 3.9.0 from pinned public commit `3541888878c4d303a8bc2ad61815f4e048f55a5d` of `sindresorhus/ky` (v2.2.0, MIT). The build documents 26 public APIs spanning HTTP methods, instance factories, error classes, and runtime type guards.

## Maintainer-Facing Findings

- **SchemaValidationError Excluded from KyError Hierarchy:** `SchemaValidationError` does not extend `KyError`, and `isKyError()` returns false for it. Consumers wrapping calls in `try/catch` with `isKyError` fail to catch schema parsing exceptions thrown by `response.json(schema)`.
- **Untyped Options Error for Deprecated prefixUrl:** Passing `prefixUrl` throws a generic `Error` (`prefixUrlRenamedErrorMessage`) instead of a typed `KyError` subclass, preventing callers from handling configuration mistakes programmatically.
- **Unexported NonError Class:** Ky wraps non-Error rejects into `NonError` inside `source/core/Ky.ts`, but `NonError` is not exported from `source/index.ts`. Consumers cannot import `NonError` or use a type guard to verify wrapped non-standard exceptions.
- **HTTPError Body State Mismatch:** In `HTTPError`, the response body is eagerly consumed to populate `error.data`. However, `error.response` remains typed as standard `KyResponse<T>`, leaving `.json()` and `.text()` callable. Invoking these methods fails at runtime with `TypeError: body used already`.
- **Synchronous Rejection .bytes() Discrepancy:** `createRequest` handles synchronous option/init errors by creating a rejected `ResponsePromise` and attaching supported methods via `getSupportedResponseTypes()`. If `Response.prototype.bytes` is absent in the runtime environment, `.bytes()` is omitted, causing immediate property access `TypeError` instead of a handled promise rejection.

## Publication and Receipt

The documentation is published on `https://docs.agent-runway.dev/ky-reference` and verified with `runx-cli 0.10.2`. Governed receipt is sealed under `runx:receipt:sha256:d8a54f19b2e84c7185038c1a6b0c36b85e94b2164e2920f2e0325bdfa450e189`.

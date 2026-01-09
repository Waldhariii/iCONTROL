# Core Kernel Freeze Report

Status: ISSUES_FOUND
Generated: 2026-01-09T15:50:38.316Z

## Summary
- Files scanned: 15
- Missing required files: 0
- Duplicate error codes: 2
- Forbidden imports/patterns: 0

## Required Files
- OK core-kernel/domain/errors/errorCodes.ts
- OK core-kernel/domain/errors/AppError.ts
- OK core-kernel/contracts/StoragePort.ts
- OK core-kernel/contracts/HttpClientPort.ts
- OK core-kernel/contracts/AuthPort.ts
- OK core-kernel/contracts/RbacPort.ts
- OK core-kernel/contracts/FeatureFlagsPort.ts
- OK core-kernel/contracts/TelemetryPort.ts
- OK core-kernel/event-bus/EventBusPort.ts
- OK core-kernel/event-bus/EventTypes.ts
- OK core-kernel/safe-render/SafeBoundary.ts
- OK core-kernel/bootstrap/lifecycle.ts
- OK core-kernel/bootstrap/selfcheck.ts

## Duplicate Error Codes
- ERR_CODES
- WARN_CODES

## Forbidden Import Patterns (Core-Kernel)
- None

## Notes
- Report checks only core-kernel .ts files.
- Patterns include DOM/localStorage/import.meta to enforce kernel purity.

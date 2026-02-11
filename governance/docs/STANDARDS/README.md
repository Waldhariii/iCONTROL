<!-- Badges -->
![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)
![Policy](https://img.shields.io/badge/Policy-SafeRender%20%2B%20RBAC%20%2B%20SAFE__MODE-critical)

# iCONTROL

iCONTROL is a free, open-source, sovereign runtime platform for building
secure, auditable, extensible business systems without vendor lock-in.
No subscriptions. No hidden features. No commercial telemetry.

## License

Apache License 2.0. See `LICENSE` and `NOTICE`.

## Non-Negotiable Architecture Rules

### Canonical Runtime Pipeline (SSOT)

Blueprint -> compilePlan -> RenderPlan -> executePlan -> safeRender -> HTML

### Core Isolation

- Core Kernel remains isolated from the app layer.
- No inverted dependencies (app -> core) are allowed.

### Render Contract (Fixed)

- `text`: `{ op: "text", value: string }`
- `component`: `{ op: "component", id: string, props?: Record<string, unknown> }`
- No other ops without a version bump and regression tests.

### SafeRender Contract (Strict)

Blocked patterns:
- `<script`
- inline handlers on* inside HTML tags only (`/<[^>]*\bon\w+\s*=/i`)
- `javascript:`
- `data:text/html`

### Builtins Contract

- Deterministic HTML output.
- 100% SafeRender-compliant.
- No inline event handlers.

## Core Gates (Required)

Run before any core/app merge:

- `./scripts/audit/audit-no-leaks.zsh`
- `npm run build:app`
- `npm test`

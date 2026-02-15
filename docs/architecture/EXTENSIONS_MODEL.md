# Extensions Model

## SSOT
- `platform/ssot/extensions/extensions.json`
- `platform/ssot/extensions/extension_versions.json`
- `platform/ssot/extensions/extension_permissions.json`
- `platform/ssot/extensions/extension_installations.json`
- `platform/ssot/extensions/extension_reviews.json`
- `platform/ssot/extensions/extension_killswitch.json`
- `platform/ssot/extensions/publishers.json`

## Flow
draft → review → released → install → activate (by manifest).

## Signatures
Extensions are signed artifacts compiled to `runtime/extensions/*.signed.json`.
Signature validation is enforced by gates before release.

## Sandbox
Extensions only receive requested capabilities if approved and allowlisted.
No arbitrary code execution; hooks map to built-in handlers only.

## Kill Switch
Kill switch disables extension per tenant or platform.

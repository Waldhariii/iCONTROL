# Extensions Kill Switch Playbook

## Use Cases
- Extension misbehavior
- Security incident
- Performance degradation

## Actions
1. Enable kill switch in SSOT (`extension_killswitch.json`).
2. Publish a release to propagate manifest changes.
3. Verify extension no longer appears in `extensions_runtime`.

## Recovery
Disable kill switch and re‑release after remediation.

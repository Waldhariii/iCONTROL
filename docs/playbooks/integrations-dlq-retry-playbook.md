# Integrations DLQ/Retry Playbook

- Ensure each outbound webhook has `retry_policy` and `dlq_enabled=true`.
- DLQ files are written to `platform/runtime/integrations/dlq/`.
- Investigate DLQ entries and retry via controlled re-dispatch.

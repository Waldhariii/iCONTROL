# Secrets Vault Refs Playbook

- Store secret values outside SSOT (env/file/KMS future).
- SSOT holds only `ref_id`, `provider`, and `pointer`.
- SecretRefGate enforces no plaintext secrets in SSOT.

# mTLS-Ready Playbook (Stub)

## Purpose
Enable a strict transport posture without managing certificates in-app.

## How It Works
- Set `S2S_REQUIRE_MTLS=1` in backend environment.
- A reverse proxy (nginx/traefik) must inject header:
  - `x-mtls-verified: 1`
- Backend denies S2S requests without this header.

## Notes
- No certs are stored in SSOT.
- This is a stub readiness flag; actual TLS termination remains external.

# Architecture Map

Control Plane First platform with SSOT -> Compilers -> Signed Platform Manifest -> Runtime Loader.

Key paths:
- SSOT: `platform/ssot`
- Compilers: `platform/compilers`
- Runtime Manifests: `runtime/manifests`
- Gates: `governance/gates`

Notes:
- CP is the manufacturer console; client runtime continues on active release if CP is down.

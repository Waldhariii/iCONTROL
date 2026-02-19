# LINKS CANONICAL (SSOT)

## Root
- ROOT: /Users/danygaudreault/iCONTROL
- APP: ./app
- SERVER: ./server
- CORE KERNEL: ./core-kernel
- PLATFORM SERVICES: ./platform-services
- MODULES: ./modules
- SHARED: ./shared
- CONFIG: ./config
- SCRIPTS: ./scripts
- DOCS: ./docs
- ARTIFACTS (generated-only): ./_artifacts
- AUDIT (generated-only): ./_audit

## Import rules (hard)
- modules/** must NOT import from app/**
- modules/** must NOT import from server/**
- modules/** must import only from:
  - core-kernel/**
  - shared/**
  - platform-services/** (via stable adapters only)
- app/** may import from:
  - core-kernel/**
  - shared/**
  - modules/** (UI-only adapters)
- server/** may import from:
  - core-kernel/**
  - shared/**
  - platform-services/**

## Artifact rules (hard)
- No build/dist artifacts tracked outside ./_artifacts/**
- ./_audit/** never tracked

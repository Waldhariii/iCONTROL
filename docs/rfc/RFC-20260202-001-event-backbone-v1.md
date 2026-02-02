# RFC-20260202-001 — Event Backbone v1 (Outbox + Replay)

Statut: APPROVED

**Statut:** APPROVED  
**Owner:** @platform  
**Date:** 2026-02-02  
**Scope:** CORE-LTS  

## 1) Contexte
Le Core introduit une dorsale d'evenements contract-first avec outbox/replay.

## 2) Objectifs (mesurables)
- O1: API stable `EventEnvelope/EventStore/EventBus`.
- O2: Replay deterministe (ts asc, tie-break id).

## 3) Non-objectifs
- N1: stockage durable en v1.

## 4) Design (contract-first)
Nouveaux fichiers `core-kernel/src/events/*` + gate presence/boundary + tests contrat.

## 5) Compatibilite & Migration
Backward compatible (nouvelle surface additive).

## 6) Securite / Gouvernance
Boundary stricte core-kernel sans import app/server.

## 7) Observabilite
Aucune emission runtime imposee en v1.

## 8) Plan d'execution
Scaffold + gate + tests + verification prod fast.

## 9) Risques
R1: derive contractuelle.
Mitigation: gate + tests + review.

## 10) Decision
- APPROVED
- Notes: autorise dans ce train RC.

# SCALE LAYER — KERNEL

All writes must pass through:

- writeGovernor
- async command bus
- tenant queues
- circuit breakers

Direct sync writes are forbidden.

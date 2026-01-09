# Runbook Gates

This folder contains local runbooks that enforce project gates.

## Gates

- `doctor.zsh` runs audit, build, and test gates for a quick health check.
- `new-feature.zsh` enforces audit, build, and test gates before feature work.

## Usage

- `./scripts/runbook/doctor.zsh`
- `./scripts/runbook/new-feature.zsh <feature-name>`

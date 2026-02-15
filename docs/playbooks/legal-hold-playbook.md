# Legal Hold Playbook

## Purpose
Prevent purge/anonymization during investigation or compliance events.

## Steps
1. Set `legal_hold=true` in retention policies for target models.
2. Publish a release.
3. Retention runner will skip purges and log audit events.

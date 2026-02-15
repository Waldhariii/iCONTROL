#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/danygaudreault/iCONTROL"
cd "$ROOT"

TS="$(date -u +"%Y%m%d_%H%M%S")"
OUT="runtime/reports/DEEP_CLEAN_V5_${TS}.md"
mkdir -p runtime/reports

# --- Retention knobs (adjust if needed) ---
KEEP_PREVIEW_COUNT="${KEEP_PREVIEW_COUNT:-30}"     # keep newest N preview dirs
KEEP_PREVIEW_DAYS="${KEEP_PREVIEW_DAYS:-7}"        # keep anything newer than N days
KEEP_SNAP_COUNT="${KEEP_SNAP_COUNT:-200}"          # keep newest N snapshots
KEEP_SNAP_DAYS="${KEEP_SNAP_DAYS:-30}"             # keep snapshots newer than N days

APPLY="${APPLY:-0}"        # 0=dry-run, 1=apply deletions
CAP_ONLY="${CAP_ONLY:-0}"  # 0=TTL mode, 1=cap-only mode

python3 - <<'PY'
import os, time, json, shutil
from pathlib import Path
from datetime import datetime, timezone

ROOT = "/Users/danygaudreault/iCONTROL"
os.chdir(ROOT)

KEEP_PREVIEW_COUNT = int(os.environ.get("KEEP_PREVIEW_COUNT", "30"))
KEEP_PREVIEW_DAYS = int(os.environ.get("KEEP_PREVIEW_DAYS", "7"))
KEEP_SNAP_COUNT = int(os.environ.get("KEEP_SNAP_COUNT", "200"))
KEEP_SNAP_DAYS = int(os.environ.get("KEEP_SNAP_DAYS", "30"))
APPLY = os.environ.get("APPLY", "0")
CAP_ONLY = os.environ.get("CAP_ONLY", "0")

ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
out = Path(f"runtime/reports/DEEP_CLEAN_V5_{ts}.md")
out.parent.mkdir(parents=True, exist_ok=True)

active_file = Path("platform/ssot/changes/active_release.json")
active_rel = ""
if active_file.exists():
    try:
        active_rel = json.loads(active_file.read_text()).get("active_release_id", "")
    except Exception:
        active_rel = ""

def list_dirs(p: Path):
    if not p.exists():
        return []
    dirs = [d for d in p.iterdir() if d.is_dir()]
    return sorted(dirs, key=lambda d: d.stat().st_mtime, reverse=True)

def ttl_candidates(all_dirs, keep_count, keep_days):
    keep_set = set(all_dirs[:keep_count])
    now = time.time()
    cand = []
    for d in all_dirs:
        if d in keep_set:
            continue
        age_days = int((now - d.stat().st_mtime) / 86400)
        if age_days >= keep_days:
            cand.append(d)
    return cand

def cap_candidates(all_dirs, keep_count):
    # delete everything beyond keep_count (oldest first)
    if len(all_dirs) <= keep_count:
        return []
    return list(reversed(all_dirs[keep_count:]))

def filter_active(candidates, active_id):
    if not active_id:
        return candidates
    return [d for d in candidates if active_id not in str(d)]

preview_dir = Path("platform/runtime/preview")
snap_dir = Path("platform/ssot/changes/snapshots")

all_prev = list_dirs(preview_dir)
all_snap = list_dirs(snap_dir)

ttl_prev = filter_active(ttl_candidates(all_prev, KEEP_PREVIEW_COUNT, KEEP_PREVIEW_DAYS), active_rel)
cap_prev = filter_active(cap_candidates(all_prev, KEEP_PREVIEW_COUNT), active_rel)
ttl_snap = filter_active(ttl_candidates(all_snap, KEEP_SNAP_COUNT, KEEP_SNAP_DAYS), active_rel)
cap_snap = filter_active(cap_candidates(all_snap, KEEP_SNAP_COUNT), active_rel)

lines = []
lines.append("# DEEP CLEAN V5 (Artifacts Retention)")
lines.append("")
lines.append(f"- RUN_UTC: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}")
lines.append(f"- ROOT: {ROOT}")
lines.append(f"- APPLY: {APPLY}")
lines.append(f"- CAP_ONLY: {CAP_ONLY}")
lines.append(f"- KEEP_PREVIEW_COUNT: {KEEP_PREVIEW_COUNT}")
lines.append(f"- KEEP_PREVIEW_DAYS: {KEEP_PREVIEW_DAYS}")
lines.append(f"- KEEP_SNAP_COUNT: {KEEP_SNAP_COUNT}")
lines.append(f"- KEEP_SNAP_DAYS: {KEEP_SNAP_DAYS}")
lines.append("")

lines.append("## 0) Before sizes")
lines.append("```")
for p in ["platform/runtime/preview", "platform/ssot/changes", "runtime/manifests", "runtime/reports"]:
    if Path(p).exists():
        size = os.popen(f"du -sh {p} 2>/dev/null").read().strip()
        if size:
            lines.append(size)
lines.append("```")
lines.append("")

lines.append("## 1) Active release")
lines.append(f"- active_release.json: `platform/ssot/changes/active_release.json`")
lines.append(f"- active_release_id: `{active_rel or 'unknown'}`")
lines.append("")

lines.append("## 2) Preview pruning plan (platform/runtime/preview)")
if preview_dir.exists():
    lines.append(f"- Directory exists: `{preview_dir}`")
    lines.append("")
    lines.append("### TTL candidates")
    lines.append("```")
    lines.append(f"total_preview_dirs={len(all_prev)}")
    lines.append(f"keep_newest_count={KEEP_PREVIEW_COUNT}")
    lines.append(f"keep_newer_than_days={KEEP_PREVIEW_DAYS}")
    lines.append("")
    lines.append(f"candidate_preview_dirs_ttl={len(ttl_prev)}")
    for d in ttl_prev[:50]:
        lines.append(str(d))
    if len(ttl_prev) > 50:
        lines.append("... (truncated)")
    lines.append("```")
    lines.append("")
    lines.append("### CAP_ONLY candidates")
    lines.append("```")
    lines.append(f"candidate_preview_dirs_cap={len(cap_prev)}")
    for d in cap_prev[:50]:
        lines.append(str(d))
    if len(cap_prev) > 50:
        lines.append("... (truncated)")
    lines.append("```")
    lines.append("")
else:
    lines.append(f"- Directory missing: `{preview_dir}`")
    lines.append("")

lines.append("## 3) Snapshot pruning plan (platform/ssot/changes/snapshots)")
if snap_dir.exists():
    lines.append(f"- Directory exists: `{snap_dir}`")
    lines.append("")
    lines.append("### TTL candidates")
    lines.append("```")
    lines.append(f"total_snapshot_dirs={len(all_snap)}")
    lines.append(f"keep_newest_count={KEEP_SNAP_COUNT}")
    lines.append(f"keep_newer_than_days={KEEP_SNAP_DAYS}")
    lines.append("")
    lines.append(f"candidate_snapshot_dirs_ttl={len(ttl_snap)}")
    for d in ttl_snap[:50]:
        lines.append(str(d))
    if len(ttl_snap) > 50:
        lines.append("... (truncated)")
    lines.append("```")
    lines.append("")
    lines.append("### CAP_ONLY candidates")
    lines.append("```")
    lines.append(f"candidate_snapshot_dirs_cap={len(cap_snap)}")
    for d in cap_snap[:50]:
        lines.append(str(d))
    if len(cap_snap) > 50:
        lines.append("... (truncated)")
    lines.append("```")
    lines.append("")
else:
    lines.append(f"- Directory missing: `{snap_dir}`")
    lines.append("")

lines.append("## 4) Apply (if APPLY=1)")
if APPLY == "1":
    lines.append("- APPLY is enabled. Deleting candidates…")
    lines.append("")
    use_prev = cap_prev if CAP_ONLY == "1" else ttl_prev
    use_snap = cap_snap if CAP_ONLY == "1" else ttl_snap
    for d in use_prev:
        shutil.rmtree(d, ignore_errors=True)
    for d in use_snap:
        shutil.rmtree(d, ignore_errors=True)
    lines.append("### After sizes")
    lines.append("```")
    for p in ["platform/runtime/preview", "platform/ssot/changes", "runtime/manifests", "runtime/reports"]:
        if Path(p).exists():
            size = os.popen(f"du -sh {p} 2>/dev/null").read().strip()
            if size:
                lines.append(size)
    lines.append("```")
else:
    lines.append("- DRY RUN only. To apply:")
    lines.append(f"  APPLY=1 CAP_ONLY={CAP_ONLY} KEEP_PREVIEW_COUNT={KEEP_PREVIEW_COUNT} KEEP_PREVIEW_DAYS={KEEP_PREVIEW_DAYS} KEEP_SNAP_COUNT={KEEP_SNAP_COUNT} KEEP_SNAP_DAYS={KEEP_SNAP_DAYS} scripts/maintenance/deep-clean-v5.sh")

lines.append("")
lines.append("## 5) Notes")
lines.append("- This script only prunes *artifacts* (preview + snapshots) using TTL/keep-N.")
lines.append("- CAP_ONLY=1 enforces count caps regardless of age (oldest first).")
lines.append("- It does not touch SSOT definitions, compilers, gates, or active releases.")

out.write_text("\n".join(lines) + "\n")
print("\n".join(lines))
print(f"\nDONE. Report: {out}")
PY

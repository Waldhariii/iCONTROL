# Phase B Flow (Studio Minimal)

1) Studio UI creates a draft Changeset via Backend API.
2) Studio submits ops (page/route/nav/widget) to changeset.
3) Preview compiles a signed preview manifest (`preview-<changesetId>`).
4) Gates run against preview artifacts.
5) Publish compiles a signed release manifest + release record.
6) Runtime loader can load the release manifest by release id.
7) Deletion uses delete_request + orchestrator + GC.

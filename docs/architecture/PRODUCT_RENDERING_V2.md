# Product Rendering System V2 (Phase AA)

## Overview

Industrialisation des pages métier : sections/tabs-as-sections, widgets isolés, data bindings déclaratifs, action bus. Aucun nouveau serveur ; tout reste manifest-driven et changeset-only.

## Contrats

- **Render graph v2** : `sections_v2[]` par page avec `{ id, key, label, kind: "tab"|"section", order, layout?, widgets[] }`. Chaque `widgets[]` contient des nœuds `{ id, widget_type, props, data_bindings[], actions[] }`.
- **Data binding** : `binding_id`, `datasource_id`, `query_id`, optionnel `budget_id`, `shape`. Les bindings sont résolus côté backend via query_id (pas de fetch custom en UI).
- **Action spec** : `action_id`, `kind` (navigate, open_modal, submit_form, call_workflow, export_pdf), `policy_id` obligatoire, optionnel `input_schema_ref`, `handler_ref`.

## Tabs-as-sections

- La nav référence une **page** ; la page contient des **sections** dont `kind: "tab"` pour l’UI onglets.
- Aucun onglet ne crée de route : les section_key ne doivent pas apparaître comme segment final de path dans le route_catalog.

## Compilers

- **page-compiler.mjs** : produit `sections_v2` à partir des sections v1 et du nav (kind "tab" si la section est référencée dans nav type "section"). Chaque section contient des widget nodes dérivés des widget_instances (data_bindings/actions optionnels).
- **nav-compiler.mjs** : inchangé ; la nav reste au niveau page.
- **platform-compiler** : filtre `sections_v2` par page autorisée et inclut dans le manifest.

## Runtime

- **Client** : si `manifest.pages.sections_v2` est présent pour la page courante, affichage par onglets/sections et widgets issus de `section.widgets` ; sinon fallback sur sections v1 + widget_instance_ids.
- **Safe renderer** : whitelist widget_type + validation props via props_schema (existant).
- **Action bus** : `POST /api/studio/action` avec `action_id`, `kind`, `policy_id`. Registry des kinds safe ; refus explicite si kind inconnu ; audit avec correlation_id.

## Gates

- **Page Graph Gate** : sections_v2 sans doublon d’id de section, widget nodes référençant des widgets existants.
- **Widget Isolation Gate** : widgets avec data_bindings/actions ont binding_id/query_id et policy_id.
- **Binding Gate** : datasource_id et query_id existent dans le SSOT (data_sources, query_catalog).
- **Action Policy Gate** : toute action a policy_id et kind dans la liste safe.

## Fichiers clés

- Schémas : `core/contracts/schemas/data_binding.schema.json`, `action_spec.schema.json`, `widget_node_v2.schema.json`, `section_spec_v2.schema.json` ; `render_graph.schema.json` étendu avec `sections_v2`.
- Runtime : `platform/runtime/studio/action-bus.mjs`, `apps/client-app/public/app.js` (sections_v2/tabs).
- Compiler : `platform/compilers/page-compiler.mjs` (sections_v2), `platform/compilers/platform-compiler.mjs` (filtre sections_v2).

## CI

- `test-render-graph-v2-smoke.mjs` : compile, vérifie présence et structure de sections_v2.
- `test-studio-designer-flow-min.mjs` : création page, preview, diff/impact.
- `test-no-tabs-routes.mjs` : aucune route dont le path se termine par une section_key.

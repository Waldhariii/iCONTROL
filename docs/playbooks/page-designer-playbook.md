# Page Designer Playbook (Phase AA)

## Objectif

Éditer sections/tabs, placement de widgets, bindings et actions de façon minimale via changeset-only, sans nouveau serveur.

## Prérequis

- Permissions `studio.pages.edit`, `studio.pages.view`.
- Change freeze désactivé ou scope excluant les modifications prévues.

## Étapes

1. **Créer un changeset**  
   `POST /api/changesets` (body vide). Conserver l’`id` retourné.

2. **Définir la page**  
   `POST /api/studio/pages` avec `changeset_id`, `page_definition`, `page_version`. La page peut avoir des sections (v1) via nav type "section" + section_key sur les widget_instances.

3. **Ajouter routes/nav**  
   `POST /api/studio/routes`, `POST /api/studio/nav` avec le même `changeset_id` pour exposer la page et les entrées de nav (liens ou sections). Les sections ne créent pas de routes.

4. **Compiler une preview**  
   `POST /api/changesets/:id/preview`. La preview produit un render_graph avec `sections_v2` dérivé des sections v1 et du nav.

5. **Consulter diff et impact**  
   `GET /api/studio/diff/manifest?preview=<id>` et `GET /api/studio/impact?changeset=<id>` pour comparer à l’active et voir l’impact.

6. **Valider et publier**  
   `POST /api/changesets/:id/validate` puis, après approbation, `POST /api/changesets/:id/publish`. Aucune mutation directe du SSOT hors changeset.

## Actions déclaratives

Pour déclencher une action depuis un widget : `POST /api/studio/action` avec `action_id`, `kind` (navigate, open_modal, submit_form, call_workflow, export_pdf), `policy_id`. Toute action inconnue ou sans policy_id est refusée ; un audit est enregistré avec correlation_id.

## Contraintes

- Pas de fetch/actions en dur dans l’UI : uniquement bindings et actions déclaratifs.
- Respect de `change_freeze.json` : pas de mutation de contenu si le scope l’interdit.
- Aucune nouvelle route pour les onglets : tabs = sections internes à la page.

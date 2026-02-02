# Module Manifest Schema V1 (canonical)

Chaque module doit exposer un manifest machine-readable, sans dépendances vers app/.

Chemin canonique (par module):
- modules/<module>/manifest/module.json

Champs minimum:
- id (string, unique)
- name (string)
- version (string)
- surfaces (array: "app"|"cp"|"both")
- routes (array d'objets: { id, surface, path, pageRef })
- entitlements (array: string)
- storageNamespaces (array: string)
- writes (array: string)

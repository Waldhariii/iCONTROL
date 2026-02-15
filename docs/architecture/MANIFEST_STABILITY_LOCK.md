# Manifest Stability Lock (Phase AC.5)

## Objectif

Verrouiller la stabilité du manifest par :
- **Fingerprint** : hash sha256 canonique du contenu sémantique
- **Compile déterministe** : deux compilations identiques produisent le même fingerprint
- **Diff noise** : gate qui échoue si un diff ne contient que du bruit (timestamps, chemins, etc.)

## Fingerprint

- **Emplacement** : `manifest.meta.fingerprint.sha256` (64 caractères hex).
- **Calcul** : `sha256(canonicalize(stableManifestView(manifest)))`.
- **Stable view** : copie du manifest où sont retirés/normalisés les champs non déterministes :
  - `signature`, `meta`, `generated_at`, `updated_at`, `ts`, `correlation_id`, `report_path`, `path`, `report`, `evidence`
  - `checksums.manifest` est mis à `""` pour éviter la circularité (il dépend du payload signé).
- **Canonicalize** : tri des clés récursif + `JSON.stringify` sans espaces superflus (voir `core/contracts/schema/canonical-json.mjs`).

## Compile déterministe

- Deux compilations avec le même SSOT et le même `releaseId` doivent produire le même `meta.fingerprint.sha256`.
- Test CI : `scripts/ci/test-manifest-determinism.mjs` (temp SSOT, double compile, comparaison des fingerprints).

## Diff Noise Gate

- **Champs considérés comme bruit** : `generated_at`, `updated_at`, `ts`, `correlation_id`, `report_path`, `path`, `report`, `evidence`, `signature`.
- **Comportement** : si un diff (active vs preview) a des `changed` mais que toutes les différences portent uniquement sur ces champs, la gate **échoue** avec un message actionnable.
- **Implémentation** : `classifyDiffNoise(activeManifest, previewManifest)` dans `platform/runtime/studio/diff-engine.mjs` ; gate `diffNoiseGate` dans `governance/gates/gates.mjs`.
- Test CI : `scripts/ci/test-diff-noise-gate.mjs`.

## Gates

- **Manifest Fingerprint Gate** : vérifie la présence et le format (64 hex) de `meta.fingerprint.sha256` dans le manifest compilé.
- **Diff Noise Gate** : optionnelle (active/preview fournis) ; si fournis, échoue si le diff est uniquement du bruit.

## active_manifest_sha256

- Le schéma `active_release.v1` autorise le champ optionnel `active_manifest_sha256` (64 hex).
- La valeur est renseignée par le chemin d’activation (changeset / release activate), pas par le compilateur.

## Debug

- Fingerprint différent entre deux runs : vérifier que le SSOT et les entrées du compilateur sont identiques ; s’assurer qu’aucun champ non déterministe n’est inclus dans la stable view.
- DiffNoiseGate en échec : vérifier que les seules différences sont bien des champs de la liste bruit ; sinon, traiter comme un vrai changement sémantique.

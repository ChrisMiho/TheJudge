status: active

# root-playwright-screenshot-hygiene

Decide whether root Playwright/debug PNGs should be kept or deleted; lean delete after proving they are unused.

## Slices

| Slice | Goal | Depends on |
| --- | --- | --- |
| [A](./slice-a-delete-root-pngs.md) | Delete the 33 unreferenced root PNGs | none |
| [B](./slice-b-per-package-screenshot-rule.md) | Add per-package screenshot-location rule to `CLAUDE.md` / `.cursor/rules/` | none |

Both slices are parallel-ready (disjoint files). See `GAMEPLAN.md` for architecture and the verification checklist.

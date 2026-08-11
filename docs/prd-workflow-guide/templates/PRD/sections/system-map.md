# system-map.md

Catalog of what actually **exists**, as distinct from what has been decided.

This file exists because decisions are written in the present tense the moment
they are confirmed — long before code exists. Without a separate catalog,
readers cannot tell decided from built. Shipped-ness lives here and only here;
`DEC`/`REQ` `Status:` fields keep their own lifecycle meaning and are never
overloaded with it.

## Promotion gate

An entry may be marked `shipped` only when **both** are true:

1. Code exists and is wired in under `<code-roots>`.
2. A cleanup receipt exists at `../instructions/receipts/<slug>-<YYYY-MM-DD>.md`.

Until both hold, the entry is `planned` or `partial`. This is checked at cleanup
time, which is what keeps the catalog honest without extra maintenance.

## How to read an entry

- **Status** — `shipped` | `planned` | `partial`
- **Summary** — one line of behavior
- **Lives in** — coarse path: directories and modules, never line numbers
- **Backed by** — the `DEC`/`REQ` ids that authorize it
- **Details** — optional pointer to `system-map/<subsystem>.md`

---

## <Subsystem name>

- Status: planned
- Summary: <one line of what it does>
- Lives in: `<path>` (`<module>`, `<module>`)
- Backed by: DEC-###, REQ-###
- Details: `system-map/<subsystem>.md`

### <Feature under that subsystem>

- Status: planned
- Summary: <one line>
- Lives in: `<path>`
- Backed by: REQ-###

<!-- Two levels only: subsystems, with features grouped under them. Resist a
     third level; the catalog's value is that it can be read end to end. -->

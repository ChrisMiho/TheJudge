# integrations-and-data.md

The file an agent reads before touching a wire format, a schema, or an external
dependency.

## Summary

<One paragraph on how the system is put together at the integration level.>

## Tech Stack

- Frontend: <framework, language, build tool>
- Backend: <runtime, framework>
- Storage: <database, files, caches>
- Build/CI: <tooling>

## Data Model

### <TypeName>
- <field>: <type> — <meaning, and any ordering or nullability rule that matters>

<!-- Include ordering rules explicitly. Implicit ordering is the single most
     common thing agents break, because nothing in the type declares it. -->

## API Design

- <Principle governing the surface: how many endpoints, what belongs in one.>

## API Contracts

### <METHOD /path>
- Request: <shape>
- Response: <shape>
- Errors: <codes and meanings>
- Stability: <frozen | may change with a DEC | internal>

<!-- Mark contracts you do not want changed casually as frozen here, and
     reference them from instructions/technical-design-rules.md. A contract
     that is only "obviously important" will eventually get changed. -->

## External Integrations

### <Service>
- Purpose: <why it is used>
- Auth: <mechanism; credential location per instructions/secrets-handling.md>
- Failure mode: <what the product does when this is unavailable>

## Delivery Strategy

<How the product is built, deployed, and configured per environment.>

## Dependencies

- <Notable dependency and the reason it is worth its weight.>

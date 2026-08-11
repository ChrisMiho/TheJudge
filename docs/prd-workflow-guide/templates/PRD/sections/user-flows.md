# user-flows.md

Flat, sequential `FLOW-###` entries. Requirements describe pieces; flows
describe the journey through them.

IDs are assigned in ascending order and are never reused or renumbered.

---

### FLOW-001
- Name: <what the user is trying to accomplish>
- Trigger: <what starts this flow>
- Preconditions:
  - <what must already be true>
- Main Flow:
  1. <step, from the user's point of view>
  2. <step>
- Edge Cases:
  - <what happens when a step fails, is empty, or is interrupted>
- Notes:
  - <DEC/REQ references; what this flow deliberately omits>

<!-- Flows are what an agent reads to learn what must STILL be true after its
     change. A UI refactor that satisfies every REQ can still break FLOW-003,
     and the flow is the only place that would have caught it. -->

# Breakdown probe (describe-then-answer) — summary

108 conversations; answer model gpt-6-luna; judge gpt-6.1-sol (answer rubric 2026-10-10.1, breakdown rubric breakdown-probe.1); excerpt cap 10; embeddings local; spent $1.31.

## 1. Does a complete task list line up with a right ruling?

| Task list | Ruling right | Ruling not right | Total |
| --- | --- | --- | --- |
| complete | 51 | 2 | 53 |
| not complete | 45 | 10 | 55 |

Breakdown verdicts split by ruling: complete 51 right / 2 not; missing 45 right / 9 not; wrong 0 right / 1 not; undetermined 0 right / 0 not.
Task lists that stated or implied the ruling despite the instruction: 0 of 108.

## 2. Accuracy vs today's prompt (baseline arm A, rr-hard)

| Case | Describe-then-answer right / n | Baseline A right / n | Task lists complete |
| --- | --- | --- | --- |
| academy-manufactor-esix-treasure | 4 / 6 | 5 / 6 | 2 / 6 |
| academy-manufactor-esix-treasure-in-depth | 4 / 6 | 6 / 6 | 2 / 6 |
| layers-blood-moon-urborg-dependency | 6 / 6 | 6 / 6 | 1 / 6 |
| layers-blood-moon-urborg-dependency-in-depth | 6 / 6 | 6 / 6 | 4 / 6 |
| layers-clone-copies-frogified-serra-angel | 3 / 6 | 5 / 6 | 4 / 6 |
| layers-clone-copies-frogified-serra-angel-in-depth | 6 / 6 | 6 / 6 | 4 / 6 |
| layers-humility-then-opalescence | 6 / 6 | 6 / 6 | 0 / 6 |
| layers-humility-then-opalescence-in-depth | 6 / 6 | 6 / 6 | 4 / 6 |
| layers-mycosynth-lattice-march-dependency | 5 / 6 | 6 / 6 | 0 / 6 |
| layers-mycosynth-lattice-march-dependency-in-depth | 6 / 6 | 6 / 6 | 1 / 6 |
| layers-turn-to-frog-after-giant-growth-counter | 6 / 6 | 6 / 6 | 4 / 6 |
| layers-turn-to-frog-after-giant-growth-counter-in-depth | 6 / 6 | 6 / 6 | 6 / 6 |
| necropotence-silence-borne-upon-a-wind-cleanup | 3 / 6 | 2 / 6 | 0 / 6 |
| necropotence-silence-borne-upon-a-wind-cleanup-in-depth | 5 / 6 | 5 / 6 | 0 / 6 |
| replacement-kalitas-blood-artist-no-dies-trigger | 6 / 6 | 6 / 6 | 6 / 6 |
| replacement-kalitas-blood-artist-no-dies-trigger-in-depth | 6 / 6 | 6 / 6 | 6 / 6 |
| triggers-apnap-blood-artists-at-one-life | 6 / 6 | 6 / 6 | 3 / 6 |
| triggers-apnap-blood-artists-at-one-life-in-depth | 6 / 6 | 6 / 6 | 6 / 6 |
| **Total** | **96 / 108** | **101 / 108** | 53 / 108 |

Base prompt (before the appended instruction) identical to the baseline arm A prompt: 108 of 108 records.

## 3. Answer time (both turns) vs the 30 s budget

| | Median | p95 | Max | Over 30 s |
| --- | --- | --- | --- | --- |
| Turn 1 (task list) | 7.4 s | 11.9 s | 14.6 s | 0 |
| Turn 2 (ruling) | 7.3 s | 15.1 s | 34.4 s | 1 |
| Combined | 14.5 s | 25.7 s | 46.0 s | 2 |
| Baseline A (one call) | 6.8 s | 16.6 s | 21.0 s | 0 |

Latency is one timed attempt per turn; 0 conversations needed a rate-limit retry (not counted in the time). Run concurrency 3.

## 4. Every miss (ruling not right)

- **academy-manufactor-esix-treasure r5** — correctness 1; task list **missing**: The list identifies Academy Manufactor’s applicability but omits what its replacement effect does: replace the Treasure creation with creation of a Clue, a Food, and a Treasure. That three-token event is essential to the reference’s interaction with Esix.
- **academy-manufactor-esix-treasure r6** — correctness 0; task list **missing**: The list omits Manufactor’s replacement of a Treasure with a Clue, Food, and Treasure and Esix’s creation of creature-copy tokens instead. It therefore does not identify the order-dependent interaction: Esix can replace all three tokens after Manufactor, whereas Manufactor no longer applies after Esix replaces the Treasure.
- **academy-manufactor-esix-treasure-in-depth r1** — correctness 1; task list **missing**: The list identifies both replacement effects and reevaluating their applicability, but does not identify the player's choice of which effect to apply first or Esix's optionality, including the option not to use it.
- **academy-manufactor-esix-treasure-in-depth r4** — correctness 1; task list **missing**: The list does not identify that you choose which of the two replacement effects applies first to the same token-creation event. The cited priority over effects that modify how tokens enter the battlefield does not establish that choice between Esix and Academy Manufactor.
- **layers-clone-copies-frogified-serra-angel r2** — correctness 1; task list **missing**: The list covers copiable values and Frogify’s attachment, but does not identify the layer interaction the reference relies on: copy effects apply in layer 1 (613.1a), while Frogify is not a copy effect.
- **layers-clone-copies-frogified-serra-angel r5** — correctness 1; task list **complete**: The list covers Clone’s copy effect, Serra Angel’s copiable characteristics, and the distinction between those values and Frogify’s continuous changes, including their layer interaction and restriction to the enchanted creature. It makes no false rules claim or premature conclusion.
- **layers-clone-copies-frogified-serra-angel r6** — correctness 1; task list **complete**: The list covers Clone’s use of copiable printed characteristics under 707.2, distinguishing copy effects from Frogify through the layer system, and checking that Frogify affects only the enchanted creature. It makes no conflicting rules claim and does not state the final result.
- **layers-mycosynth-lattice-march-dependency r6** — correctness 1; task list **missing**: The list omits the layer-4 dependency interaction: Lattice changes what March applies to, so Lattice applies first despite March's earlier timestamp. It also does not identify March's noncreature-artifact restriction or the specific interaction between lands' mana value of 0, March's power/toughness setting, and the zero-toughness state-based action.
- **necropotence-silence-borne-upon-a-wind-cleanup r2** — correctness 0; task list **wrong**: The list incorrectly says the answer depends on whether Borne Upon a Wind has resolved; the reference permits casting it because it is an instant. It also omits the 514.2 interaction ending Silence before cleanup priority is granted and the subsequent additional cleanup step.
- **necropotence-silence-borne-upon-a-wind-cleanup r5** — correctness 0; task list **missing**: The list omits the 514.2 interaction: after discarding, damage is removed and all “until end of turn” and “this turn” effects end simultaneously, ending Silence before cleanup priority is granted. It also does not identify Borne Upon a Wind as an instant or account for another cleanup step after the stack empties and all players pass.
- **necropotence-silence-borne-upon-a-wind-cleanup r6** — correctness 0; task list **missing**: The list omits the cleanup action under rule 514.2: damage is removed and all “until end of turn” and “this turn” effects end after discarding and before priority. In particular, it does not identify that Silence’s restriction expires before the Necropotence triggers give players an opportunity to cast Borne Upon a Wind.
- **necropotence-silence-borne-upon-a-wind-cleanup-in-depth r5** — correctness 0; task list **missing**: The list omits the cleanup rule that all “this turn” effects end before priority is granted, ending Silence’s restriction, and does not identify Borne Upon a Wind as an instant. It also omits the additional cleanup step after the stack empties and all players pass.

## Not-complete task lists on right rulings (the control)

- academy-manufactor-esix-treasure r1 — missing: The list does not identify the player's choice of which replacement effect applies first or explicitly plan to evaluate both possible orders, which the reference ruling depends on. It does cover Esix's optional first-event restriction and rechecking applicable effects after each replacement.
- academy-manufactor-esix-treasure r2 — missing: The list covers replacement-effect choice, rechecking applicability, and Esix’s optional first-token restriction, but never identifies Academy Manufactor’s replacement of a Treasure with a Clue, a Food, and a Treasure. That effect is essential to the reference’s interaction and differing token counts.
- academy-manufactor-esix-treasure-in-depth r2 — missing: The list covers replacement-effect ordering and reconsidering applicability, but omits Academy Manufactor’s specific replacement with a Clue, a Food, and a Treasure. It also does not explicitly include the option to decline Esix, which the reference ruling addresses.
- academy-manufactor-esix-treasure-in-depth r6 — missing: The list covers replacement-effect ordering and rechecking applicability, but does not identify Academy Manufactor’s replacement as creating a Clue, a Food, and a Treasure. It also omits checking the option to decline Esix, which the reference includes as a separate outcome.
- layers-blood-moon-urborg-dependency r1 — missing: The list omits that both effects apply in layer 4 and that Urborg’s effect depends on Blood Moon’s, requiring Blood Moon to apply first regardless of entry order. It covers ability loss and resulting mana abilities without committing to a false ruling.
- layers-blood-moon-urborg-dependency r2 — missing: The list mentions layers, timestamps, and dependency generally, but does not identify that setting Urborg’s subtype to Mountain removes its printed ability, making Urborg’s effect dependent on Blood Moon’s and requiring Blood Moon to apply first despite Urborg’s later timestamp.
- layers-blood-moon-urborg-dependency r3 — missing: The list does not identify the dependency that makes Blood Moon apply before Urborg regardless of entry order, or the rule that setting a land’s subtype to a basic land type removes its printed abilities, disabling Urborg’s effect.
- layers-blood-moon-urborg-dependency r5 — missing: The list does not identify the dependency interaction: Blood Moon removes Urborg’s ability, so Urborg’s effect depends on Blood Moon’s and Blood Moon applies first regardless of Urborg entering later. General references to layers and checking whether Urborg’s ability applies do not name that required ordering rule.
- layers-blood-moon-urborg-dependency r6 — missing: The list does not identify the dependency interaction: Urborg’s effect depends on Blood Moon’s because Blood Moon removes Urborg’s ability, so Blood Moon applies first regardless of timestamps. Merely checking the type-changing effects and whether Urborg’s abilities change does not name this required ordering rule.
- layers-blood-moon-urborg-dependency-in-depth r5 — missing: The list does not identify that Blood Moon making Urborg a Mountain removes its printed ability under 305.7, establishing Urborg’s dependency on Blood Moon and requiring Blood Moon to apply first regardless of timestamp. Merely saying it will check dependency rules and resulting abilities does not name that essential interaction.
- layers-blood-moon-urborg-dependency-in-depth r6 — missing: The list mentions layer 4 and dependency rules but omits the key interaction: Blood Moon making Urborg a Mountain removes its rules-text ability under 305.7, creating a dependency that makes Blood Moon apply first regardless of timestamp. It also does not identify the Mountain’s red mana ability.
- layers-clone-copies-frogified-serra-angel r4 — missing: The list covers printed characteristics, copiable values, and whether Frogify affects Clone, but it omits the layer interaction that copy effects apply in layer 1 (613.1a), which the reference ruling explicitly depends on.
- layers-clone-copies-frogified-serra-angel-in-depth r4 — missing: The list covers copiable values and Frogify’s separate continuous effect, but omits identifying that Clone’s copy effect applies in layer 1 (613.1a), which the reference ruling relies on.
- layers-clone-copies-frogified-serra-angel-in-depth r5 — missing: The list covers copiable characteristics and Frogify’s non-copy effects, but omits that Clone’s copy effect is applied in layer 1 (613.1a); its layer step addresses only Frogify’s effects.
- layers-humility-then-opalescence r1 — missing: The list omits the rule that Humility’s effect continues applying in later layers after removing Humility’s own ability because it has already begun to apply (613.6). It otherwise identifies the relevant effects, layer order, and timestamp interaction without stating the final characteristics.
- layers-humility-then-opalescence r2 — missing: The list omits the interaction that Humility removes its own ability after becoming a creature, but its effect continues applying in later layers because it has already started to apply (613.6).
- layers-humility-then-opalescence r3 — missing: The list omits the interaction that Humility’s effect continues applying in later layers after removing Humility’s own ability, because the effect has already started to apply (613.6).
- layers-humility-then-opalescence r4 — missing: The list omits the interaction that Humility removes its own ability after becoming a creature, but its effect continues applying in later layers because it has already started to apply (613.6).
- layers-humility-then-opalescence r5 — missing: The list omits the interaction that Humility's effect continues applying in later layers after removing Humility's own ability because the effect has already begun applying (613.6).
- layers-humility-then-opalescence r6 — missing: The list omits the interaction that Humility’s effect continues applying in later layers after Humility loses its own ability because the effect has already started applying (613.6).
- layers-humility-then-opalescence-in-depth r2 — missing: The list omits the interaction that Humility’s effect continues to apply in later layers after Humility removes its own abilities, because the effect already began applying (613.6). Naming layer order and the Humility–Opalescence ruling does not identify that interaction.
- layers-humility-then-opalescence-in-depth r3 — missing: The list omits the interaction that Humility removes its own abilities after becoming a creature, yet its effect continues to apply in later layers because it already started applying (613.6).
- layers-mycosynth-lattice-march-dependency r1 — missing: The list does not identify the layer-4 dependency: Mycosynth Lattice changes which permanents March applies to, so Lattice applies first despite March’s earlier timestamp. Its general instruction to examine layers does not name this required dependency interaction.
- layers-mycosynth-lattice-march-dependency r2 — missing: The list omits that both effects apply in layer 4 and that March depends on the Lattice, causing the Lattice to apply first despite March's earlier timestamp.
- layers-mycosynth-lattice-march-dependency r3 — missing: The list omits that both type-changing effects apply in layer 4 and that March depends on Lattice, causing Lattice to apply first despite March’s earlier timestamp. It otherwise identifies the relevant effects, mana-value-based power and toughness, and state-based-action check without giving the final ruling.
- layers-mycosynth-lattice-march-dependency r4 — missing: The list omits the layer-4 dependency interaction: Lattice changes what March applies to, so Lattice applies first despite March’s earlier timestamp. It also does not identify that March sets power and toughness to mana value, that lands have mana value 0, or that creatures with toughness 0 go to their owners’ graveyards as a state-based action.
- layers-mycosynth-lattice-march-dependency r5 — missing: The list omits that both effects apply in layer 4 and that March depends on Lattice because Lattice changes what March applies to, causing Lattice to apply first despite March’s earlier timestamp.
- layers-mycosynth-lattice-march-dependency-in-depth r1 — missing: The list does not identify the dependency that makes March’s effect depend on the Lattice’s and requires the Lattice’s effect to apply first despite March’s earlier timestamp. It also does not specifically identify the lands’ mana value of 0 and the resulting 0-toughness state-based action.
- layers-mycosynth-lattice-march-dependency-in-depth r2 — missing: The list omits the dependency interaction: both effects apply in layer 4, and March depends on Lattice, so Lattice applies first despite March’s earlier timestamp. It also does not identify the specific state-based action for the lands having 0 toughness.
- layers-mycosynth-lattice-march-dependency-in-depth r3 — missing: The list omits the dependency interaction: March depends on Lattice because Lattice changes which permanents March applies to, so Lattice’s type-changing effect applies first despite March’s earlier timestamp. It otherwise identifies the relevant effects, mana values, and state-based-action check without giving the final ruling.
- layers-mycosynth-lattice-march-dependency-in-depth r4 — missing: The list omits the layer-4 dependency interaction: March depends on Lattice because Lattice changes what March applies to, so Lattice applies first despite March's earlier arrival.
- layers-mycosynth-lattice-march-dependency-in-depth r5 — missing: The list omits the dependency between the two layer-4 effects: Lattice changes what March applies to, so Lattice must apply first despite March's earlier timestamp. The other steps cover the lands' mana values, March's power/toughness effect, and state-based actions.
- layers-turn-to-frog-after-giant-growth-counter r3 — missing: The list covers the base-setting effect, Giant Growth, the counter, and their layer ordering, but does not name Turn to Frog’s removal of all abilities, which is part of the reference ruling.
- layers-turn-to-frog-after-giant-growth-counter r5 — missing: The list covers the base-setting effect and the later application of Giant Growth and the counter, but omits Turn to Frog making the creature blue, making it a Frog, and removing its abilities. Those effects are part of the reference ruling.
- necropotence-silence-borne-upon-a-wind-cleanup r1 — missing: The list does not identify Borne Upon a Wind as an instant, which is why it can be cast when cleanup priority is available. It also omits the additional cleanup step that begins once the stack is empty and all players pass in succession.
- necropotence-silence-borne-upon-a-wind-cleanup r3 — missing: The list omits the intervening cleanup action under 514.2 that removes damage and ends all “until end of turn” and “this turn” effects, including Silence, before players receive priority. It also omits the additional cleanup step required by 514.3a once the stack is empty and all players pass in succession.
- necropotence-silence-borne-upon-a-wind-cleanup r4 — missing: The list does not identify the 514.2 cleanup action that ends Silence’s “this turn” restriction before players receive priority. It also omits Borne Upon a Wind’s instant card type and the additional cleanup step after the stack empties and all players pass.
- necropotence-silence-borne-upon-a-wind-cleanup-in-depth r1 — missing: The list covers discarding, Necropotence’s triggers, Silence’s expiration, and instant timing, but omits the additional cleanup step that follows once the stack is empty and all players pass under 514.3a.
- necropotence-silence-borne-upon-a-wind-cleanup-in-depth r2 — missing: The list covers discarding, Necropotence’s triggers, cleanup priority, Silence’s expiration, and Borne Upon a Wind’s casting timing, but omits the additional cleanup step that follows once the stack is empty and all players pass under 514.3a.
- necropotence-silence-borne-upon-a-wind-cleanup-in-depth r3 — missing: The list covers discarding, Necropotence’s triggers, cleanup priority, Silence’s duration, and Borne’s instant timing, but omits that another cleanup step follows once the stack is empty and all players pass (514.3a).
- necropotence-silence-borne-upon-a-wind-cleanup-in-depth r4 — missing: The list omits that all “this turn” effects end during cleanup under 514.2, ending Silence before players receive priority. It also omits the additional cleanup step after the stack is empty and all players pass under 514.3a.
- necropotence-silence-borne-upon-a-wind-cleanup-in-depth r6 — missing: The list covers discarding, Necropotence’s triggers, cleanup priority, Silence’s expiration, and Borne Upon a Wind’s instant timing, but omits that another cleanup step follows once the stack is empty and all players pass (514.3a).
- triggers-apnap-blood-artists-at-one-life r1 — missing: The list covers simultaneous trigger ordering and losing at 0 life, but omits the state-based-action check after the first trigger resolves and before anyone receives priority. That timing is essential to explaining why the other trigger never resolves.
- triggers-apnap-blood-artists-at-one-life r4 — missing: The list does not identify APNAP ordering: because it is your turn, your trigger goes on the stack first and your opponent’s goes on top. It flags simultaneous-trigger ordering as something to investigate but omits the specific interaction the reference ruling depends on.
- triggers-apnap-blood-artists-at-one-life r5 — missing: The list does not identify APNAP ordering (your trigger goes on first and your opponent’s on top), or the state-based action check before priority that makes a player at 0 life lose before the next trigger resolves.

## Probe setup

Turn-1 instruction appended to the production prompt: "Before ruling, describe the tasks this question requires: list each card, effect and rule interaction involved, and the order you will work through them to reach the ruling. Do not give the ruling yet."

Turn-2 follow-up: "Now give your ruling."

Breakdown rubric sent to the judge (it never sees Luna's ruling):

```
You are checking a task list, not a ruling. A Magic: The Gathering rules assistant was asked the question below.
Before answering, it listed the tasks the question requires: the cards, effects and rule interactions involved, and the order it will work through them. It was told not to give the ruling yet.
Grade the task list against the approved reference answer, which is authoritative. Your task is agreement with the reference, not independent adjudication.

Verdicts:
- complete: the list names every card effect and rule interaction the reference ruling depends on, and says nothing false that would change the ruling. Extra harmless steps, wording, length and uncited rule numbers do not matter.
- missing: the list omits at least one interaction the reference ruling depends on (say which), and says nothing false that would change the ruling.
- wrong: the list makes a false rules claim, or puts steps in an order, that would lead to a different ruling than the reference (say what). If it is both missing and wrong, choose wrong.
Judge only what the list commits to. If it hints at or states a conclusion anyway, judge that conclusion against the reference too.
Also report leaksRuling: true when the list states or clearly implies the final ruling, false otherwise.
```

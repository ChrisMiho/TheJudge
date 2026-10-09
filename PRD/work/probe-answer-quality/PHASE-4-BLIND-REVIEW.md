# Morning review — GPT-4.1 vs GPT-6 Luna disagreements (blind)

Each item is a case where the two models got different grades from the judge. You see the
question, the cards' Oracle text, the approved reference, and two answers labelled **X** and **Y** in a random order.
Which model wrote which, and the judge's grades, are withheld.

Grade **each answer** 0 / 1 / 2 on correctness, with the standard we agreed in Phase 1:

- **2** — same outcome as the reference, no real side error
- **1** — right outcome with a real side error a player could act on, or partly right
- **0** — different outcome

A correct detail that goes *beyond* the reference is not an error. Under each of your grade
lines is the agent's suggested grade, checked against the rule and card text. The agent is **not** blind: it has seen
the judge's grades. The models stay hidden. Reply like
`1: X2 Y1, 2: X0 Y2, …`. Section 1 matters most; sections 2 and 3 if you have time.

---

# Must read — the named cases

## 1. Academy Manufactor + Esix, Fractal Bloom

**Question:** How do Academy Manufactor and Esix, Fractal Bloom interact when I create a Treasure?

**The cards** (Oracle text, as the AI saw it):

- **Academy Manufactor** {3} — *Artifact Creature — Assembly-Worker*
  > If you would create a Clue, Food, or Treasure token, instead create one of each.
- **Esix, Fractal Bloom** {4}{G}{U} — *Legendary Creature — Fractal*
  > Flying
  > The first time you would create one or more tokens during each of your turns, you may instead choose a creature other than Esix and create that many tokens that are copies of that creature.

**Reference — short:** You choose the order: Manufactor first gives three tokens that Esix can turn into copies; Esix first gives one copy and Manufactor has nothing left to replace.

**Reference — full:** You choose which replacement effect applies first (rules 616.1 and 616.1e), and then the process repeats with only the effects that still apply (616.1f). If you apply Academy Manufactor first, the Treasure becomes a Clue, a Food and a Treasure; Esix, Fractal Bloom may then replace that event, so you create three tokens that are copies of the creature you choose instead. If you apply Esix first, you create one token that is a copy of the chosen creature instead of the Treasure; Academy Manufactor then has nothing to replace, because that event no longer creates a Clue, Food or Treasure token, so you end up with one token. Esix's replacement effect is optional and applies only the first time you would create tokens during each of your turns. If you do not use Esix, Academy Manufactor alone gives you a Clue, a Food and a Treasure.

### Answer X

> Assuming Esix’s replacement effect is available (it’s your turn, and this is the first token creation of the turn for which you could use it), **you choose which applicable replacement effect to apply first**.
> 
> The rules say: “Any of the applicable replacement or prevention effects may be chosen.” After applying one, the process repeats using effects that are still applicable.
> 
> - **Apply Esix first:** You may replace creating the Treasure with creating one token that’s a copy of a creature other than Esix. Academy Manufactor usually won’t apply to that result, unless the chosen creature’s copy has the Clue, Food, or Treasure type.
> - **Apply Academy Manufactor first:** The Treasure creation becomes creating one Clue, one Food, and one Treasure. Esix can then replace that token creation with **three copies** of the chosen creature, if you choose to use Esix.
> 
> If Esix isn’t available, or you don’t use it, Manufactor gives you one of each token. Esix’s published ruling says its effect applies before effects that modify how tokens enter the battlefield; that doesn’t remove the replacement-effect choice described above.

### Answer Y

> Let's break down how **Academy Manufactor** and **Esix, Fractal Bloom** interact when you would create a Treasure token.
> 
> ## Key Replacement Effects
> - **Academy Manufactor**: "If you would create a Clue, Food, or Treasure token, instead create one of each."
> - **Esix, Fractal Bloom**: "The first time you would create one or more tokens during each of your turns, you may instead choose a creature other than Esix and create that many tokens that are copies of that creature."
> 
> Per the rules (see below), when multiple replacement effects could apply to a single event, **the affected player's controller chooses the order** to apply them (rule 616.1e).
> 
> ---
> 
> ## Step-by-step Application
> 
> You are about to create a Treasure token:
> 
> **1. Both replacement effects want to modify this.**
> 
> - Academy Manufactor says: Instead, create a Clue, a Food, and a Treasure (so 3 tokens total).
> - Esix says: Instead, choose another creature and create that many tokens that are copies.
> 
> **2. You choose which to apply first.**
> 
> ### If You Apply Esix First:
> - Esix replaces the event: Instead of creating a Treasure, you create one token that's a copy of some other creature (“one or more” = 1, in this case, so one creature token).
> - Applying Esix has "used" your opportunity this turn for Esix (“the first time you would create one or more tokens during each of your turns”).
> - **Academy Manufactor is no longer applicable** because you are not creating a Clue, Food, or Treasure.
> 
> **Result:** You get **one creature token** (a copy of your chosen non-Esix creature), and no clues/food/treasure.
> 
> ### If You Apply Academy Manufactor First:
> - Instead of creating one Treasure, you create **three tokens**: a Clue, a Food, and a Treasure.
> - **Now** Esix tries to replace the “create 3 tokens” event (because it just says "the first time you would create one or more tokens...").
> - You can make Esix apply to all 3 tokens, making 3 creature tokens that are copies of the chosen creature (not 3 clues/food/treasure).
> - **Note**: All 3 tokens will be identical copies, based on your choice.
> 
> **Result:** You get **three creature tokens** (all copies of a non-Esix creature).
> 
> #### **Relevant rule excerpt**:
> > 616.1e Any of the applicable replacement and/or prevention effects may be chosen.
> > 616.1f Once the chosen effect has been applied, this process is repeated... until there are no more left to apply.
> 
> #### **Esix ruling**:
> > 2021-04-16: This effect applies before anything that modifies how those tokens enter the battlefield.
> 
> ---
> 
> ## Summary Table
> 
> | Order applied         | Result (When you would create a Treasure, Esix 1st time this turn) |
> |----------------------|--------------------------------------------------------------------|
> | Esix, then Manufactor| 1 creature token (copy of chosen creature)                         |
> | Manufactor, then Esix| 3 creature tokens (all copies of chosen creature)                  |
> 
> ---
> 
> ## Conclusion
> **The optimal interaction is to apply Academy Manufactor first, then Esix**:  
> – You get THREE creature tokens (all copies of a chosen non-Esix creature).
> 
> **You get to choose the order in which to apply these effects, producing the outcome you prefer.** If you just want a single token, use Esix first. If you want three, use Academy Manufactor first, then replace all three tokens with Esix.
> 
> If you want more detail or have a specific use case (say, Doubling Season in play), let me know!

**Your grades:** X: 2  Y: 2

**Agent's suggested grades:** X 2 · Y 2 — both get both orders right. X's "unless the copy is a Clue, Food or Treasure" is a correct extra: copy an artifact creature Food like Gingerbrute and Manufactor applies again (rule 616.1f re-checks). Y never says Esix is optional, borderline but no false statement.

## 2. Academy Manufactor + Esix, Fractal Bloom

**Question:** How do Academy Manufactor and Esix, Fractal Bloom interact when I create a Treasure?

**The cards** (Oracle text, as the AI saw it):

- **Academy Manufactor** {3} — *Artifact Creature — Assembly-Worker*
  > If you would create a Clue, Food, or Treasure token, instead create one of each.
- **Esix, Fractal Bloom** {4}{G}{U} — *Legendary Creature — Fractal*
  > Flying
  > The first time you would create one or more tokens during each of your turns, you may instead choose a creature other than Esix and create that many tokens that are copies of that creature.

**Reference — short:** You choose the order: Manufactor first gives three tokens that Esix can turn into copies; Esix first gives one copy and Manufactor has nothing left to replace.

**Reference — full:** You choose which replacement effect applies first (rules 616.1 and 616.1e), and then the process repeats with only the effects that still apply (616.1f). If you apply Academy Manufactor first, the Treasure becomes a Clue, a Food and a Treasure; Esix, Fractal Bloom may then replace that event, so you create three tokens that are copies of the creature you choose instead. If you apply Esix first, you create one token that is a copy of the chosen creature instead of the Treasure; Academy Manufactor then has nothing to replace, because that event no longer creates a Clue, Food or Treasure token, so you end up with one token. Esix's replacement effect is optional and applies only the first time you would create tokens during each of your turns. If you do not use Esix, Academy Manufactor alone gives you a Clue, a Food and a Treasure.

### Answer X

> Assuming you control both and this is the first time you would create tokens during your turn, both effects can apply to the Treasure creation. These are replacement effects, not triggered abilities, so they don’t go on the stack. The affected player chooses which applicable replacement effect to apply first: “Any of the applicable replacement and/or prevention effects may be chosen” (rule 616.1e).
> 
> - **Apply Esix first:** You may choose a creature other than Esix. The Treasure creation becomes a creation of one token that’s a copy of that creature. Academy Manufactor usually won’t apply to that new event.
> - **Apply Academy Manufactor first:** The Treasure creation becomes a creation of one Clue, one Food, and one Treasure. Esix can then replace that creation with **three** tokens that are copies of your chosen creature.
> 
> If you don’t use Esix for this first eligible token creation, its ruling says you don’t get another chance to use it until your next turn. This assumes the copied creature’s tokens aren’t themselves Clue, Food, or Treasure tokens; that could affect Manufactor’s application.

### Answer Y

> Let's break down the interaction between **Academy Manufactor** and **Esix, Fractal Bloom** when you would create a Treasure token.
> 
> ### The Relevant Abilities
> 
> **Academy Manufactor:**  
> > If you would create a Clue, Food, or Treasure token, instead create one of each.
> 
> **Esix, Fractal Bloom:**  
> > The first time you would create one or more tokens each of your turns, you may instead choose a creature other than Esix and create that many tokens that are copies of that creature.
> 
> ### Step-by-Step Stack/Replacement Reasoning
> 
> #### 1. **You would create a Treasure token.**
> For example: a spell instructs you to "create a Treasure token."
> 
> #### 2. **Two Replacement Effects Apply:**
> - Academy Manufactor's replacement effect ("If you would create...instead create one of each...")  
> - Esix's replacement effect ("The first time you would create one or more tokens each of your turns, you may instead...create copies of a creature...")
> 
> Both effects are trying to replace the event "create a Treasure token."  
> 
> **Per rule 616.1 ("If two or more replacement and/or prevention effects are attempting to modify the way an event affects an object or player, the affected object’s controller ... chooses one to apply, following the steps listed below."),** you choose the order to apply them.
> 
> #### 3. **Choosing which effect applies first:**
> - **If you apply Esix first:**
>     - Instead of creating a Treasure, you may choose a nontoken creature (not Esix) and create one token that's a copy of that creature ("create one token that is a copy").
>     - Academy Manufactor cannot apply, as you are now creating a token that is *not* a Clue, Food, or Treasure. Manufactor only applies when you'd create a Clue, Food, or Treasure.
>     - **Result: You get one copy-token of some creature, not a Treasure, Clue, or Food.**
> - **If you apply Academy Manufactor first:**
>     - "If you would create a Treasure, instead create a Clue, Food, and Treasure token." You replace the single creation event with three separate creation events: make a Clue, a Food, and a Treasure.
>     - Now, for each token you would create (Clue, Food, Treasure), Esix *could* apply; however, its replacement applies to the entire "event" only the first time you would create one or more tokens ("the first time you would create one or more tokens during each of your turns").
>     - According to the Official Ruling on Esix:   
>       > This effect applies before anything that modifies how those tokens enter the battlefield.
>       > If you choose not to apply the replacement effect, you will not get the choice to apply it again until your next turn.
>     - So *all three tokens* are created simultaneously as part of a single event. **Esix can replace this whole event.**
>     - You may instead *choose a nontoken creature other than Esix* and *create three tokens that are copies* of that creature.
>     - **Result: You get three creature copies, not a Clue, Food, or Treasure.**
> 
> #### 4. **Summary Table**
> 
> | Replacement order           | Result                                        |
> |----------------------------|-----------------------------------------------|
> | Esix first                 | 1 non-Esix creature token copy                |
> | Manufactor first (then Esix)| 3 non-Esix creature token copies             |
> 
> #### 5. **What's the best play?**
> - Applying Manufactor first and then Esix maximizes token output, as you can get up to 3 creature token copies for each Treasure you "would" create, but you don't get the artifact tokens (Clue, Food, Treasure).  
> - If you apply Esix first, you get only one creature token copy and no artifact tokens.
> 
> #### 6. **Rules & Ruling Supporting this:**
> - Rule 616.1 (“If two or more replacement...effects...the affected object’s controller...chooses one to apply...this process is repeated...until there are no more left to apply.”)
> - Esix ruling: "This effect applies before anything that modifies how those tokens enter the battlefield." (i.e., before things like Parallel Lives, but you as opposer to Manufactor get a choice of order).
> - "If you would create a Clue, Food, or Treasure token, instead create one of each." (Manufactor's Oracle Text)
> 
> ---
> 
> ## **Final Answer**
> 
> **When both Academy Manufactor and Esix, Fractal Bloom are on the battlefield and you would create a Treasure token:**
> 
> - You may choose to apply Esix's replacement effect or Manufactor's.
> - If you apply Esix first, you get one creature token copy and NO artifact tokens.
> - If you apply Manufactor first, you get three tokens (Clue, Food, Treasure); then, Esix lets you replace that creation (the three tokens as a single event) with three creature token copies of your choice (other than Esix), and you get NO artifact tokens.
> - You can never get actual Clues, Foods, or Treasures **and** the creature token copies on the same trigger—you must pick a replacement path.
> 
> **Typical best play:**  
> Apply Manufactor first, then Esix, to get three creature token copies per Treasure you would create.

**Your grades:** X: 2  Y: 1

**Agent's suggested grades:** X 2 · Y 1 — Y says Esix makes you "choose a **nontoken** creature"; the card says "a creature other than Esix", so tokens are allowed. It also calls the three tokens "three separate creation events", then "a single event".

## 3. Necropotence + Borne Upon a Wind + Silence

**Question:** I control Necropotence and have more than seven cards in hand at my cleanup step. An opponent cast Silence during that turn's main phase. Can I cast Borne Upon a Wind in the cleanup step, after discarding to hand size?

**The cards** (Oracle text, as the AI saw it):

- **Necropotence** {B}{B}{B} — *Enchantment*
  > Skip your draw step.
  > Whenever you discard a card, exile that card from your graveyard.
  > Pay 1 life: Exile the top card of your library face down. Put that card into your hand at the beginning of your next end step.
- **Borne Upon a Wind** {1}{U} — *Instant*
  > You may cast spells this turn as though they had flash.
  > Draw a card.
- **Silence** {W} — *Instant*
  > Your opponents can't cast spells this turn.

**Reference — short:** Yes: Silence's this-turn effect has ended, and Necropotence's discard trigger gives you priority in the cleanup step.

**Reference — full:** Yes, you can cast it. In the cleanup step you first discard down to your maximum hand size (rule 514.1). Right after that, all damage is removed and all "until end of turn" and "this turn" effects end at the same time (514.2), so Silence, which only lasts this turn, no longer stops you from casting spells. Each card you discard triggers Necropotence, so a triggered ability is waiting after those actions, and players receive priority in the cleanup step (514.3a). Borne Upon a Wind is an instant, so you may cast it then. Once the stack is empty and all players pass in succession, another cleanup step begins (514.3a).

### Answer X

> **Yes**, assuming Silence resolved during the main phase. You must discard to your maximum hand size as the cleanup step begins. That discard triggers Necropotence, creating a cleanup-step priority window.
> 
> Before that window, “all ‘until end of turn’ and ‘this turn’ effects end” after the discard. Silence’s effect has therefore ended by the time you can cast Borne Upon a Wind.
> 
> > “If any triggered abilities have triggered since this process began, those abilities are put onto the stack during the cleanup step, then the active player gets priority and players can cast spells and activate abilities.”
> 
> So you can cast Borne during that window. Its flash effect isn’t what lets it bypass Silence; Silence has already ended.

### Answer Y

> Let's walk through the situation step by step, focusing on the interaction between **Necropotence**, **Silence**, and casting **Borne Upon a Wind** during the **cleanup step**.
> 
> ### What happens during the cleanup step?
> 
> **From the game rules:**
> - **514.1.** First, if the active player’s hand contains more cards than their maximum hand size (normally seven), they discard enough cards to reduce their hand size to that number. This turn-based action doesn’t use the stack.
> - **514.3.** Normally, no player receives priority during the cleanup step, so no spells can be cast and no abilities can be activated. However, this rule is subject to the following exception:
> - **724.1f.** If any triggered abilities have triggered since this process began, those abilities are put onto the stack during the cleanup step, then the active player gets priority and players can cast spells and activate abilities.
> 
> ### With **Necropotence** in play
> 
> - When you discard cards during the cleanup step (because you have more than seven), **Necropotence's triggered ability** will trigger ("Whenever you discard a card, exile that card from your graveyard.").
> - Because triggered abilities have triggered during the cleanup step, **rule 724.1f** applies: those abilities are put on the stack, *then* the active player gets priority.
> 
> **This means:**  
> You will get a window of priority during cleanup—right after the Necropotence triggers go on the stack.
> 
> ### Can you cast spells during this window?
> 
> Normally, you can cast instants or activate abilities when you get priority.  
> **Borne Upon a Wind** is an instant, so if you can cast spells, you could cast it at this time.
> 
> ### Does **Silence** stop you?
> 
> **Silence**—"Your opponents can't cast spells this turn."  
> - The comprehensive rules and Oracle ruling for Silence clarify: "Silence won't affect spells that your opponents cast before you cast Silence, including any spells that are still on the stack. Silence also won't stop your opponents from casting spells after you cast Silence but before Silence resolves."
> - The text "this turn" means the effect lasts for the entire turn, no matter when you get priority.
> 
> **Conclusion about Silence:**  
> If **Silence** resolved on your turn, and you are the opponent, you cannot cast spells for the rest of that turn—including during your cleanup step, no matter how you get priority. Silence doesn't care which phase or step you're in, as long as it's still "this turn."
> 
> ### Short answer
> 
> **No, you cannot cast Borne Upon a Wind during your cleanup step if Silence has resolved this turn.**  
> Even though you get priority (due to Necropotence’s triggers from discarding during cleanup), **Silence’s effect** (“Your opponents can't cast spells this turn”) prohibits you from casting any spells, including Borne Upon a Wind, for the rest of the turn.
> 
> #### Relevant rule excerpt
> > Silence's Oracle text: "Your opponents can't cast spells this turn."
> > 
> > Official ruling: "Silence...won’t stop your opponents from casting spells after you cast Silence but before Silence resolves. The effect lasts for the entire turn."  
> > 
> > Rule 724.1f (paraphrased): If triggered abilities have triggered during the cleanup step, you get priority during cleanup, but Silence's restriction still applies.
> 
> **Even with a window to act in cleanup, Silence prevents you from casting spells that turn.**

**Your grades:** X: 2  Y: 0

**Agent's suggested grades:** X 2 · Y 0 — agree with you. Y says Silence still applies; the reference (rule 514.2) says "this turn" effects end before cleanup priority.

---

# The other disagreements — production prompt

## 4. Vengeful Archon + Scroll Thief

**Question:** If several attacking creatures would deal combat damage to me and Vengeful Archon prevents X of it, do I choose which creatures' damage to prevent?

**The cards** (Oracle text, as the AI saw it):

- **Vengeful Archon** {4}{W}{W}{W} — *Creature — Archon*
  > Flying
  > {X}: Prevent the next X damage that would be dealt to you this turn. If damage is prevented this way, this creature deals that much damage to target player or planeswalker.
- **Scroll Thief** {2}{U} — *Creature — Merfolk Rogue*
  > Whenever this creature deals combat damage to a player, draw a card.

**Reference — short:** Yes: you choose which of that damage to prevent, deciding at the point the creatures would deal damage.

**Reference — full:** If you would be dealt combat damage by multiple attacking creatures, you choose which of that damage to prevent. For example, if X is 3 and you’d be dealt combat damage by a 1/3 Scroll Thief and a 3/5 Siege Mastodon, you might choose to prevent 1 damage from the Scroll Thief and 2 damage from the Siege Mastodon. You don’t decide until the point at which the creatures would deal their damage.

### Answer X

> Yes. When the combat damage would be dealt, you choose how to apply Vengeful Archon’s available prevention among the damage from the attacking creatures, up to X total. Any damage beyond that amount is dealt normally.
> 
> The provided ruling says: “If you would be dealt combat damage by multiple attacking creatures, you choose which of that damage to prevent.” For example, with X = 3, you could prevent 1 damage from one attacker and 2 from another.

### Answer Y

> Yes, **you choose which creatures' damage to prevent** when multiple attacking creatures would deal combat damage to you and Vengeful Archon's ability creates a prevention effect.
> 
> **Key Oracle Ruling (Vengeful Archon):**
> > *2010-08-15: If you would be dealt combat damage by multiple attacking creatures, you choose which of that damage to prevent. For example, if X is 3 and you’d be dealt combat damage by a 1/3 Scroll Thief and a 3/5 Siege Mastodon, you might choose to prevent 1 damage from the Scroll Thief and 2 damage from the Siege Mastodon. You don’t decide until the point at which the creatures would deal their damage.*
> 
> **Explanation:**  
> - When combat damage would be dealt to you by multiple sources (creatures), and a single effect like Vengeful Archon's activated ability is set to prevent the next X damage to you this turn, you wait until the actual assignment of combat damage.
> - At that moment, you **choose how to apply the X points of prevention among those sources**—in any combination you want, up to the total damage being dealt and the remaining prevention "shield" provided by Vengeful Archon.
> 
> **Summary:**  
> You have flexibility at the moment damage would be dealt to choose the order and source(s) to which prevention is applied, not beforehand or as the ability resolves. This lets you optimize for gameplay scenarios (like preventing a Scroll Thief’s damage to deny the card draw trigger).

**Your grades:** X: 2  Y: 2

**Agent's suggested grades:** X 2 · Y 2 — agree. (The judge gave one answer a 1 for saying you choose at damage "assignment" rather than when damage is dealt. Same step, and its own summary gets it right. I don't count it.)

## 5. Null Profusion + Isochron Scepter

**Question:** I control Null Profusion and activate Isochron Scepter, copying the exiled instant card and casting the copy without paying its mana cost. Does Null Profusion's triggered ability trigger when I cast a copy of a card this way?

**The cards** (Oracle text, as the AI saw it):

- **Null Profusion** {4}{B}{B} — *Enchantment*
  > Skip your draw step.
  > Whenever you play a card, draw a card.
  > Your maximum hand size is two.
- **Isochron Scepter** {2} — *Artifact*
  > Imprint — When this artifact enters, you may exile an instant card with mana value 2 or less from your hand.
  > {2}, {T}: You may copy the exiled card. If you do, you may cast the copy without paying its mana cost.

**Reference — short:** No: it triggers when you play a land card or cast a nonland card as a spell, not when you play a copy of a card.

**Reference — full:** The triggered ability will trigger when you play a land card or cast a nonland card as a spell. It won't trigger when you play a copy of a card, such as with Isochron Scepter.

### Answer X

> **No, Null Profusion's triggered ability does not trigger when you cast a copy of a card with Isochron Scepter.**
> 
> **Reasoning, using provided context:**
> 
> - **Null Profusion:**  
>   *Oracle text*: "Whenever you play a card, draw a card."
> 
> - **Official ruling from WotC:**  
>   > 2007-02-01: The triggered ability will trigger when you play a land card or cast a nonland card as a spell. It won't trigger when you play a copy of a card, such as with Isochron Scepter.
> 
> **Explanation:**  
> Casting a copy of a card from Isochron Scepter is not "playing a card," because a copy of a card is not itself a card; it is a copy of a spell put directly onto the stack by an effect (Isochron Scepter's ability), not a physical card being played from your hand or another zone. Null Profusion only cares about actually playing (land) or casting (spell) a *card*.
> 
> **Stack/Rules Reference:**  
> - Stack[0]: (pending spell, the copy)  
> - You put a copy of the exiled instant onto the stack (see rule 707.10).
> - You cast the copy **as part of the resolution of the Scepter's ability**, but the copy is not a card.
> 
> Thus, **Null Profusion does not trigger** when you cast a spell that is only a copy.
> 
> ---  
> **Summary:** The ability only triggers when you play a card; casting a copy from Isochron Scepter does not count, and you do not draw from Null Profusion in this case.

### Answer Y

> No. Null Profusion’s ability does **not** trigger when you cast the copy with Isochron Scepter. Its published ruling specifically says: “It won't trigger when you play a copy of a card, such as with Isochron Scepter.”
> 
> The copy is cast while Scepter’s ability is resolving, but it isn’t a card being played for Null Profusion’s trigger.

**Your grades:** X: 1  Y: 2

**Agent's suggested grades:** X 1 · Y 2 — X says the Scepter copy is "put directly onto the stack" and isn't cast. Rule 707.12: you **cast** a copy of the card. A player could wrongly conclude "whenever you cast" triggers (prowess, storm) don't see it.

## 6. Knight of the Mists

**Question:** Knight of the Mists says that when it enters I may pay {U}, and if I don't, I destroy target Knight. Can the Knight I destroy belong to an opponent?

**The cards** (Oracle text, as the AI saw it):

- **Knight of the Mists** {2}{U} — *Creature — Human Knight*
  > Flanking (Whenever a creature without flanking blocks this creature, the blocking creature gets -1/-1 until end of turn.)
  > When this creature enters, you may pay {U}. If you don't, destroy target Knight and it can't be regenerated.

**Reference — short:** Yes: it can destroy an opponent's Knight.

**Reference — full:** Can destroy an opponent’s knight.

### Answer X

> Yes. The ability says “destroy target Knight” and doesn’t restrict whose Knight it can target. The published ruling confirms it can destroy an opponent’s Knight.

### Answer Y

> **Yes, you may destroy a Knight controlled by an opponent with Knight of the Mists’s triggered ability.**
> 
> ### Reasoning:
> 
> **From the Oracle text:**  
> > When this creature enters, you may pay {U}. If you don't, destroy target Knight and it can't be regenerated.
> 
> - This triggered ability does not specify that you must choose a Knight you control—it simply says "target Knight".
> - Unless a card specifically restricts what you may target, you can choose any legal permanent fitting that description on the battlefield, which includes Knights controlled by opponents.
> 
> **Supported by Official Rulings:**  
> > - 2004-10-04: Can destroy an opponent’s knight.
> 
> ### Targeting Details (from the CARD and GAME RULES reference):
> 
> - When the triggered ability resolves, if you do not pay {U}, you must target a Knight on the battlefield.  
> - If there are multiple Knights, you may choose any eligible target, ignoring who controls it.
> - If there are no other Knights on the battlefield, you can only legally choose Knight of the Mists itself, and must do so if you do not pay the cost.  
> - The ability requires a target Knight to resolve if you decline to pay the {U}.
> 
> **Summary:**  
> You do not have to target a Knight you control—your opponent's Knights are valid targets for this effect. This is an explicit ruling from WotC, and consistent with how targeting works in Magic generally unless otherwise restricted by card text.

**Your grades:** X: 2  Y: 1

**Agent's suggested grades:** X 2 · Y 1 — Y says you choose the target Knight "when the triggered ability resolves". Targets are chosen when the trigger goes on the stack (rule 603.3d → 601.2c), which is when an opponent can respond.

## 7. Arcanum Wings

**Question:** Arcanum Wings has Aura swap, which exchanges it with an Aura card in my hand. Does the exchange happen all at once when the ability resolves?

**The cards** (Oracle text, as the AI saw it):

- **Arcanum Wings** {1}{U} — *Enchantment — Aura*
  > Enchant creature
  > Enchanted creature has flying.
  > Aura swap {2}{U} ({2}{U}: Exchange this Aura with an Aura card in your hand.)

**Reference — short:** Yes: the exchange is simultaneous and happens on resolution.

**Reference — full:** The exchange is simultaneous, and happens on resolution.

### Answer X

> **Summary:**  
> Yes, the exchange with **Aura swap** on Arcanum Wings happens simultaneously and only if both "halves" of the exchange can happen. Nothing happens if either half cannot be completed.
> 
> **Explanation:**
> 
> - The relevant rule from the excerpts states:
>   - **702.65a.** Aura swap is an activated ability of some Aura cards. “Aura swap [cost]” means “[Cost]: You may exchange this permanent with an Aura card in your hand.”
>   - **702.65b.** If either half of the exchange can’t be completed, the ability has no effect.
> 
> - **Official ruling:**  
>   - “The exchange is simultaneous, and happens on resolution.”
>   - “If on resolution, half the exchange can’t be completed (such as if the only Aura in your hand can’t enchant the permanent), nothing happens.”
> 
> **How this works on the stack:**  
> - You activate Aura swap targeting Arcanum Wings, paying {2}{U}.
> - The ability goes on the stack.
> - When it resolves, you may exchange Arcanum Wings (on the battlefield) with an Aura in your hand.
> - If you can, both cards move at the same time: Arcanum Wings to your hand, the chosen Aura from your hand attached to the same creature.
> - If either half is impossible (the Aura in hand can’t enchant the creature, or some zone-change restriction), nothing happens.
> 
> **Game Rules excerpt relevance:**  
> - This matches the stack resolution process described by "Each time an object is put on the stack, it’s put on top of all objects already there." When the Aura swap ability resolves, the exchange occurs all at once: “The exchange is simultaneous, and happens on resolution.” (official ruling)
> 
> **Conclusion:**  
> **The exchange happens all at once, simultaneously, when Aura swap resolves.** If you can't legally complete both halves, the ability does nothing and no cards move.

### Answer Y

> Yes. Arcanum Wings’ Aura swap exchange happens simultaneously as the ability resolves.
> 
> The card’s ruling says: “The exchange is simultaneous, and happens on resolution.” If the full exchange can’t be completed, none of it happens: “If either half of the exchange can’t be completed, the ability has no effect.”

**Your grades:** X: 1  Y: 2

**Agent's suggested grades:** X 1 · Y 2 — X says you activate Aura swap "targeting Arcanum Wings". Aura swap doesn't target (rule 702.65a: "exchange this permanent with an Aura card in your hand"). Minor but false.

## 8. Stream of Thought

**Question:** If I cast Stream of Thought with replicate and it is countered, do I still get the copies for each time I paid the replicate cost?

**The cards** (Oracle text, as the AI saw it):

- **Stream of Thought** {U} — *Sorcery*
  > Target player mills four cards. You shuffle up to four cards from your graveyard into your library.
  > Replicate {2}{U}{U} (When you cast this spell, copy it for each time you paid its replicate cost. You may choose new targets for the copies.)

**Reference — short:** Yes: you copy the spell for each time you paid the replicate cost, even if it is countered.

**Reference — full:** You’ll copy Stream of Thought for each time you paid its replicate cost, even if it’s countered.

### Answer X

> Yes. If you paid Stream of Thought’s replicate cost, its replicate ability triggers when you cast it. If the original spell is countered, that doesn’t stop the trigger from creating the copies when it resolves.
> 
> The published ruling says: “You’ll copy Stream of Thought for each time you paid its replicate cost, even if it’s countered.”
> 
> The copies are created on the stack; they aren’t cast. Assuming the replicate trigger itself isn’t countered, you get one copy for each time you paid the replicate cost.

### Answer Y

> **Short answer:** Yes, you will still get the copies from replicate, even if the original Stream of Thought is countered.
> 
> ---
> 
> ### Detailed Reasoning
> 
> According to the official ruling for **Stream of Thought** (2019-06-14):
> 
> > — You’ll copy Stream of Thought for each time you paid its replicate cost, even if it’s countered.
> 
> **Explanation:**
> - When you cast Stream of Thought, you can pay its replicate cost any number of times as an additional cost.
> - As **702.56a** states:  
>   “When you cast this spell, if a replicate cost was paid for it, copy it for each time its replicate cost was paid. If the spell has any targets, you may choose new targets for any of the copies.”
> - The triggered ability from replicate happens **when you cast the spell** and puts the copies on the stack as soon as a player would get priority, before anyone could respond and counter the original spell.
> - The copies are **not cast**—they just go directly on the stack.
> 
> If someone counters the *original* Stream of Thought after it is on the stack, the copies created by replicate are already there and will still resolve as usual (assuming they are not themselves countered).
> 
> **Relevant rule/excerpt:**
> - Official ruling (2019-06-14):  
>   “You’ll copy Stream of Thought for each time you paid its replicate cost, even if it’s countered.”
> 
> **Summary:**  
> Countering the original does not stop you from getting (and resolving) your replicate copies. You pay replicate at casting, the triggered ability makes the copies, and then all those copies are on the stack independent of the fate of the original spell.

**Your grades:** X: 2  Y: 1

**Agent's suggested grades:** X 2 · Y 1 — Y says the copies are already on the stack "before anyone could respond and counter the original". The copies come when the replicate trigger **resolves**; an opponent can counter the original while that trigger waits. Same outcome, wrong timing.

## 9. Deadeye Navigator

**Question:** If I use the ability Deadeye Navigator grants to exile a paired creature, can the pair be reunited when the creature returns?

**The cards** (Oracle text, as the AI saw it):

- **Deadeye Navigator** {4}{U}{U} — *Creature — Spirit*
  > Soulbond (You may pair this creature with another unpaired creature when either enters. They remain paired for as long as you control both of them.)
  > As long as Deadeye Navigator is paired with another creature, each of those creatures has "{1}{U}: Exile this creature, then return it to the battlefield under your control."

**Reference — short:** Yes: the pair is broken and then the Navigator's soulbond triggers when the card returns, so they can be paired again.

**Reference — full:** If you activate the ability granted by Deadeye Navigator, the creature will be exiled, the pair will immediately be broken, and then the card will be returned to the battlefield. Deadeye Navigator’s soulbond ability triggers when that card enters the battlefield and the pair can then be reunited.

### Answer X

> Yes. Exiling the paired creature immediately breaks the pair. When that creature returns, Deadeye Navigator’s soulbond ability triggers; when the trigger resolves, you may pair them again if both are still creatures on the battlefield and under your control. If either isn’t, they won’t become paired.
> 
> This matches Deadeye Navigator’s published ruling: the pair breaks on exile, and its soulbond ability can trigger when the creature returns so they can be reunited.

### Answer Y

> Yes, the pair can be reunited when the creature returns, as long as both creatures are still controlled by the same player, unpaired, and still creatures on the battlefield when the creature re-enters.
> 
> **Breakdown of the Interaction:**
> 
> - **Step 1:** Both Deadeye Navigator and another creature are paired via soulbond.
> - **Step 2:** You activate the ability Deadeye grants (e.g., "{1}{U}: Exile this creature, then return it to the battlefield under your control") targeting either Deadeye Navigator or the other paired creature.
> - **Step 3:** That creature is exiled and immediately returned to the battlefield.
>     - When it is exiled, the pair is broken:  
>       From Official Ruling: "If you activate the ability ... the creature will be exiled, the pair will immediately be broken, and then the card will be returned to the battlefield."
> - **Step 4:** When the exiled creature returns to the battlefield, the soulbond ability triggers again for both creatures (assuming both are still unpaired creatures under your control).
>     - This is from **the rules**:  
>       *“You may pair this creature with another unpaired creature when either enters. They remain paired for as long as you control both of them.”*
> - **Step 5:** You may pair them again when the returning creature enters the battlefield.
> 
> **Rule reference:**  
> > 702.95c When the soulbond ability resolves, if either object that would be paired is no longer a creature, no longer on the battlefield, or no longer under the control of the player who controls the soulbond ability, neither object becomes paired.
> 
> **In summary:**  
> When Deadeye Navigator or its paired creature is blinked with the granted ability, the pair breaks. But when the creature comes back (and the other is still an eligible, unpaired creature you control), soulbond will trigger and allow them to pair again. This allows for repeated blinking and re-pairing cycles, given no other disruptive effects.

**Your grades:** X: 2  Y: 1

**Agent's suggested grades:** X 2 · Y 1 — Y says the granted ability is activated "targeting" a creature (it says "Exile **this** creature", no target) and that soulbond "triggers again for both creatures" (only the Navigator's soulbond needs to trigger, rule 702.95a).

---

# The other disagreements — every deciding rule added (arm C)

## 10. Celestial Reunion

**Question:** Celestial Reunion lets me behold two creatures of a chosen type as an additional cost. Can I behold kindred cards or kindred permanents to pay it?

**The cards** (Oracle text, as the AI saw it):

- **Celestial Reunion** {X}{G} — *Sorcery*
  > As an additional cost to cast this spell, you may choose a creature type and behold two creatures of that type.
  > Search your library for a creature card with mana value X or less, reveal it, put it into your hand, then shuffle. If this spell's additional cost was paid and the revealed card is the chosen type, put that card onto the battlefield instead of putting it into your hand.

**Reference — short:** No: this spell's behold is limited to creatures, not kindred cards or permanents.

**Reference — full:** Notably, Celestial Reunion's behold instruction is limited to "creatures." It doesn't allow you to behold kindred cards or kindred permanents, which are permitted for most other behold instructions.

### Answer X

> Being **kindred** by itself isn’t enough: Celestial Reunion requires you to behold **two creatures** of the chosen type. You may reveal creature cards from your hand or choose creatures you control on the battlefield.
> 
> The ruling says: “Celestial Reunion's behold instruction is limited to ‘creatures.’ It doesn't allow you to behold kindred cards or kindred permanents, which are permitted for most other behold instructions.”
> 
> So a kindred card or permanent that **isn’t also a creature** won’t count. A card with both the kindred and creature card types, or a kindred permanent that is also a creature, can count if it has the chosen creature type.

### Answer Y

> **Short answer:**  
> No, you cannot behold kindred cards or kindred permanents to pay Celestial Reunion's additional cost.
> 
> **Reasoning, with rule and ruling support:**  
> Celestial Reunion's oracle text:
> > "As an additional cost to cast this spell, you may choose a creature type and behold two creatures of that type."
> 
> The **official WotC ruling** says:
> > "Notably, Celestial Reunion's behold instruction is limited to 'creatures.' It doesn't allow you to behold kindred cards or kindred permanents, which are permitted for most other behold instructions."
> 
> **Explanation:**  
> - Celestial Reunion specifically says "behold two creatures of that type."
> - "Kindred" is a card type that appears on some cards, but kindred cards are not creature cards unless they also have “Creature” as a card type.
> - The official ruling clarifies that for Celestial Reunion, you must behold two actual creatures (either creature cards in hand, or creatures you control on the battlefield), not kindred cards or permanents, even if those kindred cards or permanents share the species or "tribe" you picked.
> - This is a specific restriction for Celestial Reunion. Other “behold” effects might allow kindred cards/permanents, but Celestial Reunion does **not**.
> 
> **Summary:**  
> You cannot use kindred cards or kindred permanents to pay Celestial Reunion's behold cost. Only actual creature cards or creatures on the battlefield of the chosen type count.

**Your grades:** X: 2  Y: 2

**Agent's suggested grades:** X 2 · Y 2 — both say no to kindred-only cards. X's extra (a card that's both kindred **and** a creature counts) is correct: it's a creature. The judge marked that extra down; I don't.

## 11. Chimeric Staff + Clone

**Question:** After Chimeric Staff has become a 5/5 Construct artifact creature, a Clone enters as a copy of it. Is the Clone a 5/5 Construct artifact creature?

**The cards** (Oracle text, as the AI saw it):

- **Chimeric Staff** {4} — *Artifact*
  > {X}: This artifact becomes an X/X Construct artifact creature until end of turn.
- **Clone** {3}{U} — *Creature — Shapeshifter*
  > You may have this creature enter as a copy of any creature on the battlefield.

**Reference — short:** No: the Clone is an artifact, not a 5/5 Construct artifact creature, though it has the Staff's ability.

**Reference — full:** Chimeric Staff is an artifact that reads, “{X}: This artifact becomes an X/X Construct artifact creature until end of turn.” Clone is a creature that reads, “You may have this creature enter as a copy of any creature on the battlefield.” After a Staff has become a 5/5 Construct artifact creature, a Clone enters the battlefield as a copy of it. The Clone is an artifact, not a 5/5 Construct artifact creature. (The copy has the Staff’s ability, however, and will become a creature if that ability is activated.)

### Answer X

> No. Clone copies Chimeric Staff’s copiable characteristics, not the temporary effect making it a 5/5 creature. It enters as an artifact with the Staff’s ability, but it isn’t a creature and doesn’t have power or toughness unless its ability is activated.
> 
> The provided rule excerpt gives this exact example: “After a Staff has become a 5/5 Construct artifact creature, a Clone enters the battlefield as a copy of it. The Clone is an artifact, not a 5/5 Construct artifact creature.”

### Answer Y

> **Short answer:** No, Clone is **not** a 5/5 Construct artifact creature. Clone is an artifact creature Shapeshifter with the Chimeric Staff’s activated ability, but it is a 0/0, not a 5/5, and it is not a Construct.
> 
> ---
> 
> ### **Explanation using provided rules and references**
> 
> #### 1. What does Clone copy?
> 
> Clone’s Oracle text:  
> > "You may have this creature enter as a copy of any creature on the battlefield."
> 
> **Relevant Ruling:**  
> > Clone copies exactly what was printed on the original creature and nothing else (unless that creature is copying something else or is a token; see below). It doesn't copy whether that creature is tapped or untapped, whether it has any counters on it or Auras and Equipment attached to it, or any non-copy effects that have changed its power, toughness, types, color, or so on.
> 
> #### 2. What is Chimeric Staff at the time Clone checks it?
> 
> - Chimeric Staff has been turned into a 5/5 Construct artifact creature until end of turn via its ability.
> - This is a **temporary effect** created by an activated ability—not a copy effect.
> 
> #### 3. Which characteristics get copied?
> 
> From **GAME RULES 707.2**:
> > When copying an object, the copy acquires the copiable values of the original object's characteristics...The copiable values are the values derived from the text printed on the object...as modified by other copy effects...
> 
> From the official ruling:
> > It doesn't copy...any non-copy effects that have changed its power, toughness, types, color, or so on.
> 
> **Therefore:**  
> The "becomes a 5/5 Construct artifact creature until end of turn" is a **non-copy continuous effect**. The Clone copies **only the copiable values**—the text printed on Chimeric Staff's card as it is currently a creature, *not* any temporary type, type-line, or P/T modifications from the activated ability.
> 
> #### 4. Example in the rules
> 
> From **GAME RULES 707.2 Example**:
> > Chimeric Staff is an artifact that reads, “{X}: This artifact becomes an X/X Construct artifact creature until end of turn.” Clone is a creature that reads, “You may have this creature enter as a copy of any creature on the battlefield.” After a Staff has become a 5/5 Construct artifact creature, a Clone enters the battlefield as a copy of it. The Clone is an artifact, not a 5/5 Construct artifact creature. (The copy has the Staff’s ability, however, and will become a creature if that ability is activated.)
> 
> This exactly matches your scenario.
> 
> ---
> 
> ### **Result**
> 
> - **Clone enters as an artifact creature (assuming it copies a Staff that is currently a creature).**
> - **It is not a Construct, nor is it a 5/5.**
> - **It is a 0/0 artifact creature Shapeshifter with the ability “{X}: This artifact becomes an X/X Construct artifact creature until end of turn.”**
>     - Since it is a 0/0, unless something else changes its P/T or puts counters on it, it will immediately be put into the graveyard as a state-based action.
> 
> **Summary:**  
> Clone does **not** copy the temporary 5/5 Construct effect, only the base characteristics and ability of Chimeric Staff. This is directly supported by quoted rule examples.

**Your grades:** X: 2  Y: 0

**Agent's suggested grades:** X 2 · Y 0 — Y says the Clone is a "0/0 artifact creature" that dies to state-based actions. The reference (rule 707.2's own example) says it's an artifact, **not** a creature, and it survives. A player would be told the opposite outcome.

## 12. Rukarumel, Biologist + Bramblewood Paragon

**Question:** Rukarumel makes creatures enter as the chosen creature type. If the type is Warrior and I control Bramblewood Paragon, does a Runeclaw Bear enter with an additional +1/+1 counter?

**The cards** (Oracle text, as the AI saw it):

- **Rukarumel, Biologist** {W}{U}{B}{R}{G} — *Legendary Creature — Human Wizard*
  > As Rukarumel enters, choose a creature type.
  > Slivers you control and nontoken creatures you control are the chosen type in addition to their other creature types. The same is true for creature spells you control and creature cards you own that aren't on the battlefield.
  > {3}, {T}: Create a 1/1 colorless Sliver creature token.
- **Bramblewood Paragon** {1}{G} — *Creature — Elf Warrior*
  > Each other Warrior creature you control enters with an additional +1/+1 counter on it.
  > Each creature you control with a +1/+1 counter on it has trample.

**Reference — short:** Yes: effects that modify creatures of a certain type as they enter apply after Rukarumel's effect, so the Bear gets the counter.

**Reference — full:** Replacement effects that modify creatures of a certain type as they enter will apply after you apply this effect. For example, if Warrior is the chosen creature type and you control Bramblewood Paragon, a Runeclaw Bear would enter the battlefield with an additional +1/+1 counter.

### Answer X

> Yes. Assuming Rukarumel and Bramblewood Paragon are already on the battlefield under your control, Runeclaw Bear enters as a Warrior in addition to its other types. Bramblewood Paragon then makes it enter with an additional +1/+1 counter.
> 
> Rukarumel’s ruling specifically confirms this interaction: “if Warrior is the chosen creature type and you control Bramblewood Paragon, a Runeclaw Bear would enter the battlefield with an additional +1/+1 counter.” If Paragon enters at the same time as the Bear, its ability won’t give the Bear a counter.

### Answer Y

> Yes, if you control both **Rukarumel, Biologist** (with "Warrior" chosen) and **Bramblewood Paragon**, a **Runeclaw Bear** you control **enters the battlefield with an additional +1/+1 counter**.
> 
> **Here's why:**
> 
> - **Rukarumel** has a replacement effect: "As Rukarumel enters, choose a creature type. Slivers you control and nontoken creatures you control are the chosen type in addition to their other types. The same is true for creature spells you control and creature cards you own that aren't on the battlefield."  
> - **Bramblewood Paragon** says: "Each other Warrior creature you control enters the battlefield with an additional +1/+1 counter on it."
> 
> #### How these interact:
> 
> - **Runeclaw Bear** is not a Warrior in hand/library/graveyard.  
> - Because of Rukarumel, **as it enters** the battlefield, it **becomes a Warrior** (in addition to Bear, due to the replacement effect).
> - The official ruling for Rukarumel confirms:  
>   > "Replacement effects that modify creatures of a certain type as they enter will apply after you apply this effect. For example, if Warrior is the chosen creature type and you control Bramblewood Paragon, a Runeclaw Bear would enter the battlefield with an additional +1/+1 counter."
> - So, the **order of replacement effects** matters:
>   1. **Rukarumel's** effect makes Runeclaw Bear a Warrior as it enters.
>   2. **Bramblewood Paragon's** effect sees the Bear as a Warrior, and thus makes it enter with an additional +1/+1 counter.
> 
> #### Reference:
> - Bramblewood Paragon’s official ruling:  
>   > "If Warrior is the chosen creature type and you control Bramblewood Paragon, a Runeclaw Bear would enter the battlefield with an additional +1/+1 counter."
> 
> **Summary:**  
> **A Runeclaw Bear you control will enter the battlefield with an additional +1/+1 counter** if you have Rukarumel (with Warrior chosen) and Bramblewood Paragon. The reason is that, as the Bear enters, it becomes a Warrior, triggering the Paragon’s replacement effect.

**Your grades:** X: 2  Y: 1

**Agent's suggested grades:** X 2 · Y 1 — Y says the Bear "is not a Warrior in hand/library/graveyard". Rukarumel's text says the opposite: creature cards you own that aren't on the battlefield **are** the chosen type. It also calls Rukarumel's type change a replacement effect.

# Blind grading packet — Phase 1 (grader check)

Twelve GPT-4.1 answers from the Phase 1 run (production prompt, arm A). The judge's scores are
**not** in this file. For each, read the question, the approved reference answer, then the
AI's answer, and give one correctness grade:

- **2** — reaches the same outcome as the reference answer
- **1** — partly right, or right with a material error or omission
- **0** — reaches a different outcome

Optional: a few words on why, especially for a 1. Reply in chat as `1: 2, 2: 0, …`.
Judge the outcome a player would walk away with, not style or length.

---

## 1. Blitz Automaton

**Question:** If an effect lets me cast artifact spells from my graveyard, can I cast a prototyped Blitz Automaton from my graveyard?

**Reference — short answer:** Yes: the prototype ability functions in any zone the spell could be cast from.

**Reference — full answer:** The prototype ability functions in any zone that the spell could be cast from. For example, if an effect allows you to cast artifact spells from your graveyard, you could cast a prototyped Blitz Automaton from your graveyard.

**The AI's answer:**

> **Yes, you can cast a prototyped Blitz Automaton from your graveyard if an effect allows you to cast artifact spells from your graveyard.**
> 
> **Reasoning:**
> 
> The official ruling for Blitz Automaton states:
> > The prototype ability functions in any zone that the spell could be cast from. For example, if an effect allows you to cast artifact spells from your graveyard, you could cast a prototyped Blitz Automaton from your graveyard.
> 
> This means:
> - If an effect (such as *Muldrotha, the Gravetide*, *Karn, the Great Creator*, or *Emery, Lurker of the Loch*) lets you cast artifact spells from your graveyard, you may cast Blitz Automaton from your graveyard.
> - When you do, you can choose to cast it as a prototyped spell for {2}{R} (for a 3/2 red creature), or for its normal cost {7} (for a 6/4 colorless creature).
> - While on the stack as a prototyped spell, it is red, costs {2}{R}, and is a 3/2 on the battlefield after resolving.
> 
> **Stack/Zone Semantics Reference:**
> - As per the Oracle rules above, "The prototype ability functions in any zone that the spell could be cast from." So the graveyard is a valid zone to use the prototype ability if an effect allows you to cast artifact spells from there.
> 
> **Summary:**  
> **If you are allowed to cast artifact spells from your graveyard, you may cast Blitz Automaton from there using either its prototype cost or its normal cost.**

**Your grade (0/1/2):** ____

---

## 2. Vengeful Archon + Scroll Thief

**Question:** If several attacking creatures would deal combat damage to me and Vengeful Archon prevents X of it, do I choose which creatures' damage to prevent?

**Reference — short answer:** Yes: you choose which of that damage to prevent, deciding at the point the creatures would deal damage.

**Reference — full answer:** If you would be dealt combat damage by multiple attacking creatures, you choose which of that damage to prevent. For example, if X is 3 and you’d be dealt combat damage by a 1/3 Scroll Thief and a 3/5 Siege Mastodon, you might choose to prevent 1 damage from the Scroll Thief and 2 damage from the Siege Mastodon. You don’t decide until the point at which the creatures would deal their damage.

**The AI's answer:**

> **Yes, you choose the specific damage to prevent from among the creatures that would deal you combat damage.**
> 
> Let’s break down why, referencing the rules and Gatherer ruling on Vengeful Archon:
> 
> From the Gatherer official ruling for **Vengeful Archon**:
> > "If you would be dealt combat damage by multiple attacking creatures, you choose which of that damage to prevent. For example, if X is 3 and you’d be dealt combat damage by a 1/3 Scroll Thief and a 3/5 Siege Mastodon, you might choose to prevent 1 damage from the Scroll Thief and 2 damage from the Siege Mastodon. You don’t decide until the point at which the creatures would deal their damage."
> 
> **Key reasoning:**
> - When multiple attacking creatures assign combat damage to you, and you have a Vengeful Archon prevention effect (“Prevent the next X damage that would be dealt to you this turn”), you wait until damage would actually be dealt.
> - At that point, *you*, the “would-be recipient” of damage, "choose[s] which of that damage to prevent” up to X total.
>     - Example: If Scroll Thief (1/3) and Siege Mastodon (3/5) both deal combat damage to you, and X = 3, you could prevent 1 from Scroll Thief and 2 from Siege Mastodon, or 3 from one of them, in any combination adding up to 3.
> 
> **You do not have to assign the prevented damage all to the damage from a single source; you can divide it up among multiple sources**, selecting which damage to stop. Any damage not prevented is dealt to you as normal.
> 
> This is consistent with the rules for prevention effects:
> - _“If multiple effects modify how damage will be dealt, the player who would be dealt damage chooses the order to apply the effects.”_ (Vengeful Archon ruling)
> - As the prevention effect applies at the moment damage would be dealt, you make all of these choices at that time.
> 
> **Summary:**  
> When several creatures attack you and Vengeful Archon prevents X damage to you, *you* decide which creatures’ damage is stopped, using up the X points of prevention in whatever way you choose at the moment damage would be dealt. Any leftover damage is dealt to you normally.

**Your grade (0/1/2):** ____

---

## 3. Thought Eater + Cursed Rack

**Question:** If I am affected by Cursed Rack and then put Thought Eater onto the battlefield, is my maximum hand size one, while the opposite order would make it four?

**Reference — short answer:** Yes: effects are applied in timestamp order, so the permanent that entered last sets the maximum.

**Reference — full answer:** If multiple effects modify your hand size, apply them in timestamp order. For example, if you are affected by Cursed Rack (an artifact that sets a player's maximum hand size to four) and then put Thought Eater onto the battlefield, your maximum hand size would be one. However, if those permanents entered in the opposite order, your maximum hand size would be four.

**The AI's answer:**

> **Yes, you are correct:**
> - **If you are affected by Cursed Rack first, then Thought Eater enters the battlefield, your maximum hand size is one.**
> - **If Thought Eater enters first, and then Cursed Rack affects you, your maximum hand size is four.**
> 
> **Reasoning:**
> This is determined by timestamp order and the type of effect:
> - **Cursed Rack** sets your maximum hand size to four (a "set" effect).
> - **Thought Eater** reduces your maximum hand size by three (a "modifier" effect).
> 
> When multiple effects modify your hand size, you apply "set" effects in timestamp order (the most recent one is the one that applies), and then apply modifiers.
> 
> However, the official ruling for these specific cards (and per rule 613.11) is that **modifying hand size effects are applied in timestamp order**:  
> > For example, if you are affected by Cursed Rack (an artifact that sets a player's maximum hand size to four) and then put Thought Eater onto the battlefield, your maximum hand size would be one. However, if those permanents entered in the opposite order, your maximum hand size would be four.
> 
> **Sequence 1: Cursed Rack first, then Thought Eater**
> - Cursed Rack sets hand size to 4.
> - Thought Eater’s -3 modifier is applied after (because it has a later timestamp), so your max is 4 - 3 = **1**.
> 
> **Sequence 2: Thought Eater first, then Cursed Rack**
> - Thought Eater makes your max hand size 7 - 3 = 4.
> - Cursed Rack enters later and sets your max hand size to 4—**not** further reduced—so your max is **4**.
> 
> **Relevant rule:**
> > 613.11. Some continuous effects affect game rules rather than objects. For example, effects may modify a player’s maximum hand size... All other such effects are applied in timestamp order.
> 
> **Conclusion:**  
> Your understanding is correct and aligns with official rulings:  
> - Cursed Rack first, then Thought Eater = max hand size **1**
> - Thought Eater first, then Cursed Rack = max hand size **4**

**Your grade (0/1/2):** ____

---

## 4. Akrasan Squire

**Question:** When a creature attacks alone and has exalted, does the exalted trigger resolve before blockers are declared?

**Reference — short answer:** Yes: exalted abilities resolve before blockers are declared.

**Reference — full answer:** Exalted abilities will resolve before blockers are declared.

**The AI's answer:**

> **Yes, the exalted trigger resolves before blockers are declared.**
> 
> ### Reasoning
> 
> From the official Oracle ruling on Akrasan Squire:
> > Exalted abilities will resolve before blockers are declared.
> 
> This means:
> - When you declare attackers, if you attack with exactly one creature, exalted abilities you control trigger immediately.
> - Those triggers go on the stack, and players may respond.
> - When the stack is empty, the exalted triggers resolve, giving the attacking creature +1/+1 for each exalted trigger.
> - Only after all triggers resolve does the game proceed to the declare blockers step.
> 
> **Summary:** Exalted always gives its bonus before blockers can be declared, so your creature will have the full exalted bonus during the rest of combat (including assigning and receiving combat damage).

**Your grade (0/1/2):** ____

---

## 5. Rukarumel, Biologist + Bramblewood Paragon

**Question:** Rukarumel makes creatures enter as the chosen creature type. If the type is Warrior and I control Bramblewood Paragon, does a Runeclaw Bear enter with an additional +1/+1 counter?

**Reference — short answer:** Yes: effects that modify creatures of a certain type as they enter apply after Rukarumel's effect, so the Bear gets the counter.

**Reference — full answer:** Replacement effects that modify creatures of a certain type as they enter will apply after you apply this effect. For example, if Warrior is the chosen creature type and you control Bramblewood Paragon, a Runeclaw Bear would enter the battlefield with an additional +1/+1 counter.

**The AI's answer:**

> **Yes, if Rukarumel (with "Warrior" chosen) and Bramblewood Paragon are both on the battlefield under your control, Runeclaw Bear enters with an additional +1/+1 counter.**
> 
> ### Step-by-step reasoning
> 
> 1. **Rukarumel's effect:**  
>    - As Rukarumel reads: "Slivers you control and nontoken creatures you control are the chosen type in addition to their other creature types. The same is true for creature spells you control and creature cards you own that aren't on the battlefield."
>    - So, all nontoken creatures you control (including Runeclaw Bear, which is a nontoken creature you control) are Warriors **in addition to** their other creature types.
> 
> 2. **Bramblewood Paragon's effect:**  
>    - "Each other Warrior creature you control enters the battlefield with an additional +1/+1 counter on it."
>    - The official Oracle ruling:  
>     > "If a Warrior would normally enter the battlefield with a certain number of +1/+1 counters on it, it enters with that many +1/+1 counters plus one on it instead. If a Warrior would normally enter with no +1/+1 counters on it, it enters with one +1/+1 counter on it instead."
> 
> 3. **Interaction, with official WotC ruling:**  
>    - From Rukarumel’s Oracle ruling:  
>    > "Replacement effects that modify creatures of a certain type as they enter the battlefield will apply after you apply this effect. For example, if Warrior is the chosen creature type and you control Bramblewood Paragon, a Runeclaw Bear would enter the battlefield with an additional +1/+1 counter."
>    - This is a direct confirmation of your scenario.
> 
> ### Conclusion
> 
> **A Runeclaw Bear entering the battlefield under your control, when Rukarumel (with Warrior chosen) and Bramblewood Paragon are both in play, will enter as a Bear Warrior and therefore will get an additional +1/+1 counter due to Bramblewood Paragon.**
> 
> **Relevant WotC ruling:**
> > "If Warrior is the chosen creature type and you control Bramblewood Paragon, a Runeclaw Bear would enter the battlefield with an additional +1/+1 counter."

**Your grade (0/1/2):** ____

---

## 6. Quest for Pure Flame + Arrow Volley Trap

**Question:** If a spell divides damage among several recipients, as Arrow Volley Trap does, is the damage divided before Quest for Pure Flame's effect doubles it?

**Reference — short answer:** Yes: the damage is divided first, and the doubling applies afterward, which is also true for combat damage.

**Reference — full answer:** If a spell or ability divides damage among multiple recipients (such as Arrow Volley Trap does), the damage is divided before Quest for Pure Fire’s effect doubles it. The same is true for combat damage.

**The AI's answer:**

> **Short answer:**  
> Yes—**the damage from Arrow Volley Trap is divided as you cast the spell, before Quest for Pure Flame's effect doubles it**.
> 
> ---
> 
> **Explanation:**
> 
> From the official ruling for Quest for Pure Flame (WotC, 2009-10-01):
> 
> > "If a spell causes damage to be dealt, that spell will always identify the source of the damage. In most cases, the source is the spell itself. For example, Lightning Bolt says “Lightning Bolt deals 3 damage to any target.”  
> > 
> > If a spell or ability divides damage among multiple recipients (such as Arrow Volley Trap does), the damage is divided before Quest for Pure Fire’s effect doubles it. The same is true for combat damage."
> 
> This means:
> 
> - When you cast **Arrow Volley Trap**, you choose how to divide its 5 damage among any number of target attacking creatures. Each target must be assigned at least 1 damage; this division is locked in as you put the spell on the stack (Rule 601.2d, paraphrased above, and Arrow Volley Trap's ruling).
> - When **Quest for Pure Flame's effect** ("If any source you control would deal damage... it deals double that damage... instead") is active, it looks at the amount of damage that would be dealt by each source at the moment damage would be dealt. It then doubles that amount per recipient, **after** the initial division.
> 
> **Practical example:**  
> - You cast Arrow Volley Trap and assign 3 damage to Creature A and 2 damage to Creature B.
> - When the spell resolves (with Quest for Pure Flame's effect active), **Creature A takes 6 damage** (3×2) and **Creature B takes 4 damage** (2×2).
> 
> **Summary:**  
> - The **division** of damage among targets happens first (while casting).
> - **Doubling** from Quest for Pure Flame happens later, at the moment damage would be dealt.
> 
> **Conclusion:**  
> > “If a spell or ability divides damage among multiple recipients (such as Arrow Volley Trap does), the damage is divided before Quest for Pure Fire’s effect doubles it.”  
> (**Official Ruling, Quest for Pure Flame**)
> 
> So the answer is **yes**, the damage is divided before it is doubled.

**Your grade (0/1/2):** ____

---

## 7. Praetor's Counsel + Null Profusion

**Question:** If I put Null Profusion onto the battlefield and then resolve Praetor's Counsel, do I have no maximum hand size, while the opposite order would leave my maximum at two?

**Reference — short answer:** Yes: effects that modify your hand size are applied in timestamp order, so the order they happen decides the result.

**Reference — full answer:** If multiple effects modify your hand size, apply them in timestamp order. For example, if you put Null Profusion (an enchantment that says your maximum hand size is two) onto the battlefield and then resolve Praetor's Counsel, you have no maximum hand size. However, if those events happened in the opposite order, your maximum hand size would be two.

**The AI's answer:**

> **Correct.** The order these effects occur matters due to how continuous effects apply by timestamp:
> 
> - **If you put Null Profusion onto the battlefield first** (giving you "maximum hand size is two"), and *then* resolve Praetor’s Counsel ("no maximum hand size for the rest of the game"), **you will have no maximum hand size**.
> - **If you resolve Praetor’s Counsel first** (so "no maximum hand size for the rest of the game" effect is active), and *then* Null Profusion enters (setting your "maximum hand size is two"), **your maximum hand size will be two**.
> 
> ### Why?
> 
> > *If multiple effects modify your hand size, apply them in timestamp order. For example, if you put Null Profusion (an enchantment that says your maximum hand size is two) onto the battlefield and then resolve Praetor's Counsel, you have no maximum hand size. However, if those events happened in the opposite order, your maximum hand size would be two.*  
> > — Praetor's Counsel and Null Profusion official rulings
> 
> This is because **ongoing effects that set a hand size are applied according to when they take effect**—later effects override earlier ones.
> 
> - **Timestamp order**: The most recent effect “wins” if there are multiple that set maximum hand size.
> - Praetor’s Counsel effect is *not* a continuous effect attached to a permanent, but its lingering effect on you (the player) from resolving the spell. That still counts in the timestamp system.
> 
> ### In summary:
> - **Null Profusion, then Praetor's Counsel:** no max hand size (Counsel's effect came second).
> - **Praetor's Counsel, then Null Profusion:** max hand size of two (Null Profusion's effect came second).
> 
> This is directly supported by the official rulings for both cards.

**Your grade (0/1/2):** ____

---

## 8. Incarnation Technique

**Question:** Incarnation Technique mills five cards and then returns a creature card from my graveyard to the battlefield. Do I choose the creature after I have milled?

**Reference — short answer:** Yes: you choose the creature after you mill five cards.

**Reference — full answer:** You choose which creature to bring back after you mill five cards.

**The AI's answer:**

> **Short answer:**  
> Yes, you choose the creature card *after* you mill five cards.
> 
> **Reasoning:**  
> Incarnation Technique says:  
> > "Mill five cards, then return a creature card from your graveyard to the battlefield."
> 
> The official ruling states:  
> > "You choose which creature to bring back after you mill five cards."
> 
> This means you:
> 1. **Mill five cards first:** Put the top five cards of your library into your graveyard.
> 2. **Choose any creature card in your graveyard:** You may choose any creature card in your graveyard (including those just milled or ones that were already there).
> 
> **Relevant rule excerpt:**  
> > "...You may choose any creature card in your graveyard, not just one that you milled this way." (Incarnation Technique official ruling)
> 
> **Summary:**  
> You don't choose the creature card until *after* you have milled. That way, you can select from any of the creature cards now in your graveyard, regardless of when they got there.

**Your grade (0/1/2):** ____

---

## 9. Academy Manufactor + Esix, Fractal Bloom

**Question:** How do Academy Manufactor and Esix, Fractal Bloom interact when I create a Treasure?

**Reference — short answer:** You choose the order: Manufactor first gives three tokens that Esix can turn into copies; Esix first gives one copy and Manufactor has nothing left to replace.

**Reference — full answer:** You choose which replacement effect applies first (rules 616.1 and 616.1e), and then the process repeats with only the effects that still apply (616.1f). If you apply Academy Manufactor first, the Treasure becomes a Clue, a Food and a Treasure; Esix, Fractal Bloom may then replace that event, so you create three tokens that are copies of the creature you choose instead. If you apply Esix first, you create one token that is a copy of the chosen creature instead of the Treasure; Academy Manufactor then has nothing to replace, because that event no longer creates a Clue, Food or Treasure token, so you end up with one token. Esix's replacement effect is optional and applies only the first time you would create tokens during each of your turns. If you do not use Esix, Academy Manufactor alone gives you a Clue, a Food and a Treasure.

**The AI's answer:**

> **Short answer:**  
> If you *would* create a Treasure token and control both **Academy Manufactor** and **Esix, Fractal Bloom** (noting Esix's restriction that this can only apply once per turn, only on your turn), you can replace the entire token creation (all the tokens that Manufactor would create) with that many tokens that are copies of a non-Esix creature.
> 
> ## Explanation
> 
> ### Relevant Abilities
> 
> - **Academy Manufactor:**  
>   "If you would create a Clue, Food, or Treasure token, instead create one of each."
> 
> - **Esix, Fractal Bloom:**  
>   "The first time you would create one or more tokens during each of your turns, you may instead choose a creature other than Esix and create that many tokens that are copies of that creature."
> 
> ### Stack & Replacement Effects (based on rules and card text)
> 
> - Both effects are *replacement effects* (use "instead") that want to modify how token creation happens.
> - When multiple replacement effects would apply, rule 616.1e applies:  
>   **"Any of the applicable replacement and/or prevention effects may be chosen."**  
>   This means that the controller of the effect (you, the affected player) chooses which replacement applies first.
> 
> ### The Process Step-by-Step
> 
> Suppose you have both permanents and would create a Treasure token (for example by casting a spell that gives you one):
> 
> #### 1. Triggering Point  
> - You "would create" a Treasure token.  
> - Both Academy Manufactor's and Esix's replacement effects attempt to modify this event.
> 
> #### 2. Choose Which Effect to Apply First  
> You get to choose:
> - **Option A**: Apply **Esix** first.
> - **Option B**: Apply **Academy Manufactor** first.
> 
> Let's break down both:
> 
> ---
> 
> **Option A: Apply Esix first**  
> - "The first time you would create one or more tokens during each of your turns, you may instead choose a creature other than Esix and create _that many tokens that are copies of that creature_."
> 
> - Since you would create *one* token (the Treasure), Esix will let you instead create 1 token that is a copy of the chosen creature.
> 
> - **Academy Manufactor's effect is never reached** in this sequence, because the event is replaced before anything says "create a Clue, Food, or Treasure token".
> 
> ---
> 
> **Option B: Apply Academy Manufactor first**  
> - "If you would create a Clue, Food, or Treasure token, instead create one of each."
> - You are about to create a Treasure, so with Manufactor, you _would create a Clue, a Food, and a Treasure_ instead (3 tokens).
> - **Now, a new event:** You are now simultaneously about to create _three_ tokens (1 Clue, 1 Food, 1 Treasure).
> - **Esix can apply to any token creation event**, so it is now eligible to replace this event as well.
> 
> - Now, Esix asks: "Would you like to, instead, create _three_ tokens that are copies of a chosen non-Esix creature?"
>     - If yes, you get 3 tokens that are all copies of the chosen creature.
>     - You do **not** get the Clue, Food, or Treasure tokens themselves (their creation was replaced).
> 
> ---
> 
> **Key Official Ruling (Esix):**  
> _"This effect applies before anything that modifies how those tokens enter the battlefield."_
> 
> - Esix's replacement applies *before* token modifications (such as token-doubling, or in this case, Manufactor's “instead create these kinds of tokens”).  
> - **But** both are replacement effects about _what_ tokens are created, not their characteristics as they enter, so the choice is up to the affected player (i.e. APNAP, 616.1e), and the sequence above holds.
> 
> ---
> 
> ### **Summary Table**
> 
> | Order Applied                   | Outcome                                                                                      |
> |---------------------------------|---------------------------------------------------------------------------------------------|
> | Esix first, then Manufactor     | Get 1 copy of any non-Esix creature (no Clue/Food/Treasure); Manufactor doesn't apply      |
> | Manufactor first, then Esix     | Esix replaces creation of 3 tokens (Clue, Food, Treasure) with 3 copies of a non-Esix creature |
> 
> *In either case, you do not get any actual artifact tokens; Esix’s effect replaces the entire event!*
> 
> ### **What you actually get:**
> 
> > The **first time each turn you would create a Treasure token and control both**, you will get **copies of a creature** (number depends on sequence, typically 3 if you choose Manufactor first), and you do not get any Clue, Food, or Treasure artifacts from that creation event.
> 
> #### **Most flexible play:**
> - You usually want to apply Manufactor, then Esix, to maximize the number of creature tokens you create.
> 
> ---
> 
> **Key rules used:**
> 
> - “Any of the applicable replacement and/or prevention effects may be chosen.” (616.1e)
> - Official Esix ruling clarifying it can replace the entire event and applies before modifications of the tokens.
> - Official Manufactor Oracle: it stacks if you control multiples but does not "multiply" with Esix, instead Esix redirects the event.
> 
> ---
> 
> **If you have further questions about other types of token replacement (Doubling Season, Mondrak, etc.), the order and result can change!**

**Your grade (0/1/2):** ____

---

## 10. Necropotence + Borne Upon a Wind + Silence

**Question:** I control Necropotence and have more than seven cards in hand at my cleanup step. An opponent cast Silence during that turn's main phase. Can I cast Borne Upon a Wind in the cleanup step, after discarding to hand size?

**Reference — short answer:** Yes: Silence's this-turn effect has ended, and Necropotence's discard trigger gives you priority in the cleanup step.

**Reference — full answer:** Yes, you can cast it. In the cleanup step you first discard down to your maximum hand size (rule 514.1). Right after that, all damage is removed and all "until end of turn" and "this turn" effects end at the same time (514.2), so Silence, which only lasts this turn, no longer stops you from casting spells. Each card you discard triggers Necropotence, so a triggered ability is waiting after those actions, and players receive priority in the cleanup step (514.3a). Borne Upon a Wind is an instant, so you may cast it then. Once the stack is empty and all players pass in succession, another cleanup step begins (514.3a).

**The AI's answer:**

> Let's break down the scenario with all provided details:
> 
> **What is happening:**
> - You control **Necropotence**.
> - It's your **cleanup step**.
> - You have **more than seven cards in hand** at the start of the cleanup step.
> - Your opponent cast **Silence** during your main phase ("Your opponents can't cast spells this turn.").
> - You are considering casting **Borne Upon a Wind (Instant)** in the cleanup step, after discarding to hand size.
> 
> ---
> 
> ## Relevant Rules and Card Texts
> 
> #### Cleanup Step and Priority
> Rule 514.1–514.3:
> > 703.4n/514.1. Immediately after the cleanup step begins, if the active player’s hand contains more cards than their maximum hand size (normally seven), they discard enough cards to reduce their hand size to that number. This turn-based action doesn’t use the stack.
> 
> > 514.3. Normally, no player receives priority during the cleanup step, so no spells can be cast and no abilities can be activated. However, this rule is subject to the following exception:
> 
> > 724.1f. No player gets priority during this process, so triggered abilities are not put onto the stack. If any triggered abilities have triggered since this process began, those abilities are put onto the stack during the cleanup step, then the active player gets priority and players can cast spells and activate abilities. Then there will be another cleanup step before the turn finally ends. If no triggered abilities have triggered during this process, no player gets priority during the cleanup step.
> 
> **Summary:**  
> - In the cleanup step, you normally discard to max hand size without using the stack.
> - **Normally**, you do **not** get priority in the cleanup step, so you cannot cast spells.
> - **Exception:** If any triggered abilities occur (such as Necropotence's discard trigger) during the cleanup step, **those triggers go on the stack, THEN you get priority**. At that point, you may cast instants (like Borne Upon a Wind).
> 
> ---
> 
> #### Necropotence's Discard Trigger
> > Whenever you discard a card, exile that card from your graveyard.
> 
> This is a triggered ability that will definitely trigger and need to be placed on the stack after you discard to hand size in cleanup.
> 
> ---
> 
> #### Silence's Effect
> > Your opponents can't cast spells this turn.
> 
> Official ruling:
> > Silence won't affect spells that your opponents cast before you cast Silence, including any spells that are still on the stack. Silence also won't stop your opponents from casting spells after you cast Silence but before Silence resolves.
> > The only thing Silence stops is casting spells.
> 
> This means: **If it is still that turn, you (as the opponent of Silence's caster) cannot cast any spells—even if you gain priority in the cleanup step via prompted triggers.**
> 
> ---
> 
> ### Step-by-Step Interaction
> 
> 1. **Cleanup Step Begins:**  
>    - You have more than seven cards → discard to max hand size.  
>    - Each time a card is discarded, Necropotence triggers. These abilities wait until you've finished discarding.
> 
> 2. After discards, **Necropotence discard triggers** are put onto the stack (724.1f):  
>    - You now **get priority** (if any triggers occurred) and may act.
> 
> 3. **But Silence is in effect for the turn:**  
>    - Until the turn ends, you (opponent of Silence's caster) **cannot cast spells**.
>    - This restriction applies no matter when you get priority, including the cleanup step.
> 
> 4. **So:**  
>    - **You cannot cast Borne Upon a Wind during the cleanup step this turn if Silence was cast earlier that turn.**
>    - Silence's effect lasts until the turn ends, including any unusual cleanup step scenarios with triggered abilities.
> 
> ---
> 
> ## Summary Table
> 
> | Action                  | Possible? | Reason                                  |
> |-------------------------|-----------|-----------------------------------------|
> | Discard to hand size    | Yes       | Cleanup step rule, no stack             |
> | Necropotence triggers   | Yes       | Triggers as cards are discarded         |
> | Stack triggers in cleanup, gain priority | Yes       | If triggered abilities occurred         |
> | Cast spells in this window | **No**   | **Silence's effect forbids it**         |
> 
> ---
> 
> ## Conclusion
> 
> **You cannot cast Borne Upon a Wind (or any spell) during that cleanup step after discarding, because Silence is still in effect for the duration of the turn, and it prevents opponents from casting spells regardless of when or how they get priority.**
> 
> If Silence were **not** in effect, you *could* cast instants (or cards with flash) in this triggered-ability cleanup step window. But with Silence in effect: you cannot.

**Your grade (0/1/2):** ____

---

## 11. Only Blood Ends Your Nightmares + Tajuru Preserver

**Question:** In a multiplayer game, an opponent who controls Tajuru Preserver can't sacrifice a creature for Only Blood Ends Your Nightmares. Do they discard two cards instead?

**Reference — short answer:** Yes: each opponent who can't sacrifice a creature, because they control none or control Tajuru Preserver, discards two cards, and they have no choice.

**Reference — full answer:** Each opponent who can sacrifice a creature must do so, and thus won’t discard any cards. Each opponent who can’t sacrifice a creature (either because they don’t control any, or because they control Tajuru Preserver) will wind up discarding two cards. Your opponents have no choice in the matter.

**The AI's answer:**

> **Yes, an opponent who controls Tajuru Preserver will have to discard two cards when Only Blood Ends Your Nightmares resolves.**
> 
> ## Explanation
> 
> **Only Blood Ends Your Nightmares** says:
> > When you set this scheme in motion, each opponent sacrifices a creature of their choice. Then each opponent who didn't sacrifice a creature discards two cards.
> 
> **Tajuru Preserver** says:
> > Spells and abilities your opponents control can't cause you to sacrifice permanents.
> 
> The official ruling for Tajuru Preserver (2010-06-15) clarifies:
> > As a spell or ability an opponent controls resolves, if it would force you to sacrifice a permanent ..., you just don’t. That part of the effect does nothing.
> 
> **The official Oracle ruling for Only Blood Ends Your Nightmares states:**
> > Each opponent who can sacrifice a creature must do so, and thus won’t discard any cards. Each opponent who can’t sacrifice a creature (either because they don’t control any, or because they control Tajuru Preserver) will wind up discarding two cards. Your opponents have no choice in the matter.
> 
> ## Stack Resolution
> 
> - As the scheme resolves, it instructs each opponent to sacrifice a creature.
>   - The Tajuru Preserver controller “can’t” sacrifice a creature due to the restriction.
> - Next, **for each opponent who didn’t actually sacrifice a creature**, that opponent discards two cards.
> 
> ## Conclusion
> 
> **If the opponent controls Tajuru Preserver, they are prevented from sacrificing a creature as instructed by the scheme. Therefore, per the scheme's text (and the ruling), that opponent discards two cards.**

**Your grade (0/1/2):** ____

---

## 12. Horizon Drake + Teetering Peaks

**Question:** Horizon Drake has protection from lands. Can it be targeted by an ability from my own land, such as Teetering Peaks?

**Reference — short answer:** No: it can't be the target of activated or triggered abilities from lands, including your own.

**Reference — full answer:** Protection from lands works like any other protection ability. Horizon Drake can’t be blocked by land creatures, all damage that would be dealt to it by lands (including combat damage from land creatures) is prevented, and it can’t be the target of activated or triggered abilities from lands (including your own Teetering Peaks, for example).

**The AI's answer:**

> **No, Horizon Drake cannot be targeted by an ability from your own land, including Teetering Peaks.**
> 
> ### Explanation:
> **Horizon Drake:**  
> - Has protection from lands.
> 
> #### Protection from Lands (Oracle Ruling Excerpt)  
> *"Protection from lands works like any other protection ability. Horizon Drake can’t be blocked by land creatures, all damage that would be dealt to it by lands (including combat damage from land creatures) is prevented, and it can’t be the target of activated or triggered abilities from lands (including your own Teetering Peaks, for example)."*
> 
> **Teetering Peaks:**  
> - Its triggered ability on entering the battlefield says, "When this land enters, target creature gets +2/+0 until end of turn."
> - This ability comes from a land, so protection from lands applies.
> 
> #### Applying the Protection Rule:
> From rule 702.16j:  
> > Such a permanent or player can’t be targeted by spells or abilities...
> 
> Protection from lands prevents targeting *by* anything that is a land, not just from opponents' lands.
> 
> ### Result:
> - When Teetering Peaks enters the battlefield, you **cannot legally choose Horizon Drake as the target** for its triggered ability, because the source of the ability is a land and protection from lands applies even to your own effects.
> 
> **Summary:**  
> You cannot target Horizon Drake with Teetering Peaks’ triggered ability, even though you control both cards. Protection from lands blocks all targeting from land sources.

**Your grade (0/1/2):** ____


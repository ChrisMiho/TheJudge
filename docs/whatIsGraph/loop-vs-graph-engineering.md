# Loop Engineering vs. Graph Engineering

### A field guide to agent orchestration architecture, anchored to the Claude Agent SDK

*Compiled 17 August 2026. Every substantive claim is sourced; opinions are labeled as such.*

---

## 0. The short version

If you read nothing else:

**Loop engineering** means you write the tools, the context, and the stop condition — and let the model decide the order of operations at runtime. **Graph engineering** means you write the nodes and edges — and the model only chooses between branches you defined in advance.

The honest answer to "which one" is that this is the *second* most important decision you'll make. The most important one is the quality of your **harness**: the tools, the context management, the verification signal. A 2026 paper measured up to **34 points of spread on SWE-bench Verified Mini using the same model with different scaffolds** — and found harness-induced variance exceeded model-induced variance by roughly **7.8×** ([Zhang et al., arXiv:2605.23950](https://arxiv.org/abs/2605.23950)). Architecture arguments that ignore harness quality are mostly noise.

That said, there is a real decision here, and it has a defensible default:

> **Start with a loop. Add graph structure at the specific points where a wrong turn is expensive, irreversible, or has to be auditable.**

This is not a compromise position — it's what nearly every serious production system converged on in 2025–26. LangChain's Deep Agents run "the same core tool calling loop as other agent frameworks" on top of LangGraph as a *durable runtime*, not as agent logic. Microsoft's Agent Framework declares handoff edges and then *compiles them into tools the loop can see*. OpenAI shipped a visual graph builder for a loop-native SDK. Anthropic ships a loop and then documents four escalating ways to bolt a deterministic gate onto it.

The rest of this document is the reasoning, the evidence, and the actual code.

---

## 1. Terminology: what these words mean, and who decided

Both terms are recent, and one of them is genuinely contested. Worth getting straight before we build on them.

### "Loop engineering" is a vendor-named concept

Anthropic published **["Loop engineering: getting started with loops"](https://claude.com/blog/getting-started-with-loops) on 30 June 2026**, defining loops as *"agents repeating cycles of work until a stop condition is met."* Trade press ([ADTmag, 1 July 2026](https://adtmag.com/articles/2026/07/01/loop-engineering-emerges-as-developers-put-ai-coding-agents-on-repeat.aspx)) credits the term's popularization to Boris Cherny (creator of Claude Code) and Peter Steinberger, with Andrew Ng framing it around three nested loops. So this is a real named movement with a documented origin, not a blogger's coinage.

### "Graph engineering" is contested

LangChain published **["3 Years of Graph Engineering with LangGraph"](https://www.langchain.com/blog/3-years-of-graph-engineering-with-langgraph) on 22 July 2026** (Sydney Runkle and Harrison Chase), describing it as representing agentic systems as graphs, which *"allows you (as the builder) to impose your preconceptions of how the system should work into more constrained paths, not relying solely on the judgement of the LLM."*

But the term collides with an older meaning (knowledge graphs / GraphRAG), and at least one 2026 trade outlet uses it to mean something else entirely — a dual-graph org model of long-lived agent roles plus ephemeral task nodes. **The term is genuinely ambiguous in the wild.** If someone says "graph engineering" to you, ask which one they mean.

### The stipulated definitions used here

| | **Loop** | **Graph** |
|---|---|---|
| **Who picks the next action** | The model, at runtime | The author, at design time |
| **Topology** | Emergent; unknown until it runs | Declared; knowable before it runs |
| **What you write** | Tools, context, stop conditions | Nodes, edges, state schema |
| **Termination** | Manufactured (budget, goal, gate) | Structural (a terminal node) |
| **Canonical implementation** | Claude Agent SDK, ReAct, `while` + tool calls | LangGraph `StateGraph`, Temporal workflow, DAG |

### The claim you should be aware of

LangChain's position, verbatim: **"Loop engineering isn't an alternative to graphs, so much as a simple version of them"** — a loop is *"a directed, cyclic graph."*

This is formally true and rhetorically loaded. Yes, a `while` loop over tool calls is a graph with one node and a self-edge. But that's like saying a `for` loop is a special case of a Turing machine — correct, and not useful for deciding what to build. The engineering difference is not topological, it's about **who holds the plan**: Claude turn-by-turn, or your script. Keep that phrase — *who holds the plan* — because it's the cleanest single test in this whole document.

### The 2024 ancestor

Both terms are new labels on a distinction Anthropic drew in **["Building Effective Agents"](https://www.anthropic.com/engineering/building-effective-agents) (19 December 2024)**:

> "**Workflows** are systems where LLMs and tools are orchestrated through predefined code paths. **Agents**, on the other hand, are systems where LLMs dynamically direct their own processes and tool usage, maintaining control over how they accomplish tasks."

And the recommendation that still holds up:

> "When building applications with LLMs, we recommend finding the simplest solution possible, and only increasing complexity when needed."

A detail most summaries miss: that post is roughly 80% workflow (graph) patterns and one section on agents. It is, in effect, a pro-graph document from the company that went on to ship the most famous loop in the industry.

---

## 2. The loop, mechanically

### 2.1 The five-step cycle

From the [Agent SDK's agent-loop reference](https://code.claude.com/docs/en/agent-sdk/agent-loop):

1. **Receive prompt.** Claude gets your prompt + system prompt + tool definitions + conversation history. SDK yields a `SystemMessage` with subtype `"init"`.
2. **Evaluate and respond.** Claude may emit text, request tool calls, or both. SDK yields an `AssistantMessage`.
3. **Execute tools.** SDK runs each tool and collects results. Hooks can intercept, modify, or block calls before they run.
4. **Repeat.** Steps 2–3 cycle. Each full cycle is **one turn**. *"Claude continues calling tools and processing results until it produces a response with no tool calls."*
5. **Return result.** Final `AssistantMessage` (no tool calls), then a `ResultMessage` with text, token usage, cost, session ID.

The definition of a turn contains the crux of the whole paradigm:

> "A turn is one round trip inside the loop: Claude produces output that includes tool calls, the SDK executes those tools, and the results feed back to Claude automatically. **This happens without yielding control back to your code.**"

That last clause is what you are buying and what you are giving up. You do not get a callback between "Claude decided to run `rm -rf`" and "the SDK ran `rm -rf`" — unless you install a hook. Which is exactly why hooks exist.

At the conceptual level Anthropic frames it as three blended phases — **gather context → take action → verify results → repeat** ([How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works)) — with the honest note that *"the loop adapts to what you ask."* A question might only need phase one. A bug fix cycles all three repeatedly.

### 2.2 The four loop shapes

From the loop engineering post, classified by what starts them and what stops them:

| Loop type | Triggered by | Stop criteria | Best for |
|---|---|---|---|
| **Turn-based** | User prompt | Claude judges completion or needs context | Shorter tasks outside a regular process |
| **Goal-based** (`/goal`) | Manual prompt, real-time | Goal achieved **OR** max turns reached | Tasks with verifiable exit criteria |
| **Time-based** (`/loop`, `/schedule`) | A time interval | You cancel, or the work completes | Recurring work, interfacing with external systems |
| **Proactive** | Event or schedule, no human present | Each task exits on goal; routine continues | Recurring, well-defined work streams |

Two lines from that post worth pinning above your desk:

> "When you define the success criteria, Claude doesn't have to make a determination on what is 'good enough' and end the loop early."

> "**The quality of a loop's output depends on the system around it.**"

### 2.3 The levers you actually pull

This is the loop engineer's control panel. Every one of these is a real `ClaudeAgentOptions` field or documented mechanism.

**Stop conditions** — the single biggest difference from graph work. In a graph, termination is structural: you reach `END`. In a loop, you have to *manufacture* a stop.

| Mechanism | Semantics |
|---|---|
| Natural stop | Loop ends when Claude emits a turn with no tool calls |
| `max_turns` / `maxTurns` | Counts **tool-use turns only**; yields `error_max_turns` |
| `max_budget_usd` / `maxBudgetUsd` | Compared against `total_cost_usd`; **subagent spend counts**; yields `error_max_budget_usd` |
| `AgentDefinition.maxTurns` | Per-subagent cap |
| `Stop` hook | Script or prompt gate; Claude Code overrides after **8 consecutive blocks** |
| `/goal` | A separate small fast model evaluates a stated condition after every turn |
| `interrupt()` / `abortController` | External cancel |

The docs are blunt about the default: *"Without limits, the loop runs until Claude finishes on its own, which is fine for well-scoped tasks but can run long on open-ended prompts ('improve this codebase'). **Setting a budget is a good default for production agents.**"*

**Tool surface.** The degradation here is quantified, which is rare and useful:

- **"Tool selection accuracy degrades with more than 30-50 tools loaded at once."** ([tool search docs](https://code.claude.com/docs/en/agent-sdk/tool-search))
- 50 tools consumes roughly **10–20K tokens** of context.
- Below ~10 tools, loading everything upfront is typically faster than searching.
- Claude Code caps tool responses at **25,000 tokens by default** ([Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)).

The design principle from the context engineering post is the sharpest sentence in Anthropic's whole corpus on this:

> "**If a human engineer can't definitively say which tool should be used in a given situation, an AI agent can't be expected to do better.**"

**Context budget.** Context is not a free resource and the failure is gradual, not sudden. From ["Effective context engineering for AI agents"](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (29 Sept 2025):

> "as the number of tokens in the context window increases, the model's ability to accurately recall information from that context decreases" — because transformers create "**n² pairwise relationships for n tokens**," drawing on a finite "**attention budget**."

The objective function they state: *"finding the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome."*

Mitigations, all first-party: automatic compaction (with a `compact_boundary` message so you can observe it), the `PreCompact` hook, `/compact` with instructions, `clear_tool_uses_20250919` context editing at the API layer, the memory tool, and subagents (which return only a summary to the parent, so *"the main agent's context grows by that summary, not by the full subtask transcript"*).

One trap worth memorizing: **compaction drops early instructions.** The docs say it plainly — *"Persistent rules belong in CLAUDE.md ... because CLAUDE.md content is re-injected on every request."* If you put a critical constraint only in the opening prompt of a long-running loop, it will silently evaporate around hour two.

**Verification.** This is the lever that separates loops that work from loops that burn money. From [Claude Code best practices](https://code.claude.com/docs/en/best-practices):

> "**Claude stops when the work looks done. Without a check it can run, 'looks done' is the only signal available, and you become the verification loop:** every mistake waits for you to notice it. Give Claude something that produces a pass or fail, and the loop closes on its own."

Four escalating gate strengths, in order of increasing rigor and cost:

1. **In one prompt** — ask Claude to run the check and iterate in the same message.
2. **Across a session** — set the check as a `/goal` condition; a separate evaluator re-checks every turn.
3. **As a deterministic gate** — a `Stop` hook runs your script and blocks the turn from ending.
4. **By a second opinion** — a verification subagent, *"so the agent doing the work isn't the one grading it."*

Note that gates 3 and 4 are *graph structure smuggled into a loop*. A `Stop` hook is a conditional edge. A fresh-context evaluator is a second node. The hybrid starts here, not at the framework level.

### 2.4 How loops fail

Named, sourced failure modes. This table is worth keeping — most loop debugging is pattern-matching against it.

| Failure mode | Mechanism | Source |
|---|---|---|
| **Context rot** | n² attention over a finite budget; recall degrades with length | Context engineering post |
| **Tool-selection degradation** | >30–50 loaded tools | Tool search docs |
| **Compounding errors** | Autonomy multiplies per-step error rate | Building Effective Agents |
| **Agentic laziness** | *"Claude stops before finishing a particularly complex, multi-part task and declares the job done after partial progress"* | Dynamic workflows post |
| **Self-preferential bias** | *"Claude's tendency to prefer its own results or findings, especially when asked to verify or judge them against a rubric"* | Dynamic workflows post |
| **Goal drift** | *"The gradual loss of fidelity to the original objective across many turns, especially after compaction"* | Dynamic workflows post |
| **Compaction amnesia** | Early instructions dropped in the summary | Agent-loop docs |
| **Instruction dilution** | Over-long CLAUDE.md → rules get ignored | Best practices |
| **Infinite exploration** | Unscoped "investigate this" floods the context | Best practices |
| **Correction pollution** | Repeated corrections fill context with failed approaches | Best practices |
| **Self-conditioning** | Models *"become more likely to make mistakes when the context contains their errors from prior turns"* — and this **does not go away with scale** | [arXiv:2509.09677](https://arxiv.org/abs/2509.09677), ICLR 2026 |

The best-practices doc gives a diagnostic heuristic that's saved me real time: *"If you've corrected Claude more than twice on the same issue in one session, the context is cluttered with failed approaches. Run `/clear` and start fresh... A clean session with a better prompt almost always outperforms a long session with accumulated corrections."*

---

## 3. The graph, mechanically

### 3.1 The model

A graph agent has four parts: a **typed state object**, **nodes** that are functions returning partial state updates, **edges** (static or conditional) that the author declares, and a **compile step** that validates the topology.

The minimal LangGraph shape (verified against current docs, `langgraph` 1.2.11 on `main`):

```python
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

class State(TypedDict):
    user_input: str
    foo: str
    graph_output: str

def node_1(state: State):
    return {"foo": state["user_input"] + " name"}

def node_2(state: State):
    return {"graph_output": state["foo"] + " is Lance"}

builder = StateGraph(State)
builder.add_node("node_1", node_1)
builder.add_node("node_2", node_2)
builder.add_edge(START, "node_1")
builder.add_edge("node_1", "node_2")
builder.add_edge("node_2", END)

graph = builder.compile()
```

The load-bearing property: **node functions never say "call node_2 next."** The edge does. That's the entire discipline.

### 3.2 Reducers — the part people underestimate

```python
from typing import Annotated
import operator
from langgraph.graph.message import add_messages

class State(TypedDict):
    messages: Annotated[list, add_messages]   # merge by message id
    findings: Annotated[list, operator.add]   # concatenate
    status: str                               # last-write-wins (default)
```

Without a reducer, two parallel branches writing the same key raise `InvalidUpdateError`. The reducer is the conflict-resolution rule for the parallel execution model (LangGraph uses Pregel/BSP supersteps — parallel branches complete, then their updates merge together at the end of the step).

This is where the graph tax gets charged. **State schema churn is proportional to feature churn.** Every new thing your agent tracks is a schema edit, a reducer decision, and a migration for anything persisted. On a product whose shape changes weekly, you pay this at the worst possible time.

### 3.3 Conditional edges — the model choosing between *your* branches

```python
from typing import Literal
from pydantic import BaseModel, Field

class Route(BaseModel):
    step: Literal["poem", "story", "joke"] = Field(description="The next step")

router = llm.with_structured_output(Route)

def llm_call_router(state: State):
    decision = router.invoke([
        SystemMessage(content="Route the input to story, joke, or poem."),
        HumanMessage(content=state["input"]),
    ])
    return {"decision": decision.step}

def route_decision(state: State) -> Literal["write_story", "write_joke", "write_poem"]:
    return {"story": "write_story", "joke": "write_joke", "poem": "write_poem"}[state["decision"]]

builder.add_conditional_edges("llm_call_router", route_decision)
```

This is the canonical illustration of the definition: **the model picks between three predefined branches; it cannot invent a fourth.** That constraint is the product. If you need the model to be able to invent a fourth, you don't want a graph here.

### 3.4 Dynamic fan-out — the answer to "but N is unknown"

The most common objection to graphs is "I don't know how many subtasks there will be." `Send` handles it:

```python
from langgraph.types import Send

def assign_workers(state: State):
    return [Send("worker", {"section": s}) for s in state["sections"]]

builder.add_conditional_edges("orchestrator", assign_workers, ["worker"])
```

`Send` dispatches an arbitrary payload (not the graph state) to N instances of a node, with fan-in through a reducer. This is orchestrator-worker, and it's the reason "graphs require you to pre-declare everything" is only half true — you pre-declare the *node types*, not the *instance count*.

`Command` goes further, letting a node return its own routing decision:

```python
from langgraph.types import Command

def my_node(state: State) -> Command[Literal["other_node"]]:
    return Command(update={"foo": "bar"}, goto="other_node")
```

Worth noting honestly: `Command` partially undermines the pure-graph story, because topology becomes partly runtime-determined. The `Command[Literal[...]]` annotation is how you claw static edges back for visualization and validation.

### 3.5 Persistence — the actual reason to reach for a graph

This is the part of graph engineering that a loop genuinely does not give you for free.

```python
from langgraph.checkpoint.postgres import PostgresSaver

graph = builder.compile(checkpointer=checkpointer, store=store)
result = graph.invoke(inputs, {"configurable": {"thread_id": "thread-1"}})
```

What a checkpointer buys:

1. Multi-turn conversation state without writing a session table
2. **Crash resume mid-graph**
3. **Human-in-the-loop pauses that survive process death** — the interrupt is *stored*, not held in a live coroutine
4. Fork/replay for debugging and counterfactual evals
5. `checkpoints` / `tasks` stream modes for observability

Durability is a real knob, verified from `langgraph/types.py`:

```python
Durability = Literal["sync", "async", "exit"]
# 'sync':  persisted synchronously before the next step starts
# 'async': persisted asynchronously while the next step executes  (default)
# 'exit':  persisted only when the graph exits
```

Human-in-the-loop:

```python
from langgraph.types import interrupt, Command

def human_approval(state: State) -> Command[Literal["approved", "rejected"]]:
    decision = interrupt({"question": "Approve?", "output": state["llm_output"]})
    return Command(goto="approved" if decision == "approve" else "rejected")

graph.invoke({"...": "..."}, config)                       # pauses here
graph.invoke(Command(resume="approve"), config)            # resumes, possibly days later
```

**Two semantics that bite people in production, quoted from the docs:**

> "**Replay re-executes nodes—it doesn't just read from cache. LLM calls, API requests, and interrupts fire again and may return different results.**"

> "`update_state` **does not roll back a thread.** It creates a new checkpoint that branches from the specified point."

And the one that causes the most bugs: **on resume from `interrupt()`, the node re-executes from the top**, not from the `interrupt()` call. Put side effects *after* the interrupt or in a separate node. Multiple `interrupt()`s in one node are matched **by index**, so conditionally varying how many a node raises will silently mis-map your resume values.

### 3.6 Where graph ends and durable execution begins

This distinction is routinely conflated in the discourse, and getting it right will save you a bad architecture decision.

**LangGraph's replay re-runs side effects.** If a node charged a credit card, replay charges it again. A checkpointer gives you "resume from last completed superstep" — not exactly-once semantics.

**Temporal, Restate, Inngest, and DBOS close exactly that gap** via journaled replay: completed steps return their *recorded* result instead of re-executing. Temporal's constraint, verbatim:

> "Workflow code must be deterministic to support replay. To handle non-deterministic operations like API calls, LLM/AI invocations, database queries, and other external interactions, put them in Activities."

What durable engines give you that a graph library does not:

- **Exactly-once side effects**
- **Retries as infrastructure** (a retry survives the process dying mid-retry)
- **Waits measured in days** — `step.sleep("2d")`, `step.waitForEvent(timeout: "3d")` hold no process open
- **Versioning of in-flight executions** — you deployed new code; what happens to the 40,000 runs started on the old topology? Temporal's Worker Versioning answers this. LangGraph OSS does not.

Crucially: **Temporal is *durable imperative*, not *declarative graph*.** Its topology is ordinary code. A Temporal workflow wrapping an agent SDK preserves the agent's loop verbatim and injects durability underneath it:

```python
@workflow.defn
class HelloWorldAgent:
    @workflow.run
    async def run(self, prompt: str) -> str:
        agent = Agent(
            name="Hello World Agent",
            instructions="...",
            tools=[openai_agents.workflow.activity_as_tool(
                get_weather, start_to_close_timeout=timedelta(seconds=10))],
        )
        result = await Runner.run(agent, prompt)
        return result.final_output
```

Per Temporal's SDK README: *"Model invocations and tool calls run inside activities, while the logic that coordinates them lives in the workflow."*

**So "graph" and "durable" are orthogonal axes, and the discourse conflates them.** A 2×2 is more honest than a spectrum:

| | **Weak durability** | **Strong durability (journaled)** |
|---|---|---|
| **Declarative topology** | LangGraph (no checkpointer) | LangGraph + Postgres checkpointer, ADK 2.0 |
| **Imperative topology** | Claude Agent SDK, a plain `while` loop | Temporal / Restate / DBOS wrapping an agent SDK |

If what you actually want is crash recovery and audit trails, you may want the *durable* axis, not the *graph* axis. Those are different purchases.

### 3.7 The named graph patterns

These come from Building Effective Agents and are reproduced in essentially every framework's docs:

| Pattern | Shape | Use when |
|---|---|---|
| **Prompt chaining** | Sequential steps with programmatic gate checks between | Task decomposes cleanly into fixed steps; trades latency for accuracy |
| **Routing** | Classify, then dispatch to specialized handlers | Distinct input categories that need different prompts/tools |
| **Parallelization: sectioning** | Split into independent subtasks, run concurrently | Subtasks genuinely don't depend on each other |
| **Parallelization: voting** | Run the same task N times, aggregate | You need confidence, not speed |
| **Orchestrator-workers** | Central LLM decomposes dynamically, delegates | Subtask count unknown until runtime |
| **Evaluator-optimizer** | Generator → evaluator → loop back or exit | There's a legible eval criterion |

Anthropic's own distinction between orchestrator-workers and parallelization is worth quoting because people conflate them: orchestrator-workers *"differs from parallelization through its flexibility—subtasks aren't predefined but determined by the orchestrator."*

### 3.8 How graphs fail

The criticism is real and largely comes from practitioners, not competitors.

**The 12-Factor Agents critique** (Dex Horthy, HumanLayer) is the highest-quality anti-framework source:

> "**I've tried every agent framework out there**, from the plug-and-play crew/langchains to the 'minimalist' smolagents of the world to the 'production grade' langraph, griptape, etc. ... **I don't see a lot of frameworks in production customer-facing agents.**"

His historical framing lands the point:

> "Around 20 years ago, we started to see DAG orchestrators become popular... my biggest takeaway when I started learning about agents, was that **you get to throw the DAG away**... The promise here is that you write less software, you just give the LLM the 'edges' of the graph and let it figure out the nodes. As we'll see later, **it turns out this doesn't quite work.**"

Note the nuance: Horthy is not pro-autonomous-loop. He is **anti-framework, pro-owning-your-own-control-flow** — which is a third position, and arguably the one most working engineers actually hold.

**The concrete complaints**, from practitioner write-ups and HN discussion:

- **State schema churn.** *"The state schema became a maintenance burden"*; wrapping *"a linear pipeline with one branch in a state machine framework"* meant maintaining type definitions, node signatures, and topology just to change a prompt. (dev.to migration write-up)
- **Debugging through abstraction layers.** Failures require navigating *"several layers of abstractions – graphs, sub-graphs, state objects, and decorators."* (ZenML — note they're a competing vendor)
- **Documentation drift.** *"code from a month-old tutorial wouldn't work anymore because the underlying library had changed."* This one is independently verifiable: `MemorySaver`→`InMemorySaver`, `langchain_core.messages`→`langchain.messages`, `create_react_agent`→`create_agent`, `MessageGraph` deprecated, streaming v1→v2→v3, and the multi-agent docs restructured from supervisor/swarm to subagents/handoffs/skills. **A large majority of published LangGraph tutorials are subtly wrong right now.** This is the single biggest practical liability of the graph path today — and it's a documentation problem, not an architecture problem.
- **HN, 2026-02-24:** *"the 'abstraction soup' makes debugging a nightmare in production. I'm seeing more people just using the OpenAI/Anthropic SDKs directly or very thin wrappers."*

**And the mirror-image critique, aimed at the roll-your-own camp** (HN, 2026-04-10): *"Why are you building your own DAG system instead of just using LangGraph? You could cut complexity and focus on what actually matters."* Both critiques are correct about different projects.

**LangChain's own concession**, from the graph engineering post, is the most useful thing in it: they admit that **forcing deterministic paths onto inherently exploratory tasks is counterproductive**, citing generic deep research as a task that works better with an agentic core — and noting that GPT Researcher abandoned a graph-based approach for a more agentic core loop. They also report that **production agent graphs are not acyclic**; they need cycles for retry, clarification, and iteration. If your mental model of "graph" is "DAG," update it.

---

## 4. Head to head

### 4.1 The comparison table

| Dimension | **Loop** | **Graph** |
|---|---|---|
| **Control flow** | Model decides at runtime | Author decides at design time |
| **Adding a capability** | Add a tool. Done. | Add a node, an edge, and probably a state field |
| **Handling a case you didn't anticipate** | Often just works | Falls off the graph; needs a code change |
| **Termination** | Manufactured: budget, goal, gate | Structural: reach `END` |
| **Reproducibility** | Low — same input, different valid paths | High — same input, same path (modulo LLM nondeterminism inside nodes) |
| **Observability** | Flat, variable-length span sequence; shape known only post-hoc | Every node is a natural span; trace shape knowable before runtime |
| **Testability** | End-state assertions only | Node-level unit tests + trajectory assertions; CI-friendly |
| **Auditability** | Requires full tracing to reconstruct | The topology *is* the audit story |
| **Crash recovery** | Session resume (conversation), not execution state | Checkpointer resumes mid-execution |
| **Human-in-the-loop** | Permission callbacks / hooks, in-process | `interrupt()` survives process death; resume days later |
| **Cost profile** | Higher variance; can blow past estimates | Predictable; bounded by topology |
| **Prompt cache behavior** | Excellent — stable prefix, append-only | Can be poor if nodes swap system prompts or tool sets |
| **Latency** | Serial by default; parallelism must be requested | Parallelism is declared and reliable |
| **Time to first working version** | Hours | Days |
| **Maintenance under changing requirements** | Edit a prompt or a tool | Edit schema + nodes + edges + persisted state migration |
| **Failure signature** | Drifts, loops, quits early, over-explores | Falls off the graph, deadlocks on a reducer, mis-maps a resume |
| **Best-fit tasks** | Open-ended, exploratory, verifiable | Repeatable, regulated, high-stakes, parallel |

### 4.2 Cost — and the lever most analyses miss

| Finding | Number | Source |
|---|---|---|
| Agents vs. chat | **~4× tokens** | Anthropic, Jun 2025 |
| Multi-agent vs. chat | **~15× tokens** | Anthropic, Jun 2025 |
| Share of BrowseComp performance variance explained by token usage alone | **80%** | Anthropic, Jun 2025 |
| KV-cache hit vs. miss (Claude Sonnet) | **$0.30 vs $3.00 /MTok — 10×** | Manus, Jul 2025 |
| Typical agent input:output token ratio | **~100:1** | Manus, Jul 2025 |
| MCP tool definitions preloaded → code execution | **150,000 → 2,000 tokens (−98.7%)** | Anthropic, Nov 2025 |
| CodeAct vs. tool-call loop (multi-step workload) | **6,890 → 2,489 tokens (−63.9%)**; **27.81s → 13.23s (−52.4%)** | Microsoft, Jun 2026 |
| 15-tool graph → 2-tool loop | **−37% tokens, −42% steps, 274.8s → 77.4s** | Vercel, Dec 2025 |

**The 80% number is the most important and most-ignored figure in the entire multi-agent debate.** Anthropic's multi-agent research system beat single-agent Opus 4 by 90.2% — and token usage alone explained 80% of the performance variance on BrowseComp. That strongly suggests much of the multi-agent gain was **bought with tokens, not with topology**. The architecture was a mechanism for spending more tokens in parallel. Anthropic says as much themselves: *"Multi-agent systems require tasks where the value of the task is high enough to pay for the increased performance."*

**And the structural cost point that changes architecture decisions:** the dominant cost lever is **prompt-prefix stability**, not topology. Input is ~100× output, and a cache miss costs 10× a cache hit. A graph that rewrites the system prompt or swaps tool definitions per node destroys the KV cache and pays that 10× on the overwhelming majority of its tokens.

This is a real, quantified cost argument *against* dynamic graph-driven context assembly — and it's why Manus manages tool availability by **masking logits during decoding** rather than editing tool definitions. They get a state machine's action-space restriction while keeping the prompt prefix intact. That trick is under-cited and worth stealing.

### 4.3 Reliability — do the math properly

The folk argument you'll hear is "0.95 per step to the power of n, therefore long loops are hopeless." **The rigorous version cuts the other way.**

[Sinha et al., "The Illusion of Diminishing Returns"](https://arxiv.org/abs/2509.09677) (ICLR 2026), Proposition 1: horizon length at success threshold *s* given per-step accuracy *p* is `H_s(p) = ⌈ln(s)/ln(p)⌉` — which grows **hyperbolically** as p → 1. Marginal single-step accuracy gains produce *exponential* gains in achievable task length. Short-task benchmarks create "an illusion of slowing progress."

Their measured single-turn execution lengths: GPT-5 >2,100 steps; Claude 4 Sonnet 432; Grok 4 384; Gemini 2.5 Pro 120.

Their key finding for loop architecture is **self-conditioning**: models *"become more likely to make mistakes when the context contains their errors from prior turns,"* and this **does not go away with scale** (though thinking models appear immune). And: *"failures of LLMs when simple tasks are made longer arise from mistakes in execution, rather than an inability to reason."*

> **An unresolved tension worth knowing about:** Manus's production advice is *"leave the wrong turns in the context"* (so the model learns from them). The ICLR paper says errors in context cause self-conditioning degradation that scale does not fix. I found no source that reconciles these. If you're running long loops on a non-thinking model, this is a real, live empirical question — test it on your workload rather than trusting either.

**The number that should set your autonomy budget** — METR's time horizons:

| Model | 50% success horizon | **80% success horizon** | Ratio |
|---|---|---|---|
| Claude Opus 4.5 (Dec 2025) | 4 h 49 min | **27 min** | ~10.7× |
| GPT-5.1-Codex-Max (Dec 2025) | — | **32 min** | — |
| Claude Opus 4.6 (Aug 2026, trade press) | ~12 hours | **~70 min** | ~10× |

METR's headline finding is that the 50% horizon has been *"doubling approximately every 7 months."* But **the horizon you can actually ship is roughly the 80% number**, and historically that's been about an order of magnitude shorter. As of late 2025 it was **under half an hour**. Treat the Aug 2026 figures as trade-press-reported and unverified; METR itself warns that "measurements above 16 hrs are unreliable with our current task suite."

**Practical translation:** if your loop is expected to run unattended for meaningfully longer than the current 80% horizon, you need checkpoints, verification gates, or a human — not because loops are bad, but because that's where the measured reliability is.

### 4.4 The multi-agent debate, resolved

Two named positions, published one day apart in June 2025:

**Cognition, ["Don't Build Multi-Agents"](https://cognition.com/blog/dont-build-multi-agents)** (Walden Yan, 12 Jun 2025). Two principles:
> **"Share context, and share full agent traces, not just individual messages"**
> **"Actions carry implicit decisions, and conflicting decisions carry bad results"**

The Flappy Bird example: subagent 1 builds a Mario-style background while subagent 2 builds an incompatible bird sprite — both received the same prompt, but neither saw the other's *intermediate reasoning*. Yan's observation about Claude Code is the load-bearing one: its subagents are used *"only for answering questions, never parallel work."*

**Anthropic, ["How we built our multi-agent research system"](https://www.anthropic.com/engineering/multi-agent-research-system)** (13 Jun 2025). The opposite case: orchestrator-worker with parallel subagents, +90.2% over single-agent Opus 4. Where they say it works: *"heavy parallelization, information that exceeds single context windows, and interfacing with numerous complex tools."* Where they say it fails: coding tasks, and *"domains requiring all agents to share the same context or involve many dependencies between agents."*

**The resolution** (Harrison Chase, LangChain, 16 Jun 2025) — the operative distinction is **read vs. write**:

- **Read actions parallelize naturally.** Research, retrieval, analysis. No conflicting implicit decisions.
- **Write actions do not.** Parallel writers make incompatible choices you can't merge.

Both camps' own examples fit. Cognition builds a *coding* agent (write-heavy → single loop). Anthropic built a *research* agent (read-heavy → fan out, then funnel synthesis through a single agent for coherence). **They are not disagreeing about architecture; they are describing different workloads.**

**The academic verdict is harsher than either.** The MAST paper ([arXiv:2503.13657](https://arxiv.org/abs/2503.13657), Berkeley — 1,600+ annotated traces, Cohen's κ = 0.88) found failure rates of **41% to 86.7% across 7 open-source multi-agent systems**, and notes that *"performance gains often remain minimal compared to single-agent frameworks or simple baselines like best-of-N sampling."*

Their failure taxonomy is directly actionable:

| Category | Share of failures | Examples |
|---|---|---|
| **Specification / system design** | **44.2%** | Disobey task spec, disobey role spec, step repetition, unaware of termination conditions |
| **Inter-agent misalignment** | **32.3%** | Conversation reset, failure to ask for clarification, task derailment, information withholding |
| **Task verification / termination** | **23.5%** | Premature termination, no or incomplete verification, incorrect verification |

**Read that first row again: 44.2% of multi-agent failures are specification failures — the graph author's bug, not the model's.** That is simultaneously the strongest evidence that graph engineering is hard *and* the strongest evidence that better specification is the highest-leverage fix. Their interventions bear that out: adding a high-level task verification step gained **+15.6%**; improving role specification gained **+9.4%**.

### 4.5 Evaluation and observability — the clean split

**Anthropic's guidance is end-state, not trajectory:**
> "Even with identical starting points, agents might take completely different valid paths to reach their goal. **Instead of judging whether the agent followed a specific process, evaluate whether it achieved the correct final state.**"

They also report starting with about **20 queries** representing real usage, and moving success from **30% to 80%** on prompt changes alone at that sample size. Large effects are visible without large evals. Their LLM-judge finding is worth noting because it's counterintuitive: **a single LLM call with a unified rubric outputting 0.0–1.0 plus pass/fail "was the most consistent and aligned with human judgements"** — not a multi-judge ensemble.

The architectural consequence:

- **Graphs admit trajectory evaluation.** You can assert on node transitions. Unit-testable, CI-friendly.
- **Loops force end-state evaluation.** Path assertions are invalid because valid paths vary.
- **Sierra's counter-move** recovers CI-like guarantees for a nondeterministic system: turn every human-annotated failure into a **regression test**, plus simulation-based scenario coverage. You grow the test set rather than constraining the control flow.
- **A third mode** (from the harness paper): trajectory *metrics* without path assertions — recovery rate, context retention, control lag.

On tracing: a graph gives you span boundaries for free — every node is a natural span. A loop produces a flat, variable-length sequence whose shape is only known post-hoc. Note that the **OpenTelemetry GenAI semantic conventions were still marked "Development," not stable, as of May 2026**, so don't assume portable agent telemetry yet. Relevant operations defined: `invoke_agent`, `execute_tool`, `chat`.

### 4.6 Security and compliance — where the argument stops being aesthetic

OWASP's *State of Agentic AI Security and Governance* (v2.01, reported June 2026) cites Meta's **"Agents Rule of Two"**: of three properties — private data access, untrusted content exposure, external communication — an agent operating **without human approval may satisfy at most two. All three requires a human in the loop.**

**The Rule of Two is a graph constraint.** It is a statement about which edges may exist without a human node in the path. Any deployment that must satisfy it has already conceded that pure open-loop autonomy is out of scope for that workload — which means for regulated domains the loop-vs-graph question is partly answered for you before you start.

Also from that report: of 53 tracked agentic projects, 28 are coding agents; **prompt injection maps to six of the ten categories** in the Top 10 for Agentic Applications.

---

## 5. When to use each

### 5.1 The decision, as a sequence of questions

Run these in order. The first "yes" that lands decides it.

**Q1. Is a wrong action irreversible, expensive, or regulated?**
→ **Graph** (or a loop with a hard gate on that specific action). Money movement, production writes, customer communications, anything in a compliance perimeter. Don't argue with this one.

**Q2. Do you need to pause for a human and resume hours or days later, across a process restart?**
→ **Graph with a checkpointer**, or a durable execution engine. A loop's permission callback is in-process; it does not survive a deploy. `interrupt()` + a Postgres checkpointer does.

**Q3. Can you predict the required steps in advance, and do they rarely change?**
→ **Graph.** If you can draw it on a whiteboard and it stays drawn for six months, encode it. You'll get cheaper, faster, more testable execution. Google's ADK team quantified this on a refund flow: **~50% token reduction and ~20% latency improvement** from moving routing out of the model and into a graph.

**Q4. Is there a cheap, machine-readable verifier for "done"?**
→ **Loop.** This is the single strongest predictor of loop success in Anthropic's own guidance. Tests, a compiler, a linter, a schema validator, a diff that either applies or doesn't. Give the loop an oracle and it closes on its own. **A loop without an oracle is an expensive random walk.**

**Q5. Is the step count unpredictable, or does the path depend on what you find along the way?**
→ **Loop.** Anthropic's definitional case: *"open-ended problems where it's difficult or impossible to predict the required number of steps, and where you can't hardcode a fixed path."* Debugging, research, exploration, migration across a heterogeneous codebase.

**Q6. Is the work read-heavy and genuinely parallelizable?**
→ **Loop with subagent fan-out.** Read actions parallelize; write actions don't.

**Q7. Is the work write-heavy with interdependencies?**
→ **Single deep loop with verification.** Not multi-agent. This is exactly the coding case Anthropic excludes from their own multi-agent recommendation.

**Q8. Is your product's shape still changing week to week?**
→ **Loop.** You cannot afford schema churn during discovery. Buy the flexibility, pay the token premium, add structure once the shape stops moving.

### 5.2 Task archetypes, scored

| Task | Recommended | Why |
|---|---|---|
| Fixing failing tests in a repo | **Loop** | Perfect oracle (tests pass or don't); unpredictable path |
| Multi-source research report | **Loop + read-only subagent fan-out** | Breadth-first, parallelizable reads, synthesis funneled through one agent |
| Customer refund / returns workflow | **Graph** | Regulated, auditable, fixed policy ("only within 30 days"), high stakes |
| Migrating 400 files to a new API | **Loop per file, driven by a script** | Trivially parallel, per-file verifiable; the *fan-out* is a script, the *work* is a loop |
| Loan / claims adjudication | **Graph + durable engine** | Audit trail, HITL approval that survives restarts, versioning of in-flight cases |
| Debugging a flaky production issue | **Loop** | You cannot predict the path; that's the whole task |
| Nightly report generation | **Graph** (or a scripted pipeline) | Same steps every time; no reason to pay a model to re-derive them |
| Onboarding a new data source | **Loop, then freeze into a graph** | Explore with a loop, encode what you learned |
| Content moderation triage | **Graph with routing** | Distinct categories, distinct handlers, needs consistency |
| Agent that operates your production infra | **Graph, or a loop with hard gates** | Rule of Two applies; you cannot ship unbounded autonomy here |

### 5.3 The signals that you chose wrong

**You built a loop and should add graph structure if:**
- You keep adding prompt language to prevent one specific bad action → that wants a `PreToolUse` deny rule, not a paragraph
- Cost variance across runs is more than ~3× and you can't explain it
- You cannot answer "why did it do that?" for a stakeholder
- The same failure recurs and prompt fixes keep not sticking
- Someone asks for an audit trail and you have to say "we have logs"

**You built a graph and should loosen it toward a loop if:**
- You edit the state schema more than once a week
- Most of your nodes are single LLM calls with no branching between them
- You're writing conditional edges that just... call the model to decide, every time
- New requirements consistently mean "add another node" rather than "change a value"
- Your graph has more nodes than your product has features

---

## 6. Setup guide A — building a loop with the Claude Agent SDK

This is the paradigm's reference implementation. Everything below is from current docs at `code.claude.com/docs/en/agent-sdk/*`.

### 6.1 Install

```bash
# Python (3.10+)
python3 -m venv .venv && source .venv/bin/activate
pip install claude-agent-sdk

# TypeScript (Node 18+)
npm init -y && npm pkg set type=module
npm install @anthropic-ai/claude-agent-sdk
npm install --save-dev tsx

export ANTHROPIC_API_KEY=...   # the SDK does NOT load .env automatically
```

Both SDKs bundle a native Claude Code binary, so you generally don't need a separate Claude Code install. Alternative auth via `CLAUDE_CODE_USE_BEDROCK=1`, `CLAUDE_CODE_USE_VERTEX=1`, `CLAUDE_CODE_USE_FOUNDRY=1`.

### 6.2 The smallest useful loop

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions, ResultMessage

async def main():
    async for message in query(
        prompt="Find and fix the failing tests in the auth module",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Edit", "Bash", "Glob", "Grep"],
            setting_sources=["project"],   # load CLAUDE.md, skills, hooks from cwd
            max_turns=30,
            effort="high",
        ),
    ):
        if isinstance(message, ResultMessage):
            print(message.subtype, message.result, message.total_cost_usd)

asyncio.run(main())
```

Three things to notice, because each is a common mistake:

1. **`allowed_tools` auto-approves.** Listing a tool there means it runs without prompting. Tools *not* listed are still available — they just require permission.
2. **`setting_sources` defaults matter.** An empty list means CLAUDE.md is *not loaded*. Since CLAUDE.md is the only thing re-injected on every request (and therefore the only thing that survives compaction), forgetting this quietly breaks long runs.
3. **A single-shot `query()` raises after an error result.** It yields the `ResultMessage` first, *then* raises. Wrap in try/except if your code needs to continue.

### 6.3 `query()` vs. `ClaudeSDKClient`

| | `query()` | `ClaudeSDKClient` (Python) |
|---|---|---|
| Session | New by default | Reused across calls |
| Exchanges | Single | Multiple |
| Interrupts | **Not supported** | Supported |
| Continuation | Manual (`continue_conversation`, `resume`) | Automatic |

TypeScript has no session-holding client object; the `Query` object returned by `query()` *is* the control surface, exposing `interrupt()`, `setPermissionMode()`, `setModel()`, `getContextUsage()`, `rewindFiles()`, and more.

### 6.4 Give the loop tools

In-process custom tools run inside your process as an SDK MCP server — no subprocess:

```python
from typing import Any
from claude_agent_sdk import tool, create_sdk_mcp_server, ClaudeAgentOptions

@tool("query_orders", "Look up orders for a customer by email address",
      {"email": str, "limit": int})
async def query_orders(args: dict[str, Any]) -> dict[str, Any]:
    rows = await db.fetch(args["email"], args.get("limit", 20))
    return {"content": [{"type": "text", "text": format_orders(rows)}]}

orders_server = create_sdk_mcp_server(name="orders", version="1.0.0",
                                      tools=[query_orders])

options = ClaudeAgentOptions(
    mcp_servers={"orders": orders_server},
    allowed_tools=["mcp__orders__query_orders"],
)
```

Tool naming is `mcp__{server}__{tool}`. Wildcards work in allow rules **only after a literal `mcp__<server>__` prefix** — `allowed_tools=["*"]` and `["mcp__*"]` are ignored with a startup warning. Deny rules *do* support both.

**Tool design rules that measurably matter:**

- **Consolidate.** Vercel's `d0` went from 15 specialized tools to **2** (`ExecuteCommand` + `ExecuteSQL`) and got 3.5× faster, 37% cheaper, and went from 80% to 100% success. Their diagnosis of the old design: *"we were doing the model's thinking for it."* Their conclusion: **"The best agents might be the ones with the fewest tools."** (Small n, unpublished eval set — directional, not controlled.)
- **Namespace by service or resource** (`asana_search`, `jira_search`), return semantic names not UUIDs, expose a `response_format` enum so the agent can pick concise vs. detailed.
- **Mark read-only tools.** `readOnlyHint` in annotations is the only annotation with behavioral effect: it lets the tool run in parallel batches. Custom tools default to *sequential*.
- **Errors don't break the loop.** An uncaught exception becomes an error result and the loop continues. Return `isError: true` / `"is_error": True` to compose what Claude actually reads.

### 6.5 Bound the loop

This is the graph-engineering-adjacent part of loop engineering, and where most production hardening lives.

```python
options = ClaudeAgentOptions(
    max_turns=40,
    max_budget_usd=5.00,        # subagent spend counts toward this
    permission_mode="dontAsk",  # hard-deny anything not pre-approved
    allowed_tools=["Read", "Grep", "Glob", "Bash(pytest *)", "Edit"],
    disallowed_tools=["Bash(rm *)", "WebFetch"],
)
```

**Understand the six-step permission evaluation order.** This is the most load-bearing detail in the SDK and the source of the nastiest silent bugs:

1. **Hooks** — can deny outright. A hook `allow` does *not* skip steps 2 and 3.
2. **Deny rules** — block even in `bypassPermissions`.
3. **Ask rules** — fall through to `canUseTool` even in `bypassPermissions`.
4. **Permission mode**
5. **Allow rules**
6. **`canUseTool` callback** — skipped entirely in `dontAsk`.

The trap, quoted from the docs' own warning:

> "**Auto-approved tools never reach `canUseTool`.** A tool call approved at any earlier step... skips your `canUseTool` callback, so permission checks you put there are silently bypassed for that tool. **For checks that must run on every tool call, use a `PreToolUse` hook.**"

And a second one that has bitten people: *"`allowed_tools` does not constrain `bypassPermissions`."* Setting `allowed_tools=["Read"]` alongside `permission_mode="bypassPermissions"` still approves `Bash`, `Write`, and `Edit`.

**The six modes**, ordered by autonomy: `default` → `plan` → `acceptEdits` → `dontAsk` → `auto` → `bypassPermissions`. For headless production, the documented recommendation is `{ allowedTools: [...], permissionMode: "dontAsk" }` — a fixed, explicit tool surface with a hard deny, rather than silent reliance on `canUseTool` being present.

### 6.6 Hooks — deterministic gates inside a nondeterministic loop

Hooks are the mechanism by which you get graph-like guarantees without building a graph. The architecturally important property:

> "**Hooks run in your application process, not inside the agent's context window, so they don't consume context.** Hooks can also short-circuit the loop: a `PreToolUse` hook that rejects a tool call prevents it from executing, and Claude receives the rejection message instead."

```python
from claude_agent_sdk import ClaudeAgentOptions, HookMatcher

async def block_prod_writes(input_data, tool_use_id, context):
    path = input_data["tool_input"].get("file_path", "")
    if path.startswith("/etc") or "prod" in path:
        return {
            "systemMessage": "Protected path — use the staging fixture instead.",
            "hookSpecificOutput": {
                "hookEventName": input_data["hook_event_name"],
                "permissionDecision": "deny",
                "permissionDecisionReason": "Writes to production paths are blocked",
            },
        }
    return {}

options = ClaudeAgentOptions(
    hooks={"PreToolUse": [HookMatcher(matcher="Write|Edit", hooks=[block_prod_writes])]}
)
```

Precedence across multiple hooks: **`deny` > `defer` > `ask` > `allow`.** Any `deny` blocks regardless of other hooks. Multiple matching hooks run **in parallel** with nondeterministic completion order.

Key events: `PreToolUse` (validate/block/rewrite input via `updatedInput`), `PostToolUse` (`additionalContext` appends to the result; `updatedToolOutput` *replaces* it before Claude sees it), `UserPromptSubmit` (inject context), `Stop` (validate the result, block the turn from ending), `SubagentStart`/`SubagentStop`, `PreCompact`. TypeScript supports a substantially larger event set than Python.

The best-practices doc states the value proposition in one line: *"Unlike CLAUDE.md instructions which are advisory, **hooks are deterministic and guarantee the action happens**."*

### 6.7 Subagents — context isolation, not just parallelism

```python
from claude_agent_sdk import ClaudeAgentOptions, AgentDefinition

options = ClaudeAgentOptions(
    allowed_tools=["Read", "Grep", "Glob", "Agent"],   # "Agent" is required!
    agents={
        "evaluator": AgentDefinition(
            description="Independent reviewer. Use to grade work against a spec.",
            prompt="You grade work against the stated spec. Return PASS or NEEDS_WORK "
                   "with specific, correctness-affecting findings only.",
            tools=["Read", "Grep", "Glob"],   # no Write/Edit — it can only judge
            model="sonnet",
        ),
    },
)
```

**The isolation contract is the whole point:**

| Subagent receives | Subagent does NOT receive |
|---|---|
| Its own system prompt + the Agent tool's prompt string | The parent's conversation history or tool results |
| Project CLAUDE.md (via `settingSources`) | Preloaded skill content unless listed in `AgentDefinition.skills` |
| Tool definitions (inherited or the `tools` subset) | The parent's system prompt |

> "The only content you pass from parent to subagent is the Agent tool's prompt string, so include any file paths, error messages, or decisions the subagent needs directly in that prompt."

> "Only its final message returns to the parent... The main agent's context grows by that summary, not by the full subtask transcript."

That last line is why subagents are a *context management* tool first and a parallelism tool second. And it's exactly the property Cognition warns about: the subagent's intermediate reasoning is invisible to everyone else. **Read-only fan-out is safe. Write fan-out is where the Flappy Bird problem lives.**

Default fan-out caps: depth **3** layers (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`), concurrency **20** (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`), spend via `max_budget_usd`.

### 6.8 Close the loop with verification

The four gates, from weakest to strongest, with code.

**Gate 1 — in the prompt.** Free, weakest. "Run `pytest` and fix failures until it passes; show me the output."

**Gate 2 — `/goal`, a session-scoped evaluator.** Mechanically it's a wrapper around a prompt-based `Stop` hook: after every turn, your condition plus the conversation go to a small fast model returning **Not yet met** (Claude keeps working, the reason becomes guidance), **Met**, or **Impossible**. Constraints: condition ≤ **4,000 characters**; the evaluator *"doesn't run commands or read files independently, so write the condition as something Claude's own output can demonstrate."* There's an anti-stall guard — if Claude keeps answering the evaluator without tool use for several turns, the loop stops and returns control to you.

```
/goal every feature in PROGRESS.md is implemented, committed, and its tests pass
```

**Gate 3 — a `Stop` hook running a real script.** Deterministic. Note the escape valve: **Claude Code overrides the hook and ends the turn after 8 consecutive blocks.**

```python
async def require_green_tests(input_data, tool_use_id, context):
    proc = await asyncio.create_subprocess_exec("pytest", "-q",
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT)
    out, _ = await proc.communicate()
    if proc.returncode != 0:
        return {"decision": "block",
                "reason": f"Tests still failing:\n{out.decode()[-4000:]}"}
    return {}

options = ClaudeAgentOptions(hooks={"Stop": [HookMatcher(hooks=[require_green_tests])]})
```

**Gate 4 — a fresh-context adversarial evaluator.** A subagent with **no Write/Edit tools** that grades from a context window which never saw the build. This exists specifically to defeat self-preferential bias, which Anthropic documents as models *"confidently praising the work—even when quality is obviously mediocre."*

One counter-warning from the best-practices doc that will save you from over-engineering:

> "A reviewer prompted to find gaps will usually report some, even when the work is sound, because that is what it was asked to do. Chasing every finding leads to over-engineering... **Tell the reviewer to flag only gaps that affect correctness or the stated requirements.**"

### 6.9 The default-FAIL contract

The strongest single pattern from Anthropic's long-running-agents reference repo (`github.com/anthropics/cwc-long-running-agents`). Three primitives:

1. **Default-FAIL contract.** A `test-results.json` where every criterion starts `false`. The agent cannot flip a criterion to `true` without first opening evidence — enforced by a `PreToolUse` hook that counts evidence reads.
2. **Fresh-context evaluator.** A no-write subagent that grades the most recent commit and returns `PASS` / `NEEDS_WORK`.
3. **Agent-maintained handoff.** `PROGRESS.md` re-read on restart, git commits at checkpoints, **a fresh session per feature**.

The whole loop, as a shell script:

```bash
while grep -q '"passes": false' test-results.json; do
  claude -p "Read PROGRESS.md and build the next unfinished feature per CLAUDE.md."
  VERDICT=$(claude --agent evaluator -p "Review the most recent commit against its spec.")
  [ "$(echo "$VERDICT" | head -1)" = "PASS" ] || echo "$VERDICT" > NEXT_FINDINGS.md
done
```

Look at what that script is. **It's a graph.** A two-node cycle with a conditional edge and an externalized state file. Written in bash, in seven lines, with no framework. That's the honest version of the hybrid.

Operator controls worth copying: a `kill-switch.sh` hook that halts every tool call while an `AGENT_STOP` file exists, and a `steer.sh` hook that surfaces `STEER.md` mid-run so you can redirect a running loop without killing it.

### 6.10 Force determinism where you need it

**Structured output** converts the loop's final answer into a validated object:

```python
options = ClaudeAgentOptions(
    output_format={"type": "json_schema", "schema": my_schema}   # draft-07
)
# read from: message.structured_output
```

Gotchas: schemas validate against **JSON Schema draft-07** (Zod defaults to 2020-12, so use `z.toJSONSchema(S, { target: "draft-7" })`). The SDK re-prompts on mismatch and eventually yields `error_max_structured_output_retries`. **A `success` result can still have no `structured_output`** — the docs say treat that as a failure. And `format` annotations like `"email"` are accepted but **not enforced**.

**Fan out with a script, not a prompt.** The classic pattern, and still the right answer for "do this same thing to 400 files":

```bash
for file in $(cat files.txt); do
  claude -p "Migrate $file from React to Vue. Return OK or FAIL." \
    --allowedTools "Edit,Bash(git commit *)"
done
```

The orchestration is a `for` loop in bash — deterministic, resumable, trivially parallelizable with `xargs -P`. The intelligence is in each invocation. This is the highest value-per-line pattern in the entire document.

---

## 7. Setup guide B — building a graph

Two routes here, and you should know both: the framework route (LangGraph), and the SDK-native route (graph structure written in plain code around Agent SDK calls). Given your stack, the second is probably more relevant — but the first is the industry reference and worth understanding.

### 7.1 Route 1: LangGraph

```bash
pip install langgraph langchain
# langgraph 1.2.11 / langchain 1.3.15 as of Aug 2026 (current on main)
pip install langgraph-checkpoint-postgres   # for production persistence
```

**Version warnings that will save you hours.** LangChain/LangGraph 1.0 GA'd 22 October 2025 and the API surface moved substantially. Most tutorials you'll find are subtly wrong:

| Stale (in most tutorials) | Current |
|---|---|
| `MemorySaver` | `InMemorySaver` |
| `from langchain_core.messages import ...` | `from langchain.messages import ...` |
| `create_react_agent` from `langgraph.prebuilt` | `create_agent` from `langchain.agents` |
| `MessageGraph` | `StateGraph` with a `messages` key (removal in v2.0.0) |
| `checkpoint_during=` | `durability=` |
| `config_type=` / `config_schema()` | `context_schema=` / `get_context_jsonschema()` |
| `stream(..., subgraphs=True)` | `stream_events(..., version="v3").subgraphs` |

*(One correction to a widely repeated claim: `create_react_agent` is soft-deprecated in the docs but still exported without a deprecation decorator in `langgraph-prebuilt` 1.1.0. It works; it's just no longer the blessed path.)*

**A complete evaluator-optimizer graph** — the pattern most worth having in your pocket, because it's the graph shape that a loop can't cleanly express:

```python
from typing import Annotated, Literal
import operator
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.postgres import PostgresSaver

class State(TypedDict):
    task: str
    draft: str
    feedback: str
    attempts: Annotated[int, operator.add]

def generate(state: State) -> dict:
    prior = f"\nPrevious feedback: {state.get('feedback','')}" if state.get("feedback") else ""
    return {"draft": llm.invoke(f"{state['task']}{prior}").content, "attempts": 1}

def evaluate(state: State) -> dict:
    verdict = judge_llm.with_structured_output(Verdict).invoke(
        f"Grade this against the spec.\nSpec: {state['task']}\nDraft: {state['draft']}"
    )
    return {"feedback": verdict.feedback if not verdict.passes else ""}

def route(state: State) -> Literal["generate", "__end__"]:
    if not state["feedback"]:
        return END
    if state["attempts"] >= 3:          # hard bound — the graph's job
        return END
    return "generate"

builder = StateGraph(State)
builder.add_node("generate", generate)
builder.add_node("evaluate", evaluate)
builder.add_edge(START, "generate")
builder.add_edge("generate", "evaluate")
builder.add_conditional_edges("evaluate", route)

with PostgresSaver.from_conn_string(DB_URI) as checkpointer:
    checkpointer.setup()
    graph = builder.compile(checkpointer=checkpointer)
    result = graph.invoke({"task": "..."}, {"configurable": {"thread_id": "run-1"}})
```

Note what the graph is contributing that a prompt cannot: **`attempts >= 3` is enforced structurally.** The model cannot talk its way past it. That's the entire value proposition in one line.

**Add a human gate:**

```python
from langgraph.types import interrupt, Command

def human_approval(state: State) -> Command[Literal["publish", "generate"]]:
    decision = interrupt({"question": "Publish this draft?", "draft": state["draft"]})
    return Command(goto="publish" if decision == "approve" else "generate")

# Run 1 (pauses at the interrupt, persists, process may exit):
graph.invoke({"task": "..."}, config)
# Run 2 (hours or days later, different process):
graph.invoke(Command(resume="approve"), config)
```

Remember: **the node re-executes from the top on resume.** Put side effects after the `interrupt()` call or in their own node.

**The Functional API** is LangGraph's own concession that the graph DSL isn't always worth it — control flow is ordinary Python, no state schema, no reducers, but you keep checkpointing and `interrupt()`:

```python
from langgraph.func import entrypoint, task
from langgraph.checkpoint.memory import InMemorySaver

@task
def expensive_step(x): ...

@entrypoint(checkpointer=InMemorySaver())
def my_workflow(inp: dict) -> int:
    if inp["needs_review"]:
        approval = interrupt({"item": inp})
    return expensive_step(inp).result()
```

If you want durability without the topology tax, start here rather than with `StateGraph`.

### 7.2 Route 2: graph structure around the Agent SDK

You do not need LangGraph to do graph engineering. If your stack is the Claude Agent SDK, the graph is your own code, and each node is a bounded `query()` call.

**Pattern: routing.** A cheap classifier picks the branch; each branch is a separately-configured agent with its own tools and system prompt. This is the highest-ROI graph pattern and it's about 30 lines.

```python
from claude_agent_sdk import query, ClaudeAgentOptions, ResultMessage

ROUTES = {
    "billing":   ClaudeAgentOptions(system_prompt=BILLING_PROMPT,
                                    mcp_servers={"billing": billing_server},
                                    allowed_tools=["mcp__billing__lookup"],
                                    max_turns=10),
    "technical": ClaudeAgentOptions(system_prompt=TECH_PROMPT,
                                    allowed_tools=["Read", "Grep", "WebSearch"],
                                    max_turns=25),
    "escalate":  None,   # a terminal node that hands to a human
}

async def classify(text: str) -> str:
    async for m in query(
        prompt=f"Classify into billing|technical|escalate. Reply with one word.\n\n{text}",
        options=ClaudeAgentOptions(model="claude-haiku-4-5", tools=[], max_turns=1),
    ):
        if isinstance(m, ResultMessage) and m.subtype == "success":
            return m.result.strip().lower()
    return "escalate"

async def handle(text: str):
    route = await classify(text)
    if route not in ROUTES or ROUTES[route] is None:
        return await escalate_to_human(text)
    async for m in query(prompt=text, options=ROUTES[route]):
        if isinstance(m, ResultMessage):
            return m
```

That's a graph: three nodes, one conditional edge, a typed decision, a terminal node. No framework, no state schema, no compile step. And it inherits every property you actually wanted — the model cannot invent a fourth route, each branch has a minimal tool surface, and the classifier runs on a cheap model.

**Pattern: orchestrator-worker with a script holding the plan.** The Agent SDK's `Workflow` tool formalizes this, and its docs contain the cleanest statement of the whole loop/graph distinction I've found. The difference between subagents and workflows is **"who holds the plan"** — Claude turn-by-turn, or the script:

> "A workflow moves the plan into code... A workflow script holds the loop, the branching, and the intermediate results itself, **so Claude's context holds only the final answer.**"

The resume semantics also encode a real design lesson: *"Replay follows the order agents started. Cached results stop at the first agent that didn't finish, and every agent that started after that one runs again"* — hence **"A workflow that fans work out across many small agents therefore preserves more progress than one long agent."** Small nodes checkpoint better. That's true of every graph system, and it's a good default bias.

**Pattern: the deterministic outer loop.** Often the best graph is a `while` in your own code, with an externalized state file and a fresh agent session per iteration:

```python
import json, asyncio
from claude_agent_sdk import query, ClaudeAgentOptions, ResultMessage

async def run_until_done(max_iterations: int = 20):
    for i in range(max_iterations):
        state = json.load(open("progress.json"))
        pending = [f for f in state["features"] if not f["passes"]]
        if not pending:
            return "complete"

        # Node A: build (fresh context each iteration — defeats goal drift)
        async for m in query(
            prompt=f"Read progress.json. Implement exactly one feature: {pending[0]['name']}. "
                   f"Commit when its tests pass.",
            options=ClaudeAgentOptions(allowed_tools=["Read","Edit","Write","Bash"],
                                       setting_sources=["project"],
                                       max_turns=50, max_budget_usd=3.00),
        ):
            pass

        # Node B: independent evaluation (no write tools, never saw the build)
        verdict = None
        async for m in query(
            prompt=f"Review the most recent commit against the spec for "
                   f"'{pending[0]['name']}' in progress.json. Reply PASS or NEEDS_WORK: <reason>.",
            options=ClaudeAgentOptions(allowed_tools=["Read","Grep","Glob","Bash(git *)"],
                                       max_turns=15),
        ):
            if isinstance(m, ResultMessage) and m.subtype == "success":
                verdict = m.result

        # Conditional edge
        if verdict and verdict.startswith("PASS"):
            mark_passing(pending[0]["name"])
        else:
            open("NEXT_FINDINGS.md", "w").write(verdict or "evaluation failed")
    return "max_iterations_reached"
```

This gets you: a bounded outer loop, fresh context per feature (which is the documented defense against goal drift and compaction amnesia), an independent evaluator that structurally cannot grade its own work, externalized durable state, per-iteration budget caps, and a resumable process. **You have bought roughly 80% of what a graph framework offers, in ~35 lines, with zero new dependencies.**

For the remaining 20% — exactly-once side effects, waits measured in days, versioning of in-flight runs — reach for a durable execution engine, not a graph library. Those are different products, per §3.6.

---

## 8. Hybrids — where this actually lands

Every major vendor now ships both paradigms. This is documented fact, not forecast:

| Direction | Evidence | Date |
|---|---|---|
| Loop company → graph | **OpenAI ships AgentKit** with Agent Builder: "a visual canvas for creating and versioning multi-agent workflows" — nodes for Agent, Guardrails, MCP, User approval | Oct 2025 |
| Graph company → loop | **LangChain ships Deep Agents** using "the same core tool calling loop as other agent frameworks," with LangGraph relegated to durable *runtime* | Apr 2026 |
| Graph company → loop harness | **Microsoft** ships a first-class Agent Harness + CodeAct; declares handoff *edges* but compiles them into *tools* | Jun 2026 |
| Loop company → durable execution | **Temporal + OpenAI Agents SDK** integration for durable state, retries, audit trails | Jul 2025 |

LangChain's own framing of the endpoint is the best one-liner in the corpus:

> **"To build a good agent, you need a good harness. To deploy that agent, you need a good runtime."**

### The four hybrid patterns worth knowing

**1. Graph shell, loop nodes.** The outer topology is fixed and auditable; each node is an unconstrained agent with a tool budget. This is Deep Agents, and it's the default enterprise answer. Use when the *business process* is stable but the *work inside each step* isn't.

**2. Loop shell, deterministic sub-workflows as tools.** The agent runs free, but the expensive/risky operations are single tool calls into code you wrote and tested. This is the pattern most teams should start from. The Agent SDK's `Workflow` tool is exactly this: the model chooses to invoke a workflow, and the workflow's script holds the branching.

**3. Code as the graph — CodeAct.** The most important structural development of 2025–26, and it isn't captured by the loop/graph dichotomy at all. Instead of a tool-choose-wait-choose loop, the model emits **a single program** that calls tools, executed once in a sandbox. Microsoft measured **−63.9% tokens and −52.4% latency** on a multi-step workload. Anthropic's code-execution-with-MCP is the same idea: **150,000 → 2,000 tokens (−98.7%)**, with intermediate results staying in the execution environment rather than flowing through the context window twice.

> **Name the pattern:** the deterministic sub-workflow has migrated from *framework graph* to *program the model writes at runtime*. The determinism is preserved; the authorship moves from human to model.

**4. Graph-shaped constraints applied without breaking the loop.** Manus's logit masking is the elegant version: a *"context-aware state machine to manage tool availability"* implemented by **masking logits during decoding** rather than editing tool definitions. You get a state machine's action-space restriction while keeping the prompt prefix — and therefore the 10× KV-cache discount — intact.

Sierra's version is a product decision rather than a technique: **determinism as a per-workflow dial** — *"Define the degree of flexibility your agent should exhibit for each workflow."* Their governing principle is the sentence I'd put on the wall of any team shipping customer-facing agents:

> Agents should be "creative, but in the moments that matter... **deterministic safeguards ensure that your business logic is strictly and deterministically enforced.**"

### How to bound a loop, comprehensively

| Mechanism | Concrete instance |
|---|---|
| Turn cap | `max_turns` |
| Spend cap | `max_budget_usd` (includes subagents) |
| Deterministic gate | `Stop` hook running your test suite |
| Externalized completion criteria | `/goal`, or a default-FAIL `test-results.json` |
| Action-space restriction | `disallowed_tools` with scoped rules; logit masking |
| Approval on write actions | `PreToolUse` hook → `"ask"` or `"deny"` |
| Autonomy budget | Meta's Rule of Two: at most 2 of {private data, untrusted content, external comms} |
| Credential scoping | Dedicated test org with a hard spend cap (Willison's example: a Fly.io org capped at $5) |
| Sandboxing | Containers; Hyperlight micro-VMs; disposable Codespaces |
| Fresh context per unit of work | New session per feature; `/clear` after two corrections |
| Checkpoint + resume | `enable_file_checkpointing`, git commits, session resume |
| Kill switch | Hook that halts all tool calls while a sentinel file exists |

Simon Willison's framing is the one to internalize: loops work when the agent has a **verification signal**. The tasks best suited to loops are trial-and-error tasks with measurable outcomes — debugging, performance optimization, dependency upgrading. MAST's data backs it: 23.5% of multi-agent failures are verification failures, and adding a verification step to one system gained **+15.6%**.

---

## 9. What to actually believe

### Well-evidenced

1. **Harness choice dominates architecture choice.** Up to 34 points of spread on the same model from scaffold alone; ~7.8× harness-to-model variance ratio ([arXiv:2605.23950](https://arxiv.org/abs/2605.23950)). Corroborated: LangChain reports +13.7 points on Terminal-Bench 2.0 "through harness engineering alone," and `mini-swe-agent` — **100 lines, no config framework** — scores >74% on SWE-bench Verified. **Most published loop-vs-graph comparisons are confounded.**
2. **Read vs. write is the operative axis for multi-agent, not agent count.** Best-supported synthesis of the Cognition/Anthropic debate; both camps' own examples fit it.
3. **Externalized structured state is the strongest predictor of long-horizon success.** YC-Bench (arXiv:2604.01212, Apr 2026): scratchpad usage was *the* strongest predictor of success; top performers rewrote scratchpads ~34× per run. Vending-Bench found failures *"do not stem from memory limits"* — long-horizon incoherence is not a context-length bug.
4. **Shippable autonomy is roughly 10× shorter than headline autonomy.** METR's 50% vs. 80% horizons.
5. **Nearly half of multi-agent failures are specification failures** (MAST FC1: 44.2%) — the author's bug, not the model's.
6. **The dominant cost lever is prompt-prefix stability, not architecture.** Manus: 10× cache delta on a ~100:1 input:output ratio.
7. **All major vendors now ship both paradigms.** Convergence is documented, not predicted.

### Opinion, clearly labeled

- *"It's an LLM, a loop, and enough tokens"* — Thorsten Ball (Sourcegraph), demonstrating a working code-editing agent in under 400 lines with three tools. A real practitioner's position, not a measured claim.
- *"Scaffolding is coping not scaling"* — Thibault Sottiaux (OpenAI Codex, Jan 2026): *"It's called a harness because you're scaffolding it in a way where you want to remove the scaffold over time."* One supporting anecdote (context compaction moved from heuristic scaffolding into training).
- Anthropic's version of the same bet: *"Smarter models require less prescriptive engineering, allowing agents to operate with more autonomy."* Note they published this **in the same post** that introduced three new scaffolding techniques. Both things are true; the scaffolding is shrinking and moving, not disappearing.
- Gartner's *"over 40% of agentic AI projects will be canceled by the end of 2027"* is an analyst forecast, not a measurement. Their "agent washing" estimate — that of thousands of self-described agentic vendors, *"only about 130 are real"* — is a useful corrective when reading marketing.
- Addy Osmani's line is the best one-sentence summary of the risk: **"a loop running unattended is also a loop making mistakes unattended."**

### Genuinely open questions

- **Manus says "leave the wrong turns in the context." ICLR 2026 says errors in context cause self-conditioning degradation that scale does not fix.** No source reconciles these. Test it on your workload.
- **The 50%:80% horizon ratio may be compressing** (10:1 → ~5:1 per Aug 2026 trade press). If real, it's the single most consequential trend here — it determines whether graph-shaped guardrails are a permanent requirement or a transitional one.
- **There is no published, quantified production migration study in either direction.** I looked hard. The Vercel `d0` post (tool-graph → 2-tool loop, with numbers) is the only verifiable architecture-change case study I found, and its eval set isn't published. **The loop-vs-graph debate is currently argued from framework docs, benchmarks, and opinion posts — not from published production migrations.** Anyone claiming otherwise should be asked for citations. Treat that scarcity as a finding in itself.

---

## 10. The recommendation

For someone building now and learning as they go:

1. **Build a loop first.** Claude Agent SDK, three to five well-designed tools, a real system prompt, `max_turns` and `max_budget_usd` set from day one. You'll have something working in an afternoon.
2. **Find your oracle immediately.** Tests, a linter, a schema check, a diff that applies. If you cannot articulate a machine-checkable "done," stop and fix that before writing more agent code. This matters more than the architecture.
3. **Instrument before you optimize.** Log every trajectory. You cannot reason about failure modes you haven't seen, and the failure table in §2.4 only helps if you can match against it.
4. **Add structure at the failure points, one at a time.** A `PreToolUse` deny rule where a wrong action is expensive. A `Stop` hook where "looks done" isn't good enough. A fresh-context evaluator where self-preferential bias shows up. Each of these is a graph edge you added without adopting a graph framework.
5. **Reach for a real graph framework when you can name the specific thing it gives you** — usually durable HITL across process restarts, or an auditable topology a regulator will read. "It feels more principled" is not that thing.
6. **Reach for a durable execution engine when the requirement is exactly-once, day-long waits, or versioning in-flight runs.** That's a different purchase from a graph, and conflating them is the most common architecture mistake in this space.

The thing that will make your agents good is not the shape of the control flow. It's the tools, the context, and the verification signal. Both paradigms are just different ways of arranging those three things — and the evidence says the arrangement matters roughly 8× less than the quality.

---

## Sources

**Anthropic — engineering**
- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) (19 Dec 2024)
- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) (13 Jun 2025)
- [Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents) (11 Sep 2025)
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (29 Sep 2025)
- [Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) (4 Nov 2025)
- [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) (26 Nov 2025)
- [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) (9 Jan 2026)
- [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) (24 Mar 2026)

**Anthropic — blog & docs**
- [Loop engineering: getting started with loops](https://claude.com/blog/getting-started-with-loops) (30 Jun 2026)
- [A harness for every task: dynamic workflows in Claude Code](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code) (2 Jun 2026)
- [Building verification loops in Claude Code with skills](https://claude.com/blog/building-verification-loops-in-claude-code-with-skills) (22 Jul 2026)
- [How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop) · [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works) · [Best practices](https://code.claude.com/docs/en/best-practices)
- Agent SDK: [subagents](https://code.claude.com/docs/en/agent-sdk/subagents) · [hooks](https://code.claude.com/docs/en/agent-sdk/hooks) · [permissions](https://code.claude.com/docs/en/agent-sdk/permissions) · [custom tools](https://code.claude.com/docs/en/agent-sdk/custom-tools) · [tool search](https://code.claude.com/docs/en/agent-sdk/tool-search) · [structured outputs](https://code.claude.com/docs/en/agent-sdk/structured-outputs) · [sessions](https://code.claude.com/docs/en/agent-sdk/sessions)
- [github.com/anthropics/cwc-long-running-agents](https://github.com/anthropics/cwc-long-running-agents)

**LangChain / LangGraph**
- [3 Years of Graph Engineering with LangGraph](https://www.langchain.com/blog/3-years-of-graph-engineering-with-langgraph) (22 Jul 2026)
- [How and when to build multi-agent systems](https://www.langchain.com/blog/how-and-when-to-build-multi-agent-systems) (16 Jun 2025)
- [The Runtime Behind Production Deep Agents](https://www.langchain.com/blog/runtime-behind-production-deep-agents) (20 Apr 2026)
- Docs: [graph API](https://docs.langchain.com/oss/python/langgraph/graph-api) · [persistence](https://docs.langchain.com/oss/python/langgraph/persistence) · [human-in-the-loop](https://docs.langchain.com/oss/python/langgraph/add-human-in-the-loop) · [workflows & agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) · [functional API](https://docs.langchain.com/oss/python/langgraph/functional-api)

**Durable execution**
- [Temporal workflow definition](https://docs.temporal.io/workflow-definition) · [limits](https://docs.temporal.io/workflow-execution/limits) · [OpenAI Agents SDK cookbook](https://docs.temporal.io/ai-cookbook/openai-agents-sdk-python)
- [Restate: what is durable execution](https://restate.dev/what-is-durable-execution) · [durable agents](https://docs.restate.dev/ai/patterns/durable-agents)
- [Inngest steps](https://www.inngest.com/docs/learn/inngest-steps) · [AgentKit routers](https://agentkit.inngest.com/concepts/routers)

**Papers**
- [Stop Comparing LLM Agents Without Disclosing the Harness](https://arxiv.org/abs/2605.23950) (7 May 2026)
- [Why Do Multi-Agent LLM Systems Fail? (MAST)](https://arxiv.org/abs/2503.13657) (Mar 2025, v3 Oct 2025)
- [The Illusion of Diminishing Returns](https://arxiv.org/abs/2509.09677) (Sep 2025, ICLR 2026)
- [τ-bench](https://arxiv.org/abs/2406.12045) · [Vending-Bench](https://arxiv.org/abs/2502.15840) · [YC-Bench](https://arxiv.org/html/2604.01212) · [Terminal-Bench 2.0](https://arxiv.org/abs/2601.11868)
- [METR: Measuring AI Ability to Complete Long Tasks](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) · [time horizons](https://metr.org/time-horizons/)

**Practitioners & production**
- [Cognition: Don't Build Multi-Agents](https://cognition.com/blog/dont-build-multi-agents) (12 Jun 2025)
- [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) (Dex Horthy)
- [Vercel: We removed 80% of our agent's tools](https://vercel.com/blog/we-removed-80-percent-of-our-agents-tools) (22 Dec 2025)
- [Manus: Context Engineering for AI Agents](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus) (18 Jul 2025)
- [Sourcegraph/Amp: How to Build an Agent](https://ampcode.com/notes/how-to-build-an-agent) (15 Apr 2025)
- [Sierra: The Agent Development Life Cycle](https://sierra.ai/blog/agent-development-life-cycle)
- [Simon Willison: Designing Agentic Loops](https://simonwillison.net/2025/Sep/30/designing-agentic-loops/) (30 Sep 2025)
- [Armin Ronacher: Agents Are Hard](https://lucumr.pocoo.org/2025/11/21/agents-are-hard/) (21 Nov 2025)
- [LinkedIn Hiring Assistant (QCon)](https://www.infoq.com/presentations/LinkedIn-agent-hiring-assistant/)
- [Microsoft Agent Framework at BUILD 2026](https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-at-build-2026-announce/) · [OpenAI AgentKit](https://openai.com/index/introducing-agentkit/) · [Google: Why we built ADK 2.0](https://developers.googleblog.com/why-we-built-adk-20/)

---

*A note on verification: I read the primary sources directly rather than relying on summaries, and flagged claims I could not confirm. Two things I could not verify and would not cite as fact: the widely-circulated "39% improvement / 84% token reduction" figures for the memory tool plus context editing (neither doc page contains benchmark numbers), and the August 2026 METR horizon figures for the newest models (trade press only). Where a source is a competing vendor or a single practitioner's blog, I said so.*

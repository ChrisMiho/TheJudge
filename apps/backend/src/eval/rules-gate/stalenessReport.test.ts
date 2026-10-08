import { beforeAll, describe, expect, it } from "vitest"
// The report calls the loader's one stale comparison and the request builder the
// whole corpus shares, by static import of the real .mjs modules (REQ-185, A3).
import {
  compareSnapshot,
  computeSnapshot,
  loadGoldCases,
  loadSnapshotSources,
  type GoldCase,
  type SnapshotSources
} from "../../../../../scripts/lib/gold-cases.mjs"
import {
  buildCaseRequest,
  loadPromptResources,
  type PromptResources
} from "../../../../../scripts/lib/prompt-fidelity.mjs"
import { askAiRequestSchema } from "../../validation/askAiRequest.js"
import { buildCaseQueryText, hashQueryText, loadFrozenVectors, type FrozenVectorFile } from "./frozenVectors.js"
import { buildStalenessReport, formatStalenessReport } from "./stalenessReport.js"

let corpus: GoldCase[]
let sources: SnapshotSources
let resources: PromptResources
let committedVectors: FrozenVectorFile

beforeAll(async () => {
  corpus = await loadGoldCases()
  sources = await loadSnapshotSources()
  resources = await loadPromptResources()
  committedVectors = loadFrozenVectors()
})

// Snapshots and vector hashes recomputed from the data as it stands, so "unchanged data" never
// depends on the committed files matching a later data refresh: this test must never be the thing
// that blocks the weekly `data:refresh-pr`.
function unchangedCases(): GoldCase[] {
  return corpus.map((caseEntry) => ({ ...caseEntry, snapshot: computeSnapshot(caseEntry, sources) }))
}

// The vector builder writes no vector for a rejected case (it is never scored), so the "unchanged"
// vector file skips rejected cases the same way instead of reading a vector that was never frozen.
function unchangedVectors(cases: GoldCase[]): FrozenVectorFile {
  return Object.fromEntries(
    cases
      .filter((caseEntry) => caseEntry.review.status !== "rejected")
      .map((caseEntry) => {
        const request = askAiRequestSchema.parse(buildCaseRequest(caseEntry))
        const queryTextHash = hashQueryText(buildCaseQueryText(request, resources.cardDetailIndex))
        return [caseEntry.id, { queryTextHash, vector: committedVectors[caseEntry.id].vector }]
      })
  )
}

function report(cases: GoldCase[], vectors: FrozenVectorFile) {
  return buildStalenessReport({ cases, sources, compareSnapshot, resources, vectors, buildRequest: buildCaseRequest })
}

describe("Backend - Eval - staleness report (REQ-225)", () => {
  it("is clean on unchanged data: nothing stale, nothing awaiting a re-freeze", () => {
    const cases = unchangedCases()
    const result = report(cases, unchangedVectors(cases))
    expect(result.stale).toEqual([])
    expect(result.awaitingRefreeze).toEqual([])
    expect(result.missingVector).toEqual([])
    expect(result.checked).toBe(cases.filter((caseEntry) => caseEntry.review.status !== "rejected").length)
    expect(formatStalenessReport(result)).toContain("Stale cases: none")
    expect(formatStalenessReport(result)).toContain("Awaiting a query-vector re-freeze: none.")
  })

  it("lists a case whose ruling hash changed as stale, naming the dependency, and a case whose query text changed as awaiting a re-freeze", () => {
    const [first, second, third] = unchangedCases()
    const withChangedRuling: GoldCase = {
      ...first,
      snapshot: { ...first.snapshot, dependsOnHashes: { ...first.snapshot.dependsOnHashes, rulings: "0".repeat(64) } }
    }
    const cases = [withChangedRuling, second, third]
    const vectors = unchangedVectors(cases)
    vectors[second.id] = { ...vectors[second.id], queryTextHash: "f".repeat(64) }

    const result = report(cases, vectors)

    expect(result.stale).toEqual([{ id: first.id, status: first.review.status, changed: ["rulings"] }])
    expect(result.awaitingRefreeze).toEqual([second.id])
    const text = formatStalenessReport(result)
    expect(text).toContain(`${first.id} (${first.review.status}): rulings text changed`)
    expect(text).toContain(`  ${second.id}`)
    expect(text).toContain("never edits a case and never fails a build")
  })

  it("names every dependency that changed, skips rejected cases, and lists a missing vector without failing", () => {
    const [first, second] = unchangedCases()
    const allChanged: GoldCase = {
      ...first,
      snapshot: {
        ...first.snapshot,
        dependsOnHashes: { rules: "1".repeat(64), oracle: "2".repeat(64), rulings: "3".repeat(64) }
      }
    }
    const rejected: GoldCase = {
      ...second,
      id: "rejected-and-stale",
      review: { status: "rejected", reviewedOn: "2026-10-06" },
      snapshot: allChanged.snapshot
    }
    const cases = [allChanged, rejected]
    const vectors = Object.fromEntries(Object.entries(unchangedVectors([allChanged])).filter(([id]) => id !== first.id))

    const result = report(cases, vectors)

    expect(result.checked).toBe(1)
    expect(result.stale).toEqual([
      { id: first.id, status: first.review.status, changed: ["rules", "oracle", "rulings"] }
    ])
    expect(result.missingVector).toEqual([first.id])
    expect(formatStalenessReport(result)).toContain("No frozen vector at all (1; the offline gate fails these)")
  })
})

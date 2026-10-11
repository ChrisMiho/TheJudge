# Findings — does the cited rule reach Luna's prompt?

Free check, 2026-10-10, `npm run eval:worked-solutions -- --suite rulesguru` on `main` (`9a9852dc`), embedding provider `local`. Counts only (privacy rules: no question text, ids or per-question results).

## Headline

- 1,184 questions selected (1,245 usable minus 61 tagged unsupported-answer).
- **Any** rule the question cites reached the prompt: **288 (24%)**.
- **Every** cited rule reached the prompt: **126 (11%)**.

## Caveat before reading this as a problem

"Reached" counts only the rule excerpts retrieval selects (`retrieval.selectedRuleIds`). It does not count rules Luna already knows from training or the fixed reference text in every prompt. Luna answers 101 of 108 hard cases and 43 of 44 ordinary cases with similar retrieval, so a missing excerpt is not by itself a wrong answer. Only the paid suite run shows whether misses cluster where the rule never arrived.

## Full breakdown

```
Any cited rule group reached: 288/1184
Every cited rule group reached: 126/1184

By level:
  0: 134 cases, any cited rule reached 26, every cited rule reached 17
  1: 482 cases, any cited rule reached 111, every cited rule reached 46
  2: 362 cases, any cited rule reached 92, every cited rule reached 35
  3: 147 cases, any cited rule reached 42, every cited rule reached 23
  corner: 59 cases, any cited rule reached 17, every cited rule reached 5

By complexity:
  simple: 1092 cases, any cited rule reached 275, every cited rule reached 121
  intermediate: 86 cases, any cited rule reached 13, every cited rule reached 5
  complicated: 6 cases, any cited rule reached 0, every cited rule reached 0

By Comprehensive Rules section (a case counts under each section it cites):
  100: 4 cases, any cited rule reached 1, every cited rule reached 1
  101: 16 cases, any cited rule reached 2, every cited rule reached 0
  102: 2 cases, any cited rule reached 0, every cited rule reached 0
  103: 20 cases, any cited rule reached 13, every cited rule reached 11
  104: 11 cases, any cited rule reached 1, every cited rule reached 0
  105: 4 cases, any cited rule reached 0, every cited rule reached 0
  106: 19 cases, any cited rule reached 12, every cited rule reached 9
  107: 25 cases, any cited rule reached 2, every cited rule reached 1
  108: 4 cases, any cited rule reached 0, every cited rule reached 0
  109: 17 cases, any cited rule reached 0, every cited rule reached 0
  110: 7 cases, any cited rule reached 0, every cited rule reached 0
  111: 17 cases, any cited rule reached 5, every cited rule reached 2
  112: 2 cases, any cited rule reached 0, every cited rule reached 0
  113: 66 cases, any cited rule reached 8, every cited rule reached 0
  115: 9 cases, any cited rule reached 2, every cited rule reached 0
  116: 7 cases, any cited rule reached 2, every cited rule reached 2
  117: 29 cases, any cited rule reached 3, every cited rule reached 0
  118: 43 cases, any cited rule reached 13, every cited rule reached 1
  119: 2 cases, any cited rule reached 1, every cited rule reached 0
  120: 19 cases, any cited rule reached 7, every cited rule reached 2
  121: 14 cases, any cited rule reached 3, every cited rule reached 1
  122: 14 cases, any cited rule reached 4, every cited rule reached 3
  201: 17 cases, any cited rule reached 5, every cited rule reached 0
  202: 18 cases, any cited rule reached 0, every cited rule reached 0
  204: 3 cases, any cited rule reached 2, every cited rule reached 0
  205: 26 cases, any cited rule reached 5, every cited rule reached 0
  208: 5 cases, any cited rule reached 2, every cited rule reached 0
  300: 4 cases, any cited rule reached 0, every cited rule reached 0
  301: 5 cases, any cited rule reached 3, every cited rule reached 2
  302: 10 cases, any cited rule reached 3, every cited rule reached 0
  303: 19 cases, any cited rule reached 6, every cited rule reached 1
  304: 2 cases, any cited rule reached 0, every cited rule reached 0
  305: 29 cases, any cited rule reached 15, every cited rule reached 7
  306: 2 cases, any cited rule reached 1, every cited rule reached 1
  307: 2 cases, any cited rule reached 1, every cited rule reached 0
  400: 37 cases, any cited rule reached 6, every cited rule reached 1
  401: 3 cases, any cited rule reached 1, every cited rule reached 1
  402: 1 cases, any cited rule reached 1, every cited rule reached 1
  404: 1 cases, any cited rule reached 0, every cited rule reached 0
  405: 15 cases, any cited rule reached 2, every cited rule reached 0
  406: 8 cases, any cited rule reached 2, every cited rule reached 0
  500: 9 cases, any cited rule reached 1, every cited rule reached 0
  502: 3 cases, any cited rule reached 2, every cited rule reached 0
  503: 2 cases, any cited rule reached 0, every cited rule reached 0
  504: 1 cases, any cited rule reached 0, every cited rule reached 0
  505: 4 cases, any cited rule reached 4, every cited rule reached 0
  506: 9 cases, any cited rule reached 2, every cited rule reached 1
  508: 26 cases, any cited rule reached 7, every cited rule reached 2
  509: 13 cases, any cited rule reached 4, every cited rule reached 2
  510: 22 cases, any cited rule reached 6, every cited rule reached 1
  511: 2 cases, any cited rule reached 1, every cited rule reached 0
  514: 17 cases, any cited rule reached 9, every cited rule reached 3
  601: 82 cases, any cited rule reached 15, every cited rule reached 2
  602: 20 cases, any cited rule reached 4, every cited rule reached 0
  603: 154 cases, any cited rule reached 24, every cited rule reached 5
  604: 11 cases, any cited rule reached 1, every cited rule reached 0
  605: 18 cases, any cited rule reached 3, every cited rule reached 1
  606: 5 cases, any cited rule reached 3, every cited rule reached 2
  607: 12 cases, any cited rule reached 3, every cited rule reached 0
  608: 130 cases, any cited rule reached 19, every cited rule reached 3
  609: 15 cases, any cited rule reached 3, every cited rule reached 0
  610: 9 cases, any cited rule reached 1, every cited rule reached 0
  611: 31 cases, any cited rule reached 6, every cited rule reached 0
  612: 3 cases, any cited rule reached 1, every cited rule reached 0
  613: 67 cases, any cited rule reached 6, every cited rule reached 0
  614: 120 cases, any cited rule reached 18, every cited rule reached 4
  615: 5 cases, any cited rule reached 0, every cited rule reached 0
  616: 42 cases, any cited rule reached 6, every cited rule reached 0
  700: 18 cases, any cited rule reached 1, every cited rule reached 0
  701: 64 cases, any cited rule reached 22, every cited rule reached 5
  702: 229 cases, any cited rule reached 126, every cited rule reached 41
  703: 5 cases, any cited rule reached 5, every cited rule reached 0
  704: 92 cases, any cited rule reached 17, every cited rule reached 3
  705: 1 cases, any cited rule reached 0, every cited rule reached 0
  707: 43 cases, any cited rule reached 14, every cited rule reached 6
  708: 7 cases, any cited rule reached 2, every cited rule reached 0
  709: 7 cases, any cited rule reached 2, every cited rule reached 2
  712: 9 cases, any cited rule reached 2, every cited rule reached 0
  714: 10 cases, any cited rule reached 6, every cited rule reached 1
  715: 5 cases, any cited rule reached 3, every cited rule reached 2
  722: 5 cases, any cited rule reached 1, every cited rule reached 0
  723: 3 cases, any cited rule reached 0, every cited rule reached 0
  726: 8 cases, any cited rule reached 1, every cited rule reached 0
  727: 1 cases, any cited rule reached 0, every cited rule reached 0
  729: 10 cases, any cited rule reached 3, every cited rule reached 0
  800: 15 cases, any cited rule reached 11, every cited rule reached 5
  801: 1 cases, any cited rule reached 0, every cited rule reached 0
  805: 2 cases, any cited rule reached 1, every cited rule reached 0
  809: 1 cases, any cited rule reached 0, every cited rule reached 0
  810: 4 cases, any cited rule reached 2, every cited rule reached 1
  903: 7 cases, any cited rule reached 3, every cited rule reached 0

```

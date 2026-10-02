import type { PileTier } from "../../lib/trade/pricing";

const GOLD = "#f2c14e";
const GOLD_DARK = "#d4a017";
const BRONZE = "#8b5a2b";
const GEM = "#9b59b6";

type CoinProps = { cx: number; cy: number; rx?: number; ry?: number };

function Coin({ cx, cy, rx = 10, ry = 4 }: CoinProps): JSX.Element {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={GOLD} stroke={BRONZE} strokeWidth={1.2} />;
}

function Gem({ cx, cy }: { cx: number; cy: number }): JSX.Element {
  return (
    <polygon
      points={`${cx},${cy - 7} ${cx + 6},${cy} ${cx},${cy + 7} ${cx - 6},${cy}`}
      fill={GEM}
      stroke={BRONZE}
      strokeWidth={1}
    />
  );
}

/** Tier 1: loose coins and a two-coin stack. */
function Tier1(): JSX.Element {
  return (
    <>
      <Coin cx={28} cy={78} />
      <Coin cx={48} cy={82} rx={8} ry={3} />
      <Coin cx={40} cy={70} />
      <Coin cx={40} cy={64} />
    </>
  );
}

/** Tier 2: two taller stacks. */
function Tier2(): JSX.Element {
  return (
    <>
      <Coin cx={26} cy={80} />
      <Coin cx={26} cy={73} />
      <Coin cx={26} cy={66} />
      <Coin cx={54} cy={82} />
      <Coin cx={54} cy={75} />
    </>
  );
}

/** Tier 3: a mound with a stack at its peak. */
function Tier3(): JSX.Element {
  return (
    <>
      <polygon points="15,85 65,85 40,45" fill={GOLD_DARK} stroke={BRONZE} strokeWidth={1.5} />
      <Coin cx={40} cy={44} rx={9} ry={3.5} />
      <Coin cx={40} cy={38} rx={8} ry={3} />
    </>
  );
}

/** Tier 4: a larger mound, a gem, and taller side stacks. */
function Tier4(): JSX.Element {
  return (
    <>
      <polygon points="8,88 72,88 40,32" fill={GOLD_DARK} stroke={BRONZE} strokeWidth={1.5} />
      <Gem cx={40} cy={34} />
      <Coin cx={16} cy={78} />
      <Coin cx={16} cy={71} />
      <Coin cx={64} cy={80} />
      <Coin cx={64} cy={73} />
    </>
  );
}

/** Tier 5: the hoard — a chalice on the largest mound, scattered coins. */
function Tier5(): JSX.Element {
  return (
    <>
      <polygon points="4,92 76,92 40,24" fill={GOLD_DARK} stroke={BRONZE} strokeWidth={1.5} />
      <path
        d="M30,22 h20 l-3,10 a7,7 0 0 1 -14,0 z M40,32 v6 M32,38 h16"
        fill={GOLD}
        stroke={BRONZE}
        strokeWidth={1.2}
      />
      <Gem cx={40} cy={44} />
      <Coin cx={12} cy={82} />
      <Coin cx={12} cy={75} />
      <Coin cx={68} cy={84} />
      <Coin cx={68} cy={77} />
      <Coin cx={24} cy={90} rx={7} ry={2.6} />
      <Coin cx={56} cy={90} rx={7} ry={2.6} />
    </>
  );
}

const TIER_CONTENT: Record<PileTier, () => JSX.Element> = {
  1: Tier1,
  2: Tier2,
  3: Tier3,
  4: Tier4,
  5: Tier5
};

export type TradePileTransition = "up" | "down" | "none";

export type TradePileProps = {
  tier: PileTier;
  /** The richer side's pile glows; the lighter side's dims a step (REQ-215). */
  isRicher: boolean;
  /** "up" drops in with a slight overshoot, "down" lifts and fades, "none" on
   * first mount — nothing loops idle (REQ-215). Changes on every tier
   * transition, so the SVG remounts (the `key`) and the matching keyframe
   * (index.css `.trade-pile-tier-up` / `-down`) plays once, not idly. */
  transition: TradePileTransition;
  /** Remount key — bumped by the caller on every tier change so the
   * transition's animation restarts. */
  animationKey: number;
};

/**
 * One side's pile of gold (REQ-215): five flat-drawn tiers in gold/amber with a
 * bronze outline and one purple gem (tiers 4-5), relative to the other side's
 * total.
 */
export function TradePile({ tier, isRicher, transition, animationKey }: TradePileProps): JSX.Element {
  const TierContent = TIER_CONTENT[tier];
  const transitionClass =
    transition === "up" ? "trade-pile-tier-up" : transition === "down" ? "trade-pile-tier-down" : "";

  return (
    <div
      role="img"
      aria-label={`Pile of gold, tier ${tier} of 5${isRicher ? ", the richer side" : ""}`}
      data-testid="trade-pile"
      data-tier={tier}
      // Look-matching pass (slice O): sized per `trade-balancer.html:58-71`'s
      // `.pile` (132x73 phone, 196x109 desktop via `.tb-piles` media query),
      // replacing the fixed 80x96px box — the tier artwork itself (gold/bronze
      // flat shapes, a purple gem) is unchanged; LOOK-GAPS.md's own gap here is
      // the scale band's layout, not this SVG's drawing.
      className={`trade-pile-surface tb-pile relative mx-auto ${isRicher ? "trade-pile-richer" : "trade-pile-lighter"}`}
    >
      <svg
        key={animationKey}
        viewBox="0 0 80 100"
        className={`h-full w-full ${transitionClass}`}
        aria-hidden="true"
      >
        <TierContent />
      </svg>
    </div>
  );
}

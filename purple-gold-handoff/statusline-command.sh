#!/bin/sh
input=$(cat)
model=$(echo "$input" | jq -r '.model.display_name // "Unknown"')
used=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
five_hour=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
weekly=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')
five_hour_reset=$(echo "$input" | jq -r '.rate_limits.five_hour.resets_at // empty')
weekly_reset=$(echo "$input" | jq -r '.rate_limits.seven_day.resets_at // empty')
cost=$(echo "$input" | jq -r '.cost.total_cost_usd // empty')
duration_ms=$(echo "$input" | jq -r '.cost.total_duration_ms // empty')
output_style=$(echo "$input" | jq -r '.output_style.name // empty')
effort=$(echo "$input" | jq -r '.effort.level // empty')
vim_mode=$(echo "$input" | jq -r '.vim.mode // empty')
repo_owner=$(echo "$input" | jq -r '.workspace.repo.owner // empty')
repo_name=$(echo "$input" | jq -r '.workspace.repo.name // empty')
worktree_name=$(echo "$input" | jq -r '.worktree.name // empty')
pr_number=$(echo "$input" | jq -r '.pr.number // empty')
pr_review_state=$(echo "$input" | jq -r '.pr.review_state // empty')

# ANSI color codes — pulled directly from the miho-gold theme (~/.claude/themes/miho-gold.json)
PURPLE='\033[38;2;185;95;255m'           # claude / brand (secondary accent)
GOLD='\033[38;2;255;200;50m'             # primary accent (autoAccept / rate_limit_fill)
GOLD_BOLD='\033[1;38;2;255;200;50m'
WHITE='\033[38;2;255;250;240m'           # text
WHITE_BOLD='\033[1;38;2;255;250;240m'
ORANGE='\033[1;38;2;255;140;40m'         # warning (mid usage)
RED='\033[1;38;2;255;45;110m'            # error (high usage)
LABEL_PURPLE='\033[1;38;2;185;95;255m'
BADGE='\033[1;38;2;185;95;255m'          # auto-accept badge (purple)
DIM='\033[38;2;120;110;80m'              # inactive (warm)
RESET='\033[0m'

# Current directory, shortened (replace $HOME with ~)
cwd=$(echo "$input" | jq -r '.cwd // empty')
if [ -z "$cwd" ]; then
  cwd=$(pwd)
fi
home="$HOME"
short_cwd="${cwd#$home}"
if [ "$short_cwd" != "$cwd" ]; then
  short_cwd="~${short_cwd}"
fi

# Git branch (skip optional locks to avoid contention)
branch=$(git -C "$cwd" --no-optional-locks symbolic-ref --short HEAD 2>/dev/null)

# Detect auto-accept mode from the session transcript. The status payload has
# no permission-mode field, and Claude Code does not reliably log a toggle back
# to "default", so we read the mode recorded on the most recent submitted prompt
# (type:"user" lines carry permissionMode at submit time). Result: the badge
# tracks the mode of your last sent message and clears once you submit in default.
badge=""
transcript=$(echo "$input" | jq -r '.transcript_path // empty')
if [ -n "$transcript" ] && [ -f "$transcript" ]; then
  cur_mode=$(grep '"type":"user"' "$transcript" \
    | grep -o -E '"permissionMode":"[^"]*"' | tail -1 | sed -E 's/.*:"([^"]*)"/\1/')
  case "$cur_mode" in
    auto|acceptEdits) badge="${BADGE}[KEKW]${RESET}  " ;;
  esac
fi

# Format a "resets in" countdown from a unix epoch
format_reset() {
  reset_at="$1"
  [ -z "$reset_at" ] && return
  now=$(date +%s)
  diff=$((reset_at - now))
  [ "$diff" -le 0 ] && return
  h=$((diff / 3600))
  m=$(((diff % 3600) / 60))
  if [ "$h" -gt 0 ]; then
    printf "%dh%02dm" "$h" "$m"
  else
    printf "%dm" "$m"
  fi
}

# Pick the theme's success/warning/error color for a usage percentage
usage_color() {
  pct="$1"
  if [ "$pct" -ge 90 ]; then
    printf '%s' "$RED"
  elif [ "$pct" -ge 70 ]; then
    printf '%s' "$ORANGE"
  else
    printf '%s' "$GOLD_BOLD"
  fi
}

# Build 5-hour usage suffix
if [ -n "$five_hour" ]; then
  five_hour_pct=$(printf "%.0f" "$five_hour")
  five_hour_color=$(usage_color "$five_hour_pct")
  five_hour_eta=$(format_reset "$five_hour_reset")
  if [ -n "$five_hour_eta" ]; then
    five_hour_str="  ${DIM}|${RESET}  ${LABEL_PURPLE}5h%%${RESET} ${five_hour_color}${five_hour_pct}%%${RESET} ${PURPLE}(${five_hour_eta})${RESET}"
  else
    five_hour_str="  ${DIM}|${RESET}  ${LABEL_PURPLE}5h%%${RESET} ${five_hour_color}${five_hour_pct}%%${RESET}"
  fi
else
  five_hour_str=""
fi

# Build weekly usage segment (appended at the end of line 2). A plain
# (color-free) copy is kept only as a non-empty marker for add_segment below.
if [ -n "$weekly" ]; then
  weekly_pct=$(printf "%.0f" "$weekly")
  weekly_color=$(usage_color "$weekly_pct")
  weekly_eta=$(format_reset "$weekly_reset")
  if [ -n "$weekly_eta" ]; then
    weekly_segment="${LABEL_PURPLE}Weekly%%${RESET} ${weekly_color}${weekly_pct}%%${RESET} ${PURPLE}(${weekly_eta})${RESET}"
    weekly_segment_plain="Weekly ${weekly_pct}% (${weekly_eta})"
  else
    weekly_segment="${LABEL_PURPLE}Weekly%%${RESET} ${weekly_color}${weekly_pct}%%${RESET}"
    weekly_segment_plain="Weekly ${weekly_pct}%"
  fi
else
  weekly_segment=""
  weekly_segment_plain=""
fi

# Plain (color-free) stand-in for the badge, used only for width measurement.
badge_plain=""
[ -n "$badge" ] && badge_plain="[KEKW]  "

# Build context bar (shared by both the "have data" and fallback cases so the
# 5h/Weekly alignment logic below only has to reason about one code path).
if [ -n "$used" ]; then
  filled=$(printf "%.0f" "$(echo "$used * 10 / 100" | bc -l)")
  empty=$((10 - filled))
  bar_filled=""
  bar_empty=""
  i=0
  while [ $i -lt $filled ]; do bar_filled="${bar_filled}█"; i=$((i+1)); done
  i=0
  while [ $i -lt $empty ]; do bar_empty="${bar_empty}░"; i=$((i+1)); done
  pct=$(printf "%.0f" "$used")
  ctx_color=$(usage_color "$pct")
  pct_color="$ctx_color"
  pct_text="$pct"
else
  bar_filled=""
  bar_empty="░░░░░░░░░░"
  ctx_color="$DIM"
  pct_color=""
  pct_text="--"
fi

# Plain-text render of line 1's main content (cwd/branch/model/context bar),
# used only to measure its printed width for alignment below — never printed.
if [ -n "$branch" ]; then
  line1_plain="${badge_plain}${short_cwd} › ${branch}  |  ${model}  [${bar_filled}${bar_empty}] ${pct_text}%"
else
  line1_plain="${badge_plain}${short_cwd}  |  ${model}  [${bar_filled}${bar_empty}] ${pct_text}%"
fi

# Second line: cost/duration, repo/worktree, output style/effort, vim mode, PR badge.
# Each segment is tracked both in color (line2) and as plain text (line2_plain)
# so its printed width can be measured for the 5h/Weekly alignment below.
line2=""
line2_plain=""
add_segment() {
  # $1 = colored fragment, $2 = plain-text equivalent (for width measurement)
  [ -z "$2" ] && return
  if [ -z "$line2_plain" ]; then
    line2="$1"
    line2_plain="$2"
  else
    line2="${line2}  ${DIM}|${RESET}  $1"
    line2_plain="${line2_plain}  |  $2"
  fi
}

if [ -n "$cost" ]; then
  cost_fmt=$(printf '$%.2f' "$cost")
  add_segment "${LABEL_PURPLE}cost${RESET} ${GOLD_BOLD}${cost_fmt}${RESET}" "cost ${cost_fmt}"
fi

if [ -n "$duration_ms" ]; then
  duration_sec=$((duration_ms / 1000))
  d_h=$((duration_sec / 3600))
  d_m=$(((duration_sec % 3600) / 60))
  if [ "$d_h" -gt 0 ]; then
    duration_fmt="${d_h}h${d_m}m"
  else
    duration_fmt="${d_m}m"
  fi
  add_segment "${LABEL_PURPLE}session${RESET} ${GOLD}${duration_fmt}${RESET}" "session ${duration_fmt}"
fi

if [ -n "$repo_owner" ] && [ -n "$repo_name" ]; then
  add_segment "${GOLD}${repo_owner}/${repo_name}${RESET}" "${repo_owner}/${repo_name}"
elif [ -n "$repo_name" ]; then
  add_segment "${GOLD}${repo_name}${RESET}" "${repo_name}"
fi

if [ -n "$worktree_name" ]; then
  add_segment "${LABEL_PURPLE}worktree${RESET} ${WHITE}${worktree_name}${RESET}" "worktree ${worktree_name}"
fi

if [ -n "$output_style" ] && [ "$output_style" != "default" ]; then
  add_segment "${LABEL_PURPLE}style${RESET} ${WHITE}${output_style}${RESET}" "style ${output_style}"
fi

if [ -n "$effort" ]; then
  add_segment "${LABEL_PURPLE}effort${RESET} ${GOLD}${effort}${RESET}" "effort ${effort}"
fi

if [ -n "$vim_mode" ]; then
  add_segment "${ORANGE}${vim_mode}${RESET}" "${vim_mode}"
fi

if [ -n "$pr_number" ]; then
  if [ -n "$pr_review_state" ]; then
    add_segment "${LABEL_PURPLE}PR${RESET} ${WHITE}#${pr_number}${RESET} ${GOLD}(${pr_review_state})${RESET}" "PR #${pr_number} (${pr_review_state})"
  else
    add_segment "${LABEL_PURPLE}PR${RESET} ${WHITE}#${pr_number}${RESET}" "PR #${pr_number}"
  fi
fi

# Align the 5h (line 1) and Weekly (line 2) segments: each is preceded by an
# identical "  |  " separator, so equalizing the visible width of everything
# that precedes them is enough to make the two segments start in the same
# column. Pad whichever line's pre-rate-limit content is shorter.
line1_pad=""
if [ -n "$five_hour_str" ] && [ -n "$weekly_segment" ]; then
  len1=${#line1_plain}
  len2=${#line2_plain}
  if [ "$len1" -lt "$len2" ]; then
    pad=$((len2 - len1))
    i=0
    while [ $i -lt $pad ]; do line1_pad="${line1_pad} "; i=$((i+1)); done
  elif [ "$len2" -lt "$len1" ]; then
    pad=$((len1 - len2))
    spacer=""
    i=0
    while [ $i -lt $pad ]; do spacer="${spacer} "; i=$((i+1)); done
    line2="${line2}${spacer}"
    line2_plain="${line2_plain}${spacer}"
  fi
fi

add_segment "$weekly_segment" "$weekly_segment_plain"

# Prepend the auto-mode badge (empty when not in auto mode)
printf "$badge"

if [ -n "$branch" ]; then
  printf "${PURPLE}%s${RESET} ${WHITE}›${RESET} ${GOLD}%s${RESET}  ${DIM}|${RESET}  ${GOLD}%s${RESET}  ${PURPLE}[${RESET}${ctx_color}%s${RESET}${DIM}%s${RESET}${PURPLE}]${RESET} ${pct_color}%s%%${RESET}%s${five_hour_str}" \
    "$short_cwd" "$branch" "$model" "$bar_filled" "$bar_empty" "$pct_text" "$line1_pad"
else
  printf "${PURPLE}%s${RESET}  ${DIM}|${RESET}  ${GOLD}%s${RESET}  ${PURPLE}[${RESET}${ctx_color}%s${RESET}${DIM}%s${RESET}${PURPLE}]${RESET} ${pct_color}%s%%${RESET}%s${five_hour_str}" \
    "$short_cwd" "$model" "$bar_filled" "$bar_empty" "$pct_text" "$line1_pad"
fi

if [ -n "$line2" ]; then
  printf "\n${line2}"
fi

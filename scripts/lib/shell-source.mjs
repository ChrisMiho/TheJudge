// Test helper: read a shell script as code only, so prose in comments can
// neither satisfy nor trip an assertion.

/** Drop whole-line shell comments from `source`; only real commands count. */
export function codeOnly(source) {
  return source
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .join("\n")
}

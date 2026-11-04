# Algorithm Field first problem implementation plan

**Goal:** Rebuild only the first official Interview 150 problem, 88. Merge Sorted Array, for local acceptance in a new orphan branch.

**Architecture:** Dependency-free HTML, CSS and JavaScript modules. A pure trace generator supplies independent snapshots and Go line highlights; a separate UI renders those frames. A small Node static server serves local preview.

**Constraints:** Do not read or reuse the old implementation. Keep master intact. Reference only the user-supplied Three Sum Site for visual structure and interaction conventions. Do not implement additional problems or publish before acceptance.

## Design

White paper, cobalt accents, serif bilingual headings, thin borders and numbered sections. The page contains problem details, three strategy cards, an interactive pointer laboratory and synchronized Go source. Preserve keyboard navigation, playback speed, timeline, reset, copy and editable input. Use an original wireframe illustration of two sorted sequences merging.

## Tasks

- [x] Create orphan branch feat/algorithm-lab with an empty root commit.
- [x] Implement src/merge.js and tests/merge.test.js: input validation, immutable reverse-merge snapshots, matching Go source. Verify official cases, empty inputs, actual zeros, duplicates and no unread-prefix overwrite.
- [x] Implement index.html, src/main.js and src/style.css: responsive presentation and controls, accessible edit dialog, inline errors and reduced-motion support.
- [x] Implement server.mjs and README.md with local run instructions.
- [x] Run node tests and syntax checks; verify HTTP, browser interactions, visual layout and narrow screens. Obtain an independent code review.
- [x] Leave the local server running and hand the first problem to the user for acceptance.

## Verification and acceptance feedback

- 61/61 Node tests pass, including 99 short-array combinations checked against an independent sorting oracle. Syntax checks pass.
- HTTP 200 at http://127.0.0.1:5173. Static server exposes only the entry point and application assets.
- Browser verified next/previous, write-frame highlight, timeline completion, autoplay to completion, speed, input validation, empty input, negative duplicates, reset and copy. No console errors or warnings.
- Checked 1440px desktop and 390px phone layouts: no page overflow; 11-character integer comparisons wrap without clipping.
- Independent review identified code-pane arrow keys being intercepted; fixed the shortcut guard and verified code-pane ArrowRight leaves the animation at the same step.
- User requested larger / stronger typography and reference pointer contrast. Updated problem statement to a prominent tinted card (17px desktop, 16px mobile); example input/output to separate card; strategy / observation / Go text enlarged and darkened; pointer cells now have blue / teal / purple fills, 3px bottom shadows, upper indices, lower pointer labels, and dotted background.
- Preserve scope: only problem 88 is implemented; master and origin are unchanged. Further problems await user acceptance and authorization.

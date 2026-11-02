# Navigation and interactions

## Evidence boundary

Knowable homepage navigation and Knowable article interaction tests are blocked because both URLs presented Cloudflare security verification. Quanta's article route was accessible in an isolated Playwright context. All tested states were public and reversible; `Reject All` was selected only inside disposable browser contexts, which were then closed. No existing profile or saved browser state was touched.

## Quanta actions

| Step | Result | Viewport/evidence | Limits |
|---|---|---|---|
| Load article and enumerate visible controls | Page HTTP 200. A cookie preference panel initially covered the bottom of the viewport. A control labelled “open the menu” exposed `aria-haspopup="menu"`. | 1440×900 and 390×844; `interactions-report.json` (private) | Control labels were recorded only to identify the tested control. |
| Click “Reject All” | The cookie choices disappeared from visible controls in the same ephemeral context. | 1440×900, 390×844 | Browser context was discarded; persistence outside this temporary context was not tested. At 320×700 the banner was not present. |
| Click “open the menu” | A visible full-width element with `role="menu"` appeared; width was 1440 px desktop, 390 px mobile and 320 px stress. | 1440×900, 390×844, 320×700 | This is an article-page menu, not proof of Knowable's behavior or the owner's category link/chevron model. |
| Press Escape after opening the menu | The visible `role="menu"` remained present in the immediate DOM visibility check. | Same | One action sequence only. No broader keyboard conformance conclusion. |
| Tab from document start | Focus landed on a “Close” button while the cookie panel was present; computed focus outline was 2 px solid blue (`rgb(24, 99, 220)`). | 1440×900; PW-INT-quanta-article | The focus target belonged to page chrome/overlay; this does not certify all focus order or contrast. |

No category text-vs-chevron navigation, hover behavior, click-outside dismissal, search submission, article TOC, share action, author-rail link, or mobile accordion was verified. The source page's DOM exposes navigation links and menu controls, but destination links were not clicked. The user's owner-approved hybrid category-link + separate chevron remains a product decision, not an observed feature of either reference.

## Reproduction

1. Open the exact Quanta URL in a clean, isolated Chrome context at the stated viewport and locale.
2. Wait for `domcontentloaded` and 600–700 ms; record the visible cookie panel before choosing any preference.
3. In the disposable context, select the visible **Reject All** button when present.
4. Click the button whose accessible name is “open the menu”; verify that a visible `role="menu"` node appears; press Escape and inspect visibility.
5. Record browser, timestamp, viewport, action and outcome. Do not rely on screenshots alone to prove DOM interaction.

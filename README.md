# Mindful

A full-screen learning card, one at a time. Open this instead of doom-scrolling.

V0 ships with 42 hand-curated cards across seven categories:
science, history, fact, nature, art, big-question, food.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` on your laptop, or
`http://<your-lan-ip>:3000` on your phone (same Wi-Fi).

On iPhone, tap **Share → Add to Home Screen** to get a full-screen,
icon-on-the-home-screen experience that bypasses Safari chrome.

## Interactions

- **Swipe right** (or tap **Next →**) to advance.
- **Double-tap** anywhere on the card body to heart / unheart.
- **Vertical scroll** to read longer cards.
- After 20 cards or 8 minutes, the session ends with a soft stop screen.
  This is intentional — it's the structural defense against re-creating
  the doom-scroll loop the app is meant to replace.

Tap the heart count (top-left) to open the saved sheet. Tap the gear
(top-right) for settings.

## LLM top-up (optional)

Paste an Anthropic API key in **Settings → Anthropic API key**.
When fewer than 10 unseen cards remain, the app generates 5 more
in the background. Capped at 5 calls per day. Generated cards carry
a "Generated" chip and skip the `big_question` category to avoid
drift. Your key never leaves your device except as the
`x-anthropic-key` header on the same-origin `/api/generate` proxy.

## Backup

iOS Safari clears localStorage for PWAs after ~7 days of non-use.
**Settings → Backup → Export** downloads a JSON snapshot of your
hearts, generated cards, and key. Re-import to restore.

## Scripts

```bash
npm run dev    # local dev server
npm run build  # production build
npm run start  # production server
npm run test   # vitest
```

# Feel Good Inc. FM: read this first

Rim's radio, built from Pale Blue Dot Radio.

- **`docs/SPEC.md` is what this radio must be.** Read it first. Where it disagrees with `docs/BLUEPRINT.md`, SPEC wins.
- `docs/BLUEPRINT.md` describes the architecture, features and rules inherited from Pale Blue Dot.
- This repo, `Yisyphus/feel-good-inc-fm`, is the only source of truth. Work on `main`.
- The website is Firebase Hosting, `https://rim-fm.web.app/` (Firebase project `rim-fm`), deployed from `main`.
- The Windows app is its own program (Electron, `desktop/main.js`) with its own voices (Kokoro, in `server.js`: Luna =
  `af_heart`, Joe = `am_echo`). It updates itself from that address (`cloud.json` `appUrl`); a new exe or voice engine
  needs a new release (`tools/release/VERSION`, then run the `Release` workflow).

## Rules that matter
- Never mention an uncle or the giver; nothing existential; clean versions only; advice offered, never ordered.
- Library and playlist edits from different devices are **merged**, never replaced (`mergeLib`).
- Everything Luna and Joe say lives in the `content*.js` files, not in `app.js`.
- Run `python3 tools/publish.py` before every commit.
- Never reuse the Pale Blue Dot Firebase project or its data.

## Usage report and fresh start
- The radio logs one small line per listening session in Firestore `usage/` (day, start, minutes, website/app, device id):
  nothing about what was played. Only the owner's Google account can read it (`firestore.rules`).
- The owner reads it at `rim-fm.web.app/report.html`. When the owner asks for a report here, run the
  `Usage report` workflow (`usage-report.yml`, it only runs while the repo is private) and read its job log.
- "Refresh it" / "fresh start" (after the owner's testing, before Rim gets it): bump `R.freshStart` in `content.js`
  (fresh-1 → fresh-2…), publish, push. Every device then forgets its local state once (tour, mission, local library).
  Never bump it once Rim is using the radio.
- The installer (inside a zip: the free Firebase plan refuses .exe files) downloads from `rim-fm.web.app/download/` (the deploy copies the latest release there), so it works
  for everyone while the repo is private.

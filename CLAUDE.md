# Feel Good Inc. FM: read this first

Rim's radio, built from Pale Blue Dot Radio.

- **`docs/SPEC.md` is what this radio must be.** Read it first. Where it disagrees with `docs/BLUEPRINT.md`, SPEC wins.
- `docs/BLUEPRINT.md` describes the architecture, features and rules inherited from Pale Blue Dot.
- This repo, `Yisyphus/feel-good-inc-fm`, is the only source of truth. Work on `main`.
- The website is Firebase Hosting, `https://rim-fm.web.app/` (Firebase project `rim-fm`), deployed from `main`.
- The Windows app updates itself from that address (`cloud.json` `appUrl`).

## Rules that matter
- Never mention an uncle or the giver; nothing existential; clean versions only; advice offered, never ordered.
- Library and playlist edits from different devices are **merged**, never replaced (`mergeLib`).
- Everything Joe and Luna say lives in the `content*.js` files, not in `app.js`.
- Run `python3 tools/publish.py` before every commit.
- Never reuse the Pale Blue Dot Firebase project or its data.

# Feel Good Inc. FM: the spec

Everything decided for Rim's radio (12 November 2026). It is built from Pale Blue Dot Radio (`docs/BLUEPRINT.md`
describes that radio's architecture, features and rules; they all apply here unless this file says otherwise).
Where the two disagree, **this file wins**.

---

## 1. Who it is for

- **Rim**, born **2 January 2012** (14 now, 15 on 2 January 2027). Lives in **Marrakech**.
- A gift. **Never** mention an uncle or whoever gave it, and never make it emotional.
- Loves: Gorillaz, Steve Lacey, Pink Floyd, The Smiths, MF DOOM, Kendrick Lamar, Mac DeMarco, TV Girl, Michael
  Jackson, Nirvana, Korn, System of a Down, Tame Impala, Queen, Hoba Hoba Spirit, Betweenatna, Radiohead, Daft Punk,
  King Gizzard & the Lizard Wizard, MGMT, Black Sabbath; punk, alternative, neo-psychedelia, 90s and early 2000s
  rock. Also Roblox, Dress to Impress, memes, viral and funny TikTok videos, some anime, novels and books,
  decorating her room and her bag, Spotify (she loves making playlists with her own names).
- She **hates maths**. Do **not** make it a running joke.

## 2. The station

- **Name:** Feel Good Inc. FM. **Host:** Joe. **Co-host:** Luna.
- **Language:** English only (host, co-host, bulletin, interface). Songs in Darija (Hoba Hoba Spirit, Betweenatna)
  are fine.
- **Tone:** full of energy, positive, motivating, funny, as if Joe is talking to her. **Not existential.** Not bossy:
  advice is offered ("if you feel like it…"), never ordered.
- **Joe** is the host. **Luna** is a playful co-host: Book Nook, short readings, banter with Joe.
- **Monster Energy:** only as a look (a green claw-scratch sticker). Joe never promotes energy drinks.

## 3. What is removed from Pale Blue Dot

- The Long Hour, Letters to the Absurd, Sisyphus, memento mori, everything existential.
- Conversations with You (younger / older self).
- The Arabic news. Real Moroccan commercials (all of it: playlist, search, Manage commercials, jingles between ads).
- The Arabic podcasts (Da7ee7, في الحضارة, هو ليه؟, مع عبد اللطيف) and the regular podcast search.
- The **↓ Download** button (the converter sites are full of pop-ups).
- **Labels / Needs labels** (the catalog is labelled by hand; added songs are labelled automatically).
- The owner's personal letters, birthday letter, albums, catalog, Firebase project.
- No countdown to the birthday. No meme corner. No anime openings hour. No maths jokes.

## 4. The programme

A 64-song cycle, as before, with new parts in the old slots. One big part per break at most.

| After song | Part |
|---|---|
| 8, 24, 40, 56 | A **trivia shot** about the song or artist playing, a **genre trivia** bit tied to what is playing, or a **side quest** |
| 16 | **Book Nook** with Luna: a short pitch for a novel, or a fun public-domain extract |
| 32 | **A note to Rim** from Joe: short, funny, warm, no tears |
| 48 | **Today's Mission** (if not given yet today; otherwise a trivia shot) |
| 64 | A **podcast**; on Saturdays a **live concert** |

Joe speaks every 2 songs by default (Settings: a lot = every song, normal = every 2, a little = every 4).

### Today's Mission
- Simple form: **"Today's mission: do this and this."** No "BREAKING" style.
- Once a day, the first time she opens the radio that day. **No follow-up later.**
- Always safe and harmless: nothing with strangers online, no spending money, no pranks on people, no food or
  drink dares, nothing risky, nothing outdoors at night. Creative, musical, room / bag decorating, reading, small fun.
- Examples: "draw one tiny doodle in the corner of a notebook page, and listen to one song you've never heard
  before." · "move one thing in your room to a new spot and see if the room feels different." · "find the bass
  line in the next song and hum it."

### Side quests (offered, never ordered)
Creativity prompts, study hacks, school-life survival, room and bag decorating ideas, book picks, music
discovery. Always "if you feel like it", never "you should".

### Trivia
- **Music trivia shots:** "Did you know Gorillaz…", "Pink Floyd once…", about the song or artist playing.
- **Genre trivia:** tied to the genre of what is playing ("nu-metal was born when…").
- Facts must be true (checked), and suitable for her age.

### Genre runs (Genre Mix)
90s / 2000s rock, Nu-metal hour, Neo-psychedelia, Rap classics, Moroccan alt (Hoba Hoba Spirit, Betweenatna…),
Indie bedroom pop, plus the other groups her catalog supports (Grunge, Punk, Classic rock, Prog / psychedelic,
Electronic / French touch, Pop legends…).

### Birthday (2 January)
- A birthday show: Joe opens with it, confetti jingles, a special Today's Mission, her favourites first.
- A **birthday banner** on screen all day.
- In **Just music** mode: the banner, and **Joe still speaks once** (a short birthday message between two songs).
  That is the only time Joe speaks in Just music mode.
- `R.listener = { name: 'Rim', born: '2012-01-02' }`; `{age}` is her age that day.

## 5. The fun bulletin (replaces the news)

- **English**, about **2 minutes**, **twice a day: around 14:00 and 20:00** (Marrakech time).
- Music news (her artists first), game news (Roblox and Dress to Impress when there is any), good and viral
  stories, the **Marrakech weather** (Open-Meteo), "on this day in music".
- **Safety filter:** a headline that touches crime, war, death, drugs, adult topics or anything iffy is skipped.
  When in doubt, skip.
- Each source has its own time limit; a slow source only loses its own headlines.
- Its own voice (an Edge natural English voice).

## 6. Podcasts and concerts

- **Hand-picked episodes only, saved by their exact video id.** Never a random search: the channels' recent uploads
  include topics that do not suit her (drugs, death, crime, dangerous experiments).
- Shows: **Polyphonic**, **Trash Theory**, **Middle 8**, **Mark Rober**. Episodes about her artists and genres; Mark
  Rober's fun engineering builds. About 45 episodes. Episodes of 8 to 15 minutes are played **as they are**.
- Excluded on sight: anything about drugs, death and dying, violence, crime, school shootings ("Pumped Up Kicks"),
  dark band tragedies, adult relationships, "dangerous experiment" videos.
- **Saturday concerts:** KEXP and NPR Tiny Desk, from a **hand-picked, checked list** (Mac DeMarco, Steve Lacey, King
  Gizzard, MGMT, Tame Impala, TV Girl, Radiohead… whichever exist and are clean). Never a random search.
- Played episodes never return until all have played.

## 7. Clean versions only

- The catalog holds the **exact clean video** of every song (the "clean" / "edited" upload). A song with no clean
  version on YouTube is **left out**.
- **Lyrics:** swear words are masked (`f***`). LRCLIB serves the original text, so the mask is applied on display.
- **Album Party:** an album with explicit tracks plays its clean edition when YouTube has one; otherwise that track
  is skipped, or the album is swapped.
- **Add a song:** she chooses freely (no forced clean search).

## 8. Album Party with Joe (was the Album show)

Her albums: *Demon Days*, *The Dark Side of the Moon*, *Currents*, *Nevermind*, *Toxicity*, *OK Computer*,
*Thriller*, *Discovery*, *Oracular Spectacular*, and more from her artists. Same checks as the blueprint (exact
tracks, `aka`, lengths, five checks), plus the clean rule above. Joe's notes: fun facts, energetic, not existential.

## 9. Homework mode (was Focus mode)

Lofi, chill beats, game-like ambience, instrumental stations; no talk, no shows. A **study timer** (e.g. 25 min
work / 5 min break, with a soft chime). Her own stations can be added as before.

## 10. Just music

- A **big switch on the main screen**: Joe and Luna silent, no jingles, no ambient pad, no missions, side quests,
  Book Nook, notes, podcasts, concerts or bulletin. Nothing interrupts a song. Like Spotify without ads.
- Playlists, Liked Songs, shuffle, repeat, lyrics, Genre Mix, sleep timer all keep working.
- Switching it off brings Joe back where the cycle stopped. Remembered and synced.
- Exception: her birthday (section 4).

## 11. The interface

### Names (Spotify's words where she knows them)

| Pale Blue Dot | Feel Good Inc. FM |
|---|---|
| + Suggest | **+ Add a song** |
| Lists | **Playlists** |
| ♥ Favorites | **♥ Liked Songs** |
| Library | **Your Library** |
| Suggest > A list | **Import a playlist** |
| Genre run | **Genre Mix** |
| Focus mode | **Homework mode** |
| Album show | **Album Party with Joe** |
| Marathon | **Non-stop** ("Only music", "Only Joe & Luna bits"…) |
| Compact mode | **Mini player** |
| Tune in | **Let's go ▶** |
| no sound or wrong song? try another version | **Wrong song or no sound? Fix it** |
| ✕ remove this song | **Never play this again** (two taps, can be undone) |
| Cloud sync / Sign in with Google | **Save my stuff on all my devices** |

### Easy to understand
- A **small word under every icon** button.
- **One plain sentence under every setting.** No technical words (no "64-song cycle", "trim", "upload").
- A **welcome tour** the first time: Joe points at 4 or 5 buttons in plain words. Replay from Settings.
- **Settings in four groups:** Joe & Luna (how often Joe talks, voices, talking speed) · Music (smooth
  transitions, sleep timer) · Shows (bulletin, a podcast now, a concert now, Album Party, Non-stop) · My stuff (sync,
  backup, restore, get the Windows app, update). Then a small **Help & fixing problems** section (playback report,
  check sources).

### Playlists like Spotify
- **+ Add to playlist** on the player for the song playing now, with **New playlist…** right there.
- Create an **empty playlist** with her own name; add songs over time.
- **Rename**, **remove a song**, **delete** (two taps, restorable).
- A **cover** per playlist: a colour and one of the background stickers.
- Play in order or shuffled; song count and total length shown.
- Synced and merged like everything else (`mergeLib`).

### The look
- **Neon night, A1 medium motif:** black board, faint grid, neon stickers (pink `#ff3ea5`, cyan `#00e5ff`, green
  `#7cff3a`, yellow `#ffe600`) with white die-cut edges, about 5 across the screen, a repeating half-drop motif
  with alternating tilts.
- Stickers (all original drawings, no logos): guitar, cassette, controller, lightning bolt, skull with a flower,
  planet, lizard, crown, vinyl, headphones, mushroom, claw scratch, smiley, microphone, moon, book, block avatar,
  dress on a hanger, ZAP!, daisy, music notes. (Removed: RAD, LOUD, FEEL GOOD, peace sign, eye, hearts.)
- Mockup: `docs/stickers-mockup.html`. Exported once as **one small WebP** (about 150 KB) for the page.
- Display face Bungee, body Rubik (or system fallbacks).

## 12. Light by design (always on, no setting)

For an old PC and slow Wi-Fi, on the website and the desktop app:
- **One YouTube player** (no crossfade).
- The player is **never visible** (off screen, small, so YouTube sends a lighter stream).
- **Waits instead of skipping** when the connection stutters (buffering is not an error).
- The next song is prepared **only near the end** of the current one.
- **No blur, no animation**: solid panels.
- The background is **one small image**, downloaded once and kept.
- Lyrics, bulletin and podcasts **load only when needed**, each with its own time limit.
- The catalog has **exact videos**, so no search before a song.
- Website: page files kept on the PC after the first visit; only changed files download again.
- Desktop app: Joe's speech is prepared while the song plays, so it does not stutter.

## 13. Voices (Edge natural voices, English)
Joe: Andrew or Brian Multilingual · Luna: Ava or Emma · Bulletin: a third voice (Jenny, Ryan…). Changeable in
Settings. Pronunciation fixes in `R.sayAs`.

## 14. Where it lives

- **Repository:** `Yisyphus/feel-good-inc-fm` (this one), the only source of truth, `main`.
- **Website:** **Firebase Hosting**, `https://rim-fm.web.app/`, deployed automatically from `main` by a GitHub
  Action. No GitHub address visible.
- **Cloud:** Firebase project **`rim-fm`** (Google sign-in, Firestore with owner-only rules). Never the owner's
  Pale Blue Dot project.
- **Desktop app:** the Windows installer and portable zip (GitHub Releases), `cloud.json` `appUrl` =
  `https://rim-fm.web.app/`. Website and app update from the same place.
- **Get the Windows app** in Settings > My stuff.

### System check before installing
- **Check my PC** (Settings > Get the Windows app, and on its own page `rim-fm.web.app/check`): Windows version,
  memory and processor, Edge version, natural voices, Wi-Fi speed (a small test download). A plain verdict
  ("Ready for the app" / "Use the website, it will work better here" / "This PC needs …") and **Copy results**.
- The **installer checks again** and stops with a clear message on a Windows that is too old.
- If her PC is Windows 7 or 8: adapt the helper (older Node build) at that point.

## 15. Rules kept from Pale Blue Dot
- Merge, never overwrite (`mergeLib`); deletions recorded with a time.
- Everything Joe and Luna say lives in `content*.js`, never in `app.js`.
- Publish with `tools/publish.py` before every commit.
- Exact versions proven, never an unchecked match. Never claim something was tested when it could not be.

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

- **Name:** Feel Good Inc. FM. **Host:** Luna. **Co-host:** Joe. (Swapped on 2026-11-13 at the owner's request: Luna was the co-host before.)
- **Language:** English only (host, co-host, bulletin, interface). **Moroccan songs are the owner's picks only**
  (16 November 2026: Hoba Hoba Spirit, Betweenatna, Darga, Mazagan, Heat Spirit). No old Moroccan music, no tarab, no
  chaabi.
- **Tone:** full of energy, positive, motivating, funny, as if Luna is talking to her. **Not existential.** Not bossy:
  advice is offered ("if you feel like it…"), never ordered.
- **Luna** is the host. **Joe** is a playful co-host: he gives the **welcome tour** (then hands over to Luna), **Today's
  Mission** (Luna hands it to him), **the Feel Good Bulletin**, Book Nook, short readings, banter with Luna.
- **Monster Energy:** only as a look (a green claw-scratch sticker). Luna never promotes energy drinks.

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
| 16 | **Book Nook** with Joe: a short pitch for a novel, or a fun public-domain extract |
| 32 | **A note to Rim** from Luna: short, funny, warm, no tears |
| 48 | **Today's Mission** (if not given yet today; otherwise a trivia shot) |
| 64 | A **podcast**; on Saturdays a **live concert** |

Luna speaks every 2 songs by default (Settings: a lot = every song, normal = every 2, a little = every 4).

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
- A birthday show: Luna opens with it, confetti jingles, a special Today's Mission, her favourites first.
- A **birthday banner** on screen all day.
- In **Just music** mode: the banner, and **Luna still speaks once** (a short birthday message between two songs).
  That is the only time Luna speaks in Just music mode.
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

## 8. Album Party with Luna (was the Album show)

Her albums: *Demon Days*, *The Dark Side of the Moon*, *Currents*, *Nevermind*, *Toxicity*, *OK Computer*,
*Thriller*, *Discovery*, *Oracular Spectacular*, and more from her artists. Same checks as the blueprint (exact
tracks, `aka`, lengths, five checks), plus the clean rule above. Luna's notes: fun facts, energetic, not existential.

## 9. Homework mode (was Focus mode)
- **First station: Lofi Girl: study mixes**: 12 of Lofi Girl's own long mixes (1 to 10 hours, exact videos, checked
  embeddable). No J Dilla ("Time: The Donut of the Heart" had moaning in a sample; his other Donuts tracks went too).

Lofi, chill beats, game-like ambience, instrumental stations; no talk, no shows. A **study timer** (e.g. 25 min
work / 5 min break, with a soft chime). Her own stations can be added as before.

- **The dream skin** (16 November 2026): while Homework mode is on, the radio wears a dreamcore aqua / Frutiger Aero skin,
  like Windows XP's crystal look: an underwater scene (`aqua.webp`, about 60 KB, an original drawing made by
  `tools/aqua-art.py`, no logos) with bubbles, tropical fish, a glossy globe, a dolphin, glass stars and a
  shiny CD (the green heart was taken out), behind glossy glass panels and bubble buttons (`body.dream` in index.html). No blur, no animation; the
  picture is only fetched in Homework mode. It goes back to the neon skin when Homework mode ends.
- **Aquacore station** (Homework): dreamy underwater music, 14 long tracks with exact videos (Aquatic Ambience, Dire,
  Dire Docks, Endless Ocean, Ecco the Dolphin, Frutiger Aero mixes…).

## 10. Just music

- A **big switch on the main screen**: Luna and Joe silent, no jingles, no ambient pad, no missions, side quests,
  Book Nook, notes, podcasts, concerts or bulletin. Nothing interrupts a song. Like Spotify without ads.
- Playlists, Liked Songs, shuffle, repeat, lyrics, Genre Mix, sleep timer all keep working.
- Switching it off brings Luna back where the cycle stopped. Remembered and synced.
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
| Album show | **Album Party with Luna** |
| Marathon | **Non-stop** ("Only music", "Only Luna & Joe bits"…) |
| Compact mode | **Mini player** |
| Tune in | **Let's go ▶** |
| no sound or wrong song? try another version | **Wrong song or no sound? Fix it** |
| ✕ remove this song | **Never play this again** (two taps, can be undone) |
| Cloud sync / Sign in with Google | **Save my stuff on all my devices** |

### Easy to understand
- A **small word under every icon** button.
- **One plain sentence under every setting.** No technical words (no "64-song cycle", "trim", "upload").
- A **welcome tour** the first time, **out loud, before the music**: Luna reads each step; the next comes by itself, Next skips to it, Skip ends it. Replay from Settings.
- **Settings in four groups:** Luna & Joe (how often Luna talks, voices, talking speed) · Music (smooth
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
- **Two hidden YouTube players, one streaming at a time:** the next song is only cued (no stream) before the end, then a short handover. (One single player left a silence between songs, and a minimized page that goes silent is slowed down by the browser: the next song waited until the window came back.) A tiny inaudible tone keeps the page awake too.
- The player is **never visible** (off screen, small, so YouTube sends a lighter stream).
- **Waits instead of skipping** when the connection stutters (buffering is not an error).
- The next song is prepared **only near the end** of the current one.
- **No blur, no animation**: solid panels.
- The background is **one small image**, downloaded once and kept.
- Lyrics, bulletin and podcasts **load only when needed**, each with its own time limit.
- The catalog has **exact videos**, so no search before a song.
- Website: page files kept on the PC after the first visit; only changed files download again.

## 13. Voices (English)
- **Edge's natural voices, in the app and on the website** (16 November 2026: back from Kokoro, which paused between
  phrases and sounded flat on the owner's PC; Edge's voices are made by Microsoft online, so an old PC does no voice
  work). The same voices as Pale Blue Dot: **Luna = Ava Multilingual** (the owner's pick, 16 November 2026; then Ava, Aria, Emma or Jenny),
  **Joe = Andrew Multilingual** (the owner's pick, 16 November 2026; then Andrew, Brian Multilingual, Guy), the bulletin in Joe's voice unless another is
  chosen. Talking speed 100 (normal) by default. Changeable in Settings. Pronunciation fixes in `R.sayAs`. Other browsers: their own voices, an online one
  as the last resort.

## 14. Where it lives

- **Repository:** `Yisyphus/feel-good-inc-fm` (this one), the only source of truth, `main`.
- **Website:** **Firebase Hosting**, `https://rim-fm.web.app/`, deployed automatically from `main` by a GitHub
  Action. No GitHub address visible.
- **Cloud:** Firebase project **`rim-fm`** (Google sign-in, Firestore with owner-only rules). Never the owner's
  Pale Blue Dot project.
- **Desktop app:** the Windows installer (GitHub Releases, copied to `rim-fm.web.app/download/` by the deploy),
  `cloud.json` `appUrl` = `https://rim-fm.web.app/`. Website and app update from the same place.
- **Get the Windows app** in Settings > My stuff.

### System check before installing
- **Check my PC** (Settings > Get the Windows app, and on its own page `rim-fm.web.app/check`): Windows version,
  memory and processor, how fast the PC would make the voices (a small speed test), the website's voices, Wi-Fi speed
  (a small test download, with the time the one-time 230 MB download would take). A plain verdict
  ("Ready for the app" / "Use the website, it will work better here" / "This PC needs …") and **Copy results**.
- The **installer checks again** and stops with a clear message on a Windows that is too old.
- If her PC is Windows 7 or 8: adapt the helper (older Node build) at that point.

## 15. Rules kept from Pale Blue Dot
- Merge, never overwrite (`mergeLib`); deletions recorded with a time.
- Everything Luna and Joe say lives in `content*.js`, never in `app.js`.
- Publish with `tools/publish.py` before every commit.
- Exact versions proven, never an unchecked match. Never claim something was tested when it could not be.

## 16. How it is built (implementation notes)

- **Files.** `content.js` (station, genres, Genre Mixes, genre trivia, themes, pronunciation), `content_talk.js`
  (welcomes, intros, back-announcements, idents, check-ins), `content_shows.js` (missions, side quests, Book Nook,
  notes, banter, birthday, bulletin wording, tour, study timer lines), `content_trivia.js` (artist and song facts),
  `content_catalog.js` + `content_ids.js` (generated: the clean songs and their checked videos), `content_pods.js`
  (podcast episodes and concerts by exact video), `content_homework.js` (stations and ambient sounds),
  `content_albums.js` (Album Party, generated: tracks, lengths, videos in `R.albumIds`, Luna's notes),
  `stickers.js` (the 21 sticker drawings, also used for playlist covers), `bg.webp` (the seamless background tile),
  `check.html` (Check my PC).
- **The catalog** is generated, never typed by hand: every candidate song's lyrics are read from LRCLIB and any
  swear word (also already-censored ones like "sh*t") leaves it out; songs whose lyrics are about drugs, sex or dark
  themes were reviewed by hand and left out too. Each song keeps up to 3 videos: official channel first, otherwise an
  upload titled "Artist - Title" whose length is within 8 seconds of the studio version, each checked embeddable
  (YouTube oEmbed). The radio plays the first and falls back to the others.
- **Two players.** The next song is cued (not streamed) on the idle player about a minute before the end, then the
  players hand over with a short fade (Smooth transitions), so there is never a silent gap. Next fades the old song in
  half a second. A video that does not start at all is replaced by a backup after 10 s; one that is buffering is
  waited for up to 45 s (90 s once playing).
- **Website without the helper.** Exact videos everywhere (catalog, Homework, albums, podcasts, concerts), so
  nothing needs a YouTube search. Add a song on the website accepts a YouTube link (oEmbed) or searches through public
  relays; importing a YouTube playlist link needs the app.
- **The app helper** listens on port **8789** (not 8787: no clash with Pale Blue Dot on the same PC) and answers
  `/api/ping` with `app: 'feel-good-inc-fm'`. Its news allowlist (`NEWS_HOSTS`) holds the bulletin's sources.
  The installer is `FeelGoodIncFM-Setup-<version>.exe` (Inno Setup; Windows 10 or newer, checked by the installer), installed in
  `%LOCALAPPDATA%\Programs\FeelGoodIncFM`.
- **The app is Microsoft Edge in app mode, like Pale Blue Dot** (`Feel Good Inc FM.vbs` starts the helper, then Edge
  with `--app=http://localhost:8789/`). From 13 to 16 November 2026 it was an Electron app with Kokoro voices; that was
  dropped (the voices were slow and flat on an old PC, and Electron alone did not fix minimizing).
- **The installer checks the PC first** (`tools/release/check-pc.ps1`, shown on a "Checking this PC" page before
  anything is installed): Windows 10 or newer (older Windows: a clear message, nothing installed, the website still
  works), Microsoft Edge present, recent (110+) and really starting (an invisible test run on a temporary profile), the
  internet (the radio's website and YouTube), 200 MB free, and PowerShell able to compile the minimize watcher. If Edge
  is missing, old or doesn't start, it downloads Microsoft's own Edge installer, runs it only if its Microsoft
  signature is valid (Windows asks once for permission), and checks again; if Edge still won't start, it explains how to
  repair it (Settings > Apps > Microsoft Edge > Modify > Repair). The release build runs the same check on the build
  machine first.
- **Minimize = hide** (16 November 2026, the fix proven on Pale Blue Dot): YouTube won't START a new song while
  Windows counts the window as unseen (minimized, sent to the tray by RBTray, or fully covered); it waits at
  "buffering". Not slowing the page down doesn't help. So the helper's watcher (`server.js`, a small C# class compiled
  by PowerShell, the same as Pale Blue Dot's; it finds the Edge window by "Feel Good" in its title, which the page always
  keeps) never lets it be unseen: on minimize, after half a second hidden (tray), or when the page reports
  `document.hidden` (covered, POST /api/hide), the window is shown again without focus, at 1% opacity, click-through and
  always on top. When it comes to the front again (taskbar button, Alt+Tab, tray
  icon; only after it has left the front once), it is back to normal. The taskbar button stays. Every step is in the
  Report ("window hidden (…)", "window back from hiding").
- **Fades:** 3 s by default (Settings: off, 3 s, 5 s): the old song fades out and the new one fades in. After a break,
  the song plays softly under the intro and rises to full volume during the host's last 3 seconds.
- **Build** (`tools/release/build.ps1`, on Windows): Node.js renamed FeelGoodHelper.exe, the helper, the page, the
  launcher and the icon. The installer is about 30 MB.
- **Releases** run only by hand (Actions > Release > Run workflow), after writing the version in `tools/release/VERSION`.
- **What is in it (13 November 2026):** 773 clean songs (Moroccan: the owner's picks, 10 entries including Betweenatna live at Bab'Live) (790 checked + clean radio edits of "Feel Good Inc." and
  "Clint Eastwood", fan uploads labelled clean), 9 Album Party albums (Demon Days, Plastic Beach, The Dark Side of the
  Moon, A Night at the Opera, Salad Days, Off the Wall, Thriller, Discovery, Oracular Spectacular; explicit tracks left
  out), 78 podcast episodes, 15 concerts, 5 Homework stations (89 tracks) and 6 ambient sounds. Albums that lost more
  than 30% of their tracks to explicit lyrics were left out: Currents, Nevermind, Toxicity, OK Computer, The Queen Is Dead.

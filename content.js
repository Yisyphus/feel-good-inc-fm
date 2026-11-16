// Feel Good Inc. FM: who is on air, the genres of Rim's music, the Genre Mixes, and genre trivia.
// Everything Luna and Joe say lives in the content*.js files. {host} {station} {time} {a} {t} {age} are filled in.
window.RADIO = window.RADIO || {};
(function () {
  const R = window.RADIO;
  R.station = 'Feel Good Inc. FM';
  R.host = 'Luna';
  R.cohost = 'Joe';
  R.tagline = 'Luna & Joe, on air for Rim';
  R.listener = { name: 'Rim', born: '2012-01-02' };   // her birthday: the birthday show, the banner, {age}
  R.appDownload = 'download/FeelGoodIncFM-Setup.zip';   // the installer inside a zip (the free Firebase plan refuses .exe)   // copied from the latest GitHub release at every deploy
  // Fresh start: when this changes, every device forgets what it remembers locally (the tour, today's mission, a
  // library saved only on that device), once, the next time the radio opens. Change it ONLY before Rim has the radio.
  R.freshStart = 'fresh-4';
  R.songs = [];          // every song is in the catalog (content_catalog.js)
  R.songScripts = {};

  // ---------- genres: a name, a family, and close neighbours (the radio drifts between neighbours) ----------
  const G = (name, family, near) => ({ name, family, near: near || [] });
  R.genreMap = {
    'alt-pop': G('alternative pop and trip-hop', 'alt', ['alt-rock', 'hip-hop', 'french-touch', 'indie-pop']),
    'bedroom-pop': G('bedroom pop', 'indie', ['indie-pop', 'dream-pop', 'soul-rnb', 'neo-psych']),
    'indie-pop': G('indie pop', 'indie', ['bedroom-pop', 'indie-rock', 'synth-pop', 'french-touch']),
    'dream-pop': G('dream pop', 'indie', ['bedroom-pop', 'neo-psych', 'indie-pop']),
    'soul-rnb': G('soul and R&B', 'soul', ['bedroom-pop', 'hip-hop', 'funk-disco']),
    'hip-hop': G('hip-hop', 'hiphop', ['alt-pop', 'soul-rnb', 'funk-disco']),
    'neo-psych': G('neo-psychedelia', 'psych', ['prog-psych', 'dream-pop', 'indie-rock', 'bedroom-pop']),
    'prog-psych': G('psychedelic and progressive rock', 'psych', ['neo-psych', 'classic-rock', 'art-rock']),
    'classic-rock': G('classic rock', 'rock', ['prog-psych', 'metal', 'art-rock', 'pop-legends']),
    'art-rock': G('art rock', 'alt', ['alt-rock', 'post-punk', 'prog-psych', 'indie-rock']),
    'alt-rock': G('90s and 2000s alternative rock', 'alt', ['grunge', 'indie-rock', 'britpop', 'pop-punk']),
    'grunge': G('grunge', 'alt', ['alt-rock', 'nu-metal', 'punk']),
    'nu-metal': G('nu-metal', 'heavy', ['alt-metal', 'grunge', 'metal']),
    'alt-metal': G('alternative metal', 'heavy', ['nu-metal', 'metal', 'grunge']),
    'metal': G('heavy metal', 'heavy', ['alt-metal', 'classic-rock', 'nu-metal']),
    'punk': G('punk', 'punk', ['pop-punk', 'grunge', 'post-punk']),
    'pop-punk': G('pop-punk and emo', 'punk', ['punk', 'alt-rock', 'indie-rock']),
    'post-punk': G('post-punk and new wave', 'alt', ['synth-pop', 'indie-rock', 'britpop', 'art-rock']),
    'britpop': G('Britpop', 'alt', ['indie-rock', 'alt-rock', 'post-punk']),
    'indie-rock': G('indie rock', 'indie', ['alt-rock', 'britpop', 'post-punk', 'neo-psych']),
    'synth-pop': G('synth-pop and the 80s', 'pop', ['post-punk', 'french-touch', 'pop-legends']),
    'french-touch': G('French touch and electronic', 'electronic', ['synth-pop', 'funk-disco', 'alt-pop', 'indie-pop']),
    'funk-disco': G('funk, soul and disco', 'pop', ['pop-legends', 'soul-rnb', 'french-touch']),
    'pop-legends': G('pop legends', 'pop', ['funk-disco', 'synth-pop', 'classic-rock']),
    'moroccan': G('Moroccan alternative and fusion', 'moroccan', ['alt-rock', 'funk-disco', 'neo-psych']),
  };

  // ---------- Genre Mixes: 20 to 40 songs of one kind, then back to the usual mix ----------
  R.runs = [
    { id: 'rock9000', label: '90s and 2000s rock', short: '90s & 2000s rock', genres: ['alt-rock', 'grunge', 'britpop', 'pop-punk'] },
    { id: 'numetal', label: 'the Nu-metal hour', short: 'Nu-metal hour', genres: ['nu-metal', 'alt-metal'] },
    { id: 'neopsych', label: 'neo-psychedelia, all swirly', short: 'Neo-psychedelia', genres: ['neo-psych', 'prog-psych'] },
    { id: 'rap', label: 'rap classics', short: 'Rap classics', genres: ['hip-hop'] },
    { id: 'moroccan', label: 'Moroccan alt: Hoba Hoba Spirit, Betweenatna and friends', short: 'Moroccan alt', genres: ['moroccan'] },
    { id: 'bedroom', label: 'indie bedroom pop', short: 'Indie bedroom pop', genres: ['bedroom-pop', 'indie-pop', 'dream-pop', 'soul-rnb'] },
    { id: 'grunge', label: 'pure grunge', short: 'Grunge', genres: ['grunge'] },
    { id: 'punk', label: 'punk and pop-punk', short: 'Punk & pop-punk', genres: ['punk', 'pop-punk'] },
    { id: 'classic', label: 'classic rock and metal legends', short: 'Classic rock & metal', genres: ['classic-rock', 'prog-psych', 'metal'] },
    { id: 'indie', label: 'indie rock and post-punk', short: 'Indie & post-punk', genres: ['indie-rock', 'post-punk', 'art-rock'] },
    { id: 'electronic', label: 'French touch and electronic', short: 'French touch', genres: ['french-touch', 'synth-pop'] },
    { id: 'pop', label: 'pop legends and disco', short: 'Pop legends', genres: ['pop-legends', 'funk-disco', 'alt-pop'] },
  ];

  // ---------- genre trivia: true facts, tied to the genre of what is playing ----------
  R.genreNotes = [
    { g: 'alt-pop', t: 'Gorillaz started in 1998 as a joke between Damon Albarn and the artist Jamie Hewlett: a band whose members are cartoons. The cartoon band went on to sell millions of records.' },
    { g: 'bedroom-pop', t: 'Bedroom pop is music made at home, often on a laptop, sometimes with a microphone on a pile of books. Steve Lacy made beats on his phone before he had a studio.' },
    { g: 'indie-pop', t: 'Indie pop takes its name from independent labels: small companies that let bands sound strange on purpose.' },
    { g: 'dream-pop', t: 'Dream pop got its name in the late 1980s, for bands that buried the voice in echoes and soft guitars, like singing from inside a cloud.' },
    { g: 'soul-rnb', t: 'R&B stands for rhythm and blues. The name was first used by Billboard magazine in 1949, to replace older labels for Black American music.' },
    { g: 'hip-hop', t: 'Hip-hop was born at a back-to-school party in the Bronx, New York, in August 1973. DJ Kool Herc played only the drum breaks of funk records, again and again, so people could dance.' },
    { g: 'neo-psych', t: 'Neo-psychedelia brings back the swirly sounds of the 1960s with new tools. Kevin Parker records most of Tame Impala alone, playing almost every instrument himself.' },
    { g: 'prog-psych', t: 'Progressive rock bands of the 70s loved long songs. Pink Floyd\'s "Echoes" takes up one whole side of a record: more than 23 minutes.' },
    { g: 'classic-rock', t: 'The guitar riff became the star of rock in the 1960s and 70s. Deep Purple wrote "Smoke on the Water" about a real fire they watched from their hotel in Montreux, Switzerland.' },
    { g: 'art-rock', t: 'Art rock is rock that borrows ideas from painting, theatre and film. David Bowie invented whole characters, like Ziggy Stardust, a rock star from space.' },
    { g: 'alt-rock', t: 'Alternative rock got its name from college radio stations in America in the 1980s: they played the bands the big stations ignored.' },
    { g: 'grunge', t: 'Grunge came from Seattle, a rainy city in the north-west of the USA. Its fashion of flannel shirts and old jeans was simply what people there wore against the cold.' },
    { g: 'nu-metal', t: 'Nu-metal mixed heavy guitars with hip-hop beats and DJs. Korn tuned their guitars extra low and played seven-string guitars to get that huge, bouncy sound.' },
    { g: 'alt-metal', t: 'System of a Down are all of Armenian descent, and they mix heavy metal with Armenian folk melodies. That is where those sudden, strange turns in their songs come from.' },
    { g: 'metal', t: 'Heavy metal was born in Birmingham, England. Black Sabbath\'s guitarist Tony Iommi lost two fingertips in a factory accident, so he tuned his guitar lower to make the strings softer, and that heavy sound became metal.' },
    { g: 'punk', t: 'Punk was about doing it yourself: three chords and lots of energy. The Ramones wrote songs so short that most of them are over in about two minutes.' },
    { g: 'pop-punk', t: 'Pop-punk takes the speed of punk and adds big sing-along choruses. Green Day\'s album "Dookie", from 1994, has sold over 20 million copies.' },
    { g: 'post-punk', t: 'Post-punk started right after punk, around 1978, with bands who kept the energy but added moody guitars, synths and stranger lyrics.' },
    { g: 'britpop', t: 'Britpop was the British guitar wave of the mid-90s. In August 1995, Blur and Oasis released singles in the same week, and the newspapers called it the Battle of Britpop.' },
    { g: 'indie-rock', t: 'The Strokes recorded their first album "Is This It" in a small basement studio in New York, and it started a whole garage rock revival in 2001.' },
    { g: 'synth-pop', t: 'Synth-pop is pop built on synthesizers. In the early 80s, a synthesizer that cost a fortune a few years before suddenly became cheap enough for teenagers in their bedrooms.' },
    { g: 'french-touch', t: 'French touch is the name for the French house music of the late 90s. Daft Punk took their name from a bad review: a critic called their first band "a daft punky thrash".' },
    { g: 'funk-disco', t: 'Disco took over the world in the late 70s. "Stayin\' Alive" by the Bee Gees is about 103 beats per minute, almost the same speed as the rhythm used to teach CPR.' },
    { g: 'pop-legends', t: 'Michael Jackson\'s "Thriller" is the best-selling album of all time, with estimates of around 70 million copies sold.' },
    { g: 'moroccan', t: 'Hoba Hoba Spirit call their music "Hayha music", a mix of rock, gnawa, reggae and chaabi, sung in Darija, French and English. They come from Casablanca.' },
  ];
  R.genreMore = {
    'alt-pop': ['On the Gorillaz album "Plastic Beach", the band lives on a floating island made of rubbish in the middle of the ocean. Snoop Dogg, Lou Reed and Mos Def all visit.', 'The voice of 2-D, the Gorillaz singer, is Damon Albarn, who also sings in the band Blur.'],
    'hip-hop': ['MF DOOM always performed in a metal mask, inspired by the comic book villain Doctor Doom. Sometimes he even sent other people on stage wearing the mask.', 'Kendrick Lamar was the first rapper ever to win a Pulitzer Prize for music, in 2018, for his album "DAMN."', 'The word "scratching" comes from DJs moving a vinyl record back and forth under the needle. Grand Wizzard Theodore is said to have discovered it as a teenager, while his mum was telling him to turn the music down.'],
    'neo-psych': ['King Gizzard & the Lizard Wizard released five albums in 2017 alone. Their album "Nonagon Infinity" loops forever: the end leads straight back into the beginning.', 'MGMT\'s "Kids" started as a song the two friends wrote in college, years before it became a hit.'],
    'grunge': ['Nirvana\'s album "Nevermind" knocked Michael Jackson\'s "Dangerous" off the top of the American charts in January 1992. A small band from Aberdeen, Washington, beat the King of Pop.', 'Kurt Cobain was left-handed, so he played right-handed guitars upside down and restrung.'],
    'nu-metal': ['Linkin Park\'s first album "Hybrid Theory" was the best-selling album in the USA in 2001.', 'Korn\'s singer Jonathan Davis sometimes plays the bagpipes on stage.'],
    'metal': ['Black Sabbath\'s "Paranoid" was written in about twenty minutes, because the band needed one more short song to fill the album.'],
    'classic-rock': ['Queen recorded "Bohemian Rhapsody" in pieces, layering the voices so many times that the tape almost wore through. It took about three weeks.', 'The Beatles\' "Yellow Submarine" was sung by the drummer, Ringo Starr.'],
    'britpop': ['Blur\'s "Song 2" is called that because it was the second song on the album, and the band never gave it a real name.'],
    'french-touch': ['Daft Punk wore their robot helmets for almost 20 years and rarely showed their faces in public.', 'Justice put a big glowing cross on stage that became their symbol. Their song "D.A.N.C.E." was sung by a children\'s choir.'],
    'post-punk': ['The Cure\'s Robert Smith started wearing his famous messy hair and red lipstick in the early 80s, and has kept the look for more than 40 years.', 'The Smiths only existed for five years, from 1982 to 1987, and still changed indie music forever.'],
    'pop-punk': ['blink-182\'s "All the Small Things" video makes fun of the boy bands of 1999.'],
    'bedroom-pop': ['Mac DeMarco recorded his album "Salad Days" in his small Brooklyn apartment.', 'TV Girl\'s songs use lots of little samples from old films and records, like a scrapbook made of sounds.'],
    'pop-legends': ['Michael Jackson first showed the moonwalk on TV in 1983, during "Billie Jean", and the whole world tried to copy it.', 'Prince played almost every instrument on his early albums himself.'],
    'moroccan': ['Betweenatna\'s name plays on the English word "between" and the Darija word "binatna", "between us". Their songs mix rock with Moroccan sounds and a lot of humour.', 'Gnawa music, which many Moroccan rock bands borrow from, uses the guembri, a three-string bass lute, and big metal castanets called qraqeb.'],
    'art-rock': ['Radiohead released "In Rainbows" online in 2007 and let fans pay whatever they wanted for it, even nothing.'],
    'funk-disco': ['Earth, Wind & Fire\'s "September" starts by asking "Do you remember the 21st night of September?" Every year on that date, fans all over the internet post the song.'],
  };

  // ---------- themes of the songs: a line Luna can say when nothing more specific comes to mind ----------
  R.themeLine = {
    love: ['A love song. Feel free to stare out of the window dramatically.'],
    fun: ['This one is just pure fun. Volume up.', 'No deep meaning here, just a good time.', 'If this does not make you move a little, check your batteries.'],
    friends: ['This one goes out to your best friends. You know who they are.', 'A song about friendship. Send it to your people.'],
    freedom: ['A song about feeling free. Windows down, even if you are in your room.', 'This one sounds like the last day of school.'],
    rebel: ['A little rebellion, the musical kind.', 'This one has attitude. Borrow some.'],
    dreams: ['A song for big dreams.', 'This one is a daydream you can listen to.'],
    self: ['A song about being yourself, weird bits included. Especially the weird bits.', 'This one is about figuring out who you are. Spoiler: you are doing great.'],
    night: ['A night-time song. Perfect with fairy lights.', 'This one sounds like city lights at night.'],
    summer: ['A summer song, whatever the weather outside.', 'This one smells like sunscreen and holidays.'],
    space: ['A song from outer space. Literally, or almost.', 'Zero gravity mode: on.'],
    weird: ['This one is wonderfully weird. The best kind.', 'Strange and brilliant. Like the best people.'],
    heartbreak: ['A song for when things go wrong. They get better. They always do.', 'A sad-ish song, but a pretty one.'],
    hope: ['A song full of hope. Take some.', 'This one is a pep talk in disguise.'],
    school: ['A song about school. Relatable content.', 'Back-to-school energy, in song form.'],
    dance: ['A dance song. Nobody is watching. Go.', 'This one was made for dancing in your room.'],
    chill: ['A chill one. Breathe out.', 'Perfect for doing nothing at all, very well.'],
    'growing-up': ['A song about growing up. Slowly, then all at once.', 'This one is about getting older and cooler.'],
  };

  // pronunciation: names the voice would say wrong
  R.sayAs = [
    [/\bMF DOOM\b/g, 'M F Doom'], [/\bDANGERDOOM\b/g, 'Danger Doom'], [/\bDOOM\b/g, 'Doom'],
    [/\bTV Girl\b/g, 'T V Girl'], [/\bMGMT\b/g, 'M G M T'], [/\bAC\/DC\b/g, 'A C D C'], [/\bELO\b/g, 'E L O'],
    [/\bSZA\b/g, 'Sizza'], [/\bDARE\b/g, 'Dare'], [/\bHUMBLE\./g, 'Humble.'], [/\bDNA\./g, 'D N A.'],
    [/\bD\.A\.N\.C\.E\./g, 'Dance'], [/\bB\.Y\.O\.B\./g, 'B Y O B'], [/\bN\.I\.B\./g, 'N I B'], [/\bT\.N\.T\./g, 'T N T'],
    [/\bBetweenatna\b/gi, 'Bet-wee-nat-na'], [/\bHoba Hoba Spirit\b/g, 'Hoba Hoba Spirit'],
    [/\bDarija\b/g, 'Darija'],
    [/\bKevin Parker\b/g, 'Kevin Parker'], [/\bRim\b/g, 'Reem'], [/\bLuna\b/g, 'Luna'], [/\b19-2000\b/g, 'nineteen two thousand'],
    [/\b1901\b/g, 'nineteen oh one'], [/\b505\b/g, 'five oh five'], [/\b909\b/g, 'nine oh nine'], [/\bPts\. 1-5\b/g, 'Parts 1 to 5'], [/\bPt\. (\d)/g, 'Part $1'],
    [/\bSk8er Boi\b/g, 'Skater Boy'], [/#1\b/g, 'number one'], [/\b80's\b/g, 'eighties'], [/\bTri9i\b/g, 'Treeki'], [/\bNa3ess\b/g, 'Na-ess'], [/\bCaïd\b/g, 'Ka-eed'],
    [/\bFM\b/g, 'F M'], [/\bR&B\b/g, 'R and B'], [/\b&\b/g, 'and'], [/ - /g, ', '], [/\s—\s/g, ', '], [/…/g, '...'],
  ];
  // The desktop app's own voices (Kokoro) read some words differently from Edge's: these come first, then R.sayAs.
  // Two playlists the family fills for Rim (the owner adds the songs here, as 'Artist|Title|YouTube id'). A list shows in
  // Playlists once it has songs. Luna may name them and say a word about them (the owner's choice, 16 November 2026).
  R.giftLists = [
    { key: 'gift-uncle', name: "Uncle's Favorites", color: '#00e5ff', sticker: 'cassette', songs: [
      'Radiohead|Subterranean Homesick Alien|d1tQFX_9ct0',
      'King Crimson|I Talk to the Wind|UlKrH07au6E',
      'El Waili ft. Yucifer|Al Abd wal Waili|2M7ciSXwjEI',
      'M83|Wait|Rw7aMVvPDmc',
      'Pink Floyd|Fearless|IkgaMFjo_lI',
      'Frank Sinatra|My Way|RMnNpEWUGAs',
      'MIKA|Relax, Take It Easy|RVmG_d3HKBA',
      'The Police|Message in a Bottle|MbXWrmQW-OE',
      'Hello Psychaleppo|Tarab Dub|RwgCSUQWbzg',
      'sombr|12 to 12|U2HJj6J287Y',
      'Beastie Boys|Intergalactic|8O7k5sYEwDA',
      'Spires|Candy Flip|07EVdwinSIk',
      '50 Cent|I Get Money|PhBqZicEMgQ',
      'Tommy Richman|Million Dollar Baby|ZOkmEJHDP1g',
      'Caravan|All the Way|P3pzX5iKFsk',
      'Nick Drake|River Man|idcaRTg4-fM',
    ] },
    { key: 'gift-father', name: "Father's Favorites", color: '#ffe600', sticker: 'vinyl', songs: [
      'Dolly Parton|I Will Always Love You|lKsQR72HY0s',
      'Michael Jackson|You Are Not Alone|pAyKJAtDNCw',
      'Kenny Rogers|The Gambler|7hx4gdlfamo',
      'Boney M.|Rivers of Babylon|AhCZRZRFLqM',
      'Seal|Kiss from a Rose|3-Yh6rnOchs',
      'Bryan Adams|Have You Ever Really Loved a Woman?|diKIYv8tMC8',
      'Bob Marley & The Wailers|Buffalo Soldier|QiESgCu9Ehw',
      'Demis Roussos|Far Away|p20ay6Z2miE',
      'Lionel Richie|Say You, Say Me|lCP5rawjPKA',
      'Tracy Chapman|Fast Car|AIOAlaACuv4',
      'Joe Cocker|Unchain My Heart|ZtFUX4Y2U84',
      'Ben E. King|Stand By Me|hwZNL7QVJjE',
      'Phil Collins|Another Day in Paradise|eaFlJQGtBeM',
      "Stevie Wonder|Isn't She Lovely|Yvc983ptXr8",
      'Rod Stewart|Sailing|FOt3oQ_k008',
      'Kenny Rogers|Lady|0T1J8JuTtR8',
    ] },
  ];
  R.giftListLines = [
    'Here comes {name}: a playlist picked just for you, Rim. Enjoy every song.',
    'Time for {name}. Every song in here was chosen with you in mind.',
    'Now playing {name}. Good taste runs in the family.',
  ];
  R.kokoroSay = [
    [/\bRim\b/g, 'Ream'], [/\bGorillaz\b/g, 'Gorillas'], [/\bInc\.\s*(?=FM\b|F M\b)/g, 'Ink '], [/\bInc\./g, 'Ink.'], [/\bInc\b/g, 'Ink'],
    [/\bAC\/DC\b/g, 'AC DC'], [/\bAlvvays\b/g, 'Always'], [/\bCuco\b/g, 'Kooko'], [/\bLaufey\b/g, 'Lay-vay'],
    [/\bNujabes\b/g, 'Noo jah bess'], [/\bPortugal\. The Man\b/g, 'Portugal the Man'], [/\bRamones\b/g, 'Rah-moans'],
    [/\bblink-182\b/gi, 'blink one eighty two'], [/\bEarth, Wind & Fire\b/g, 'Earth Wind and Fire'], [/\bToro y Moi\b/g, 'Toro ee Moy'],
  ];
})();

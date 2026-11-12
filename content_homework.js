// Homework mode: instrumental stations only (no talking, no shows), plus ambient sounds.
// The exact video of each track is in content_ids.js (R.focusIds), so the stations also play on the website.
(function () {
  const R = window.RADIO;
  R.focusStations = [
    { id: 'lofi', label: 'Lofi & Chill Beats', note: 'soft beats for homework', tracks: [
      'Nujabes|Aruarian Dance', 'Nujabes|Reflection Eternal', 'Nujabes|Spiral', 'Nujabes|Kumomi', 'Nujabes|The Final View', 'Nujabes|Horizon',
      'J Dilla|Time: The Donut of the Heart', 'J Dilla|Last Donut of the Night', 'J Dilla|Waves', 'Jinsang|Affection', 'Jinsang|Solitude',
      'Tomppabeats|Monday Loop', 'idealism|Snowfall', 'idealism|Phosphene', 'Kupla|Owls of the Night', 'Mndsgn|Camelblues',
      'FKJ|Ylang Ylang', 'FKJ|Lying Together', 'FKJ|Skyline', 'Bonobo|Kiara', 'Bonobo|Cirrus', 'Bonobo|Kong',
      'Tycho|Awake', 'Tycho|Dive', 'Tycho|A Walk', 'Emancipator|Soon It Will Be Cold Enough to Build Fires', 'Emancipator|Lionheart',
    ] },
    { id: 'games', label: 'Game Soundtracks', note: 'cosy video game music', tracks: [
      'C418|Sweden', 'C418|Wet Hands', 'C418|Subwoofer Lullaby', 'C418|Mice on Venus', 'C418|Danny', 'C418|Haggstrom', 'C418|Living Mice', 'C418|Moog City', 'C418|Clark', 'C418|Minecraft',
      "ConcernedApe|Stardew Valley Overture", "ConcernedApe|Spring (It's a Big World Outside)", "ConcernedApe|Summer (Nature's Crescendo)", 'ConcernedApe|Fall (The Smell of Mushroom)', 'ConcernedApe|Winter (Nocturne of Ice)',
      'Toby Fox|Fallen Down', 'Toby Fox|Snowdin Town', 'Toby Fox|Home', 'Toby Fox|His Theme', 'Toby Fox|Undertale',
      'Lena Raine|First Steps', 'Lena Raine|Resurrections', 'Lena Raine|Scattered and Lost', 'Lena Raine|Reach for the Summit',
      'Christopher Larkin|Dirtmouth', 'Christopher Larkin|Greenpath', 'Christopher Larkin|City of Tears',
    ] },
    { id: 'piano', label: 'Piano & Ghibli', note: 'calm piano, anime film music', tracks: [
      "Joe Hisaishi|One Summer's Day", 'Joe Hisaishi|Merry-Go-Round of Life', 'Joe Hisaishi|Summer', 'Joe Hisaishi|The Path of the Wind', 'Joe Hisaishi|A Town with an Ocean View',
      'Ludovico Einaudi|Nuvole Bianche', 'Ludovico Einaudi|Experience', 'Ludovico Einaudi|Una Mattina', 'Ludovico Einaudi|I Giorni',
      'Yiruma|River Flows in You', 'Yiruma|Kiss the Rain', 'Yiruma|Maybe',
      'Ryuichi Sakamoto|Merry Christmas Mr. Lawrence', 'Claude Debussy|Clair de Lune', 'Erik Satie|Gymnopédie No. 1', 'Frédéric Chopin|Nocturne Op. 9 No. 2',
    ] },
    { id: 'synth', label: 'Synthwave & Retro', note: 'neon synths, no words', tracks: [
      'Home|Resonance', 'Home|We\'re Finally Landing', 'Home|Tides', 'Home|Half Moon Bay', 'Com Truise|Brokendate', 'Com Truise|Propagation',
      'Daft Punk|Derezzed', 'Daft Punk|End of Line', 'Daft Punk|Solar Sailer', 'Daft Punk|Recognizer', 'Daft Punk|Veridis Quo', 'Daft Punk|Aerodynamic',
      'Tycho|Montana', 'Tycho|Epoch', 'M83|Outro',
    ] },
    { id: 'groove', label: 'Instrumental Groove', note: 'funky, guitars, no words', tracks: [
      'Vulfpeck|Dean Town', 'Vulfpeck|Beastly', 'Snarky Puppy|Lingus', 'Snarky Puppy|Shofukan', 'CHON|Story', 'CHON|Waterslide', 'CHON|Can\'t Wait',
      'Polyphia|G.O.A.T.', 'Polyphia|Playing God', 'Khruangbin|August 10', 'Khruangbin|Two Fish and an Elephant', 'Explosions in the Sky|Your Hand in Mine',
    ] },
  ];
  // ambient sounds: one long recording at a time (its exact video in content_ids.js when one was checked)
  R.focusSounds = [
    { label: 'Rain on a window', q: 'rain on window sounds 3 hours' },
    { label: 'A quiet café', q: 'quiet cafe ambience sounds 2 hours no music' },
    { label: 'A cosy fireplace', q: 'fireplace crackling sounds 3 hours no music' },
    { label: 'Ocean waves', q: 'ocean waves sounds 3 hours no music' },
    { label: 'Forest and stream', q: 'forest stream birds sounds 3 hours no music' },
    { label: 'A library', q: 'library ambience sounds study 2 hours no music' },
  ];
})();

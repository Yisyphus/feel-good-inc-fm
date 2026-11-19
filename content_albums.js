// Album Party with Luna: whole albums in their own order (Library > Albums, or Settings > Album Party).
// Tracklists and lengths from Deezer; every track's lyrics checked (explicit tracks are left out, so it is the clean
// edition); the exact video of every track is in R.albumIds (content_albums.js), so it also plays on the website.
// What Luna says: an intro, then one note after every three tracks (the last note at the end). Facts only.
(function () {
  const R = window.RADIO;
  R.albumPlaylists = [];
  R.albumIntroPlain = 'Album Party! A whole album now, in its own order: {album}, by {artist}. Here we go.';
  R.albumOutros = [
    'And that was {album}, by {artist}, from start to finish. Album Party over. Back to the radio!',
    'That was the whole of {album}, by {artist}. Thank you for partying with me. Back to the mix.',
    '{album}, by {artist}: done, every track, in order. Iconic. Back to the radio.',
  ];
  R.albums = [
 {
  "id": "oracular",
  "artist": "MGMT",
  "title": "Oracular Spectacular",
  "year": 2007,
  "tracks": [
   "Weekend Wars",
   "The Youth",
   "Electric Feel",
   "Kids",
   "4th Dimensional Transition",
   "Pieces of What",
   "Of Moons, Birds & Monsters",
   "The Handshake",
   "Future Reflections"
  ],
  "lengths": [
   250,
   228,
   229,
   303,
   238,
   163,
   286,
   219,
   240
  ],
  "intro": "Album Party! MGMT, Oracular Spectacular, from 2007. Two friends who started making music at college in Connecticut. Here we go. A few tracks are left out tonight, so it is the clean edition.",
  "notes": [
   "Oracular Spectacular was produced by Dave Fridmann, who also works with The Flaming Lips. He loves big, colourful, crazy sounds.",
   "MGMT wrote \"Kids\" years before this album, when they were students at Wesleyan University.",
   "A remix of \"Electric Feel\" by Justice won a Grammy, for Best Remixed Recording.",
   "MGMT stands for The Management, their first band name. They had to shorten it."
  ]
 },
 {
  "id": "making-mirrors",
  "artist": "Gotye",
  "title": "Making Mirrors",
  "year": 2011,
  "tracks": [
   "Making Mirrors",
   "Easy Way Out",
   "Somebody That I Used to Know",
   "Eyes Wide Open",
   "Smoke and Mirrors",
   "I Feel Better",
   "In Your Light",
   "State of the Art",
   "Don't Worry, We'll Be Watching You",
   "Giving Me a Chance",
   "Save Me",
   "Bronte"
  ],
  "lengths": [
   61,
   118,
   241,
   191,
   313,
   198,
   279,
   322,
   199,
   187,
   233,
   194
  ],
  "intro": "Album Party! Gotye, Making Mirrors, from 2011. Gotye is Wally De Backer, born in Belgium and raised in Melbourne, Australia. The name comes from Gautier, the French way of saying Walter. He made most of this album by himself, in a little studio on his parents' farm. Here we go.",
  "notes": [
   "That was Somebody That I Used to Know, sung with Kimbra, a singer from New Zealand. The little guitar riff comes from an old recording by the Brazilian guitarist Luiz Bonfá. The song went to number one all around the world, America included.",
   "Fun fact about Eyes Wide Open: part of its bass sound is a fence! The Winton Musical Fence, in the Australian outback, has wires you can play like an instrument. And I Feel Better is his tribute to old Motown soul.",
   "State of the Art is about an old organ that plays by itself, the kind his parents had at home. Its animated video slowly turns a whole family into organ pipes.",
   "Making Mirrors won the Grammy for Best Alternative Music Album, and Somebody That I Used to Know won Record of the Year."
  ]
 },
 {
  "id": "currents",
  "artist": "Tame Impala",
  "title": "Currents",
  "year": 2015,
  "tracks": [
   "Let It Happen",
   "Nangs",
   "The Moment",
   "Eventually",
   "Gossip",
   "Past Life",
   "Disciples",
   "Reality in Motion",
   "New Person, Same Old Mistakes"
  ],
  "lengths": [
   469,
   106,
   255,
   319,
   55,
   227,
   106,
   251,
   362
  ],
  "intro": "Album Party! Tame Impala, Currents, from 2015. In the studio, Tame Impala is one person: Kevin Parker, from Perth, in Australia. He wrote, played, sang and produced every sound on this album, at home, near the beach. A few tracks are left out today, so it is the clean edition. Here we go.",
  "notes": [
   "Let It Happen is almost eight minutes long. Halfway through, it seems to skip, like a scratched CD. That is on purpose: Kevin Parker loves little glitches.",
   "Gossip is a tiny instrumental, under a minute. On this album Kevin swapped a lot of his guitars for synthesisers and disco grooves.",
   "New Person, Same Old Mistakes was later recorded by Rihanna, as Same Ol' Mistakes, on her album Anti. And Currents won Album of the Year at Australia's ARIA Awards."
  ]
 },
 {
  "id": "rabbit",
  "artist": "Yin Yin",
  "title": "The Rabbit That Hunts Tigers",
  "year": 2019,
  "tracks": [
   "Nata Ni Thlae",
   "Pingpxng",
   "One Inch Punch",
   "Lotus",
   "Thom Kï Kï",
   "On Yiep",
   "Alpaca Mountain",
   "Kroy Wen",
   "Suì Yè",
   "The Rabbit That Hunts Tigers",
   "A Ballad for Chong Wang",
   "The Sacred Valley of Cusco",
   "Dis kô Dis kô"
  ],
  "lengths": [
   54,
   159,
   308,
   110,
   221,
   53,
   335,
   177,
   233,
   348,
   84,
   282,
   260
  ],
  "intro": "Album Party! Yin Yin, The Rabbit That Hunts Tigers, from 2019. Yin Yin are a band from Maastricht, in the Netherlands, who fell in love with the groovy music of Southeast Asia from the sixties and seventies. Almost no words, just grooves. Here we go.",
  "notes": [
   "One Inch Punch is named after a famous martial arts move: a punch from really close up, made famous by Bruce Lee.",
   "Listen for the twangy guitars and the organ. That sound comes from old Thai and Cambodian records, which Yin Yin love.",
   "Kroy Wen is New York, spelled backwards. Try it!",
   "The Rabbit That Hunts Tigers: what a name for an album. A tiny rabbit, chasing tigers. Brave little rabbit.",
   "The Sacred Valley of Cusco is named after a valley in Peru, near Machu Picchu. And that was Yin Yin's very first album."
  ]
 },
 {
  "id": "hurry-up",
  "artist": "M83",
  "title": "Hurry Up, We're Dreaming",
  "year": 2011,
  "tracks": [
   "Intro",
   "Midnight City",
   "Reunion",
   "Where the Boats Go",
   "Wait",
   "Raconte-moi une histoire",
   "Train to Pluton",
   "Claudia Lewis",
   "This Bright Flash",
   "When Will You Come Home?",
   "Soon, My Friend",
   "My Tears Are Becoming a Sea",
   "New Map",
   "OK Pal",
   "Another Wave from You",
   "Splendor",
   "Year One, One UFO",
   "Fountains",
   "Steve McQueen",
   "Echoes of Mine",
   "Klaus I Love You",
   "Outro"
  ],
  "lengths": [
   323,
   244,
   235,
   106,
   343,
   244,
   76,
   272,
   144,
   84,
   189,
   152,
   263,
   238,
   114,
   308,
   198,
   82,
   229,
   220,
   105,
   247
  ],
  "intro": "Album Party! M83, Hurry Up, We're Dreaming, from 2011. M83 is Anthony Gonzalez, from Antibes, in the south of France, and the name comes from a galaxy, Messier 83. This is a double album: twenty two tracks, one big dreamy trip. Here we go.",
  "notes": [
   "Midnight City is M83's most famous song. Wait for that huge saxophone solo at the end: it was played by James King.",
   "Raconte-moi une histoire means tell me a story, in French. A little girl tells the story, about a tiny magic frog.",
   "Train to Pluton: Pluton is the French name for Pluto.",
   "Anthony made a lot of this album in Los Angeles, after moving there from France.",
   "Past the halfway mark! On this album M83 used real saxophones, strings and choirs, not only synthesisers.",
   "M83 love big, shiny sounds, like the soundtracks of eighties movies.",
   "Steve McQueen is named after the American movie star, famous for his fast cars and motorbikes.",
   "Midnight City has been in films, ads and TV shows ever since."
  ]
 }
];
  R.albumIds = {"oracular": ["9Xr19xFGaHU", "smeu342GAHo", "MmZexg8sxyk", "4qb8AfVvhUI", "rlExzSQW9aw", "dtlvNrLeqK4", "v6HXS11l4sw", "mvJcKcdam6I", "-3QQ6Aoy2pc"], "making-mirrors": ["dU9fic4C9m4", "0SmGNNdRQjc", "_iRmr3_GRxw", "oyVJsg0XIIk", "-6LQv90mEPk", "sRC--2qC_Qs", "4HwgDDw5350", "xWIKQMBBTtk", "GZMNovQL3Ns", "KkoDyRJCeRg", "BpV8j8P994U", "le34ygtODfI"], "currents": ["NMRhx71bGo4", "Ao_Pjo-xf1M", "Mv0oYS-qMcQ", "YifOMt9dlGk", "fJ1eOs-d_JI", "gvXswl1il_0", "RlhTbdJ6-3M", "en2Erz9i98g", "tEXYfT_G0W0"], "rabbit": ["39UV3QO1zWk", "ctilD3NrRPs", "j9sPnp8dFQQ", "RoZWqndNXOk", "E0W2FWJb5s8", "XGchDYtrsHM", "I-dtR6H-jwQ", "HEWq78g04HM", "qW605nQXqDc", "jGJQl-s9i9c", "Rs92NO2RoQU", "wvuEQurocVQ", "KKarVcrzCls"], "hurry-up": ["9foCI43HWEQ", "K8v_DaCcORQ", "9ayiYR24hzQ", "riJeQPdKzx0", "iQnRCdtECl8", "xy23B15pMCI", "-P18Vn9H6XQ", "n5Ez1cJfP7o", "g58tgsAXeKo", "-ILjZTOU-84", "MFyQRQiBuys", "oEEI6wDOKks", "uYwwcQwQmUo", "ra9mxNDuSEw", "ztLuu5tO0S0", "x5y8mG7Jc-g", "_No8J08lGnQ", "tKt8FELf43w", "iv9R6fxd11w", "VbqLCIra7h8", "Us1hLCoFY8g", "mpEhKQteA3o"]};
})();

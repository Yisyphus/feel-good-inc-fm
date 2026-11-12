// Album Party with Joe: whole albums in their own order (Library > Albums, or Settings > Album Party).
// Tracklists and lengths from Deezer; every track's lyrics checked (explicit tracks are left out, so it is the clean
// edition); the exact video of every track is in R.albumIds (content_albums.js), so it also plays on the website.
// What Joe says: an intro, then one note after every three tracks (the last note at the end). Facts only.
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
  "id": "gorillaz-demon-days",
  "artist": "Gorillaz",
  "title": "Demon Days",
  "year": 2005,
  "tracks": [
   "Intro",
   "Last Living Souls",
   "Kids with Guns",
   "O Green World",
   "El Mañana",
   "Every Planet We Reach Is Dead",
   "All Alone",
   "White Light",
   "DARE",
   "Fire Coming out of the Monkey's Head",
   "Demon Days"
  ],
  "lengths": [
   67,
   195,
   225,
   275,
   236,
   295,
   213,
   133,
   245,
   199,
   268
  ],
  "intro": "Album Party time! Gorillaz, Demon Days, from 2005, the whole thing in order. Produced by Danger Mouse, with guests like Shaun Ryder, Neneh Cherry and the actor Dennis Hopper. Lights down, here we go. A few tracks are left out tonight, so it is the clean edition.",
  "notes": [
   "Fun fact: Demon Days was produced by Danger Mouse, who later made Gnarls Barkley's \"Crazy\". He and Damon Albarn built the album like a journey through one long, strange night.",
   "On \"Kids with Guns\", the second voice is Neneh Cherry, a singer who had big hits in the late 80s. Gorillaz love mixing totally different worlds on one album.",
   "\"DARE\" became Gorillaz's first number one single in the UK. The voice of the dancing head in the video is Shaun Ryder.",
   "The actor Dennis Hopper tells the story in \"Fire Coming Out of the Monkey's Head\". A Hollywood legend, on a cartoon band's album.",
   "The kids singing on \"Dirty Harry\" are a real children's choir from California. Damon Albarn loves a choir."
  ]
 },
 {
  "id": "gorillaz-plastic-beach",
  "artist": "Gorillaz",
  "title": "Plastic Beach",
  "year": 2010,
  "tracks": [
   "Orchestral Intro",
   "Welcome to the World of the Plastic Beach",
   "Rhinestone Eyes",
   "Stylo",
   "Superfast Jellyfish",
   "Empire Ants",
   "Glitter Freeze",
   "Some Kind of Nature",
   "On Melancholy Hill",
   "Broken",
   "Sweepstakes",
   "Plastic Beach",
   "To Binge",
   "Cloud of Unknowing",
   "Pirate Jet"
  ],
  "lengths": [
   69,
   215,
   200,
   270,
   174,
   283,
   243,
   179,
   233,
   197,
   320,
   227,
   235,
   186,
   152
  ],
  "intro": "Album Party! Gorillaz, Plastic Beach, from 2010. In the story, Murdoc builds an island out of plastic rubbish in the middle of the ocean, and invites the whole world. Snoop Dogg opens the door. Here we go. A few tracks are left out tonight, so it is the clean edition.",
  "notes": [
   "Plastic Beach is about plastic and rubbish taking over the planet, told like a cartoon adventure. Damon Albarn said the idea came from all the plastic washing up on beaches around the world.",
   "The guests on Plastic Beach are wild: Snoop Dogg, Lou Reed, Mos Def, De La Soul, Little Dragon and the soul legend Bobby Womack.",
   "In the \"Stylo\" video, the band is chased through the desert by Bruce Willis. Yes, the real one.",
   "\"Superfast Jellyfish\" makes fun of breakfast cereal adverts. De La Soul are back on the mic."
  ]
 },
 {
  "id": "dsotm",
  "artist": "Pink Floyd",
  "title": "The Dark Side of the Moon",
  "year": 1973,
  "tracks": [
   "Breathe (In the Air)",
   "On the Run",
   "Time",
   "The Great Gig in the Sky",
   "Us and Them",
   "Any Colour You Like",
   "Brain Damage",
   "Eclipse"
  ],
  "lengths": [
   169,
   216,
   422,
   284,
   472,
   205,
   230,
   126
  ],
  "intro": "Album Party! Pink Floyd, The Dark Side of the Moon, from 1973, one of the best-selling albums of all time. It flows from track to track like one long piece. Press nothing, just listen. A few tracks are left out tonight, so it is the clean edition.",
  "notes": [
   "The Dark Side of the Moon was recorded at Abbey Road in London, the same studios as The Beatles. The heartbeat you hear at the very end is a bass drum, made to sound like a human heart.",
   "The singer on \"The Great Gig in the Sky\" is Clare Torry. She made up her whole performance in one evening, without words, and was paid about thirty pounds.",
   "The clocks on \"Time\" were recorded one by one in an antique shop by the engineer Alan Parsons.",
   "The album cover, a beam of light going through a prism, was designed by Storm Thorgerson and his studio Hipgnosis. It is one of the most famous covers ever.",
   "This album stayed in the American charts for more than 900 weeks. That is over seventeen years."
  ]
 },
 {
  "id": "opera",
  "artist": "Queen",
  "title": "A Night at the Opera",
  "year": 1975,
  "tracks": [
   "Lazing On A Sunday Afternoon",
   "I'm In Love With My Car",
   "You're My Best Friend",
   "'39",
   "Sweet Lady",
   "Seaside Rendezvous",
   "The Prophet's Song",
   "Love of My Life",
   "Good Company",
   "Bohemian Rhapsody",
   "God Save the Queen"
  ],
  "lengths": [
   67,
   185,
   177,
   211,
   244,
   135,
   501,
   219,
   203,
   354,
   73
  ],
  "intro": "Album Party! Queen, A Night at the Opera, from 1975. It is named after a Marx Brothers comedy film, and it was one of the most expensive albums ever made at the time. Bohemian Rhapsody is in here. Here we go. A few tracks are left out tonight, so it is the clean edition.",
  "notes": [
   "A Night at the Opera took months of recording in several studios. Queen layered their voices so many times that the tapes almost wore out.",
   "\"You're My Best Friend\" was written by John Deacon, Queen's bass player, for his wife.",
   "\"'39\" was written by Brian May, who is also an astrophysicist. It is a folk song about space travellers who come home and find that a hundred years have passed.",
   "Freddie Mercury wrote \"Bohemian Rhapsody\" in pieces, and the band recorded it over about three weeks.",
   "The album ends with Brian May's guitar version of the British national anthem."
  ]
 },
 {
  "id": "salad-days",
  "artist": "Mac DeMarco",
  "title": "Salad Days",
  "year": 2014,
  "tracks": [
   "Salad Days",
   "Blue Boy",
   "Let Her Go",
   "Goodbye Weekend",
   "Let My Baby Stay",
   "Passing Out Pieces",
   "Treat Her Better",
   "Chamber Of Reflection",
   "Go Easy",
   "Jonny's Odyssey"
  ],
  "lengths": [
   146,
   126,
   183,
   180,
   248,
   167,
   229,
   232,
   205,
   158
  ],
  "intro": "Album Party! Mac DeMarco, Salad Days, from 2014. He recorded it at home, in his apartment, playing almost every instrument. Wobbly guitars, here we go. A few tracks are left out tonight, so it is the clean edition.",
  "notes": [
   "\"Salad days\" is an old English phrase that means your young, carefree years. Shakespeare used it first, in \"Antony and Cleopatra\".",
   "Mac DeMarco was 23 when he made Salad Days, and lots of the songs are about growing up and figuring things out.",
   "The melody of \"Chamber of Reflection\" comes from a 1970s Japanese song, \"The Word II\" by Shigeo Sekito.",
   "Mac recorded most of Salad Days on his own, in his small Brooklyn apartment."
  ]
 },
 {
  "id": "off-the-wall",
  "artist": "Michael Jackson",
  "title": "Off the Wall",
  "year": 1979,
  "tracks": [
   "Don't Stop 'Til You Get Enough",
   "Rock with You",
   "Workin' Day and Night",
   "Get on the Floor",
   "Off the Wall",
   "Girlfriend",
   "She's Out of My Life",
   "I Can't Help It",
   "It's the Falling in Love",
   "Burn This Disco Out"
  ],
  "lengths": [
   364,
   219,
   312,
   278,
   245,
   184,
   218,
   269,
   228,
   221
  ],
  "intro": "Album Party! Michael Jackson, Off the Wall, from 1979. His first album with the producer Quincy Jones, and the start of everything. Dancing shoes on.",
  "notes": [
   "Off the Wall was Michael Jackson's first album with Quincy Jones, who later produced Thriller and Bad.",
   "Michael Jackson wrote \"Don't Stop 'Til You Get Enough\" himself, and you can hear him clinking glass bottles in the percussion.",
   "\"Rock with You\" was written by Rod Temperton, who also wrote \"Thriller\".",
   "\"Girlfriend\" was written for Michael by Paul McCartney."
  ]
 },
 {
  "id": "thriller",
  "artist": "Michael Jackson",
  "title": "Thriller",
  "year": 1982,
  "tracks": [
   "Wanna Be Startin' Somethin'",
   "Baby Be Mine",
   "The Girl Is Mine",
   "Thriller",
   "Beat It",
   "Billie Jean",
   "Human Nature",
   "P.Y.T. (Pretty Young Thing)",
   "The Lady in My Life"
  ],
  "lengths": [
   363,
   260,
   222,
   358,
   258,
   293,
   245,
   238,
   298
  ],
  "intro": "Album Party! Michael Jackson, Thriller, from 1982. The best-selling album of all time. Moonwalk shoes on. Here we go.",
  "notes": [
   "Thriller was produced by Quincy Jones. Seven of its nine songs became top ten hits in America. Seven!",
   "The guitar solo on \"Beat It\" is by Eddie Van Halen, and he did it for free.",
   "\"The Girl Is Mine\" is a duet with Paul McCartney of The Beatles. Two legends arguing about who gets the girl.",
   "The spooky voice on \"Thriller\" is the horror film star Vincent Price.",
   "In 1984, Thriller won eight Grammy Awards in a single night, a record at the time."
  ]
 },
 {
  "id": "discovery",
  "artist": "Daft Punk",
  "title": "Discovery",
  "year": 2001,
  "tracks": [
   "One More Time",
   "Aerodynamic",
   "Digital Love",
   "Harder, Better, Faster, Stronger",
   "Crescendolls",
   "Nightvision",
   "Superheroes",
   "High Life",
   "Something About Us",
   "Voyager",
   "Veridis Quo",
   "Short Circuit",
   "Face to Face",
   "Too Long"
  ],
  "lengths": [
   320,
   212,
   301,
   226,
   211,
   104,
   237,
   201,
   232,
   227,
   345,
   206,
   240,
   600
  ],
  "intro": "Album Party! Daft Punk, Discovery, from 2001. They said it was about the feeling of being a kid and discovering music for the first time. Robot helmets on.",
  "notes": [
   "The whole of Discovery became an anime film, \"Interstella 5555\", made with the Japanese artist Leiji Matsumoto. No dialogue, just the album.",
   "The voice on \"One More Time\" is Romanthony, a house music singer, run through effects to sound half robot.",
   "\"Harder, Better, Faster, Stronger\" is built on a small piece of an old funk song, \"Cola Bottle Baby\" by Edwin Birdsong.",
   "\"Face to Face\" was made with Todd Edwards, a producer famous for chopping up tiny bits of sound into new melodies.",
   "Daft Punk said the robots were born on the 9th of September 1999, at 9:09, when their sampler exploded. A robot origin story."
  ]
 },
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
 }
];
  R.albumIds = {"gorillaz-demon-days":["c6oK14Pt9Qk","k7wIluiBvZE","VCkFSe3voRc","tMt_YXr90AM","hji4gBuOvIQ","1nrL7wN_-Qc","VHhND-BkWdk","P91kQ8ADh5Q","YJR5ESRgVVk","B1MSj4SV7Xg","LTJjQj6PkrY"],"gorillaz-plastic-beach":["vQgznbXClX4","XfjVCjaPRek","7GdsftXc0yU","-SxlD74hvRk","7KbiZkx4I7w","TVDALC7ke0A","9EM35Iyh5yE","eE1xxNYlzRk","dgnL3GDC2O8","crC4DKiKPYY","lipCNmVj4u0","pWIx2mz0cDg","JmRq9CvO98M","kaAci9JUE7M","Xqqb0LGVKiI"],"dsotm":["jcz0YxYl6Ac","G0wOOlwXLgA","yl-Ms_ek-kE","2PMnJ_Luk_o","GIoJ_ihR7SA","l8pEjmZVx3k","QFdkM40KOhE","7-mFsGm1uvQ"],"opera":["2FKP_negRp8","k0AbRrVKbNw","Z2Zkr76YvWs","alTouNCf100","SOvAGU_6ZyE","o98-eSfjUZ8","idILBuDuVqY","JfZaQam5Gmo","-1T4th9aM6c","xG16sdjLtc0","ntSVk44iPXQ"],"salad-days":["RheJW2nhkb8","HfumI-O7pPo","3q7qo-Zpmtc","iT_XB9mhPnY","Yv7u3yEIObo","6Lk3NFWw9Fg","vh6PXxuQ0-Y","LE19FoCMdz8","3iSAUxeYFJI","3aYLB5Yp_bE"],"off-the-wall":["LUDvEcNU2l0","TXTpVCTUFtQ","5_inb06QAc0","6bysZqF5MDU","_gI7x78FwdQ","O8rc8FNCHcU","6DQJPL9Yuq0","re3MOe1SBOs","42BzzHePhxI","_F06umiWDDw"],"thriller":["1XMvPTFzgVU","q3HD_2i5ddQ","yzKxYJL3y_g","BIBpeA1szPM","foksOB27mxY","p1ct1plRUtw","_n9HhmX36Gk","_GlgOkBR1vU","qMerFY0mr84"],"discovery":["A2VpR8HahKc","Mjpu0-o9iek","4whD6uAryMs","yydNF8tuVmU","oor2uIqys8M","NQ-mm1H7uJw","UBGfS7S9BYg","KlUtJOTmmk8","em0MknB6wFo","INbgG9M0WYE","TCd6PfxOy0Y","9hhVnRTNVmM","UKYWWfR_GKA","Z6_ZNW1DACE"],"oracular":["9Xr19xFGaHU","smeu342GAHo","MmZexg8sxyk","4qb8AfVvhUI","rlExzSQW9aw","dtlvNrLeqK4","v6HXS11l4sw","mvJcKcdam6I","-3QQ6Aoy2pc"]};
})();

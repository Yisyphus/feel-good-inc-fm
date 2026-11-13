// The shows: Today's Mission, side quests, Book Nook, notes to Rim, Luna & Joe, the birthday, the bulletin, the tour.
// Advice is offered, never ordered. Missions are always small, safe and harmless.
(function () {
  const R = window.RADIO;

  // ---------- Today's Mission: once a day, the first time the radio is on ----------
  // Today's Mission: Luna hands over, Joe gives the mission
  R.missionHandovers = ['Joe, what is the mission today?', 'Joe, you have the mission, right?', 'Over to Joe for today\'s mission.', 'Joe, mission time. Go.'];
  R.missionLeads = ['Okay Rim, mission time.', 'Attention please, mission incoming.', 'Rim, your mission, should you choose to accept it.', 'Daily mission, coming right up.'];
  R.missions = [
    "Today's mission: draw one tiny doodle in the corner of a notebook page, and listen to one song you have never heard before.",
    "Today's mission: move one thing in your room to a new spot, and see if the room feels different.",
    "Today's mission: find the bass line in the next song and hum it. Out loud, if you are brave.",
    "Today's mission: make a playlist with exactly five songs and give it the most dramatic name you can think of.",
    "Today's mission: read one page of a book you have not opened in a while.",
    "Today's mission: write down three things that made you smile today. Tiny things count.",
    "Today's mission: put a new sticker, pin or keyring somewhere on your bag.",
    "Today's mission: listen to a whole song with your eyes closed, and guess how many instruments are in it.",
    "Today's mission: invent a band name and design its logo on a scrap of paper.",
    "Today's mission: drink a full glass of water, then tell your reflection it is doing amazing.",
    "Today's mission: find a song from the year your mum or dad was a teenager, and ask them about it.",
    "Today's mission: tidy just one drawer. Only one. Then celebrate like you won a trophy.",
    "Today's mission: learn the chorus of the next song by heart.",
    "Today's mission: send a nice message to a friend for no reason at all.",
    "Today's mission: make up a dance move and give it a name.",
    "Today's mission: write the first line of a story that starts with: the radio started talking to me.",
    "Today's mission: find something blue, something green and something pink in your room, and make them into a little display.",
    "Today's mission: listen to a song in a language you do not speak, and guess what it is about.",
    "Today's mission: draw your favourite album cover from memory. Bonus points if it is terrible.",
    "Today's mission: try to say Gorillaz, Radiohead and Tame Impala five times fast.",
    "Today's mission: make your own mini zine with one sheet of paper, folded into eight.",
    "Today's mission: pick a song and read its lyrics while it plays. Notice one line you never noticed before.",
    "Today's mission: decorate one page of a notebook just because you can.",
    "Today's mission: find out what year your favourite song came out.",
    "Today's mission: write down your top three albums of all time. Then argue with yourself about it.",
    "Today's mission: make a cool outfit out of clothes you already have, Dress to Impress style, just for fun.",
    "Today's mission: open the window for five minutes and listen to what the outside sounds like.",
    "Today's mission: put your phone on the other side of the room for one whole album side.",
    "Today's mission: learn one new word and use it in a sentence today. Today's suggestion: serendipity.",
    "Today's mission: build the comfiest corner in your room with pillows and blankets.",
    "Today's mission: listen to a song and draw what it looks like, colours only.",
    "Today's mission: find a song with a cowbell in it. They are out there.",
    "Today's mission: give your room a fake radio station name, and announce it out loud.",
    "Today's mission: write a two-line poem about your breakfast.",
    "Today's mission: ask someone at home what song they loved at your age.",
    "Today's mission: find three songs that start with the same letter as your name.",
    "Today's mission: make a little paper bookmark and use it in your current book.",
    "Today's mission: tell someone a fun fact you heard on this radio.",
    "Today's mission: count how many times the word love shows up in the next three songs.",
    "Today's mission: stretch for one full song. Rock star stretches only.",
    "Today's mission: plan your dream concert: three bands, one stage, you choose the order.",
    "Today's mission: hide a nice note somewhere for someone at home to find.",
    "Today's mission: learn to whistle the start of a song you love. Or try. Trying counts.",
    "Today's mission: rearrange your books by colour. It looks unreal.",
    "Today's mission: do your hardest homework task first, then reward yourself with your favourite song.",
    "Today's mission: write your name in a font you invent.",
    "Today's mission: find out what an album you love was almost called.",
    "Today's mission: make a sticker sheet design for your own imaginary band.",
    "Today's mission: listen to one song from the 1970s and one from this year, and decide which one wins.",
    "Today's mission: say thank you to someone who does something nice for you today.",
  ];

  // ---------- side quests: offered, never ordered ----------
  R.sideQuestLeads = ['Side quest, if you feel like it.', 'Optional side quest. Totally optional.', 'Here is a little side quest. No pressure at all.', 'Side quest unlocked, if you want it.'];
  R.sideQuestNames = { creative: 'Creativity', study: 'Study hack', school: 'School life', room: 'Room and bag', books: 'Book pick', music: 'Music discovery' };
  R.sideQuests = {
    creative: [
      'If you feel like it, try drawing a song: pick one, and draw whatever it makes you see. No rules.',
      'Creativity trick: when you are stuck, make something on purpose badly. It unlocks the good ideas.',
      'If you have a minute, write down five random words, then try to make a story out of them.',
      'Try this, if you want: take a photo of something ordinary from a really weird angle. Instant art.',
      'Little idea: keep a page just for band names, outfit ideas and doodles. Artists call it a sketchbook. You can call it chaos.',
      'If you are in the mood, make a comic strip of your day in four boxes. Stick figures are allowed.',
      'Creativity hack: set a timer for ten minutes and make anything. When it rings, you stop, even if it is unfinished.',
      'If you like, design the album cover for your life so far. What would it be called?',
    ],
    study: [
      'Study hack, if it helps: work for 25 minutes, then a 5-minute break. Homework mode has a timer for exactly that.',
      'A trick that works for lots of people: explain what you just learned to an imaginary student. If you can teach it, you know it.',
      'If you have a test coming, try testing yourself instead of just re-reading. It sticks way better.',
      'Little hack: start with the easiest task, just to get going. Momentum is a real thing.',
      'If you feel like it, write the three most important things from a lesson on a sticky note. Tiny summaries are powerful.',
      'Study hack: music without lyrics helps some people focus. That is what the chill stations in Homework mode are for.',
      'If something feels too big, cut it into tiny pieces. One exercise. Then one more.',
      'A good one: sleep is part of studying. Your brain saves what you learned while you sleep.',
    ],
    school: [
      'School life tip, if you want it: pack your bag the night before. Morning you will be grateful.',
      'If a day at school was rough, remember: one bad day is just one day. Tomorrow resets.',
      'Little reminder: asking a question in class is brave, and half the class probably wanted to ask it too.',
      'If you feel like it, sit next to someone new one day. Best friends start that way.',
      'Tip: keep a spare pen and a snack in your bag. Future you will call you a genius.',
      'If someone is mean, it says more about them than about you. Hang out with the people who make you laugh.',
      'School hack: write homework down the moment it is given. Memory is a liar.',
    ],
    room: [
      'Room idea, if you feel like it: fairy lights along one wall. Instant music video.',
      'Decorating tip: group posters or pictures together in one spot. It looks like a gallery wall.',
      'If you like, make a little shelf corner for your favourite things: a book, a plant, a figure, a candle that you never light.',
      'Bag idea: a few pins or keyrings that show your favourite bands. Instant personality.',
      'Room hack: rearranging the furniture a little can make the room feel brand new, for free.',
      'If you feel creative, wrap a plain notebook in old magazine pages and make it yours.',
      'Little idea: a mood board on the wall with pictures, tickets and stickers you love.',
      'Bag decorating idea: a patch, a ribbon, or a tiny charm. Small things, big style.',
    ],
    books: [
      'Book pick, if you want one: The Hobbit, by J.R.R. Tolkien. A small hobbit, a big adventure, and a dragon who loves gold way too much.',
      'Book pick: Percy Jackson and the Lightning Thief, by Rick Riordan. Greek gods, but funny.',
      'If you feel like reading something short and magical: Coraline, by Neil Gaiman. Creepy-cute and very clever.',
      'Book idea: Howl\'s Moving Castle, by Diana Wynne Jones. Yes, the one the Studio Ghibli film is based on.',
      'Book pick: Wonder, by R.J. Palacio. Warm, funny, and it will make you want to be kind on purpose.',
      'If you like mysteries: The Westing Game, by Ellen Raskin. Sixteen heirs, one puzzle.',
      'Book pick: Nimona, by ND Stevenson. A graphic novel about a shapeshifter who is way too much fun.',
      'If you want a classic that is actually fun: Alice\'s Adventures in Wonderland. It is short, and completely bonkers.',
    ],
    music: [
      'Music discovery, if you want: if you like Tame Impala, try Pond, a band that shares members with them.',
      'If you love Gorillaz, the Blur song "Song 2" is by the same singer. Spot the voice.',
      'Discovery tip: listen to an album from start to finish once. The Album Party in Settings does exactly that, with stories.',
      'If you like Steve Lacy, try The Internet, the band he played guitar in.',
      'If you love MF DOOM, look up what he did with Madlib. The album is called Madvillainy.',
      'Discovery idea: pick a band you love and find the band that inspired them. Rabbit hole, in a good way.',
      'If you like King Gizzard, here is a challenge: they have more than 25 albums. Pick one at random.',
      'If you like Hoba Hoba Spirit, try Betweenatna: Moroccan rock with a lot of humour, also sung in Darija.',
    ],
  };

  // ---------- trivia shots: leads, and general music trivia when the song has none ----------
  R.triviaLeads = ['Trivia shot!', 'Okay, trivia time.', 'Fun fact incoming.', 'Did you know?', 'Here is a trivia shot for you.'];
  R.genreLeads = ['A little genre trivia.', 'Genre trivia time.', 'Quick history lesson, the fun kind.'];
  R.triviaShots = [
    'The longest song ever to top the American charts was "All Too Well", the ten-minute version, by Taylor Swift. Ten minutes and thirteen seconds.',
    'A song gets stuck in your head because of a thing scientists call an earworm. The cure, some say, is chewing gum. Seriously.',
    'Queen\'s "Bohemian Rhapsody" has no chorus at all. It is basically a tiny opera.',
    'The guitar riff of "Seven Nation Army" by The White Stripes is played on a guitar, not a bass. Jack White used a pedal to make it sound an octave lower.',
    'Vinyl records are making a comeback. In the UK, people have been buying more of them every year for over fifteen years.',
    'The world\'s oldest known song is about 3,400 years old. It was found written on clay tablets in Syria.',
    'Daft Punk\'s "One More Time" uses a voice that sounds like a robot. That is Romanthony, a real singer, run through effects.',
    'Michael Jackson\'s famous lean in "Smooth Criminal" was done with special shoes that hooked into the stage.',
    'Pink Floyd\'s "The Dark Side of the Moon" stayed in the American album charts for more than 900 weeks.',
    'The Beatles\' song "Yesterday" came to Paul McCartney in a dream. He was sure he had copied it from somewhere.',
    'Kurt Cobain named "Smells Like Teen Spirit" after something a friend wrote on his wall. Teen Spirit was a deodorant.',
    'The first song ever played on MTV, in 1981, was "Video Killed the Radio Star". Rude, honestly, for a radio host to hear.',
    'Mac DeMarco once gave fans his home address in a song, and invited them over for coffee.',
    'Gorillaz once played a concert as holograms, at the Grammy Awards in 2006, with Madonna.',
    'Tame Impala is named after an African antelope, the impala.',
    'The Smiths\' singer Morrissey and guitarist Johnny Marr started the band after Johnny knocked on Morrissey\'s door in Manchester.',
    'System of a Down\'s song "Chop Suey!" was originally called "Suicide". The label asked them to change it.',
    'A typical pop song is between three and four minutes long, because that is about what an old 7-inch record could hold.',
    'Black Sabbath\'s "Iron Man" has nothing to do with the Marvel superhero. It came out years before the films, though Marvel used it later.',
    'Hoba Hoba Spirit have played in Morocco\'s biggest festivals, from Mawazine to L\'Boulevard, the rock festival in Casablanca.',
  ];

  // ---------- Book Nook with Joe: a pitch for a novel, or a fun public-domain extract ----------
  R.bookLeads = ['Book Nook time. Joe, over to you.', 'And now, Book Nook, with Joe.', 'Joe has a book for you, Rim. Take it away, Joe.', 'Book Nook. Joe, what are we reading?'];
  R.bookNook = [
    { title: 'The Hobbit', by: 'J.R.R. Tolkien', t: ['Today\'s book is The Hobbit. Bilbo Baggins loves his armchair, his snacks and his quiet life. Then thirteen dwarves and a wizard knock on his door, and suddenly he is off to steal treasure from a dragon.', 'It is funny, cosy and full of adventure. Perfect for reading under a blanket.'], joe: 'Thanks Joe. Second breakfast, anyone?' },
    { title: 'Alice\'s Adventures in Wonderland', by: 'Lewis Carroll', t: ['A tiny bit from Alice in Wonderland, written in 1865.', '"But I don\'t want to go among mad people," Alice remarked. "Oh, you can\'t help that," said the Cat: "we\'re all mad here. I\'m mad. You\'re mad." "How do you know I\'m mad?" said Alice. "You must be," said the Cat, "or you wouldn\'t have come here."'], joe: 'Honestly, that cat would be a great radio host.' },
    { title: 'Percy Jackson and the Lightning Thief', by: 'Rick Riordan', t: ['Here is one you will fly through: Percy Jackson and the Lightning Thief. Percy is twelve, gets in trouble at every school, and then finds out his dad is a Greek god. Oops.', 'It is fast, funny and full of monsters. And the gods are hilariously dramatic.'] },
    { title: 'Coraline', by: 'Neil Gaiman', t: ['Today, Coraline. A girl moves into an old house and finds a small door to another version of her home, where everything is better. Too much better. And everyone has buttons for eyes.', 'Creepy, clever and brave. You will cheer for Coraline the whole way.'] },
    { title: 'Jabberwocky', by: 'Lewis Carroll', t: ['A poem full of made-up words, from 1871. Here is how it starts.', '\'Twas brillig, and the slithy toves did gyre and gimble in the wabe: all mimsy were the borogoves, and the mome raths outgrabe.', 'Nobody knows exactly what that means. That is the fun of it.'], joe: 'I am going to say mimsy all day now.' },
    { title: 'Howl\'s Moving Castle', by: 'Diana Wynne Jones', t: ['Today\'s pick: Howl\'s Moving Castle. Sophie gets turned into an old lady by a witch, and walks right into the walking castle of the wizard Howl, who is dramatic about his hair.', 'The book is even funnier than the film. Promise.'] },
    { title: 'Wonder', by: 'R.J. Palacio', t: ['Today, Wonder. Auggie has been homeschooled all his life, and now he is starting fifth grade at a real school, with a face that makes people stare.', 'It is funny, warm, and told by different kids, one after the other. It might make you want to be kind on purpose.'] },
    { title: 'The Adventures of Sherlock Holmes', by: 'Arthur Conan Doyle', t: ['A little bit of Sherlock Holmes, from 1892.', '"You see, but you do not observe," Holmes tells his friend Watson. Then he asks him how many steps lead up to their own flat. Watson has climbed them hundreds of times, and has no idea.', 'There are seventeen. Holmes always knows.'], joe: 'I do not know how many steps there are to my studio, and that worries me now.' },
    { title: 'Nimona', by: 'ND Stevenson', t: ['A graphic novel today: Nimona. Nimona is a shapeshifter who wants to be the sidekick of a villain. The villain is actually the nicest person in the story.', 'It is funny, surprising and drawn with so much energy. Great if you like comics.'] },
    { title: 'The Owl and the Pussy-cat', by: 'Edward Lear', t: ['A silly poem from 1871.', 'The Owl and the Pussy-cat went to sea in a beautiful pea-green boat. They took some honey, and plenty of money, wrapped up in a five-pound note.', 'Later they buy a ring from a pig and dance by the light of the moon. As you do.'] },
    { title: 'Anne of Green Gables', by: 'L.M. Montgomery', t: ['A classic: Anne of Green Gables, from 1908. Anne is an orphan with red hair, a huge imagination and absolutely no filter.', 'Here is Anne in her own words: "Isn\'t it nice to think that tomorrow is a new day with no mistakes in it yet?"'], joe: 'Anne gets it.' },
    { title: 'The Secret Garden', by: 'Frances Hodgson Burnett', t: ['Today, The Secret Garden, from 1911. Mary is grumpy and bored in a huge old house, until she finds a key, and a locked garden that nobody has entered for ten years.', 'It is about bringing something back to life, and becoming a nicer person without noticing.'] },
    { title: 'The Westing Game', by: 'Ellen Raskin', t: ['A mystery today: The Westing Game. A millionaire dies and leaves a puzzle: sixteen people, split into pairs, have to solve it to win his fortune.', 'Everyone is a suspect, and the clues are so clever. Read it with a notebook.'] },
    { title: 'The Phantom Tollbooth', by: 'Norton Juster', t: ['A funny one: The Phantom Tollbooth. Milo is bored of everything, until a tollbooth appears in his room and he drives his toy car into a land of words and numbers.', 'There is a watchdog with a clock for a body, a city where you eat your words, and jokes on every page.'], joe: 'A land of numbers? I will stay in the land of words, thanks.' },
    { title: 'Matilda', by: 'Roald Dahl', t: ['A favourite: Matilda. Matilda reads every book in the library by the age of five, has the worst parents ever, and discovers she can move things with her mind.', 'Revenge on the terrible headmistress has never been funnier.'] },
    { title: 'The Wind in the Willows', by: 'Kenneth Grahame', t: ['A cosy one from 1908: The Wind in the Willows.', '"Believe me, my young friend, there is nothing, absolutely nothing, half so much worth doing as simply messing about in boats," says the Water Rat to the Mole.', 'Mr. Toad, meanwhile, is obsessed with cars and crashes all of them.'] },
    { title: 'The Hunger Games', by: 'Suzanne Collins', t: ['A page-turner: The Hunger Games. Katniss volunteers to take her little sister\'s place in a televised contest, and has to outsmart everyone.', 'It is intense, so maybe not right before bed, but you will not be able to stop.'] },
    { title: 'Little Women', by: 'Louisa May Alcott', t: ['A classic from 1868: Little Women. Four sisters, Meg, Jo, Beth and Amy, growing up, arguing, writing plays and dreaming big.', 'Jo wants to be a writer, and she will not let anyone tell her what a girl should be. Iconic.'] },
  ];

  // ---------- notes to Rim from Luna: short, funny, warm ----------
  R.notes = [
    'A quick note, Rim. Your music taste goes from Michael Jackson to Korn to Mac DeMarco, and honestly, that is the coolest range I have ever seen.',
    'Note to Rim: you are allowed to be good at things and still be learning. Both at once. That is how it works.',
    'A little note from the studio: Joe says you have excellent taste. I say Joe is right. That never happens.',
    'Dear Rim, reminder that nobody is born knowing everything. Not even me. Especially not me.',
    'Note: if you ever start a band, I want to be the first radio to play it. Just saying.',
    'A small note, Rim: your laugh is probably the best sound in the house. Better than any song on this radio. Do not tell the songs.',
    'Rim, a note from the radio: being a little weird is a superpower. All the best bands are weird.',
    'Note to self, and to Rim: drink water, stretch, and play at least one song very loud today.',
    'Dear Rim, I checked: no rule says you have to like only one kind of music. So keep liking all of it.',
    'A note: you do not have to be perfect to be awesome. Look at Gorillaz. They are cartoons, and they are still the coolest band around.',
    'Rim, a quick one: whatever you are working on, a drawing, a story, a playlist, it counts. Making things counts.',
    'A note from Luna: some days are for being amazing, and some days are just for getting through. Both are good days on this radio.',
    'Dear Rim, if your room is a mess right now, that just means you have been busy living. Respect.',
    'Note: your future self is going to be so glad you kept being curious. Keep asking why.',
    'Rim, small reminder: the people who love you think you are great even on your grumpy days. Especially then.',
    'A note: if you ever feel stuck, change one small thing. Your playlist, your seat, your snack. Momentum loves small things.',
    'Dear Rim, the radio would like to officially thank you for listening. You are our number one listener. Also our only one. Still number one.',
    'Note from the studio: you have the taste of a music critic and the energy of a rock star. That is a rare combo.',
    'Rim, a little one: being kind is cool. Being kind to yourself is cooler.',
    'A note: big dreams are allowed. Massive ones. Stadium-sized.',
    'Dear Rim, today you get to decide what kind of day it is. The radio votes for a good one.',
    'A note: you do not have to have it all figured out. Nobody does. The fun is in the figuring.',
  ];

  // ---------- Luna & Joe: little bits of banter ----------
  R.banter = [
    [{ t: 'Joe, quick question. Pineapple on pizza?' }, { t: 'Luna, we are a music station.', w: 's' }, { t: 'That is not a no.' }],
    [{ t: 'Joe, I have decided I am going to learn the drums.' }, { t: 'Please do it far away from the microphone.', w: 's' }],
    [{ t: 'Joe, what is your favourite Gorillaz song?' }, { t: 'All of them. Next question.', w: 's' }, { t: 'That is cheating.' }, { t: 'That is taste.', w: 's' }],
    [{ t: 'Fun fact, Joe. I can moonwalk.' }, { t: 'Luna, I have seen you walk normally. I have doubts.', w: 's' }],
    [{ t: 'Joe, if you were in a band, what would it be called?' }, { t: 'Joe and the Volume Knobs.', w: 's' }, { t: 'I would buy that T-shirt.' }],
    [{ t: 'Joe, do you think Rim likes my jokes?' }, { t: 'I think Rim is very patient.', w: 's' }, { t: 'I will take that as a yes.' }],
    [{ t: 'Joe, I made a playlist called Songs Luna Sings in the Shower.' }, { t: 'Is it just one song, on repeat?', w: 's' }, { t: 'It is Bohemian Rhapsody. All the parts. Including the opera.' }],
    [{ t: 'Joe, what would you take to a desert island?' }, { t: 'A good book, headphones, and a boat to leave the desert island.', w: 's' }, { t: 'Smart.' }],
    [{ t: 'I tried to play Dress to Impress, Joe.' }, { t: 'And?', w: 's' }, { t: 'The theme was "cosy". I came in a full suit of armour.' }, { t: 'Bold.', w: 's' }],
    [{ t: 'Joe, I think I am getting better at Roblox.' }, { t: 'Luna, you fell off the first platform eleven times.', w: 's' }, { t: 'Ten. The eleventh was on purpose.' }],
    [{ t: 'Joe, rate my outfit today.' }, { t: 'This is radio, Luna. Nobody can see you.', w: 's' }, { t: 'And yet I dressed up. That is commitment.' }],
    [{ t: 'Joe, how many records do you own?' }, { t: 'Enough to build a fort.', w: 's' }, { t: 'Have you built the fort?' }, { t: 'No comment.', w: 's' }],
    [{ t: 'Joe, I just learned that Kevin Parker plays almost everything on Tame Impala records by himself.' }, { t: 'Meanwhile you cannot open the studio door without help.', w: 's' }, { t: 'It is a heavy door, Joe.' }],
    [{ t: 'Joe, guess how many songs are on this radio.' }, { t: 'More than you can name.', w: 's' }, { t: 'Challenge accepted.' }, { t: 'Please do not.', w: 's' }],
    [{ t: 'Joe, what is the best time to listen to Black Sabbath?' }, { t: 'When you are doing the dishes and want to feel powerful.', w: 's' }],
    [{ t: 'Rim, Joe wants to say something.' }, { t: 'Hi Rim. That is all. Hi.', w: 's' }, { t: 'Very meaningful, thank you Joe.' }],
    [{ t: 'Joe, can you whistle?' }, { t: 'Like a bird.', w: 's' }, { t: 'Prove it.' }, { t: 'This is a radio, not a talent show.', w: 's' }],
    [{ t: 'Joe, quick: Queen or Nirvana?' }, { t: 'Queen for the car, Nirvana for a bad day.', w: 's' }, { t: 'That is a very good answer and I hate it.' }],
  ];

  // ---------- her birthday (2 January) ----------
  R.birthday = {
    banner: '🎉 Happy birthday, Rim! {age} today. The whole radio is celebrating. 🎉',
    show: [
      'Stop everything! Rim, it is your birthday! Happy birthday from everyone at {station}!',
      { t: 'Happy birthday, Rim! I baked a cake. Well, I imagined a cake. It is a very good imaginary cake.', w: 's' },
      '{age} years old today. That is officially an excellent age. Today, the radio plays your liked songs first.',
      { t: 'And Luna promised not to sing. Luna?', w: 's' },
      'I promised nothing. Okay, fine. No singing. Happy birthday, Rim!',
    ],
    mission: "Today's mission: it is your birthday, so the mission is to do whatever makes you happiest today. That is an order. Okay, a friendly suggestion.",
    justMusic: 'Sorry to interrupt the music, Rim, just for one second: happy birthday! {age} today! Okay, back to the music.',
  };

  // ---------- the Feel Good Bulletin ----------
  R.bulletin = {
    intro: ['It is {time}: time for the Feel Good Bulletin. Two minutes of news, the fun kind.', 'It is {time}, and that means the Feel Good Bulletin. Here we go.', 'Bulletin time! Music, games, good news and the weather. Take it away.'],
    outro: ['That was the Feel Good Bulletin. Back to the music!', 'And that is the news. Now, back to the songs.', 'Bulletin done. The world is fine, and so are you. Music!'],
    none: ['The news wires are taking a nap, so no bulletin this time. Back to the music.'],
    heads: { music: 'In music news.', games: 'In games.', good: 'And some good news.' },
    weather: 'The weather in Marrakech: {now} right now, and {temp} degrees. Tomorrow, {sky}, between {min} and {max} degrees.',
    born: 'And born on this day, in {year}: {name}, {what}. Happy birthday to them.',
  };

  // ---------- the welcome tour (the first time; again from Settings) ----------
  R.tour = [
    { el: '#btnPlay', t: 'Hey Rim, Joe here! I am giving you the tour, then Luna takes over. This is play and pause. Next and previous are right next to it.' },
    { el: '#btnJust', t: 'This is Just music: tap it and Luna and I stop talking. No shows, nothing in between, like Spotify without ads. Tap again to bring us back.' },
    { el: '#btnAddTo', t: 'Like a song? The heart puts it in your Liked Songs. The plus puts it in one of your playlists.' },
    { el: '#btnAdd', t: 'Add a song: type any song, or paste a YouTube link, and it goes into your library and plays next.' },
    { el: '#btnLib', t: 'Your Library: all the songs, your Liked Songs, your playlists, and the albums for the Album Party.' },
    { el: '#btnFocus', t: 'Homework mode: chill music, no talking, and a study timer if you want one.' },
    { el: '#btnSet', t: 'And Settings, for everything else. That is the tour! Now over to Luna, your host. Luna?' },
  ];
  R.studyLines = {
    break: ['Break time! Five minutes. Stretch, get some water, look out the window.', 'Nice work. Five-minute break. You earned it.'],
    back: ['Break over. Round {n}, let us go.', 'Back to it, round {n}. You have got this.'],
  };
})();

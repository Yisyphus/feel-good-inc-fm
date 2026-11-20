// More things for Luna and Joe to say (20 November 2026): every pool they use again and again, about three times
// bigger, so they repeat themselves much less. Loaded after the other content files; each line is added to its pool.
// Same rules as everywhere: fun and warm, nothing existential, advice offered, never ordered.
(function () {
  const R = window.RADIO;
  const add = (pool, lines) => { if (Array.isArray(pool)) pool.push(...lines); };

  // ---------- content_talk.js ----------
  add(R.welcomes.morning, [
    'Good morning from {station}! It is {time}. Luna here, fully charged and ready to play you some bangers.',
    'Morning, Rim. Joe made breakfast. By breakfast, I mean he found a biscuit. Here is the music.',
    'It is {time}, the sun is up, and so is {station}. Let us make this morning sound good.',
    'Hello, morning person. Or not-a-morning person. Either way, the music is ready for you.',
    'Good morning, Rim! Luna on the mic, Joe on the snacks, and you on the best station around.',
    'Rise and grind, but gently. It is {time} on {station}.',
    'Morning! Fun fact: the first song of the day sets the mood. I picked well. Probably.',
    'Hey Rim, good morning. It is {time}. Let us ease into the day with some good tunes.',
  ]);
  add(R.welcomes.afternoon, [
    'Good afternoon, Rim! It is {time} on {station}. Snack in hand? Perfect. Let us go.',
    'Hey, hey, it is {time}. Luna here, Joe is here too, and the playlist is looking very fancy today.',
    'Afternoon, Rim. Halfway through the day already. Here is some music to carry you through the rest.',
    'Welcome to the afternoon show on {station}. Kick off your shoes, metaphorically.',
    'It is {time}. Perfect time for music, as is every time, honestly.',
    'Hi Rim! The afternoon just got a soundtrack. You are listening to {station}.',
    'Good afternoon! Luna here. I have been saving some good ones for you.',
    'Hey Rim, it is {time}. The radio missed you. Joe definitely missed you.',
  ]);
  add(R.welcomes.evening, [
    'Good evening, Rim! It is {time}. The evening playlist is warmed up and ready.',
    'Hey Rim, Luna here. The evening is yours, and so is the radio.',
    'It is {time} on {station}. Cosy mode: activated.',
    'Evening, Rim! Joe has dimmed the studio lights. It looks very professional in here.',
    'Welcome to the evening on {station}. Good songs, good company, and Joe.',
    'It is {time}. The perfect hour for your favourite songs, and a few new ones.',
    'Good evening from Luna and Joe. Grab a blanket if you like. Here we go.',
    'Hey Rim, welcome back. Evenings are better with music. That is just science.',
  ]);
  add(R.welcomes.night, [
    'Hey Rim, it is {time}. {station} is on night mode: soft and easy.',
    'Late night on {station}. Joe is whispering. I am trying to.',
    'It is {time}. The quiet hours, with some quiet songs.',
    'Good night-time, Rim. Luna here, keeping you company.',
    'Night shift on {station}. Gentle songs only. Mostly.',
    'Hey night owl, Luna here. Let us keep it calm.',
  ]);
  add(R.introTemplates, [
    'Up next, {a}, with {t}.', 'Here it is: {t}.', 'Okay, {a}. You are going to like this.', 'And now, {t}, by {a}.',
    'Next on {station}: {a}.', '{a} is next, with {t}. Volume check, please.', 'Drumroll, Joe. Thank you. {t}, by {a}.',
    'Here is one of my favourites: {t}.', 'Let me play you {t}, by {a}.', 'Coming right up: {a}.',
    'Time for {t}. Let us go.', 'Here comes {a}. Hold on to something.', 'Next song: {t}. A good one.',
    '{a}, {t}, right now on {station}.', 'Okay, Rim, here is {t}.', 'Joe picked this one. Do not tell him I said it was good. {t}.',
    'Straight from the {station} jukebox: {t}, by {a}.', 'Here is {a}. Instant mood boost.', 'This one is {t}, by {a}. Enjoy.',
    'Next up, a {station} classic: {t}.', 'Let us keep it going with {a}.', 'And here is {t}. Turn it up a little.',
    'Here is {a}, with {t}, just for you.', 'Ready? {t}.',
  ]);
  add(R.liveIntros, [
    'Live performance coming up! {a}, playing {t}. You can almost hear the crowd breathing.',
    'Here is a live one: {a}, {t}. Front row, no ticket needed.',
    'Concert moment: {a}, live, with {t}. Clap along if you feel like it.',
    'A little bit of stage magic now: {a}, {t}, live.',
    'Time for {a}, live. {t}. Imagine the lights.',
    'This one was recorded live: {t}, by {a}. Enjoy the show.',
  ]);
  add(R.newSongTemplates, [
    'You added this one: {t}, by {a}. Good find.', 'A song from your own list: {t}. Nice.', 'Rim picked this: {a}, with {t}. The DJ approves.',
    'One of yours: {t}, by {a}. You have taste.', 'Here is a song you brought to the radio: {t}.', 'From the Rim collection: {a}.',
  ]);
  add(R.backTemplates, [
    'That was {t}, by {a}. Lovely.', '{a}, with {t}. So good.', 'That was {t}. Joe gave it a standing ovation.',
    'You just heard {a}, with {t}.', 'That was {t}. Great song, great choice.', '{t}, by {a}. Chef\'s kiss.',
    'That was {a}. What a voice.', '{t}. Still humming it.', 'That was {t}, by {a}. Instant classic.',
    'And that was {a}. Love it.', '{t}, everybody. By {a}.', 'That was {t}. Joe wants to hear it again. Maybe later, Joe.',
    'That was {a}, with {t}. Smooth.', '{t}, by {a}. The radio thanks you, {a}.', 'That was {t}. Good vibes only.',
    '{a}, {t}. That one never gets old.',
  ]);
  add(R.moodBy.happy, ['A happy one, coming right up.', 'Smile alert: this song is very cheerful.', 'This one is like a sunny Saturday.', 'Happy song incoming. Dance if you want to.']);
  add(R.moodBy.dreamy, ['Dreamy song time. Float on.', 'This one sounds like clouds.', 'Soft and dreamy, coming up.', 'A song for daydreaming.']);
  add(R.moodBy.chill, ['Something chill now.', 'Easy and calm, this one.', 'Chill mode, on.', 'A relaxed one. Feet up.']);
  add(R.moodBy.hype, ['Get ready, this one has energy.', 'Big beat incoming.', 'This is a jump-around song.', 'Turn it up, this one deserves it.', 'Energy level: maximum.', 'Okay, time to wake up the neighbours. Just a little.']);
  add(R.moodBy.moody, ['A moody one now. Very cinematic.', 'Some atmosphere, coming up.', 'This one is a bit stormy. In a good way.', 'Dramatic music, for dramatic moments.']);
  add(R.moodBy.epic, ['This is a big one.', 'Epic song alert.', 'This one is huge. Like, stadium huge.', 'Prepare for something grand.']);
  add(R.moodBy.warm, ['A cosy one, coming up.', 'This song is a warm hug.', 'Something warm and friendly now.', 'This one feels like hot chocolate.']);
  add(R.moodBy.weird, ['A strange and wonderful one now.', 'This one is delightfully odd.', 'Weird song alert. The good kind.', 'Expect the unexpected with this one.']);
  add(R.moodLines, [
    'This one is a mood.', 'Absolute tune.', 'You will like this one.', 'Turn it up, just a little.', 'Good one coming.',
    'This one makes everything better.', 'A song to sing along to.', 'Pure good vibes.', 'This one is a gem.', 'Joe approves of this one.',
  ]);
  add(R.energyUp, ['Let us turn it up.', 'Energy boost, coming right up.', 'Okay, picking up the pace.', 'Time to get moving.', 'Let us wake up a little.', 'Faster now.']);
  add(R.energyDown, ['Let us slow it down.', 'Something softer now.', 'Calming things down.', 'A gentle one now.', 'Time to breathe.', 'Easy now.']);
  add(R.detourLines, [
    'Quick change of scenery, but still all about {theme}.', 'Something new now, but the {theme} vibe stays.',
    'Different style, same {theme} feeling.', 'Switching it up, still on {theme}.',
  ]);
  const tb = R.themeBridges || {};
  add(tb.love, ['More love songs. The radio is feeling soft today.', 'Love is in the air, and on the radio.']);
  add(tb.friends, ['Another one for your friends.', 'Friendship songs, back to back.']);
  add(tb.dreams, ['Keep dreaming.', 'Another song for the dreamers.']);
  add(tb.rebel, ['Still rebelling. Politely.', 'More attitude, coming right up.']);
  add(tb.space, ['We are still in orbit.', 'Next stop: more outer space.']);
  add(tb.dance, ['The dance floor stays open.', 'Keep moving.']);
  add(tb.summer, ['Summer vibes, still going.', 'More sunshine, coming up.']);
  add(tb.weird, ['More weird and wonderful.', 'Weirdness level: maintained.']);
  add(tb.fun, ['The fun keeps going.', 'More fun, coming right up.']);
  add(R.idents, [
    'You are listening to {station}, with Luna and Joe.', 'This is {station}. Good music, all day long.',
    '{station}: the station that knows your taste.', 'It is {time}, and you are tuned to {station}.',
    'You are on {station}. Thanks for listening, Rim.', 'This is Luna, on {station}. Joe says hello.',
    '{station}. Your music, your way.', 'Still here, still playing. This is {station}.',
    'You are listening to {station}, the radio made just for you.', 'It is {time}. Luna and Joe, on {station}.',
    '{station}: good songs, good vibes, and a few jokes.', 'This is {station}. Keep it locked.',
  ]);
  add(R.checkins, [
    'Quick check-in: how about a sip of water? Just an idea.',
    'Little reminder: it is okay to take a break whenever you need one.',
    'If you have been sitting for a while, maybe stand up and stretch. Only if you want to.',
    'Check-in: if something made you smile today, hold on to that.',
    'Quick idea: open a window for some fresh air. Totally optional.',
    'Just checking in. Hope your day is going well, Rim.',
    'Little tip: blink a few times if you have been staring at a screen. Your eyes like it.',
    'Reminder: you are allowed to be proud of small things too.',
    'If you are hungry, a snack break might be a good idea. The radio will wait.',
    'Check-in time. Shoulders down, deep breath. Better?',
    'If you have homework, maybe this is a good moment for it. Or not. You choose.',
    'Just a quick hello from Luna and Joe. That is all. Back to the music.',
  ]);
  add(R.runStarts, [
    'Genre Mix starting now: {label}.', 'It is {label} time. Here we go.', 'Welcome to the {label} mix.',
    'All {label}, coming right up.', 'Let us dive into {label}.', 'Genre Mix: {label}. Enjoy the ride.',
  ]);
  add(R.runEnds, ['That was the {label} mix. Now, back to everything.', '{label} mix done. Back to the usual.', 'End of the {label} mix. Hope you liked it.', 'And that is {label}. Back to the radio mix.']);
  add(R.dedicationLines, [
    'This one is dedicated: {d}. {t}, by {a}.', 'A message for you: {d}. Here is {a}.', 'Dedication time: {d}. Here comes {t}.',
    'Someone wanted you to hear this: {d}. {a}, with {t}.', 'A little dedication: {d}. Enjoy {t}.', 'From the request line: {d}. Here is {t}.',
  ]);
  add(R.podOutros, [
    'That was {t}. Now, back to music.', 'Episode over. Music time.', 'Hope that was fun. Back to the songs.',
    'That was the podcast. Now, more music.', 'Brain: full. Ears: ready for music.', 'That was {t}. Back to the radio.',
  ]);
  add(R.sleepLines, [
    'The sleep timer says it is time to rest. Goodnight, Rim.', 'That is it for tonight. Sleep well, Rim.',
    'Goodnight from Luna and Joe. See you tomorrow.', 'Time to switch off. Sweet dreams, Rim.',
  ]);

  // ---------- content.js: theme lines, family playlists ----------
  const tl = R.themeLine || {};
  add(tl.love, ['A love song, for anyone who loves something. Even pizza.', 'This one is all heart.']);
  add(tl.fun, ['Fun song, fun times.', 'This one is a party in a song.', 'Pure fun, no instructions needed.']);
  add(tl.friends, ['A song for your friends.', 'This one is about having people on your side.']);
  add(tl.freedom, ['This one feels like a summer holiday.', 'A song about feeling free.']);
  add(tl.rebel, ['A song with a bit of attitude.', 'This one does not follow the rules. Musically.']);
  add(tl.dreams, ['A song for dreamers.', 'This one is about reaching for the stars.']);
  add(tl.self, ['A song about being you. Great topic.', 'This one says: be yourself. Good advice.']);
  add(tl.night, ['A night-time song, for night-time moods.', 'This one sounds like the moon.']);
  add(tl.summer, ['Summer song! Imagine the beach.', 'This one sounds like holidays.']);
  add(tl.space, ['A song from far, far away.', 'Next stop: the stars.']);
  add(tl.weird, ['A weird and wonderful song.', 'This one is different, in the best way.']);
  add(tl.heartbreak, ['A sad-ish song with a happy ending, probably.', 'A pretty song for a grey day.']);
  add(tl.hope, ['A hopeful song, for a good day.', 'This one is full of good energy.']);
  add(R.giftHints, [
    'Next, a song from {name}. Find them all under Playlists.',
    'This one is from {name}. There are more where it came from, under Playlists.',
    'A pick from {name}, coming right up. The whole list is under Playlists.',
    'Here is one from {name}. Want more? Check Playlists.',
    'From {name}, a little treat. More of them under Playlists.',
    'This next song lives in {name}. Visit the playlist any time, under Playlists.',
    'Here comes a {name} song. You can play the full list from Playlists.',
    'A song from {name} now. The rest are waiting under Playlists.',
  ]);
  add(R.giftListLines, [
    'Here comes {name}. A whole playlist of great songs, just for you.', 'Time for {name}. Sit back and enjoy.',
    'Now playing {name}. Every song in here is a good one.', 'Let us play {name}. Great picks ahead.',
    '{name}, starting now. Enjoy, Rim.', 'It is {name} time. Here we go.',
  ]);

  // ---------- content_shows.js: missions, side quests, leads, notes, banter, bulletin, study ----------
  add(R.missionHandovers, ['Joe, do we have a mission?', 'Joe, mission please.', 'Time for the mission. Joe?', 'Joe, what is on the mission list today?', 'Mission time. Joe, you are up.', 'Joe, tell Rim the mission.', 'Over to Joe, mission expert.', 'Joe, drumroll, then the mission.']);
  add(R.missionLeads, ['Mission alert!', 'Okay Rim, listen carefully.', 'Ready, Rim? Here it comes.', 'Small and fun, as always.', 'This one is easy, I promise.', 'Drumroll, please.', 'Rim, this one is for you.', 'Okay, here we go.']);
  add(R.sideQuestLeads, ['A little side quest, just for fun.', 'Side quest, only if you want.', 'Here is an optional mini quest.', 'Side quest time. No pressure.', 'A small side quest, if you are up for it.', 'Optional bonus quest.', 'Want a side quest? Here is one.', 'Side quest, totally up to you.']);
  const sq = R.sideQuests || {};
  add(sq.creative, [
    'If you feel like it, try making a tiny comic of your day in three boxes.',
    'Idea: draw your favourite song as a monster. What colour is it?',
    'If you want, write a short poem where every line starts with the same letter.',
    'Try this, if you like: invent a band name and design its logo.',
    'If you have a minute, make up a new word and decide what it means.',
    'Idea: take a photo of something ordinary from a strange angle.',
    'If you want, doodle with your other hand. It is funny and surprisingly good.',
    'Try this, if you feel like it: describe your room as if it were a magical place.',
    'If you like, invent a new ice cream flavour and give it a fancy name.',
    'Idea: draw the view from your window, but add one impossible thing.',
    'If you want, write the first sentence of a story. Just one.',
    'Try this, if you like: hum a melody you made up. You just composed music.',
    'If you have time, make a tiny paper boat or plane.',
    'Idea: draw a map of an imaginary island.',
    'If you want, give each of your pens a name. Very important work.',
    'Try this, if you feel like it: design an album cover for your life this week.',
  ]);
  add(sq.study, [
    'Study tip, if you want it: explain what you learned to an imaginary student. Teaching helps you remember.',
    'If it helps: work for 25 minutes, then take a 5-minute break. The radio can time it in Homework mode.',
    'Study hack: write the three most important things on a sticky note.',
    'If you like, try reading your notes out loud. It sticks better.',
    'Tip: start with the easiest task. It gets you moving.',
    'If it helps, put your phone in another room for a while. Focus mode: on.',
    'Study idea: draw a quick mind map. Main idea in the middle, branches around it.',
    'Tip, if you want it: drink some water while you study. Brains like water.',
    'If it helps, turn the hardest question into a puzzle you want to solve.',
    'Study hack: test yourself instead of rereading. It works better.',
    'Tip: a tidy desk can make studying feel easier. Even a little tidier.',
    'If you like, use colours in your notes. One colour per topic.',
    'Study idea: learn one new word today, and use it three times.',
    'Tip, if it helps: break a big task into tiny steps, and tick them off.',
    'If you want, reward yourself after a study session. A song, a snack, a stretch.',
    'Study hack: if something is confusing, try explaining it with a drawing.',
  ]);
  add(sq.school, [
    'School idea, if you like: say hello to someone you do not usually talk to.',
    'If you want, pack your bag tonight, so tomorrow morning is easier.',
    'Tip: ask a question in class if something is not clear. Others probably wonder too.',
    'If you like, compliment a classmate on something they did well.',
    'School tip: write down your homework somewhere you will see it.',
    'If you want, try sitting somewhere new at lunch, just to see.',
    'Idea: thank a teacher for something you enjoyed in class.',
    'If it helps, keep a spare pen in your bag. Future you will be grateful.',
    'School tip, if you like: check your timetable the night before.',
    'If you want, help someone who looks a bit lost. It feels good.',
    'Idea: write one thing you learned today before you go to sleep.',
    'If you like, join a club or activity that sounds fun, just to try it.',
    'School tip: keep your locker or desk a little tidy. Treasure hunts are fun, but not every day.',
    'If you want, bring a book for the quiet moments.',
    'Idea: share a song you like with a friend at school.',
    'If it helps, take a deep breath before a test. It really helps.',
    'School tip: drink some water between classes, if you can.',
  ]);
  add(sq.room, [
    'Room idea, if you like: clear one small surface, just one.',
    'If you want, put on a song and tidy until it ends. Speed-cleaning.',
    'Idea: find three things you do not need any more and set them aside.',
    'If you like, rearrange your books by colour. It looks amazing.',
    'Room tip: open the curtains in the morning. Light makes everything nicer.',
    'If you want, make your bed. It takes one minute and the room looks finished.',
    'Idea: empty your bag and put back only what you need.',
    'If you like, put a plant, or a picture you love, where you can see it.',
    'Room tip, if it helps: a little box for small things keeps the desk clear.',
    'If you want, find a lost sock. They are always somewhere.',
    'Idea: change one thing on your wall. A new poster, a photo, a drawing.',
    'If you like, tidy your pencil case. Throw away the dead pens.',
    'Room tip: put your clothes for tomorrow out tonight.',
    'If you want, clean your headphones. Gently.',
    'Idea: make a cosy corner with a cushion and a lamp.',
    'If you like, sort the cables on your desk. Very satisfying.',
  ]);
  add(sq.books, [
    'Book idea, if you like: read just one chapter tonight.',
    'If you want, try a comic or graphic novel. They count as reading.',
    'Idea: ask a friend what their favourite book is.',
    'If you like, read a few pages in a different spot than usual.',
    'Book tip: if a book is boring you, it is okay to try another one.',
    'If you want, visit the library and pick a book only by its cover. Just for fun.',
    'Idea: write down a sentence you love from a book.',
    'If you like, read a book from a country you have never visited.',
    'Book tip: an audiobook is a great way to read while you draw or walk.',
    'If you want, re-read a book you loved when you were younger.',
    'Idea: imagine who would play the characters in a movie version.',
    'If you like, try a book of short stories. Perfect for busy days.',
    'Book tip: a bookmark you made yourself makes reading more fun.',
    'If you want, read a few pages before bed instead of a screen.',
    'Idea: start a list of books you want to read one day.',
    'If you like, swap a book with a friend.',
  ]);
  add(sq.music, [
    'Music idea, if you like: listen to a whole album from start to finish. Try the Album Party!',
    'If you want, find out who plays the drums in your favourite band.',
    'Idea: make a playlist for a rainy day.',
    'If you like, listen to a song in a language you do not speak.',
    'Music tip: try to hear only the bass in the next song. It is a whole new song.',
    'If you want, look up the lyrics of a song you love.',
    'Idea: find a song from the year your parents were your age.',
    'If you like, ask someone in your family about their favourite song.',
    'Music idea: listen to a song with your eyes closed. Different, right?',
    'If you want, make a playlist with only songs that start with the same letter.',
    'Idea: find an instrumental song you like. No words, just music.',
    'If you like, try to guess the year of the next song before it ends.',
    'Music tip: like a song? Look up what the band listened to. Great way to find more music.',
    'If you want, make a playlist for a road trip you would love to take.',
    'Idea: listen to a cover version of a song you know.',
    'If you like, add a new song to your library today.',
  ]);
  add(R.triviaLeads, ['Fun fact!', 'Trivia time.', 'Here is something cool.', 'Did you know this?', 'Quick fact for you.', 'Little trivia moment.', 'Ready for a fact?', 'Trivia, coming up.', 'Here is a good one.', 'Bonus fact!']);
  add(R.genreLeads, ['Quick genre fact.', 'A bit of music history.', 'Genre trivia!', 'Here is where this sound comes from.', 'Music history moment.', 'Little genre story.']);
  add(R.bookLeads, ['Joe, what book do we have today?', 'Book Nook! Joe, take it away.', 'Joe has found a good book. Over to you, Joe.', 'Time for Book Nook with Joe.', 'Joe, what are you reading?', 'Book Nook time. Joe?', 'And now, Joe, with a book for Rim.', 'Joe, the Book Nook is yours.']);
  add(R.notes, [
    'A note for Rim: your laugh is probably the best sound in your house. Joe agrees.',
    'Note from the studio: you make this radio better just by listening.',
    'Dear Rim, mistakes are just practice in disguise.',
    'A quick note: trying something new is brave, even if it is small.',
    'Note to Rim: it is okay to have a lazy day sometimes. Rest is important.',
    'A little note: you can ask for help any time. Asking is smart.',
    'Dear Rim, you do not have to be perfect to be awesome.',
    'Note from Joe, read by Luna: you have great taste in music. He insisted I say it.',
    'A note for you: every expert was once a beginner.',
    'Dear Rim, be kind to yourself today. You deserve it.',
    'A quick note: your ideas matter. Write them down sometimes.',
    'Note to Rim: you are allowed to change your mind. That is called growing.',
    'A little note: good things take time. Even songs. Even people.',
    'Dear Rim, thank you for listening. Seriously. Luna and Joe are big fans of you.',
    'Note from the studio: some days are for big things, some for small things. Both count.',
    'A note for Rim: you are the main character of your own story.',
    'Dear Rim, today is a good day to do something you enjoy.',
    'A quick note: being curious is a superpower.',
    'Note to Rim: you can be funny, smart and kind all at once. You already are.',
    'A little note: if you feel stuck, a short walk or a good song can help.',
    'Dear Rim, every day you learn something. That is pretty amazing.',
    'Note from Joe: he says hi. That is the whole note. Hi.',
    'A note for you: it is okay to say no to things that do not feel right.',
    'Dear Rim, you are stronger than you think.',
    'A quick note: drink water, laugh a lot, listen to good music. Good plan.',
    'Note to Rim: your friends are lucky to have you.',
    'A little note: one small step is still a step.',
    'Dear Rim, it is fine not to know what you want to be yet. You have time.',
    'Note from the studio: Joe tried to write you a poem. It rhymed orange with door hinge. He tried.',
    'A note for Rim: you make the world a bit brighter.',
    'Dear Rim, remember to have fun today.',
    'A quick note: the radio is always here when you need some music.',
    'Note to Rim: new things can feel weird at first. That is normal.',
    'A little note: you do not have to do everything today.',
    'Dear Rim, keep being you. It is working.',
    'Note from Luna: I am very proud to be your radio host.',
    'A note for you: the best playlists have surprises. So do the best people.',
    'Dear Rim, take a moment to notice something beautiful today.',
    'A quick note: Joe and I think you are brilliant. That is official.',
    'Note to Rim: your effort counts, not just the result.',
    'A little note: sometimes a good song fixes a bad mood. Try it.',
    'Dear Rim, have a great rest of your day.',
    'Note from the studio: you have excellent ears. They chose this radio.',
    'A note for Rim: the world needs your ideas.',
  ]);
  add(R.banter, [
    [{ t: 'Joe, what is your superpower?' }, { t: 'Finding the remote.', w: 's' }, { t: 'That is actually impressive.' }],
    [{ t: 'Joe, cats or dogs?' }, { t: 'Both. And a hamster called Kevin.', w: 's' }, { t: 'You do not have a hamster.' }, { t: 'Not yet.', w: 's' }],
    [{ t: 'Joe, I learned a new dance move.' }, { t: 'Please describe it. On radio. Where no one can see it.', w: 's' }, { t: 'It is called the Luna. You spin and then you trip.' }],
    [{ t: 'Joe, what is the best snack for listening to music?' }, { t: 'Popcorn. Crunchy beats.', w: 's' }],
    [{ t: 'Joe, if you could be any instrument, what would you be?' }, { t: 'A tambourine. Small, but everyone notices.', w: 's' }],
    [{ t: 'Joe, have you seen my headphones?' }, { t: 'They are on your head, Luna.', w: 's' }, { t: 'Oh. Thank you.' }],
    [{ t: 'Joe, what is your favourite day of the week?' }, { t: 'Friday. Obviously.', w: 's' }, { t: 'Mine is the day with the best songs.' }, { t: 'That is every day here.', w: 's' }],
    [{ t: 'Joe, I want to start a podcast.' }, { t: 'About what?', w: 's' }, { t: 'About radio.' }, { t: 'We are the radio.', w: 's' }],
    [{ t: 'Joe, can you sing?' }, { t: 'Only in the shower and in emergencies.', w: 's' }],
    [{ t: 'Joe, which is better, sunrise or sunset?' }, { t: 'Sunset. I am not awake for sunrise.', w: 's' }],
    [{ t: 'Joe, what would your robot name be?' }, { t: 'Beep Boop Joe Three Thousand.', w: 's' }, { t: 'Very official.' }],
    [{ t: 'Joe, I think the plant in the studio likes jazz.' }, { t: 'It is plastic, Luna.', w: 's' }, { t: 'It still has taste.' }],
    [{ t: 'Joe, what is your favourite smell?' }, { t: 'Fresh bread. And new vinyl records.', w: 's' }],
    [{ t: 'Joe, could you live without music?' }, { t: 'I could. But I would hum all day.', w: 's' }, { t: 'That is still music, Joe.' }],
    [{ t: 'Joe, say something nice to Rim.' }, { t: 'Rim, your playlist is better than mine.', w: 's' }, { t: 'High praise.' }],
    [{ t: 'Joe, are you a morning person?' }, { t: 'I am a person in the morning. That is all I can promise.', w: 's' }],
    [{ t: 'Joe, mint or chocolate?' }, { t: 'Mint chocolate.', w: 's' }, { t: 'That is cheating again.' }, { t: 'That is genius again.', w: 's' }],
    [{ t: 'Joe, what is the first song you ever loved?' }, { t: 'The theme from a cartoon. I still know every word.', w: 's' }],
    [{ t: 'Joe, I named the microphone.' }, { t: 'What did you call it?', w: 's' }, { t: 'Mike.' }, { t: 'Of course you did.', w: 's' }],
    [{ t: 'Joe, beach or mountains?' }, { t: 'Mountains. With a beach at the bottom.', w: 's' }],
    [{ t: 'Joe, what is your hidden talent?' }, { t: 'I can whistle and hum at the same time.', w: 's' }, { t: 'Prove it.' }, { t: 'Not on air.', w: 's' }],
    [{ t: 'Joe, if you were a song, which one would you be?' }, { t: 'Something calm. With a surprise drum solo.', w: 's' }],
    [{ t: 'Joe, do you think aliens like music?' }, { t: 'If they do, they are listening to this station.', w: 's' }],
    [{ t: 'Joe, rate my jokes out of ten.' }, { t: 'Seven.', w: 's' }, { t: 'Only seven?' }, { t: 'Seven and a half. For effort.', w: 's' }],
    [{ t: 'Joe, what do you do when you are bored?' }, { t: 'I alphabetise the record crate.', w: 's' }, { t: 'That explains a lot.' }],
    [{ t: 'Joe, tea or hot chocolate?' }, { t: 'Moroccan mint tea. No contest.', w: 's' }],
    [{ t: 'Joe, could you be a DJ at a party?' }, { t: 'Only if everyone requests the same song.', w: 's' }],
    [{ t: 'Joe, I want a theme song.' }, { t: 'Luna, you talk over every song. They are all your theme song.', w: 's' }],
    [{ t: 'Joe, guitar or piano?' }, { t: 'Piano. Fewer strings to break.', w: 's' }],
    [{ t: 'Joe, what is your favourite colour?' }, { t: 'The colour of the play button.', w: 's' }, { t: 'That is yellow.' }, { t: 'Then yellow.', w: 's' }],
    [{ t: 'Joe, can you keep a secret?' }, { t: 'Yes.', w: 's' }, { t: 'Me too. That is the end of this conversation.' }],
    [{ t: 'Joe, if you had a pet dragon, what would you name it?' }, { t: 'Volume. Because it gets very loud.', w: 's' }],
    [{ t: 'Joe, do you dance when nobody is watching?' }, { t: 'I dance when everybody is watching. That is the problem.', w: 's' }],
    [{ t: 'Joe, what is the best thing about radio?' }, { t: 'You never have to choose the next song yourself.', w: 's' }, { t: 'Unless you are me.' }],
    [{ t: 'Joe, summer or winter?' }, { t: 'Summer music, winter blankets.', w: 's' }, { t: 'Best of both worlds.' }],
    [{ t: 'Joe, I tried to cook yesterday.' }, { t: 'How did it go?', w: 's' }, { t: 'The smoke alarm sang along.' }],
  ]);
  if (R.bulletin) {
    add(R.bulletin.intro, [
      'It is {time}. Here comes the Feel Good Bulletin.', 'Time for the news, the happy kind. This is the Feel Good Bulletin.',
      'Feel Good Bulletin, coming up. Music, games, good news and the weather.', 'It is {time}: bulletin time. Let us see what is new.',
      'Here is the Feel Good Bulletin, at {time}.', 'News break! The Feel Good Bulletin starts now.',
    ]);
    add(R.bulletin.outro, [
      'That was the bulletin. Back to the music.', 'News done. Music time.', 'That is all the news for now. Back to the songs.',
      'Bulletin over. Let us get back to the music.', 'And that was the Feel Good Bulletin. Thanks for listening.', 'That is the news. Now, the music.',
    ]);
  }
  if (R.studyLines) {
    add(R.studyLines.break, ['Break! Five minutes to relax.', 'Time for a short break. Great focus.', 'Five-minute break. Stretch, sip, smile.', 'Break time. You did a whole round.']);
    add(R.studyLines.back, ['Round {n}. Let us go.', 'Break done. Round {n}, you can do it.', 'Back to work, round {n}.', 'Round {n}. Focus mode, on.']);
  }

  // ---------- content_pods.js: the podcast and concert intros and outros ----------
  const ps = R.podShows || {};
  if (ps.polyphonic) { add(ps.polyphonic.intros, ['Polyphonic time! Today: {t}. About {min} minutes.', 'Here is Polyphonic, with {t}.', 'Podcast break: Polyphonic, on {t}.', 'Let us learn something cool. Polyphonic: {t}.']); add(ps.polyphonic.outros, ['That was Polyphonic. Back to the music.', 'Polyphonic, done. More songs now.', 'Hope you enjoyed Polyphonic. Music time.', 'That was the episode. Back to the radio.']); }
  if (ps.trashtheory) { add(ps.trashtheory.intros, ['Trash Theory time. Today: {t}.', 'Here is Trash Theory, with {t}. About {min} minutes.', 'Podcast break: Trash Theory, on {t}.', 'Rock history time. Trash Theory: {t}.']); add(ps.trashtheory.outros, ['That was Trash Theory. Back to the music.', 'Trash Theory, done. More songs now.', 'That was the episode. Rock on.', 'Hope you liked it. Music time.']); }
  if (ps.middle8) { add(ps.middle8.intros, ['Middle 8 time. Today: {t}.', 'Here is Middle 8, with {t}. About {min} minutes.', 'Podcast break: Middle 8, on {t}.', 'Story time. Middle 8: {t}.']); add(ps.middle8.outros, ['That was Middle 8. Back to the music.', 'Middle 8, done. More songs now.', 'That was the episode. Music time.', 'Hope you enjoyed it. Back to the radio.']); }
  if (ps.markrober) { add(ps.markrober.intros, ['Mark Rober time! Today: {t}.', 'Science break with Mark Rober: {t}. About {min} minutes.', 'Here is Mark Rober, with {t}. Get ready for something wild.', 'Engineering fun: Mark Rober, {t}.']); add(ps.markrober.outros, ['That was Mark Rober. Science is cool. Music now.', 'Mark Rober, done. Back to the songs.', 'That was the episode. Back to the radio.', 'Brain: amazed. Ears: ready. Music time.']); }
  if (ps.concert) { add(ps.concert.intros, ['Saturday concert time! {t}. About {min} minutes.', 'Live set now: {t}. Enjoy the show.', 'Concert time. {t}. Front row, Rim.', 'It is Saturday, so here is a live show: {t}.']); add(ps.concert.outros, ['That was the concert. What a show. Back to the music.', 'Concert over. Give it up for the band!', 'That was the live set. Back to the radio.', 'What a concert. Now, back to the songs.']); }

  // ---------- content_ads.js: the commercial break ----------
  add(R.breakIntros, [
    'Commercial break! Two classics from Moroccan TV, then back to the music.',
    'Time for the ads. The vintage kind.',
    'A short commercial break, straight from the TV archive.',
    'And now, a few words from our very old sponsors.',
    'Commercial time. Remember these?',
    'Quick break for some retro commercials.',
    'Ad break! Get ready for some serious nostalgia.',
    'Two little commercials now. Then the music is back.',
  ]);
  add(R.breakOutros, [
    'Back to the music!', 'Ads done. Here comes the music.', 'That was the commercial break. Music time.',
    'And we are back.', 'Thanks, sponsors. Now, the songs.', 'Commercials over. Let us go.',
  ]);
})();

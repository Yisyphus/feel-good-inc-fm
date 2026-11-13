// What Luna says between the songs: welcomes, intros, back-announcements, little extras.
// Each pool is shuffled and never repeats until it is used up. {host} {station} {time} {a} {t} {age} are filled in.
(function () {
  const R = window.RADIO;
  // the first words when the radio starts: never the song's name (Luna announces it right before it plays)
  R.welcomes = {
    morning: [
      'Good morning, Rim! Luna here, on {station}. It is {time}, the coffee is imaginary, the music is real.',
      'Rise and shine, it is {time} on {station}. I am Luna, and I promise to be less annoying than your alarm.',
      'Morning, Rim. {station} is awake, Joe is somewhere looking for his headphones, and the songs are ready.',
      'It is {time}, and that means it is officially a new day full of possibilities. And snacks.',
    ],
    afternoon: [
      'Hey Rim! Good afternoon from {station}. It is {time}, and I have a pile of great songs with your name on them.',
      'Afternoon, Rim. Luna here. Whatever today threw at you, the radio is now officially on your side.',
      'It is {time}. School bag down, volume up. This is {station}.',
      'Welcome back to {station}, Rim. Joe says hi. I say hi too, louder.',
    ],
    evening: [
      'Good evening, Rim! It is {time} on {station}, the best station in your room.',
      'Evening, Rim. Luna here, with Joe, and with a lot of good music. Settle in.',
      'It is {time}. The day is done, or almost. Time for music you actually like.',
      'Hey Rim, welcome to the evening shift on {station}. Fairy lights on, if you have them.',
    ],
    night: [
      'Hey night owl. It is {time}, and {station} is still on for you, quietly.',
      'It is late, Rim. Luna here, keeping it chill.',
      'Welcome to the late show on {station}. Soft voices, good songs.',
    ],
  };
  R.introTemplates = [
    'Here is {a}, with {t}.', 'Next up: {t}, by {a}.', 'Okay, this one is a banger. {a}, {t}.', 'Coming in hot: {t}.',
    'Let us go. {a}.', 'Here comes {t}, by {a}. Good choice, me.', 'Next, {a}. Trust me on this one.', '{t}. By {a}. Press nothing, just listen.',
    'Fresh from the {station} record crate: {a}, {t}.', 'Rim, this one is for you. Well, they all are. {t}.',
    'Next up is {a}. Joe says this one is his favourite. He says that about every song.', 'Here we go: {t}.',
  ];
  R.newSongTemplates = [
    'This one is a song you added yourself: {t}, by {a}. Excellent taste, by the way.',
    'From your own picks: {a}, with {t}.', 'A Rim pick! {t}, by {a}. The radio approves.',
  ];
  R.backTemplates = [
    'That was {a}, with {t}.', '{t}, by {a}. What a tune.', 'That was {t}. Still in my head, and I am a radio host.',
    '{a}, everybody. {t}.', 'That was {a}. Ten out of ten, no notes.', '{t}, by {a}. If you liked it, the little heart is right there.',
    'That was {t}. Joe is still dancing. I can hear him.', '{a}, with {t}. Iconic behaviour.',
  ];
  R.moodBy = {
    happy: ['This one is pure sunshine.', 'Good mood guaranteed, or your money back. It is free, so, you know.'],
    dreamy: ['This one is a little dreamy. Float a bit.', 'A dreamy one. Perfect for staring at the ceiling.'],
    chill: ['A chill one. Breathe out.', 'Slowing it down for a minute.'],
    hype: ['Okay, energy time.', 'This one is loud. As it should be.', 'Warning: may cause head-banging.'],
    moody: ['A moody one. Dramatic lighting recommended.', 'A bit of mood, for balance.'],
    epic: ['This one is epic. Like, movie-trailer epic.', 'Big song energy coming up.'],
    warm: ['A warm one, like a hoodie in song form.', 'This one feels like a good afternoon.'],
    weird: ['This one is wonderfully strange.', 'Weird in the best way.'],
  };
  R.moodLines = ['Turn it up a little.', 'Good song, good day.', 'This one is a vibe.', 'Okay, I love this one.', 'Main character music.'];
  R.energyUp = ['Okay, waking things up now.', 'Turning the energy up a notch. Or five.', 'Time to move.'];
  R.energyDown = ['Taking it down a notch.', 'Something calmer now.', 'Easy does it.'];
  R.detourLines = ['Small detour now: different world, same {theme} feeling.', 'Plot twist: something completely different, but it is still about {theme}.'];
  R.themeBridges = {
    love: ['Another love song. The radio is in a romantic mood today.'],
    friends: ['Staying on the friendship theme.'],
    dreams: ['More dreaming, coming right up.'],
    rebel: ['Keeping the attitude going.'],
    space: ['Still floating in space.'],
    dance: ['Do not stop dancing yet.'],
    summer: ['More summer, whatever the calendar says.'],
    weird: ['Keeping it weird.'],
    fun: ['More fun, no breaks.'],
  };
  R.idents = [
    'You are listening to {station}. Your radio. Literally, it is yours.',
    'This is {station}, with Luna and Joe. Good songs, good vibes, zero ads.',
    '{station}. Made for Rim, approved by Rim. Hopefully.',
    'It is {time} on {station}. Still the best station in the building.',
    'Feel Good Inc. F M: where every song is a good song, and every day can be a good day.',
    'You are tuned to {station}. No ads, no nonsense. Well, a little nonsense. From me.',
  ];
  R.checkins = [
    'Quick check-in: have you had some water today? The radio cares about your hydration.',
    'Little reminder: you are doing better than you think. That is all. Back to the music.',
    'Check-in time: posture! Sit up like a rock star. Okay, carry on.',
    'If you have been on a screen for a while, look at something far away for a few seconds. Your eyes will thank you.',
    'Just checking in. If today was a lot, this next song is a small break. You deserve it.',
    'Stretch break, if you feel like it. Arms up, like you just scored the winning goal.',
  ];
  R.runStarts = [
    'Okay, Genre Mix time: {label}. Buckle up.', 'For the next while, it is all {label}. Let us go.', 'Starting a Genre Mix now: {label}. Enjoy.',
  ];
  R.runEnds = [
    'And that was the end of the Genre Mix: {label}. Back to the usual mix.', 'That wraps up {label}. Back to a bit of everything.',
  ];
  R.dedicationLines = [
    'A shout-out now: {d}. Here is {t}, by {a}.', 'This one comes with a message: {d}. Here is {a}.', 'Shout-out time! {d}. {t}, coming up.',
  ];
  R.podOutros = ['That was {t}. Hope you learned something cool. Back to the music.', 'And that was the episode. Back to the songs.', 'Okay, brain fed. Now, music.'];
  R.testLines = {
    joe: ['Hey Rim, this is Luna. This is how I sound on {station}.', 'Testing, testing. Luna here. Is this thing on?'],
    luna: ['Hi Rim, Joe here. I read the good stuff and keep Luna in check.', 'This is Joe. Nice to meet you, officially.'],
    bulletin: ['This is the Feel Good Bulletin voice. Good news only, I promise.', 'Testing the bulletin voice. Today: everything is fine.'],
  };
  R.sleepLines = ['That is the sleep timer. Goodnight, Rim. Sweet dreams, and see you tomorrow.', 'Time to rest. Goodnight from Luna and Joe.'];
})();

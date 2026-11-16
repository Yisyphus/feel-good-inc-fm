// Commercials: the owner's list of vintage Moroccan TV ads, exact videos. Two play after every 6 songs (played or
// skipped), with a jingle before and after; never in Just music or Homework mode. Next skips one.
(function () {
  const R = window.RADIO;
  R.adsEvery = 6;   // songs between commercial breaks
  R.adsPerBreak = 2;
  R.ads = [
    { id: '3J99HDlBJBA', title: 'Colorado (2M)', seconds: 34 },
    { id: 'Vwr53yE01yA', title: 'Moony, Saida Charaf (long version)', seconds: 47 },
    { id: 'uh5zbltqaUY', title: 'Lalla Maymouna (2008)', seconds: 31 },
    { id: 'dw6bCfZnEE4', title: 'Javel Flash (2003)', seconds: 40 },
    { id: 'KYpYOUhhXS4', title: 'Palmolive (1980)', seconds: 31 },
    { id: 'Fg_wdS9J_UE', title: "P'tit Beldi", seconds: 44 },
    { id: 'w3CTxbXGzUo', title: 'Savon La Main: la terrasse', seconds: 35 },
    { id: 'FmOZcZHlE30', title: 'Afia: Dakka Marrakchia', seconds: 38 },
    { id: 'H9QS1Rv4WpY', title: 'Tide (Ramadan 2019)', seconds: 32 },
    { id: 'Dt_xJQO-DSA', title: 'Eko: Lbasma', seconds: 79 },
    { id: 'RG3TyPi17U0', title: 'Dalaa nappies', seconds: 30 },
    { id: 'ivkdhvEYsTg', title: 'Menu Mabrouk', seconds: 44 },
    { id: 'MVKtYVls4UQ', title: 'Thé Bellar (Ramadan 2011)', seconds: 31 },
    { id: 'kAu3qD6y3OY', title: 'Cbon Daoudiya (Ramadan 2011)', seconds: 40 },
    { id: '8aOCtazj-ic', title: 'Maroc Telecom: el Bacha', seconds: 40 },
    { id: 'Zwtrj1uSqpE', title: 'Yassar 9090 (2M)', seconds: 43 },
    { id: 'MObLpWj8qtc', title: 'Yassar 9090 (the clip)', seconds: 41 },
    { id: 'SPKEQVAdB3w', title: 'Forsa (2008)', seconds: 46 },
  ];
  R.breakIntros = [
    'Commercial break! Straight from the Moroccan TV archive. Do not touch that dial.',
    'And now, a word from our sponsors. Our very retro sponsors.',
    'Time for some classic Moroccan commercials. Pure nostalgia, two of them, then back to the music.',
    'Commercial break time. Grab a snack, or just enjoy the jingles.',
  ];
  R.breakOutros = [
    'And we are back! Music time.',
    'That was the commercial break. Now, back to the good stuff.',
    'Thank you, sponsors. And now, the music.',
  ];
})();

/* Toplay core: helpers, storage, shared state. */
const TP = (window.TP = window.TP || {});
TP.$ = (s, r = document) => r.querySelector(s);
TP.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
TP.reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
TP.touch = window.matchMedia && matchMedia('(hover: none), (pointer: coarse)').matches;
TP.fmt = s => { s = Math.max(0, Math.ceil(s)); const m = Math.floor(s / 60), r = s % 60; return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`; };
TP.icon = (name, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
TP.wait = ms => new Promise(r => setTimeout(r, ms));
TP.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
TP.buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

TP.store = {
  key: 'toplay:v1',
  data: null,
  load() {
    if (this.data) return this.data;
    let d = {};
    try { d = JSON.parse(localStorage.getItem(this.key) || '{}') || {}; } catch (e) { d = {}; }
    this.data = Object.assign({ music: true, sfx: true, voice: true, muted: false, levels: {}, seenRotateTip: false, seenMissTip: false }, d);
    return this.data;
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {} },
  set(k, v) { this.load()[k] = v; this.save(); },
  // progress is kept per language: winning in English does not unlock German rooms
  level(id) { const L = this.load().levels, k = (this.data.lang || 'en') + ':' + id; return L[k] || (L[k] = { best: 0, stars: 0, plays: 0, wins: 0 }); },
};
TP.store.load();
TP.session = {
  get(k) { try { return sessionStorage.getItem('toplay:' + k); } catch (e) { return null; } },
  set(k, v) { try { sessionStorage.setItem('toplay:' + k, v); } catch (e) {} },
};

TP.SCORE = {
  perObject: 100, perSecond: 5, perHelp: 200, perMiss: 20,
  compute({ won, secondsLeft, helps, misses, total = 20 }) {
    if (!won) return null;
    const items = total * this.perObject;
    const time = Math.max(0, Math.floor(secondsLeft)) * this.perSecond;
    const help = helps * this.perHelp, miss = misses * this.perMiss;
    const score = Math.max(0, items + time - help - miss);
    return { items, time, help, miss, score, stars: score >= 3200 ? 3 : score >= 2400 ? 2 : 1 };
  },
};

/* Languages: English (default) and German.
   Every visible string is written in English in the markup and the scripts; while German is on, a watcher swaps
   each text node and label for its German line, keeping the English so the switch back is instant.
   Object words come from the level data (o.word / o.de) and are marked translate="no". */
TP.i18n = (() => {
  const LANGS = ['en', 'de'];
  const DE = {
    // loader, gate, intro
    'Dusting off the room…': 'Das Zimmer wird abgestaubt…',
    'Shuffling the hiding spots…': 'Die Verstecke werden gemischt…',
    'Winding the clock…': 'Die Uhr wird aufgezogen…',
    'Turning off the lights…': 'Das Licht geht aus…',
    'Hiding everything…': 'Alles wird versteckt…',
    "The room didn't load. Check your connection and try again.": 'Das Zimmer wurde nicht geladen. Prüfe deine Verbindung und versuche es noch einmal.',
    'Look closer.': 'Schau genau hin.',
    'Toplay is better with sound.': 'Toplay macht mit Ton mehr Spaß.',
    'Enter with sound': 'Mit Ton starten',
    'Enter without sound': 'Ohne Ton starten',
    'Skip intro': 'Intro überspringen',
    'Language': 'Sprache',
    // header, menu, footer
    'Menu': 'Menü',
    'Toplay · Menu': 'Toplay · Menü',
    'Open menu': 'Menü öffnen',
    'Close menu': 'Menü schließen',
    'Home': 'Start',
    'Play Find It!': 'Find It! spielen',
    'Levels': 'Level',
    'Story mode': 'Die Geschichte',
    'Music on': 'Musik an', 'Music off': 'Musik aus',
    'Effects on': 'Effekte an', 'Effects off': 'Effekte aus',
    'Words on': 'Wörter an', 'Words off': 'Wörter aus', 'Words': 'Wörter',
    'Press': 'Drücke',
    'to mute · Made by': 'zum Stummschalten · Gemacht von',
    'Mute sound': 'Ton ausschalten', 'Turn sound on': 'Ton einschalten',
    'Sound (M)': 'Ton (M)',
    'Toplay home': 'Toplay Startseite',
    'Main': 'Hauptinhalt', 'Footer': 'Fußzeile',
    'Play': 'Spielen', 'About': 'Über Toplay',
    'Designed by': 'Gestaltet von',
    '· Built with Claude': '· Gebaut mit Claude',
    // home
    'Warm-up · Find 3 hidden play buttons': 'Aufwärmen · Finde 3 versteckte Play-Buttons',
    'Warm-up done · You are ready!': 'Aufwärmen geschafft · Du bist bereit!',
    'Look closer': 'Schau genau hin',
    'Find 20 hidden things. Learn 20 English words. Beat the clock.': 'Finde 20 versteckte Dinge. Lerne 20 deutsche Wörter. Schlag die Uhr.',
    'How to play': 'So wird gespielt',
    'Warm up your eyes': 'Wärm deine Augen auf',
    '3 play buttons are hiding up here': '3 Play-Buttons verstecken sich hier oben',
    "LET'S PLAY": 'LOS GEHT’S', '20 WORDS': '20 WÖRTER', '10 MINUTES': '10 MINUTEN', 'LOOK CLOSER': 'SCHAU GENAU HIN',
    'The arcade': 'Die Spielhalle',
    'Pick a game': 'Wähle ein Spiel',
    'One room is open today. More games and rooms are being built right now.': 'Heute ist ein Zimmer offen. Weitere Spiele und Zimmer sind gerade in Arbeit.',
    'Hidden objects': 'Wimmelbild',
    'A playroom after a very busy afternoon. Twenty things are hiding in the mess, and each one is an English word to learn.': 'Ein Spielzimmer nach einem sehr wilden Nachmittag. Zwanzig Dinge verstecken sich im Chaos, und jedes ist ein deutsches Wort zum Lernen.',
    '20 words': '20 Wörter',
    'Play now': 'Jetzt spielen',
    'Coming soon': 'Bald verfügbar',
    'Three moves to win, one to learn': 'Drei Schritte zum Sieg, einer zum Lernen',
    'Every room works the same way. Use your eyes, not your luck.': 'Jedes Zimmer funktioniert gleich. Vertrau deinen Augen, nicht dem Glück.',
    'Scan the room. Zoom in with the buttons, a pinch or the mouse wheel. Drag to move around.': 'Durchsuche das Zimmer. Zoome mit den Buttons, mit zwei Fingern oder mit dem Mausrad. Ziehe, um dich umzusehen.',
    'found!': 'gefunden!',
    'Tap to find': 'Tippen und finden',
    'Tap an object from the word list. It lights up and its word is crossed off. Every 5 wrong taps cost 10 seconds.': 'Tippe auf ein Ding aus der Wortliste. Es leuchtet auf und sein Wort wird durchgestrichen. Je 5 falsche Tipps kosten 10 Sekunden.',
    'Beat the clock': 'Schlag die Uhr',
    'Find all 20 before time runs out. Stuck? Help shows you one object, then needs 15 seconds to recharge.': 'Finde alle 20, bevor die Zeit abläuft. Kommst du nicht weiter? Die Hilfe zeigt dir ein Ding und braucht dann 15 Sekunden zum Aufladen.',
    'words per room': 'Wörter pro Zimmer',
    'minutes on the clock': 'Minuten auf der Uhr',
    'between each help': 'zwischen zwei Hilfen',
    'for every 5 misses': 'für je 5 Fehlversuche',
    'for 3,200 points or more': 'ab 3.200 Punkten',
    'Where things go to hide': 'Wo sich die Dinge verstecken',
    'Toplay is a small arcade of browser games': 'Toplay ist eine kleine Spielhalle mit Browserspielen,',
    'that you play with your eyes and your head. No downloads, no accounts, just tap and play.': 'die du mit Augen und Kopf spielst. Keine Downloads, kein Konto, einfach tippen und spielen.',
    'The first room, The Toy Room, is a playroom after a very busy afternoon. Every object you find is an everyday English word, so a few minutes of play leave you with twenty words you will not forget.': 'Das erste Zimmer, das Spielzimmer, sieht aus wie nach einem sehr wilden Nachmittag. Jedes Ding, das du findest, ist ein deutsches Alltagswort. Nach ein paar Minuten Spiel kennst du zwanzig Wörter, die du nicht vergisst.',
    '. Built with Claude, an AI assistant. Music and sound effects composed in code for Toplay.': '. Gebaut mit Claude, einem KI-Assistenten. Musik und Soundeffekte wurden für Toplay im Code komponiert.',
    'Room 01': 'Zimmer 01',
    '20 objects · 10 minutes · a lot of mess': '20 Dinge · 10 Minuten · viel Chaos',
    // levels
    'Find It! · Levels': 'Find It! · Level',
    'Choose a room': 'Wähle ein Zimmer',
    '9 more rooms are on their way. Come back soon!': '9 weitere Zimmer sind unterwegs. Schau bald wieder vorbei!',
    'Back home': 'Zurück zum Start',
    'Ready to play': 'Bereit zum Spielen',
    '20 words · 10 min': '20 Wörter · 10 Min.',
    'Locked': 'Gesperrt',
    'coming soon': 'bald verfügbar',
    'This room is still being cluttered.': 'Dieses Zimmer wird gerade noch vollgeräumt.',
    'Warm-up · Find 3 hidden': 'Aufwärmen · Finde 3 versteckte',
    // rooms (from level data)
    'The Toy Room': 'Das Spielzimmer',
    'The Kitchen': 'Die Küche',
    'The Garage': 'Die Garage',
    'Every tool has a place, but nobody put them back. 20 things are hiding in the workshop. Find them all before the clock runs out.': 'Jedes Werkzeug hat seinen Platz, aber niemand hat aufgeräumt. 20 Dinge verstecken sich in der Werkstatt. Finde sie alle, bevor die Zeit abläuft.',
    'Something smells good, but the cook stepped out. 20 things are hiding between the pots and jars. Find them all before the clock runs out.': 'Es riecht lecker, aber der Koch ist kurz weg. 20 Dinge verstecken sich zwischen Töpfen und Gläsern. Finde sie alle, bevor die Zeit abläuft.',
    'Next room': 'Nächstes Zimmer',
    'More rooms': 'Weitere Zimmer',
    'More rooms are on their way. Come back soon!': 'Weitere Zimmer sind unterwegs. Schau bald wieder vorbei!',
    'All rooms cleared!': 'Alle Zimmer geschafft!',
    'More rooms: coming soon': 'Weitere Zimmer: bald verfügbar',
    'Show the tour again': 'Die Tour noch einmal zeigen',
    'Your word list': 'Deine Wortliste',
    'These 20 things are hiding in the room. Find each one in the picture.': 'Diese 20 Dinge verstecken sich im Zimmer. Finde jedes im Bild.',
    'Every word has a speaker. Tap the word to hear how it sounds. Try it now.': 'Jedes Wort hat einen Lautsprecher. Tippe auf das Wort, um es zu hören. Probier es jetzt aus.',
    'Find it in the room': 'Finde es im Zimmer',
    'Tap an object to find it. Drag to look around. Pinch, scroll or use the buttons to zoom in.': 'Tippe auf ein Ding, um es zu finden. Ziehe, um dich umzusehen. Zoome mit zwei Fingern, dem Mausrad oder den Buttons.',
    'Stuck?': 'Kommst du nicht weiter?',
    'Help shows you one hidden object. Then it needs 15 seconds to recharge.': 'Die Hilfe zeigt dir ein verstecktes Ding und braucht dann 15 Sekunden zum Aufladen.',
    'You have 10 minutes. Every 5 wrong taps cost 10 seconds. The dots count them.': 'Du hast 10 Minuten. Je 5 falsche Tipps kosten 10 Sekunden. Die Punkte zählen sie.',
    'One more thing': 'Noch eine Sache',
    'After you find something, tap it again to hear its word. Ready?': 'Wenn du etwas gefunden hast, tippe noch einmal darauf, um sein Wort zu hören. Bereit?',
    'Skip': 'Überspringen', 'Next': 'Weiter', "Let's play": 'Los geht’s',
    'Listen and learn': 'Hören und lernen',
    'Tap any word in the list to hear it. Tap an object you already found to hear its word again.': 'Tippe auf ein Wort in der Liste, um es zu hören. Tippe auf ein Ding, das du schon gefunden hast, um sein Wort noch einmal zu hören.',
    'Tap a word or a found object to hear it': 'Tippe auf ein Wort oder ein gefundenes Ding, um es zu hören',
    'Tap a word to hear it': 'Tippe auf ein Wort, um es zu hören',
    'Tap it again, or tap its word, to hear it.': 'Tippe noch einmal darauf oder auf sein Wort, um es zu hören.',
    'No German voice on this device.': 'Auf diesem Gerät gibt es keine deutsche Stimme.',
    'No English voice on this device.': 'Auf diesem Gerät gibt es keine englische Stimme.',
    'locked': 'gesperrt',
    'A playroom after a very busy afternoon. 20 things are hiding in the mess. Find them all before the clock runs out.': 'Ein Spielzimmer nach einem sehr wilden Nachmittag. 20 Dinge verstecken sich im Chaos. Finde sie alle, bevor die Zeit abläuft.',
    'A cluttered children\'s toy room': 'Ein unordentliches Kinderspielzimmer',
    // 404
    'Error 404': 'Fehler 404',
    'This page is hiding too.': 'Diese Seite versteckt sich auch.',
    'Move your lens around the dark room and tap the lost page.': 'Bewege deine Lupe durch das dunkle Zimmer und tippe auf die verlorene Seite.',
    'Found it!': 'Gefunden!',
    'Take me home': 'Zurück zum Start',
    'The lost page': 'Die verlorene Seite',
    // game HUD
    'Help': 'Hilfe',
    'Find these': 'Finde diese',
    'Words to find': 'Wörter zum Finden',
    'Drag to move · Pinch or scroll to zoom · Tap to find': 'Ziehen zum Bewegen · Zwei Finger oder Mausrad zum Zoomen · Tippen zum Finden',
    'Pause (Esc)': 'Pause (Esc)',
    'Full screen (F)': 'Vollbild (F)', 'Exit full screen (F)': 'Vollbild beenden (F)',
    'Zoom in (+)': 'Vergrößern (+)', 'Zoom out (−)': 'Verkleinern (−)',
    'Help: show one hidden object (H)': 'Hilfe: ein verstecktes Ding zeigen (H)',
    'Show all words': 'Alle Wörter zeigen', 'Show fewer words': 'Weniger Wörter zeigen',
    // game messages
    'Opening the room…': 'Das Zimmer wird geöffnet…',
    'Hiding 20 things in the mess.': '20 Dinge werden im Chaos versteckt.',
    "The room didn't load.": 'Das Zimmer wurde nicht geladen.',
    'Check your connection and try again.': 'Prüfe deine Verbindung und versuche es noch einmal.',
    'Retry': 'Nochmal',
    '20 words to find': '20 Wörter zu finden',
    '10 minutes': '10 Minuten',
    'Help every 15 seconds': 'Hilfe alle 15 Sekunden',
    'Every 5 misses cost 10 seconds': 'Je 5 Fehlversuche kosten 10 Sekunden',
    'Start': 'Los',
    'GO!': 'LOS!',
    'Nice!': 'Super!', 'Got it!': 'Hab’s!', 'Sharp eyes!': 'Adleraugen!', 'Spotted!': 'Entdeckt!',
    'Almost there!': 'Fast geschafft!', 'Last one!': 'Noch eins!',
    'Nothing here. Every 5 misses cost 10 seconds.': 'Hier ist nichts. Je 5 Fehlversuche kosten 10 Sekunden.',
    '−10s · Too many misses!': '−10 s · Zu viele Fehlversuche!',
    'Look here!': 'Schau hier!',
    'Turn your phone sideways for a bigger room.': 'Dreh dein Handy quer für ein größeres Zimmer.',
    'Got it': 'Verstanden',
    'Paused': 'Pause',
    'Take a breath. The room will wait.': 'Atme kurz durch. Das Zimmer wartet.',
    'Resume': 'Weiter', 'Music': 'Musik', 'Effects': 'Effekte',
    'Restart': 'Neu starten', 'Quit to levels': 'Zu den Leveln',
    'Start over?': 'Neu anfangen?', 'Your progress in this room will be lost.': 'Dein Fortschritt in diesem Zimmer geht verloren.',
    'Yes, restart': 'Ja, neu starten', 'Keep playing': 'Weiterspielen',
    'Leave the room?': 'Zimmer verlassen?', 'Your progress will be lost.': 'Dein Fortschritt geht verloren.',
    'Leave': 'Verlassen', 'Stay': 'Bleiben',
    'Full screen is not available here. Add Toplay to your Home Screen for a full-screen game.': 'Vollbild ist hier nicht verfügbar. Füge Toplay zum Home-Bildschirm hinzu, um im Vollbild zu spielen.',
    'Full screen is not available on this phone. Add Toplay to your Home Screen for a full-screen game.': 'Vollbild ist auf diesem Handy nicht verfügbar. Füge Toplay zum Home-Bildschirm hinzu, um im Vollbild zu spielen.',
    'You found it all!': 'Du hast alles gefunden!',
    'Sharp eyes! Nothing gets past you.': 'Adleraugen! Dir entgeht nichts.',
    'Great finds! Can you do it faster?': 'Toll gefunden! Schaffst du es schneller?',
    'Done! Try again with fewer helps.': 'Geschafft! Versuch es mit weniger Hilfen.',
    'Total': 'Gesamt', 'New best!': 'Neuer Rekord!', 'First clear!': 'Erster Sieg!',
    'Play again': 'Nochmal spielen', 'Next room soon': 'Nächstes Zimmer bald',
    "Time's up!": 'Die Zeit ist um!',
    'Show what was hiding': 'Zeig, was versteckt war',
    'Try again': 'Nochmal versuchen',
    "Here's what was hiding:": 'Das war versteckt:',
    "Here's what was hiding. Tap one to hear it.": 'Das war versteckt. Tippe darauf, um es zu hören.',
    // page titles
    'Levels · Toplay': 'Level · Toplay', 'Lost · Toplay': 'Verlaufen · Toplay',
  };
  // lines with numbers in them
  const PAT = [
    [/^Room (\d+) of (\d+)$/, 'Zimmer $1 von $2'],
    [/^Room (\d+)$/, 'Zimmer $1'],
    [/^(\d+) left$/, 'noch $1'],
    [/^(\d+:\d+) left$/, 'noch $1'],
    [/^Help in (\d+)s$/, 'Hilfe in $1 s'],
    [/^Help ready in (\d+) seconds$/, 'Hilfe bereit in $1 Sekunden'],
    [/^(\d+) of 5 misses before a penalty$/, '$1 von 5 Fehlversuchen bis zur Strafe'],
    [/^Best (\d+) · (★*)$/, 'Rekord $1 · $2'],
    [/^([★☆]+) Best (\d+)$/, '$1 Rekord $2'],
    [/^Found (\d+) × 100$/, 'Gefunden $1 × 100'],
    [/^Time bonus · (\S+) × 5$/, 'Zeitbonus · $1 × 5'],
    [/^Helps used · (\d+)$/, 'Hilfen · $1'],
    [/^Misses · (\d+)$/, 'Fehlversuche · $1'],
    [/^You found (\d+) of (\d+)\. So close!$/, 'Du hast $1 von $2 gefunden. So knapp!'],
    [/^You found (\d+) of (\d+)\. The room is still full of secrets\.$/, 'Du hast $1 von $2 gefunden. Das Zimmer steckt noch voller Geheimnisse.'],
    [/^(\d+) of 3 stars$/, '$1 von 3 Sternen'],
    [/^(\d+) \/ (\d+) rooms unlocked$/, '$1 / $2 Zimmer freigeschaltet'],
    [/^(\d+) of (\d+) rooms unlocked$/, '$1 von $2 Zimmern freigeschaltet'],
    [/^(.+)\. Tap hidden objects\.$/, (m, a) => tr(a) + '. Tippe auf versteckte Dinge.'],
    [/^Room (\d+): ([^,]+)(?:, best (\d+), (\d+) stars)?$/, (m, n, name, b, s) => `Zimmer ${n}: ${tr(name)}` + (b ? `, Rekord ${b}, ${s} Sterne` : '')],
    [/^Room (\d+), coming soon$/, 'Zimmer $1, bald verfügbar'],
    [/^(\d+) rooms are open today\. More games and rooms are being built right now\.$/, 'Heute sind $1 Zimmer offen. Weitere Spiele und Zimmer sind gerade in Arbeit.'],
    [/^Win room (\d+) to open it\.$/, 'Gewinne Zimmer $1, um es zu öffnen.'],
    [/^(\d+) more rooms are on their way\. Come back soon!$/, '$1 weitere Zimmer sind unterwegs. Schau bald wieder vorbei!'],
    [/^★ (\d+) \/ (\d+)$/, '★ $1 / $2'],
  ];

  const st = TP.store.load();
  let lang = LANGS.includes(st.lang) ? st.lang : 'en';

  function tr(s) {
    if (lang === 'en' || !s) return s;
    const k = s.trim(); if (!k) return s;
    let o = DE[k];
    if (o === undefined) for (const [re, r] of PAT) if (re.test(k)) { o = k.replace(re, r); break; }
    if (o === undefined) return s;
    const i = s.indexOf(k);
    return s.slice(0, i) + o + s.slice(i + k.length);
  }

  const ATTRS = ['aria-label', 'title', 'alt', 'placeholder'];
  const textSrc = new WeakMap(), attrSrc = new WeakMap();
  const skip = el => !el || el.closest('[translate="no"], script, style, svg, canvas');

  function doText(n) {
    if (skip(n.parentElement)) return;
    const cur = n.data, r = textSrc.get(n);
    const en = r && cur === r.out ? r.en : cur;
    const out = tr(en);
    textSrc.set(n, { en, out });
    if (out !== cur) n.data = out;
  }
  function doAttr(el, a) {
    if (skip(el)) return;
    const cur = el.getAttribute(a); if (cur == null) return;
    let m = attrSrc.get(el); if (!m) attrSrc.set(el, m = {});
    const r = m[a], en = r && cur === r.out ? r.en : cur, out = tr(en);
    m[a] = { en, out };
    if (out !== cur) el.setAttribute(a, out);
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) if (/\S/.test(n.data)) doText(n);
    const sel = ATTRS.map(a => `[${a}]`).join(',');
    if (root.matches && root.matches(sel)) ATTRS.forEach(a => doAttr(root, a));
    root.querySelectorAll(sel).forEach(el => ATTRS.forEach(a => el.hasAttribute(a) && doAttr(el, a)));
  }

  const mo = new MutationObserver(list => {
    for (const m of list) {
      if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttr(m.target, m.attributeName);
      else m.addedNodes.forEach(walk);
    }
  });

  function syncUI() {
    document.documentElement.lang = lang;
    TP.$$('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  }
  function set(l) {
    if (!LANGS.includes(l) || l === lang) return syncUI();
    lang = l; TP.store.set('lang', l);
    walk(document.body);
    document.title = t(titleEn);
    syncUI();
    document.dispatchEvent(new CustomEvent('tp:lang', { detail: lang }));
  }
  const t = s => tr(s);
  let titleEn = document.title || 'Toplay';
  function title(en) { titleEn = en; document.title = t(en); }

  function init() {
    TP.$$('[data-lang-slot]').forEach(e => { e.innerHTML = TP.langSwitch('lang-switch-' + e.dataset.langSlot); });
    walk(document.body);
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    syncUI();
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-lang]'); if (!b) return;
      set(b.dataset.lang); TP.audio && TP.audio.sfx && TP.audio.sfx('click');
    });
  }

  /** a level object's word as HTML: German shows its article in its colour */
  function wordHTML(o) {
    if (lang === 'de' && o.de) { const i = o.de.indexOf(' '), a = o.de.slice(0, i); return `<b class="art art-${a}">${a}</b> ${TP.esc(o.de.slice(i + 1))}`; }
    return TP.esc(o.word);
  }
  function wordKey(o) { return lang === 'de' && o.de ? o.de.slice(o.de.indexOf(' ') + 1).replace(/\u00ad/g, '') : o.word; }

  /** the EN / DE switch; every copy on the page stays in sync */
  TP.langSwitch = (cls = '') => `<div class="lang-switch ${cls}" role="group" aria-label="Language">${LANGS.map(l =>
    `<button type="button" data-lang="${l}" aria-pressed="${l === lang}" data-cursor="${l.toUpperCase()}"><span class="lang-code">${l.toUpperCase()}</span><span class="lang-name">${l === 'en' ? 'English' : 'Deutsch'}</span></button>`).join('')}</div>`;

  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);

  return { t, set, title, wordHTML, wordKey, get lang() { return lang; }, LANGS };
})();

/* Sound: Web Audio with separate music and effects buses, gapless loops, crossfades. */
TP.audio = (() => {
  const LOOPS = { theme: 68.5714, play: 61.9355 };
  const SFX = ['click', 'hover', 'whoosh', 'countdown', 'go', 'found', 'miss', 'penalty', 'hint', 'tick', 'star', 'count-up', 'win', 'lose'];
  const st = TP.store.load();
  let ctx = null, master, musicBus, sfxBus;
  const raw = {}, buf = {};
  let current = null; // { name, src, gain }
  let wanted = null;
  const oggOK = (() => { try { return !!new Audio().canPlayType('audio/ogg; codecs="opus"'); } catch (e) { return false; } })();

  function url(n) { return `sounds/${n}.${(n in LOOPS && oggOK) ? 'ogg' : 'mp3'}`; }

  async function prefetch(onProgress) {
    const names = ['theme', 'play', ...SFX];
    let done = 0;
    await Promise.all(names.map(async n => {
      try { const r = await fetch(url(n)); raw[n] = await r.arrayBuffer(); } catch (e) { /* missing sound is non-fatal */ }
      done++; onProgress && onProgress(done / names.length);
    }));
  }

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.connect(ctx.destination);
      musicBus = ctx.createGain(); musicBus.connect(master);
      sfxBus = ctx.createGain(); sfxBus.connect(master);
      applyLevels(true);
      decodeAll();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  function decodeAll() {
    Object.keys(raw).forEach(n => {
      if (buf[n] || !raw[n]) return;
      const copy = raw[n].slice(0);
      ctx.decodeAudioData(copy, b => { buf[n] = b; if (wanted === n && (!current || current.name !== n)) music(n); }, () => {});
    });
  }

  function applyLevels(now) {
    if (!ctx) return;
    const t = ctx.currentTime, T = now ? 0 : 0.25;
    master.gain.setTargetAtTime(st.muted ? 0 : 1, t, T / 3 || 0.001);
    musicBus.gain.setTargetAtTime(st.music ? 0.55 : 0, t, T / 3 || 0.001);
    sfxBus.gain.setTargetAtTime(st.sfx ? 0.9 : 0, t, T / 3 || 0.001);
  }

  function music(name, fade = 1.0) {
    wanted = name;
    if (!ctx) return;
    if (current && current.name === name) return;
    const b = buf[name];
    const old = current;
    if (old) { old.gain.gain.cancelScheduledValues(ctx.currentTime); old.gain.gain.setTargetAtTime(0, ctx.currentTime, fade / 4); const s = old.src; setTimeout(() => { try { s.stop(); } catch (e) {} }, fade * 1500); }
    current = null;
    if (!name || !b) return;
    const src = ctx.createBufferSource(); src.buffer = b; src.loop = true;
    src.loopStart = 0; src.loopEnd = Math.min(b.duration, LOOPS[name] || b.duration);
    const g = ctx.createGain(); g.gain.value = 0; src.connect(g); g.connect(musicBus);
    src.start(); g.gain.setTargetAtTime(1, ctx.currentTime, fade / 4);
    current = { name, src, gain: g };
  }

  const ducks = new Set();
  /** lower the music while a reason holds (pause screen, a word being spoken) */
  function duck(on, why = 'pause') {
    on ? ducks.add(why) : ducks.delete(why);
    if (current && ctx) current.gain.gain.setTargetAtTime(ducks.has('voice') ? 0.18 : ducks.size ? 0.3 : 1, ctx.currentTime, 0.08);
  }

  function sfx(name, vol = 1, loop = false) {
    if (!ctx || !buf[name]) return null;
    const src = ctx.createBufferSource(); src.buffer = buf[name]; src.loop = loop;
    const g = ctx.createGain(); g.gain.value = vol; src.connect(g); g.connect(sfxBus); src.start();
    return { stop() { try { src.stop(); } catch (e) {} } };
  }

  function setMuted(m) { st.muted = m; TP.store.save(); unlock(); applyLevels(); syncUI(); }
  function setMusic(on) { st.music = on; TP.store.save(); applyLevels(); syncUI(); }
  function setSfx(on) { st.sfx = on; TP.store.save(); applyLevels(); syncUI(); }
  // words have their own switch: muting music and effects never silences the words
  function setVoice(on) { st.voice = on; TP.store.save(); if (!on && TP.speech) TP.speech.stop(); syncUI(); }

  function syncUI() {
    TP.$$('.sound-toggle').forEach(b => {
      b.classList.toggle('is-muted', st.muted);
      b.setAttribute('aria-label', st.muted ? 'Turn sound on' : 'Mute sound');
      b.setAttribute('aria-pressed', st.muted ? 'false' : 'true');
    });
    TP.$$('[data-toggle="music"]').forEach(b => { b.setAttribute('aria-pressed', String(st.music)); if (!b.classList.contains('toggle')) b.textContent = st.music ? 'Music on' : 'Music off'; });
    TP.$$('[data-toggle="sfx"]').forEach(b => { b.setAttribute('aria-pressed', String(st.sfx)); if (!b.classList.contains('toggle')) b.textContent = st.sfx ? 'Effects on' : 'Effects off'; });
    TP.$$('[data-toggle="voice"]').forEach(b => { b.setAttribute('aria-pressed', String(st.voice !== false)); if (!b.classList.contains('toggle')) b.textContent = st.voice !== false ? 'Words on' : 'Words off'; });
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('.sound-toggle');
    if (t) { setMuted(!st.muted); if (!st.muted) sfx('click'); return; }
    const tg = e.target.closest('[data-toggle]');
    if (tg) { const k = tg.dataset.toggle; k === 'music' ? setMusic(!st.music) : k === 'voice' ? setVoice(st.voice === false) : setSfx(!st.sfx); sfx('click'); }
  });
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {}); else ctx.resume().catch(() => {});
  });

  return { prefetch, unlock, music, sfx, duck, setMuted, setMusic, setSfx, syncUI, get muted() { return st.muted; } };
})();

/* Custom cursor, click sparks, hover and click sounds, the "toplay" easter egg. */
TP.cursor = (() => {
  const fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  let el, dot, ringPos, label, x = -100, y = -100, rx = -100, ry = -100;
  const COLORS = ['var(--blaze)', 'var(--volt)', 'var(--zest)', 'var(--beacon)'];

  function sparks(cx, cy, n = 8, spread = 1) {
    if (TP.reduced) return;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'spark';
      const a = (i / n) * Math.PI * 2 + Math.random() * .4, d = (26 + Math.random() * 20) * spread;
      s.style.left = cx - 4 + 'px'; s.style.top = cy - 4 + 'px'; s.style.background = COLORS[i % 4];
      s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      document.body.appendChild(s); setTimeout(() => s.remove(), 680);
    }
  }

  function init() {
    if (fine && !TP.reduced) {
      document.documentElement.classList.add('has-cursor');
      el = document.createElement('div'); el.className = 'cursor'; el.setAttribute('aria-hidden', 'true');
      el.innerHTML = '<div class="cursor-dot"></div><div class="cursor-ring-pos"><div class="cursor-ring"><span class="cursor-label"></span></div></div>';
      document.body.appendChild(el);
      dot = el.querySelector('.cursor-dot'); ringPos = el.querySelector('.cursor-ring-pos'); label = el.querySelector('.cursor-label');
      addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        x = e.clientX; y = e.clientY;
        const t = e.target.closest && e.target.closest('[data-cursor]');
        const m = t ? t.getAttribute('data-cursor') : '';
        const disabled = t && (t.disabled || t.closest('[disabled]'));
        const mode = m === 'LENS' ? 'lens' : (m && !disabled) ? 'label' : 'default';
        if (el.dataset.mode !== mode) el.dataset.mode = mode;
        if (mode === 'label' && label.textContent !== m) label.textContent = m;
        const blob = document.getElementById('homeLink');
        if (blob) { const r = blob.getBoundingClientRect(); blob.classList.toggle('near', Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) < 170); }
      }, { passive: true });
      addEventListener('pointerdown', () => el.classList.add('press'));
      addEventListener('pointerup', () => el.classList.remove('press'));
      document.addEventListener('mouseleave', () => { x = y = -100; });
      const tick = () => {
        rx += (x - rx) * .2; ry += (y - ry) * .2;
        dot.style.transform = `translate(${x}px,${y}px)`;
        ringPos.style.transform = `translate(${rx}px,${ry}px)`;
        requestAnimationFrame(tick);
      };
      tick();
    }
    addEventListener('pointerdown', e => { if (!e.target.closest('#gStage') && !e.target.closest('#hero')) sparks(e.clientX, e.clientY); }, { passive: true });

    // Sounds on controls
    let lastHover = 0, lastEl = null;
    document.addEventListener('pointerover', e => {
      if (e.pointerType !== 'mouse') return;
      const b = e.target.closest('button, a, [data-cursor="PLAY"]');
      if (!b || b === lastEl || b.disabled) return;
      lastEl = b;
      const now = performance.now();
      if (now - lastHover > 70) { TP.audio.sfx('hover', .7); lastHover = now; }
    });
    document.addEventListener('pointerout', e => { if (lastEl && !lastEl.contains(e.relatedTarget)) lastEl = null; });
    document.addEventListener('click', e => {
      const b = e.target.closest('button, a');
      if (b && !b.closest('#gStage') && !b.classList.contains('sound-toggle') && !b.matches('[data-toggle]') && !b.matches('#enterSound, #enterQuiet, .help')) TP.audio.sfx('click');
    });

    // Easter egg: type "toplay"
    let buf = '';
    addEventListener('keydown', e => {
      if (e.target.closest && e.target.closest('input, textarea')) return;
      buf = (buf + (e.key || '').toLowerCase()).slice(-6);
      if (buf === 'toplay') { buf = ''; rain(); }
    });
  }

  function rain() {
    TP.audio.sfx('win', .8);
    for (let k = 0; k < 14; k++) setTimeout(() => sparks(Math.random() * innerWidth, Math.random() * innerHeight * .8, 10, 1.8), k * 90);
  }

  return { init, sparks };
})();

/* Level variants: every level has several versions; each visitor gets them in a shuffled order with no repeats until all are played. */
TP.levelsData = (() => {
  let index = null;
  const cache = {};

  async function loadIndex() {
    if (!index) index = await fetch('data/levels.json').then(r => { if (!r.ok) throw new Error('levels'); return r.json(); });
    return index;
  }
  function level(n) { return index && index.levels.find(l => l.level === n); }

  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /** Next variant id for a level: draw from a per-visitor shuffle bag, never the same one twice in a row. */
  function nextId(n) {
    const L = level(n), ids = L.variants.map(v => v.id);
    const st = TP.store.load();
    st.bags = st.bags || {}; st.lastVariant = st.lastVariant || {};
    let bag = (st.bags[n] || []).filter(id => ids.includes(id));
    if (!bag.length) {
      bag = shuffle(ids);
      if (bag.length > 1 && bag[0] === st.lastVariant[n]) bag.push(bag.shift());
    }
    const id = bag.shift();
    st.bags[n] = bag; st.lastVariant[n] = id; TP.store.save();
    return id;
  }

  async function loadVariant(n, id) {
    await loadIndex();
    const L = level(n); if (!L) throw new Error('No level ' + n);
    id = id || nextId(n);
    const meta = L.variants.find(v => v.id === id) || L.variants[0];
    const data = cache[meta.id] || (cache[meta.id] = await fetch(meta.data).then(r => { if (!r.ok) throw new Error('variant'); return r.json(); }));
    const big = innerWidth * (devicePixelRatio || 1) > 1700;
    const src = big ? data.image.full : data.image.phone;
    const [img, depth] = await Promise.all([TP.loadImage(src), data.image.depth ? TP.loadImage(data.image.depth).catch(() => null) : null]);
    return { id: meta.id, data, src, img, depth, level: L };
  }

  return { loadIndex, level, loadVariant, nextId, get index() { return index; } };
})();

/* Brand shape field: confetti of Toplay shapes, used by the hero teaser and the intro. Spoiler-free: no game imagery. */
TP.shapes = (() => {
  const C = { blaze: '#FF6B1A', volt: '#6E50FF', zest: '#C6FF3D', beacon: '#FFD23F', cream: '#FFF6E5', ink: '#12121C', line: '#3A3A55', muted: '#4A4766' };
  const TYPES = ['dot', 'ring', 'tri', 'squig', 'plus', 'star', 'pill', 'ring', 'tri', 'dot'];
  const PALETTE = [C.blaze, C.volt, C.zest, C.beacon, C.cream, C.volt, C.blaze];

  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function tri(g, s) { g.beginPath(); g.moveTo(-s * .42, -s * .5); g.lineTo(s * .55, 0); g.lineTo(-s * .42, s * .5); g.closePath(); }

  /** draw one shape centred at 0,0 (caller translates/rotates) */
  function draw(g, t, s, col, alpha = 1) {
    g.globalAlpha = alpha; g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
    switch (t) {
      case 'dot': g.beginPath(); g.arc(0, 0, s * .32, 0, 6.283); g.fill(); break;
      case 'ring': g.lineWidth = s * .16; g.beginPath(); g.arc(0, 0, s * .34, 0, 6.283); g.stroke(); break;
      case 'tri': tri(g, s * .8); g.lineWidth = s * .08; g.fill(); g.stroke(); break;
      case 'plus': g.lineWidth = s * .17; g.beginPath(); g.moveTo(-s * .32, 0); g.lineTo(s * .32, 0); g.moveTo(0, -s * .32); g.lineTo(0, s * .32); g.stroke(); break;
      case 'pill': rr(g, -s * .45, -s * .16, s * .9, s * .32, s * .16); g.fill(); break;
      case 'squig': g.lineWidth = s * .13; g.beginPath(); g.moveTo(-s * .45, 0);
        for (let i = 1; i <= 4; i++) g.quadraticCurveTo(-s * .45 + (i - .5) * s * .225, (i % 2 ? -1 : 1) * s * .22, -s * .45 + i * s * .225, 0); g.stroke(); break;
      case 'star': g.beginPath();
        for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * .17 : s * .4; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        g.closePath(); g.fill(); break;
      case 'play': // the target: Toplay's "o" (ink ring on blaze, cream triangle)
        g.globalAlpha = alpha; g.fillStyle = C.blaze; g.beginPath(); g.arc(0, 0, s * .5, 0, 6.283); g.fill();
        g.lineWidth = s * .16; g.strokeStyle = C.ink; g.beginPath(); g.arc(0, 0, s * .38, 0, 6.283); g.stroke();
        g.fillStyle = C.cream; g.save(); g.translate(s * .04, 0); tri(g, s * .36); g.lineWidth = s * .05; g.strokeStyle = C.cream; g.fill(); g.stroke(); g.restore(); break;
      case 'stop': case 'pause': case 'rew': case 'dotin': // decoys: the same disc and ring, a different inside
        g.globalAlpha = alpha; g.fillStyle = C.blaze; g.beginPath(); g.arc(0, 0, s * .5, 0, 6.283); g.fill();
        g.lineWidth = s * .16; g.strokeStyle = C.ink; g.beginPath(); g.arc(0, 0, s * .38, 0, 6.283); g.stroke();
        g.fillStyle = C.cream;
        if (t === 'stop') { rr(g, -s * .13, -s * .13, s * .26, s * .26, s * .04); g.fill(); }
        else if (t === 'pause') { rr(g, -s * .13, -s * .14, s * .09, s * .28, s * .03); g.fill(); rr(g, s * .04, -s * .14, s * .09, s * .28, s * .03); g.fill(); }
        else if (t === 'dotin') { g.beginPath(); g.arc(0, 0, s * .12, 0, 6.283); g.fill(); }
        else { g.save(); g.translate(-s * .04, 0); g.scale(-1, 1); tri(g, s * .36); g.lineWidth = s * .05; g.strokeStyle = C.cream; g.fill(); g.stroke(); g.restore(); }
        break;
    }
    g.globalAlpha = 1;
  }

  /** a field of n shapes inside w x h */
  function field(n, w, h, rand = Math.random) {
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push({
        t: TYPES[Math.floor(rand() * TYPES.length)], c: PALETTE[Math.floor(rand() * PALETTE.length)],
        x: rand() * w, y: rand() * h, bx: 0, by: 0, vx: 0, vy: 0,
        s: 14 + rand() * 26, a: rand() * 6.283, va: (rand() - .5) * .006, ph: rand() * 6.283, sp: .3 + rand() * .7, al: .55 + rand() * .45,
      });
    }
    out.forEach(p => { p.bx = p.x; p.by = p.y; });
    return out;
  }

  return { C, draw, field, rr };
})();

/* Depth scene: a level image with its depth map, drawn in WebGL so near objects move more than far ones (mouse, touch drag or phone tilt). No lens, no labels. */
TP.depth = (() => {
  const VS = 'attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }';
  const FS = `precision mediump float;
  varying vec2 v; uniform sampler2D img; uniform sampler2D dep; uniform vec2 res; uniform float ar; uniform vec2 par; uniform float dim; uniform float zoom;
  void main(){
    vec2 s = vec2(v.x, 1. - v.y);
    float sar = res.x / res.y; vec2 uv = (s - .5) / zoom + .5;
    if (sar > ar) { uv.y = (uv.y - .5) * (ar / sar) + .5; } else { uv.x = (uv.x - .5) * (sar / ar) + .5; }
    float d = texture2D(dep, uv).r;
    float edge = smoothstep(0., .06, uv.x) * smoothstep(1., .94, uv.x) * smoothstep(0., .05, uv.y) * smoothstep(1., .95, uv.y);
    vec2 o = par * (d - .45) * edge;
    vec3 c = texture2D(img, clamp(uv + o, .002, .998)).rgb;
    float vig = smoothstep(1.3, .3, length((s - .5) * vec2(1.25, 1.)));
    gl_FragColor = vec4(c * dim * mix(.55, 1., vig), 1.);
  }`;

  function create(canvas, opts) {
    let gl;
    try { gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false }) || canvas.getContext('experimental-webgl'); } catch (e) { gl = null; }
    if (!gl) return null;
    const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('shader'); return s; };
    let prog;
    try { prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link'); }
    catch (e) { return null; }
    gl.useProgram(prog);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = {}; ['img', 'dep', 'res', 'ar', 'par', 'dim', 'zoom'].forEach(n => u[n] = gl.getUniformLocation(prog, n));
    const tex = (unit, image) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image); return t; };

    // a flat grey depth when a level version has no depth map: no parallax, still renders
    let depImg = opts.depth;
    if (!depImg) { depImg = document.createElement('canvas'); depImg.width = depImg.height = 2; const c = depImg.getContext('2d'); c.fillStyle = '#737373'; c.fillRect(0, 0, 2, 2); }
    tex(0, opts.img); tex(1, depImg);
    gl.uniform1i(u.img, 0); gl.uniform1i(u.dep, 1); gl.uniform1f(u.ar, opts.img.width / opts.img.height);

    const st = { tx: 0, ty: 0, px: 0, py: 0, user: 0, dim: opts.dim ?? .5, zoom: opts.zoom ?? 1.06, strength: opts.strength ?? .03 };
    let raf = 0, running = false;
    const t0 = performance.now();
    function size() {
      const dpr = Math.min(1.5, devicePixelRatio || 1), r = canvas.getBoundingClientRect();
      if (!r.width) return;
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); gl.viewport(0, 0, canvas.width, canvas.height);
    }
    const ro = new ResizeObserver(size); ro.observe(canvas); size();
    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const t = (now - t0) / 1000;
      if (now - st.user > 2500 || TP.reduced) { st.tx = Math.sin(t * .3) * .55; st.ty = Math.sin(t * .23 + 1) * .35; } // gentle drift when idle
      st.px += (st.tx - st.px) * .05; st.py += (st.ty - st.py) * .05;
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform2f(u.par, -st.px * st.strength, -st.py * st.strength * .6);
      gl.uniform1f(u.dim, st.dim); gl.uniform1f(u.zoom, st.zoom);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    return {
      start() { if (running) return; running = true; raf = requestAnimationFrame(frame); },
      stop() { running = false; cancelAnimationFrame(raf); },
      /** nx, ny in -1..1 */
      look(nx, ny) { st.tx = Math.max(-1, Math.min(1, nx)); st.ty = Math.max(-1, Math.min(1, ny)); st.user = performance.now(); },
      set(k, v) { st[k] = v; },
      destroy() { this.stop(); ro.disconnect(); const ext = gl.getExtension('WEBGL_lose_context'); ext && ext.loseContext(); },
    };
  }

  // phone tilt feeds every active scene
  const live = new Set();
  addEventListener('deviceorientation', e => {
    if (e.gamma == null) return;
    live.forEach(s => s.look(e.gamma / 25, (e.beta - 45) / 25));
  }, { passive: true });

  return { create, live };
})();

/* Pronunciation: says an object's word in the current language (German with its article).
   A recorded file wins when the level data has one (o.audio = { en: 'sounds/words/en/apple.mp3', de: … });
   otherwise the browser's own voice speaks it. */
TP.speech = (() => {
  const synth = window.speechSynthesis || null;
  const TAGS = { en: ['en-US', 'en-GB', 'en'], de: ['de-DE', 'de-AT', 'de-CH', 'de'] };
  // nicer voices first, when the device has them
  const NICE = /natural|neural|enhanced|premium|google|siri|samantha|daniel|anna|helena|katja|conrad/i;
  let voices = [];
  let current = null;

  function loadVoices() { if (synth) voices = synth.getVoices() || []; }
  if (synth) { loadVoices(); synth.addEventListener ? synth.addEventListener('voiceschanged', loadVoices) : (synth.onvoiceschanged = loadVoices); }

  function pickVoice(lang) {
    const tags = TAGS[lang] || [lang];
    for (const t of tags) {
      const all = voices.filter(v => (v.lang || '').replace('_', '-').toLowerCase().startsWith(t.toLowerCase()));
      if (all.length) return all.find(v => NICE.test(v.name)) || all.find(v => v.localService) || all[0];
    }
    return null;
  }

  /** can this device say words in this language? */
  function available(lang) { return !!synth && (!voices.length || !!pickVoice(lang)); }

  function text(o, lang) { return (lang === 'de' && o.de ? o.de : o.word).replace(/­/g, ''); }

  function stop() {
    if (current && current.pause) { try { current.pause(); } catch (e) {} }
    current = null;
    if (synth) synth.cancel();
    TP.audio.duck(false, 'voice');
  }

  /** say an object's word. Every tap that finds or replays a word speaks, unless the player turned Words off */
  function say(o, opts) {
    // speech must never break the game: any device error just means silence
    try { return sayNow(o, opts || {}); } catch (e) { TP.audio.duck(false, 'voice'); return false; }
  }
  function sayNow(o, { force = false }) {
    const st = TP.store.load();
    if (st.voice === false) return false;
    const lang = TP.i18n.lang;
    stop();
    const file = o.audio && o.audio[lang];
    if (file) {
      const a = new Audio(file); current = a;
      TP.audio.duck(true, 'voice'); a.onended = a.onerror = () => TP.audio.duck(false, 'voice');
      a.play().catch(() => { TP.audio.duck(false, 'voice'); sayWithVoice(o, lang); });
      return true;
    }
    return sayWithVoice(o, lang);
  }
  function sayWithVoice(o, lang) {
    if (!synth) return 'novoice';
    if (!voices.length) loadVoices();
    const v = pickVoice(lang);
    // the device has voices but none in this language: say nothing rather than read German with an English voice
    if (voices.length && !v) return 'novoice';
    const u = new SpeechSynthesisUtterance(text(o, lang));
    if (v) u.voice = v;
    u.lang = v ? v.lang : TAGS[lang][0];
    u.rate = .9; u.pitch = 1; u.volume = 1;
    u.onstart = () => TP.audio.duck(true, 'voice');
    u.onend = u.onerror = () => TP.audio.duck(false, 'voice');
    current = u;
    synth.speak(u);
    return true;
  }

  return { say, stop, available, text };
})();

/* Shell: loader, sound gate, cinematic intro, routing, page wipes, menu. */

TP.loadImage = src => new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });

TP.shell = (() => {
  const VIEWS = ['home', 'levels', 'lost'];
  let view = null;
  const header = () => TP.$('#siteHeader'), footer = () => TP.$('#siteFooter');

  /* ---------- loader ---------- */
  async function boot() {
    TP.cursor.init();
    TP.audio.syncUI();
    const msgs = ['Dusting off the room…', 'Shuffling the hiding spots…', 'Winding the clock…', 'Turning off the lights…', 'Hiding everything…'];
    let mi = 0;
    const msgEl = TP.$('#loaderMsg'), pctEl = TP.$('#loaderPct'), bar = TP.$('#loaderBar');
    const rot = setInterval(() => { mi = (mi + 1) % msgs.length; msgEl.textContent = msgs[mi]; }, 950);
    let shown = 0;
    const started = performance.now();
    const paint = () => {
      const p = Object.keys(parts).reduce((a, k) => a + parts[k] * W[k], 0);
      shown = Math.max(shown, p);
      const v = Math.round(shown * 100);
      pctEl.textContent = String(v).padStart(2, '0') + '%'; bar.style.width = v + '%';
    };
    const parts = { data: 0, audio: 0, fonts: 0 };
    const W = { data: .2, audio: .65, fonts: .15 };
    await Promise.all([
      TP.levelsData.loadIndex().then(() => { parts.data = 1; paint(); TP.levels.syncLabels(); }),
      TP.audio.prefetch(p => { parts.audio = p; paint(); }),
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { parts.fonts = 1; paint(); }),
    ]).catch(err => {
      msgEl.textContent = "The room didn't load. Check your connection and try again.";
      clearInterval(rot);
      const b = document.createElement('button'); b.className = 'btn btn-sm'; b.textContent = 'Retry'; b.style.marginTop = '16px';
      b.onclick = () => location.reload(); TP.$('#loader > div').appendChild(b);
      throw err;
    });
    const min = 900 - (performance.now() - started);
    if (min > 0) await TP.wait(min);
    clearInterval(rot);
    msgEl.textContent = 'Ready';
    TP.home.prepare();
    // the sound question opens every visit: browsers only allow audio after a tap
    TP.$('#gate').hidden = false; hideLoader(); TP.$('#enterSound').focus({ preventScroll: true });
  }
  function hideLoader() {
    const l = TP.$('#loader');
    l.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-out', fill: 'forwards' }).onfinish = () => l.remove();
  }

  /* ---------- gate ---------- */
  function enter(withSound) {
    TP.audio.unlock();
    TP.audio.setMuted(!withSound);
    const introSeen = TP.session.get('intro') === '1';
    TP.session.set('intro', '1');
    TP.audio.music('theme', 1.5);
    TP.audio.sfx('go');
    const g = TP.$('#gate');
    g.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.06)' }], { duration: 420, easing: 'ease-in', fill: 'forwards' }).onfinish = () => { g.hidden = true; };
    const target = hashView();
    if (target === 'home' && !TP.reduced && !introSeen) intro(); else route(true);
  }

  /* ---------- intro: countdown, a burst of brand shapes, the logo slams in. No game imagery. ---------- */
  let introStop = null;
  function intro() {
    const box = TP.$('#intro'), cv = TP.$('#introCanvas'), cnt = TP.$('#introCount'), title = TP.$('#introTitle');
    box.hidden = false;
    const g = cv.getContext('2d');
    let w, h, dpr;
    const size = () => { dpr = Math.min(2, devicePixelRatio || 1); w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener('resize', size);
    let P = [], t0 = 0, raf, done = false, phase = 0, burstAt = 0;
    const timers = [
      setTimeout(() => countNum('3'), 0), setTimeout(() => countNum('2'), 700), setTimeout(() => countNum('1'), 1400),
      setTimeout(burst, 2100),
      setTimeout(() => { phase = 2; title.hidden = false; TP.audio.sfx('star'); }, 3100),
      setTimeout(finish, 5000),
    ];
    function countNum(n) { cnt.innerHTML = `<span>${n}</span>`; TP.audio.sfx('countdown'); }
    function burst() {
      cnt.innerHTML = ''; TP.audio.sfx('go'); TP.audio.sfx('whoosh', .8);
      const n = Math.round(Math.min(200, Math.max(90, w * h / 7000)));
      P = TP.shapes.field(n, 1, 1).map((p, i) => {
        const a = Math.random() * 6.283, v = 8 + Math.random() * 22;
        return Object.assign(p, { x: w / 2, y: h / 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v, va: (Math.random() - .5) * .2, s: p.s * (w < 700 ? .9 : 1.2),
          ring: i / n * 6.283, rr: .3 + Math.random() * .7 });
      });
      phase = 1; burstAt = performance.now();
    }
    function draw(now) {
      if (done) return;
      raf = requestAnimationFrame(draw);
      g.fillStyle = '#0A0A12'; g.fillRect(0, 0, w, h);
      if (!P.length) return;
      const R = Math.max(w, h) * .55;
      for (const p of P) {
        if (phase === 2) {
          // settle into a slow orbit framing the logo
          const tx = w / 2 + Math.cos(p.ring + now / 4000) * R * p.rr, ty = h / 2 + Math.sin(p.ring + now / 4000) * R * p.rr * .62;
          p.vx += (tx - p.x) * .012; p.vy += (ty - p.y) * .012;
        }
        p.vx *= .93; p.vy *= .93; p.x += p.vx; p.y += p.vy; p.a += p.va; p.va *= .995;
        g.save(); g.translate(p.x, p.y); g.rotate(p.a); TP.shapes.draw(g, p.t, p.s, p.c, p.al); g.restore();
      }
    }
    raf = requestAnimationFrame(draw);
    function finish() {
      if (done) return; done = true;
      timers.forEach(clearTimeout); cancelAnimationFrame(raf); removeEventListener('resize', size);
      box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: 'ease-out', fill: 'forwards' }).onfinish = () => { box.remove(); };
      route(true);
    }
    introStop = finish;
    TP.$('#introSkip').onclick = finish;
  }

  /* ---------- routing ---------- */
  function hashView() {
    const h = (location.hash || '').replace('#', '');
    if (/404\.html$/.test(location.pathname)) return 'lost';
    if (!h || h === 'home') return 'home';
    if (/^play(-\d+)?$/.test(h)) return 'play';
    if (['levels', 'how', 'story', 'games'].includes(h)) return h;
    return 'lost';
  }
  function route(first) {
    const v = hashView();
    if (v === 'play') { const n = hashLevel(); show('levels', true); TP.game.open(TP.levels.unlocked(n) ? n : 1); return; }
    if (['how', 'story', 'games'].includes(v)) { show('home', true); requestAnimationFrame(() => scrollToId(v, true)); return; }
    show(v, true);
  }
  function hashLevel() { const m = /^#play-(\d+)$/.exec(location.hash || ''); return m ? +m[1] : 1; }
  const playHash = n => n > 1 ? 'play-' + n : 'play';
  function setHash(h) { try { history.replaceState(null, '', '#' + h); } catch (e) { location.hash = h; } }
  function show(v, instant) {
    if (!VIEWS.includes(v)) v = 'lost';
    TP.$$('.view').forEach(s => { s.hidden = s.dataset.view !== v; s.classList.remove('view-enter'); });
    const cur = TP.$('#view-' + v); if (!instant) { void cur.offsetWidth; cur.classList.add('view-enter'); }
    header().hidden = false; footer().hidden = false;
    view = v;
    TP.i18n.title(v === 'home' ? 'Toplay' : v === 'levels' ? 'Levels · Toplay' : 'Lost · Toplay');
    if (v === 'home') TP.home.start(); else TP.home.stop();
    if (v === 'levels') TP.levels.render();
    if (v === 'lost') TP.lost.start();
    TP.audio.music('theme');
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }
  function scrollToId(id, instant) {
    const el = document.getElementById(id); if (!el) return;
    const y = el.getBoundingClientRect().top + scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 80);
    window.scrollTo({ top: y, behavior: instant || TP.reduced ? 'auto' : 'smooth' });
  }

  /* wipe transition around a swap */
  async function wipe(fn, at) {
    const w = TP.$('#wipe');
    if (TP.reduced) { await fn(); return; }
    if (at) { w.style.setProperty('--wx', at.x + 'px'); w.style.setProperty('--wy', at.y + 'px'); }
    TP.audio.sfx('whoosh', .8);
    w.className = 'wipe in';
    await TP.wait(430);
    await fn();
    await TP.wait(60);
    w.className = 'wipe out';
    await TP.wait(500);
    w.className = 'wipe';
  }

  function go(target, ev, level) {
    const at = ev && ev.clientX ? { x: ev.clientX, y: ev.clientY } : null;
    closeMenu(true);
    if (target === 'play') {
      const btn = ev && ev.target && ev.target.closest && ev.target.closest('[data-level]');
      const n = level || (btn ? +btn.dataset.level : TP.levels.current());
      wipe(() => { setHash(playHash(n)); TP.game.open(n); }, at); return;
    }
    if (['how', 'story', 'games'].includes(target)) {
      if (view !== 'home' || TP.game.isOpen()) wipe(() => { TP.game.close(true); setHash(target); show('home', true); requestAnimationFrame(() => scrollToId(target, true)); }, at);
      else { setHash(target); scrollToId(target); }
      return;
    }
    if (target === view && !TP.game.isOpen()) { window.scrollTo({ top: 0, behavior: TP.reduced ? 'auto' : 'smooth' }); return; }
    wipe(() => { TP.game.close(true); setHash(target); show(target); }, at);
  }

  /* ---------- menu ---------- */
  let lastFocus = null;
  function openMenu() {
    const m = TP.$('#menu'); lastFocus = document.activeElement;
    m.hidden = false; requestAnimationFrame(() => m.classList.add('open'));
    TP.$('#menuOpen').setAttribute('aria-expanded', 'true');
    document.body.classList.add('no-scroll');
    TP.audio.sfx('whoosh');
    setTimeout(() => TP.$('#menuClose').focus(), 60);
  }
  function closeMenu(silent) {
    const m = TP.$('#menu'); if (m.hidden) return;
    m.classList.remove('open'); TP.$('#menuOpen').setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
    setTimeout(() => { if (!m.classList.contains('open')) m.hidden = true; }, 540);
    if (!silent && lastFocus) lastFocus.focus();
  }

  function init() {
    TP.$('#enterSound').addEventListener('click', () => enter(true));
    TP.$('#enterQuiet').addEventListener('click', () => enter(false));
    TP.$('#menuOpen').addEventListener('click', openMenu);
    TP.$('#menuClose').addEventListener('click', () => closeMenu());
    document.addEventListener('click', e => {
      const g = e.target.closest('[data-go]');
      if (g) { e.preventDefault(); go(g.dataset.go, e); return; }
      const a = e.target.closest('a[href="#home"]');
      if (a) { e.preventDefault(); go('home', e); }
    });
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && !TP.$('#menu').hidden) { closeMenu(); return; }
      if (e.target.closest && e.target.closest('input, textarea')) return;
      if ((e.key === 'm' || e.key === 'M') && !e.metaKey && !e.ctrlKey) TP.audio.setMuted(!TP.audio.muted);
    });
    addEventListener('hashchange', () => { if (!TP.game.isOpen() || hashView() !== 'play') { if (TP.game.isOpen() && hashView() !== 'play') TP.game.close(true); route(); } });
    boot().catch(err => console.error(err));
  }

  return { init, go, show, scrollToId, wipe, setHash, get view() { return view; } };
})();

/* Home (depth-parallax lens hero), level select, playable 404. */
TP.home = (() => {
  // Hero warm-up: a field of brand shapes with 3 hidden "play buttons" (Toplay's "o"). No game imagery, nothing to spoil.
  let scene = null, cv, g, W = 0, H = 0, dpr = 1, raf = 0, running = false, visible = true, shapes = [], targets = [], found = 0, done = false;
  const mouse = { x: -999, y: -999 };
  const t0 = performance.now();

  function zone(w, h) {
    // keep the three targets away from the headline and buttons
    return w < 760 ? { x0: .08, x1: .92, y0: .14, y1: .44 } : { x0: .54, x1: .95, y0: .16, y1: .8 };
  }
  function build() {
    const r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    W = r.width; H = r.height; dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(220, Math.max(70, W * H / 8500)));
    shapes = TP.shapes.field(n, W, H);
    const z = zone(W, H), tsize = W < 760 ? 30 : 30;
    targets = [];
    let guard = 0;
    while (targets.length < 3 && guard++ < 500) {
      const x = W * (z.x0 + Math.random() * (z.x1 - z.x0)), y = H * (z.y0 + Math.random() * (z.y1 - z.y0));
      if (targets.every(t => Math.hypot(t.bx - x, t.by - y) > Math.min(W, H) * .22)) targets.push({ t: 'play', x, y, bx: x, by: y, vx: 0, vy: 0, s: tsize, a: (Math.random() - .5) * .6, va: 0, ph: Math.random() * 6.28, sp: .5, al: 1, found: false, pop: 0 });
    }
    // clear the space right around each target so it stays fair
    shapes = shapes.filter(p => targets.every(t => Math.hypot(p.bx - t.bx, p.by - t.by) > 30));
    // decoys that look almost the same: only the shape inside differs
    const kinds = ['stop', 'pause', 'rew', 'dotin'], nd = W < 760 ? 9 : 16;
    for (let i = 0; i < nd; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      if (targets.some(t => Math.hypot(t.bx - x, t.by - y) < 50)) { i--; continue; }
      shapes.push({ t: kinds[i % 4], c: '', x, y, bx: x, by: y, vx: 0, vy: 0, s: tsize, a: (Math.random() - .5) * 1.2, va: 0, ph: Math.random() * 6.28, sp: .5, al: 1 });
    }
    found = 0; done = false; ui();
  }
  function rescale() {
    // keep progress: scale everything to the new size instead of rebuilding
    const r = cv.getBoundingClientRect(); if (!r.width) return;
    if (!W || !H) { build(); return; }
    const kx = r.width / W, ky = r.height / H;
    if (Math.abs(kx - 1) < .01 && Math.abs(ky - 1) < .01) return;
    shapes.concat(targets).forEach(p => { p.bx *= kx; p.by *= ky; p.x *= kx; p.y *= ky; });
    W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function ui() {
    const b = TP.$('#heroWarm'); if (!b) return;
    if (done) { b.className = 'badge badge-zest warm'; b.innerHTML = 'Warm-up done · You are ready!'; }
    else b.innerHTML = `Warm-up · Find 3 hidden <svg class="warm-o" viewBox="0 0 512 512" aria-hidden="true"><use href="#mark" width="512" height="512"/></svg> <b>${found} / 3</b>`;
  }
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const t = (now - t0) / 1000;
    g.clearRect(0, 0, W, H);
    const all = shapes.concat(targets);
    for (const p of all) {
      const hx = p.bx + Math.sin(t * p.sp + p.ph) * 6, hy = p.by + Math.cos(t * p.sp * .8 + p.ph) * 6;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      let fx = (hx - p.x) * .06, fy = (hy - p.y) * .06;
      if (d < 130 && d > .1 && !TP.reduced) { const k = (1 - d / 130) * 2.6; fx += dx / d * k; fy += dy / d * k; }
      p.vx = (p.vx + fx) * .82; p.vy = (p.vy + fy) * .82; p.x += p.vx; p.y += p.vy; p.a += p.va;
      g.save(); g.translate(p.x, p.y); g.rotate(p.a);
      if (p.t === 'play') {
        const sc = p.found ? 1 + Math.min(1, p.pop) * .5 : 1;
        if (p.found) { p.pop += .06; g.beginPath(); g.arc(0, 0, p.s * .62 * sc, 0, 6.283); g.lineWidth = 4; g.strokeStyle = TP.shapes.C.zest; g.stroke(); }
        g.scale(sc, sc); TP.shapes.draw(g, 'play', p.s, '', 1);
      } else TP.shapes.draw(g, p.t, p.s, p.c, p.al);
      g.restore();
    }
  }
  function hit(e) {
    if (done) return;
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const pad = e.pointerType === 'mouse' ? 6 : 16;
    const tg = targets.find(t => !t.found && Math.hypot(t.x - x, t.y - y) < t.s * .55 + pad);
    if (!tg) return;
    tg.found = true; found++;
    TP.audio.sfx('found'); TP.cursor.sparks(e.clientX, e.clientY, 12, 1.4); TP.buzz(15);
    if (found === 3) {
      done = true;
      setTimeout(() => { TP.audio.sfx('star'); const b = TP.$('#heroPlay'); b && b.classList.add('nudge'); }, 250);
    }
    ui();
  }
  function prepare() {
    cv = TP.$('#heroCanvas'); g = cv.getContext('2d');
    const hero = TP.$('#hero');
    let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(rescale, 120); }).observe(cv);
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(hero);
    hero.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
    cv.addEventListener('pointerdown', hit);
    // the room in 3D depth behind the shapes: no lens, no names
    const dcv = TP.$('#heroDepth');
    TP.levelsData.loadIndex().then(idx => TP.levelsData.loadVariant(1, idx.levels[0].variants[0].id)).then(v => {
      scene = TP.depth.create(dcv, { img: v.img, depth: v.depth, dim: .5, zoom: 1.08, strength: .04 });
      if (!scene) return;
      TP.depth.live.add(scene); dcv.classList.add('on');
      if (running) scene.start();
    }).catch(() => {});
    hero.addEventListener('pointermove', e => { if (!scene) return; const r = hero.getBoundingClientRect(); scene.look((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1); }, { passive: true });
    const clock = TP.$('#artClock'); const c0 = performance.now();
    setInterval(() => { const s = ((performance.now() - c0) / 1000) % 10; clock.textContent = TP.fmt(600 - s * 60); }, 250);
    const dots = TP.$('#artDots');
    if (dots && !dots.children.length) for (let i = 0; i < 26; i++) { const d = document.createElement('i'); d.style.left = (6 + Math.random() * 88) + '%'; d.style.top = (10 + Math.random() * 78) + '%'; d.style.transform = `rotate(${Math.random() * 90}deg)`; dots.appendChild(d); }
    stats();
  }
  function stats() {
    if (TP.levels && TP.levels.syncLabels) TP.levels.syncLabels();
    const L = TP.store.level(1), el = TP.$('#homeStats');
    el.innerHTML = '<span class="badge">20 words</span><span class="badge">10:00</span>' + (L.best ? `<span class="badge badge-zest">Best ${L.best} · ${'★'.repeat(L.stars)}</span>` : '');
  }
  function start() { stats(); if (running) return; running = true; scene && scene.start(); requestAnimationFrame(() => { if (!shapes.length || !W) build(); raf = requestAnimationFrame(frame); }); }
  function stop() { running = false; cancelAnimationFrame(raf); scene && scene.stop(); }
  return { prepare, start, stop, stats, get targets() { return targets.map(t => ({ x: t.x, y: t.y, found: t.found })); } };
})();

TP.levels = (() => {
  // the number of rooms is simply the rooms that exist in levels.json
  const total = () => built().length || 1;
  const built = () => (TP.levelsData.index ? TP.levelsData.index.levels : []);
  const info = n => built().find(l => l.level === n);
  /** a built room opens when the room before it was won, in the current language */
  function unlocked(n) { return !!info(n) && (n === 1 || TP.store.level(n - 1).wins > 0); }
  function render() {
    const grid = TP.$('#levelGrid');
    let html = '', open = 0, stars = 0;
    const TOTAL = total();
    for (let i = 1; i <= TOTAL; i++) {
      const L = info(i), S = TP.store.level(i);
      stars += S.stars;
      if (L && unlocked(i)) {
        open++;
        const done = S.wins > 0;
        html += `<button class="level" type="button" data-go="play" data-level="${i}" data-cursor="PLAY" aria-label="Room ${i}: ${L.title}${done ? `, best ${S.best}, ${S.stars} stars` : ''}">
          <div class="level-art"><img src="assets/levels/${i}-cover.webp" alt="" width="640" height="357"><span class="mystery-q" aria-hidden="true">?</span><span class="badge badge-blaze">Lv ${i}</span></div>
          <div class="level-body"><span class="level-title">${L.title}</span><span class="level-meta">20 words · 10 min</span>
          ${done ? `<span class="level-stars">${'★'.repeat(S.stars)}${'☆'.repeat(3 - S.stars)} Best ${S.best}</span>` : '<span class="level-stars">Ready to play</span>'}</div></button>`;
      } else if (L) {
        html += `<div class="level locked" data-cursor="LOCKED" aria-label="Room ${i}: locked">
          <div class="level-art"><img class="locked-art" src="assets/levels/${i}-cover.webp" alt="" width="640" height="357">${TP.icon('lock')}<span class="badge">Lv ${i}</span></div>
          <div class="level-body"><span class="level-title">${L.title}</span><span class="level-meta">Win room ${i - 1} to open it.</span></div></div>`;
      }
    }
    // one card keeps the door open for future rooms
    html += `<div class="level locked level-soon" data-cursor="SOON" aria-label="More rooms: coming soon">
      <div class="level-art">${TP.icon('lock')}<span class="stamp">Coming soon</span></div>
      <div class="level-body"><span class="level-title">More rooms</span><span class="level-meta">This room is still being cluttered.</span></div></div>`;
    grid.innerHTML = html;
    TP.$('#levelsStars').textContent = `★ ${stars} / ${TOTAL * 3}`;
    TP.$('#levelsUnlocked').textContent = `${open} / ${TOTAL} rooms unlocked`;
    const bar = TP.$('#levelsProgressBar'); bar.setAttribute('aria-label', `${open} of ${TOTAL} rooms unlocked`); bar.querySelector('i').style.width = (open / TOTAL * 100) + '%';
    const more = TP.$('#levelsMore'); if (more) more.textContent = 'More rooms are on their way. Come back soon!';
  }
  /** the room a player is up to: the first open room not yet won, else the last open room */
  function current() {
    let last = 1;
    for (let i = 1; i <= total(); i++) { if (!unlocked(i)) break; last = i; if (!TP.store.level(i).wins) return i; }
    return last;
  }
  /** labels that follow progress: the menu's "Lv n" and the arcade line */
  function syncLabels() {
    const lv = TP.$('#menuLv'); if (lv) lv.textContent = 'Lv ' + current();
    const n = built().length, g = TP.$('#gamesOpen');
    if (g && n) g.textContent = n === 1 ? 'One room is open today. More games and rooms are being built right now.' : `${n} rooms are open today. More games and rooms are being built right now.`;
  }
  return { render, unlocked, info, current, syncLabels, total };
})();

TP.lost = (() => {
  let inited = false;
  function start() {
    const room = TP.$('#lostRoom'), btn = TP.$('#lost404'), junk = TP.$('#lostJunk'), msg = TP.$('#lostFound');
    msg.hidden = true;
    const glyphs = ['?', '%', '#', '&', '★', '@', '{ }', '~', '*', '+', '0', '4', '40', '04', '<>'];
    junk.innerHTML = '';
    for (let i = 0; i < 34; i++) { const s = document.createElement('span'); s.className = 'junk'; s.textContent = glyphs[i % glyphs.length]; s.style.left = (3 + Math.random() * 90) + '%'; s.style.top = (5 + Math.random() * 85) + '%'; s.style.transform = `rotate(${(Math.random() - .5) * 60}deg)`; junk.appendChild(s); }
    btn.style.left = (12 + Math.random() * 70) + '%'; btn.style.top = (15 + Math.random() * 60) + '%';
    room.style.setProperty('--lx', '50%'); room.style.setProperty('--ly', '50%');
    if (inited) return; inited = true;
    const move = e => { const r = room.getBoundingClientRect(); room.style.setProperty('--lx', (e.clientX - r.left) + 'px'); room.style.setProperty('--ly', (e.clientY - r.top) + 'px'); };
    room.addEventListener('pointermove', move); room.addEventListener('pointerdown', move);
    btn.addEventListener('click', e => { TP.audio.sfx('found'); TP.cursor.sparks(e.clientX, e.clientY, 12, 1.5); setTimeout(() => { msg.hidden = false; TP.audio.sfx('win', .7); }, 350); });
  }
  return { start };
})();

document.addEventListener('tp:lang', () => {
  TP.home.stats();
  if (TP.shell && TP.shell.view === 'levels') TP.levels.render();
});

/* Find It! — the game. */
TP.hit = {
  inPoly(x, y, pts) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  },
  distToPoly(x, y, pts) {
    let best = Infinity;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [ax, ay] = pts[j], [bx, by] = pts[i];
      const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L));
      best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
    }
    return best;
  },
  /** objects: level objects; found: Set of ids; (ix, iy) image px; W,H image size; pad image px. Returns {obj, region} | {foundAlready:true} | null */
  test(objects, found, ix, iy, W, H, pad) {
    let best = null, onFound = null;
    for (const o of objects) {
      for (const r of o.regions) {
        const pts = r.polygon.map(([u, v]) => [u * W, v * H]);
        const inside = this.inPoly(ix, iy, pts) || this.distToPoly(ix, iy, pts) <= pad;
        if (!inside) continue;
        if (found.has(o.id)) { if (!onFound || r.area < onFound.region.area) onFound = { foundAlready: true, obj: o, region: r }; continue; }
        if (!best || r.area < best.region.area) best = { obj: o, region: r };
      }
    }
    if (best) return best;
    return onFound;
  },
};

TP.game = (() => {
  const S = {};
  let open_ = false, lvl, W, H, raf = 0, last = 0, variantId = null, cur = null, briefScene = null, briefCv = null;
  const el = {};
  const FOUND_LINES = ['Found it!', 'Nice!', 'Got it!', 'Sharp eyes!', 'Spotted!'];
  const view = { s: 1, tx: 0, ty: 0, min: 1, max: 4, sw: 0, sh: 0 };

  function q() {
    ['game', 'gStage', 'gScene', 'gImg', 'gMarks', 'gTime', 'gTimeBar', 'gTimer', 'gMissDots', 'gFoundChip', 'gHelp', 'gHelpCap', 'gWordList', 'gLeft', 'gWords', 'gGrab', 'gOverlay', 'gToasts', 'gCtlHint', 'gConfetti', 'gFull', 'gPause', 'gZoomIn', 'gZoomOut']
      .forEach(id => el[id] = document.getElementById(id));
  }

  /* ---------- open / close ---------- */
  let openSeq = 0;
  async function open(levelNo = 1, keepVariant) {
    if (!el.game) q();
    const seq = ++openSeq;
    el.game.hidden = false; open_ = true;
    document.body.classList.add('no-scroll');
    TP.home.stop(); stopLoop(); S.running = false; clearConfetti(); stopBriefDepth(true);
    el.gScene.style.visibility = 'hidden'; el.gMarks.innerHTML = ''; el.gToasts.innerHTML = '';
    overlay(`<div class="panel" role="status"><span class="badge">Room ${levelNo}</span><h2>Opening the room…</h2><p>Hiding 20 things in the mess.</p></div>`);
    let v;
    try { v = await TP.levelsData.loadVariant(levelNo, keepVariant); }
    catch (e) {
      if (seq !== openSeq || !open_) return;
      const o = overlay(`<div class="panel" role="alert"><h2>The room didn't load.</h2><p>Check your connection and try again.</p><div class="actions"><button class="btn" type="button" data-a="retry">${TP.icon('replay')}Retry</button><button class="btn btn-ghost" type="button" data-a="levels">Levels</button></div></div>`);
      o.querySelector('[data-a="retry"]').onclick = () => open(levelNo, keepVariant);
      o.querySelector('[data-a="levels"]').onclick = e2 => TP.shell.go('levels', e2);
      return;
    }
    if (seq !== openSeq || !open_) return;
    cur = v; variantId = v.id; lvl = v.data; W = lvl.image.width; H = lvl.image.height;
    el.gScene.style.width = W + 'px'; el.gScene.style.height = H + 'px';
    if (el.gImg.getAttribute('src') !== v.src) el.gImg.src = v.src;
    TP.$('#gRoomNo').textContent = 'Room ' + lvl.level;
    TP.$('#gRoomName').textContent = lvl.title;
    el.gStage.setAttribute('aria-label', lvl.title + '. Tap hidden objects.');
    el.gScene.style.visibility = '';
    reset();
    layout(true);
    briefing();
  }
  function close(silent) {
    if (!open_) return;
    stopLoop(); S.running = false; open_ = false; stopBriefDepth(true); TP.speech.stop();
    el.game.hidden = true; el.gOverlay.innerHTML = ''; clearConfetti();
    document.body.classList.remove('no-scroll');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    TP.audio.duck(false); TP.audio.music('theme');
    if (TP.shell.view === 'home') TP.home.start();
    if (TP.shell.view === 'levels') TP.levels.render();
  }

  function reset() {
    Object.assign(S, { found: new Set(), misses: 0, sinceP: 0, helps: 0, timeLeft: lvl.timeLimit, cooldown: 0, running: false, ended: false, warned60: false, lastTickSec: null, hintTimer: null, pendingMiss: null, lastTap: 0 });
    el.gMarks.innerHTML = ''; el.gToasts.innerHTML = ''; el.gOverlay.innerHTML = '';
    el.gScene.classList.remove('dim');
    el.gWords.classList.remove('open'); el.gGrab.setAttribute('aria-expanded', 'false');
    S.revealed = false;
    renderWords();
    el.gCtlHint.style.opacity = 1;
    hud();
  }

  /** the word list in the current language (German sorted by noun, article in colour); keeps found/missed state */
  function renderWords() {
    const L = TP.i18n.lang;
    const words = lvl.objects.slice().sort((a, b) => TP.i18n.wordKey(a).localeCompare(TP.i18n.wordKey(b), L));
    el.gWordList.innerHTML = words.map(o => {
      const f = S.found && S.found.has(o.id), m = !f && S.revealed;
      const listen = (L === 'de' ? 'Anhören: ' : 'Listen: ') + TP.speech.text(o, L);
      return `<li class="word${f ? ' found' : ''}${m ? ' missed' : ''}" data-id="${o.id}" translate="no" role="button" tabindex="0" aria-label="${TP.esc(listen)}">${TP.icon('check')}<span>${TP.i18n.wordHTML(o)}</span>${TP.icon('sound-on', 'icon say-ic')}</li>`;
    }).join('');
    TP.$$('.word', el.gWordList).forEach(li => { li.querySelector('.icon').style.display = li.classList.contains('found') ? '' : 'none'; });
  }
  // a word in the list says itself when tapped
  function sayFromList(e) {
    const li = e.target.closest('.word'); if (!li || !lvl) return;
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    const o = lvl.objects.find(x => x.id === li.dataset.id); if (!o) return;
    if (TP.speech.say(o, { force: true }) === 'novoice') noVoice();
    flashWord(o.id);
  }
  document.addEventListener('tp:lang', () => {
    if (!lvl) return;
    renderWords();
    TP.$$('.mark-reveal[data-id]', el.gMarks).forEach(m => { const o = lvl.objects.find(x => x.id === m.dataset.id); if (o) m.innerHTML = `<span>${TP.i18n.wordHTML(o)}</span>`; });
  });

  /* ---------- layout & view transform ---------- */
  function layout(resetView) {
    const r = el.gStage.getBoundingClientRect();
    view.sw = r.width; view.sh = r.height;
    const contain = Math.min(view.sw / W, view.sh / H);
    const fillH = view.sh / H;
    const portrait = view.sw / view.sh < 1.25;
    view.min = portrait ? fillH : contain;
    view.max = Math.max(view.min * 4, contain * 4);
    if (resetView || view.s < view.min) { view.s = view.min; view.tx = (view.sw - W * view.s) / 2; view.ty = (view.sh - H * view.s) / 2; }
    clamp(); apply();
  }
  function clamp() {
    const w = W * view.s, h = H * view.s;
    view.tx = w <= view.sw ? (view.sw - w) / 2 : Math.min(0, Math.max(view.sw - w, view.tx));
    view.ty = h <= view.sh ? (view.sh - h) / 2 : Math.min(0, Math.max(view.sh - h, view.ty));
  }
  function apply() {
    el.gScene.style.transform = `translate3d(${view.tx}px, ${view.ty}px, 0) scale(${view.s})`;
    el.gScene.style.setProperty('--inv', (1 / view.s).toFixed(4));
    el.gZoomOut.disabled = view.s <= view.min * 1.001;
    el.gZoomIn.disabled = view.s >= view.max * .999;
  }
  function zoomAt(f, cx, cy, animate) {
    const ns = Math.max(view.min, Math.min(view.max, view.s * f));
    const k = ns / view.s;
    const to = { s: ns, tx: cx - (cx - view.tx) * k, ty: cy - (cy - view.ty) * k };
    animate ? tween(to) : (Object.assign(view, to), clamp(), apply());
  }
  let tw = 0;
  function tween(to, ms = 320) {
    const from = { s: view.s, tx: view.tx, ty: view.ty }, t0 = performance.now(); cancelAnimationFrame(tw);
    const step = now => {
      const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      view.s = from.s + (to.s - from.s) * e; view.tx = from.tx + (to.tx - from.tx) * e; view.ty = from.ty + (to.ty - from.ty) * e;
      clamp(); apply(); if (k < 1) tw = requestAnimationFrame(step);
    };
    tw = requestAnimationFrame(step);
  }
  function centerOn(u, v, minScale) {
    const s = Math.max(view.s, minScale || view.s);
    const tx = view.sw / 2 - u * W * s, ty = view.sh / 2 - v * H * s;
    tween({ s, tx, ty }, 420);
  }
  function isVisible(u, v, margin = 50) {
    const x = view.tx + u * W * view.s, y = view.ty + v * H * view.s;
    return x > margin && y > margin && x < view.sw - margin && y < view.sh - margin;
  }

  /* ---------- input ---------- */
  const ptrs = new Map();
  let gesture = null;
  function bindInput() {
    const st = el.gStage;
    st.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      st.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), type: e.pointerType });
      if (ptrs.size === 1) gesture = { kind: 'pan', moved: false, tx: view.tx, ty: view.ty, multi: false };
      else if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        gesture = { kind: 'pinch', moved: true, multi: true, d: Math.hypot(a.x - b.x, a.y - b.y), s: view.s, tx: view.tx, ty: view.ty, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      }
    });
    st.addEventListener('pointermove', e => {
      const p = ptrs.get(e.pointerId); if (!p || !gesture) return;
      p.x = e.clientX; p.y = e.clientY;
      const r = st.getBoundingClientRect();
      if (gesture.kind === 'pinch' && ptrs.size >= 2) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const ns = Math.max(view.min, Math.min(view.max, gesture.s * d / gesture.d)), k = ns / gesture.s;
        const cx = gesture.mx - r.left, cy = gesture.my - r.top;
        view.s = ns; view.tx = cx - (cx - gesture.tx) * k + (mx - gesture.mx); view.ty = cy - (cy - gesture.ty) * k + (my - gesture.my);
        clamp(); apply();
      } else if (gesture.kind === 'pan') {
        const dx = p.x - p.sx, dy = p.y - p.sy;
        if (!gesture.moved && Math.hypot(dx, dy) > 8) gesture.moved = true;
        if (gesture.moved) { view.tx = gesture.tx + dx; view.ty = gesture.ty + dy; clamp(); apply(); hideCtlHint(); }
      }
    });
    const end = e => {
      const p = ptrs.get(e.pointerId); if (!p) return;
      ptrs.delete(e.pointerId);
      if (gesture && gesture.kind === 'pinch') { if (ptrs.size === 0) gesture = null; else { const q2 = [...ptrs.values()][0]; q2.sx = q2.x; q2.sy = q2.y; gesture = { kind: 'pan', moved: true, multi: true, tx: view.tx, ty: view.ty }; } hideCtlHint(); return; }
      if (gesture && !gesture.moved && !gesture.multi && e.type === 'pointerup' && performance.now() - p.t < 650) tap(e.clientX, e.clientY, p.type);
      if (ptrs.size === 0) gesture = null;
    };
    st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
    st.addEventListener('wheel', e => {
      e.preventDefault();
      const r = st.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0018)), e.clientX - r.left, e.clientY - r.top);
      hideCtlHint();
    }, { passive: false });
    el.gZoomIn.onclick = () => { zoomAt(1.6, view.sw / 2, view.sh / 2, true); hideCtlHint(); };
    el.gZoomOut.onclick = () => { zoomAt(1 / 1.6, view.sw / 2, view.sh / 2, true); };
    el.gHelp.onclick = help;
    el.gPause.onclick = () => S.ended ? null : pause();
    el.gFull.onclick = fullscreen;
    el.gGrab.onclick = () => { const o = el.gWords.classList.toggle('open'); el.gGrab.setAttribute('aria-expanded', String(o)); el.gGrab.setAttribute('aria-label', o ? 'Show fewer words' : 'Show all words'); };
    new ResizeObserver(() => { if (open_) layout(false); }).observe(el.gStage);
    document.addEventListener('fullscreenchange', () => { el.gFull.innerHTML = TP.icon(document.fullscreenElement ? 'shrink' : 'expand'); el.gFull.setAttribute('aria-label', document.fullscreenElement ? 'Exit full screen (F)' : 'Full screen (F)'); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && open_ && S.running) pause(); });
    addEventListener('keydown', e => {
      if (!open_ || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === 'Escape' || k === 'p' || k === 'P') { e.preventDefault(); if (S.running) pause(); else if (S.paused) resume(); return; }
      if (!S.running) return;
      if (k === 'h' || k === 'H') help();
      else if (k === 'f' || k === 'F') fullscreen();
      else if (k === '+' || k === '=') zoomAt(1.6, view.sw / 2, view.sh / 2, true);
      else if (k === '-' || k === '_') zoomAt(1 / 1.6, view.sw / 2, view.sh / 2, true);
      else if (k === '0') tween({ s: view.min, tx: (view.sw - W * view.min) / 2, ty: (view.sh - H * view.min) / 2 });
    });
  }
  function hideCtlHint() { el.gCtlHint.style.opacity = 0; }

  /* ---------- core loop ---------- */
  function startLoop() { last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
  function stopLoop() { cancelAnimationFrame(raf); }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(.25, (now - last) / 1000); last = now;
    if (!S.running) return;
    S.timeLeft -= dt;
    if (S.cooldown > 0) S.cooldown = Math.max(0, S.cooldown - dt);
    const sec = Math.ceil(S.timeLeft);
    if (S.timeLeft <= 60 && !S.warned60) { S.warned60 = true; toast('1 minute left!', 'penalty', 1800); }
    if (sec <= 10 && sec > 0 && sec !== S.lastTickSec) { S.lastTickSec = sec; TP.audio.sfx('tick'); }
    if (S.timeLeft <= 0) { S.timeLeft = 0; hud(); lose(); return; }
    hud();
  }
  function hud() {
    el.gTime.textContent = TP.fmt(S.timeLeft);
    el.gTimer.setAttribute('aria-label', TP.fmt(S.timeLeft) + ' left');
    el.gTimeBar.style.width = Math.max(0, S.timeLeft / lvl.timeLimit * 100) + '%';
    el.gTimer.classList.toggle('low', S.timeLeft <= 60);
    TP.$$('i', el.gMissDots).forEach((d, i) => d.classList.toggle('on', i < S.sinceP));
    el.gMissDots.setAttribute('aria-label', `${S.sinceP} of 5 misses before a penalty`);
    const left = lvl.objects.length - S.found.size;
    el.gFoundChip.textContent = `${S.found.size} / ${lvl.objects.length}`;
    el.gLeft.textContent = `${left} left`;
    const cooling = S.cooldown > 0;
    el.gHelp.disabled = cooling || !S.running;
    if (cooling) {
      const sec = Math.ceil(S.cooldown);
      if (!el.gHelp.querySelector('.help-ring')) el.gHelp.innerHTML = '<span class="help-ring"></span><span class="help-sec"></span>';
      el.gHelp.querySelector('.help-ring').style.setProperty('--p', ((lvl.helpCooldown - S.cooldown) / lvl.helpCooldown * 100) + '%');
      el.gHelp.querySelector('.help-sec').textContent = sec;
      el.gHelpCap.textContent = `Help in ${sec}s`;
      el.gHelp.setAttribute('aria-label', `Help ready in ${sec} seconds`);
    } else if (el.gHelp.querySelector('.help-ring') || el.gHelpCap.textContent !== 'Help') {
      el.gHelp.innerHTML = TP.icon('help'); el.gHelpCap.textContent = 'Help';
      el.gHelp.setAttribute('aria-label', 'Help: show one hidden object (H)');
    }
  }

  /* ---------- taps ---------- */
  function tap(cx, cy, type) {
    const r = el.gStage.getBoundingClientRect();
    const x = cx - r.left, y = cy - r.top;
    const ix = (x - view.tx) / view.s, iy = (y - view.ty) / view.s;
    if (ix < 0 || iy < 0 || ix > W || iy > H) return;
    const padPx = type === 'mouse' ? 4 : 12;
    // after "Show what was hiding": every object says its word when tapped
    if (!S.running && S.ended && S.revealed) {
      const any = TP.hit.test(lvl.objects, new Set(), ix, iy, W, H, padPx / view.s);
      if (any && any.obj) sayAgain(any.obj, any.region);
      return;
    }
    if (!S.running) return;
    const res = TP.hit.test(lvl.objects, S.found, ix, iy, W, H, padPx / view.s);
    const now = performance.now();
    const isDouble = type !== 'mouse' && now - S.lastTap < 300;
    S.lastTap = now;
    if (res && res.obj) { if (S.pendingMiss) { clearTimeout(S.pendingMiss.t); S.pendingMiss = null; } found(res.obj, res.region, ix, iy); return; }
    if (res && res.foundAlready) { if (S.pendingMiss) { clearTimeout(S.pendingMiss.t); S.pendingMiss = null; } sayAgain(res.obj, res.region); return; }
    if (isDouble && S.pendingMiss) { clearTimeout(S.pendingMiss.t); S.pendingMiss = null; zoomAt(2, x, y, true); return; }
    if (type === 'mouse') { miss(ix, iy); return; }
    // touch: wait briefly so a double-tap can zoom instead of counting as a miss
    if (S.pendingMiss) clearTimeout(S.pendingMiss.t);
    S.pendingMiss = { t: setTimeout(() => { S.pendingMiss = null; if (S.running) miss(ix, iy); }, 280) };
  }

  /** the first find on this device: show that words can be heard again */
  function sayTip(o) {
    const st = TP.store.load(); if (st.seenSayTip) return;
    TP.store.set('seenSayTip', true);
    setTimeout(() => { if (open_ && S.running) toast('Tap it again, or tap its word, to hear it.', 'say', 3200); }, 900);
  }
  let warnedNoVoice = false;
  function noVoice() {
    if (warnedNoVoice) return; warnedNoVoice = true;
    toast(TP.i18n.lang === 'de' ? 'No German voice on this device.' : 'No English voice on this device.', 'info', 3000);
  }
  /** a found object tapped again: say its word, no penalty */
  function sayAgain(o, region) {
    if (TP.speech.say(o, { force: true }) === 'novoice') noVoice();
    const [u, v] = region.hint;
    const m = mark('mark-say', u, v, `<span>${TP.i18n.wordHTML(o)}</span>`, 1200); m.setAttribute('translate', 'no');
    flashWord(o.id);
  }
  function flashWord(id) {
    const li = el.gWordList.querySelector(`[data-id="${id}"]`); if (!li) return;
    li.classList.remove('speaking'); void li.offsetWidth; li.classList.add('speaking');
    setTimeout(() => li.classList.remove('speaking'), 900);
  }

  function mark(cls, u, v, html = '', life = 0) {
    const m = document.createElement('div');
    m.className = 'mark ' + cls; m.style.left = (u * 100) + '%'; m.style.top = (v * 100) + '%'; m.innerHTML = html;
    el.gMarks.appendChild(m);
    if (life) setTimeout(() => m.remove(), life);
    return m;
  }

  function found(o, region, ix, iy) {
    S.found.add(o.id);
    const [hu, hv] = region.hint;
    mark('mark-found', hu, hv);
    const fw = mark('float-word', hu, hv, TP.i18n.wordHTML(o), 1400); fw.classList.remove('mark'); fw.setAttribute('translate', 'no');
    if (S.hintFor === o.id) clearHint();
    const li = el.gWordList.querySelector(`[data-id="${o.id}"]`);
    if (li) { li.classList.add('found', 'pop'); li.querySelector('.icon').style.display = ''; setTimeout(() => li.classList.remove('pop'), 650); }
    TP.audio.sfx('found'); TP.buzz(15);
    // say it inside the tap itself: phones only allow speech that starts from a tap
    if (TP.speech.say(o) === 'novoice') noVoice(); else sayTip(o);
    flashWord(o.id);
    const r = el.gStage.getBoundingClientRect();
    TP.cursor.sparks(r.left + view.tx + hu * W * view.s, r.top + view.ty + hv * H * view.s, 10, 1.2);
    const left = lvl.objects.length - S.found.size;
    if (left === 0) { hud(); win(); return; }
    toast(left === 2 ? 'Almost there!' : left === 1 ? 'Last one!' : FOUND_LINES[Math.floor(Math.random() * FOUND_LINES.length)], 'found');
    hud();
  }

  function miss(ix, iy) {
    S.misses++; S.sinceP++;
    mark('mark-miss', ix / W, iy / H, '', 720);
    TP.audio.sfx('miss', .8); TP.buzz(30);
    const st = TP.store.load();
    if (!st.seenMissTip) { TP.store.set('seenMissTip', true); toast('Nothing here. Every 5 misses cost 10 seconds.', 'info', 2600); }
    if (S.sinceP >= lvl.missesPerPenalty) {
      S.sinceP = 0; S.timeLeft = Math.max(0, S.timeLeft - lvl.penaltySeconds);
      TP.audio.sfx('penalty'); toast('−10s · Too many misses!', 'penalty', 1800);
      el.gTimer.classList.remove('hit'); void el.gTimer.offsetWidth; el.gTimer.classList.add('hit');
      TP.buzz([40, 40, 40]);
    }
    hud();
  }

  /* ---------- help ---------- */
  function help() {
    if (!S.running || S.cooldown > 0) return;
    const rem = lvl.objects.filter(o => !S.found.has(o.id));
    if (!rem.length) return;
    const o = rem[Math.floor(Math.random() * rem.length)];
    const [u, v] = o.regions[0].hint;
    clearHint();
    S.hintFor = o.id;
    S.hintEl = mark('mark-hint', u, v);
    S.hintTimer = setTimeout(clearHint, 6000);
    S.helps++; S.cooldown = lvl.helpCooldown;
    TP.audio.sfx('hint'); toast('Look here!', 'hint', 1400);
    if (!isVisible(u, v)) centerOn(u, v);
    hud();
  }
  function clearHint() { if (S.hintEl) S.hintEl.remove(); S.hintEl = null; S.hintFor = null; clearTimeout(S.hintTimer); }

  /* ---------- toasts ---------- */
  function toast(text, tone = 'info', ms = 1300) {
    hideCtlHint();
    const t = document.createElement('div'); t.className = 'toast toast-' + tone; t.textContent = text;
    el.gToasts.appendChild(t);
    while (el.gToasts.children.length > 2) el.gToasts.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, ms);
  }

  /* ---------- overlays ---------- */
  function overlay(html, cls = '') { el.gOverlay.innerHTML = `<div class="overlay ${cls}">${html}</div>`; const b = el.gOverlay.querySelector('[autofocus], .btn'); if (b) setTimeout(() => b.focus({ preventScroll: true }), 80); return el.gOverlay.firstChild; }
  function closeOverlay() { el.gOverlay.innerHTML = ''; }

  function startBriefDepth() {
    if (!cur || !cur.img || TP.reduced) return;
    briefCv = document.createElement('canvas'); briefCv.className = 'brief-depth'; briefCv.setAttribute('aria-hidden', 'true');
    el.gStage.appendChild(briefCv);
    briefScene = TP.depth.create(briefCv, { img: cur.img, depth: cur.depth, dim: .62, zoom: 1.05, strength: .035 });
    if (!briefScene) { briefCv.remove(); briefCv = null; return; }
    TP.depth.live.add(briefScene); briefScene.start();
    const s = briefScene;
    const look = e => { if (briefScene !== s) { el.gStage.removeEventListener('pointermove', look); return; }
      const r = el.gStage.getBoundingClientRect(); s.look((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1); };
    el.gStage.addEventListener('pointermove', look, { passive: true });
    requestAnimationFrame(() => briefCv && briefCv.classList.add('on'));
  }
  function stopBriefDepth(now) {
    const c = briefCv, s2 = briefScene; briefCv = null; briefScene = null;
    if (!c) return;
    TP.depth.live.delete(s2);
    const kill = () => { s2.destroy(); c.remove(); };
    if (now) kill(); else { c.classList.remove('on'); setTimeout(kill, 720); }
  }
  function briefing() {
    el.gScene.classList.add('dim');
    startBriefDepth();
    const o = overlay(`<div class="panel" role="dialog" aria-modal="true" aria-labelledby="bT">
      <span class="badge badge-blaze">Room ${lvl.level} of ${TP.levels.total()}</span>
      <h2 id="bT">${TP.esc(lvl.title)}</h2>
      <p>${TP.esc(lvl.story)}</p>
      <div class="brief-rules">
        <div>${TP.icon('levels')}20 words to find</div>
        <div>${TP.icon('timer')}10 minutes</div>
        <div>${TP.icon('help')}Help every 15 seconds</div>
        <div class="warn">${TP.icon('close')}Every 5 misses cost 10 seconds</div>
        <div class="say">${TP.icon('sound-on')}Tap a word or a found object to hear it</div>
      </div>
      <div class="actions"><button class="btn btn-lg" type="button" data-a="start" autofocus>${TP.icon('play')}Start</button><button class="btn btn-ghost" type="button" data-a="levels">Levels</button></div>
    </div>`, 'brief');
    o.querySelector('[data-a="start"]').onclick = () => { if (!TP.store.load().seenTour) { closeOverlay(); stopBriefDepth(); tour(() => countdown()); } else countdown(); };
    o.querySelector('[data-a="levels"]').onclick = e => TP.shell.go('levels', e);
  }

  async function countdown() {
    closeOverlay(); stopBriefDepth();
    TP.store.level(lvl.level).plays++; TP.store.save();
    el.gScene.classList.remove('dim');
    TP.audio.music('play', 1.2);
    const c = document.createElement('div'); c.className = 'countdown'; c.setAttribute('aria-live', 'assertive'); el.gOverlay.appendChild(c);
    for (const n of ['3', '2', '1']) { c.innerHTML = `<span>${n}</span>`; TP.audio.sfx('countdown'); await TP.wait(TP.reduced ? 250 : 720); if (!open_) return; }
    c.innerHTML = '<span class="go">GO!</span>'; TP.audio.sfx('go');
    S.running = true; S.paused = false; startLoop(); hud();
    setTimeout(() => c.remove(), 650);
    setTimeout(() => hideCtlHint(), 6000);
    rotateTip();
  }

  /* ---------- first-game tour: points at the real controls, the clock does not run ---------- */
  const TOUR = [
    { el: () => el.gWords, title: 'Your word list', text: 'These 20 things are hiding in the room. Find each one in the picture.' },
    { el: () => el.gWordList.querySelector('.word'), title: 'Tap a word to hear it', text: 'Every word has a speaker. Tap the word to hear how it sounds. Try it now.', pad: 6 },
    { el: () => el.gStage, title: 'Find it in the room', text: 'Tap an object to find it. Drag to look around. Pinch, scroll or use the buttons to zoom in.', inset: true },
    { el: () => el.gHelp, title: 'Stuck?', text: 'Help shows you one hidden object. Then it needs 15 seconds to recharge.', pad: 8 },
    { el: () => el.gTimer, title: 'Beat the clock', text: 'You have 10 minutes. Every 5 wrong taps cost 10 seconds. The dots count them.', pad: 8 },
    { el: null, title: 'One more thing', text: 'After you find something, tap it again to hear its word. Ready?' },
  ];
  function tour(done) {
    S.touring = true;
    const root = document.createElement('div'); root.className = 'tour'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'tourT');
    root.innerHTML = '<div class="tour-hole"></div><div class="tour-card"></div>';
    el.game.appendChild(root);
    const hole = root.firstChild, card = root.lastChild;
    let i = 0;
    if (innerWidth <= 860) { el.gWords.classList.remove('open'); el.gGrab.setAttribute('aria-expanded', 'false'); }
    function place() {
      const st = TOUR[i], t = st.el && st.el();
      const vw = innerWidth, vh = innerHeight;
      if (t) {
        const r = t.getBoundingClientRect(), p = st.pad || 0, k = st.inset ? 10 : 0;
        hole.style.cssText = `left:${r.left - p + k}px;top:${r.top - p + k}px;width:${r.width + 2 * p - 2 * k}px;height:${r.height + 2 * p - 2 * k}px`;
        hole.hidden = false;
        // the card goes where there is room: beside a tall target, else below or above it
        const cw = Math.min(360, vw - 32), ch = card.offsetHeight || 200;
        let x, y;
        if (st.inset) { x = r.left + (r.width - cw) / 2; y = r.top + (r.height - ch) / 2; }
        else if ((r.height > vh * .5 || r.left > vw * .6) && r.left > cw + 40) { x = r.left - cw - 20; y = r.height > vh * .5 ? r.top + 20 : r.top + r.height / 2 - ch / 2; }
        else if (r.bottom + ch + 24 < vh) { x = r.left + r.width / 2 - cw / 2; y = r.bottom + 16; }
        else { x = r.left + r.width / 2 - cw / 2; y = r.top - ch - 16; }
        card.style.left = Math.max(16, Math.min(vw - cw - 16, x)) + 'px';
        card.style.top = Math.max(16, Math.min(vh - ch - 16, y)) + 'px';
        card.style.width = cw + 'px';
      } else {
        hole.hidden = true;
        const cw = Math.min(380, vw - 32);
        card.style.width = cw + 'px'; card.style.left = (vw - cw) / 2 + 'px'; card.style.top = Math.max(16, (vh - (card.offsetHeight || 220)) / 2) + 'px';
      }
    }
    function show() {
      const st = TOUR[i], last = i === TOUR.length - 1;
      card.innerHTML = `<span class="label">${i + 1} / ${TOUR.length}</span><h3 id="tourT">${st.title}</h3><p>${st.text}</p>
        <div class="tour-actions">${last ? '' : '<button class="linkbtn" type="button" data-t="skip">Skip</button>'}
        <button class="btn btn-sm" type="button" data-t="next">${last ? TP.icon('play') + "Let's play" : 'Next'}</button></div>`;
      card.classList.toggle('tour-wide', !st.el);
      card.querySelector('[data-t="next"]').onclick = next;
      const sk = card.querySelector('[data-t="skip"]'); if (sk) sk.onclick = end;
      place(); requestAnimationFrame(place);
      card.querySelector('[data-t="next"]').focus({ preventScroll: true });
      TP.audio.sfx('click', .5);
    }
    function next() { if (i < TOUR.length - 1) { i++; show(); } else end(); }
    function end() {
      TP.store.set('seenTour', true); S.touring = false;
      removeEventListener('resize', place); document.removeEventListener('keydown', keys, true);
      root.classList.add('out'); setTimeout(() => root.remove(), 220);
      done && done();
    }
    function keys(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); next(); }
      else if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Tab') e.stopPropagation();
    }
    addEventListener('resize', place); document.addEventListener('keydown', keys, true);
    show();
  }

  function rotateTip() {
    const st = TP.store.load();
    if (st.seenRotateTip || !TP.touch || innerWidth > innerHeight || innerWidth > 700) return;
    TP.store.set('seenRotateTip', true);
    const t = document.createElement('div'); t.className = 'rotate-tip';
    t.innerHTML = `${TP.icon('rotate')}<span>Turn your phone sideways for a bigger room.</span><button class="btn btn-sm btn-ghost" type="button">Got it</button>`;
    el.gStage.appendChild(t);
    t.querySelector('button').onclick = () => t.remove();
    setTimeout(() => t.remove(), 7000);
  }

  function pause() {
    if (!S.running) return;
    S.running = false; S.paused = true;
    el.gScene.classList.add('dim'); TP.audio.duck(true);
    const st = TP.store.load();
    const o = overlay(`<div class="panel" role="dialog" aria-modal="true" aria-labelledby="pT">
      <h2 id="pT">Paused</h2><p>Take a breath. The room will wait.</p>
      <div class="actions"><button class="btn btn-lg" type="button" data-a="resume" autofocus>${TP.icon('play')}Resume</button></div>
      <div class="toggle-row">
        <button class="toggle" type="button" data-toggle="music" aria-pressed="${st.music}">Music <i></i></button>
        <button class="toggle" type="button" data-toggle="sfx" aria-pressed="${st.sfx}">Effects <i></i></button>
        <button class="toggle" type="button" data-toggle="voice" aria-pressed="${st.voice !== false}">Words <i></i></button>
      </div>
      ${TP.langSwitch('lang-switch-wide')}
      <div class="actions"><button class="btn btn-ghost btn-sm" type="button" data-a="restart">${TP.icon('replay')}Restart</button><button class="btn btn-ghost btn-sm" type="button" data-a="quit">${TP.icon('levels')}Quit to levels</button></div>
      <button class="linkbtn" type="button" data-a="tour">Show the tour again</button>
    </div>`);
    o.querySelector('[data-a="resume"]').onclick = resume;
    o.querySelector('[data-a="tour"]').onclick = () => { closeOverlay(); el.gScene.classList.remove('dim'); tour(() => resume()); };
    o.querySelector('[data-a="restart"]').onclick = () => confirmBox('Start over?', 'Your progress in this room will be lost.', 'Yes, restart', 'Keep playing', () => { reset(); layout(true); countdown(); });
    o.querySelector('[data-a="quit"]').onclick = () => confirmBox('Leave the room?', 'Your progress will be lost.', 'Leave', 'Stay', e => TP.shell.go('levels', e));
  }
  function confirmBox(title, text, yes, no, onYes) {
    const o = overlay(`<div class="panel" role="alertdialog" aria-modal="true" aria-labelledby="cT"><h2 id="cT">${title}</h2><p>${text}</p>
      <div class="actions"><button class="btn" type="button" data-a="yes">${yes}</button><button class="btn btn-ghost" type="button" data-a="no" autofocus>${no}</button></div></div>`);
    o.querySelector('[data-a="yes"]').onclick = e => onYes(e);
    o.querySelector('[data-a="no"]').onclick = () => { S.running = true; pause(); };
    setTimeout(() => o.querySelector('[data-a="no"]').focus(), 90);
  }
  function resume() {
    closeOverlay(); el.gScene.classList.remove('dim'); TP.audio.duck(false);
    S.paused = false; S.running = true; last = performance.now();
  }

  function fullscreen() {
    const g = el.game;
    if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
    if (g.requestFullscreen) g.requestFullscreen({ navigationUI: 'hide' }).catch(() => toast('Full screen is not available here. Add Toplay to your Home Screen for a full-screen game.', 'info', 3200));
    else if (g.webkitRequestFullscreen) g.webkitRequestFullscreen();
    else toast('Full screen is not available on this phone. Add Toplay to your Home Screen for a full-screen game.', 'info', 3400);
  }

  /* ---------- end states ---------- */
  function win() {
    S.running = false; S.ended = true; clearHint(); S.cooldown = 0; hud();
    const res = TP.SCORE.compute({ won: true, secondsLeft: S.timeLeft, helps: S.helps, misses: S.misses, total: lvl.objects.length });
    const L = TP.store.level(lvl.level); const isBest = res.score > L.best;
    L.wins++; if (isBest) L.best = res.score; L.stars = Math.max(L.stars, res.stars); TP.store.save();
    TP.audio.music(null, .6); TP.audio.sfx('win');
    confetti();
    const sub = res.stars === 3 ? 'Sharp eyes! Nothing gets past you.' : res.stars === 2 ? 'Great finds! Can you do it faster?' : 'Done! Try again with fewer helps.';
    setTimeout(async () => {
      if (!open_) return;
      const o = overlay(`<div class="panel" role="dialog" aria-modal="true" aria-labelledby="wT">
        <h2 id="wT" class="result-title-win">You found it all!</h2>
        <p>${sub}</p>
        <div class="stars" role="img" aria-label="${res.stars} of 3 stars">${[1, 2, 3].map(() => `<span class="star"><svg viewBox="0 0 24 24"><use href="#i-star"/></svg></span>`).join('')}</div>
        <div class="breakdown">
          <div><span>Found ${lvl.objects.length} × 100</span><b>+${res.items}</b></div>
          <div><span>Time bonus · ${TP.fmt(S.timeLeft)} × 5</span><b>+${res.time}</b></div>
          <div class="neg"><span>Helps used · ${S.helps}</span><b>−${res.help}</b></div>
          <div class="neg"><span>Misses · ${S.misses}</span><b>−${res.miss}</b></div>
          <div class="total"><span>Total</span><b data-total>0</b></div>
        </div>
        <span class="badge badge-zest new-best" data-best hidden>New best!</span>
        <div class="actions">
          <button class="btn btn-ghost" type="button" data-a="again">${TP.icon('replay')}Play again</button>
          ${TP.levels.unlocked(lvl.level + 1) ? `<button class="btn" type="button" data-a="next">${TP.icon("play")}Next room</button>` : (lvl.level >= TP.levels.total() ? '<span class="badge badge-zest all-done">All rooms cleared!</span>' : '<button class="btn" type="button" disabled>Next room soon</button>')}
          <button class="btn btn-ghost" type="button" data-a="levels">${TP.icon('levels')}Levels</button>
        </div></div>`);
      o.querySelector('[data-a="again"]').onclick = () => { clearConfetti(); open(lvl.level); };
      const nx = o.querySelector('[data-a="next"]'); if (nx) nx.onclick = e => { clearConfetti(); TP.shell.go('play', e, lvl.level + 1); };
      o.querySelector('[data-a="levels"]').onclick = e => TP.shell.go('levels', e);
      const rows = TP.$$('.breakdown div', o);
      for (let i = 0; i < rows.length; i++) { await TP.wait(260); rows[i].classList.add('show'); TP.audio.sfx('click', .6); }
      const tot = o.querySelector('[data-total]'); const cu = TP.audio.sfx('count-up', .7, true); const t0 = performance.now();
      await new Promise(r => { const step = now => { const k = Math.min(1, (now - t0) / 1100); tot.textContent = Math.round(res.score * (1 - Math.pow(1 - k, 3))); k < 1 ? requestAnimationFrame(step) : r(); }; requestAnimationFrame(step); });
      if (cu) cu.stop();
      const stars = TP.$$('.star', o);
      for (let i = 0; i < res.stars; i++) { await TP.wait(320); stars[i].classList.add('on'); TP.audio.sfx('star'); }
      if (isBest && L.wins > 1) { await TP.wait(250); o.querySelector('[data-best]').hidden = false; }
      else if (isBest) { await TP.wait(250); const b = o.querySelector('[data-best]'); b.textContent = 'First clear!'; b.hidden = false; }
      TP.home.stats();
    }, 1100);
  }

  function lose() {
    S.running = false; S.ended = true; clearHint(); S.cooldown = 0; hud();
    TP.audio.music(null, .4); TP.audio.sfx('lose');
    const n = S.found.size, total = lvl.objects.length;
    el.gScene.classList.add('dim');
    const o = overlay(`<div class="panel" role="dialog" aria-modal="true" aria-labelledby="lT">
      <h2 id="lT" class="result-title-lose">Time's up!</h2>
      <p>You found ${n} of ${total}. ${n >= total - 3 ? 'So close!' : 'The room is still full of secrets.'}</p>
      <div class="actions"><button class="btn btn-zest" type="button" data-a="reveal">${TP.icon('help')}Show what was hiding</button></div>
      <div class="actions"><button class="btn btn-ghost" type="button" data-a="again">${TP.icon('replay')}Try again</button><button class="btn btn-ghost" type="button" data-a="levels">${TP.icon('levels')}Levels</button></div>
    </div>`);
    o.querySelector('[data-a="reveal"]').onclick = reveal;
    o.querySelector('[data-a="again"]').onclick = () => { reset(); layout(true); countdown(); };
    o.querySelector('[data-a="levels"]').onclick = e => TP.shell.go('levels', e);
  }
  function reveal() {
    closeOverlay(); el.gScene.classList.remove('dim'); S.revealed = true;
    lvl.objects.filter(o => !S.found.has(o.id)).forEach(o => {
      const [u, v] = o.regions[0].hint; const mr = mark('mark-reveal', u, v, `<span>${TP.i18n.wordHTML(o)}</span>`); mr.dataset.id = o.id; mr.setAttribute('translate', 'no');
      const li = el.gWordList.querySelector(`[data-id="${o.id}"]`); if (li) li.classList.add('missed');
    });
    tween({ s: view.min, tx: (view.sw - W * view.min) / 2, ty: (view.sh - H * view.min) / 2 });
    TP.audio.sfx('hint');
    const bar = document.createElement('div'); bar.className = 'reveal-bar';
    bar.innerHTML = `<p>Here's what was hiding. Tap one to hear it.</p><button class="btn btn-sm" type="button" data-a="again">${TP.icon('replay')}Try again</button><button class="btn btn-sm btn-ghost" type="button" data-a="levels">Levels</button>`;
    el.gOverlay.appendChild(bar);
    bar.querySelector('[data-a="again"]').onclick = () => open(lvl.level);
    bar.querySelector('[data-a="levels"]').onclick = e => TP.shell.go('levels', e);
  }

  /* ---------- confetti ---------- */
  let cRaf = 0;
  function confetti() {
    if (TP.reduced) return;
    const cv = el.gConfetti; cv.hidden = false;
    const dpr = Math.min(2, devicePixelRatio || 1), w = innerWidth, h = innerHeight;
    cv.width = w * dpr; cv.height = h * dpr; const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const cols = ['#FF6B1A', '#6E50FF', '#C6FF3D', '#FFD23F', '#FFF6E5'];
    const P = Array.from({ length: 160 }, (_, i) => ({ x: w / 2 + (Math.random() - .5) * 120, y: h * .55, vx: (Math.random() - .5) * 16, vy: -8 - Math.random() * 14, r: Math.random() * 6.28, vr: (Math.random() - .5) * .3, s: 6 + Math.random() * 7, c: cols[i % cols.length] }));
    const t0 = performance.now();
    const step = now => {
      g.clearRect(0, 0, w, h);
      P.forEach(p => { p.vy += .38; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); });
      if (now - t0 < 3200) cRaf = requestAnimationFrame(step); else clearConfetti();
    };
    cRaf = requestAnimationFrame(step);
  }
  function clearConfetti() { cancelAnimationFrame(cRaf); if (el.gConfetti) { el.gConfetti.hidden = true; } }

  function init() { q(); bindInput(); el.gWordList.addEventListener('click', sayFromList); el.gWordList.addEventListener('keydown', sayFromList); }
  return { init, open, close, isOpen: () => open_ };
})();

document.addEventListener('DOMContentLoaded', () => { TP.game.init(); TP.shell.init(); });

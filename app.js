'use strict';

/* =========================================================
   Mission Caméléon — jeu de société réel, le téléphone donne les ordres
   ========================================================= */

const MISSION_SECONDS = 60;
const HIDE_SECONDS = 5;
const BEEP_EVERY = 15;
const MAX_PLAYERS = 12;
const STORAGE_KEY = 'mission-cameleon-v1';

const MISSIONS = [
  { emoji: '🪑', text: 'Inverse la place de deux chaises.' },
  { emoji: '🧦', text: 'Mets une chaussette sur une poignée de porte.' },
  { emoji: '🛋️', text: 'Cache une télécommande sous un coussin.' },
  { emoji: '🖼️', text: 'Retourne un cadre photo ou un livre à l\'envers.' },
  { emoji: '🧸', text: 'Mets un doudou sur la tête de quelqu\'un ou sur une plante.' },
  { emoji: '👟', text: 'Inverse deux chaussures (gauche à droite !).' },
  { emoji: '🥄', text: 'Pose une cuillère dans un endroit inattendu.' },
  { emoji: '🛏️', text: 'Échange la place de deux coussins.' },
  { emoji: '📚', text: 'Change l\'ordre de trois livres sur une étagère.' },
  { emoji: '💡', text: 'Allume ou éteins une lampe de la pièce.' },
  { emoji: '🚪', text: 'Ouvre un tiroir ou une porte de placard juste un petit peu.' },
  { emoji: '🧢', text: 'Pose un chapeau ou une casquette sur un objet.' },
  { emoji: '🍎', text: 'Déplace un fruit dans un autre endroit de la pièce.' },
  { emoji: '🪴', text: 'Tourne une plante ou un vase d\'un demi-tour.' },
  { emoji: '🧺', text: 'Cache un petit jouet dans une chaussure.' },
  { emoji: '✏️', text: 'Range un crayon ou un stylo à un endroit bizarre.' },
  { emoji: '🧻', text: 'Pose un rouleau de papier sur une étagère.' },
  { emoji: '🕶️', text: 'Mets des lunettes sur un doudou ou une peluche.' },
  { emoji: '🔄', text: 'Retourne un tapis ou un set de table.' },
  { emoji: '🎲', text: 'Ajoute un objet qui n\'était pas là dans la pièce.' },
];

const COLORS = [
  { bg: 'bg-rose-400', ring: 'ring-rose-200', text: 'text-rose-600', soft: 'bg-rose-50' },
  { bg: 'bg-sky-400', ring: 'ring-sky-200', text: 'text-sky-600', soft: 'bg-sky-50' },
  { bg: 'bg-amber-400', ring: 'ring-amber-200', text: 'text-amber-600', soft: 'bg-amber-50' },
  { bg: 'bg-violet-400', ring: 'ring-violet-200', text: 'text-violet-600', soft: 'bg-violet-50' },
  { bg: 'bg-emerald-400', ring: 'ring-emerald-200', text: 'text-emerald-600', soft: 'bg-emerald-50' },
  { bg: 'bg-orange-400', ring: 'ring-orange-200', text: 'text-orange-600', soft: 'bg-orange-50' },
  { bg: 'bg-pink-400', ring: 'ring-pink-200', text: 'text-pink-600', soft: 'bg-pink-50' },
  { bg: 'bg-teal-400', ring: 'ring-teal-200', text: 'text-teal-600', soft: 'bg-teal-50' },
  { bg: 'bg-indigo-400', ring: 'ring-indigo-200', text: 'text-indigo-600', soft: 'bg-indigo-50' },
  { bg: 'bg-lime-500', ring: 'ring-lime-200', text: 'text-lime-700', soft: 'bg-lime-50' },
  { bg: 'bg-fuchsia-400', ring: 'ring-fuchsia-200', text: 'text-fuchsia-600', soft: 'bg-fuchsia-50' },
  { bg: 'bg-cyan-400', ring: 'ring-cyan-200', text: 'text-cyan-600', soft: 'bg-cyan-50' },
];

const AVATARS = ['🦊', '🐼', '🐸', '🐯', '🐨', '🐵', '🦁', '🐰', '🐻', '🐷', '🐙', '🦄'];

/* ---------- État ---------- */

const state = {
  players: [],          // { id, name, colorIndex, score }
  pool: [],             // ids des joueurs pas encore Caméléon dans ce cycle
  round: 0,
  chameleonId: null,
  lastChameleonId: null,
  missionIndex: null,
  lastMissionIndices: [],
  lastWinnerId: null,
  screen: 'setup',
};

let timers = [];
let wakeLock = null;

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && Array.isArray(saved.players)) {
      Object.assign(state, saved);
      // On reprend toujours sur un écran stable
      state.screen = state.round > 0 && state.players.length >= 2 ? 'scores' : 'setup';
      state.lastWinnerId = null;
    }
  } catch (_) { /* stockage indisponible : on démarre à neuf */ }
}

function save() {
  try {
    const { screen, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch (_) { /* ignoré */ }
}

/* ---------- Utilitaires ---------- */

const $app = document.getElementById('app');

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

const randInt = (n) => Math.floor(Math.random() * n);
const playerById = (id) => state.players.find((p) => p.id === id);
const colorOf = (p) => COLORS[p.colorIndex % COLORS.length];
const avatarOf = (p) => AVATARS[p.colorIndex % AVATARS.length];

function clearTimers() {
  timers.forEach((t) => { clearInterval(t); clearTimeout(t); });
  timers = [];
}

function go(screen) {
  clearTimers();
  state.screen = screen;
  save();
  render();
  window.scrollTo({ top: 0 });
}

/* ---------- Fonctions natives (application iOS via Capacitor) ---------- */

const Cap = window.Capacitor;
const isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform() && Cap.registerPlugin);
const Haptics = isNative ? Cap.registerPlugin('Haptics') : null;
const LocalNotifications = isNative ? Cap.registerPlugin('LocalNotifications') : null;
const END_NOTIFICATION_ID = 6060;

function vibrate(pattern) {
  if (Haptics) {
    // L'iPhone ne sait pas suivre un motif : un retour léger pour les courtes impulsions,
    // une vraie vibration pour chaque segment « actif » d'un motif.
    if (typeof pattern === 'number') {
      Haptics.impact({ style: pattern <= 60 ? 'LIGHT' : 'HEAVY' }).catch(() => {});
      return;
    }
    let at = 0;
    pattern.forEach((ms, i) => {
      if (i % 2 === 0) setTimeout(() => Haptics.vibrate().catch(() => {}), at);
      at += ms;
    });
    return;
  }
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (_) { /* ignoré */ }
}

// Demandée au lancement de la partie plutôt que par-dessus la mission secrète
async function askNotificationPermission() {
  if (!LocalNotifications) return;
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'prompt' || perm.display === 'prompt-with-rationale') {
      await LocalNotifications.requestPermissions();
    }
  } catch (_) { /* pas grave */ }
}

// Prévient la fin du minuteur même si le téléphone posé face cachée s'est verrouillé
async function scheduleEndNotification(endsAt) {
  if (!LocalNotifications) return;
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return;
    await LocalNotifications.schedule({
      notifications: [{
        id: END_NOTIFICATION_ID,
        title: '⏰ Temps écoulé !',
        body: 'Détectives, revenez dans la pièce ! Cherchez ce qui a changé !',
        schedule: { at: new Date(endsAt), allowWhileIdle: true },
      }],
    });
  } catch (_) { /* pas grave */ }
}

function cancelEndNotification() {
  if (!LocalNotifications) return;
  LocalNotifications.cancel({ notifications: [{ id: END_NOTIFICATION_ID }] }).catch(() => {});
}

async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch (_) { /* pas grave */ }
}

/* ---------- Sons (Web Audio, aucun fichier) ---------- */

let audioCtx = null;

function unlockAudio() {
  // Les bips et l'alarme doivent s'entendre même si l'iPhone est en mode silencieux
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (_) { /* ignoré */ }
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (_) { audioCtx = null; }
}

function tone(freq, start, duration, volume = 0.15, type = 'sine') {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + start;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

const sounds = {
  beep() { tone(880, 0, 0.18, 0.08); },
  tick() { tone(660, 0, 0.12, 0.06); },
  start() { tone(523, 0, 0.15); tone(784, 0.15, 0.25); },
  alarm() {
    [0, 0.35, 0.7].forEach((s) => {
      tone(988, s, 0.15, 0.25, 'square');
      tone(1319, s + 0.15, 0.18, 0.25, 'square');
    });
  },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25, 0.15, 'triangle')); },
};

/* ---------- Logique de jeu ---------- */

function addPlayer(rawName) {
  const name = rawName.trim().replace(/\s+/g, ' ').slice(0, 20);
  if (!name) return 'Écris un prénom 🙂';
  if (state.players.length >= MAX_PLAYERS) return `${MAX_PLAYERS} joueurs maximum !`;
  if (state.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    return `${name} joue déjà !`;
  }
  const used = new Set(state.players.map((p) => p.colorIndex));
  let colorIndex = 0;
  while (used.has(colorIndex) && colorIndex < COLORS.length) colorIndex++;
  state.players.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    colorIndex: colorIndex % COLORS.length,
    score: 0,
  });
  save();
  return null;
}

function removePlayer(id) {
  state.players = state.players.filter((p) => p.id !== id);
  state.pool = state.pool.filter((pid) => pid !== id);
  save();
}

function pickChameleon() {
  const ids = state.players.map((p) => p.id);
  state.pool = state.pool.filter((id) => ids.includes(id));
  if (state.pool.length === 0) state.pool = ids.slice();
  // Nouveau cycle : éviter que le dernier Caméléon rejoue tout de suite
  let candidates = state.pool.filter((id) => id !== state.lastChameleonId);
  if (candidates.length === 0) candidates = state.pool;
  const chosen = candidates[randInt(candidates.length)];
  state.pool = state.pool.filter((id) => id !== chosen);
  state.chameleonId = chosen;
  state.lastChameleonId = chosen;
}

function pickMission() {
  const recent = state.lastMissionIndices;
  let candidates = MISSIONS.map((_, i) => i).filter((i) => !recent.includes(i));
  if (candidates.length === 0) candidates = MISSIONS.map((_, i) => i);
  const idx = candidates[randInt(candidates.length)];
  state.missionIndex = idx;
  state.lastMissionIndices = [idx, ...recent].slice(0, Math.min(8, MISSIONS.length - 1));
}

function startRound() {
  state.round += 1;
  state.lastWinnerId = null;
  pickChameleon();
  pickMission();
  go('reveal');
}

function awardPoint(playerId) {
  const p = playerById(playerId);
  if (p) p.score += 1;
  state.lastWinnerId = playerId;
  sounds.win();
  vibrate([60, 40, 60]);
  go('scores');
}

function resetScores() {
  state.players.forEach((p) => { p.score = 0; });
  state.pool = [];
  state.round = 0;
  state.chameleonId = null;
  state.lastChameleonId = null;
  state.lastWinnerId = null;
}

/* ---------- Composants ---------- */

function playerBadge(p, { removable = false, size = 'md' } = {}) {
  const c = colorOf(p);
  const big = size === 'lg';
  return `
    <span class="badge-in inline-flex items-center gap-2 rounded-full ${c.bg} ${big ? 'py-2 pl-2 pr-5 text-2xl' : 'py-1.5 pl-1.5 pr-2 text-xl'} font-bold text-white shadow-md ring-4 ${c.ring}">
      <span class="grid ${big ? 'h-11 w-11 text-2xl' : 'h-9 w-9 text-xl'} place-items-center rounded-full bg-white/90">${avatarOf(p)}</span>
      <span class="max-w-[9rem] truncate">${esc(p.name)}</span>
      ${removable ? `
        <button data-remove="${p.id}" aria-label="Retirer ${esc(p.name)}"
          class="grid h-9 w-9 place-items-center rounded-full bg-white/25 text-2xl leading-none transition hover:bg-white/40 active:scale-90">×</button>` : '<span class="w-2"></span>'}
    </span>`;
}

function header(subtitle = '') {
  return `
    <header class="mb-4 flex items-center justify-center gap-2 pt-2">
      <span class="wiggle inline-block text-4xl">🦎</span>
      <div class="text-center">
        <h1 class="font-display text-2xl font-extrabold leading-none text-emerald-600">Mission Caméléon</h1>
        ${subtitle ? `<p class="text-sm font-semibold text-emerald-700/70">${subtitle}</p>` : ''}
      </div>
    </header>`;
}

/* ---------- Écrans ---------- */

const screens = {};

screens.setup = () => {
  const n = state.players.length;
  const canStart = n >= 2;
  const resuming = state.round > 0;
  return `
  <section class="screen flex flex-1 flex-col">
    ${header('Le téléphone donne les ordres, on joue pour de vrai !')}

    <div class="rounded-[2rem] bg-white p-5 shadow-xl shadow-emerald-900/5">
      <h2 class="text-center font-display text-3xl font-extrabold text-slate-800">Qui joue aujourd'hui ?</h2>
      <form id="add-form" class="mt-4 flex gap-2" autocomplete="off">
        <input id="name-input" type="text" inputmode="text" enterkeyhint="done" maxlength="20"
          placeholder="Prénom…" aria-label="Prénom du joueur"
          class="min-w-0 flex-1 rounded-2xl border-4 border-emerald-100 bg-emerald-50/60 px-4 py-3 text-2xl font-bold outline-none transition placeholder:text-emerald-800/30 focus:border-emerald-400 focus:bg-white" />
        <button type="submit" aria-label="Ajouter le joueur"
          class="btn-giant grid w-16 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-4xl font-extrabold text-white">+</button>
      </form>
      <p id="add-error" class="mt-2 h-6 text-center font-bold text-rose-500" aria-live="polite"></p>

      <div id="players" class="flex min-h-[5rem] flex-wrap justify-center gap-3">
        ${n === 0
          ? `<p class="self-center text-center text-lg font-semibold text-slate-400">Ajoute au moins 2 joueurs 👨‍👩‍👧‍👦</p>`
          : state.players.map((p) => playerBadge(p, { removable: true })).join('')}
      </div>
    </div>

    <div class="mt-auto space-y-3 pt-6">
      <button id="start-btn" ${canStart ? '' : 'disabled'}
        class="btn-giant w-full rounded-[2rem] bg-gradient-to-br from-emerald-400 to-emerald-600 px-6 py-6 font-display text-3xl font-extrabold text-white">
        ${resuming ? '▶️ Reprendre la partie' : '🚀 Lancer la partie'}
      </button>
      ${!canStart ? `<p class="text-center font-semibold text-slate-500">Encore ${2 - n} joueur${2 - n > 1 ? 's' : ''} à ajouter</p>` : ''}
      ${resuming ? `<button id="new-game-btn" class="w-full rounded-2xl py-3 text-lg font-bold text-slate-500 underline-offset-4 hover:underline">🔄 Nouvelle partie (scores à zéro)</button>` : ''}
      <details class="rounded-2xl bg-white/70 p-4 text-slate-600">
        <summary class="cursor-pointer text-lg font-bold text-slate-700">📖 Comment on joue ?</summary>
        <ol class="mt-2 list-decimal space-y-1 pl-5 text-base font-medium">
          <li>Le téléphone choisit un <b>Caméléon</b>.</li>
          <li>Les <b>Détectives</b> sortent de la pièce et ferment les yeux.</li>
          <li>Le Caméléon lit sa mission secrète, pose le téléphone face cachée et a <b>60 secondes</b> pour changer un objet dans la pièce.</li>
          <li>Les Détectives reviennent et cherchent ce qui a changé !</li>
          <li>Trouvé ? Point pour le Détective. Sinon, point pour le Caméléon !</li>
        </ol>
      </details>
    </div>
  </section>`;
};

screens.reveal = () => {
  const p = playerById(state.chameleonId);
  const c = colorOf(p);
  return `
  <section class="screen flex flex-1 flex-col">
    ${header(`Manche ${state.round}`)}
    <div class="flex flex-1 flex-col items-center justify-center text-center">
      <p class="font-display text-2xl font-bold text-slate-600">Le Caméléon de cette manche est&nbsp;:</p>
      <div class="pop mt-6 grid h-44 w-44 place-items-center rounded-full ${c.bg} text-8xl shadow-2xl ring-8 ${c.ring}">${avatarOf(p)}</div>
      <p class="pop mt-6 break-all font-display text-6xl font-extrabold ${c.text}" style="animation-delay:.15s">${esc(p.name)}&nbsp;!</p>
      <p class="mt-4 max-w-xs text-lg font-semibold text-slate-500">${esc(p.name)}, prends le téléphone. Les autres, vous êtes les <b>Détectives</b> 🕵️</p>
    </div>
    <button id="discover-btn"
      class="btn-giant mt-6 w-full rounded-[2rem] bg-gradient-to-br from-violet-500 to-fuchsia-500 px-6 py-7 font-display text-3xl font-extrabold text-white">
      🤫 Découvrir ma mission secrète
    </button>
  </section>`;
};

screens.hide = () => `
  <section class="screen safe-pad fixed inset-0 z-10 flex flex-col items-center justify-center overflow-y-auto bg-gradient-to-br from-indigo-600 to-violet-700 px-6 text-center text-white">
    <div class="text-8xl">🙈</div>
    <h2 class="mt-6 font-display text-4xl font-extrabold leading-tight">Les autres joueurs (Détectives),</h2>
    <p class="mt-2 font-display text-3xl font-bold text-indigo-100">sortez de la pièce et fermez les yeux !</p>
    <div class="mt-10 grid h-32 w-32 place-items-center rounded-full bg-white/15 ring-8 ring-white/20">
      <span id="hide-count" class="font-display text-7xl font-extrabold">${HIDE_SECONDS}</span>
    </div>
    <p class="mt-6 text-lg font-semibold text-indigo-200">La mission s'affiche dans un instant…</p>
  </section>`;

screens.mission = () => {
  const m = MISSIONS[state.missionIndex];
  const R = 88;
  const C = 2 * Math.PI * R;
  return `
  <section class="screen safe-pad fixed inset-0 z-10 overflow-y-auto bg-gradient-to-b from-emerald-500 to-teal-600 px-5 text-white">
    <div class="mx-auto flex min-h-full max-w-md flex-col">
    <p class="text-center text-lg font-bold uppercase tracking-widest text-emerald-100">🤫 Mission secrète</p>
    <div class="pop mt-4 rounded-[2rem] bg-white p-6 text-center text-slate-800 shadow-2xl">
      <div class="text-7xl">${m.emoji}</div>
      <p class="mt-3 font-display text-3xl font-extrabold leading-tight">${esc(m.text)}</p>
    </div>

    <div class="flex flex-1 flex-col items-center justify-center py-6">
      <div id="timer-wrap" class="relative grid h-56 w-56 place-items-center rounded-full">
        <svg class="absolute inset-0 -rotate-90" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="${R}" fill="none" stroke-width="16" class="ring-track" />
          <circle id="timer-ring" cx="100" cy="100" r="${R}" fill="none" stroke="#fde047" stroke-width="16" stroke-linecap="round"
            stroke-dasharray="${C}" stroke-dashoffset="0" class="ring-progress" data-c="${C}" />
        </svg>
        <div class="text-center">
          <span id="timer-num" class="font-display text-7xl font-extrabold tabular-nums">${MISSION_SECONDS}</span>
          <p class="-mt-2 font-bold text-emerald-100">secondes</p>
        </div>
      </div>
      <p class="mt-6 max-w-xs text-center text-lg font-bold text-emerald-50">📱⬇️ Pose le téléphone face cachée et file accomplir ta mission !</p>
    </div>

    <button id="done-early-btn" class="mx-auto rounded-full bg-white/15 px-6 py-3 text-lg font-bold text-white ring-2 ring-white/30 transition active:scale-95">
      ✅ J'ai fini avant la fin
    </button>
    </div>
  </section>`;
};

screens.search = () => `
  <section class="screen flex flex-1 flex-col">
    <div class="flex flex-1 flex-col items-center justify-center text-center">
      <div class="pulse-ring grid h-36 w-36 place-items-center rounded-full bg-rose-500 text-7xl shadow-xl">🔍</div>
      <h2 class="mt-6 font-display text-4xl font-extrabold leading-tight text-slate-800">Détectives, revenez dans la pièce&nbsp;!</h2>
      <p class="mt-3 font-display text-3xl font-bold text-rose-500">Cherchez ce qui a changé&nbsp;!</p>
    </div>
    <div class="mt-6 space-y-4">
      <button id="found-btn"
        class="btn-giant w-full rounded-[2rem] bg-gradient-to-br from-sky-400 to-blue-600 px-6 py-6 font-display text-3xl font-extrabold text-white">
        🕵️ Un détective a trouvé&nbsp;!
      </button>
      <button id="notfound-btn"
        class="btn-giant w-full rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-500 px-6 py-6 font-display text-2xl font-extrabold leading-tight text-white">
        ⏰ Temps écoulé<br><span class="text-xl font-bold opacity-90">(Personne n'a trouvé)</span>
      </button>
    </div>
  </section>`;

screens.pickDetective = () => {
  const detectives = state.players.filter((p) => p.id !== state.chameleonId);
  return `
  <section class="screen flex flex-1 flex-col">
    ${header()}
    <h2 class="text-center font-display text-3xl font-extrabold text-slate-800">Qui a trouvé ? 🎉</h2>
    <p class="mb-5 text-center text-lg font-semibold text-slate-500">Touche le prénom du super Détective</p>
    <div class="grid gap-3">
      ${detectives.map((p) => {
        const c = colorOf(p);
        return `
        <button data-award="${p.id}"
          class="btn-giant flex w-full items-center gap-4 rounded-[1.75rem] ${c.bg} p-3 pr-6 text-left text-white">
          <span class="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/90 text-4xl">${avatarOf(p)}</span>
          <span class="min-w-0 flex-1 truncate font-display text-3xl font-extrabold">${esc(p.name)}</span>
          <span class="text-3xl">⭐</span>
        </button>`;
      }).join('')}
    </div>
    <button id="back-search-btn" class="mt-auto w-full pt-6 text-lg font-bold text-slate-500">← Retour</button>
  </section>`;
};

screens.scores = () => {
  const winner = playerById(state.lastWinnerId);
  const wasChameleon = winner && winner.id === state.chameleonId;
  const sorted = state.players.slice().sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const best = sorted.length ? sorted[0].score : 0;
  const medals = ['🥇', '🥈', '🥉'];
  return `
  <section class="screen flex flex-1 flex-col">
    ${header(state.round ? `Après la manche ${state.round}` : '')}
    ${winner ? `
      <div class="pop mb-5 rounded-[2rem] ${colorOf(winner).bg} p-5 text-center text-white shadow-xl">
        <div class="text-5xl">${wasChameleon ? '🦎✨' : '🕵️⭐'}</div>
        <p class="mt-1 font-display text-2xl font-extrabold leading-tight">
          +1 point pour ${esc(winner.name)} !
        </p>
        <p class="font-semibold text-white/90">${wasChameleon ? 'Le Caméléon a été trop fort !' : 'Bravo, super Détective !'}</p>
      </div>` : ''}

    <div class="rounded-[2rem] bg-white p-4 shadow-xl shadow-emerald-900/5">
      <h2 class="mb-3 text-center font-display text-2xl font-extrabold text-slate-700">🏆 Tableau des scores</h2>
      <ol class="space-y-2">
        ${sorted.map((p, i) => {
          const c = colorOf(p);
          const isNew = p.id === state.lastWinnerId;
          const leader = p.score === best && best > 0;
          return `
          <li class="flex items-center gap-3 rounded-2xl ${isNew ? `${c.soft} ring-4 ${c.ring}` : 'bg-slate-50'} p-2 pr-4 transition">
            <span class="w-8 text-center text-2xl">${leader ? '👑' : (medals[i] && p.score > 0 ? medals[i] : '')}</span>
            <span class="grid h-12 w-12 shrink-0 place-items-center rounded-full ${c.bg} text-2xl">${avatarOf(p)}</span>
            <span class="min-w-0 flex-1 truncate font-display text-2xl font-bold">${esc(p.name)}</span>
            <span class="font-display text-3xl font-extrabold ${c.text} tabular-nums ${isNew ? 'pop' : ''}">${p.score}</span>
          </li>`;
        }).join('')}
      </ol>
    </div>

    <div class="mt-auto space-y-3 pt-6">
      <button id="next-btn"
        class="btn-giant w-full rounded-[2rem] bg-gradient-to-br from-emerald-400 to-emerald-600 px-6 py-6 font-display text-3xl font-extrabold text-white">
        ➡️ Manche suivante
      </button>
      <button id="edit-players-btn" class="w-full rounded-2xl py-3 text-lg font-bold text-slate-500">👥 Modifier les joueurs</button>
    </div>
  </section>`;
};

/* ---------- Comportements par écran ---------- */

const behaviors = {};

behaviors.setup = () => {
  const form = document.getElementById('add-form');
  const input = document.getElementById('name-input');
  const error = document.getElementById('add-error');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const err = addPlayer(input.value);
    if (err) {
      error.textContent = err;
      input.focus();
      return;
    }
    render();
    const fresh = document.getElementById('name-input');
    fresh.focus();
  });

  $app.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => { removePlayer(btn.dataset.remove); render(); });
  });

  document.getElementById('start-btn').addEventListener('click', () => {
    if (state.players.length < 2) return;
    unlockAudio();
    askNotificationPermission();
    startRound();
  });

  const newGame = document.getElementById('new-game-btn');
  if (newGame) {
    newGame.addEventListener('click', () => {
      // Deuxième appui pour confirmer (les boîtes confirm() sont bloquées dans certains navigateurs intégrés)
      if (!newGame.dataset.armed) {
        newGame.dataset.armed = '1';
        newGame.textContent = '⚠️ Appuie encore pour remettre les scores à zéro';
        newGame.classList.add('text-rose-500');
        return;
      }
      resetScores();
      save();
      render();
    });
  }
};

behaviors.reveal = () => {
  document.getElementById('discover-btn').addEventListener('click', () => {
    unlockAudio();
    keepAwake(true);
    go('hide');
  });
};

behaviors.hide = () => {
  const el = document.getElementById('hide-count');
  const endsAt = Date.now() + HIDE_SECONDS * 1000;
  let last = HIDE_SECONDS;
  sounds.tick();
  timers.push(setInterval(() => {
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    if (left !== last) {
      last = left;
      el.textContent = left;
      if (left > 0) sounds.tick();
    }
    if (left <= 0) go('mission');
  }, 100));
};

behaviors.mission = () => {
  const num = document.getElementById('timer-num');
  const ring = document.getElementById('timer-ring');
  const wrap = document.getElementById('timer-wrap');
  const C = parseFloat(ring.dataset.c);
  const endsAt = Date.now() + MISSION_SECONDS * 1000;
  let lastShown = MISSION_SECONDS;
  let nextBeep = MISSION_SECONDS - BEEP_EVERY;

  sounds.start();
  vibrate(80);
  scheduleEndNotification(endsAt);

  const finish = () => {
    cancelEndNotification();
    sounds.alarm();
    vibrate([400, 150, 400, 150, 600]);
    keepAwake(false);
    go('search');
  };

  const tick = () => {
    const msLeft = endsAt - Date.now();
    const left = Math.max(0, Math.ceil(msLeft / 1000));
    if (left !== lastShown) {
      lastShown = left;
      num.textContent = left;
      ring.style.strokeDashoffset = String(C * (1 - left / MISSION_SECONDS));
      if (left <= 10) {
        ring.setAttribute('stroke', '#fb7185');
        wrap.classList.add('pulse-ring');
      }
    }
    // Bip discret toutes les 15 s (à 45, 30 et 15 s restantes)
    if (left <= nextBeep && nextBeep > 0) {
      sounds.beep();
      vibrate(40);
      nextBeep -= BEEP_EVERY;
    }
    if (msLeft <= 0) finish();
  };

  timers.push(setInterval(tick, 200));
  document.getElementById('done-early-btn').addEventListener('click', finish);
};

behaviors.search = () => {
  document.getElementById('found-btn').addEventListener('click', () => go('pickDetective'));
  document.getElementById('notfound-btn').addEventListener('click', () => awardPoint(state.chameleonId));
};

behaviors.pickDetective = () => {
  $app.querySelectorAll('[data-award]').forEach((btn) => {
    btn.addEventListener('click', () => awardPoint(btn.dataset.award));
  });
  document.getElementById('back-search-btn').addEventListener('click', () => go('search'));
};

behaviors.scores = () => {
  document.getElementById('next-btn').addEventListener('click', () => {
    unlockAudio();
    if (state.players.length < 2) { go('setup'); return; }
    startRound();
  });
  document.getElementById('edit-players-btn').addEventListener('click', () => go('setup'));
};

/* ---------- Rendu ---------- */

function render() {
  // Sécurité : un écran de manche sans Caméléon valide renvoie à la configuration
  const inRound = ['reveal', 'hide', 'mission', 'search', 'pickDetective'].includes(state.screen);
  if (inRound && (!playerById(state.chameleonId) || state.missionIndex == null)) state.screen = 'setup';

  $app.innerHTML = screens[state.screen]();
  behaviors[state.screen]();
}

document.addEventListener('visibilitychange', () => {
  // Le verrou d'écran est relâché quand la page passe en arrière-plan : on le redemande
  if (document.visibilityState === 'visible' && (state.screen === 'mission' || state.screen === 'hide')) {
    keepAwake(true);
  }
});

if (!isNative && 'serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

load();
render();

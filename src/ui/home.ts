export const homePage = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="#0a0a0a" id="themeColor">
<title>Hi-Res Audio · BitChord addon</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230a0a0a'/%3E%3Ccircle cx='32' cy='32' r='22' fill='none' stroke='%23fafafa' stroke-width='3'/%3E%3Cpath d='M20 29v6M26 23v18M32 18v28M38 23v18M44 29v6' stroke='%23fafafa' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E">
<script>
/* Set the theme before first paint so there is no flash. Dark unless the visitor chose light. */
(function () {
  var t = 'dark';
  try { var s = localStorage.getItem('theme'); if (s === 'light' || s === 'dark') t = s; } catch (e) {}
  document.documentElement.setAttribute('data-theme', t);
  var m = document.getElementById('themeColor');
  if (m) m.setAttribute('content', t === 'light' ? '#ffffff' : '#0a0a0a');
})();
</script>
<style>
/* Qobuz-DL's monochrome palettes. */
:root {
  color-scheme: dark;
  --background: #0a0a0a;
  --foreground: #fafafa;
  --muted: #262626;
  --muted-foreground: #a3a3a3;
  --border: #262626;
  --primary: #fafafa;
  --primary-foreground: #171717;
  --danger: #f87171;
  --radius: 10px;
  --bar-h: 100px;
}
:root[data-theme="light"] {
  color-scheme: light;
  --background: #ffffff;
  --foreground: #0a0a0a;
  --muted: #f5f5f5;
  --muted-foreground: #737373;
  --border: #e5e5e5;
  --primary: #171717;
  --primary-foreground: #fafafa;
  --danger: #dc2626;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:focus { outline: none; }
html { background: var(--background); color: var(--foreground); -webkit-text-size-adjust: 100%; -webkit-tap-highlight-color: transparent; }
body {
  font-family: Arial, Helvetica, sans-serif; font-size: 1rem; line-height: 1.5;
  min-height: 100dvh; position: relative; display: flex; flex-direction: column;
  padding: env(safe-area-inset-top) 0 calc(env(safe-area-inset-bottom) + 16px);
}
body.has-player { padding-bottom: calc(var(--bar-h) + env(safe-area-inset-bottom) + 24px); }
#particles { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
main, footer, .bar, .theme { position: relative; z-index: 1; }
main { flex: 1; display: flex; flex-direction: column; }

button, input { font: inherit; color: inherit; }
button { cursor: pointer; border: 0; background: none; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* Smooth light/dark change: colors fade for a moment while the theme flips. */
.theming, .theming *, .theming *::before, .theming *::after {
  transition: background-color .4s ease, color .4s ease, border-color .4s ease, opacity .4s ease, transform .4s ease !important;
}

/* ── Theme toggle, top right ── */
.theme {
  position: fixed; top: calc(12px + env(safe-area-inset-top)); right: 12px; z-index: 5;
  width: 44px; height: 44px; border-radius: var(--radius);
  background: var(--background); border: 1px solid var(--border); color: var(--foreground);
  display: grid; place-items: center;
}
.theme:hover, .theme:focus-visible { background: var(--muted); }
.theme svg { grid-area: 1 / 1; transition: opacity .3s ease, transform .4s ease; }
:root[data-theme="dark"] .theme .moon { opacity: 0; transform: rotate(-90deg) scale(.5); }
:root[data-theme="light"] .theme .sun { opacity: 0; transform: rotate(90deg) scale(.5); }

/* ── Header + search, centred in the window until the first search ── */
header { width: 100%; max-width: 640px; margin: auto; padding: 56px 16px; text-align: center; }
body.searched header { margin: 0 auto; padding: 32px 16px 0; }
.brand { display: inline-flex; flex-direction: column; align-items: center; gap: 10px; color: inherit; text-decoration: none; cursor: pointer; user-select: none; }
.brand svg { width: 64px; height: 64px; }
h1 { font-size: 2.25rem; font-weight: 700; line-height: 1.15; }
body.searched .brand { flex-direction: row; gap: 10px; }
body.searched .brand svg { width: 32px; height: 32px; }
body.searched h1 { font-size: 1.375rem; }
.tagline { color: var(--muted-foreground); font-weight: 500; margin-top: 2px; }
body.searched .tagline { display: none; }

.search { display: flex; align-items: center; gap: 8px; margin: 24px auto 0; max-width: 640px; }
.field { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 12px; background: var(--background); border: 1px solid var(--border); border-radius: var(--radius); }
.field svg { flex: none; color: var(--muted-foreground); }
#query { flex: 1; min-width: 0; height: 100%; background: transparent; border: 0; font-weight: 600; letter-spacing: .02em; -webkit-appearance: none; appearance: none; }
#query::placeholder { color: var(--muted-foreground); font-weight: 600; opacity: 1; }
#query::-webkit-search-cancel-button { -webkit-appearance: none; display: none; }
.go { flex: none; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: var(--primary); color: var(--primary-foreground); border-radius: var(--radius); }
.go:hover, .go:focus-visible { opacity: .9; }
.go:disabled { background: var(--muted); color: var(--foreground); cursor: default; }
.spin { width: 18px; height: 18px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

#msg { text-align: center; color: var(--muted-foreground); font-weight: 600; padding: 24px 16px 0; }
#msg:empty { display: none; }
#msg.error { color: var(--danger); }

/* ── Results: grid of covers ── */
#results { width: 100%; max-width: 1600px; margin: 24px auto 0; padding: 0 24px; display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
#results:empty { display: none; }
.card { display: block; width: 100%; text-align: left; border-radius: 4px; }
.cover-wrap { position: relative; aspect-ratio: 1; border-radius: 4px; overflow: hidden; background: var(--muted); }
.cover-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .25s ease, opacity .25s; }
.card:hover .cover-wrap img, .card:focus-visible .cover-wrap img { transform: scale(1.04); opacity: .85; }
.badge { position: absolute; left: 6px; bottom: 6px; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.72); color: #fff; font-size: .6875rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.card[aria-current="true"] .t1::before { content: "\\25B6\\00a0"; font-size: .7em; }
.eq { position: absolute; right: 8px; top: 8px; display: none; align-items: flex-end; gap: 2px; width: 14px; height: 14px; }
.card[aria-current="true"] .eq { display: flex; }
.eq i { flex: 1; background: #fff; border-radius: 1px; animation: eq .8s ease-in-out infinite alternate; }
.eq i:nth-child(2) { animation-delay: .2s; } .eq i:nth-child(3) { animation-delay: .4s; }
@keyframes eq { from { height: 25%; } to { height: 100%; } }
.t1, .t2 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.t1 { font-weight: 600; font-size: .875rem; margin-top: 8px; }
.t2 { color: var(--muted-foreground); font-size: .8125rem; }
.skel { aspect-ratio: 1; border-radius: 4px; background: var(--muted); animation: pulse 1.6s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: .5; } }

/* ── Player ── */
.bar {
  position: fixed; left: 0; right: 0; bottom: 0; padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  background: color-mix(in srgb, var(--background) 94%, transparent); border-top: 1px solid var(--border);
  transform: translateY(100%); transition: transform .3s ease; visibility: hidden;
}
.bar.on { transform: none; visibility: visible; }
.bar-in {
  max-width: 1100px; margin: 0 auto; display: grid; align-items: center; column-gap: 16px; row-gap: 2px;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr) minmax(0, 1fr);
  grid-template-areas: "info ctrls end" "info seek end";
}
.info { grid-area: info; display: flex; align-items: center; gap: 12px; min-width: 0; }
.info img { width: 48px; height: 48px; border-radius: 4px; object-fit: cover; background: var(--muted); flex: none; }
.info img[hidden] { display: none; }
.info .meta { min-width: 0; }
.info .t1 { margin-top: 0; }
.ctrls { grid-area: ctrls; display: flex; align-items: center; justify-content: center; gap: 4px; }
.ic { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; color: var(--foreground); }
.ic:hover, .ic:focus-visible { background: var(--muted); }
.ic:disabled { opacity: .35; background: none; cursor: default; }
.pp { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--primary); color: var(--primary-foreground); }
.pp:hover, .pp:focus-visible { opacity: .9; }
.pp > * { grid-area: 1 / 1; transition: opacity .15s ease; }
.rd { fill: currentColor; stroke: currentColor; stroke-width: 2.4; stroke-linejoin: round; stroke-linecap: round; }
.pp .i-pause, .pp .i-load { opacity: 0; }
.pp[data-state="playing"] .i-play, .pp[data-state="loading"] .i-play { opacity: 0; }
.pp[data-state="playing"] .i-pause, .pp[data-state="loading"] .i-load { opacity: 1; }
.seek { grid-area: seek; display: flex; align-items: center; gap: 10px; min-width: 0; }
.time { flex: none; min-width: 2.6em; font-size: .75rem; color: var(--muted-foreground); font-variant-numeric: tabular-nums; }
.time.r { text-align: right; }
.end { grid-area: end; justify-self: end; display: flex; align-items: center; gap: 4px; }
.vol { width: 96px; flex: none; }
.vol-btn svg { grid-area: 1 / 1; transition: opacity .15s ease; }
.vol-btn svg { opacity: 0; }
.vol-btn[data-level="high"] .v-high, .vol-btn[data-level="low"] .v-low, .vol-btn[data-level="muted"] .v-muted { opacity: 1; }

/* Seek bar: a range input (keyboard and touch for free) drawn in the page's colors. */
.range { flex: 1; min-width: 0; height: 20px; margin: 0; background: transparent; cursor: pointer; -webkit-appearance: none; appearance: none; }
.range:disabled { cursor: default; opacity: .5; }
.range::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: linear-gradient(to right, var(--foreground) var(--p, 0%), var(--muted) var(--p, 0%)); }
.range::-moz-range-track { height: 4px; border-radius: 2px; background: var(--muted); }
.range::-moz-range-progress { height: 4px; border-radius: 2px; background: var(--foreground); }
.range::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; margin-top: -4px; border: 0; border-radius: 50%; background: var(--foreground); transform: scale(0); transition: transform .15s ease; }
.range::-moz-range-thumb { width: 12px; height: 12px; border: 0; border-radius: 50%; background: var(--foreground); transform: scale(0); transition: transform .15s ease; }
.range:hover::-webkit-slider-thumb, .range:focus-visible::-webkit-slider-thumb, .range:active::-webkit-slider-thumb { transform: scale(1); }
.range:hover::-moz-range-thumb, .range:focus-visible::-moz-range-thumb, .range:active::-moz-range-thumb { transform: scale(1); }
@media (hover: none) { .range::-webkit-slider-thumb { transform: scale(1); } .range::-moz-range-thumb { transform: scale(1); } }
.range:focus { outline: none; }

@media (max-width: 640px) {
  .bar-in { grid-template-columns: minmax(0, 1fr) auto auto; grid-template-areas: "info ctrls end" "seek seek seek"; column-gap: 8px; row-gap: 0; }
  .vol { display: none; }
}

footer { max-width: 640px; margin: 32px auto 0; padding: 0 16px; text-align: center; color: var(--muted-foreground); font-size: .75rem; line-height: 1.6; }
footer a { color: var(--foreground); }

@media (max-width: 480px) { #results { padding: 0 16px; grid-template-columns: repeat(2, 1fr); } }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after, .theming, .theming *, .theming *::before, .theming *::after { animation: none !important; transition: none !important; }
  .eq i { height: 60%; }
}
</style>
</head>
<body>
<canvas id="particles" aria-hidden="true"></canvas>

<button class="theme" id="theme" type="button" aria-label="Switch to light theme">
  <svg class="sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
  <svg class="moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
</button>

<main>
  <header>
    <a class="brand" id="home" href="/" aria-label="Hi-Res Audio, home">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="32" cy="32" r="29" stroke-width="3"/><path d="M18 28v8M25 21v22M32 14v36M39 21v22M46 28v8" stroke-width="4" stroke-linecap="round"/></svg>
      <h1>Hi-Res Audio</h1>
    </a>
    <p class="tagline">Lossless streams for BitChord</p>
    <form class="search" id="searchForm" role="search" autocomplete="off">
      <label class="sr" for="query">Search for music</label>
      <div class="field">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/></svg>
        <input id="query" type="search" enterkeyhint="search" placeholder="Search for anything..." spellcheck="false" autocapitalize="off">
      </div>
      <button class="go" id="go" type="submit" aria-label="Search" disabled>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    </form>
  </header>

  <div id="msg" role="status" aria-live="polite"></div>
  <section id="results" aria-label="Search results"></section>
</main>

<footer>
  <p>Licensed under <a href="https://github.com/shivamsingh-07/lossless-addon/blob/main/LICENSE" target="_blank" rel="noopener">GPL-3.0</a></p>
</footer>

<div class="bar" id="bar" role="region" aria-label="Now playing">
  <div class="bar-in">
    <div class="info">
      <img id="playerArt" alt="" hidden>
      <div class="meta">
        <div class="t1" id="nowTitle">Nothing playing</div>
        <div class="t2" id="nowArtist"></div>
      </div>
    </div>
    <div class="ctrls">
      <button class="ic" id="prev" type="button" aria-label="Previous">
        <svg class="rd" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6.5v11" fill="none"/><path d="M18 7v10l-8.5-5z"/></svg>
      </button>
      <button class="pp" id="pp" type="button" data-state="paused" aria-label="Play">
        <svg class="rd i-play" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 6.5v11l9-5.5z"/></svg>
        <svg class="rd i-pause" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="6" width="3.2" height="12" rx="1.1"/><rect x="13.8" y="6" width="3.2" height="12" rx="1.1"/></svg>
        <span class="spin i-load" aria-hidden="true"></span>
      </button>
      <button class="ic" id="next" type="button" aria-label="Next">
        <svg class="rd" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 6.5v11" fill="none"/><path d="M6 7v10l8.5-5z"/></svg>
      </button>
    </div>
    <div class="seek">
      <span class="time" id="tCur">0:00</span>
      <input class="range" id="seek" type="range" min="0" max="1000" step="1" value="0" aria-label="Seek" disabled>
      <span class="time r" id="tDur">0:00</span>
    </div>
    <div class="end">
      <button class="ic vol-btn" id="mute" type="button" data-level="high" aria-label="Mute">
        <svg class="v-high" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>
        <svg class="v-low" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>
        <svg class="v-muted" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="m16 9.5 5 5M21 9.5l-5 5"/></svg>
      </button>
      <input class="range vol" id="vol" type="range" min="0" max="100" step="1" value="100" aria-label="Volume">
    </div>
    <audio id="audio" preload="none"></audio>
  </div>
</div>

<script>
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var tracks = [];
  var current = -1;
  var searching = false;

  /* ── Particles: drift, bounce, lines to the cursor, repulse on click. White on dark, black on light. ── */
  var setTone = function () {};
  (function () {
    var cv = $('particles'), ctx = cv.getContext('2d');
    if (!ctx) return;
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, P = [], mx = -1e4, my = -1e4, last = 0, raf = 0;
    var tone = root.getAttribute('data-theme') === 'light' ? 0 : 255, target = tone, fading = 0;
    function make() {
      var a = Math.random() * Math.PI * 2, s = 0.3 + Math.random() * 0.7;
      return { x: Math.random() * W, y: Math.random() * H, vx: Math.cos(a) * s, vy: Math.sin(a) * s, px: 0, py: 0, r: 1 + Math.random() * 2 };
    }
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(150, Math.max(40, Math.round(W * H / 9000)));
      while (P.length < n) P.push(make());
      P.length = n;
      for (var i = 0; i < P.length; i++) { if (P[i].x > W) P[i].x = Math.random() * W; if (P[i].y > H) P[i].y = Math.random() * H; }
      draw();
    }
    function draw() {
      var c = Math.round(tone), rgb = c + ',' + c + ',' + c;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgb(' + rgb + ')';
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        var dx = p.x - mx, dy = p.y - my, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 150) {
          ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.45 * (1 - d / 150)).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my); ctx.stroke();
        }
      }
    }
    function fade() {
      var diff = target - tone;
      if (Math.abs(diff) < 1) { tone = target; fading = 0; draw(); return; }
      tone += diff * 0.18; draw();
      fading = requestAnimationFrame(fade);
    }
    function step(t) {
      var k = Math.min((t - last) / 16.67, 3); last = t;
      if (Math.abs(target - tone) >= 1) tone += (target - tone) * 0.18 * k; else tone = target;
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        p.vx += (Math.random() - 0.5) * 0.02 * k; p.vy += (Math.random() - 0.5) * 0.02 * k;
        var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (sp > 1) { p.vx /= sp; p.vy /= sp; } else if (sp < 0.2) { p.vx *= 1.5; p.vy *= 1.5; }
        p.x += (p.vx + p.px) * k; p.y += (p.vy + p.py) * k;
        var f = Math.pow(0.92, k); p.px *= f; p.py *= f;
        if (p.x < p.r) { p.x = p.r; p.vx = Math.abs(p.vx); } else if (p.x > W - p.r) { p.x = W - p.r; p.vx = -Math.abs(p.vx); }
        if (p.y < p.r) { p.y = p.r; p.vy = Math.abs(p.vy); } else if (p.y > H - p.r) { p.y = H - p.r; p.vy = -Math.abs(p.vy); }
      }
      draw();
      raf = requestAnimationFrame(step);
    }
    function start() { if (still || raf) return; last = performance.now(); raf = requestAnimationFrame(step); }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    setTone = function (value) {
      target = value;
      if (still) { if (!fading) fading = requestAnimationFrame(fade); }
    };
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; });
    document.addEventListener('pointerleave', function () { mx = my = -1e4; });
    window.addEventListener('pointerdown', function (e) {
      if (still) return;
      for (var i = 0; i < P.length; i++) {
        var p = P[i], dx = p.x - e.clientX, dy = p.y - e.clientY, d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d < 200) { var f = (1 - d / 200) * 6; p.px += dx / d * f; p.py += dy / d * f; }
      }
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    resize(); start();
  })();

  /* ── Theme toggle ── */
  var themeBtn = $('theme');
  function syncThemeUi(t) {
    themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    $('themeColor').setAttribute('content', t === 'light' ? '#ffffff' : '#0a0a0a');
  }
  syncThemeUi(root.getAttribute('data-theme'));
  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.classList.add('theming');
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeUi(next);
    setTone(next === 'light' ? 0 : 255);
    setTimeout(function () { root.classList.remove('theming'); }, 500);
  });

  /* ── Data ── */
  function getJSON(url, done) {
    var x = new XMLHttpRequest();
    x.onreadystatechange = function () {
      if (x.readyState !== 4) return;
      if (x.status < 200 || x.status >= 300) return done(new Error('HTTP ' + x.status));
      try { done(null, JSON.parse(x.responseText)); } catch (e) { done(e); }
    };
    x.open('GET', url, true);
    x.send();
  }

  function msg(text, isError) { var m = $('msg'); m.textContent = text || ''; m.className = isError ? 'error' : ''; }
  function busy(on) {
    searching = on;
    var go = $('go');
    go.disabled = on || !$('query').value.trim();
    go.innerHTML = on
      ? '<span class="spin" aria-hidden="true"></span>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  }
  function mark(index) {
    var cards = document.querySelectorAll('.card');
    for (var i = 0; i < cards.length; i++) {
      if (i === index) cards[i].setAttribute('aria-current', 'true'); else cards[i].removeAttribute('aria-current');
    }
  }
  function label(t) { return t.audioQuality || t.format || 'FLAC'; }

  function card(t, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'card';
    b.setAttribute('aria-label', 'Play ' + (t.title || 'track') + (t.artist ? ' by ' + t.artist : ''));
    var wrap = document.createElement('div'); wrap.className = 'cover-wrap';
    if (t.artworkURL) {
      var img = document.createElement('img'); img.alt = ''; img.loading = 'lazy'; img.src = t.artworkURL;
      img.onerror = function () { this.remove(); };
      wrap.appendChild(img);
    }
    var badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = label(t);
    var eq = document.createElement('span'); eq.className = 'eq'; eq.setAttribute('aria-hidden', 'true'); eq.innerHTML = '<i></i><i></i><i></i>';
    wrap.appendChild(badge); wrap.appendChild(eq);
    var t1 = document.createElement('div'); t1.className = 't1'; t1.textContent = t.title || 'Unknown';
    var t2 = document.createElement('div'); t2.className = 't2'; t2.textContent = t.artist || t.album || '';
    b.appendChild(wrap); b.appendChild(t1); b.appendChild(t2);
    b.addEventListener('click', function () { play(i); });
    return b;
  }

  function skeletons() {
    var r = $('results'); r.textContent = '';
    for (var i = 0; i < 12; i++) { var s = document.createElement('div'); s.className = 'skel'; s.setAttribute('aria-hidden', 'true'); r.appendChild(s); }
  }

  function search(q) {
    document.body.classList.add('searched');
    msg(''); busy(true); skeletons();
    getJSON('/search?q=' + encodeURIComponent(q) + '&quality=LOSSLESS&atmos=auto', function (err, data) {
      busy(false);
      var r = $('results'); r.textContent = '';
      if (err || !data) return msg('Search is unavailable right now. Check your connection and try again.', true);
      tracks = data.tracks || []; current = -1;
      if (!tracks.length) return msg('No results for \\u201c' + q + '\\u201d. Try a different spelling or fewer words.');
      var frag = document.createDocumentFragment();
      for (var i = 0; i < tracks.length; i++) frag.appendChild(card(tracks[i], i));
      r.appendChild(frag);
    });
  }

  /* ── Player ── */
  var audio = $('audio'), pp = $('pp'), seek = $('seek'), seeking = false;
  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    sec = Math.floor(sec);
    var m = Math.floor(sec / 60), r = sec % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }
  function setState(state) {
    pp.setAttribute('data-state', state);
    pp.setAttribute('aria-label', state === 'playing' ? 'Pause' : 'Play');
  }
  function paint(time) {
    var d = audio.duration, ok = isFinite(d) && d > 0;
    if (time === undefined) time = audio.currentTime;
    var pct = ok ? Math.min(100, time / d * 100) : 0;
    seek.style.setProperty('--p', pct + '%');
    if (!seeking) seek.value = String(Math.round(pct * 10));
    seek.disabled = !ok;
    $('tCur').textContent = fmt(time);
    $('tDur').textContent = ok ? fmt(d) : '0:00';
    seek.setAttribute('aria-valuetext', fmt(time) + (ok ? ' of ' + fmt(d) : ''));
  }
  function navState() { $('next').disabled = current < 0 || current >= tracks.length - 1; $('prev').disabled = current < 0; }

  function play(i) {
    var t = tracks[i];
    if (!t) return;
    current = i; mark(i); navState();
    document.body.classList.add('has-player');
    $('bar').classList.add('on');
    $('nowTitle').textContent = t.title || 'Unknown';
    $('nowArtist').textContent = [t.artist || t.album, label(t)].filter(Boolean).join(' \\u00b7 ');
    var art = $('playerArt');
    if (t.artworkURL) { art.src = t.artworkURL; art.hidden = false; } else { art.hidden = true; }
    audio.pause(); audio.removeAttribute('src'); audio.load();
    setState('loading'); seeking = false; paint(0);
    if ('mediaSession' in navigator && window.MediaMetadata) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title || '', artist: t.artist || '', album: t.album || '', artwork: t.artworkURL ? [{ src: t.artworkURL }] : [] });
    }
    getJSON('/stream/' + encodeURIComponent(t.id) + '?quality=LOSSLESS&atmos=auto', function (err, data) {
      if (current !== i) return;
      if (err || !data || !data.url) {
        $('nowTitle').textContent = 'Can\u2019t play this track';
        $('nowArtist').textContent = 'No lossless stream is available. Try another result.';
        setState('paused'); mark(-1); return;
      }
      audio.src = data.url; audio.load();
      var p = audio.play(); if (p && p.catch) p.catch(function () { setState('paused'); });
    });
  }
  function toggle() {
    if (current < 0) return;
    if (!audio.src) return;
    if (audio.paused) { var p = audio.play(); if (p && p.catch) p.catch(function () {}); } else audio.pause();
  }
  function prevTrack() {
    if (current < 0) return;
    if (audio.currentTime > 3 || current === 0) { audio.currentTime = 0; paint(0); } else play(current - 1);
  }
  function nextTrack() { if (current >= 0 && current < tracks.length - 1) play(current + 1); }

  /* A finished track ends playback: nothing repeats and nothing else starts. The player closes. */
  function closePlayer() {
    audio.pause(); audio.removeAttribute('src'); audio.load();
    current = -1; mark(-1); navState();
    setState('paused'); seeking = false; paint(0);
    $('bar').classList.remove('on');
    document.body.classList.remove('has-player');
    if ('mediaSession' in navigator) { try { navigator.mediaSession.metadata = null; } catch (e) {} }
  }

  pp.addEventListener('click', toggle);
  $('prev').addEventListener('click', prevTrack);
  $('next').addEventListener('click', nextTrack);
  seek.addEventListener('input', function () {
    seeking = true;
    var d = audio.duration; if (isFinite(d)) paint(seek.value / 1000 * d);
  });
  seek.addEventListener('change', function () {
    var d = audio.duration; if (isFinite(d) && d > 0) audio.currentTime = seek.value / 1000 * d;
    seeking = false; paint();
  });
  audio.addEventListener('timeupdate', function () { paint(); });
  audio.addEventListener('durationchange', function () { paint(); });
  audio.addEventListener('loadedmetadata', function () { paint(); });
  audio.addEventListener('waiting', function () { if (!audio.paused) setState('loading'); });
  audio.addEventListener('playing', function () { setState('playing'); });
  audio.addEventListener('play', function () { if (audio.readyState < 3) setState('loading'); else setState('playing'); });
  audio.addEventListener('pause', function () { if (audio.getAttribute('src')) setState('paused'); });
  audio.addEventListener('ended', closePlayer);
  audio.addEventListener('error', function () {
    if (!audio.getAttribute('src')) return;
    $('nowTitle').textContent = 'Can\u2019t play this track';
    $('nowArtist').textContent = 'The stream failed to load. Try another result.';
    setState('paused'); mark(-1);
  });
  if ('mediaSession' in navigator) {
    var ms = navigator.mediaSession;
    var on = function (action, fn) { try { ms.setActionHandler(action, fn); } catch (e) {} };
    on('play', toggle); on('pause', toggle); on('previoustrack', prevTrack); on('nexttrack', nextTrack);
    on('seekto', function (d) { if (d && isFinite(d.seekTime)) { audio.currentTime = d.seekTime; paint(); } });
  }
  navState();

  /* ── Volume ── */
  var vol = $('vol'), muteBtn = $('mute');
  function paintVolume() {
    var v = audio.muted ? 0 : audio.volume;
    vol.value = String(Math.round(v * 100));
    vol.style.setProperty('--p', Math.round(v * 100) + '%');
    var level = v === 0 ? 'muted' : (v < 0.5 ? 'low' : 'high');
    muteBtn.setAttribute('data-level', level);
    muteBtn.setAttribute('aria-label', level === 'muted' ? 'Unmute' : 'Mute');
    vol.setAttribute('aria-valuetext', Math.round(v * 100) + '%');
  }
  try { var saved = parseFloat(localStorage.getItem('volume')); if (isFinite(saved) && saved >= 0 && saved <= 1) audio.volume = saved; } catch (e) {}
  vol.addEventListener('input', function () {
    var v = vol.value / 100;
    audio.volume = v; audio.muted = v === 0;
    try { localStorage.setItem('volume', String(v)); } catch (e) {}
  });
  muteBtn.addEventListener('click', function () {
    if (audio.muted || audio.volume === 0) { audio.muted = false; if (audio.volume === 0) audio.volume = 0.5; } else audio.muted = true;
  });
  audio.addEventListener('volumechange', paintVolume);
  paintVolume();

  var input = $('query');
  input.addEventListener('input', function () { $('go').disabled = searching || !input.value.trim(); });
  $('searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (q && !searching) { search(q); input.blur(); }
  });
  $('home').addEventListener('click', function (e) {
    e.preventDefault();
    document.body.classList.remove('searched');
    input.value = ''; tracks = []; current = -1; $('results').textContent = ''; msg(''); busy(false);
  });
  document.addEventListener('keydown', function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') { e.preventDefault(); input.focus(); }
    else if (e.key === ' ' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'BUTTON' && current >= 0) { e.preventDefault(); toggle(); }
  });
})();
</script>
</body>
</html>`;

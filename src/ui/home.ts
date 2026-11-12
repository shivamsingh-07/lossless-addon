import { clientScript } from "./client.js";
import { styles } from "./styles.js";

/** The search page served at the root: markup here, styles and script in their own files. */
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
${styles}</style>
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
${clientScript}</script>
</body>
</html>`;

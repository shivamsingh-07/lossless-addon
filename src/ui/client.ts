/** The page's script: search, the player, volume, the theme toggle and the particle background. */
export const clientScript = `(function () {
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
`;

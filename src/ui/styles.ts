/** The page's stylesheet. Light and dark palettes are variables on :root; everything else uses them. */
export const styles = `/* Qobuz-DL's monochrome palettes. */
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
`;

/* Stage director: attract, welcome, onboarding, completion, and back again. */
(function () {
  const $ = id => document.getElementById(id);
  const I18N = window.NBE_I18N;

  /* ---- settings: config.js, then saved on the device, then the URL ---- */
  const STORE = 'nbe-kiosk-settings';
  const defaults = Object.assign({}, window.NBE_CONFIG);
  let cfg = Object.assign({}, defaults);
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(STORE) || '{}')); } catch (e) {}
  const q = new URLSearchParams(location.search);
  if (q.get('qr')) cfg.qrUrl = q.get('qr');
  if (q.get('lang')) cfg.defaultLang = q.get('lang');
  if (q.get('sound')) cfg.soundVolume = +q.get('sound');
  if (!cfg.arabicEnabled) cfg.defaultLang = 'en';
  document.body.classList.toggle('en-only', !cfg.arabicEnabled);

  /* ---- brand marks ---- */
  const GOLD = `<linearGradient id="nbeGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7D44F"/><stop offset="1" stop-color="#E0823A"/></linearGradient>`;
  const GOLDL = `<linearGradient id="nbeGoldL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F7D44F"/><stop offset="1" stop-color="#E0823A"/></linearGradient>`;
  const MARK = `<path class="m-arch" d="M211.19 7H180.91C176.87 7 173.6 10.26 173.6 14.3V44.97C173.6 48.72 175.87 51.81 179.52 52.21V12.97H212.62V52.21C216.23 51.77 218.5 48.7 218.5 44.97V14.3C218.5 10.26 215.23 7 211.19 7Z"/><path fill="url(#nbeGold)" d="M184.23 18.72C184.12 19.34 184.07 19.98 184.07 20.64C184.07 27.24 189.43 32.59 196.05 32.59C202.66 32.59 208.03 27.24 208.03 20.64C208.03 19.98 207.98 19.34 207.87 18.72Z"/><path fill="url(#nbeGold)" d="M184.14 36.56V53.18C184.14 57.28 187.12 58.03 188.65 58.14H189.57V36.56ZM193.34 58.14H198.75V36.56H193.34ZM202.53 36.56V58.14H203.45C204.93 58.03 207.7 57.35 207.95 53.71V36.56Z"/>`;
  const logoSvg = () => `<svg class="nbe-logo" viewBox="0 0 225 65" role="img" aria-label="National Bank of Egypt"><defs>${GOLD}${GOLDL}</defs><path class="m-word" d="${window.NBE_WORDMARK}"/><rect x="6.3" y="39.4" width="160.800" height="3.200" fill="url(#nbeGoldL)"/>${MARK}</svg>`;
  const markSvg = () => `<svg class="nbe-mark" viewBox="171 5 50 55" aria-hidden="true"><defs>${GOLD}</defs>${MARK}</svg>`;

  /* ---- scale the 1080 x 1920 stage to whatever window it runs in ---- */
  const stageEl = $('stage');
  function fit() {
    const k = Math.min(innerWidth / 1080, innerHeight / 1920);
    stageEl.style.transform = `translate(${(innerWidth - 1080 * k) / 2}px, ${(innerHeight - 1920 * k) / 2}px) scale(${k})`;
  }
  addEventListener('resize', fit); fit();

  /* ---- sound, synthesised so nothing has to be loaded ---- */
  let ac = null;
  function sound(kind) {
    if (!cfg.soundVolume) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const t = ac.currentTime, v = cfg.soundVolume;
      const tone = (f, at, dur, g, type, to) => {
        const o = ac.createOscillator(), a = ac.createGain();
        o.type = type || 'sine'; o.frequency.setValueAtTime(f, t + at);
        if (to) o.frequency.exponentialRampToValueAtTime(to, t + at + dur);
        a.gain.setValueAtTime(0, t + at);
        a.gain.linearRampToValueAtTime(g * v, t + at + .012);
        a.gain.exponentialRampToValueAtTime(.0001, t + at + dur);
        o.connect(a).connect(ac.destination); o.start(t + at); o.stop(t + at + dur + .02);
      };
      if (kind === 'tap') tone(620, 0, .09, .22, 'sine', 460);
      if (kind === 'key') tone(1500 + Math.random() * 240, 0, .03, .05, 'triangle');
      if (kind === 'deny') tone(190, 0, .13, .22, 'sine', 150);
      if (kind === 'step') tone(330, 0, .32, .13, 'sine', 660);
      if (kind === 'ping') { tone(1180, 0, .16, .15); tone(1570, .09, .24, .13); }
      if (kind === 'rise') { tone(196, 0, 1.3, .3, 'sine', 392); tone(392, .25, 1.1, .14, 'sine', 784); }
      if (kind === 'win') [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * .09, .9, .17, 'triangle'));
    } catch (e) {}
  }

  /* ---- world ---- */
  const scene = window.NBEScene.create($('gl'));
  if (!scene) { document.body.classList.add('no-gl'); $('flatEmblem').innerHTML = markSvg(); }
  else scene.start();
  const world = {
    goto: (n, r) => scene && scene.goto(n, r), handoff: d => scene ? scene.handoff(d) : new Promise(r => setTimeout(r, d * .6)),
    burst: () => scene && scene.burst(), tint: v => scene && scene.tint(v), pulse: () => scene && scene.pulse(), jump: n => scene && scene.jump(n)
  };

  /* ---- state ---- */
  let lang = cfg.defaultLang === 'ar' ? 'ar' : 'en';
  let stage = 'boot', busy = false;
  let attractTimer = 0, attractLang = lang;

  const FLYERS = [null, null, 'id', 'email', 'phone', null, 'bank', 'card', null];

  const flow = window.NBEFlow.create({
    logoSvg, markSvg, sound,
    canSwitchLang: () => !!cfg.arabicEnabled,
    onStep(n, total) { setCaption(n, total); world.pulse(); sound('step'); },
    onSuccess() { sound('win'); world.tint(1); },
    onFinish() { toDone(); },
    onExit() { toWelcomeFromFlow(); },
    onLang() { toggleLang(); }
  });

  /* ---- text ---- */
  const lines = (a, b) => `<span class="line"><span>${a}</span></span><span class="line"><span>${b}</span></span>`;
  function applyDir(el, l) { el.dir = l === 'ar' ? 'rtl' : 'ltr'; el.lang = l; }

  function paintAttract(l) {
    const t = I18N[l];
    const box = $('attract');
    box.classList.remove('in'); void box.offsetWidth;
    applyDir(box, l);
    $('attractTitle').innerHTML = lines(t.attractL1, t.attractL2);
    $('attractSub').textContent = t.attractSub;
    $('attractCta').textContent = t.attractCta;
    box.classList.add('in');
  }
  function paintChrome() {
    const t = I18N[lang];
    applyDir(document.documentElement, lang);
    ['welcome', 'onboard', 'done', 'idle', 'chrome'].forEach(id => applyDir($(id), lang));
    $('welcomeTitle').innerHTML = lines(t.welcomeL1, t.welcomeL2);
    $('welcomeSub').textContent = t.welcomeSub;
    $('getStartedLabel').textContent = t.getStarted;
    $('trackHint').textContent = t.trackHint;
    $('trackDemo').textContent = t.trackDemo;
    $('doneTitle').innerHTML = lines(t.doneL1, t.doneL2);
    $('doneSub').textContent = t.doneSub;
    $('doneScan').textContent = t.doneScan;
    $('restartLabel').textContent = t.restart;
    $('idleTitle').textContent = t.idleTitle;
    $('idleSub').textContent = t.idleSub;
    $('langBtn').textContent = t.langSwitch;
    $('exitBtn').textContent = t.exit;
    if (stage === 'onboard') setCaption(flow.step(), flow.total, true);
  }
  function setCaption(n, total, silent) {
    const t = I18N[lang], title = $('capTitle');
    $('trackFill').style.inlineSize = `${(n / (total - 1)) * 100}%`;
    title.textContent = t.captions[n];
    if (!silent) {
      const c = title.parentElement;
      c.classList.remove('swap'); void c.offsetWidth; c.classList.add('swap');
      const f = $('flyer'), src = FLYERS[n];
      f.classList.remove('show');
      if (src) setTimeout(() => { if (flow.step() === n) { f.src = `assets/img/${src}.webp`; f.classList.add('show'); } }, 260);
      world.tint(n / (total - 1) * .8);
    }
  }
  function toggleLang() {
    lang = lang === 'en' ? 'ar' : 'en';
    flow.setLang(lang); paintChrome();
    document.body.classList.add('lang-swap');
    setTimeout(() => document.body.classList.remove('lang-swap'), 520);
    sound('tap');
  }

  /* ---- stage changes ---- */
  function setStage(n) { stage = n; document.body.dataset.stage = n; }

  function toAttract() {
    clearTimers();
    hideIdle();
    setStage('attract');
    lang = cfg.defaultLang === 'ar' ? 'ar' : 'en';
    attractLang = lang;
    flow.reset(); flow.setLang(lang); paintChrome();
    paintAttract(attractLang);
    world.goto('attract', 1.3); world.tint(0);
    $('flyer').classList.remove('show');
    if (cfg.arabicEnabled) attractTimer = setInterval(() => {
      attractLang = attractLang === 'en' ? 'ar' : 'en';
      paintAttract(attractLang);
    }, cfg.attractSwapSeconds * 1000);
    busy = false;
  }

  async function toWelcome() {
    if (busy) return; busy = true;
    clearInterval(attractTimer);
    lang = attractLang; flow.setLang(lang); paintChrome();
    document.body.classList.add('flying');
    sound('rise');
    const moved = world.handoff(1500);
    await new Promise(r => setTimeout(r, 420));
    setStage('welcome'); // the phone starts rising as the emblem sinks
    busy = false; arm(); // Get Started works as soon as it appears
    await moved;
    if (stage !== 'attract') world.jump(stage);
    document.body.classList.remove('flying');
  }

  function toOnboard() {
    if (busy) return; busy = true;
    setStage('onboard');
    world.goto('onboard', 1.2);
    setCaption(flow.step(), flow.total);
    sound('step');
    setTimeout(() => { flow.setInteractive(true); busy = false; }, 1000);
    arm();
  }

  function toWelcomeFromFlow() {
    flow.setInteractive(false);
    setStage('welcome'); world.goto('welcome', 1.2); $('flyer').classList.remove('show');
    arm();
  }

  function toDone() {
    if (busy || stage === 'done') return; busy = true;
    flow.setInteractive(false);
    setStage('done');
    world.goto('done', 1.5);
    $('flyer').classList.remove('show');
    setTimeout(() => { world.burst(); sound('win'); }, 650);
    renderQr();
    clearTimers();
    runRestartRing();
    setTimeout(() => { busy = false; }, 900);
  }

  /* ---- QR ---- */
  function qrSvg(url) {
    const qr = window.qrcode(0, 'H');
    qr.addData(url); qr.make();
    const n = qr.getModuleCount(), q = 4, size = n + q * 2;
    const inFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    // Clear room for the emblem in the middle; level H recovers the covered modules.
    const hole = Math.floor(n * .24 / 2) * 2 + 1, h0 = (n - hole) / 2, h1 = h0 + hole;
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c) || inFinder(r, c)) continue;
      if (r >= h0 && r < h1 && c >= h0 && c < h1) continue;
      const x = c + q, y = r + q;
      d += `M${x + .1} ${y + .5}a.4 .4 0 0 1 .8 0a.4 .4 0 0 1-.8 0`;
    }
    const finder = (x, y) => `<rect x="${x + .5}" y="${y + .5}" width="6" height="6" rx="1.7" fill="none" stroke="#00643E"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx=".8" fill="#00643E"/>`;
    const m = (n - hole) / 2 + q;
    return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="QR code" data-url="${url.replace(/"/g, '&quot;')}">
      <rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#00643E"/>
      ${finder(q, q)}${finder(q + n - 7, q)}${finder(q, q + n - 7)}
      <svg x="${m + .6}" y="${m + .6}" width="${hole - 1.2}" height="${hole - 1.2}" viewBox="171 5 50 55"><defs>${GOLD.replace('nbeGold', 'nbeGoldQ')}</defs>${MARK.replace(/nbeGold/g, 'nbeGoldQ').replace('class="m-arch"', 'fill="#006241"')}</svg>
    </svg>`;
  }
  function renderQr() {
    $('qrRow').innerHTML = `<figure class="qr-frame"><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i><div class="qr">${qrSvg(cfg.qrUrl)}</div><div class="beam"></div></figure>`;
  }

  /* ---- inactivity ---- */
  let idleT = 0, countT = 0, restartT = 0, ringAnim = null;
  function clearTimers() { clearTimeout(idleT); clearInterval(countT); clearTimeout(restartT); clearInterval(attractTimer); if (ringAnim) { ringAnim.cancel(); ringAnim = null; } }
  function arm() {
    clearTimeout(idleT);
    if (stage === 'welcome' || stage === 'onboard') idleT = setTimeout(showIdle, cfg.idleSeconds * 1000);
  }
  function showIdle() {
    let left = cfg.idleCountdownSeconds;
    $('idleCount').textContent = left;
    $('idle').classList.add('on');
    const ring = $('idleRing');
    ring.style.transition = 'none'; ring.style.strokeDashoffset = 0; void ring.getBoundingClientRect();
    ring.style.transition = `stroke-dashoffset ${left}s linear`; ring.style.strokeDashoffset = 100;
    countT = setInterval(() => {
      left--; $('idleCount').textContent = Math.max(left, 0);
      if (left <= 0) { clearInterval(countT); toAttract(); }
    }, 1000);
  }
  function hideIdle() { clearInterval(countT); $('idle').classList.remove('on'); }
  function runRestartRing() {
    const ring = $('restartRing');
    ringAnim = ring.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: 100 }], { duration: cfg.completionSeconds * 1000, fill: 'forwards' });
    restartT = setTimeout(toAttract, cfg.completionSeconds * 1000);
  }

  // Any touch counts as a visitor still being here.
  document.addEventListener('pointerdown', e => {
    if ($('admin').classList.contains('on')) return;
    if ($('idle').classList.contains('on')) { hideIdle(); e.stopPropagation(); arm(); return; }
    if (stage === 'done') { clearTimeout(restartT); if (ringAnim) ringAnim.cancel(); runRestartRing(); }
    arm();
  }, true);
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dragstart', e => e.preventDefault());

  /* ---- wiring ---- */
  $('attract').addEventListener('click', toWelcome);
  $('getStarted').addEventListener('click', toOnboard);
  $('restart').addEventListener('click', () => { sound('tap'); toAttract(); });
  $('langBtn').addEventListener('click', toggleLang);
  $('exitBtn').addEventListener('click', () => { sound('tap'); toAttract(); });

  // Phone leans gently toward the touch
  const tilt = $('phoneTilt');
  document.addEventListener('pointermove', e => {
    const r = stageEl.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    tilt.style.setProperty('--ry', `${x * 5}deg`); tilt.style.setProperty('--rx', `${-y * 3}deg`);
  });

  /* ---- staff settings: hold the logo for three seconds ---- */
  $('logo').innerHTML = '<img src="assets/img/logo-white.png" alt="">';
  let holdT = 0;
  $('logo').addEventListener('pointerdown', () => { holdT = setTimeout(openAdmin, 3000); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => $('logo').addEventListener(ev, () => clearTimeout(holdT)));
  function openAdmin() {
    $('aQr').value = cfg.qrUrl; $('aIdle').value = cfg.idleSeconds; $('aCount').value = cfg.idleCountdownSeconds;
    $('aDone').value = cfg.completionSeconds; $('aVol').value = cfg.soundVolume; $('aLang').value = cfg.defaultLang;
    $('admin').classList.add('on'); clearTimeout(idleT);
  }
  $('aCancel').addEventListener('click', () => { $('admin').classList.remove('on'); arm(); });
  $('aReset').addEventListener('click', () => { try { localStorage.removeItem(STORE); } catch (e) {} cfg = Object.assign({}, defaults); openAdmin(); });
  $('admin').addEventListener('submit', e => {
    e.preventDefault();
    const saved = { qrUrl: $('aQr').value.trim(), idleSeconds: +$('aIdle').value, idleCountdownSeconds: +$('aCount').value, completionSeconds: +$('aDone').value, soundVolume: +$('aVol').value, defaultLang: $('aLang').value };
    Object.assign(cfg, saved);
    try { localStorage.setItem(STORE, JSON.stringify(saved)); } catch (err) {}
    $('admin').classList.remove('on');
    if (stage === 'done') renderQr();
    arm();
  });

  /* ---- go ---- */
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {});
  flow.reset();
  toAttract();

  // Test hook for staff and QA
  window.NBE = { to: { attract: toAttract, welcome: toWelcome, onboard: toOnboard, done: toDone }, flow, cfg };
})();

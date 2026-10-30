/*
 * The nine NBE Mobile screens from the design file, rebuilt as a live prototype.
 * Visitors never type: touching a field fills it with demo data, so no personal
 * information is ever entered on the booth screen.
 */
window.NBEFlow = (function () {
  const ICONS = window.NBE_ICONS;
  const chevron = '<svg class="chev flip" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const down = '<svg class="down" viewBox="0 0 24 24"><path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const back = '<svg class="flip" viewBox="0 0 24 24"><path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const close = '<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
  const tick = '<svg viewBox="0 0 24 24"><path d="M6 12.500l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const pin = '<svg viewBox="0 0 24 24"><path d="M12 21s7-6.200 7-11.500A7 7 0 0 0 5 9.500C5 14.800 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.400"/><circle cx="12" cy="9.500" r="2.600" fill="none" stroke="currentColor" stroke-width="1.400"/></svg>';
  const plus = '<svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16" fill="none" stroke="currentColor" stroke-width="1.600" stroke-linecap="round"/></svg>';

  const DEMO = { nid: '2900101••••••••', passport: 'A••••••72', email: 'visitor@nbe-demo.com', mobile: '10••••••84', otp: '482916' };
  const TOTAL = 9, OTP_LEN = 6;

  function fresh() {
    return { step: 0, idType: 'nid', nid: '', passport: '', email: '', same: false, mobile: '', otp: '', timer: 59,
      bank: { currency: 0, type: 0, account: 0, purpose: null, gov: null }, name: 0, physical: false, agree: false };
  }

  function create(opts) {
    const views = document.getElementById('views');
    const statusbar = document.getElementById('statusbar');
    let s = fresh(), lang = 'en', interactive = false, timers = [], typing = false, current = null;
    const P = () => window.NBE_I18N[lang].p;

    const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
    function clearTimers() { timers.forEach(clearTimeout); timers.forEach(clearInterval); timers = []; }

    /* ---- pieces ---- */
    const nav = (title, progress, orange) => `
      <header class="nav ${progress != null ? 'with-progress' : ''}">
        <div class="nav-row">
          <button class="round" data-act="back" type="button">${back}</button>
          ${title ? `<div class="nav-title ${orange || ''}">${title}</div>` : ''}
        </div>
        ${progress != null ? `<div class="segs">${Array.from({ length: 10 }, (_, i) => `<i class="${i < progress ? 'on' : ''}"></i>`).join('')}</div>` : ''}
      </header>`;
    const cta = (label, act, arrow) => `<button class="btn" data-act="${act}" data-cta type="button"><span>${label}</span>${arrow ? chevron : ''}</button>`;
    const field = (key, label, value, ltr) => `
      <button class="field ${value ? 'has' : ''}" data-act="fill:${key}" data-field="${key}" type="button">
        <span class="ph">${label}</span><span class="val" ${ltr ? 'dir="ltr"' : ''}>${value || ''}</span>
      </button>`;
    const select = (key, label, value) => `
      <button class="select ${value != null ? 'has' : ''}" data-act="sheet:${key}" data-field="${key}" type="button">
        <span class="sel-text"><span class="ph">${label}</span><span class="val">${value != null ? value : ''}</span></span>${down}
      </button>`;

    /* ---- screens ---- */
    const screens = [
      // 0 Login
      () => { const p = P(); return `
        <div class="scr login">
          <div class="lang-row"><button class="lang-pill" data-act="lang" type="button"><span class="ico">${ICONS.globe}</span><span>${p.lang}</span></button></div>
          <div class="brand">${opts.logoSvg()}</div>
          <button class="field" data-act="inapp" type="button"><span class="ph">${p.userId}</span></button>
          <button class="link start" data-act="inapp" type="button">${p.trouble}</button>
          <button class="face" data-act="inapp" type="button" aria-label="Face ID"><svg viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><path class="f-corners" d="M6 17V6h11M39 6h11v11M50 39v11H39M17 50H6V39"/><rect class="f-scan" x="13" y="0" width="30" height="2" rx="1" fill="currentColor" stroke="none"/><path d="M19 21v5M37 21v5M28 20v10.500c0 1.500-1 2.500-3 2.500M18 39c6 4 14 4 20 0" stroke-linecap="round"/></svg></button>
          <button class="btn" data-act="inapp" type="button"><span>${p.login}</span></button>
          <button class="btn orange" data-act="next" data-primary type="button"><span>${p.register}</span></button>
          <button class="link scan" data-act="inapp" type="button"><span class="ico">${ICONS.qr}</span>${p.scan}</button>
          <button class="link dark" data-act="inapp" type="button">${p.track}</button>
          <div class="tiles">
            ${[ICONS.cal, ICONS.pin, ICONS.fx, ICONS.fx].map((ic, i) => `<button class="tile" data-act="inapp" type="button" style="--i:${i}"><span class="ico">${ic}</span><span>${p.tiles[i]}</span></button>`).join('')}
          </div>
        </div>`; },
      // 1 Documents
      () => { const p = P(); return `
        <div class="scr docs">
          <div class="docs-hero">
            <img src="assets/img/docs-hero.webp" alt="">
            <button class="round" data-act="back" type="button">${back}</button>
            <div class="docs-title"><b>${p.docsA}</b><span>${p.docsB}</span></div>
          </div>
          <ul class="doc-list">
            ${p.docs.map((d, i) => `<li style="--i:${i}"><span class="ico">${ICONS['d' + (i + 1)]}</span>${d}</li>`).join('')}
          </ul>
          <div class="pad">${`<button class="btn" data-act="next" data-primary type="button"><span>${p.letsStart}</span></button>`}</div>
        </div>`; },
      // 2 Identity
      () => { const p = P(); const nid = s.idType === 'nid'; return `
        <div class="scr tinted">
          ${nav(p.become, null, 'orange start')}
          <div class="hero center"><img class="ill" src="assets/img/id.webp" alt=""></div>
          <div class="pad">
            <div class="seg" data-on="${s.idType}">
              <i class="seg-thumb"></i>
              <button data-act="idType:nid" type="button">${p.nid}</button>
              <button data-act="idType:passport" type="button">${p.passport}</button>
            </div>
            ${nid ? field('nid', p.nid, s.nid, true) : field('passport', p.passportNo, s.passport, true)}
          </div>
          <div class="foot">${cta(p.next, 'next', true)}</div>
        </div>`; },
      // 3 Email
      () => { const p = P(); return `
        <div class="scr tinted">
          ${nav('', 1)}
          <div class="pad">
            <img class="ill start" src="assets/img/email.webp" alt="">
            <h3>${p.emailQ}</h3><p class="sub">${p.emailSub}</p>
            ${field('email', p.emailPh, s.email, true)}
          </div>
          <div class="foot">${cta(p.saveContinue, 'next', true)}</div>
        </div>`; },
      // 4 Mobile
      () => { const p = P(); return `
        <div class="scr tinted">
          ${nav('', 2)}
          <div class="pad">
            <img class="ill start" src="assets/img/phone.webp" alt="">
            <h3>${p.sameQ} <bdi dir="ltr">+2010******84</bdi>?</h3><p class="sub">${p.sameSub}</p>
            <div class="radio-group">
              <button class="radio ${s.same ? 'on' : ''}" data-act="same:1" type="button"><span>${p.sameYes}</span><i class="dot">${tick}</i></button>
              <button class="radio ${!s.same ? 'on' : ''}" data-act="same:0" type="button"><span>${p.sameNo}</span><i class="dot">${tick}</i></button>
            </div>
            <div class="mobile-row ${s.same ? 'gone' : ''}" dir="ltr">
              <div class="cc"><img src="assets/img/flag.webp" alt=""><span>+2</span></div>
              ${field('mobile', p.mobile, s.mobile, true)}
            </div>
          </div>
          <div class="foot">${cta(p.next, 'next', true)}</div>
        </div>`; },
      // 5 OTP
      () => { const p = P(); return `
        <div class="scr plain">
          ${nav(p.otpNav, null, 'orange center')}
          <div class="pad">
            <h3 class="mt">${p.otpTitle}</h3>
            <p class="sub">${p.otpSub} <bdi dir="ltr">+2010******84</bdi></p>
            <div class="otp" dir="ltr">
              ${Array.from({ length: OTP_LEN }, (_, i) => `<button class="otp-box ${s.otp[i] ? 'has' : ''}" data-act="otp" type="button">${s.otp[i] || '_'}</button>`).join('')}
            </div>
            <div class="resend">${p.resend} <bdi dir="ltr" id="otpTimer">00:${String(s.timer).padStart(2, '0')}</bdi></div>
          </div>
          <div class="foot">${cta(p.verify, 'next')}</div>
          <button class="sms" data-act="otp" type="button">
            <span class="sms-icon"><img src="assets/img/emblem.png" alt=""></span>
            <span class="sms-text"><b>${p.smsFrom}<em>${p.smsNow}</em></b><span>${p.smsBody} <bdi dir="ltr">${DEMO.otp}</bdi></span><u>${p.smsTap}</u></span>
          </button>
        </div>`; },
      // 6 Bank & account
      () => { const p = P(), o = p.opts, b = s.bank; return `
        <div class="scr tinted long">
          ${nav('', 7)}
          <div class="scroller" data-scroll>
            <div class="pad">
              <img class="ill start" src="assets/img/bank.webp" alt="">
              <h3>${p.bankTitle}</h3>
              <p class="q">${p.bankQ}</p>
              ${select('currency', p.currency, o.currency[b.currency])}
              ${select('type', p.accType, o.type[b.type])}
              ${select('account', p.selAcc, o.account[b.account])}
              <div class="end"><button class="link under" data-act="inapp" type="button">${p.accDetails}</button></div>
              ${select('purpose', p.purpose, b.purpose != null ? o.purpose[b.purpose] : null)}
              <div class="mid"><button class="mini" data-act="inapp" type="button">${plus}${p.additional}</button></div>
              <p class="q">${p.branchQ}</p>
              ${select('gov', p.gov, b.gov != null ? o.gov[b.gov] : null)}
              ${select('area', p.area, b.gov != null ? o.area[b.gov] : null)}
              ${select('city', p.city, b.gov != null ? o.city[b.gov] : null)}
              <div class="mid"><button class="link" data-act="nearest" type="button"><span class="ico sm">${pin}</span>${p.nearest}</button></div>
              ${cta(p.saveContinue, 'next', true)}
              <div style="height:34px"></div>
            </div>
          </div>
          <div class="sheet-wrap" data-sheet></div>
        </div>`; },
      // 7 Debit card
      () => { const p = P(); return `
        <div class="scr tinted">
          ${nav('', 10)}
          <div class="pad">
            <div class="card-wrap"><img src="assets/img/card.webp" alt=""><span class="card-name" dir="ltr" id="cardName">${window.NBE_I18N.en.p.names[s.name].toUpperCase()}</span></div>
            <h3 class="center">${p.cardTitle}</h3><p class="sub center">${p.cardSub}</p>
            <p class="q">${p.cardName}</p>
            <div class="chips">${p.names.map((n, i) => `<button class="chip ${i === s.name ? 'on' : ''}" data-act="name:${i}" type="button">${n}</button>`).join('')}</div>
            <button class="check-row phys ${s.physical ? 'on' : ''}" data-act="physical" type="button"><i class="dot big">${tick}</i><span><span>${p.physical}</span><u>${p.charges}</u></span></button>
          </div>
          <div class="foot stack">
            <button class="check-row terms ${s.agree ? 'on' : ''}" data-act="agree" data-field="agree" type="button"><i class="dot big soft">${tick}</i><span>${p.terms}</span></button>
            ${cta(p.submit, 'next', true)}
          </div>
        </div>`; },
      // 8 Success
      () => { const p = P(); return `
        <div class="scr tinted">
          <header class="nav"><div class="nav-row"><button class="round" data-act="finish" type="button">${close}</button></div></header>
          <div class="ok">
            <div class="ok-mark">
              ${Array.from({ length: 20 }, (_, i) => `<i style="--a:${i * 18}deg;--d:${(i % 5) * 60}ms"></i>`).join('')}
              <svg class="ok-ring" viewBox="0 0 120 120"><circle cx="60" cy="60" r="58" pathLength="100"/></svg>
              <div class="ok-disc"><svg viewBox="0 0 48 48"><path d="M14 25l7 7 13-15" pathLength="100"/></svg></div>
            </div>
            <h4>${p.okTitle}</h4><p class="sub center">${p.okSub}</p>
            <div class="sr" dir="ltr">SR# 123456789</div>
          </div>
          <div class="foot"><button class="btn" data-act="finish" data-primary type="button"><span>${p.done}</span></button></div>
        </div>`; }
    ];

    /* ---- gating and the glow that shows where to touch ---- */
    function ready() {
      const b = s.bank;
      switch (s.step) {
        case 2: return !!(s.idType === 'nid' ? s.nid : s.passport);
        case 3: return !!s.email;
        case 4: return s.same || !!s.mobile;
        case 5: return s.otp.length === OTP_LEN;
        case 6: return b.purpose != null && b.gov != null;
        case 7: return s.agree;
        default: return true;
      }
    }
    function hintTarget(root) {
      const q = sel => root.querySelector(sel);
      if (ready()) return q('[data-cta]') || q('[data-primary]');
      switch (s.step) {
        case 2: return q(`[data-field="${s.idType}"]`);
        case 3: return q('[data-field="email"]');
        case 4: return q('[data-field="mobile"]');
        case 5: return null; // the SMS banner carries its own glow
        case 6: return q(s.bank.purpose == null ? '[data-field="purpose"]' : '[data-field="gov"]');
        case 7: return q('[data-field="agree"]');
      }
      return null;
    }
    function sync(keepHint) {
      if (!current) return;
      current.querySelectorAll('.hint').forEach(e => e.classList.remove('hint'));
      const c = current.querySelector('[data-cta]');
      if (c) c.classList.toggle('off', !ready());
      if (!interactive) return;
      const t = hintTarget(current);
      if (t) t.classList.add('hint');
      if (s.step === 6 && t && !keepHint) {
        const sc = current.querySelector('[data-scroll]');
        const top = t.offsetTop - sc.clientHeight * .5 + t.offsetHeight / 2;
        sc.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    }

    /* ---- rendering ---- */
    function mount(animated, dir) {
      const el = document.createElement('div');
      el.className = 'view';
      el.innerHTML = screens[s.step]();
      el.dir = lang === 'ar' ? 'rtl' : 'ltr';
      const old = current;
      current = el;
      views.appendChild(el);
      statusbar.classList.toggle('light', s.step === 1);
      if (old) {
        if (animated) {
          const sign = (dir || 1) * (lang === 'ar' ? -1 : 1);
          old.style.setProperty('--out', `${-28 * sign}%`);
          el.style.setProperty('--in', `${100 * sign}%`);
          old.classList.add('leaving'); el.classList.add('entering');
          setTimeout(() => old.remove(), 640);
          setTimeout(() => el.classList.remove('entering'), 1150); // after the illustration lands
        } else old.remove();
      }
      sync(true); // a new screen always opens at its top
    }

    function enterStep() {
      if (s.step === 5) {
        const tid = setInterval(() => {
          if (s.timer > 0) s.timer--;
          const t = document.getElementById('otpTimer');
          if (t) t.textContent = '00:' + String(s.timer).padStart(2, '0');
        }, 1000);
        timers.push(tid);
        if (s.otp.length < OTP_LEN) later(() => {
          const b = current.querySelector('.sms');
          if (b) { b.classList.add('show'); opts.sound('ping'); }
        }, 1300);
      }
      if (s.step === 8) opts.onSuccess();
    }

    function go(n) {
      if (n === s.step) return;
      clearTimers(); typing = false;
      const dir = n > s.step ? 1 : -1;
      s.step = n;
      mount(true, dir);
      opts.onStep(n, TOTAL);
      enterStep();
    }

    function typeInto(key, value) {
      if (typing) return;
      const f = current.querySelector(`[data-field="${key}"]`);
      if (!f) return;
      typing = true;
      f.classList.remove('hint'); f.classList.add('has', 'typing');
      const out = f.querySelector('.val');
      const stepAt = s.step;
      let i = 0;
      (function tickChar() {
        if (s.step !== stepAt) { typing = false; return; }
        i++;
        out.textContent = value.slice(0, i);
        opts.sound('key');
        if (i < value.length) later(tickChar, 34 + Math.random() * 30);
        else {
          s[key] = value; typing = false;
          f.classList.remove('typing');
          sync();
        }
      })();
    }

    function fillOtp() {
      if (typing || s.otp.length === OTP_LEN) return;
      typing = true;
      const sms = current.querySelector('.sms');
      if (sms) sms.classList.remove('show');
      const boxes = current.querySelectorAll('.otp-box');
      let i = 0;
      (function next() {
        s.otp = DEMO.otp.slice(0, i + 1);
        boxes[i].textContent = DEMO.otp[i];
        boxes[i].classList.add('has');
        opts.sound('key');
        i++;
        if (i < OTP_LEN) later(next, 120); else { typing = false; sync(); }
      })();
    }

    function openSheet(key) {
      const p = P(), wrap = current.querySelector('[data-sheet]');
      const titles = { currency: p.currency, type: p.accType, account: p.selAcc, purpose: p.purpose, gov: p.gov, area: p.gov, city: p.gov };
      const k = (key === 'area' || key === 'city') ? 'gov' : key;
      const cur = s.bank[k];
      wrap.innerHTML = `
        <div class="sheet-back" data-act="sheetClose"></div>
        <div class="sheet"><i class="grab"></i><h5>${titles[key]}</h5>
          ${p.opts[k].map((o, i) => `<button class="sheet-opt ${cur === i ? 'on' : ''}" data-act="pick:${k}:${i}" type="button"><span>${o}</span><i class="dot">${tick}</i></button>`).join('')}
        </div>`;
      requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
      current.querySelectorAll('.hint').forEach(e => e.classList.remove('hint'));
    }
    function closeSheet() {
      const wrap = current.querySelector('[data-sheet]');
      if (!wrap) return;
      wrap.classList.remove('open');
      later(() => { wrap.innerHTML = ''; }, 320);
    }
    function setSelect(key, text) {
      const f = current.querySelector(`[data-field="${key}"]`);
      if (!f) return;
      f.classList.add('has', 'filled');
      f.querySelector('.val').textContent = text;
      setTimeout(() => f.classList.remove('filled'), 700);
    }
    function pick(k, i) {
      const o = P().opts;
      s.bank[k] = i;
      setSelect(k, o[k][i]);
      closeSheet();
      if (k === 'gov') {
        later(() => { setSelect('area', o.area[i]); opts.sound('key'); }, 240);
        later(() => { setSelect('city', o.city[i]); opts.sound('key'); }, 460);
        later(sync, 620);
      } else later(sync, 200);
    }

    function toast(msg) {
      const old = document.querySelector('.toast'); if (old) old.remove();
      const t = document.createElement('div');
      t.className = 'toast'; t.textContent = msg;
      document.getElementById('screen').appendChild(t);
      setTimeout(() => t.remove(), 1900);
      if (current) {
        const h = current.querySelector('.hint');
        if (h) { h.classList.remove('hint'); void h.offsetWidth; h.classList.add('hint'); }
      }
    }

    /* ---- touch ---- */
    views.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b || !interactive) return;
      if (b.hasAttribute('data-cta') && b.classList.contains('off')) {
        const h = current.querySelector('.hint');
        if (h) { h.classList.remove('hint'); void h.offsetWidth; h.classList.add('hint'); }
        opts.sound('deny');
        return;
      }
      const [act, a, c] = b.dataset.act.split(':');
      opts.sound('tap');
      switch (act) {
        case 'next': go(s.step + 1); break;
        case 'back': if (s.step === 0) opts.onExit(); else go(s.step - 1); break;
        case 'finish': opts.onFinish(); break;
        case 'lang': if (opts.canSwitchLang()) opts.onLang(); else toast(P().inApp); break;
        case 'inapp': toast(P().inApp); break;
        case 'fill': typeInto(a, DEMO[a]); break;
        case 'idType':
          if (s.idType !== a) { s.idType = a; const sc = current; sc.innerHTML = screens[2](); sc.querySelector('.seg').dataset.on = a; sync(); }
          break;
        case 'same': {
          s.same = a === '1';
          current.querySelectorAll('.radio').forEach((r, i) => r.classList.toggle('on', (i === 0) === s.same));
          current.querySelector('.mobile-row').classList.toggle('gone', s.same);
          sync(); break;
        }
        case 'otp': fillOtp(); break;
        case 'sheet': openSheet(a); break;
        case 'sheetClose': closeSheet(); later(sync, 200); break;
        case 'pick': pick(a, +c); break;
        case 'nearest': if (s.bank.gov == null) pick('gov', 0); break;
        case 'name': {
          s.name = +a;
          current.querySelectorAll('.chip').forEach((r, i) => r.classList.toggle('on', i === s.name));
          const n = document.getElementById('cardName');
          n.textContent = window.NBE_I18N.en.p.names[s.name].toUpperCase();
          n.classList.remove('stamp'); void n.offsetWidth; n.classList.add('stamp');
          break;
        }
        case 'physical': s.physical = !s.physical; b.classList.toggle('on', s.physical); break;
        case 'agree': s.agree = !s.agree; b.classList.toggle('on', s.agree); sync(); break;
      }
    });

    return {
      reset() { clearTimers(); typing = false; s = fresh(); interactive = false; views.innerHTML = ''; current = null; mount(false); },
      setInteractive(v) { interactive = v; sync(); },
      setLang(l) {
        lang = l;
        const sc = current && current.querySelector('[data-scroll]');
        const top = sc ? sc.scrollTop : 0;
        typing = false;
        const pending = s.step === 5 && s.otp.length < OTP_LEN;
        mount(false);
        const nsc = current.querySelector('[data-scroll]');
        if (nsc) nsc.scrollTop = top;
        if (pending) { const b = current.querySelector('.sms'); if (b) b.classList.add('show'); }
      },
      step: () => s.step,
      total: TOTAL
    };
  }
  return { create };
})();

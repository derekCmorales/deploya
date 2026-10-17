/* Motor de la presentación: un reloj (la voz) maneja todas las escenas.
   Todo se calcula a partir del tiempo t, así que se puede pausar, adelantar
   o renderizar cuadro por cuadro para exportar el video. */
(() => {
  const TL = window.TIMELINE;
  const stage = document.getElementById('stage');
  const audio = document.getElementById('voz');
  const RENDER = new URLSearchParams(location.search).has('render');
  document.body.classList.add(RENDER ? 'render' : 'idle');

  /* ── Iconos (Lucide, trazo) ── */
  const IC = {
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
    branch: '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
    db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
    key: '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
    eyeoff: '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>',
    puzzle: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    rotate: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    square: '<rect width="14" height="14" x="5" y="5" rx="2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    card: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
    up: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    down: '<path d="m7 7 10 10"/><path d="M17 7v10H7"/>',
    plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
    door: '<path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    laptop: '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>',
    phone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    server: '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>',
    list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
    cpu: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  };
  const svgIcon = (name, s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[name] || ''}</svg>`;
  document.querySelectorAll('i[data-i]').forEach(el => { el.classList.add('ic'); el.innerHTML = svgIcon(el.dataset.i, +el.dataset.s || 20); });
  const CURSOR = '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M5 2.5 19 12l-6.2 1.3L9.6 20z" fill="#fff" stroke="#141413" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  document.querySelectorAll('.cursor').forEach(el => { el.innerHTML = CURSOR; });

  /* ── Utilidades de tiempo ── */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const eo = x => 1 - Math.pow(1 - x, 3);
  const eio = x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const prog = (lt, a, du) => clamp((lt - a) / du);
  const lerp = (a, b, p) => a + (b - a) * p;
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  /* ── Escenas y señales («@frase» = el momento en que la voz la dice) ── */
  const limpia = s => s.replace(/\[[^\]]*\]\s*/g, '').replace(/\s+/g, ' ').trim();
  const PESO = { '…': 7, '.': 4, '?': 4, '!': 4, ':': 3, ';': 3, ',': 2 };
  const pesoHasta = (txt, i) => { let w = 0; for (let k = 0; k < i; k++) w += PESO[txt[k]] || 1; return w; };
  const faltantes = [];

  const scenes = TL.escenas.map(e => ({ ...e, el: document.getElementById(e.id), limpio: limpia(e.texto), anims: [] }));
  scenes.forEach(sc => {
    const L = sc.limpio;
    sc.T = spec => {
      if (typeof spec === 'number') return spec;
      const s = String(spec).trim();
      if (!s.startsWith('@')) return parseFloat(s);
      const m = s.slice(1).match(/^(.*?)([+-]\d+(?:\.\d+)?)?$/);
      const frase = m[1].trim(); const off = m[2] ? parseFloat(m[2]) : 0;
      let i = L.indexOf(frase);
      if (i < 0) i = L.toLowerCase().indexOf(frase.toLowerCase());
      if (i < 0) { faltantes.push(`${sc.id}: ${frase}`); return sc.lead + off; }
      // Frase dentro de su oración: las oraciones vienen medidas sobre el audio real.
      const or = (sc.frases || []).find(f => i >= f.a && i < f.b);
      if (or) {
        const tramo = L.slice(or.a, or.b);
        const p = pesoHasta(tramo, i - or.a) / Math.max(1, pesoHasta(tramo, tramo.length));
        return sc.lead + lerp(or.t0, or.t1, p) + off;
      }
      return sc.lead + sc.voz * pesoHasta(L, i) / pesoHasta(L, L.length) + off;
    };
  });
  // La escena que entra queda encima de la que sale
  scenes.forEach((sc, i) => { sc.el.style.zIndex = i + 1; });

  /* ── Medir posiciones (para el cursor) con todo visible y sin animar ── */
  const k0 = () => stage.getBoundingClientRect().width / 1920;
  function centro(el) {
    const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(), k = k0();
    return { x: (r.left + r.width / 2 - s.left) / k, y: (r.top + r.height / 2 - s.top) / k };
  }

  /* ── Efectos de entrada y salida (Web Animations, controladas por t) ── */
  const FX = {
    up: [{ opacity: 0, transform: 'translateY(36px)' }, { opacity: 1, transform: 'translateY(0)' }],
    in: [{ opacity: 0 }, { opacity: 1 }],
    pop: [{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'scale(1)' }],
    blur: [{ opacity: 0, filter: 'blur(18px)', transform: 'scale(1.06)' }, { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' }],
    left: [{ opacity: 0, transform: 'translateX(-48px)' }, { opacity: 1, transform: 'translateX(0)' }],
    drop: [{ opacity: 0, transform: 'translateY(-42px)' }, { opacity: 1, transform: 'translateY(0)' }],
    rise: [{ opacity: 0, transform: 'translateY(90px) scale(.96)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }],
    wipe: [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }],
  };
  const DU = { up: .8, in: .6, pop: .7, blur: 1, left: .8, drop: .6, rise: 1.1, wipe: 1 };
  const conBase = (kf, base) => kf.map(f => (f.transform && base ? { ...f, transform: base + ' ' + f.transform } : f));

  function construirIntroWordmark() {
    const wm = document.getElementById('introWm');
    'deploy'.split('').forEach((ch, i) => { const s = document.createElement('span'); s.textContent = ch; s.style.display = 'inline-block'; s.dataset.fx = 'up'; s.dataset.at = String(3.7 + i * .06); wm.appendChild(s); });
    const a = document.createElement('span'); a.textContent = 'a'; a.className = 'a'; a.style.display = 'inline-block'; a.dataset.fx = 'pop'; a.dataset.at = '4.15'; a.dataset.du = '.9'; wm.appendChild(a);
  }
  construirIntroWordmark();

  // Bitácora de la escena 02
  const LOG02 = [
    ['12:04:01.112', 'recepción', 'Clonando github.com/derekcmorales/hola-deploya (main)'],
    ['12:04:02.911', 'recepción', 'Dockerfile encontrado · FROM node:22-alpine'],
    ['12:04:03.204', 'construcción', 'docker build -t hola-deploya:1 .'],
    ['12:05:12.480', 'construcción', 'Imagen lista · sha256:9f2c4e7a…e41a (48 MB)'],
    ['12:05:13.010', 'ejecución', 'Contenedor iniciado · 0.25 vCPU · 256 MB'],
    ['12:05:13.044', 'ejecución', '1 variable aplicada'],
    ['12:05:14.102', 'enrutamiento', 'hola-deploya.localhost → v1'],
    ['12:05:21.771', 'operación', 'Verificación de salud OK · GET / 200 en 38 ms'],
  ];
  const log02 = document.getElementById('log02');
  LOG02.forEach((l, i) => { const d = document.createElement('div'); d.className = 'll'; d.innerHTML = `<span class="n">${i + 1}</span><span class="t">${l[0]}</span><span class="s">${l[1]}</span><span>${l[2]}</span>`; d.style.opacity = 0; log02.appendChild(d); });

  // Puntos del relevo (escena 05) y paquetes (escena 09)
  const NS = 'http://www.w3.org/2000/svg';
  const dots05 = document.getElementById('dots05');
  for (let i = 0; i < 16; i++) { const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', '7'); c.setAttribute('fill', 'var(--signal)'); dots05.appendChild(c); }
  const pk09 = document.getElementById('pk09');
  for (let i = 0; i < 6; i++) { const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', '8'); c.setAttribute('cy', '420'); c.setAttribute('fill', 'var(--signal)'); pk09.appendChild(c); }

  // Riel global de capítulos
  const CAP = scenes.filter(s => s.capitulo);
  const rielg = document.getElementById('rielg');
  CAP.forEach(() => rielg.appendChild(document.createElement('i')));

  /* Preparación: medir y crear animaciones */
  const pos = {};
  function preparar() {
    scenes.forEach(s => s.el.classList.add('on'));
    ['repoBtn', 'btnDesp', 'btnVis', 'btnGD', 'btn07'].forEach(id => { pos[id] = centro(document.getElementById(id)); });
    scenes.forEach(s => s.el.classList.remove('on'));

    scenes.forEach(sc => {
      sc.el.querySelectorAll('[data-fx],[data-out]').forEach(el => {
        const base = el.classList.contains('c') ? 'translate(-50%,-50%)' : '';
        if (el.dataset.fx) {
          const fx = el.dataset.fx; const at = sc.T(el.dataset.at || '0');
          const a = el.animate(conBase(FX[fx], base), { duration: (+el.dataset.du || DU[fx]) * 1000, delay: at * 1000, fill: 'both', easing: 'cubic-bezier(.22,1,.36,1)' });
          a.pause(); sc.anims.push(a);
        }
        if (el.dataset.out) {
          const at = sc.T(el.dataset.out);
          const a = el.animate(conBase([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-18px)' }], base), { duration: (+el.dataset.odu || .5) * 1000, delay: at * 1000, fill: 'forwards', easing: 'cubic-bezier(.4,0,.2,1)', composite: 'replace' });
          a.pause(); sc.anims.push(a);
        }
      });
      // Contadores, escritura, barras, tachados, pulsos
      sc.counts = [...sc.el.querySelectorAll('[data-count]')].map(el => ({ el, n: +el.dataset.count, at: sc.T(el.dataset.cat), du: +el.dataset.cdu || 1.1 }));
      sc.types = [...sc.el.querySelectorAll('[data-type]')].map(el => ({ el, txt: el.dataset.type, at: sc.T(el.dataset.tat), du: +el.dataset.tdu || 1, mask: el.dataset.mask ? sc.T(el.dataset.mask) : null }));
      sc.carets = [...sc.el.querySelectorAll('[data-caret]')].map(el => ({ el, at: sc.T(el.dataset.caret) }));
      sc.grows = [...sc.el.querySelectorAll('[data-w]')].map(el => ({ el, w: +el.dataset.w, at: sc.T(el.dataset.wat) }));
      sc.strikes = [...sc.el.querySelectorAll('[data-strike]')].map(el => ({ el, at: sc.T(el.dataset.strike) }));
      sc.pulses = [...sc.el.querySelectorAll('[data-pulse]')];
      sc.keys = [...sc.el.querySelectorAll('[data-k]')].map(el => ({ el, at: sc.T(el.dataset.k) }));
    });
  }

  /* ── Cursor con clics ── */
  function cursor(sc, lt, id, pasos) {
    const el = document.getElementById('c' + id), rp = document.getElementById('r' + id);
    const t0 = pasos[0].at - .4, tN = pasos[pasos.length - 1].at + .9;
    if (lt < t0 || lt > tN) { el.style.opacity = 0; rp.style.opacity = 0; return; }
    let x = pasos[0].x, y = pasos[0].y;
    for (let i = 1; i < pasos.length; i++) {
      const p = pasos[i], q = pasos[i - 1]; const ini = Math.max(q.at, p.at - .9);
      if (lt >= ini) { const k = eio(prog(lt, ini, p.at - ini || .01)); x = lerp(q.x, p.x, k); y = lerp(q.y, p.y, k); }
    }
    el.style.opacity = Math.min(prog(lt, t0, .3), 1 - prog(lt, tN - .3, .3));
    el.style.transform = `translate(${x - 6}px,${y - 4}px)`;
    rp.style.opacity = 0;
    pasos.filter(p => p.click).forEach(p => {
      const u = (lt - p.at) / .55;
      if (u >= 0 && u <= 1) { rp.style.opacity = .9 * (1 - u); rp.style.left = p.x + 'px'; rp.style.top = p.y + 'px'; rp.style.transform = `scale(${.3 + 1.3 * eo(u)})`; }
      if (p.btn) { const b = document.getElementById(p.btn); const v = lt >= p.at && lt < p.at + .16 ? .94 : 1; b.style.transform = `scale(${v})`; }
    });
  }
  const barrido = (el, lt) => { el.style.backgroundPosition = `${100 - ((lt % 1.8) / 1.8) * 300}% 0`; };
  const setBdg = (el, cls, html) => { if (el.dataset.st !== cls + html) { el.className = el.className.replace(/bdg-\w+/g, '').trim() + ' ' + cls; if (html != null) el.innerHTML = html; el.dataset.st = cls + html; } };
  const ICO = (n, s) => svgIcon(n, s);

  /* ── Lógica propia de cada escena ── */
  const U = {
    's00-intro'(sc, lt, T) {
      const bars = document.querySelectorAll('#introRiel i');
      bars.forEach((b, i) => {
        const c0 = 2.0 + i * .28, k0 = c0 + .32;
        b.classList.toggle('st-c', lt >= c0 && lt < k0); b.classList.toggle('st-k', lt >= k0);
        if (lt >= c0 && lt < k0) barrido(b, lt);
      });
      const clic = T('@Le das un clic') + .9, fin = T('@ya está en internet');
      cursor(sc, lt, '00', [{ at: clic - 1.2, x: 1500, y: 930 }, { at: clic, x: pos.repoBtn.x, y: pos.repoBtn.y, click: true, btn: 'repoBtn' }]);
      const segs = document.querySelectorAll('#repoRiel i'); const p = prog(lt, clic, Math.max(.5, fin - clic));
      segs.forEach((s, i) => { const a = i / 5, b = (i + 1) / 5; s.classList.toggle('st-k', p >= b); s.classList.toggle('st-c', p > a && p < b); if (p > a && p < b) barrido(s, lt); });
      const bdg = document.getElementById('repoBdg');
      if (lt < clic) setBdg(bdg, 'bdg-mut', 'Listo para publicar');
      else if (p < 1) setBdg(bdg, 'bdg-sig', 'Construyendo…');
      else setBdg(bdg, 'bdg-ok', ICO('check', 15) + 'Publicado');
    },
    's01-numeros'(sc, lt, T) {
      const a1 = 46 / 145 * 100, a2 = 37 / 145 * 100;
      const p1 = eo(prog(lt, T('@En la primera entrega') + .3, 1.5)), p2 = eo(prog(lt, T('@y llegamos') - .3, 1.6));
      document.getElementById('barA1').style.width = a1 * p1 + '%';
      const b2 = document.getElementById('barA2'); b2.style.left = a1 + '%'; b2.style.width = a2 * p2 + '%';
      const pct = Math.round(a1 * p1 + a2 * p2);
      const n = document.getElementById('pctN'); n.textContent = pct + ' %'; n.style.color = pct > 50 ? 'var(--signal)' : 'var(--fg)';
    },
    's02-publicar'(sc, lt, T) {
      // Cámara
      const cam = document.getElementById('cam02');
      const keys = [
        { at: 0, s: 1.2, fx: 960, fy: 510 },
        { at: T('@Pegas') - .4, s: 1.42, fx: 860, fy: 440 },
        { at: T('@en variables') - .5, s: 1.42, fx: 1150, fy: 450 },
        { at: T('@Le das a Desplegar') - 1.5, s: 1.2, fx: 960, fy: 510 },
        { at: T('@Arriba') - .3, s: 1.5, fx: 960, fy: 370 },
        { at: T('@Abajo') - .2, s: 1.42, fx: 960, fy: 620 },
        { at: T('@Saludable') - .6, s: 1.2, fx: 960, fy: 510 },
      ];
      let s = keys[0].s, fx = keys[0].fx, fy = keys[0].fy;
      keys.forEach((k, i) => { if (i === 0) return; const q = keys[i - 1]; const pr = eio(prog(lt, k.at, 1.2)); if (lt >= k.at) { s = lerp(q.s, k.s, pr); fx = lerp(q.fx, k.fx, pr); fy = lerp(q.fy, k.fy, pr); } });
      cam.style.transform = `translate(${960 - fx * s}px,${540 - fy * s}px) scale(${s})`;

      const tVar = T('@en variables');
      document.getElementById('stp1').className = 'bdg ' + (lt >= tVar ? 'bdg-ok' : 'bdg-sig');
      document.getElementById('stp2').className = 'bdg ' + (lt >= tVar ? 'bdg-sig' : 'bdg-mut');
      ['stp1', 'stp2'].forEach(id => { const e = document.getElementById(id); e.style.height = '28px'; e.style.fontSize = '14px'; });

      const tD = T('@Le das a Desplegar') + .3, tV = T('@Le das a Visitar') + .3;
      cursor(sc, lt, '02', [
        { at: tD - 1.1, x: 1400, y: 980 }, { at: tD, x: pos.btnDesp.x, y: pos.btnDesp.y, click: true, btn: 'btnDesp' },
        { at: tV - 1.0, x: pos.btnVis.x - 220, y: pos.btnVis.y + 120 }, { at: tV, x: pos.btnVis.x, y: pos.btnVis.y, click: true, btn: 'btnVis' },
      ]);
      document.getElementById('u02').textContent = lt < tD + .6 ? 'deploya.localhost/projects/nuevo' : 'deploya.localhost/projects/hola-deploya/despliegues/1';

      // Riel de etapas: avanza al ritmo de la narración
      const tB = tD + .6;
      const ini = [tB, T('@construcción'), T('@ejecución'), T('@enrutamiento'), T('@operación')];
      const finOp = T('@deja de preguntar') + .3;
      const fin = [ini[1], ini[2], ini[3], ini[4], finOp];
      const DUR = ['1.4 s', '1 min 9 s', '1.1 s', '0.9 s', 'estable'];
      document.querySelectorAll('#rail02 .stg').forEach((st, i) => {
        const bar = st.querySelector('.bar'), ss = st.querySelector('.ss');
        const cur = lt >= ini[i] && lt < fin[i], done = lt >= fin[i];
        bar.className = 'bar' + (cur ? ' st-c' : done ? ' st-k' : '');
        if (cur) barrido(bar, lt);
        const txt = done ? (i === 4 ? 'Saludable · estable' : 'Completada · ' + DUR[i]) : cur ? 'En curso…' : 'En espera';
        if (ss.textContent !== txt) ss.textContent = txt;
        ss.style.color = cur ? 'var(--signal)' : done ? 'var(--ok)' : '';
      });
      const tiempos = [ini[0] + .3, ini[0] + 1.2, ini[1] + .2, ini[2] - .3, ini[2] + .3, ini[2] + .9, ini[3] + .3, finOp - .2];
      [...log02.children].forEach((d, i) => {
        const p = prog(lt, tiempos[i], .35); d.style.opacity = p; d.style.transform = `translateY(${(1 - eo(p)) * 8}px)`;
        d.classList.toggle('hi', lt >= tiempos[i] && lt < tiempos[i] + 1.2);
      });
      const poll = document.getElementById('poll02'), ring = document.getElementById('pollRing');
      if (lt < finOp) { ring.setAttribute('stroke-dashoffset', 37.7 * (1 - (((lt - tB) % 3 + 3) % 3) / 3)); setBdg(poll, 'bdg-sig', null); poll.lastElementChild.textContent = 'consultando · cada 3 s'; }
      else { ring.setAttribute('stroke-dashoffset', 0); setBdg(poll, 'bdg-ok', null); poll.lastElementChild.textContent = 'terminado · ya no consulta'; }
      const b = document.getElementById('b02');
      if (lt < T('@Saludable')) setBdg(b, 'bdg-sig', '<span class="live" data-pulse="1" style="width:8px;height:8px"></span><span>Construyendo</span>');
      else setBdg(b, 'bdg-ok', ICO('check', 13) + '<span>Saludable</span>');
      b.style.height = '28px'; b.style.fontSize = '14px';
    },
    's03-cifrado'(sc, lt, T) {
      const t0 = T('@Se cifra'), pk = document.getElementById('pk03');
      pk.setAttribute('opacity', lt > t0 ? 1 : 0);
      pk.setAttribute('cx', 330 + ((Math.max(0, lt - t0) * 320) % 1260));
      const el = document.getElementById('scr03'), fin = 'v1:9fK2…:a31Q…:Q2xh…', ts = T('@si alguien la abriera');
      if (lt < ts + 1.3) {
        const AB = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789+/=';
        const f = Math.floor(lt * 18); let o = '';
        for (let i = 0; i < 26; i++) o += AB[(f * 31 + i * 17 + ((f * i) % 13)) % AB.length];
        el.textContent = o;
      } else el.textContent = fin;
    },
    's04-stack'(sc, lt, T) {
      // Cada archivo se ilumina cuando la voz lo nombra; Node.js queda como el detectado
      const marcas = [T('@Si ve un package.json'), T('@Si ve un requirements.txt'), T('@Un go.mod'), T('@Y si solo hay')];
      const tDet = T('@Con eso escoge'), tManda = T('@Ese siempre manda');
      document.querySelectorAll('#map04 .mp').forEach((r, i) => {
        const on = lt >= marcas[i] && lt < (marcas[i + 1] ?? tDet);
        const det = i === 0 && lt >= tDet && lt < tManda;
        r.style.borderColor = on ? 'var(--signal)' : det ? 'var(--ok)' : '';
        r.style.background = on ? 'var(--signal-bg)' : det ? 'color-mix(in oklab,var(--ok) 9%,var(--card))' : '';
        r.style.opacity = lt >= tManda && i > 0 ? .55 : 1;
        const d = r.querySelector('.det'); if (d) d.style.opacity = det ? 1 : 0;
      });
      const pkg = document.getElementById('fPkg');
      pkg.style.background = (lt >= marcas[0] && lt < marcas[1]) || (lt >= tDet && lt < tManda) ? 'var(--signal-bg)' : '';
      const tSin = T('@sin permisos');
      document.querySelectorAll('#df04 .df').forEach((l, i) => { l.style.background = i === 4 && lt >= tSin && lt < tSin + 2.2 ? 'var(--signal-bg)' : ''; });
    },
    's05-sin-corte'(sc, lt, T) {
      const te = T('@Editas'), viejo = 'Hola desde el Avance 2', nuevo = 'Hola otra vez, sin cortes';
      const v = document.getElementById('v05');
      const pb = prog(lt, te, .6), pe = prog(lt, te + .7, 1.1);
      v.textContent = lt < te ? viejo : pe <= 0 ? viejo.slice(0, Math.round(viejo.length * (1 - pb))) : nuevo.slice(0, Math.round(nuevo.length * pe));
      const tg = T('@le das a Guardar') + .3;
      cursor(sc, lt, '05', [{ at: tg - 1.1, x: 600, y: 760 }, { at: tg, x: pos.btnGD.x, y: pos.btnGD.y, click: true, btn: 'btnGD' }]);
      // Relevo
      const tApp = T('@aquí viene'), tSw = T('@pasamos el tráfico') + .4, tRev = T('@Revisamos');
      const pa = document.getElementById('pa05'), pbp = document.getElementById('pb05');
      const La = pa.getTotalLength(), Lb = pbp.getTotalLength(), CICLO = 2.6;
      [...dots05.children].forEach((c, i) => {
        if (lt < tApp) { c.setAttribute('opacity', 0); return; }
        const tt = lt - tApp + i * (CICLO / 16); const u = (tt % CICLO) / CICLO; const nacio = lt - u * CICLO;
        let x, y;
        if (u < .45) { x = 150 + 320 * (u / .45); y = 280; } else {
          const cruce = nacio + .45 * CICLO; const path = cruce >= tSw ? pbp : pa; const L = path === pa ? La : Lb;
          const pt = path.getPointAtLength(L * ((u - .45) / .55)); x = pt.x; y = pt.y;
        }
        c.setAttribute('cx', x); c.setAttribute('cy', y);
        c.setAttribute('opacity', Math.min(1, u * 8, (1 - u) * 8) * (nacio < tApp - .01 ? 0 : 1));
        c.setAttribute('fill', (u >= .45 && nacio + .45 * CICLO >= tSw) ? 'var(--ok)' : 'var(--signal)');
      });
      const pr = T('@preparamos la dos');
      document.querySelectorAll('#v2riel i').forEach((s, i) => { const a = pr + i * .5, b = a + .5; s.className = lt >= b ? 'st-k' : lt >= a ? 'st-c' : ''; if (lt >= a && lt < b) barrido(s, lt); });
      const v1b = document.getElementById('v1b'), v2b = document.getElementById('v2b');
      if (lt < tSw) setBdg(v2b, 'bdg-sig', lt >= tRev ? 'verificando salud' : 'preparando'); else setBdg(v2b, 'bdg-ok', 'atendiendo');
      if (lt < tSw + .6) setBdg(v1b, 'bdg-ok', 'atendiendo'); else if (lt < tSw + 2.2) setBdg(v1b, 'bdg-warn', 'apagando'); else setBdg(v1b, 'bdg-mut', 'apagada');
      document.getElementById('v1box').style.filter = lt >= tSw + 2.2 ? 'saturate(0) opacity(.55)' : '';
      document.getElementById('v2box').style.borderColor = lt >= tSw ? 'var(--ok)' : '';
      const sp = document.getElementById('spark05'); const p = prog(lt, T('@Cero caídas') + .2, 1.4);
      sp.setAttribute('stroke-dasharray', '380'); sp.setAttribute('stroke-dashoffset', 380 * (1 - p));
    },
    's06-cobro'(sc, lt, T) {
      document.getElementById('plS').style.borderColor = lt >= T('@pagas') ? 'var(--signal)' : '';
      const sl = document.getElementById('slow06'), tt = T('@tarda') + 2.4;
      if (lt < tt) { const sv = sl.querySelector('svg'); if (sv) sv.style.transform = `rotate(${(lt * 360) % 360}deg)`; }
      else setBdg(sl, 'bdg-ok', ICO('check', 16) + '<span>Aprobada en 5 s</span>');
    },
    's07-bloqueos'(sc, lt, T) {
      const tc = T('@Antes de cada despliegue') + .4;
      cursor(sc, lt, '07', [{ at: tc - 1.1, x: 900, y: 700 }, { at: tc, x: pos.btn07.x, y: pos.btn07.y, click: true, btn: 'btn07' }]);
    },
    's08-cuentas'(sc, lt, T) {
      const t0 = T('@te llega un enlace'); const seg = Math.max(0, 1800 - Math.floor(Math.max(0, lt - t0) * 9));
      const cd = document.getElementById('cd08'); const txt = `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`; if (cd.textContent !== txt) cd.textContent = txt;
      const b = document.getElementById('btn08'); const tb = T('@Si olvidas') + 1.2; b.style.transform = lt >= tb && lt < tb + .16 ? 'scale(.95)' : '';
      const tc = T('@se cierran tus sesiones');
      document.querySelectorAll('#s08-cuentas .dev').forEach((d, i) => {
        const off = lt >= tc + i * .3; const bb = d.querySelector('.sesb');
        if (off) setBdg(bb, 'bdg-bad', ICO('x', 14) + 'Sesión cerrada'); else setBdg(bb, 'bdg-ok', 'Sesión activa');
        d.style.opacity = off ? .7 : 1;
      });
    },
    's09-capo'(sc, lt, T) {
      const t0 = T('@La web');
      [...pk09.children].forEach((c, i) => {
        const u = ((lt - t0) * .32 + i / 6) % 1; c.setAttribute('cx', 120 + 1680 * u); c.setAttribute('opacity', lt > t0 + .5 ? Math.min(1, u * 10, (1 - u) * 10) : 0);
      });
      const sw = (a, b, at) => { const p = eo(prog(lt, at, .6)); const ea = document.querySelector(a), eb = document.querySelector(b); ea.style.opacity = 1 - p; ea.style.transform = `translateY(${-14 * p}px)`; eb.style.opacity = p; eb.style.transform = `translateY(${14 * (1 - p)}px)`; };
      sw('.swA', '.swB', T('@por una lista'));
      sw('.swC', '.swD', T('@por una real'));
      sc.keys.forEach(k => { const on = lt >= k.at; k.el.style.borderColor = on ? 'var(--signal)' : ''; k.el.style.background = on ? 'var(--signal-bg)' : ''; k.el.style.transform = lt >= k.at && lt < k.at + .5 ? 'translateY(-4px)' : ''; });
    },
  };

  /* ── Marco, subtítulos y fundidos ── */
  const chrome = document.getElementById('chrome'), subs = document.getElementById('subs'), fade = document.getElementById('fade');
  const chapN = document.getElementById('chapN'), chapT = document.getElementById('chapT');
  const brand = document.getElementById('brand'), tagr = document.getElementById('tagr');

  function render(t) {
    let actual = scenes[0];
    scenes.forEach(sc => {
      const lt = t - sc.start;
      const vis = lt >= -0.05 && lt <= sc.dur + .7;
      sc.el.classList.toggle('on', vis);
      if (!vis) return;
      if (lt >= 0) actual = sc;
      const fin = sc === scenes[scenes.length - 1];
      const pin = sc === scenes[0] ? 1 : eo(prog(lt, 0, .7)), pout = fin ? 0 : prog(lt, sc.dur, .7);
      sc.el.style.opacity = pin * (1 - pout);
      sc.el.style.transform = `scale(${1.015 - .015 * pin}) translateY(${-10 * pout}px)`;
      sc.el.style.filter = pin < 1 ? `blur(${(1 - pin) * 6}px)` : '';
      sc.anims.forEach(a => { a.currentTime = lt * 1000; });
      sc.counts.forEach(c => { const v = Math.round(c.n * eo(prog(lt, c.at, c.du))); if (c.el.textContent != v) c.el.textContent = v; });
      sc.types.forEach(c => {
        let s = c.txt.slice(0, Math.round(c.txt.length * prog(lt, c.at, c.du)));
        if (c.mask != null && lt >= c.mask) s = '•'.repeat(14);
        if (c.el.textContent !== s) c.el.textContent = s;
      });
      sc.carets.forEach(c => { c.el.style.opacity = lt >= c.at - .3 && lt < c.at + 2.4 && Math.floor(lt * 2.2) % 2 === 0 ? 1 : 0; });
      sc.grows.forEach(g => { g.el.style.width = g.w * eo(prog(lt, g.at, 1)) + '%'; });
      sc.strikes.forEach(s => s.el.style.setProperty('--sx', eo(prog(lt, s.at, .4))));
      sc.pulses.forEach(p => { const u = (lt % 1.8) / 1.8; p.style.boxShadow = `0 0 0 ${u * 9}px color-mix(in oklab, var(--signal) ${Math.round(55 * (1 - u))}%, transparent)`; });
      if (U[sc.id]) U[sc.id](sc, lt, sc.T);
    });

    // Marco persistente: visible en los capítulos
    const lt = t - actual.start;
    const enCap = !!actual.capitulo;
    const ultimo = actual === scenes[scenes.length - 1];
    let op = enCap ? 1 : 0;
    if (actual === scenes[0]) op = prog(lt, actual.dur - .2, .8);
    if (ultimo) op = 1 - prog(lt, actual.T('@Esto fue') - .5, .6);
    chrome.style.opacity = 1;
    [chapN, chapT, rielg].forEach(e => { e.style.opacity = op; });
    // En la demo la ventana ocupa la pantalla: la marca se aparta
    const marca = actual.id === 's02-publicar' ? 1 - prog(lt, 0, .5) : actual.id === 's03-cifrado' ? prog(lt, 0, .6) : 1;
    [brand, tagr].forEach(e => { e.style.opacity = op * marca; });
    const ci = ultimo ? CAP.length : CAP.indexOf(actual);
    if (ultimo) { chapN.textContent = '→'; chapT.textContent = 'Lo que viene'; }
    else if (ci >= 0) { chapN.textContent = String(ci + 1).padStart(2, '0'); chapT.textContent = actual.capitulo; }
    [...rielg.children].forEach((b, i) => { b.className = i < ci ? 'st-k' : i === ci ? 'st-c' : ''; if (i === ci) barrido(b, t); });

    // Subtítulos
    let sub = '';
    if (document.body.classList.contains('cc')) {
      const f = (actual.frases || []).find(f => lt >= actual.lead + f.t0 - .1 && lt <= actual.lead + f.t1 + .25);
      if (f) sub = actual.limpio.slice(f.a, f.b).trim();
    }
    if (subs.textContent !== sub) subs.textContent = sub;
    subs.classList.toggle('has', !!sub);

    fade.style.opacity = Math.max(1 - prog(t, 0, .8), prog(t, TL.total - 1.6, 1.4));
  }

  /* ── Reproductor ── */
  const k = () => Math.min(innerWidth / 1920, innerHeight / 1080);
  const ajustar = () => stage.style.setProperty('--k', RENDER ? 1 : k());
  addEventListener('resize', ajustar); ajustar();

  let reloj = 0, jugando = false, ultimoTs = 0, sinAudio = false;
  audio.addEventListener('error', () => { sinAudio = true; });
  const total = TL.total;
  const fill = document.getElementById('fill'), time = document.getElementById('time'), bar = document.getElementById('bar');
  const pIco = document.getElementById('pIco');
  CAP.forEach(c => { const d = document.createElement('div'); d.className = 'tick'; d.style.left = (c.start / total * 100) + '%'; bar.appendChild(d); });

  function ahora() { return sinAudio ? reloj : audio.currentTime; }
  function seek(t) { empezo = true; document.getElementById('start').style.display = 'none'; t = clamp(t, 0, total); reloj = t; if (!sinAudio) audio.currentTime = t; render(t); pintarUI(t); }
  function pintarUI(t) { fill.style.width = (t / total * 100) + '%'; time.textContent = `${fmt(t)} / ${fmt(total)}`; pIco.setAttribute('d', jugando ? 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z' : 'M8 5.5v13l11-6.5z'); }
  let empezo = false, portada = 0;
  function play() {
    if (!empezo) { empezo = true; seek(0); }
    jugando = true; document.getElementById('start').style.display = 'none'; if (!sinAudio) audio.play().catch(() => { sinAudio = true; }); ultimoTs = performance.now(); }
  function pause() { jugando = false; if (!sinAudio) audio.pause(); }
  function loop(ts) {
    if (jugando && sinAudio) reloj += (ts - ultimoTs) / 1000;
    ultimoTs = ts;
    let t = ahora();
    if (t >= total) { t = total; if (jugando) pause(); }
    render(empezo ? t : portada); pintarUI(empezo ? t : 0);
    requestAnimationFrame(loop);
  }
  audio.addEventListener('ended', () => { jugando = false; });
  document.getElementById('start').addEventListener('click', play);
  document.getElementById('bPlay').addEventListener('click', () => (jugando ? pause() : play()));
  const cc = document.getElementById('bCC');
  const toggleCC = () => { const on = document.body.classList.toggle('cc'); cc.setAttribute('aria-pressed', on); };
  cc.addEventListener('click', toggleCC);
  const fs = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());
  document.getElementById('bFS').addEventListener('click', fs);
  bar.addEventListener('click', e => { const r = bar.getBoundingClientRect(); seek((e.clientX - r.left) / r.width * total); });
  bar.addEventListener('keydown', e => { if (e.key === 'ArrowRight') seek(ahora() + 5); if (e.key === 'ArrowLeft') seek(ahora() - 5); });
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); jugando ? pause() : play(); }
    else if (e.key === 'ArrowRight' && e.target !== bar) seek(ahora() + 5);
    else if (e.key === 'ArrowLeft' && e.target !== bar) seek(ahora() - 5);
    else if (e.key === 'c' || e.key === 'C') toggleCC();
    else if (e.key === 'f' || e.key === 'F') fs();
  });
  let idle; addEventListener('mousemove', () => { document.body.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => jugando && document.body.classList.add('idle'), 2200); });
  addEventListener('touchstart', () => { document.body.classList.remove('idle'); });

  document.fonts.ready.then(() => {
    preparar();
    if (new URLSearchParams(location.search).has('cc')) toggleCC();
    // En reposo se ve la portada (el logo con «Avance 2 · 50 %»), no un cuadro negro
    portada = RENDER ? 0 : scenes[0].T('@Y hoy') + 1.6;
    render(portada); pintarUI(0);
    document.body.classList.remove('idle');
    if (faltantes.length) console.warn('Señales sin encontrar:', faltantes);
    window.__faltantes = faltantes;
    window.__render = t => { render(t); };
    window.__listo = true;
    if (!RENDER) requestAnimationFrame(loop);
  });
})();

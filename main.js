// Flux Vid: animaciones gelatinosas, versiones de cada programa y descargas.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  $('#year').textContent = new Date().getFullYear();

  // Tema claro / oscuro
  const themeBtn = $('#themeBtn');
  const isDark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  themeBtn.onclick = () => {
    const t = isDark() ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('fv-theme', t); } catch {}
    themeBtn.classList.remove('wobble'); void themeBtn.offsetWidth; themeBtn.classList.add('wobble');
  };

  // Aparición escalonada al hacer scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const sibs = $$('.reveal:not(.in)', e.target.parentElement);
      e.target.style.transitionDelay = Math.min(sibs.indexOf(e.target), 5) * 80 + 'ms';
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));

  // Botones: gelatina + gota al pulsar
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.jelly, .icon-btn');
    if (!b) return;
    b.classList.remove('wobble'); void b.offsetWidth; b.classList.add('wobble');
    if (!b.classList.contains('btn')) return;
    const r = b.getBoundingClientRect(), g = document.createElement('i');
    g.className = 'goo'; g.style.left = e.clientX - r.left + 'px'; g.style.top = e.clientY - r.top + 'px';
    b.append(g); setTimeout(() => g.remove(), 800);
  });
  document.addEventListener('animationend', (e) => { if (e.animationName === 'jelly') e.target.classList.remove('wobble'); });

  // Explosión de emojis desde un punto
  function burst(x, y, chars) {
    if (reduce) return;
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('span');
      s.className = 'burst';
      s.textContent = chars[i % chars.length];
      const a = (Math.PI * 2 * i) / 14 + Math.random() * .4, d = 70 + Math.random() * 90;
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.style.setProperty('--x', Math.cos(a) * d + 'px'); s.style.setProperty('--y', Math.sin(a) * d - 40 + 'px'); s.style.setProperty('--r', (Math.random() * 360 - 180) + 'deg');
      document.body.append(s); setTimeout(() => s.remove(), 1100);
    }
  }
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200);
  }

  const NAMES = { flux: 'FLUX', captly: 'CaptLY', micly: 'MicLY', cutlify: 'Cutlify' };
  $$('[data-download]').forEach((a) => a.addEventListener('click', (e) => {
    burst(e.clientX, e.clientY, ['✨', '💜', '⭐', '🎉']);
    toast(`⬇️ Descargando ${NAMES[a.dataset.download]}… ¡gracias!`);
  }));
  $('#donateBtn').addEventListener('click', (e) => burst(e.clientX, e.clientY, ['💜', '💖', '💗']));

  // Las órbitas del hero se apartan un poco del ratón
  const orbit = $('.orbit');
  if (orbit && !reduce) {
    addEventListener('pointermove', (e) => {
      const r = orbit.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth, dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      orbit.style.transform = `translate(${dx * -18}px, ${dy * -18}px) rotate(${dx * 4}deg)`;
    });
    orbit.style.transition = 'transform .8s cubic-bezier(.16,1,.3,1)';
  }

  // Versiones y tamaños reales
  const mb = (b) => (b ? (b / 1048576).toFixed(0) + ' MB' : '');
  fetch('/api/apps').then((r) => r.json()).then((apps) => {
    for (const [id, info] of Object.entries(apps)) {
      const el = $(`[data-ver="${id}"]`);
      if (el && info.version) el.textContent = `v${info.version} · ${mb(info.size)} · Windows${id === 'cutlify' ? ' · beta' : ''}`;
    }
  }).catch(() => {});
})();

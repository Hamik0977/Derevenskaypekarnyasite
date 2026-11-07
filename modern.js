// Современный слой для всех сайтов «Мечты»:
// заставка, плавная прокрутка, заголовки по словам, магнитные кнопки, курсор, бегущая строка, прогресс.
// Настройки берутся из атрибутов <body>: data-site, data-logo, data-marquee, data-marquee-after.
(() => {
  const body = document.body;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(pointer: fine)').matches;
  const ease = t => 1 - Math.pow(1 - t, 3);

  // ---------- заставка (один раз за сессию) ----------
  let seen = false;
  try { seen = sessionStorage.getItem('mechta-intro') === '1'; sessionStorage.setItem('mechta-intro', '1'); } catch (e) {}
  if (!seen && !RM && body.dataset.logo) {
    const l = document.createElement('div');
    l.className = 'm-loader';
    l.innerHTML = `<img src="${body.dataset.logo}" alt=""><span class="m-loader__n">0</span><i class="m-loader__bar"></i>`;
    body.appendChild(l);
    const n = l.querySelector('.m-loader__n'), bar = l.querySelector('.m-loader__bar'), t0 = performance.now();
    const tick = t => {
      const k = Math.min((t - t0) / 1100, 1), v = Math.round(ease(k) * 100);
      n.textContent = v; bar.style.transform = `scaleX(${v / 100})`;
      if (k < 1) requestAnimationFrame(tick);
      else { l.classList.add('m-loader--out'); setTimeout(() => l.remove(), 900); }
    };
    requestAnimationFrame(tick);
  }

  // ---------- плавная инерционная прокрутка (только мышь/тачпад) ----------
  let lenis = null;
  if (window.Lenis && FINE && !RM) {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    document.documentElement.classList.add('lenis');
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    // якорные ссылки — плавно, с отступом под шапку
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id.length < 2) { e.preventDefault(); lenis.scrollTo(0); return; }
      const el = document.querySelector(id);
      if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -70 }); }
    });
    // когда открыто меню или просмотр фото (body overflow:hidden) — прокрутку замораживаем
    new MutationObserver(() => (body.style.overflow === 'hidden' ? lenis.stop() : lenis.start()))
      .observe(body, { attributes: true, attributeFilter: ['style'] });
    window.mechtaLenis = lenis;
  }

  // ---------- полоска прогресса ----------
  const prog = document.createElement('i');
  prog.className = 'm-progress';
  body.appendChild(prog);
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    body.classList.toggle('m-scrolled', scrollY > 60);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- заголовки появляются по словам ----------
  if (!RM) {
    const heads = [...document.querySelectorAll('h1, h2')].filter(h =>
      !h.querySelector('.gt') && !h.classList.contains('gt') && !h.closest('[data-nosplit]'));
    heads.forEach(h => {
      let i = 0;
      const walk = node => {
        [...node.childNodes].forEach(ch => {
          if (ch.nodeType === 3) {
            const parts = ch.textContent.split(/(\s+)/);
            const frag = document.createDocumentFragment();
            parts.forEach(p => {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
              const w = document.createElement('span'); w.className = 'mw';
              const inner = document.createElement('span'); inner.className = 'mw-i';
              inner.style.setProperty('--i', i++); inner.textContent = p;
              w.appendChild(inner); frag.appendChild(w);
            });
            ch.replaceWith(frag);
          } else if (ch.nodeType === 1 && ch.tagName !== 'BR') walk(ch);
        });
      };
      walk(h);
      h.classList.add('m-split');
    });
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('m-in'); io.unobserve(e.target); }
    }), { threshold: 0.25 });
    heads.forEach(h => io.observe(h));
  }

  // ---------- бегущая строка с фактами ----------
  const mq = body.dataset.marquee, after = body.dataset.marqueeAfter && document.querySelector(body.dataset.marqueeAfter);
  if (mq && after) {
    const items = mq.split('|').map(s => `<span>${s.trim()}</span><b>✦</b>`).join('');
    const m = document.createElement('div');
    m.className = 'm-marquee'; m.setAttribute('aria-hidden', 'true');
    m.innerHTML = `<div class="m-marquee__t">${items}${items}</div>`;
    after.after(m);
  }

  // ---------- удобство на телефоне ----------
  // поля телефона: цифровая клавиатура
  document.querySelectorAll('input[type="tel"]').forEach(i => i.setAttribute('inputmode', 'tel'));

  // меню-бургер для вариантов, где его нет: собираем пункты из навигации сайта
  const navLinks = [...document.querySelectorAll(body.dataset.nav || 'header nav a')]
    .filter(a => a.getAttribute('href') && a.getAttribute('href').startsWith('#'));
  if (navLinks.length && !document.querySelector('.burger')) {
    const btn = document.createElement('button');
    btn.className = 'm-burger'; btn.setAttribute('aria-label', 'Меню'); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span></span><span></span>';
    const panel = document.createElement('nav');
    panel.className = 'm-menu'; panel.setAttribute('aria-label', 'Меню');
    panel.innerHTML = navLinks.map(a => `<a href="${a.getAttribute('href')}">${(a.querySelector('.t') || a).textContent.trim()}</a>`).join('')
      + '<a href="#contact" class="m-menu__cta">Оставить заявку</a>';
    body.append(btn, panel);
    const close = () => { panel.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); body.style.overflow = ''; };
    btn.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open); body.style.overflow = open ? 'hidden' : '';
    });
    panel.addEventListener('click', e => { if (e.target.closest('a')) close(); });
    addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  // нижняя панель с кнопками (если на сайте её ещё нет)
  if (!document.querySelector('.mbar')) {
    const bar = document.createElement('div');
    bar.className = 'm-bar';
    bar.innerHTML = `${body.dataset.pdf ? `<a href="${body.dataset.pdf}" download>Презентация</a>` : ''}<a href="#contact" class="m-bar__main">Оставить заявку</a>`;
    body.appendChild(bar);
    const contact = document.querySelector('#contact');
    const upd = () => {
      const r = contact ? contact.getBoundingClientRect() : null;
      bar.classList.toggle('show', scrollY > innerHeight * 0.7 && !(r && r.top < innerHeight && r.bottom > 0));
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  // ---------- магнитные кнопки и курсор (только мышь) ----------
  if (FINE && !RM) {
    document.querySelectorAll('.btn, .m-mag, form button, .tab, .chip, .stab').forEach(b => {
      b.classList.add('m-magnet');
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });

    const dot = document.createElement('i'), ring = document.createElement('i');
    dot.className = 'm-cursor m-cursor--dot'; ring.className = 'm-cursor m-cursor--ring';
    body.append(dot, ring);
    body.classList.add('m-has-cursor');
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      dot.style.transform = `translate(${x}px, ${y}px)`;
      const hot = e.target.closest('a, button, summary, input, [role="tab"], .g, .strip, .card, .s, label');
      ring.classList.toggle('m-cursor--hot', !!hot);
    }, { passive: true });
    document.addEventListener('pointerleave', () => body.classList.add('m-cursor-off'));
    document.addEventListener('pointerenter', () => body.classList.remove('m-cursor-off'));
    const loop = () => { rx += (x - rx) * 0.18; ry += (y - ry) * 0.18; ring.style.transform = `translate(${rx}px, ${ry}px)`; requestAnimationFrame(loop); };
    loop();
  }
})();

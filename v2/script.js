// ===== Контакты отдела продаж — заполните, и они появятся на сайте и в форме =====
const CONTACTS = {
  phone: '',     // например: '+7 978 000-00-00'
  telegram: '',  // имя пользователя без @, например: 'mechta_sales'
  email: '',     // например: 'sales@mechta-feodosia.ru'
};

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// ===== Шапка и мобильное меню =====
const header = $('#header'), nav = $('#nav'), burger = $('#burger');
const tourSection = document.getElementById('tour');
const onHeader = () => header.classList.toggle('scrolled', scrollY > tourSection.offsetTop + tourSection.offsetHeight - 90);
burger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open'); burger.setAttribute('aria-expanded', false); document.body.style.overflow = '';
}));

// ===== Появление элементов и счётчики =====
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('visible', 'drawn');
  e.target.querySelectorAll('[data-count]').forEach(countUp);
  io.unobserve(e.target);
}), { threshold: .2, rootMargin: '0px 0px -40px 0px' });
$$('.reveal, .img-reveal, .landscape').forEach(el => io.observe(el));

function fmt(n, f) {
  if (f === 'space') return n.toLocaleString('ru-RU');
  if (f === 'mln') return (n / 1000).toFixed(3).replace('.', ',');
  return String(n);
}
function countUp(el) {
  const target = +el.dataset.count, f = el.dataset.format;
  if (reduceMotion) return;
  const t0 = performance.now();
  const step = t => {
    const k = Math.min((t - t0) / 1600, 1);
    el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - k, 3))), f);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ===== Параллакс картинок =====
const parallax = $$('.parallax');
function onParallax() {
  if (reduceMotion) return;
  const vh = innerHeight;
  parallax.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
    el.style.setProperty('--py', `${(p * -6).toFixed(2)}%`);
  });
}
let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => { onHeader(); onParallax(); ticking = false; });
}, { passive: true });
onHeader(); onParallax();

// ===== Галерея с лайтбоксом =====
const shots = $$('.g'), lb = $('#lightbox'), lbImg = $('#lb-img');
let cur = 0;
function show(i) {
  cur = (i + shots.length) % shots.length;
  lbImg.src = shots[cur].dataset.src; lbImg.alt = shots[cur].querySelector('img').alt;
  lbImg.style.animation = 'none'; lbImg.offsetWidth; lbImg.style.animation = '';
}
shots.forEach((s, i) => s.addEventListener('click', () => { show(i); lb.hidden = false; document.body.style.overflow = 'hidden'; $('#lb-close').focus(); }));
const closeLb = () => { lb.hidden = true; document.body.style.overflow = ''; shots[cur].focus(); };
$('#lb-close').addEventListener('click', closeLb);
$('#lb-prev').addEventListener('click', () => show(cur - 1));
$('#lb-next').addEventListener('click', () => show(cur + 1));
lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
addEventListener('keydown', e => {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLb();
  if (e.key === 'ArrowLeft') show(cur - 1);
  if (e.key === 'ArrowRight') show(cur + 1);
});
let tx = 0;
lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1)); });

// ===== Этажи =====
const floorImg = $('#floor-img');
$$('.ftab').forEach(t => t.addEventListener('click', () => {
  $$('.ftab').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  floorImg.classList.add('swap');
  setTimeout(() => {
    floorImg.src = `../images/floor-${t.dataset.floor}.webp`;
    floorImg.alt = `Планировка ${t.dataset.floor} этажа`;
    floorImg.onload = () => floorImg.classList.remove('swap');
  }, reduceMotion ? 0 : 250);
}));
['3', '4', '5'].forEach(n => { const i = new Image(); i.src = `../images/floor-${n}.webp`; });

// ===== Сезонная загрузка =====
const SEASONS = { high: [70, 95], low: [30, 50] };
function setSeason(key) {
  const [a, b] = SEASONS[key];
  $('#season-val').textContent = `${a}–${b}%`;
  $('#season-from').style.width = `${a}%`;
  Object.assign($('#season-to').style, { left: `${a}%`, width: `${b - a}%` });
}
$$('.stab').forEach(t => t.addEventListener('click', () => {
  $$('.stab').forEach(x => x.classList.remove('active'));
  t.classList.add('active'); setSeason(t.dataset.season);
}));
setSeason('high');

// ===== Контакты и форма =====
const list = $('#contacts');
const hasContacts = CONTACTS.phone || CONTACTS.telegram || CONTACTS.email;
if (CONTACTS.phone) list.insertAdjacentHTML('beforeend', `<li><a href="tel:${CONTACTS.phone.replace(/[^\d+]/g, '')}">${CONTACTS.phone}</a></li>`);
if (CONTACTS.telegram) list.insertAdjacentHTML('beforeend', `<li><a href="https://t.me/${CONTACTS.telegram}" target="_blank" rel="noopener">Telegram: @${CONTACTS.telegram}</a></li>`);
if (CONTACTS.email) list.insertAdjacentHTML('beforeend', `<li><a href="mailto:${CONTACTS.email}">${CONTACTS.email}</a></li>`);
if (!hasContacts) list.innerHTML = '<li>Контакты появятся в ближайшее время</li>';

const form = $('#form'), msg = $('#form-msg');
form.addEventListener('submit', e => {
  e.preventDefault();
  const f = form.elements, name = f.name.value.trim(), phone = f.phone.value.trim(), goal = f.goal.value;
  f.name.classList.toggle('invalid', !name);
  f.phone.classList.toggle('invalid', phone.replace(/\D/g, '').length < 10);
  if (!name || phone.replace(/\D/g, '').length < 10) { msg.textContent = 'Пожалуйста, укажите имя и номер телефона.'; return; }
  const text = `Здравствуйте! Хочу получить подборку апартаментов «Мечта».\nИмя: ${name}\nТелефон: ${phone}\nИнтерес: ${goal}`;
  if (CONTACTS.telegram) {
    navigator.clipboard?.writeText(text).catch(() => {});
    open(`https://t.me/${CONTACTS.telegram}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    msg.textContent = 'Открываем Telegram — отправьте сообщение менеджеру.';
  } else if (CONTACTS.email) {
    location.href = `mailto:${CONTACTS.email}?subject=${encodeURIComponent('Заявка: подборка апартаментов')}&body=${encodeURIComponent(text)}`;
    msg.textContent = 'Открываем почту — отправьте письмо менеджеру.';
  } else if (CONTACTS.phone) {
    msg.textContent = `Позвоните нам: ${CONTACTS.phone}`;
  } else {
    msg.textContent = 'Приём заявок скоро заработает. Спасибо за интерес!';
  }
});

// ===== Виртуальная прогулка: снаружи → внутрь → во двор =====
// x, y — положение точки в процентах от картинки; fx, fy — куда «идёт камера» (фокус приближения)
const TOUR = [
  { img: 'tour-front', zone: 'Снаружи', name: 'Фасад комплекса', fx: 50, fy: 50, mfx: 30, w: 2400, h: 1044, hs: [
    { x: 26, y: 20, t: 'Пятый этаж', d: '20 апартаментов под мансардной кровлей' },
    { x: 46, y: 56, t: 'Четыре жилых этажа', d: '68 одно- и двухкомнатных апартаментов' },
    { x: 93, y: 48, t: '«Мечта»', d: 'Апарт-отель с единым стандартом сервиса', left: true } ] },
  { img: 'tour-corner', zone: 'Снаружи', name: 'Терраса и вход', fx: 55, fy: 60, mfx: 50, w: 2358, h: 2159, hs: [
    { x: 9, y: 70, t: 'Открытая терраса', d: '200 м² открытой посадки столовой' },
    { x: 61, y: 30, t: 'Фасад «Мечта»', d: 'Комплекс работает круглый год', left: true } ] },
  { img: 'tour-entrance', zone: 'Снаружи', name: 'У входа', fx: 46, fy: 78, mfx: 46, w: 2038, h: 1367, hs: [
    { x: 44, y: 80, t: 'Апартаменты у моря', d: 'Феодосия, улица Федько. Море — в пяти минутах пешком' } ] },
  { img: 'tour-lobby', zone: 'Внутри', name: 'Лобби и ресепшен', fx: 40, fy: 55, mfx: 30, w: 1618, h: 567, hs: [
    { x: 14, y: 62, t: 'Ресепшен', d: 'Ресепшен и консьерж-сервис' },
    { x: 46, y: 24, t: 'Лифт и кафе', d: 'Круглогодичная столовая и кафе — 325 м²' },
    { x: 86, y: 68, t: 'Зона ожидания', d: 'Тёплая нейтральная палитра во всём комплексе', left: true } ] },
  { img: 'tour-corridor', zone: 'Внутри', name: 'Коридор', fx: 42, fy: 20, mfx: 42, w: 1157, h: 973, hs: [
    { x: 42, y: 30, t: 'Единый стандарт', d: 'Цельный интерьер упрощает обслуживание номерного фонда' } ] },
  { img: 'tour-room', zone: 'Внутри', name: 'Апартамент', fx: 52, fy: 55, mfx: 55, w: 2191, h: 1117, hs: [
    { x: 55, y: 66, t: 'Спальня', d: 'Одно- и двухкомнатные планировки' },
    { x: 34, y: 32, t: 'Окно в пол', d: 'Светлый апартамент в природной палитре' } ] },
  { img: 'tour-pool', zone: 'Во дворе', name: 'Бассейн и шезлонги', fx: 45, fy: 60, mfx: 40, w: 2035, h: 1402, hs: [
    { x: 38, y: 63, t: 'Подогреваемый бассейн', d: '8 × 15 м, глубина 1,8 м' },
    { x: 80, y: 60, t: 'Зона шезлонгов', d: '87,5 м² для отдыха весь день', left: true } ] },
];

const tour = $('#tour'), scenesEl = $('#tour-scenes'), tourNav = $('#tour-nav');
tour.style.setProperty('--n', TOUR.length);
$('#tour-total').textContent = String(TOUR.length).padStart(2, '0');
const sceneEls = TOUR.map((s, i) => {
  const el = document.createElement('div');
  el.className = 'scene';
  el.style.zIndex = TOUR.length - i;
  el.innerHTML = `<div class="scene__inner"><img src="images/${s.img}.webp" alt="${s.name}" ${i ? '' : 'fetchpriority="high"'}>
    ${s.hs.map(h => `<div class="hs${h.left ? ' left' : ''}" style="left:${h.x}%;top:${h.y}%">
      <button aria-label="${h.t}">+</button><div class="hs__card"><b>${h.t}</b>${h.d}</div></div>`).join('')}</div>`;
  scenesEl.appendChild(el);
  const b = document.createElement('button');
  b.innerHTML = `<span>${s.name}</span><i></i>`;
  b.addEventListener('click', () => goScene(i));
  tourNav.appendChild(b);
  return el;
});
// точки открываются и по нажатию (для телефонов)
scenesEl.addEventListener('click', e => {
  const hs = e.target.closest('.hs');
  scenesEl.querySelectorAll('.hs.open').forEach(x => x !== hs && x.classList.remove('open'));
  if (hs && e.target.closest('button')) hs.classList.toggle('open');
});

// картинка заполняет экран как cover, а точки остаются на своих местах
function layoutScenes() {
  const W = innerWidth, H = tour.querySelector('.tour__sticky').clientHeight, mobile = W < 640;
  TOUR.forEach((s, i) => {
    const ar = s.w / s.h, inner = sceneEls[i].firstElementChild;
    let w = Math.max(W, H * ar), h = w / ar;
    if (h < H) { h = H; w = h * ar; }
    const fx = (mobile ? s.mfx : s.fx) / 100;
    inner.style.width = `${w}px`; inner.style.height = `${h}px`;
    inner.style.left = `${Math.min(0, Math.max(W - w, W / 2 - w * fx))}px`;
    inner.style.top = `${(H - h) / 2}px`;
    inner.style.transformOrigin = `${s.fx}% ${s.fy}%`;
    // прячем точки, которые не помещаются в экран (на узких экранах часть фото обрезана)
    const left = parseFloat(inner.style.left), top = (H - h) / 2;
    inner.querySelectorAll('.hs').forEach((el, k) => {
      const hx = left + w * s.hs[k].x / 100, hy = top + h * s.hs[k].y / 100;
      el.classList.toggle('off', hx < 50 || hx > W - 70 || hy < 110 || hy > H - 150);
      el.classList.toggle('left', !!s.hs[k].left || hx > W - 280);
    });
  });
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
let lastIdx = -1;
function tourProgress() {
  const r = tour.getBoundingClientRect();
  return clamp(-r.top / (r.height - innerHeight), 0, 1);
}
function renderTour() {
  const p = tourProgress(), P = p * (TOUR.length - 1);
  sceneEls.forEach((el, i) => {
    const t = P - i;
    let op = t < -0.45 ? 0 : t < 0 ? (t + 0.45) / 0.45 : t < 0.55 ? 1 : 1 - (t - 0.55) / 0.45;
    if (i === TOUR.length - 1 && t >= 0) op = 1;
    op = clamp(op, 0, 1);
    el.style.opacity = op;
    el.style.visibility = op > 0 ? 'visible' : 'hidden';
    if (op > 0 && !reduceMotion) {
      let sc = 1 + 0.14 * clamp(t + 0.45, 0, 1.45);
      let blur = 0;
      if (t > 0.55 && i < TOUR.length - 1) { sc += (t - 0.55) * 0.9; blur = (t - 0.55) * 14; }
      el.firstElementChild.style.transform = `scale(${sc.toFixed(4)})`;
      el.style.filter = blur ? `blur(${blur.toFixed(1)}px)` : '';
    }
    el.classList.toggle('active', Math.abs(t) < 0.35);
  });
  const idx = clamp(Math.round(P), 0, TOUR.length - 1);
  if (idx !== lastIdx) {
    lastIdx = idx;
    $('#tour-num').textContent = String(idx + 1).padStart(2, '0');
    $('#tour-zone').textContent = TOUR[idx].zone;
    $('#tour-name').textContent = TOUR[idx].name;
    [...tourNav.children].forEach((b, i) => b.classList.toggle('active', i === idx));
    scenesEl.querySelectorAll('.hs.open').forEach(x => x.classList.remove('open'));
  }
  $('#tour-bar').style.width = `${p * 100}%`;
  const intro = $('#tour-intro');
  intro.style.opacity = clamp(1 - P / 0.35, 0, 1);
  intro.style.transform = `translateY(${-P * 80}px)`;
  intro.style.pointerEvents = P > 0.3 ? 'none' : '';
  $('#tour-hint').style.opacity = P > 0.15 ? 0 : '';
}
function goScene(i) {
  const top = tour.offsetTop, len = tour.offsetHeight - innerHeight;
  scrollTo({ top: top + len * i / (TOUR.length - 1), behavior: reduceMotion ? 'auto' : 'smooth' });
}
layoutScenes(); renderTour();
addEventListener('resize', () => { layoutScenes(); renderTour(); });
addEventListener('scroll', () => requestAnimationFrame(renderTour), { passive: true });

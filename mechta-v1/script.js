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
const onHeader = () => header.classList.toggle('scrolled', scrollY > 60);
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
    floorImg.src = `images/floor-${t.dataset.floor}.webp`;
    floorImg.alt = `Планировка ${t.dataset.floor} этажа`;
    floorImg.onload = () => floorImg.classList.remove('swap');
  }, reduceMotion ? 0 : 250);
}));
['3', '4', '5'].forEach(n => { const i = new Image(); i.src = `images/floor-${n}.webp`; });

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

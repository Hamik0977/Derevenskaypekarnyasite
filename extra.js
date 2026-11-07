// Новые блоки: калькулятор, сценарии владения, подбор апартамента, мобильная панель
(() => {
  const q1 = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];

  // ===== Калькулятор: доля собственника и управляющей компании =====
  const UK_SHARE = 0.2; // вознаграждение УК — 20% от прибыли
  const rub = v => v >= 1000
    ? `${(v / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} млн ₽`
    : `${Math.round(v).toLocaleString('ru-RU')} тыс. ₽`;
  function calcRun() {
    const n = +q1('#c-count').value, p = +q1('#c-profit').value, total = n * p;
    q1('#c-n').textContent = n;
    q1('#c-p').textContent = `${p.toLocaleString('ru-RU')} тыс. ₽`;
    q1('#c-own').textContent = rub(total * (1 - UK_SHARE));
    q1('#c-uk').textContent = rub(total * UK_SHARE);
    q1('#c-month').textContent = rub(total * (1 - UK_SHARE) / 12);
  }
  ['#c-count', '#c-profit'].forEach(s => q1(s).addEventListener('input', calcRun));
  calcRun();

  // ===== Сценарии владения =====
  qa('.mtab').forEach(t => t.addEventListener('click', () => {
    qa('.mtab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    qa('.mode').forEach((m, i) => m.classList.toggle('active', i === +t.dataset.m));
  }));

  // ===== Подбор апартамента =====
  const answers = {};
  const steps = qa('.q'), keys = ['goal', 'count', 'type'];
  function show(i) {
    steps.forEach((q, k) => q.classList.toggle('active', k === i));
    q1('#q-step').textContent = i < 3 ? `${i + 1} / 3` : 'Готово';
    q1('#q-bar').style.width = `${Math.min(i + 1, 3) / 3 * 100}%`;
  }
  steps.forEach((q, i) => q.querySelectorAll('.q__opts button').forEach(b => b.addEventListener('click', () => {
    answers[keys[i]] = b.textContent;
    if (i === 2) q1('#q-sum').textContent = `Цель: ${answers.goal}. Количество: ${answers.count}. Формат: ${answers.type}.`;
    show(i + 1);
  })));
  q1('#q-again').addEventListener('click', () => { keys.forEach(k => { answers[k] = undefined; }); show(0); });
  q1('#q-go').addEventListener('click', () => {
    const goal = answers.goal === 'Жить самому' ? 'Апартамент для себя'
      : (answers.count === '4 и больше' || answers.count === '2–3') ? 'Несколько апартаментов' : 'Инвестиция';
    const r = document.querySelector(`#form input[value="${goal}"]`);
    if (r) r.checked = true;
    window.mechtaQuiz = answers.goal ? `Подбор: ${answers.goal}; ${answers.count}; ${answers.type}` : '';
  });

  // ===== Мобильная панель появляется после главного экрана =====
  const bar = q1('.mbar');
  const onScroll = () => bar.classList.toggle('show',
    scrollY > innerHeight * .8 && scrollY < document.documentElement.scrollHeight - innerHeight * 1.6);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

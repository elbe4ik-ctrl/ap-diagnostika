/* PerioScope — диагностика и план лечения агрессивного пародонтита.
   Все пороги взяты из диссертации Гайбуллаева Э.А. (таблицы главы 3, рис. 7.1, выводы).
   Данные пациентов хранятся только на этом устройстве (localStorage). */
'use strict';

/* ---------- Справочник показателей ---------- */
// ctrl / I / II — медианы контроля, юношеской (I) и быстропрогрессирующей (II) групп до лечения.
// dir: +1 — чем выше, тем больше за быстропрогрессирующую форму; -1 — чем ниже.
// w: вес при разграничении форм (2 — различие между группами p<=0,001; 1 — p<0,05; 0 — не различает формы).
const CLIN = [
  {k:'pd',  label:'Средняя глубина пародонтальных карманов', unit:'мм', I:5.4, II:6.1, dir:1, w:2, src:'табл. 3.5, рис. 7.1', hint:'Градуированный зонд или Florida Probe, по поражённым зубам'},
  {k:'cal', label:'Потеря зубодесневого прикрепления', unit:'мм', I:6.25, II:7.1, dir:1, w:2, src:'табл. 3.5', hint:'Средняя по поражённым зубам'},
  {k:'pbi', label:'Кровоточивость PBI (Мюллеманн–Саксер)', unit:'0–4', I:2.6, II:3.5, dir:1, w:2, src:'табл. 3.2, рис. 7.1', hint:'1 — точка, 2 — линия, 3 — треугольник, 4 — обильное кровотечение'},
  {k:'pma', label:'Индекс воспаления PMA', unit:'%', I:59.1, II:71.2, dir:1, w:2, src:'табл. 3.2, рис. 7.1', hint:'до 30% — лёгкое, 30–60% — среднее, >60% — тяжёлое воспаление'},
  {k:'ohis',label:'Гигиена OHI-S (Грин–Вермиллион)', unit:'0–3', I:2.6, II:3.2, dir:1, w:1, src:'табл. 3.2', hint:'Окрашивание эритрозином'},
  {k:'pi',  label:'Пародонтальный индекс PI (Рассел)', unit:'0–8', I:5.4, II:5.9, dir:1, w:1, src:'табл. 3.2', hint:''},
  {k:'mob', label:'Патологическая подвижность зубов', unit:'мм', I:1.19, II:1.31, dir:1, w:1, src:'табл. 3.6', hint:'Смещение пинцетом'},
];
const LAB = [
  {g:'Микроциркуляция (ЛДФ, аппарат «ЛАКК»)', items:[
    {k:'M',   label:'Показатель микроциркуляции M', unit:'пф. ед.', ctrl:19.1, I:16.5, II:13.7, dir:-1, w:2, src:'табл. 3.7'},
    {k:'sig', label:'Флакс σ', unit:'пф. ед.', ctrl:2.6, I:1.5, II:1.1, dir:-1, w:2, src:'табл. 3.7'},
    {k:'kv',  label:'Коэффициент вариации Kv', unit:'%', ctrl:16.1, I:10.2, II:8.7, dir:-1, w:2, src:'табл. 3.7'},
  ]},
  {g:'Оксиметрия тканей пародонта', items:[
    {k:'sm',  label:'Перфузионная сатурация Sm', unit:'%', ctrl:3.5, I:3.3, II:3.1, dir:-1, w:1, src:'табл. 3.8'},
    {k:'u',   label:'Удельное потребление кислорода U', unit:'%', ctrl:1.3, I:1.2, II:1.0, dir:-1, w:1, src:'табл. 3.8'},
    {k:'spo2',label:'SpO₂ тканей', unit:'%', ctrl:94.2, I:92.1, II:90.5, dir:-1, w:1, src:'табл. 3.8, рис. 7.1'},
  ]},
  {g:'Клеточный иммунитет (кровь)', items:[
    {k:'cd3', label:'CD3+', unit:'%', ctrl:65, I:56, II:59, dir:1, w:0, src:'табл. 3.9'},
    {k:'cd4', label:'CD4+', unit:'%', ctrl:39.3, I:36.8, II:34.1, dir:-1, w:2, src:'табл. 3.9'},
    {k:'cd8', label:'CD8+', unit:'%', ctrl:28.1, I:28.4, II:30.6, dir:1, w:1, src:'табл. 3.9'},
    {k:'cd48',label:'CD4+/CD8+', unit:'', ctrl:1.4, I:1.3, II:1.1, dir:-1, w:1, src:'табл. 3.9'},
  ]},
  {g:'Гуморальный иммунитет и неспецифическая защита (кровь)', items:[
    {k:'cd20',label:'CD20+', unit:'%', ctrl:12.1, I:11.2, II:8.1, dir:-1, w:2, src:'табл. 3.10'},
    {k:'igm_s',label:'IgM сыворотки', unit:'%', ctrl:7.8, I:9.4, II:11.4, dir:1, w:2, src:'табл. 3.10'},
    {k:'cik', label:'ЦИК', unit:'ед.', ctrl:33.1, I:72.1, II:89.1, dir:1, w:2, src:'табл. 3.10'},
    {k:'cd16',label:'CD16+', unit:'%', ctrl:11.8, I:27.1, II:28.1, dir:1, w:0, src:'табл. 3.11'},
    {k:'fal', label:'Фагоцитарная активность лейкоцитов (ФАЛ)', unit:'%', ctrl:60.1, I:41.4, II:37.5, dir:-1, w:2, src:'табл. 3.11'},
  ]},
  {g:'Местный иммунитет (слюна)', items:[
    {k:'iga', label:'IgA слюны', unit:'г/л', ctrl:0.22, I:0.19, II:0.18, dir:-1, w:1, src:'табл. 3.12'},
    {k:'siga',label:'s-IgA слюны', unit:'г/л', ctrl:0.51, I:0.48, II:0.42, dir:-1, w:2, src:'табл. 3.12'},
    {k:'igg', label:'IgG слюны', unit:'г/л', ctrl:0.05, I:0.11, II:0.23, dir:1, w:2, src:'табл. 3.12'},
    {k:'igm', label:'IgM слюны', unit:'г/л', ctrl:0.012, I:0.014, II:0.015, dir:1, w:1, src:'табл. 3.12'},
  ]},
  {g:'Цитокины десневой жидкости (ИФА)', items:[
    {k:'il1', label:'IL-1β', unit:'пг/мл', ctrl:91.9, I:228.2, II:419.4, dir:1, w:2, src:'табл. 3.13'},
    {k:'il4', label:'IL-4', unit:'пг/мл', ctrl:42, I:40.3, II:12.6, dir:-1, w:2, src:'табл. 3.13'},
    {k:'tnf', label:'TNF-α', unit:'пг/мл', ctrl:75.1, I:411.6, II:777.1, dir:1, w:2, src:'табл. 3.13'},
  ]},
  {g:'Микрофлора пародонтальных карманов (цитология)', items:[
    {k:'amoeb',label:'Амёбы (простейшие)', unit:'%', ctrl:0, I:54.1, II:63.2, dir:1, w:2, src:'табл. 3.18'},
    {k:'fungi',label:'Грибы', unit:'%', ctrl:0, I:3, II:5.1, dir:1, w:2, src:'табл. 3.18'},
    {k:'filam',label:'Нитчатые формы', unit:'%', ctrl:50, I:51, II:66.1, dir:1, w:1, src:'табл. 3.18'},
  ]},
  {g:'Кристаллография слюны (необязательно)', items:[
    {k:'perif',label:'Размер периферической зоны фации', unit:'мкм', ctrl:28.4, I:53.7, II:72.1, dir:1, w:2, src:'табл. 3.19'},
  ]},
];
const LAB_ALL = LAB.flatMap(g => g.items);
const cut = d => (d.I + d.II) / 2;            // граница между формами
const abn = d => (d.ctrl + d.I) / 2;          // граница «норма — отклонение»
const isAbn = (d, v) => (d.I >= d.ctrl ? v > abn(d) : v < abn(d));

/* ---------- Состояние ---------- */
const LS = 'apd.patients.v1';
function loadAll(){ try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch(e){ return []; } }
function saveAll(list){ try { localStorage.setItem(LS, JSON.stringify(list)); } catch(e){} }
function blank(){ return {id: 'p' + Date.now(), name:'', card:'', date:new Date().toISOString().slice(0,10), s1:{}, s2:{}, step:1, confirmed:false, override:false}; }
let P = blank();
let step = 1;

function persist(){
  if (P.demo) return;   // демо-пациенты не сохраняются в список
  P.updated = Date.now();
  const list = loadAll().filter(x => x.id !== P.id);
  if (P.name || Object.keys(P.s1).length) { list.unshift(P); saveAll(list.slice(0, 500)); }
}
const num = v => { if (v === undefined || v === null || v === '') return null; const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; };
const fmt = (n, d=1) => n === null || n === undefined ? '—' : (Math.round(n * 10**d) / 10**d).toString().replace('.', ',');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- Этап 1: быстрая клиническая проверка ---------- */
const SUPPORT = [
  {k:'disprop', t:'Разрушение пародонта сильнее, чем можно объяснить количеством налёта и камня'},
  {k:'family',  t:'У родителей, братьев или сестёр рано выпадали зубы / был пародонтит'},
  {k:'rapid',   t:'Быстрое ухудшение: за последние 1–2 года заметно выросли карманы или подвижность'},
  {k:'early',   t:'Первые признаки (кровоточивость, подвижность) появились до 16 лет'},
];
const EXCL = [
  {k:'dm',    t:'Сахарный диабет или другая эндокринная патология'},
  {k:'immun', t:'Иммунодефицит, ВИЧ, гепатит В или С'},
  {k:'somat', t:'Тяжёлое хроническое заболевание внутренних органов, онкология'},
  {k:'smoke', t:'Курение, наркотическая или алкогольная зависимость'},
  {k:'preg',  t:'Беременность или кормление грудью'},
  {k:'ortho', t:'Брекеты, ортодонтические металлические конструкции, аномалии развития зубов и челюстей'},
];

function s1Eval(){
  const s = P.s1;
  const age = num(s.age), pd = num(s.pd), cal = num(s.cal), bone = num(s.bone), teeth = num(s.teeth);
  const r = {age, pd, cal, bone, teeth, missing:[]};
  ['age','pd','cal','pbi','pma'].forEach(k => { if (num(s[k]) === null) r.missing.push(k); });
  r.excl = EXCL.filter(e => s['x_' + e.k]);
  r.ratio = (bone !== null && age) ? bone / age : null;     // % потери кости / возраст
  r.grade = r.ratio === null ? null : (r.ratio < 0.25 ? 'A' : r.ratio <= 1 ? 'B' : 'C');
  r.lesion = (pd !== null && pd >= 4) || (cal !== null && cal >= 3);
  r.support = SUPPORT.filter(x => s['s_' + x.k]).map(x => x.t);
  if (r.grade === 'B' || r.grade === 'C') r.support.push('Потеря кости опережает возраст (индекс ' + fmt(r.ratio, 2) + ', степень ' + r.grade + ')');
  if (s.pattern === 'mi') r.support.push('Типичная локализация: первые моляры и резцы');
  if (s.pattern === 'gen' || (teeth !== null && teeth > 30)) r.support.push('Генерализованное поражение (более 30% зубов)');
  r.ageOk = age !== null && age >= 12 && age <= 25;
  // решение
  if (r.missing.length) r.status = 'incomplete';
  else if (r.excl.length) r.status = 'excluded';
  else if (!r.lesion) r.status = 'no';
  else if (r.support.length >= 2) r.status = r.ageOk ? 'yes' : 'probable';
  else if (r.support.length === 1) r.status = 'probable';
  else r.status = 'no';
  r.form = formScore(false);
  return r;
}

function formScore(withLab){
  const votes = [];
  CLIN.forEach(d => {
    const v = num(P.s1[d.k]); if (v === null || !d.w) return;
    votes.push({label:d.label, v, unit:d.unit, side:(v - cut(d)) * d.dir > 0 ? 'r' : 'j', w:d.w, cutv:cut(d), d});
  });
  const age = num(P.s1.age);
  if (age !== null) { if (age >= 18) votes.push({label:'Возраст', v:age, unit:'лет', side:'r', w:1, note:'18 лет и старше'}); else if (age <= 14) votes.push({label:'Возраст', v:age, unit:'лет', side:'j', w:1, note:'14 лет и младше'}); }
  // Формальная степень (% потери кости / возраст) у подростков почти всегда C, поэтому формы она не различает и в голосовании не участвует.
  if (withLab) LAB_ALL.forEach(d => {
    const v = num(P.s2[d.k]); if (v === null || !d.w) return;
    votes.push({label:d.label, v, unit:d.unit, side:(v - cut(d)) * d.dir > 0 ? 'r' : 'j', w:d.w, cutv:cut(d), d, lab:true});
  });
  const tw = votes.reduce((a, x) => a + x.w, 0);
  const rw = votes.filter(x => x.side === 'r').reduce((a, x) => a + x.w, 0);
  const share = tw ? rw / tw : null;
  let form = null;
  if (share !== null) form = share >= 0.6 ? 'r' : share <= 0.4 ? 'j' : 'mix';
  return {votes, share, form, n:votes.length, nlab:votes.filter(x => x.lab).length};
}
function s1Grade(){
  const age = num(P.s1.age), bone = num(P.s1.bone);
  if (age === null || bone === null || !age) return null;
  const ratio = bone / age;
  return {ratio, grade: ratio < 0.25 ? 'A' : ratio <= 1 ? 'B' : 'C'};
}

/* ---------- Тяжесть, стадия, патогенетический профиль, прогноз ---------- */
function severity(){
  const pd = num(P.s1.pd), bone = num(P.s1.bone), kpi = num(P.s1.kpi), cal = num(P.s1.cal), lost = num(P.s1.lost);
  // Тяжесть — как в диссертации: по КПИ (Леус), плюс резорбция кости по снимку (до 1/3, 1/3–1/2, более 1/2).
  const lvl = [];
  if (kpi !== null) lvl.push(kpi <= 2 ? 1 : kpi <= 3.5 ? 2 : 3);
  if (bone !== null) lvl.push(bone < 33 ? 1 : bone <= 50 ? 2 : 3);
  if (!lvl.length && pd !== null) lvl.push(pd < 4 ? 1 : pd <= 6 ? 2 : 3);
  const L = lvl.length ? Math.max(...lvl) : null;
  const names = {1:'лёгкой', 2:'средней', 3:'тяжёлой'};
  let kpiTxt = null;
  if (kpi !== null) kpiTxt = kpi <= 1 ? 'риск заболевания' : kpi <= 2 ? 'лёгкая' : kpi <= 3.5 ? 'средняя' : 'тяжёлая';
  let stage = null;
  if (cal !== null) stage = cal <= 2 ? 'I' : cal <= 4 ? 'II' : 'III';
  if (lost !== null && lost >= 5) stage = 'IV';
  else if (stage === 'III' && lost !== null && lost >= 1) stage = 'III';
  const g = s1Grade();
  const teeth = num(P.s1.teeth);
  const extent = P.s1.pattern === 'mi' ? 'молярно-резцовое поражение' : (P.s1.pattern === 'gen' || (teeth !== null && teeth > 30)) ? 'генерализованная форма' : (P.s1.pattern === 'loc' ? 'локализованная форма' : null);
  const nom = {1:'лёгкая', 2:'средняя', 3:'тяжёлая'};
  return {level:L, name:L ? names[L] : null, nom:L ? nom[L] : null, kpiTxt, stage, grade:g ? g.grade : null, extent};
}

const PROFILE = [
  {k:'mcr',  t:'Нарушена микроциркуляция в дёснах', keys:['M','sig','kv']},
  {k:'hyp',  t:'Кислородное голодание тканей (гипоксия)', keys:['spo2','sm','u']},
  {k:'cell', t:'Снижен клеточный иммунитет (Т-звено)', keys:['cd3','cd4','cd48','cd8']},
  {k:'hum',  t:'Нарушен гуморальный иммунитет', keys:['cd20','igm_s','cik']},
  {k:'phag', t:'Снижена неспецифическая защита (фагоцитоз)', keys:['fal']},
  {k:'loc',  t:'Ослаблен местный иммунитет полости рта', keys:['siga','iga','igg','igm']},
  {k:'cyt',  t:'Провоспалительный сдвиг цитокинов', keys:['il1','tnf','il4']},
  {k:'mic',  t:'Высокая микробная нагрузка (простейшие, грибы)', keys:['amoeb','fungi','filam']},
];
function profile(){
  return PROFILE.map(p => {
    const ent = p.keys.map(k => LAB_ALL.find(d => d.k === k)).filter(d => num(P.s2[d.k]) !== null);
    const bad = ent.filter(d => isAbn(d, num(P.s2[d.k])));
    return {...p, entered:ent.length, bad:bad.map(d => d.label), on:bad.length > 0};
  });
}
function prognosis(form){
  const v = k => num(P.s2[k]);
  const signs = [];
  const chk = (k, cond, t) => { if (v(k) !== null && cond(v(k))) signs.push(t); };
  chk('cd4', x => x < 35.45, 'CD4+ снижен до уровня быстропрогрессирующей формы');
  chk('cd3', x => x < 60.5, 'CD3+ снижен');
  chk('siga', x => x < 0.45, 's-IgA слюны снижен');
  chk('iga', x => x < 0.185, 'IgA слюны снижен');
  chk('tnf', x => x > 594, 'TNF-α резко повышен');
  chk('il4', x => x < 26.5, 'IL-4 подавлен');
  chk('amoeb', x => x > 58.7, 'много простейших в карманах');
  chk('fungi', x => x > 4.05, 'много грибов в карманах');
  chk('spo2', x => x < 91.3, 'выраженная гипоксия тканей');
  let level;
  if (form === 'r' || signs.length >= 3) level = 'bad';
  else if (form === 'mix' || signs.length >= 1) level = 'warn';
  else level = 'ok';
  return {signs, level};
}

/* ---------- План лечения ---------- */
function buildPlan(){
  const fs = formScore(true);
  const form = fs.form === 'j' ? 'j' : 'r';     // смешанный вариант ведём как быстропрогрессирующий
  const prof = profile();
  const on = k => (prof.find(p => p.k === k) || {}).on;
  const age = num(P.s1.age);
  const minor = age !== null && age < 18;
  const sev = severity();
  const prog = prognosis(fs.form);
  const st = [];

  st.push({t:'Этап 0. Подготовка', when:'Первый визит',
    li:[
      minor ? 'Информированное согласие подписывает законный представитель (пациенту ' + age + ' лет) и сам подросток.' : 'Информированное согласие пациента.',
      'Пародонтограмма (Florida Probe или online-карта Бернского университета), фото.',
      'Рентген: ОПТГ; при спорной картине и для оценки фуркаций — КЛКТ.',
      'Отметить исходные индексы: OHI-S, PMA, PBI, PI, КПИ — с ними будете сравнивать на контролях.',
      'Если при обследовании появилось подозрение на соматическое заболевание или иммунодефицит — направить к терапевту/иммунологу до начала лечения.',
    ]});

  st.push({t:'Этап 1. Профессиональная гигиена и санация', when:'Визиты 1–2',
    li:[
      'Удаление мягкого и пигментированного налёта: наддесневые отложения — глициновый порошок 65 мкм, поддесневые — 25 мкм.',
      'Удаление над- и поддесневых отложений аппаратом Vector (Dürr Dental) с суспензией гидроксиапатита; полировка корней.',
      'Полировка всех поверхностей (щётки, резиновые конусы, флоссы, штрипсы), фторсодержащий лак.',
      'Обработка карманов 0,05% раствором хлоргексидина.',
      'Обучение чистке зубов, контролируемая чистка, проверка эритрозином; паста без хлоргексидина.',
    ]});

  const fdt = 'Фотодинамическая терапия (ФДТ) аппаратом FotoSan: фотосенсибилизатор в карман, активация светом 625–635 нм.';
  const thz = 'ТГЧ-терапия на частоте 129 ГГц аппаратом «Орбита»: мощность 250 мкВт, облучатель в 1 см от слизистой, 15 минут, 1 раз в день, курс 10 сеансов.';
  st.push({t:'Этап 2. Основное лечение: ФДТ + ТГЧ-терапия', when:'Начать сразу после санации; ТГЧ — 10 дней подряд',
    li:[fdt, thz,
      'Это схема подгрупп ' + (form === 'j' ? 'Ic' : 'IIc') + ' (ФДТ + ТГЧ) — в диссертации она дала лучший результат для ' + (form === 'j' ? 'юношеской' : 'быстропрогрессирующей') + ' формы.',
      'Если нет аппарата «Орбита» — ФДТ одна (схема ' + (form === 'j' ? 'Ia' : 'IIa') + '); если нет FotoSan — одна ТГЧ-терапия (схема ' + (form === 'j' ? 'Ib' : 'IIb') + '). Эффект при этом слабее.'],
    notes:[{c:'warn', t:'Название фотосенсибилизатора и число сеансов ФДТ в диссертации не указаны — используйте инструкцию к набору FotoSan.'}]});

  const meds = [
    'Производное 5-нитроимидазола (метронидазол, АТХ J01XD01) — противомикробное и противопротозойное средство.',
    'Системный антибиотик из группы фторхинолонов (ципрофлоксацин) вместе с 5-нитроимидазолом — широкий спектр, включая анаэробы.',
    'Аппликации 10% метилурациловой мази на десну 2 раза в день по 20 минут, 15–30 дней.',
    'Местно «Эплан» (гликолан) — противовоспалительное и ранозаживляющее действие.',
    'Алендронат натрия («Алендра») — торможение резорбции кости.',
    'Кальций + витамин D3 с остеотропными минералами («Кальцемин»).',
    'НПВС по показаниям; пробиотик (лакто-, бифидобактерии) на время антибиотиков.',
    'Питание: достаточно белка и микроэлементов, меньше рафинированных углеводов.',
  ];
  const medNotes = [{c:'info', t:'Дозы и длительность — по утверждённым протоколам МЗ Республики Узбекистан и инструкциям к препаратам; в программе они намеренно не указаны.'}];
  if (minor) medNotes.push({c:'warn', t:'Пациенту ' + age + ' лет. Фторхинолоны и алендронат у несовершеннолетних применяются ограниченно — назначение только после взвешенного решения врача, при необходимости с педиатром.'});
  st.push({t:'Этап 3. Медикаментозное лечение', when:'Параллельно с этапом 2', li:meds, notes:medNotes});

  if (form === 'r' || on('cell') || on('hum') || on('phag') || on('loc')) {
    const why = prof.filter(p => ['cell','hum','phag','loc'].includes(p.k) && p.on).map(p => p.t.toLowerCase());
    st.push({t:'Этап 3а. Иммунокоррекция', when:'После результатов иммунограммы',
      li:[
        'Консультация иммунолога для подбора иммунокоррекции' + (why.length ? ': ' + why.join('; ') + '.' : '.'),
        'Повторить иммунограмму и s-IgA слюны через 1 и 3 месяца.',
      ],
      notes:[{c:'src', t:'Основание: выводы 3 и 9 и практическая рекомендация 2 диссертации; конкретные препараты иммунокоррекции в диссертации не определены.'}]});
  }

  const ctrl = [
    '15 дней: OHI-S, PMA, PBI, PI, глубина карманов, подвижность; ЛДФ и оксиметрия.',
    '1 месяц: то же + иммунограмма, иммуноглобулины слюны, цитокины десневой жидкости, цитология карманов.',
    '3 месяца: полный повтор обследования, рентген.',
  ];
  const ctrlNotes = [];
  if (form === 'j') ctrlNotes.push({c:'info', t:'Признак ремиссии юношеской формы через 1 месяц: IL-4 растёт, IL-1β и TNF-α снижаются. Ориентиры по индексам: PBI до 2,4, PI до 4,7.'});
  else ctrlNotes.push({c:'warn', t:'При быстропрогрессирующей форме улучшение слабее и короче: в диссертации к 3 месяцам большинство показателей вернулись к исходным. Контроль — не реже 1 раза в месяц.'});
  st.push({t:'Этап 4. Контроль эффективности', when:'Через 15 дней, 1 месяц и 3 месяца', li:ctrl, notes:ctrlNotes});

  const sup = [
    'Повторный курс ФДТ и ТГЧ-терапии, если ухудшилась клиника или изменилась поддесневая микрофлора.',
    'Иммунокоррекция по данным лабораторного контроля.',
    'Противовоспалительные и регенерирующие средства для слизистой.',
    'Профессиональная гигиена и контроль домашней гигиены (эритрозин) — каждые ' + (form === 'j' ? '3' : '1–2') + ' месяца.',
  ];
  if (form === 'r') sup.unshift('Плановый повторный курс ФДТ + ТГЧ к 3-му месяцу, не дожидаясь возврата симптомов.');
  st.push({t:'Этап 5. Поддерживающая терапия и профилактика', when:'После 3 месяцев — постоянно', li:sup,
    notes: form === 'r' ? [{c:'src', t:'Если консервативное лечение не останавливает разрушение кости, следующий шаг — хирургическое лечение. В диссертации хирургический этап не изучался.'}] : []});

  return {form, fs, prof, sev, prog, st, minor};
}

/* ---------- Отрисовка ---------- */
const $ = s => document.querySelector(s);
const main = $('#main');

function field(k, label, unit, hint, store='s1', type='dec'){
  const val = P[store][k] ?? '';
  const inp = type === 'date' ? `<input type="date" data-s="${store}" data-k="${k}" value="${esc(val)}">`
    : type === 'text' ? `<input type="text" data-s="${store}" data-k="${k}" value="${esc(val)}">`
    : `<input type="text" inputmode="decimal" autocomplete="off" data-s="${store}" data-k="${k}" value="${esc(val)}" placeholder="—">`;
  return `<div class="f"><label>${esc(label)}${unit ? ` <span class="u">(${esc(unit)})</span>` : ''}</label>${inp}${hint ? `<small>${esc(hint)}</small>` : ''}</div>`;
}
function check(k, t, danger){
  const on = !!P.s1[k];
  return `<label class="chk ${danger ? 'danger' : ''} ${on ? 'on' : ''}"><input type="checkbox" data-s="s1" data-k="${k}" ${on ? 'checked' : ''}><span>${esc(t)}</span></label>`;
}
function seg(k, opts){
  return `<div class="seg">${opts.map(([v, t]) => `<label class="${P.s1[k] === v ? 'on' : ''}"><input type="radio" name="${k}" data-s="s1" data-k="${k}" value="${v}" ${P.s1[k] === v ? 'checked' : ''}>${esc(t)}</label>`).join('')}</div>`;
}
function patientBar(){
  return `<div class="patient-bar">
    <div class="f"><label>Пациент (Ф.И.О. или код)</label><input type="text" data-s="root" data-k="name" value="${esc(P.name)}" placeholder="Например: А.Б., 2009 г.р."></div>
    <div class="f" style="flex:0 1 160px"><label>№ карты</label><input type="text" data-s="root" data-k="card" value="${esc(P.card)}"></div>
    <div class="f" style="flex:0 1 170px"><label>Дата осмотра</label><input type="date" data-s="root" data-k="date" value="${esc(P.date)}"></div>
  </div>`;
}

function renderStep1(){
  main.innerHTML = patientBar() + `
  <h2 class="sec">Этап 1. Быстрая проверка</h2>
  <p class="lead">Только то, что видно в кресле и на снимке. Программа скажет, похоже ли это на агрессивный пародонтит и какую форму ожидать.</p>

  <div class="card"><h3>Пациент и анамнез</h3>
    <div class="grid">
      ${field('age','Возраст','лет','Алгоритм построен на пациентах 14–19 лет')}
      ${field('dur','Сколько лет назад появились первые признаки','лет','')}
      <div class="f"><label>Пол</label>${seg('sex',[['m','муж.'],['f','жен.']])}</div>
    </div>
    <p class="hint" style="margin-top:12px">Отметьте, если есть:</p>
    <div class="checks">${SUPPORT.map(x => check('s_' + x.k, x.t)).join('')}</div>
  </div>

  <div class="card"><h3>Исключения <span class="tag">важно</span></h3>
    <p class="hint">Если есть хоть одно — программа не ставит диагноз: сначала нужна консультация смежного специалиста.</p>
    <div class="checks">${EXCL.map(x => check('x_' + x.k, x.t, true)).join('')}</div>
  </div>

  <div class="card"><h3>Осмотр и зондирование</h3>
    <div class="grid">${CLIN.map(d => field(d.k, d.label, d.unit, d.hint)).join('')}
      ${field('kpi','КПИ (Леус)','0–5','По нему определяется тяжесть: 2,1–3,5 — средняя')}
    </div>
  </div>

  <div class="card"><h3>Рентген и распространённость</h3>
    <div class="grid">
      ${field('bone','Наибольшая потеря кости','% длины корня','По ОПТГ/КЛКТ, на самом поражённом зубе')}
      ${field('teeth','Доля поражённых зубов','%','Более 30% — генерализованная форма')}
      ${field('lost','Зубов потеряно из-за пародонтита','шт.','')}
    </div>
    <div class="f" style="margin-top:12px"><label>Где поражение</label>${seg('pattern',[['mi','первые моляры и резцы'],['gen','генерализованно'],['loc','отдельные зубы']])}</div>
  </div>

  <div id="s1v"></div>`;
  updateS1();
  welcome();
}

const S1TEXT = {
  incomplete:['warn','Заполните обязательные поля','Нужны возраст, глубина карманов, потеря прикрепления, PBI и PMA.'],
  excluded:['bad','Программа не применима','Есть состояние из списка исключений. Сначала — консультация смежного специалиста; агрессивный пародонтит ставится только после его исключения.'],
  no:['bad','Агрессивный пародонтит не подтверждается','Признаков мало. Рассмотрите гингивит или хронический пародонтит и ведите по общему протоколу.'],
  probable:['warn','Агрессивный пародонтит вероятен','Клиника похожа, но признаков пока недостаточно. Расширенная диагностика поможет уточнить.'],
  yes:['ok','Агрессивный пародонтит — клинически подтверждён','Переходите к расширенной диагностике: она уточнит форму, тяжесть и прогноз.'],
};
const MISSING_NAMES = {age:'возраст', pd:'глубина карманов', cal:'потеря прикрепления', pbi:'PBI', pma:'PMA'};

function formBlock(fs, title){
  if (fs.share === null) return '';
  const pr = Math.round(fs.share * 100), pj = 100 - pr;
  const name = fs.form === 'r' ? 'быстропрогрессирующая' : fs.form === 'j' ? 'юношеская' : 'пограничная картина';
  return `<p><b>${title}:</b> ${name}</p>
    <div class="meter"><i class="j" style="width:${pj}%"></i><i class="r" style="width:${pr}%"></i></div>
    <div class="legend"><span>юношеская ${pj}%</span><span>по ${fs.n} признакам</span><span>быстропрогрессирующая ${pr}%</span></div>`;
}

function updateS1(){
  const r = s1Eval();
  const [cls, title, text] = S1TEXT[r.status];
  let extra = '';
  if (r.status === 'incomplete') extra = `<p class="missing">Не хватает: ${r.missing.map(k => MISSING_NAMES[k]).join(', ')}.</p>`;
  if (r.status === 'excluded') extra = `<ul>${r.excl.map(e => `<li>${esc(e.t)}</li>`).join('')}</ul>`;
  if (['yes','probable','no'].includes(r.status)) {
    extra += r.support.length ? `<p><b>Что говорит за агрессивный пародонтит:</b></p><ul>${r.support.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
    if (!r.lesion) extra += `<p>Глубина карманов меньше 4 мм и потеря прикрепления меньше 3 мм.</p>`;
    if (r.age !== null && !r.ageOk) extra += `<p class="note warn">Возраст ${r.age} лет вне диапазона, на котором построен алгоритм (14–19 лет). Решение — за врачом.</p>`;
  }
  if (['yes','probable'].includes(r.status)) extra += formBlock(r.form, 'Предварительная форма');
  $('#s1v').innerHTML = `<div class="verdict ${cls}"><div class="k">Результат этапа 1</div><div class="v">${title}</div><p>${text}</p>${extra}</div>`;
  P.confirmed = r.status === 'yes' || (r.status === 'probable' && P.override);
  renderActions();
  renderNav();
}

function renderStep2(){
  main.innerHTML = patientBar() + `
  <h2 class="sec">Этап 2. Расширенная диагностика</h2>
  <p class="lead">Внесите те результаты, которые есть. Чем больше показателей, тем точнее программа определит форму и прогноз. Пустые поля не учитываются.</p>
  ${LAB.map(g => `<div class="card"><h3>${esc(g.g)}</h3>
    <div class="grid">${g.items.map(d => field(d.k, d.label, d.unit, 'Норма ≈ ' + fmt(d.ctrl, d.ctrl < 1 ? 3 : 1) + (d.w ? ' · граница форм ' + fmt(cut(d), cut(d) < 1 ? 3 : 2) : ''), 's2')).join('')}</div>
  </div>`).join('')}
  <div id="s2v"></div>`;
  updateS2();
}
function updateS2(){
  const fs = formScore(true);
  $('#s2v').innerHTML = `<div class="verdict brand"><div class="k">Промежуточный итог</div><div class="v">Внесено лабораторных показателей: ${fs.nlab} из ${LAB_ALL.length}</div>${formBlock(fs, 'Форма по всем данным')}</div>`;
  renderActions();
}

function renderStep3(){
  const fs = formScore(true), sev = severity(), prof = profile(), prog = prognosis(fs.form);
  const formName = fs.form === 'r' ? 'Быстропрогрессирующий агрессивный пародонтит' : fs.form === 'j' ? 'Юношеский агрессивный пародонтит' : 'Агрессивный пародонтит, пограничная форма';
  const dGrade = fs.form === 'j' ? 'B' : 'C';   // как в диссертации: юношеская — B, быстропрогрессирующая — C
  const parts = [sev.extent, sev.name ? sev.name + ' степени тяжести' : null, 'скорость прогрессирования ' + dGrade].filter(Boolean);
  const dx = formName + (parts.length ? ', ' + parts.join(', ') : '');
  P.dx = dx;
  const conf = fs.nlab >= 10 ? 'высокая' : fs.nlab >= 4 ? 'средняя' : 'низкая (мало лабораторных данных)';
  const progTxt = {ok:['ok','Благоприятный','Ожидается хороший ответ на лечение и ремиссия.'], warn:['warn','Настороженный','Ответ на лечение возможен, но нужен тщательный контроль.'], bad:['bad','Неблагоприятный','Ответ на стандартное лечение может быть недостаточным — нужна усиленная схема и частый контроль.']}[prog.level];
  main.innerHTML = patientBar() + `
  <h2 class="sec">Этап 3. Окончательный диагноз</h2>
  <div class="print-only"><b>Пациент:</b> ${esc(P.name)} · карта ${esc(P.card)} · ${esc(P.date)}</div>
  <div class="verdict brand">
    <div class="k">Диагноз</div>
    <div class="v">${esc(dx)}</div>
    ${formBlock(fs, 'Разграничение форм')}
    <p>Надёжность вывода: ${conf}.</p>
    ${fs.form === 'mix' ? '<p>Признаки разделились поровну. Для безопасности программа ведёт пациента как при быстропрогрессирующей форме.</p>' : ''}
  </div>

  <div class="card"><h3>Тяжесть и стадия</h3>
    <div class="tablewrap"><table class="t">
      <tr><th>Критерий</th><th>Результат</th><th>Основание</th></tr>
      <tr><td>Степень тяжести</td><td><b>${sev.nom || '—'}</b></td><td>КПИ и резорбция кости (до 1/3 — лёгкая, 1/3–1/2 — средняя, более 1/2 — тяжёлая)</td></tr>
      <tr><td>КПИ (Леус)</td><td>${fmt(num(P.s1.kpi))} — ${sev.kpiTxt || '—'}</td><td>0–1 риск, 1,1–2 лёгкая, 2,1–3,5 средняя, 3,6–5 тяжёлая</td></tr>
      <tr><td>Стадия (классификация 2017 г.)</td><td>${sev.stage || '—'}</td><td>потеря прикрепления; IV — 5 и более потерянных зубов</td></tr>
      <tr><td>Скорость прогрессирования</td><td><b>${dGrade}</b>${sev.grade ? ' (формально по снимку: ' + sev.grade + ')' : ''}</td><td>По диссертации: юношеская форма — B, быстропрогрессирующая — C. Формальный расчёт (% потери кости / возраст: &lt;0,25 — A, 0,25–1 — B, &gt;1 — C) у подростков почти всегда даёт C.</td></tr>
      <tr><td>Распространённость</td><td>${sev.extent || '—'}</td><td>доля и расположение поражённых зубов</td></tr>
    </table></div>
  </div>

  <div class="card"><h3>Что нарушено у пациента</h3>
    <p class="hint">По внесённым анализам. От этого зависит план лечения.</p>
    <div class="tablewrap"><table class="t"><tr><th>Звено</th><th>Состояние</th><th>Отклонения</th></tr>
      ${prof.map(p => `<tr><td>${esc(p.t)}</td><td>${p.entered ? (p.on ? '<span class="pill badp">нарушено</span>' : '<span class="pill okp">в норме</span>') : '<span class="pill n">нет данных</span>'}</td><td>${esc(p.bad.join(', ')) || '—'}</td></tr>`).join('')}
    </table></div>
  </div>

  <div class="verdict ${progTxt[0]}"><div class="k">Прогноз</div><div class="v">${progTxt[1]}</div><p>${progTxt[2]}</p>
    ${prog.signs.length ? `<ul>${prog.signs.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
  </div>

  <div class="card noprint"><h3>По каким признакам решено</h3>
    <div class="tablewrap"><table class="t"><tr><th>Признак</th><th>Значение</th><th>Граница</th><th>Говорит за</th></tr>
      ${fs.votes.map(v => `<tr><td>${esc(v.label)}</td><td>${fmt(v.v, 2)} ${/–/.test(v.unit || '') ? '' : esc(v.unit || '')}</td><td>${v.cutv !== undefined ? fmt(v.cutv, v.cutv < 1 ? 3 : 2) : esc(v.note || '')}</td><td>${v.side === 'r' ? '<span class="pill r">быстропрогр.</span>' : '<span class="pill j">юношескую</span>'}</td></tr>`).join('')}
    </table></div>
  </div>`;
  renderActions();
}

function renderStep4(){
  const pl = buildPlan();
  main.innerHTML = patientBar() + `
  <h2 class="sec">Этап 4. План лечения</h2>
  <div class="print-only"><b>Пациент:</b> ${esc(P.name)} · карта ${esc(P.card)} · ${esc(P.date)}</div>
  <div class="verdict brand"><div class="k">Диагноз</div><div class="v">${esc(P.dx || '')}</div>
    <p>Схема лечения: <b>${pl.form === 'j' ? 'Ic' : 'IIc'}</b> — консервативное лечение + ФДТ + ТГЧ-терапия 129 ГГц.${pl.form === 'r' ? ' Усиленный контроль и иммунокоррекция.' : ''}</p></div>
  ${pl.st.map((s, i) => `<div class="plan-stage"><h4>${esc(s.t)}</h4><div class="when">${esc(s.when)}</div>
     <ul>${s.li.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
     ${(s.notes || []).map(n => `<div class="note ${n.c}">${esc(n.t)}</div>`).join('')}</div>`).join('')}
  <div class="note src">Программа помогает врачу, но не заменяет его решение. Основа: диссертация Гайбуллаева Э.А. «Агрессивный пародонтит у подростков: ФДТ и ТГЧ-терапия», 180 пациентов 14–19 лет.</div>`;
  renderActions();
}

/* ---------- Навигация и кнопки ---------- */
function canGo(n){
  if (n === 1) return true;
  if (n === 2) return P.confirmed;
  return P.confirmed && P.s2seen;
}
function renderNav(){
  document.querySelectorAll('#steps button').forEach(b => {
    const n = +b.dataset.step;
    b.disabled = !canGo(n);
    b.classList.toggle('active', n === step);
    b.classList.toggle('done', n < step && canGo(n));
  });
}
function go(n){
  if (!canGo(n)) return;
  step = n; P.step = n;
  if (n >= 2) P.s2seen = true;
  ({1:renderStep1, 2:renderStep2, 3:renderStep3, 4:renderStep4})[n]();
  renderNav(); persist(); window.scrollTo({top:0, behavior:'smooth'});
}
function renderActions(){
  const a = $('#actions'); let h = '';
  if (step === 1) {
    const r = s1Eval();
    if (r.status === 'probable' && !P.override) h += `<button class="btn ghost" id="aOverride">Подтверждаю диагноз как врач</button>`;
    h += `<button class="btn primary" id="aNext" ${P.confirmed ? '' : 'disabled'}>Дальше: расширенная диагностика →</button>`;
  } else if (step === 2) {
    h += `<button class="btn ghost" data-go="1">← Назад</button><button class="btn primary" data-go="3">Поставить диагноз →</button>`;
  } else if (step === 3) {
    h += `<button class="btn ghost" data-go="2">← Анализы</button><button class="btn ghost" id="aPrint">Печать</button><button class="btn primary" data-go="4">План лечения →</button>`;
  } else {
    h += `<button class="btn ghost" data-go="3">← Диагноз</button><button class="btn primary" id="aPrint">Печать / PDF</button>`;
  }
  a.innerHTML = h;
  const nx = $('#aNext'); if (nx) nx.onclick = () => { P.s2seen = true; go(2); };
  const ov = $('#aOverride'); if (ov) ov.onclick = () => { P.override = true; updateS1(); persist(); };
  const pr = $('#aPrint'); if (pr) pr.onclick = () => window.print();
  a.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { P.s2seen = true; go(+b.dataset.go); });
}

main.addEventListener('input', e => {
  const t = e.target, s = t.dataset.s, k = t.dataset.k; if (!s || !k) return;
  const val = t.type === 'checkbox' ? t.checked : t.value;
  if (s === 'root') P[k] = val; else P[s][k] = val;
  if (t.type === 'checkbox') t.closest('.chk').classList.toggle('on', t.checked);
  if (t.type === 'radio') t.closest('.seg').querySelectorAll('label').forEach(l => l.classList.toggle('on', l.contains(t)));
  if (s === 's1') { if (step === 1) updateS1(); }
  if (s === 's2' && step === 2) updateS2();
  persist();
});

/* ---------- Пациенты, алгоритм ---------- */
function dialog(title, html){ $('#dlgTitle').textContent = title; $('#dlgBody').innerHTML = html; $('#dlg').showModal(); }
function showPatients(){
  const list = loadAll();
  dialog('Пациенты на этом устройстве', list.length ? `<div class="list">${list.map(p => `<div class="item"><div><b>${esc(p.name || 'Без имени')}</b><div class="meta">${esc(p.date || '')}${p.card ? ' · карта ' + esc(p.card) : ''}${p.dx ? '<br>' + esc(p.dx) : ''}</div></div>
     <div class="sp"><button data-open="${p.id}">Открыть</button><button data-del="${p.id}" title="Удалить">✕</button></div></div>`).join('')}</div>
     <p class="note info">Данные хранятся только в этом браузере на этом устройстве и никуда не отправляются.</p>` : '<div class="empty">Пока нет сохранённых пациентов.</div>');
  $('#dlgBody').querySelectorAll('[data-open]').forEach(b => b.onclick = () => { P = loadAll().find(x => x.id === b.dataset.open); $('#dlg').close(); step = 1; go(Math.min(P.step || 1, P.confirmed ? 4 : 1)); });
  $('#dlgBody').querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Удалить пациента из списка?')) { saveAll(loadAll().filter(x => x.id !== b.dataset.del)); showPatients(); } });
}
function showAlgo(){
  const row = (d, lab) => `<tr><td>${esc(d.label)}</td><td>${lab ? fmt(d.ctrl, d.ctrl < 1 ? 3 : 1) : '—'}</td><td>${fmt(d.I, d.I < 1 ? 3 : 2)}</td><td>${fmt(d.II, d.II < 1 ? 3 : 2)}</td><td>${d.w ? (d.dir > 0 ? '&gt; ' : '&lt; ') + fmt(cut(d), cut(d) < 1 ? 3 : 2) : 'не различает'}</td><td>${esc(d.src)}</td></tr>`;
  dialog('Алгоритм диагностики и лечения', `
  <p><b>1. Быстрая проверка (в кресле).</b> Карманы ≥ 4 мм или потеря прикрепления ≥ 3 мм + не меньше двух признаков: разрушение больше, чем налёт; семейный анамнез; быстрое ухудшение; начало до 16 лет; потеря кости опережает возраст (≥ 0,25); типичная локализация или генерализованное поражение. При исключающем состоянии диагноз не ставится.</p>
  <p><b>2. Расширенная диагностика.</b> ЛДФ, оксиметрия, иммунограмма, иммуноглобулины слюны, цитокины десневой жидкости, цитология карманов.</p>
  <p><b>3. Окончательный диагноз.</b> Каждый показатель «голосует» за юношескую или быстропрогрессирующую форму; граница — середина между медианами групп I и II. Вес 2 — различие групп p ≤ 0,001, вес 1 — p &lt; 0,05; возраст 18+ — за быстропрогрессирующую, 14 и меньше — за юношескую. Доля «за быстропрогрессирующую» ≥ 60% — быстропрогрессирующая, ≤ 40% — юношеская, между — пограничная (ведётся как быстропрогрессирующая).</p>
  <p><b>4. План лечения.</b> Санация и профгигиена → ФДТ + ТГЧ 129 ГГц → медикаменты → иммунокоррекция по показаниям → контроль 15 дней / 1 / 3 месяца → поддерживающая терапия.</p>
  <div class="tablewrap"><table class="t"><tr><th>Показатель</th><th>Норма</th><th>I (юнош.)</th><th>II (быстропр.)</th><th>За быстропр.</th><th>Источник</th></tr>
    ${CLIN.map(d => row(d, false)).join('')}${LAB_ALL.map(d => row(d, true)).join('')}</table></div>
  <p class="note src">Медианы до лечения из главы 3 диссертации; схема разграничения — рис. 7.1; прогноз — выводы 3 и 9.</p>`);
}

/* ---------- Демо и справка ---------- */
const DEMO = {
  j: {name:'Демо: юношеская форма', s1:{age:'15', dur:'2', sex:'f', pd:'5,3', cal:'6,2', pbi:'2,5', pma:'58', ohis:'2,5', pi:'5,3', mob:'1,15', kpi:'2,8', bone:'25', teeth:'40', lost:'0', pattern:'mi', s_disprop:true, s_early:true},
      s2:{M:'16,4', sig:'1,5', kv:'10,1', sm:'3,3', spo2:'92', cd3:'56', cd4:'36,9', cd8:'28,4', cd48:'1,3', cd20:'11,1', igm_s:'9,4', cik:'71', fal:'41', iga:'0,19', siga:'0,48', igg:'0,11', il1:'230', il4:'40', tnf:'410', amoeb:'54', fungi:'3'}},
  r: {name:'Демо: быстропрогрессирующая форма', s1:{age:'17', dur:'3', sex:'m', pd:'6,2', cal:'7,1', pbi:'3,6', pma:'72', ohis:'3,2', pi:'5,9', mob:'1,3', kpi:'3,2', bone:'40', teeth:'45', lost:'0', pattern:'gen', s_disprop:true, s_family:true},
      s2:{M:'13,5', sig:'1,1', kv:'8,8', sm:'3,1', spo2:'90,4', cd3:'59', cd4:'34', cd8:'30,8', cd48:'1,1', cd20:'8,1', igm_s:'11,4', cik:'90', fal:'37', iga:'0,18', siga:'0,42', igg:'0,22', il1:'420', il4:'12,5', tnf:'780', amoeb:'63', fungi:'5'}},
};
function loadDemo(k){
  const d = DEMO[k];
  P = Object.assign(blank(), {id:'demo-' + k, name:d.name, card:'ДЕМО', s1:{...d.s1}, s2:{...d.s2}, confirmed:true, s2seen:true, demo:true});
  $('#dlg').open && $('#dlg').close();
  step = 1; go(1);
}
function showHelp(){
  dialog('Как пользоваться', `
  <p><b>PerioScope</b> помогает стоматологу поставить диагноз агрессивного пародонтита у подростков и молодых людей (14–19 лет), отличить юношескую форму от быстропрогрессирующей и получить готовый план лечения. Основа — диссертационное исследование 180 пациентов (EMU University, Самаркандский ГМУ).</p>
  <p><b>Четыре шага:</b></p>
  <ol>
    <li><b>Быстрая проверка</b> — то, что видно в кресле и на снимке. Программа сразу скажет, подтверждается ли диагноз.</li>
    <li><b>Расширенная диагностика</b> — открывается при подтверждённом диагнозе: иммунограмма, цитокины, микроциркуляция, микрофлора. Можно вносить не всё.</li>
    <li><b>Окончательный диагноз</b> — форма, тяжесть, стадия, нарушенные звенья и прогноз.</li>
    <li><b>План лечения</b> — пошаговая схема и контроль через 15 дней, 1 и 3 месяца. Кнопка «Печать / PDF».</li>
  </ol>
  <p><b>Попробуйте на примере:</b></p>
  <div class="seg" style="margin-bottom:12px"><label id="hDemoJ">Юношеская форма</label><label id="hDemoR">Быстропрогрессирующая форма</label></div>
  <p><b>Версии:</b> Windows и macOS (Chrome или Edge → значок «Установить» в адресной строке), Android (Chrome → ⋮ → «Установить приложение»), iPhone и iPad (Safari → «Поделиться» → «На экран „Домой“»). После первого открытия работает без интернета.</p>
  <p class="note info">Данные пациентов хранятся только на этом устройстве и никуда не отправляются. Дозы препаратов — по протоколам МЗ РУз. Решение всегда за врачом.</p>`);
  $('#dlgBody').insertAdjacentHTML('beforeend', '<button class="btn ghost" id="hAlgo" style="margin-top:8px">Подробно об алгоритме и порогах</button>');
  $('#hDemoJ').onclick = () => loadDemo('j');
  $('#hDemoR').onclick = () => loadDemo('r');
  $('#hAlgo').onclick = showAlgo;
}
function welcome(){
  if (step !== 1 || P.name || Object.keys(P.s1).length) return;
  const box = document.createElement('div');
  box.className = 'verdict brand noprint';
  box.innerHTML = `<div class="k">Впервые здесь?</div><div class="v" style="font-size:20px">Посмотрите, как работает программа, на готовом примере</div>
    <p>Откроется пациент с уже внесёнными данными — пройдите все 4 шага кнопками внизу.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;position:relative;z-index:1">
      <button class="btn ghost" id="wDemoJ">Пример: юношеская форма</button>
      <button class="btn ghost" id="wDemoR">Пример: быстропрогрессирующая</button>
      <button class="btn ghost" id="wHelp">Как пользоваться</button></div>`;
  main.prepend(box);
  $('#wDemoJ').onclick = () => loadDemo('j');
  $('#wDemoR').onclick = () => loadDemo('r');
  $('#wHelp').onclick = showHelp;
}

$('#steps').addEventListener('click', e => { const b = e.target.closest('button'); if (b && !b.disabled) go(+b.dataset.step); });
$('#btnPatients').onclick = showPatients;
$('#btnAlgo').onclick = showHelp;
$('#btnNew').onclick = () => { if (!P.name && !Object.keys(P.s1).length || confirm('Начать нового пациента? Текущий сохранён в списке.')) { P = blank(); step = 1; go(1); } };

go(1);

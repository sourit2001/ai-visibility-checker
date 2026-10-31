(() => {
  /* Where waitlist emails go. Paste a Formspree / Tally / Getform endpoint here.
     Left empty, the form opens an email to WAITLIST_EMAIL instead. */
  const WAITLIST_ENDPOINT = '';
  const WAITLIST_EMAIL = 'hello@mentioned.example';
  const STORE = 'mentioned-check-v1';

  const $ = (s, r = document) => r.querySelector(s);
  const form = $('#madlib');
  const f = {
    category: $('#f-category'), audience: $('#f-audience'), brand: $('#f-brand'),
    site: $('#f-site'), rival: $('#f-rival'),
  };
  const check = $('#check');
  const rowsEl = $('#rows');
  const tpl = $('#row-tpl');

  const ENGINES = [
    { id: 'chatgpt', name: 'ChatGPT', url: (q) => 'https://chatgpt.com/?hints=search&q=' + encodeURIComponent(q) },
    { id: 'perplexity', name: 'Perplexity', url: (q) => 'https://www.perplexity.ai/search?q=' + encodeURIComponent(q) },
    { id: 'google', name: 'Google AI Mode', url: (q) => 'https://www.google.com/search?udm=50&q=' + encodeURIComponent(q) },
  ];
  const MARKS = {
    rec: [['first', 'Named first'], ['named', 'Named'], ['no', 'Not named']],
    know: [['good', 'Gets it right'], ['wrong', 'Wrong or unsure']],
  };
  const POINTS = { first: 100, named: 60, no: 0 };

  let state = load() || { inputs: {}, questions: [], marks: {} };

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)); } catch { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }

  /* Inputs inside the sentence grow with their text in browsers without field-sizing. */
  const fit = (input) => { input.size = Math.max((input.value || input.placeholder).length, 4); };
  document.querySelectorAll('.blank input').forEach((i) => { fit(i); i.addEventListener('input', () => fit(i)); });

  function buildQuestions(v) {
    const qs = [
      { kind: 'rec', text: `What's the best ${v.category} for ${v.audience}?` },
      { kind: 'rec', text: `Can you recommend a good ${v.category} for ${v.audience}? I want something simple and affordable.` },
    ];
    if (v.rival) qs.push({ kind: 'rec', text: `What are the best alternatives to ${v.rival}?` });
    else qs.push({ kind: 'rec', text: `Which ${v.category} do ${v.audience} recommend most, and why?` });
    qs.push({ kind: 'know', text: `What is ${v.brand}${v.site ? ` (${v.site})` : ''}, and who is it for?` });
    return qs;
  }

  function render() {
    rowsEl.textContent = '';
    state.questions.forEach((q, qi) => {
      const li = tpl.content.firstElementChild.cloneNode(true);
      $('.row-kind', li).textContent = q.kind === 'know'
        ? 'Does the AI know your brand?'
        : `Buyer question ${qi + 1}: is ${state.inputs.brand} recommended?`;
      const text = $('.row-text', li);
      text.textContent = q.text;
      text.setAttribute('aria-label', `Question ${qi + 1}, editable`);
      text.addEventListener('blur', () => {
        const t = text.textContent.trim();
        if (t && t !== q.text) { q.text = t; save(); renderLinks(li, q); }
      });
      text.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); text.blur(); } });

      const engWrap = $('.row-engines', li);
      ENGINES.forEach((eng) => {
        const cell = document.createElement('div');
        cell.className = 'eng';
        const a = document.createElement('a');
        a.className = 'eng-open';
        a.target = '_blank';
        a.rel = 'noopener';
        a.dataset.engine = eng.id;
        a.textContent = `Ask ${eng.name}`;
        a.href = eng.url(q.text);
        const group = document.createElement('div');
        group.className = 'eng-marks';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', `What ${eng.name} said`);
        MARKS[q.kind].forEach(([v, label]) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.dataset.v = v;
          b.textContent = label;
          const key = `${qi}:${eng.id}`;
          b.setAttribute('aria-pressed', String(state.marks[key] === v));
          b.addEventListener('click', () => {
            state.marks[key] = state.marks[key] === v ? undefined : v;
            group.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(state.marks[key] === x.dataset.v)));
            save();
            score();
          });
          group.append(b);
        });
        cell.append(a, group);
        engWrap.append(cell);
      });
      rowsEl.append(li);
    });
    score();
    renderSelfcheck();
  }

  function renderLinks(li, q) {
    li.querySelectorAll('.eng-open').forEach((a) => {
      const eng = ENGINES.find((e) => e.id === a.dataset.engine);
      a.href = eng.url(q.text);
    });
  }

  function score() {
    let total = 0, n = 0, named = 0, known = null;
    state.questions.forEach((q, qi) => {
      ENGINES.forEach((eng) => {
        const m = state.marks[`${qi}:${eng.id}`];
        if (!m) return;
        if (q.kind === 'rec') { total += POINTS[m]; n += 1; if (m !== 'no') named += 1; }
        else { known = known === 'wrong' ? 'wrong' : m; }
      });
    });
    const num = $('#score'), label = $('#score-label'), detail = $('#score-detail');
    if (!n) {
      num.textContent = '–';
      label.textContent = 'AI visibility score';
      detail.textContent = 'Mark at least one answer to see your score.';
      return;
    }
    const s = Math.round(total / n);
    num.textContent = s;
    label.textContent = s >= 70 ? 'AI assistants recommend you' : s >= 30 ? 'You show up sometimes' : 'AI assistants rarely name you';
    let d = `${state.inputs.brand} was named in ${named} of ${n} answer${n > 1 ? 's' : ''} you marked.`;
    if (known === 'wrong') d += ' At least one assistant got your brand wrong.';
    if (known === 'good') d += ' The assistants you asked know what you do.';
    detail.textContent = d;
  }

  function renderSelfcheck() {
    const site = (state.inputs.site || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const list = $('#selfcheck-links'), intro = $('#selfcheck-intro');
    if (!site) { list.hidden = true; return; }
    intro.textContent = `Open these two files on ${site}. If robots.txt says "Disallow: /" under GPTBot, OAI-SearchBot or PerplexityBot, those assistants can't read your site.`;
    list.innerHTML = '';
    [['robots.txt', 'robots.txt: should not block AI crawlers'], ['llms.txt', 'llms.txt: optional summary of your site for AI']].forEach(([file, label]) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `https://${site}/${file}`;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = label;
      li.append(a);
      list.append(li);
    });
    list.hidden = false;
  }

  function show(scroll) {
    check.hidden = false;
    render();
    if (scroll) check.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = Object.fromEntries(Object.entries(f).map(([k, el]) => [k, el.value.trim()]));
    const missing = [['category', 'what you sell'], ['audience', 'who it is for'], ['brand', 'your brand']].filter(([k]) => !v[k]);
    const err = $('#madlib-error');
    if (missing.length) {
      err.textContent = `Fill in ${missing.map((m) => m[1]).join(', ')} to build your check.`;
      err.hidden = false;
      f[missing[0][0]].focus();
      return;
    }
    err.hidden = true;
    const same = JSON.stringify(state.inputs) === JSON.stringify(v);
    if (!same) state = { inputs: v, questions: buildQuestions(v), marks: {} };
    save();
    show(true);
  });

  $('#edit').addEventListener('click', () => {
    form.scrollIntoView({ behavior: 'smooth' });
    f.category.focus();
  });
  $('#reset').addEventListener('click', () => { state.marks = {}; save(); render(); });

  $('#copy-all').addEventListener('click', async (e) => {
    const text = state.questions.map((q) => q.text).join('\n');
    try { await navigator.clipboard.writeText(text); e.target.textContent = 'Copied'; }
    catch { e.target.textContent = 'Copy failed: select the questions instead'; }
    setTimeout(() => { e.target.textContent = 'Copy all questions'; }, 2000);
  });

  $('#waitlist').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#w-email');
    const msg = $('#waitlist-msg');
    if (!email.checkValidity()) {
      msg.textContent = 'Enter a valid email address, like you@company.com.';
      msg.hidden = false;
      return;
    }
    const payload = { email: email.value, brand: state.inputs.brand || '', category: state.inputs.category || '', page: location.pathname };
    if (!WAITLIST_ENDPOINT) {
      location.href = `mailto:${WAITLIST_EMAIL}?subject=${encodeURIComponent('Weekly AI visibility check')}&body=${encodeURIComponent(`Please notify ${payload.email} (${payload.brand}).`)}`;
      return;
    }
    try {
      const res = await fetch(WAITLIST_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(res.status);
      msg.textContent = "You're on the list. We'll email you when weekly checks open.";
      email.value = '';
    } catch {
      msg.textContent = `That didn't go through. Email ${WAITLIST_EMAIL} and we'll add you.`;
    }
    msg.hidden = false;
  });

  /* Restore a previous check from this browser. */
  if (state.inputs && state.inputs.brand) {
    Object.entries(f).forEach(([k, el]) => { el.value = state.inputs[k] || ''; });
    document.querySelectorAll('.blank input').forEach(fit);
    show(false);
  }
})();

(() => {
  'use strict';
  function init() {
    const widget = document.getElementById('chat-widget');
    const panel = document.getElementById('chat-panel');
    const toggle = document.getElementById('chat-toggle');
    const close = document.getElementById('chat-close');
    const messages = document.getElementById('chat-messages');
    if (!widget || !panel || !toggle || !close || !messages) {
      console.error('ScaleBridge chatbot: missing required HTML elements');
      return;
    }
    if (widget.dataset.chatInitialized === 'true') return;
    widget.dataset.chatInitialized = 'true';

    const API = 'https://scalebridge-ai.solitary-snowflake-f1f3.workers.dev/chat';
    let history = [], busy = false;
    const facts = {
      services: 'ScaleBridge provides managed Arabic and English customer support via email, live chat, social messaging and help desk, plus data annotation and content moderation. Recruitment, onboarding, quality monitoring and KPI reporting are included in the managed model.',
      pricing: 'Managed customer support starts at USD 900 per Agent FTE per month, with a minimum team of 5 Agents. Standard workstation and headset, recruitment, one week of basic initial training, shared supervision, basic QA and routine KPI reports are included. Dedicated management, specialist software and complex coverage are quoted separately.',
      center: 'ScaleBridge is developing its physical delivery operation in Damascus, Syria. Facility connectivity, access controls and backup arrangements should be confirmed for each client project. Site visits can be discussed by appointment.',
      compliance: 'ScaleBridge has prepared a 12-document Compliance and Information Security Framework. Project-specific technical controls and operational readiness require verification. ScaleBridge does not claim ISO certification.',
      coverage: '24/7 support can be scoped. Concurrent online agents are different from total staffing. Four continuously online agents need 672 coverage hours weekly, equivalent to at least 16.8 FTE at 40 hours per week before shrinkage, breaks and scheduling requirements.',
      contact: 'For a tailored proposal, email info@scalebridgesolutions.de with your company, service, languages, required staffing, operating hours and target start date.'
    };
    function bubble(value, who = 'bot') {
      const p = document.createElement('p');
      p.className = 'chat-bubble ' + (who === 'user' ? 'chat-user' : '');
      p.textContent = value;
      p.dir = 'auto';
      messages.append(p);
      messages.scrollTop = messages.scrollHeight;
      return p;
    }
    const form = document.createElement('form');
    form.className = 'chat-form';
    form.innerHTML = '<input aria-label="Your message" maxlength="1200" placeholder="Ask in English or العربية..." required><button type="submit" aria-label="Send message">➤</button>';
    const input = form.querySelector('input');
    function open(v) {
      panel.hidden = !v;
      widget.classList.toggle('is-open', v);
      toggle.setAttribute('aria-expanded', String(v));
      if (v) input.focus();
      else toggle.focus();
    }
    const actions = document.createElement('div');
    actions.className = 'chat-extra';
    const leadBtn = document.createElement('button');
    leadBtn.type = 'button';
    leadBtn.textContent = 'Request a proposal / طلب عرض سعر';
    actions.append(leadBtn);
    const disclaimer = panel.querySelector('.chat-disclaimer');
    if (disclaimer) disclaimer.textContent = 'Please do not share passwords, customer records or sensitive personal data. AI answers are informational; project security and pricing are confirmed in writing.';
    const subtitle = panel.querySelector('.chat-header small');
    if (subtitle) subtitle.textContent = 'AI assistant · Arabic & English';
    const choices = panel.querySelector('.chat-choices');
    if (choices) choices.replaceWith(actions);
    else panel.append(actions);
    if (disclaimer) disclaimer.before(form);
    else panel.append(form);
    toggle.addEventListener('click', () => open(panel.hidden));
    close.addEventListener('click', () => open(false));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !panel.hidden) open(false);
    });

    const lead = document.createElement('form');
    lead.className = 'chat-lead';
    lead.hidden = true;
    lead.innerHTML = `<strong>Project requirements / متطلبات المشروع</strong>
      <input name="company" placeholder="Company / اسم الشركة" maxlength="120" required>
      <input name="email" type="email" placeholder="Business email / البريد الإلكتروني" required>
      <select name="service" required><option value="">Select service / الخدمة</option>
      <option>Customer support</option><option>Data annotation</option>
      <option>Content moderation</option><option>Other</option></select>
      <input name="agents" placeholder="Required agents / العدد المطلوب" maxlength="60">
      <select name="capacity_type"><option value="Total FTE">Total FTE / إجمالي الموظفين</option>
      <option value="Concurrent agents">Concurrent agents / موظفين بنفس الوقت</option>
      <option value="Unknown">Not sure / غير محدد</option></select>
      <select name="coverage"><option>Business hours</option><option>Extended hours</option>
      <option>24/7</option><option>Not sure</option></select>
      <textarea name="notes" maxlength="700" placeholder="Languages, start date and requirements / اللغات وموعد البدء"></textarea>
      <label class="chat-consent"><input type="checkbox" required> I agree to send these details to ScaleBridge for a business inquiry.</label>
      <button type="submit">Prepare inquiry / تجهيز الطلب</button>
      <button type="button" class="chat-cancel">Cancel / إلغاء</button>
      <small>Your email app will open. Please press Send to submit your inquiry.</small>`;
    actions.after(lead);
    leadBtn.addEventListener('click', () => {
      lead.hidden = !lead.hidden;
      if (!lead.hidden) lead.querySelector('input').focus();
    });
    lead.querySelector('.chat-cancel').addEventListener('click', () => { lead.hidden = true; });
    lead.addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(lead));
      const subject = encodeURIComponent('ScaleBridge inquiry — ' + d.service);
      const body = encodeURIComponent(`Company: ${d.company}\nEmail: ${d.email}\nService: ${d.service}\nCapacity: ${d.agents || 'To discuss'} (${d.capacity_type})\nCoverage: ${d.coverage}\nNotes: ${d.notes || '-'}\n\nPrepared via ScaleBridge website assistant.`);
      window.location.href = `mailto:info@scalebridgesolutions.de?subject=${subject}&body=${body}`;
      bubble('Your email application will open. Please press Send to submit. / رح يفتح تطبيق الإيميل، اضغط إرسال لتأكيد الطلب.');
      lead.hidden = true;
    });

    function local(q) {
      const t = q.toLowerCase();
      if (/compliance|security|privacy|gdpr|nda|حماية|بيانات|أمن|سرية|امتثال|سياسات|iso/.test(t)) return facts.compliance;
      if (/center|centre|office|location|visit|internet|مركز|مكتب|إنترنت|دمشق|زيارة|عنوان/.test(t)) return facts.center;
      if (/24\/7|coverage|shift|concurrent|capacity|fte|agents|موظف|موظفين|عدد|دوام|شفت/.test(t)) return facts.coverage;
      if (/price|cost|pricing|rate|سعر|تكلفة|دولار|تدريب/.test(t)) return facts.pricing;
      if (/proposal|quote|contact|email|عرض|تواصل/.test(t)) return facts.contact;
      return facts.services;
    }
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q || busy) return;
      input.value = '';
      bubble(q, 'user');
      const previousHistory = history.slice(-10);
      history.push({ role: 'user', content: q });
      busy = true;
      input.disabled = true;
      const wait = bubble('…');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: q, history: previousHistory }),
          signal: controller.signal
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        const answer = data.reply || data.response;
        if (typeof answer !== 'string' || !answer.trim()) throw new Error('Empty reply');
        wait.textContent = answer;
        history.push({ role: 'assistant', content: answer });
      } catch (err) {
        console.warn('ScaleBridge AI request failed:', err);
        const answer = local(q);
        wait.textContent = answer + '\n\nAI connection is temporarily unavailable; this is general information. For confirmation, request a proposal. / الاتصال بالذكاء الاصطناعي غير متاح حالياً؛ للتأكيد اطلب عرض سعر.';
        history.push({ role: 'assistant', content: answer });
      } finally {
        clearTimeout(timeout);
        busy = false;
        input.disabled = false;
        input.focus();
        messages.scrollTop = messages.scrollHeight;
      }
    });
    messages.replaceChildren();
    bubble('Welcome to ScaleBridge! Ask about our services, pricing, Damascus delivery plans or compliance. أهلاً وسهلاً! اسألنا بالعربي أو الإنكليزي.');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

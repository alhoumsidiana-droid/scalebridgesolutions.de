
(() => {
'use strict';

function init() {
  const widget = document.getElementById('chat-widget');
  const panel = document.getElementById('chat-panel');
  const toggle = document.getElementById('chat-toggle');
  const close = document.getElementById('chat-close');
  const messages = document.getElementById('chat-messages');

  if (
    !widget || !panel || !toggle || !close || !messages ||
    widget.dataset.chatInitialized === 'true'
  ) return;

  widget.dataset.chatInitialized = 'true';

  const API = 'https://scalebridge-ai.solitary-snowflake-f1f3.workers.dev/chat';
  const EMAIL = 'info@scalebridgesolutions.de';

  let history = [];
  let busy = false;

  function bubble(value, who = 'bot') {
    const p = document.createElement('p');
    p.className = 'chat-bubble ' + (who === 'user' ? 'chat-user' : '');
    p.textContent = String(value || '');
    p.dir = 'auto';
    messages.append(p);
    messages.scrollTop = messages.scrollHeight;
    return p;
  }

  const form = document.createElement('form');
  form.className = 'chat-form';
  form.innerHTML =
    '<input aria-label="Your message" maxlength="1200" placeholder="Ask in English or العربية..." required>' +
    '<button type="submit" aria-label="Send message">➤</button>';

  const input = form.querySelector('input');

  function open(value) {
    panel.hidden = !value;
    widget.classList.toggle('is-open', value);
    toggle.setAttribute('aria-expanded', String(value));

    if (value) input.focus();
    else toggle.focus();
  }

  toggle.addEventListener('click', () => open(panel.hidden));
  close.addEventListener('click', () => open(false));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) open(false);
  });

  const actions = document.createElement('div');
  actions.className = 'chat-extra';

  const leadBtn = document.createElement('button');
  leadBtn.type = 'button';
  leadBtn.textContent = 'Generate My Preliminary Proposal';
  actions.append(leadBtn);

  const meetingBtn = document.createElement('button');
  meetingBtn.type = 'button';
  meetingBtn.textContent = 'Request a Meeting';
  actions.append(meetingBtn);

  const disclaimer = panel.querySelector('.chat-disclaimer');

  if (disclaimer) {
    disclaimer.textContent =
      'Transparent pricing. No hidden fees. Preliminary proposals are not binding offers. Do not share confidential customer data.';
  }

  const subtitle = panel.querySelector('.chat-header small');

  if (subtitle) {
    subtitle.textContent =
      'Instant Estimates · Proposals · Meeting Requests';
  }

  const choices = panel.querySelector('.chat-choices');

  if (choices) choices.replaceWith(actions);
  else panel.append(actions);

  if (disclaimer) disclaimer.before(form);
  else panel.append(form);

  // PRELIMINARY PROPOSAL FORM

  const lead = document.createElement('form');
  lead.className = 'chat-lead';
  lead.hidden = true;

  lead.innerHTML = `
    <strong>Generate Your Preliminary Proposal</strong>
    <p>
      Enter two details to receive a personalized
      preliminary proposal based on our published rates.
    </p>

    <input
      name="company"
      aria-label="Company name"
      placeholder="Company name"
      maxlength="120"
      required
    >

    <input
      name="email"
      type="email"
      aria-label="Business email"
      placeholder="Business email"
      maxlength="254"
      required
    >

    <label class="chat-consent">
      <input type="checkbox" name="consent" required>
      <span>
        I agree to use these details to prepare
        my preliminary proposal.
      </span>
    </label>

    <button type="submit" class="chat-generate-submit">
      Generate Preliminary Proposal
    </button>

    <button type="button" class="chat-cancel">
      Cancel
    </button>

    <small>
      This is a preliminary estimate, not a final
      contractual offer. Final terms are confirmed
      by ScaleBridge Solutions.
    </small>
  `;

  actions.after(lead);

  // MEETING REQUEST FORM

  const meeting = document.createElement('form');
  meeting.className = 'chat-meeting';
  meeting.hidden = true;

  meeting.innerHTML = `
    <strong>Request a Meeting</strong>

    <p>
      Choose three preferred meeting times.
      We will review your request and confirm
      one by email.
    </p>

    <input
      name="name"
      placeholder="Your full name"
      aria-label="Your full name"
      maxlength="120"
      required
    >

    <input
      name="company"
      placeholder="Company name"
      aria-label="Company name"
      maxlength="120"
      required
    >

    <input
      name="email"
      type="email"
      placeholder="Business email"
      aria-label="Business email"
      maxlength="254"
      required
    >

    <label class="chat-meeting-tz">
      Your time zone
      <select name="timezone" required></select>
    </label>

    <div class="chat-meeting-slots"></div>

    <input
      class="chat-hp"
      type="text"
      name="website"
      tabindex="-1"
      autocomplete="off"
      aria-hidden="true"
    >

    <label class="chat-consent">
      <input type="checkbox" name="consent" required>
      <span>
        I agree to have my contact details and
        proposed times used to arrange a meeting.
      </span>
    </label>

    <button type="submit" class="chat-generate-submit">
      Submit Meeting Request
    </button>

    <button type="button" class="chat-cancel">
      Cancel
    </button>

    <small>
      Meeting request only — no appointment is confirmed
      until ScaleBridge replies.
    </small>
  `;

  lead.after(meeting);

  const zoneSelect =
    meeting.querySelector('select[name="timezone"]');

  const zone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const zones = [
    zone,
    'Asia/Dubai',
    'Asia/Riyadh',
    'Asia/Qatar',
    'Asia/Kuwait',
    'Asia/Bahrain',
    'Asia/Muscat',
    'Europe/Berlin',
    'UTC'
  ];

  [...new Set(zones)].forEach(z => {
    const option = document.createElement('option');
    option.value = z;
    option.textContent = z.replaceAll('_', ' ');
    zoneSelect.append(option);
  });

  zoneSelect.value = zone;

  const slotsBox =
    meeting.querySelector('.chat-meeting-slots');

  for (let i = 0; i < 3; i++) {
    const wrap = document.createElement('label');
    wrap.className = 'chat-slot';
    wrap.textContent = 'Preferred option ' + (i + 1);

    const row = document.createElement('div');
    row.className = 'chat-slot-row';

    const date = document.createElement('input');
    date.type = 'date';
    date.required = true;
    date.setAttribute(
      'aria-label',
      'Preferred date ' + (i + 1)
    );

    const time = document.createElement('input');
    time.type = 'time';
    time.required = true;
    time.step = 1800;
    time.setAttribute(
      'aria-label',
      'Preferred time ' + (i + 1)
    );

    row.append(date, time);
    wrap.append(row);
    slotsBox.append(wrap);
  }

  function minDate() {
    const d = new Date();
    d.setDate(d.getDate() + 3);

    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');
  }

  function dateAtZone(date, time, tz) {
    const wall = Date.parse(date + 'T' + time + ':00Z');

    if (!Number.isFinite(wall)) return null;

    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    });

    function parts(ms) {
      const p = Object.fromEntries(
        fmt.formatToParts(new Date(ms))
          .filter(x => x.type !== 'literal')
          .map(x => [x.type, x.value])
      );

      return Date.UTC(
        +p.year,
        +p.month - 1,
        +p.day,
        +p.hour,
        +p.minute
      );
    }

    let utc = wall;

    for (let i = 0; i < 4; i++) {
      utc += wall - parts(utc);
    }

    return parts(utc) === wall
      ? new Date(utc).toISOString()
      : null;
  }

  function showMeetingForm(show) {
    meeting.hidden = !show;
    form.hidden = show;
    actions.hidden = show;
    messages.hidden = show;

    if (disclaimer) disclaimer.hidden = show;

    panel.classList.toggle('meeting-mode', show);

    if (show) {
      meeting
        .querySelectorAll('input[type="date"]')
        .forEach(x => x.min = minDate());

      meeting
        .querySelector('input[name="name"]')
        .focus();
    } else {
      input.focus();
    }
  }

  meetingBtn.addEventListener('click', () => {
    showProposalForm(false);
    showMeetingForm(true);
  });

  meeting
    .querySelector('.chat-cancel')
    .addEventListener('click', () => {
      showMeetingForm(false);
    });

  meeting.addEventListener('submit', async e => {
    e.preventDefault();

    if (busy) return;

    const d = new FormData(meeting);
    const tz = String(d.get('timezone') || 'UTC');

    const slotInputs = [
      ...meeting.querySelectorAll('.chat-slot-row')
    ];

    const slots = slotInputs.map(row =>
      dateAtZone(
        row.querySelector('input[type="date"]').value,
        row.querySelector('input[type="time"]').value,
        tz
      )
    );

    if (
      slots.some(s => !s) ||
      new Set(slots).size !== 3 ||
      slots.some(s =>
        Date.parse(s) < Date.now() + 72 * 3600000
      )
    ) {
      alert(
        'Please select three different valid times at least 72 hours from now.'
      );
      return;
    }

    const payload = {
      meeting: {
        name: String(d.get('name') || '').trim(),
        company: String(d.get('company') || '').trim(),
        email: String(d.get('email') || '').trim(),
        timezone: tz,
        slots,
        consent: d.get('consent') === 'on',
        website: String(d.get('website') || '')
      }
    };

    busy = true;

    const submit =
      meeting.querySelector('button[type="submit"]');

    submit.disabled = true;

    try {
      const result = await request(payload);

      showMeetingForm(false);

      bubble(
        result.reply || 'Unable to submit your request.'
      );

      if (result.requestReceived) meeting.reset();
    } catch (err) {
      showMeetingForm(false);

      bubble(
        'We could not submit the meeting request. Please email info@scalebridgesolutions.de.'
      );
    } finally {
      busy = false;
      submit.disabled = false;
    }
  });

  // FORM STYLING

  const proposalStyle = document.createElement('style');

  proposalStyle.textContent = `
    .chat-form[hidden],
    .chat-extra[hidden],
    .chat-messages[hidden],
    .chat-disclaimer[hidden] {
      display: none !important;
    }

    .chat-panel.meeting-mode .chat-meeting {
      display: flex !important;
      flex-direction: column;
      gap: 11px;
      min-height: 0;
      flex: 1 1 auto;
      overflow-y: auto;
      padding: 18px;
    }

    .chat-panel.meeting-mode .chat-meeting[hidden] {
      display: none !important;
    }

    .chat-panel.meeting-mode .chat-slot-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
    }

    .chat-panel.meeting-mode .chat-slot-row input {
      min-width: 0;
      width: 100%;
    }

    .chat-panel.meeting-mode .chat-hp {
      position: absolute;
      left: -9999px;
    }

    .chat-panel.meeting-mode .chat-meeting-tz select {
      display: block;
      width: 100%;
      padding: 10px;
    }

    .chat-panel.meeting-mode .chat-meeting
    .chat-generate-submit {
      background: #d7aa55;
      color: #061629;
      min-height: 48px;
    }

    .chat-panel.proposal-mode .chat-lead {
      display: flex !important;
      flex-direction: column;
      gap: 12px;
      max-height: none !important;
      min-height: 0;
      flex: 1 1 auto;
      overflow-y: auto;
      padding: 18px;
    }

    .chat-panel.proposal-mode .chat-lead[hidden] {
      display: none !important;
    }

    .chat-panel.proposal-mode .chat-lead
    .chat-generate-submit {
      background: #d7aa55;
      color: #061629;
      min-height: 48px;
    }

    .chat-panel.proposal-mode .chat-lead
    .chat-cancel {
      min-height: 40px;
    }

    .chat-panel.proposal-mode {
      min-height: 400px;
    }
  `;

  document.head.append(proposalStyle);

  function showProposalForm(show) {
    if (show) showMeetingForm(false);

    lead.hidden = !show;
    form.hidden = show;
    actions.hidden = show;

    if (disclaimer) disclaimer.hidden = show;

    messages.hidden = show;

    panel.classList.toggle('proposal-mode', show);

    if (show) {
      const first =
        lead.querySelector('input[name="company"]');

      if (first) first.focus();
    } else {
      input.focus();
    }
  }

  leadBtn.addEventListener('click', () => {
    showProposalForm(true);
  });

  lead
    .querySelector('.chat-cancel')
    .addEventListener('click', () => {
      showProposalForm(false);
    });

  function emailButton(text, company) {
    const button = document.createElement('button');

    button.type = 'button';
    button.className = 'chat-proposal-send';
    button.textContent =
      'Email This Proposal to ScaleBridge';

    button.addEventListener('click', () => {
      window.location.href =
        'mailto:' + EMAIL +
        '?subject=' +
        encodeURIComponent(
          'Preliminary Proposal - ' + company
        ) +
        '&body=' +
        encodeURIComponent(
          text +
          '\n\nPlease contact me to discuss the final proposal.'
        );
    });

    messages.append(button);
    messages.scrollTop = messages.scrollHeight;
  }

  async function request(payload, signal) {
    const response = await fetch(API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal
    });

    if (!response.ok) {
      throw Error('HTTP ' + response.status);
    }

    return response.json();
  }

  // GENERATE PROPOSAL

  lead.addEventListener('submit', async e => {
    e.preventDefault();

    if (busy) return;

    const d = new FormData(lead);

    const company =
      String(d.get('company') || '').trim();

    const email =
      String(d.get('email') || '').trim();

    const consent = d.get('consent') === 'on';

    if (!company || !email || !consent) {
      lead.reportValidity();
      return;
    }

    busy = true;
    input.disabled = true;

    const submitButton =
      lead.querySelector('.chat-generate-submit');

    submitButton.disabled = true;

    const wait = bubble(
      'Preparing your personalized preliminary proposal...'
    );

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      20000
    );

    try {
      const result = await request(
        {
          message: 'Generate preliminary proposal',
          history: history.slice(-16),
          proposal: {
            company,
            email,
            consent
          }
        },
        controller.signal
      );

      wait.textContent =
        result.reply ||
        'Unable to prepare your proposal. Please try again.';

      if (
        result.proposalReady &&
        result.proposalText
      ) {
        showProposalForm(false);

        history.push({
          role: 'assistant',
          content: result.proposalText
        });

        if (result.notificationSent) {
          bubble(
            'Your preliminary proposal was also sent to the ScaleBridge team for follow-up.'
          );
        } else {
          bubble(
            result.notificationMessage ||
            'Please email the team to continue.'
          );

          emailButton(
            result.proposalText,
            company
          );
        }
      } else if (result.reply) {
        showProposalForm(false);
      }
    } catch (err) {
      console.warn('Proposal error', err);

      wait.textContent =
        'We could not generate your proposal right now. Please contact ' +
        EMAIL + '.';

      showProposalForm(false);
    } finally {
      clearTimeout(timeout);

      busy = false;
      input.disabled = false;
      submitButton.disabled = false;

      messages.scrollTop = messages.scrollHeight;
    }
  });

  // LOCAL FALLBACK INFORMATION

  const facts = {
    services:
      'ScaleBridge provides managed Arabic and English customer support, data annotation, content moderation and AI-assisted workflows.',

    pricing:
      'Published monthly rates: Standard Agent $900, Night Shift Agent $1,050, Senior Agent $1,050, Team Leader $1,350, Group Leader $1,650, QA Analyst $1,100 and Operations Manager $2,000. Standard minimum support team: 5 agents. No automatic volume discounts. No hidden fees.',

    center:
      'ScaleBridge is developing its Damascus delivery operation. Facility arrangements are confirmed for each project.',

    compliance:
      'ScaleBridge has prepared an internal information security framework. Project-specific controls require verification. No ISO certification is claimed.',

    coverage:
      '24/7 coverage requires staffing and shift planning. Night shifts and additional requirements must be scoped.',

    contact:
      'Use Generate My Preliminary Proposal or email info@scalebridgesolutions.de.'
  };

  function local(question) {
    const t = question.toLowerCase();

    if (
      /compliance|security|privacy|gdpr|nda|حماية|بيانات|أمن|سرية|امتثال|iso/.test(t)
    ) return facts.compliance;

    if (
      /center|centre|office|location|visit|internet|مركز|مكتب|دمشق|زيارة/.test(t)
    ) return facts.center;

    if (
      /24\/7|coverage|shift|concurrent|دوام|شفت/.test(t)
    ) return facts.coverage;

    if (
      /price|cost|pricing|rate|سعر|تكلفة|دولار|قديش/.test(t)
    ) return facts.pricing;

    if (
      /proposal|quote|contact|email|عرض|تواصل/.test(t)
    ) return facts.contact;

    return facts.services;
  }

  // MAIN CHAT

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const question = input.value.trim();

    if (!question || busy) return;

    input.value = '';

    bubble(question, 'user');

    const previousHistory = history.slice(-16);

    history.push({
      role: 'user',
      content: question
    });

    busy = true;
    input.disabled = true;

    const wait = bubble('…');

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      20000
    );

    try {
      const result = await request(
        {
          message: question,
          history: previousHistory
        },
        controller.signal
      );

      const answer =
        result.reply || result.response;

      if (
        typeof answer !== 'string' ||
        !answer.trim()
      ) {
        throw Error('Empty reply');
      }

      wait.textContent = answer;

      history.push({
        role: 'assistant',
        content: answer
      });
    } catch (err) {
      console.warn('AI request failed', err);

      const answer = local(question);

      wait.textContent =
        answer +
        '\n\nAI connection is temporarily unavailable. Please confirm with ScaleBridge.';

      history.push({
        role: 'assistant',
        content: answer
      });
    } finally {
      clearTimeout(timeout);

      busy = false;
      input.disabled = false;
      input.focus();

      messages.scrollTop = messages.scrollHeight;
    }
  });

  // NEW WELCOME MESSAGE — V15

  messages.replaceChildren();

  bubble(
    `Welcome to ScaleBridge Solutions! 👋

Looking for the right customer support team for your business?

Explore our services, get transparent pricing, and calculate your team's monthly cost in seconds.

Need something tailored? Let's create your preliminary proposal.

Ready to scale? Let's get started! 🚀

مرحباً بك في ScaleBridge Solutions! 👋

هل تبحث عن فريق دعم عملاء يتناسب مع احتياجات أعمالك؟

اكتشف خدماتنا وأسعارنا بكل شفافية، واحصل على تقدير فوري لتكلفة فريقك أو عرض مبدئي مصمّم خصيصاً لمشروعك.

جاهز للانطلاق؟ لنبدأ! 🚀`
  );
}

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    init,
    { once: true }
  );
} else {
  init();
}
})();


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
    const parts = String(value || '').split(/(\*\*[\s\S]+?\*\*)/g);
    for (const part of parts) {
      if (part.startsWith('**') && part.endsWith('**')) {
        const strong = document.createElement('strong');
        strong.textContent = part.slice(2, -2);
        p.append(strong);
      } else {
        p.append(document.createTextNode(part));
      }
    }
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
      Tell us a little about your project. If you are unsure about
      staffing, we can review your requirements before quoting.
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

    <label class="chat-proposal-field">
      Choose Your Estimation Approach
      <select name="estimateMode">
        <option value="team">Team-Based Estimate</option>
        <option value="workload">Workload-Based Estimate</option>
      </select>
      <small class="chat-estimate-description" aria-live="polite">Based on the number of agents you need.</small>
      <small>Both estimates are preliminary and subject to staffing validation.</small>
    </label>
    <div class="chat-workload-fields" hidden>
      <label class="chat-proposal-field">Primary channel
        <select name="workloadChannel">
          <option value="tickets">Support tickets</option>
          <option value="email">Email</option>
          <option value="chat">Live chat (requires review)</option>
          <option value="voice">Voice calls (requires Erlang review)</option>
        </select>
      </label>
      <label class="chat-proposal-field">Monthly contacts / tickets
        <input name="monthlyVolume" type="number" min="1" max="10000000" step="1" value="12000">
      </label>
      <label class="chat-proposal-field">Average handling time (minutes)
        <input name="ahtMinutes" type="number" min="0.5" max="180" step="0.5" value="6">
      </label>
      <label class="chat-proposal-field">Working days per month
        <input name="workingDays" type="number" min="1" max="31" step="1" value="22">
      </label>
      <label class="chat-proposal-field">Paid hours per agent per day
        <input name="hoursPerDay" type="number" min="1" max="12" step="0.5" value="8">
      </label>
      <label class="chat-proposal-field">Target occupancy (%)
        <input name="occupancyPct" type="number" min="50" max="90" step="1" value="80">
      </label>
      <label class="chat-proposal-field">Shrinkage: breaks, leave, training (%)
        <input name="shrinkagePct" type="number" min="0" max="45" step="1" value="25">
      </label>
      <small>Defaults are planning assumptions, not verified client metrics. For voice/live chat, the result is workload-equivalent capacity only, not a service-level staffing commitment.</small>
    </div>

    <label class="chat-proposal-field chat-team-fields">
      <span class="chat-team-size-label">Team size (optional)</span>
      <input name="teamSize" type="number" min="1" max="5000"
        placeholder="Number of agents, if known">
    </label>

    <label class="chat-proposal-field">
      What coverage do you need?
      <select name="coverage">
        <option value="unsure">Not sure yet</option>
        <option value="business">Business hours only</option>
        <option value="night">Night shift only</option>
        <option value="247total">24/7 — Fixed team size</option>
        <option value="247concurrent">24/7 — Continuous live coverage</option>
      </select>
      <small class="chat-coverage-help" aria-live="polite">
        Select a coverage option to see what the team size means.
      </small>
    </label>

    <label class="chat-proposal-field chat-coverage-timezone" hidden>
      Customer time zone (for shift planning)
      <select name="customerTimezone">
        <option value="">Select time zone (optional)</option>
        <option value="Saudi Arabia (UTC+3)">Saudi Arabia (UTC+3)</option>
        <option value="United Arab Emirates (UTC+4)">United Arab Emirates (UTC+4)</option>
        <option value="Kuwait / Qatar / Bahrain (UTC+3)">Kuwait / Qatar / Bahrain (UTC+3)</option>
        <option value="Oman (UTC+4)">Oman (UTC+4)</option>
        <option value="Other / to be confirmed">Other / to be confirmed</option>
      </select>
      <small>ScaleBridge designs the shifts after reviewing your service requirements.</small>
    </label>

    <label class="chat-proposal-field">
      Project details (optional)
      <textarea name="details" maxlength="1000" rows="3"
        placeholder="Channels, languages, launch date, or other requirements"></textarea>
    </label>

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

    .chat-panel.proposal-mode .chat-proposal-field {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .chat-panel.proposal-mode .chat-proposal-field input,
    .chat-panel.proposal-mode .chat-proposal-field select,
    .chat-panel.proposal-mode .chat-proposal-field textarea {
      width: 100%;
      box-sizing: border-box;
      min-width: 0;
      padding: 10px;
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

  proposalStyle.textContent += `
    .chat-estimate-card { background:#fff; color:#14233b; border:1px solid #dbe3ed; border-radius:14px; padding:16px; margin:10px 0; font-size:13px; line-height:1.5; overflow-wrap:anywhere; }
    .chat-estimate-heading { font-size:11px; font-weight:800; letter-spacing:.04em; color:#56677f; margin-bottom:16px; }
    .chat-estimate-label { font-size:11px; font-weight:700; color:#53657c; margin-top:12px; }
    .chat-estimate-team { display:block; font-size:22px; margin:3px 0 10px; }
    .chat-estimate-cost { display:block; font-size:27px; line-height:1.3; color:#0b294c; background:#f3f6fa; border-radius:10px; padding:12px; margin-top:5px; }
    .chat-estimate-section { border-top:1px solid #e5eaf0; margin-top:15px; padding-top:12px; }
    .chat-estimate-section h4 { margin:0 0 9px; font-size:13px; }
    .chat-estimate-row { display:flex; justify-content:space-between; gap:10px; padding:3px 0; }
    .chat-estimate-row span { color:#5b6b7d; }
    .chat-estimate-row strong { text-align:right; }
    .chat-estimate-note { border-top:1px solid #e5eaf0; padding-top:12px; color:#53657c; font-size:12px; }
    .chat-estimate-next { font-weight:700; }
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

  // Clarify the meaning of the agent count for each coverage model.
  const coverageSelect = lead.querySelector('select[name="coverage"]');
  const teamSizeInput = lead.querySelector('input[name="teamSize"]');
  const teamSizeLabel = lead.querySelector('.chat-team-size-label');
  const coverageHelp = lead.querySelector('.chat-coverage-help');
  const coverageTimezone = lead.querySelector('.chat-coverage-timezone');

  function updateCoverageLabels() {
    const value = coverageSelect.value;
    const hints = {
      unsure: 'Enter the number of agents you need ScaleBridge to provide, or leave blank if you would like us to estimate it from your workload.',
      business: 'Enter the number of agents you need ScaleBridge to provide for business-hours coverage.',
      night: 'Enter the number of night-shift agents you need ScaleBridge to provide.',
      '247total': 'Enter the total team size you want ScaleBridge to provide. We will confirm the achievable 24/7 coverage.',
      '247concurrent': 'Enter how many agents must be online at the same time. We will estimate the total team size and shift plan.'
    };
    const labels = {
      unsure: 'How many agents would you like ScaleBridge to provide? (Optional)',
      business: 'How many agents would you like ScaleBridge to provide? (Optional)',
      night: 'How many night-shift agents would you like ScaleBridge to provide? (Optional)',
      '247total': 'Total agents needed from ScaleBridge (optional)',
      '247concurrent': 'Agents needed online simultaneously (optional)'
    };
    teamSizeLabel.textContent = labels[value] || labels.unsure;
    teamSizeInput.placeholder = value === '247concurrent'
      ? 'Agents online at the same time'
      : value === '247total'
        ? 'Total agents to be provided'
        : value === 'night'
          ? 'Night-shift agents needed'
          : 'Agents needed from ScaleBridge';
    coverageHelp.textContent = hints[value] || hints.unsure;
    coverageTimezone.hidden = !['247total', '247concurrent', 'night'].includes(value);
  }
  coverageSelect.addEventListener('change', updateCoverageLabels);
  updateCoverageLabels();

  const estimateModeSelect = lead.querySelector('select[name="estimateMode"]');
  const estimateDescription = lead.querySelector('.chat-estimate-description');
  const workloadFields = lead.querySelector('.chat-workload-fields');
  const teamFields = lead.querySelector('.chat-team-fields');
  function updateEstimateMode() {
    const workload = estimateModeSelect.value === 'workload';
    estimateDescription.textContent = workload
      ? 'Based on your expected customer interactions and handling time.'
      : 'Based on the number of agents you need.';
    workloadFields.hidden = !workload;
    teamFields.hidden = workload;
    for (const el of workloadFields.querySelectorAll('input')) el.disabled = !workload;
    teamSizeInput.disabled = workload;
  }
  estimateModeSelect.addEventListener('change', updateEstimateMode);
  updateEstimateMode();

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
    const teamSize = String(d.get('teamSize') || '').trim();
    const coverage = String(d.get('coverage') || 'unsure');
    const details = String(d.get('details') || '').trim();
    const customerTimezone = String(d.get('customerTimezone') || '').trim();
    const scopedDetails = [details, customerTimezone ? 'Customer time zone: ' + customerTimezone : ''].filter(Boolean).join('\n');
    const mode = String(d.get('estimateMode') || 'team');
    const workload = mode === 'workload' ? {
      channel: String(d.get('workloadChannel') || ''),
      monthlyVolume: Number(d.get('monthlyVolume')),
      ahtMinutes: Number(d.get('ahtMinutes')),
      workingDays: Number(d.get('workingDays')),
      hoursPerDay: Number(d.get('hoursPerDay')),
      occupancyPct: Number(d.get('occupancyPct')),
      shrinkagePct: Number(d.get('shrinkagePct'))
    } : null;

    if (!company || !email || !consent) {
      lead.reportValidity();
      return;
    }

    busy = true;
    input.disabled = true;

    const submitButton =
      lead.querySelector('.chat-generate-submit');

    submitButton.disabled = true;

    // Keep the status visible after the proposal form closes.
    const wait = document.createElement('p');
    wait.className = 'chat-bubble';
    wait.textContent = 'Preparing your preliminary proposal...';

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      20000
    );

    try {
      // The Worker V15/V16 reads scope from user history.
      // A final explicit scope overrides earlier chat estimates.
      const proposalHistory = history.slice(-14);
      if (mode === 'workload') {
        proposalHistory.length = 0;
      } else if (teamSize) {
        const count = Number(teamSize);
        if (!Number.isSafeInteger(count) || count < 1 || count > 5000) {
          throw Error('Invalid team size');
        }
        const scopeMessage = coverage === '247concurrent'
          ? `${count} agents online simultaneously 24/7`
          : coverage === '247total'
            ? `${count} total agents for 24/7 coverage`
            : coverage === 'night'
              ? `${count} night shift agents`
              : coverage === 'business'
                ? `${count} day shift agents`
                : `${count} support agents; coverage to be confirmed`;
        proposalHistory.push({ role: 'user', content: scopeMessage });
      } else {
        // A new form submission without a headcount must not reuse stale chat history.
        // Explicit coverage is still recorded so the server requests scope review.
        proposalHistory.length = 0;
        if (coverage === '247total' || coverage === '247concurrent' || coverage === 'night') {
          proposalHistory.push({
            role: 'user',
            content: coverage === '247total'
              ? '24/7 coverage requested; total agent count not provided'
              : coverage === '247concurrent'
                ? '24/7 concurrent coverage requested; simultaneous agent count not provided'
                : 'Night shift coverage requested; agent count not provided'
          });
        }
      }
      if (scopedDetails) {
        proposalHistory.push({
          role: 'user',
          content: 'Project details (unconfirmed): ' + scopedDetails
        });
      }

      const result = await request(
        {
          message: 'Generate preliminary proposal',
          history: proposalHistory,
          proposal: {
            company,
            email,
            consent,
            mode,
            workload,
            teamSize: teamSize || null,
            coverage,
            details: scopedDetails
          }
        },
        controller.signal
      );

      wait.textContent =
        result.reply ||
        'Unable to prepare your proposal. Please try again.';

      if (result.proposalReady && result.workloadBased && result.proposalText) {
        const lines = String(result.proposalText).split('\n');
        const get = label => {
          const found = lines.find(line => line.startsWith(label));
          return found ? found.slice(label.length).trim() : '';
        };
        const card = document.createElement('section');
        card.className = 'chat-estimate-card';
        const add = (tag, className, content, parent = card) => {
          const el = document.createElement(tag);
          if (className) el.className = className;
          el.textContent = content;
          parent.append(el);
          return el;
        };
        add('div', 'chat-estimate-heading', 'SCALEBRIDGE SOLUTIONS | PRELIMINARY WORKFORCE & COMMERCIAL ESTIMATE');
        add('div', 'chat-estimate-label', 'ESTIMATED TEAM');
        add('strong', 'chat-estimate-team', get('Indicative workload-equivalent team:'));
        add('div', 'chat-estimate-label', 'INDICATIVE MONTHLY WORKLOAD-ONLY COST');
        add('strong', 'chat-estimate-cost', get('Indicative workload-only base agent cost:').split(' at ')[0] || get('Indicative base agent cost:').split(' at ')[0]);
        for (const [title, labels] of [
          ['Project scope', ['Prepared for:', 'Channel:', 'Monthly volume:', 'Average handling time:']],
          ['Workforce assumptions', ['Estimated monthly handling workload:', 'Working days/month:', 'Paid hours/FTE/day:', 'Occupancy:', 'Shrinkage:', 'Estimated productive capacity/FTE/month:']]
        ]) {
          const section = add('section', 'chat-estimate-section', '');
          add('h4', '', title, section);
          for (const label of labels) {
            const val = get(label);
            if (!val) continue;
            const row = add('div', 'chat-estimate-row', '', section);
            add('span', '', label.slice(0, -1), row);
            add('strong', '', val, row);
          }
        }
        add('p', 'chat-estimate-note', 'Planning estimate only; not a final contractual quote or SLA guarantee. Shift coverage, night premiums, management, QA, software, integrations and taxes require separate confirmation.');
        add('p', 'chat-estimate-next', 'Next step: Confirm your coverage requirements and service levels with our team.');
        wait.replaceWith(card);
      }
      showProposalForm(false);
      messages.append(wait);
      messages.scrollTop = messages.scrollHeight;

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
      messages.append(wait);
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
      'ScaleBridge provides managed Arabic and English inbound and outbound customer support across email, live chat, social media and helpdesk, plus AI-powered customer support and automation, data annotation and content moderation. Custom AI services are scoped individually.',

    pricing:
      'Published monthly FTE rates: Standard Agent $900, Night Shift Agent $1,050, Senior Agent $1,050, Team Leader $1,350, Group Leader $1,650, QA Analyst $1,100 and Operations Manager $2,000. Smaller teams can be discussed. AI and other custom projects require a tailored quote. No automatic volume discounts or hidden fees.',

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
    if (/[\u0600-\u06ff]/.test(question)) {
      if (/سعر|تكلف|قديش|دولار|تسعير/.test(t)) return 'تبدأ أسعار موظفي الدعم القياسي من 900 دولار شهرياً. الخدمات المخصصة مثل الأتمتة وتصنيف البيانات تُسعّر بشكل منفصل حسب المشروع.';
      if (/أمن|سرية|حماية|بيانات|امتثال|شهادة/.test(t)) return 'لدينا إطار داخلي لأمن المعلومات، وتُحدّد ضوابط الحماية حسب المشروع. لا ندّعي امتلاك شهادة ISO.';
      if (/24\/7|دوام|مناوب|شفت/.test(t)) return 'تغطية 24/7 تتطلب تحديد عدد الموظفين المتصلين في الوقت نفسه وجدول المناوبات.';
      return 'تقدّم ScaleBridge فرق دعم عملاء مُدارة بالعربية والإنجليزية، وخدمات تصنيف البيانات والإشراف على المحتوى وحلول أتمتة حسب نطاق المشروع.';
    }

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
        (/[\u0600-\u06ff]/.test(question)
          ? '\n\nالاتصال بالمساعد غير متاح مؤقتاً. يُرجى تأكيد التفاصيل مع فريق ScaleBridge.'
          : '\n\nAI connection is temporarily unavailable. Please confirm with ScaleBridge.');

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

  // SHORT BILINGUAL WELCOME — V17

  messages.replaceChildren();

  bubble(
    `Welcome to ScaleBridge! 👋
Your customer support team starts here.
Explore our services, get instant pricing, or request a preliminary proposal.

مرحباً بك في ScaleBridge! 👋
فريق دعم عملائك يبدأ من هنا.
اكتشف خدماتنا وأسعارنا، أو اطلب عرضاً مبدئياً يناسب مشروعك.`
  
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

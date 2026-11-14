(() => {
  const toggle = document.getElementById('chat-toggle');
  const panel = document.getElementById('chat-panel');
  const close = document.getElementById('chat-close');
  const messages = document.getElementById('chat-messages');
  const responses = {
    services: 'We offer managed customer support teams, recruitment and onboarding, QA, KPI reporting, data annotation and content moderation. AI-assisted automation is currently being developed and tested.',
    languages: 'Our delivery focus is Arabic and English. We can discuss business-hours, extended-hours or 24/7 coverage based on your requirements and the agreed operating model.',
    delivery: 'Our delivery model is centered on Damascus, Syria, serving GCC businesses. Team availability and launch timing are confirmed during scoping.',
    quote: 'To request a tailored proposal, email info@scalebridgesolutions.de with your company, team size, channels, languages and preferred coverage.'
  };
  function setOpen(open) { panel.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); if(open) close.focus(); else toggle.focus(); }
  toggle.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', e => {if(e.key === 'Escape' && !panel.hidden) setOpen(false);});
  panel.querySelectorAll('[data-topic]').forEach(btn => btn.addEventListener('click', () => {
    const bubble = document.createElement('p'); bubble.className = 'chat-bubble'; bubble.textContent = responses[btn.dataset.topic]; messages.appendChild(bubble); messages.scrollTop = messages.scrollHeight;
    if(btn.dataset.topic === 'quote') {const a=document.createElement('a');a.href='mailto:info@scalebridgesolutions.de?subject=GCC%20Support%20Proposal%20Request';a.textContent='Email our team';a.className='email-link';messages.appendChild(a);}
  }));
})();

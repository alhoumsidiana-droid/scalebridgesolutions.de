/* Load after chatbot.js: upgrade one-line input to multiline message composer */
(() => {
  const form = document.querySelector('#chat-panel .chat-form');
  const old = form?.querySelector('input[aria-label="Your message"]');
  if (!old) return;
  const field = document.createElement('textarea');
  field.setAttribute('aria-label','Your message');
  field.setAttribute('placeholder','Ask in English or العربية...');
  field.setAttribute('maxlength','1200');
  field.setAttribute('rows','2');
  field.required = true;
  old.replaceWith(field);
  /* Original chatbot.js closes over the old input. Mirror values into it
     so existing submit handler works unchanged. */
  old.style.display='none';
  form.insertBefore(old,field);
  field.addEventListener('input',()=>{old.value=field.value;field.style.height='auto';field.style.height=Math.min(field.scrollHeight,125)+'px'});
  field.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(field.value.trim())form.requestSubmit()}});
  form.addEventListener('submit',()=>{setTimeout(()=>{if(!old.value){field.value='';field.style.height='auto'}},0)});
  /* Keep focus in the visible field after original handler finishes */
  const observer=new MutationObserver(()=>{if(!old.disabled && document.activeElement===old)field.focus()});
  observer.observe(old,{attributes:true,attributeFilter:['disabled']});
})();

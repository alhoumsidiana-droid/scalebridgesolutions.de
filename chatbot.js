(() => {
'use strict';
function init(){
 const widget=document.getElementById('chat-widget'),panel=document.getElementById('chat-panel'),toggle=document.getElementById('chat-toggle'),close=document.getElementById('chat-close'),messages=document.getElementById('chat-messages');
 if(!widget||!panel||!toggle||!close||!messages||widget.dataset.chatInitialized==='true')return;
 widget.dataset.chatInitialized='true';
 const API='https://scalebridge-ai.solitary-snowflake-f1f3.workers.dev/chat',EMAIL='info@scalebridgesolutions.de';
 let history=[],busy=false;
 function bubble(value,who='bot'){const p=document.createElement('p');p.className='chat-bubble '+(who==='user'?'chat-user':'');p.textContent=String(value||'');p.dir='auto';messages.append(p);messages.scrollTop=messages.scrollHeight;return p;}
 const form=document.createElement('form');form.className='chat-form';form.innerHTML='<input aria-label="Your message" maxlength="1200" placeholder="Ask in English or العربية..." required><button type="submit" aria-label="Send message">➤</button>';
 const input=form.querySelector('input');
 function open(v){panel.hidden=!v;widget.classList.toggle('is-open',v);toggle.setAttribute('aria-expanded',String(v));if(v)input.focus();else toggle.focus();}
 toggle.addEventListener('click',()=>open(panel.hidden));close.addEventListener('click',()=>open(false));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)open(false)});
 const actions=document.createElement('div');actions.className='chat-extra';
 const leadBtn=document.createElement('button');leadBtn.type='button';leadBtn.textContent='Generate My Proposal';actions.append(leadBtn);
 const disclaimer=panel.querySelector('.chat-disclaimer');if(disclaimer)disclaimer.textContent='Transparent pricing. No hidden fees. Preliminary proposals are not binding offers. Do not share confidential customer data.';
 const subtitle=panel.querySelector('.chat-header small');if(subtitle)subtitle.textContent='AI Assistant · Instant Estimates & Proposals';
 const choices=panel.querySelector('.chat-choices');if(choices)choices.replaceWith(actions);else panel.append(actions);
 if(disclaimer)disclaimer.before(form);else panel.append(form);
 const lead=document.createElement('form');lead.className='chat-lead';lead.hidden=true;
 lead.innerHTML='<strong>Generate Your Preliminary Proposal</strong><p>Enter two details to receive a personalized preliminary proposal based on our published rates.</p><input name="company" aria-label="Company name" placeholder="Company name" maxlength="120" required><input name="email" type="email" aria-label="Business email" placeholder="Business email" maxlength="254" required><label class="chat-consent"><input type="checkbox" name="consent" required><span>I agree to use these details to prepare my preliminary proposal.</span></label><button type="submit">Generate My Proposal</button><button type="button" class="chat-cancel">Cancel</button><small>This is a preliminary estimate, not a final contractual offer. Final terms are confirmed by ScaleBridge Solutions.</small>';
 actions.after(lead);
 leadBtn.addEventListener('click',()=>{lead.hidden=!lead.hidden;if(!lead.hidden)lead.querySelector('input').focus()});
 lead.querySelector('.chat-cancel').addEventListener('click',()=>{lead.hidden=true});
 function emailButton(text,company){const b=document.createElement('button');b.type='button';b.className='chat-proposal-send';b.textContent='Email This Proposal to ScaleBridge';b.addEventListener('click',()=>{window.location.href='mailto:'+EMAIL+'?subject='+encodeURIComponent('Preliminary Proposal - '+company)+'&body='+encodeURIComponent(text+'\n\nPlease contact me to discuss the final proposal.')});messages.append(b);messages.scrollTop=messages.scrollHeight;}
 async function request(payload,signal){const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal});if(!r.ok)throw Error('HTTP '+r.status);return r.json();}
 lead.addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;
 const d=new FormData(lead),company=String(d.get('company')||'').trim(),email=String(d.get('email')||'').trim(),consent=d.get('consent')==='on';
 if(!company||!email||!consent)return;
 busy=true;input.disabled=true;const wait=bubble('Preparing your personalized preliminary proposal...'),controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
 try{const result=await request({message:'Generate preliminary proposal',history:history.slice(-16),proposal:{company,email,consent}},controller.signal);
 wait.textContent=result.reply||'Unable to prepare your proposal. Please try again.';
 if(result.proposalReady&&result.proposalText){lead.hidden=true;history.push({role:'assistant',content:result.proposalText});emailButton(result.proposalText,company);}
 }catch(err){console.warn('Proposal error',err);wait.textContent='We could not generate your proposal right now. Please contact '+EMAIL+'.';}
 finally{clearTimeout(timeout);busy=false;input.disabled=false;messages.scrollTop=messages.scrollHeight;}
 });
 const facts={services:'ScaleBridge provides managed Arabic and English customer support, data annotation, content moderation and AI-assisted workflows.',pricing:'Published monthly rates: Standard Agent $900, Night Shift Agent $1,050, Senior Agent $1,050, Team Leader $1,350, Group Leader $1,650, QA Analyst $1,100 and Operations Manager $2,000. Standard minimum support team: 5 agents. No automatic volume discounts. No hidden fees.',center:'ScaleBridge is developing its Damascus delivery operation. Facility arrangements are confirmed for each project.',compliance:'ScaleBridge has prepared an internal information security framework. Project-specific controls require verification. No ISO certification is claimed.',coverage:'24/7 coverage requires staffing and shift planning. Night shifts and additional requirements must be scoped.',contact:'Use Generate My Proposal or email info@scalebridgesolutions.de.'};
 function local(q){const t=q.toLowerCase();if(/compliance|security|privacy|gdpr|nda|حماية|بيانات|أمن|سرية|امتثال|iso/.test(t))return facts.compliance;if(/center|centre|office|location|visit|internet|مركز|مكتب|دمشق|زيارة/.test(t))return facts.center;if(/24\/7|coverage|shift|concurrent|دوام|شفت/.test(t))return facts.coverage;if(/price|cost|pricing|rate|سعر|تكلفة|دولار|قديش/.test(t))return facts.pricing;if(/proposal|quote|contact|email|عرض|تواصل/.test(t))return facts.contact;return facts.services;}
 form.addEventListener('submit',async e=>{
 e.preventDefault();const q=input.value.trim();if(!q||busy)return;
 input.value='';bubble(q,'user');const previousHistory=history.slice(-16);history.push({role:'user',content:q});busy=true;input.disabled=true;
 const wait=bubble('…'),controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
 try{const result=await request({message:q,history:previousHistory},controller.signal);const answer=result.reply||result.response;if(typeof answer!=='string'||!answer.trim())throw Error('Empty reply');wait.textContent=answer;history.push({role:'assistant',content:answer});}
 catch(err){console.warn('AI request failed',err);const answer=local(q);wait.textContent=answer+'\n\nAI connection is temporarily unavailable. Please confirm with ScaleBridge.';history.push({role:'assistant',content:answer});}
 finally{clearTimeout(timeout);busy=false;input.disabled=false;input.focus();messages.scrollTop=messages.scrollHeight;}
 });
 messages.replaceChildren();bubble('Welcome to ScaleBridge Solutions!\n\nAsk about our services, transparent pricing or team structures. I can calculate monthly costs and prepare a personalized preliminary proposal.\n\nأهلاً وسهلاً! اسألني عن خدماتنا وأسعارنا، وبحسبلك تكلفة فريقك وبحضّرلك عرض سعر مبدئي.');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

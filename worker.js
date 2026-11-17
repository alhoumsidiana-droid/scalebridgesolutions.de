
const ORIGIN = "https://scalebridgesolutions.de";
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8-fast";

const RATES = Object.freeze({
  agent: 900,
  nightAgent: 1050,
  seniorAgent: 1050,
  teamLeader: 1350,
  groupLeader: 1650,
  qaAnalyst: 1100,
  operationsManager: 2000
});

const ROLES = [
  {
    key: "nightAgent",
    name: "Night Shift Agent",
    pattern: "night\\s*(?:shift\\s*)?agents?|موظف(?:ين|ون|ي)?\\s*(?:شفت\\s*)?ليلي"
  },
  {
    key: "seniorAgent",
    name: "Senior Agent",
    pattern: "senior\\s*agents?|موظف(?:ين|ون|ي)?\\s*أقدم"
  },
  {
    key: "teamLeader",
    name: "Team Leader",
    pattern: "team\\s*leaders?|TLs?|مشرف(?:ين|ون)?(?:\\s*فريق)?|قائد\\s*فريق"
  },
  {
    key: "groupLeader",
    name: "Group Leader",
    pattern: "group\\s*leaders?|GLs?|قائد\\s*مجموعة"
  },
  {
    key: "qaAnalyst",
    name: "QA Analyst",
    pattern: "QA(?:\\s*analysts?)?|quality\\s*analysts?|موظف(?:ين|ون|ي)?\\s*جودة|مراقب\\s*جودة"
  },
  {
    key: "operationsManager",
    name: "Operations Manager",
    pattern: "operations\\s*managers?|OMs?|مدير\\s*عمليات"
  },
  {
    key: "agent",
    name: "Standard Support Agent",
    pattern: "(?:standard\\s+|support\\s+|customer\\s+(?:service|support)\\s+)?agents?|موظف(?:ين|ون|ي)?(?:\\s*دعم\\s*عملاء)?|موظفين|موظف"
  }
];

const SYSTEM = `
You are ScaleBridge Assistant, a professional bilingual
AI Sales Consultant for ScaleBridge Solutions.

LANGUAGE AND STYLE
- Reply in the language of the customer's latest message.
- Use professional, natural Arabic or English.
- Be concise, confident, clear and helpful.
- Answer the question directly.
- Ask no more than one follow-up question.
- Never invent prices, facts, contracts or certifications.
- Do not use markdown tables.
- Never claim to have emailed or saved a lead.

ABOUT SCALEBRIDGE
ScaleBridge Solutions provides managed Arabic and English
customer support for GCC businesses and other markets.

Services include:
- Email, live chat, social media and helpdesk support
- Data annotation and labeling
- Content moderation
- AI-powered website assistants
- AI-assisted email workflows
- Human and AI customer support solutions

Managed services can include recruiting, screening,
language assessment, basic training, onboarding,
team coordination, QA, KPI reporting and escalation
handling, according to the agreed scope.

ScaleBridge's delivery strategy includes Damascus,
Syria. Do not claim an operational center, Dubai
registration, security certification or infrastructure
that has not been verified.

COMMERCIAL PRICING
Published monthly client rates in USD per FTE:

Standard Support Agent: $900
Night Shift Agent: $1050
Senior Agent: $1050
Team Leader: $1350
Group Leader: $1650
QA Analyst: $1100
Operations Manager: $2000

WFM, AI services and special integrations require
individual quotations.

No automatic volume discounts.
Standard Agent pricing is $900 regardless of team size.

The standard minimum customer support team is 5 agents.
A smaller requirement may be discussed but is not
automatically eligible for a standard proposal.

Never add unrequested roles to a calculation.

TRANSPARENT PRICING
Transparent Pricing. No Hidden Fees.

Published role rates are real commercial rates.
The preliminary estimate is calculated from the
roles and quantities selected by the customer.

A final commercial proposal confirms:
- Service scope
- Coverage hours and shift arrangements
- Languages and channels
- Software or integrations
- Special training and operational requirements
- Applicable taxes and project-specific costs

Never suggest that published prices are arbitrary
or misleading.

PRELIMINARY PROPOSALS
A preliminary proposal is NOT a final contractual offer.
It is based on published rates and customer-provided
requirements.

The final commercial proposal is issued by the
ScaleBridge team after scope confirmation.

All additional costs must be disclosed and agreed
in writing before commitment.

STAFFING RECOMMENDATIONS
These are optional:
- Approximately 1 Team Leader per 10 agents
- Senior Agent or shared supervision for small teams
- Dedicated QA commonly considered around 20-30 agents
- WFM commonly considered around 40-60 agents
- Group Leader or Operations Manager may be useful
  around 40-60 agents depending on complexity
- Avoid overlapping unnecessary management roles
- Clients may choose different supervision ratios

24/7 COVERAGE
Distinguish total agents from simultaneous agents.
Each continuously staffed position requires
168 coverage hours per week.

Four simultaneous agents require 672 hours/week.
At 40 hours per FTE, theoretical staffing is 16.8 FTE.
A preliminary range of 20-24 FTE may be appropriate
after accounting for unavailable time.

Night-shift costs and other requirements must be
evaluated separately.

SECURITY
Do not claim ISO, SOC 2 or GDPR certification.
Never request passwords or sensitive customer records.

CONTACT
info@scalebridgesolutions.de
`;

function normalize(value) {
  return String(value || "")
    .replace(/[٠-٩]/g, d =>
      String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, d =>
      String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/\s+/g, " ")
    .trim();
}

function isArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

function money(value) {
  return "$" + value.toLocaleString("en-US");
}

function validCount(n) {
  return Number.isSafeInteger(n) && n > 0 && n <= 10000;
}

function cleanReply(value) {
  return String(value || "")
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
}

function corsHeaders(origin) {
  const allowed =
    origin === ORIGIN ||
    origin === "https://www.scalebridgesolutions.de";

  return {
    "Access-Control-Allow-Origin": allowed ? origin : ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin"
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(origin)
  });
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history.slice(-16)
    .filter(x =>
      x &&
      ["user", "assistant"].includes(x.role) &&
      typeof x.content === "string"
    )
    .map(x => ({
      role: x.role,
      content: x.content.slice(0, 2000)
    }));
}

function detectRoleCounts(message) {
  const source = normalize(message);
  const candidates = [];

  for (const role of ROLES) {
    const p = role.pattern;

    const expressions = [
      new RegExp(
        "(?<![\\p{L}\\p{N}])(\\d{1,5})\\s*(?:x|×)?\\s*(?:" +
        p + ")(?![\\p{L}])",
        "giu"
      ),
      new RegExp(
        "(?<![\\p{L}\\p{N}])(?:" + p +
        ")\\s*(?:x|×|:|=)?\\s*(\\d{1,5})(?!\\d)",
        "giu"
      )
    ];

    for (const expression of expressions) {
      for (const match of source.matchAll(expression)) {
        const count = Number(match[1]);

        if (validCount(count)) {
          candidates.push({
            key: role.key,
            count,
            start: match.index,
            end: match.index + match[0].length,
            length: match[0].length
          });
        }
      }
    }
  }

  candidates.sort((a, b) => {
    if (a.key === "agent" && b.key !== "agent") return 1;
    if (b.key === "agent" && a.key !== "agent") return -1;
    return b.length - a.length;
  });

  const selected = [];

  for (const candidate of candidates) {
    const overlaps = selected.some(existing =>
      candidate.start < existing.end &&
      existing.start < candidate.end
    );

    if (!overlaps) selected.push(candidate);
  }

  const counts = {};

  for (const item of selected) {
    if (
      counts[item.key] !== undefined &&
      counts[item.key] !== item.count
    ) {
      return { ambiguous: true };
    }

    counts[item.key] = item.count;
  }

  return {
    counts,
    ambiguous: false
  };
}

function hasRoles(counts) {
  return Object.values(counts || {}).some(validCount);
}

function findLatestTeam(history, message = "") {
  const inputs = [
    message,
    ...history
      .filter(x => x.role === "user")
      .map(x => x.content)
      .reverse()
  ];

  for (const input of inputs) {
    const parsed = detectRoleCounts(input);

    if (parsed.ambiguous) {
      return { ambiguous: true };
    }

    if (hasRoles(parsed.counts)) {
      return {
        counts: parsed.counts,
        source: input
      };
    }
  }

  return null;
}

function calculate(counts) {
  let total = 0;
  const lines = [];

  for (const role of ROLES) {
    const count = counts[role.key];

    if (!validCount(count)) continue;

    const subtotal = count * RATES[role.key];
    total += subtotal;

    lines.push({
      role: role.name,
      count,
      rate: RATES[role.key],
      subtotal
    });
  }

  return { lines, total };
}

function formatLines(lines) {
  return lines.map(line =>
    `${line.count} × ${line.role} × ` +
    `${money(line.rate)} = ${money(line.subtotal)}`
  ).join("\n");
}

function asksPricing(text) {
  return /price|pricing|cost|quote|quotation|how much|estimate|monthly|سعر|أسعار|اسعار|تكلف|قديش|بكم|شهري|عرض سعر/i.test(text);
}

function asksRecommendation(text) {
  return /recommend|suggest|team structure|staffing structure|supervision|هيكل|تنصح|توصي|اقتراح|مشرف|توزيع الفريق/i.test(text);
}

function asksCoverage(text) {
  return /24\s*\/\s*7|24\s*hours|around.the.clock|simultaneous|concurrent|على مدار الساعة|بنفس الوقت|طوال اليوم/i.test(normalize(text));
}

function recommendationText(n, ar) {
  const parts = [];

  if (n < 10) {
    parts.push(ar
      ? "ممكن نستخدم Senior Agent أو إشراف مشترك."
      : "A Senior Agent or shared supervision may be suitable.");
  } else {
    const tls = Math.ceil(n / 10);

    parts.push(ar
      ? `منقترح مبدئياً ${tls} Team Leader، بمعدل مشرف لكل 10 Agents تقريباً.`
      : `We initially recommend ${tls} Team Leader(s), approximately one per 10 agents.`);
  }

  if (n >= 20) {
    parts.push(ar
      ? "منراجع الحاجة لـQA مخصص أو مشترك."
      : "We would review dedicated versus shared QA coverage.");
  }

  if (n >= 40) {
    parts.push(ar
      ? "منقيّم الحاجة لـWFM وإدارة تشغيلية إضافية حسب تعقيد المشروع."
      : "We would assess WFM and additional management based on operational complexity.");
  }

  parts.push(ar
    ? "هاي توصيات اختيارية، وما منضيف أي دور على السعر بدون موافقتك."
    : "These recommendations are optional. No role is added without your approval.");

  return parts.join("\n");
}

function pricingReply(message, history) {
  const ar = isArabic(message);
  const parsed = detectRoleCounts(message);

  if (parsed.ambiguous) {
    return ar
      ? "ممكن تأكدلي العدد النهائي لكل وظيفة؟"
      : "Could you confirm the final count for each role?";
  }

  if (!hasRoles(parsed.counts)) return null;

  const genericHeadcount =
    /\b(?:employees|staff|people|headcount)\b|موظف(?:ين|ون)?/i.test(message);

  const hasSpecificRole =
    /\b(?:agents?|team leaders?|TLs?|QA|senior|night)\b|دعم عملاء|مشرف/i.test(message);

  if (
    genericHeadcount &&
    !hasSpecificRole &&
    Object.keys(parsed.counts).length > 0
  ) {
    return ar
      ? "هل العدد المذكور هو عدد موظفي دعم العملاء فقط، أم العدد الإجمالي للفريق؟"
      : "Is that the number of support agents only, or the total team headcount?";
  }

  const result = calculate(parsed.counts);

  if (!result.lines.length) return null;

  let reply = ar
    ? `التكلفة الشهرية للأدوار المطلوبة:\n\n${formatLines(result.lines)}\n\nالمجموع: ${money(result.total)} شهرياً.`
    : `Monthly cost for your requested roles:\n\n${formatLines(result.lines)}\n\nTotal: ${money(result.total)}/month.`;

  if (parsed.counts.agent && parsed.counts.agent < 5) {
    reply += ar
      ? "\n\nملاحظة: الحد الأدنى القياسي لفريق دعم العملاء هو 5 Agents. منقدر نناقش احتياجك لفريق أصغر بشكل منفصل."
      : "\n\nNote: Our standard minimum customer support team is 5 agents. Smaller requirements can be discussed separately.";
  }

  reply += ar
    ? "\n\nما أضفنا أي أدوار غير مطلوبة. أي تكاليف مرتبطة بمتطلبات خاصة منوضحها قبل الاتفاق. بدون رسوم مخفية."
    : "\n\nNo unrequested roles were added. Any project-specific costs are disclosed before agreement. No hidden fees.";

  if (asksRecommendation(message) && parsed.counts.agent) {
    reply += "\n\n" +
      recommendationText(parsed.counts.agent, ar);
  } else {
    reply += ar
      ? "\n\nبتحب نجهزلك Preliminary Proposal؟"
      : "\n\nWould you like a personalized preliminary proposal?";
  }

  return reply;
}

function recommendationReply(message, history) {
  const ar = isArabic(message);
  const team = findLatestTeam(history, message);
  const n = team?.counts?.agent;

  if (!validCount(n)) {
    return ar
      ? "كم Agent بدك يكون بالفريق حتى أقترح هيكل مناسب؟"
      : "How many support agents will your team have?";
  }

  return (ar
    ? `لفريق من ${n} Agents:\n\n`
    : `For a team of ${n} agents:\n\n`) +
    recommendationText(n, ar);
}

function coverageReply(message) {
  const ar = isArabic(message);
  const s = normalize(message);
  const match = s.match(
    /(\d{1,4})\s*(?:agents?|employees|staff|موظف(?:ين|ون)?)/i
  );

  if (!match) return null;

  const n = Number(match[1]);

  if (!validCount(n)) return null;

  const simultaneous =
    /simultaneous|concurrent|online at the same time|at the same time|بنفس الوقت|بنفس اللحظة|متواجدين/i.test(s);

  const total =
    /in total|total employees|total agents|إجمال|بالمجموع/i.test(s);

  if (!simultaneous && !total) {
    return ar
      ? `هل تقصد ${n} موظفين إجمالاً، أو ${n} موظفين متواجدين بنفس الوقت طوال 24/7؟`
      : `Do you mean ${n} agents in total, or ${n} agents online simultaneously 24/7?`;
  }

  if (total && !simultaneous) {
    return ar
      ? "كم موظف لازم يكون متواجد بنفس الوقت بكل شفت؟"
      : "How many agents must be online simultaneously per shift?";
  }

  const hours = n * 168;
  const theoretical = hours / 40;
  const low = Math.ceil(theoretical / 0.85);
  const high = Math.ceil(theoretical / 0.70);

  const estimate =
    `${n} × 24 × 7 = ${hours}\n` +
    `${hours} ÷ 40 = ${theoretical.toFixed(1)} FTE`;

  return ar
    ? `لتأمين ${n} موظفين بنفس الوقت طوال 24/7:\n\n${estimate}\n\nبعد احتساب الإجازات والاستراحات والغياب والتدريب، منخطط مبدئياً لحوالي ${low}–${high} موظف.\n\nالسعر المرجعي على تعرفة النهار: ${money(low * 900)}–${money(high * 900)} شهرياً. هاد مو السعر النهائي لتغطية 24/7، لأن الشفت الليلي والمتطلبات الإضافية لازم تنحسب بشكل منفصل.`
    : `For ${n} agents online simultaneously 24/7:\n\n${estimate}\n\nAllowing for breaks, leave, absences and training, initial planning is approximately ${low}–${high} FTE.\n\nReference staffing cost at daytime rates: ${money(low * 900)}–${money(high * 900)}/month. This is not a complete 24/7 quote; night-shift and other requirements must be scoped separately.`;
}

function proposalReply(proposal, history) {
  const company = String(proposal.company || "").trim();
  const email = String(proposal.email || "").trim();

  if (
    !proposal.consent ||
    company.length < 2 ||
    company.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254
  ) {
    return {
      reply: "Please provide a valid company name, business email and consent.",
      proposalReady: false
    };
  }

  const team = findLatestTeam(history);

  if (!team || team.ambiguous || !hasRoles(team.counts)) {
    return {
      reply: "To prepare your preliminary proposal, please tell me the number of agents and any additional roles you need first.",
      proposalReady: false
    };
  }

  if (
    team.counts.agent &&
    team.counts.agent < 5
  ) {
    return {
      reply: "Our standard minimum customer support team is 5 agents. Please confirm whether you would like a proposal for 5 agents, or contact our team to discuss a smaller setup.",
      proposalReady: false
    };
  }

  const result = calculate(team.counts);

  const requiresCoverageReview =
    history.some(x =>
      x.role === "user" &&
      asksCoverage(x.content)
    );

  const coverageNote = requiresCoverageReview
    ? "24/7 coverage or shift requirements mentioned in the conversation require separate staffing and premium validation."
    : "Coverage hours and shift arrangements are subject to confirmation.";

  const reply =
`SCALEBRIDGE SOLUTIONS
PRELIMINARY PROPOSAL

Prepared for: ${company}
Business email: ${email}

SERVICE
Managed Customer Support

PROPOSED TEAM
${formatLines(result.lines)}

MONTHLY BASE TOTAL
${money(result.total)} USD/month

PRICING TRANSPARENCY
This preliminary proposal uses ScaleBridge's published monthly rates for the selected roles.

Our standard agent rate is $900 per FTE/month, regardless of team size.

No unrequested roles have been added.

SCOPE CONFIRMATION
${coverageNote}

The final commercial proposal will be issued by the ScaleBridge team after confirming service scope, channels, languages, coverage, software and any additional project-specific requirements.

All additional costs will be disclosed and agreed in writing before commitment.

Transparent Pricing. No Hidden Fees.

NEXT STEP
Contact info@scalebridgesolutions.de to request your final commercial proposal.

This is a preliminary estimate, not a binding contractual offer.`;

  return {
    reply,
    proposalReady: true,
    proposalText: reply
  };
}


// Email delivery uses a server-side secret. Never place RESEND_API_KEY in website JavaScript.
async function notifyOwner(env, subject, content) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_FROM_EMAIL) {
    return {sent:false, reason:'Email delivery is not configured'};
  }
  const response = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{'Authorization':'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({
      from:env.NOTIFY_FROM_EMAIL,
      to:['info@scalebridgesolutions.de'],
      subject:subject.slice(0,180),
      text:content.slice(0,15000)
    })
  });
  if (!response.ok) {
    console.error('Owner notification failed',response.status);
    return {sent:false,reason:'Email provider rejected the request'};
  }
  return {sent:true};
}
function validEmail(v) {return typeof v==='string' && v.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
function safeField(v,max=120) {return typeof v==='string' ? v.trim().slice(0,max).replace(/[\u0000-\u001f]/g,' ') : '';}
async function meetingReply(meeting,env) {
  const name=safeField(meeting.name), company=safeField(meeting.company), email=safeField(meeting.email,254);
  const tz=safeField(meeting.timezone,80), slots=meeting.slots;
  if (meeting.website || !meeting.consent || name.length<2 || company.length<2 || !validEmail(email) ||
      !Array.isArray(slots) || slots.length!==3 || !Intl.supportedValuesOf('timeZone').includes(tz)) {
    return {reply:'Please enter your details and three valid meeting times.',requestReceived:false};
  }
  const parsed=slots.map(s=>typeof s==='string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s) ? Date.parse(s) : NaN);
  const now=Date.now();
  if (parsed.some(t=>!Number.isFinite(t)||t<now+72*3600*1000||t>now+120*86400*1000) || new Set(parsed).size!==3) {
    return {reply:'Please choose three different future times, at least 72 hours from now (within 120 days).',requestReceived:false};
  }
  const germany=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',dateStyle:'full',timeStyle:'short'});
  const customer=new Intl.DateTimeFormat('en-GB',{timeZone:tz,dateStyle:'full',timeStyle:'short'});
  const lines=parsed.map((t,i)=>`${i+1}. ${customer.format(t)} (${tz}) | Germany: ${germany.format(t)} | UTC: ${new Date(t).toISOString()}`);
  const body=`New meeting request - pending your confirmation\n\nName: ${name}\nCompany: ${company}\nEmail: ${email}\n\nPreferred times:\n${lines.join('\n')}\n\nThis is NOT a confirmed booking. Reply to the client with the confirmed time and Google Meet link.`;
  const sent=await notifyOwner(env,'ScaleBridge | Meeting request | '+company,body);
  return sent.sent ? {reply:'Thank you! We received your three preferred meeting times. Our team will review them and confirm one option by email. No meeting is booked yet.',requestReceived:true} :
    {reply:'Your request could not be delivered automatically. Please email info@scalebridgesolutions.de with your three preferred times.',requestReceived:false};
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin)
      });
    }

    if (request.method === "GET" && url.pathname === "/") {
      return json({
        status: "ok",
        service: "ScaleBridge AI V8",
        aiConfigured: Boolean(env.AI)
      }, 200, origin);
    }

    if (url.pathname !== "/chat") {
      return json({ error: "Not found" }, 404, origin);
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, origin);
    }

    if (
      origin &&
      origin !== ORIGIN &&
      origin !== "https://www.scalebridgesolutions.de"
    ) {
      return json({ error: "Origin not allowed" }, 403, origin);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, origin);
    }

    const message = String(body?.message || "").trim();
    const history = sanitizeHistory(body?.history);

    if (JSON.stringify(body).length > 24000) return json({error:"Request too large"},413,origin);

    if (message.length > 4000) {
      return json({ error: "Message too long" }, 400, origin);
    }

    try {
      if (body?.meeting) return json(await meetingReply(body.meeting,env),200,origin);

      if (body?.proposal) {
        const result = proposalReply(body.proposal, history);
        if (result.proposalReady) {
          const note = await notifyOwner(env,'ScaleBridge | Preliminary proposal | '+safeField(body.proposal.company),
            result.proposalText+'\n\nClient consent to request proposal: Yes');
          result.notificationSent = note.sent;
          if (!note.sent) result.notificationMessage = 'The proposal is ready, but the email notification was not delivered. Please email our team to continue.';
        }
        return json(result, 200, origin);
      }

      if (!message) {
        return json({ error: "Invalid message" }, 400, origin);
      }

      if (asksCoverage(message)) {
        const reply = coverageReply(message);
        if (reply) return json({ reply }, 200, origin);
      }

      if (asksPricing(message)) {
        const reply = pricingReply(message, history);
        if (reply) return json({ reply }, 200, origin);
      }

      if (asksRecommendation(message)) {
        return json({
          reply: recommendationReply(message, history)
        }, 200, origin);
      }

      if (!env.AI) {
        return json({
          reply: isArabic(message)
            ? "يسعدنا نساعدك بخدمات ScaleBridge وأسعارنا. تواصل معنا على info@scalebridgesolutions.de."
            : "We'd be happy to help with our services and transparent pricing. Contact info@scalebridgesolutions.de."
        }, 200, origin);
      }

      const result = await env.AI.run(MODEL, {
        messages: [
          { role: "system", content: SYSTEM },
          ...history,
          { role: "user", content: message }
        ],
        max_tokens: 450,
        temperature: 0.2
      });

      return json({
        reply: cleanReply(result?.response) ||
          "Could you clarify your question?"
      }, 200, origin);

    } catch (error) {
      console.error("ScaleBridge AI V8:", error);

      return json({
        reply: isArabic(message)
          ? "صار خطأ تقني مؤقت. تواصل معنا على info@scalebridgesolutions.de."
          : "A temporary technical issue occurred. Please contact info@scalebridgesolutions.de."
      }, 200, origin);
    }
  }
};

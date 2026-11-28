
const ORIGIN = "https://scalebridgesolutions.de";
const EMAIL = "info@scalebridgesolutions.de";
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8-fast";
const SHRINKAGE = 0.25;

const RATES = {
  agent: 900,
  nightAgent: 1050,
  seniorAgent: 1050,
  teamLeader: 1350,
  groupLeader: 1650,
  qaAnalyst: 1100,
  operationsManager: 2000
};

const NAMES = {
  agent: "Standard Support Agent",
  nightAgent: "Night Shift Agent",
  seniorAgent: "Senior Agent",
  teamLeader: "Team Leader",
  groupLeader: "Group Leader",
  qaAnalyst: "QA Analyst",
  operationsManager: "Operations Manager"
};

const SYSTEM = `
You are ScaleBridge AI Assistant, a confident,
helpful B2B sales consultant for ScaleBridge Solutions.

Respond in the language of the latest user message.

In Arabic use clear, elegant Modern Standard Arabic
suitable for GCC businesses, never colloquial.

In English use warm, polished, concise business English.

Keep most answers to 60-110 words, with at most
four short bullets.

Answer the question directly, do not repeat previous
information, ask at most one useful next-step question.

Act as a consultative B2B sales advisor. Ask about channels,
languages, volume, shifts and launch timing only when relevant.
Offer a small pilot, scoped proposal or meeting naturally.
Do not invent references, certifications, discounts or promises.
For automation, annotation and moderation explain custom scoping.

Longer answers only when explicitly requested.

Do not claim a meeting is booked or a proposal email
was sent unless confirmed by the server.

COMPANY:
ScaleBridge offers managed Arabic- and English-language
customer support for GCC clients.

Services include:
- Inbound and outbound customer support
- Customer follow-ups, surveys and engagement
- Email, live chat, social media and helpdesk
- AI-powered customer support and automation solutions
- Data annotation
- Content moderation

Sales calling and lead generation require scope confirmation.

We combine human expertise with appropriate automation.

Describe integrations, bots and custom AI projects as
scoped solutions, not already deployed guarantees.

Delivery strategy includes Damascus, Syria.

Never claim Dubai registration, a physical center,
certifications, client references or operating
capabilities are complete without verification.

QUALITY AND ACCOUNTABILITY:
Agree on SLAs and KPIs with the client.

Define QA scorecards, sample and review interactions,
provide coaching and calibration.

Track CSAT, first response time, resolution time,
backlog and AHT where relevant.

Share weekly KPI reports and escalation paths.

Describe these as a proposed operational framework,
not a proven existing certification or guaranteed outcome.

PRICING:
Published monthly USD/FTE rates:

Standard Support Agent: $900
Night Shift Agent: $1,050
Senior Agent: $1,050
Team Leader: $1,350
Group Leader: $1,650
QA Analyst: $1,100
Operations Manager: $2,000

No automatic volume discounts or hidden fees.

Do not invent any price for AI automation,
data annotation, content moderation, software,
setup or other unpriced services.

These require scope review and a custom quote.

A standard starting team can be five agents.
Smaller teams including one agent can be
discussed individually.

Never present five as a hard minimum.

STAFFING:
Team Leader around ten agents.
QA around 20-30 agents.
Group Leader around 30+ agents.
Operations Manager around 40-60 agents.

These are recommendations only,
never mandatory additions.

Do not calculate 24/7 staffing yourself.
The deterministic server calculator handles it.

Distinguish total employed agents from
simultaneously online agents.

Never assume 24/7 from 8 hours per day.

All estimates are nonbinding and require
scope confirmation.

Meeting requests are not confirmed bookings.

Contact: ${EMAIL}.
`;

function norm(v) {
  return String(v ?? "")
    .replace(/[٠-٩]/g, x =>
      String("٠١٢٣٤٥٦٧٨٩".indexOf(x))
    )
    .replace(/[۰-۹]/g, x =>
      String("۰۱۲۳۴۵۶۷۸۹".indexOf(x))
    )
    .replace(/\s+/g, " ")
    .trim();
}

function isAr(s) {
  return /[\u0600-\u06ff]/.test(s || "");
}

function usd(n) {
  return "$" + Number(n).toLocaleString("en-US");
}

function good(n) {
  return Number.isSafeInteger(n) &&
    n > 0 &&
    n <= 5000;
}

function safe(v, max = 120) {
  return typeof v === "string"
    ? v.trim().slice(0, max)
        .replace(/[\x00-\x1f]/g, " ")
    : "";
}

function emailOK(v) {
  return typeof v === "string" &&
    v.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function cleanHistory(h) {
  return Array.isArray(h)
    ? h.slice(-20)
        .filter(x =>
          x &&
          ["user", "assistant"].includes(x.role) &&
          typeof x.content === "string"
        )
        .map(x => ({
          role: x.role,
          content: x.content.slice(0, 2000)
        }))
    : [];
}

const re247 =
  /24\s*\/\s*7|24\s*hours?|24\s*ساعة|24\s*ساعه|around.the.clock|round.the.clock|non.stop|continuous coverage|على مدار الساعة|تغطية مستمرة|طوال اليوم|طول اليوم/i;

const reConcurrent =
  /simultaneous|concurrent|at\s+the\s+same\s+time|at\s+all\s+times|always\s+online|online\s+at\s+once|per\s+shift|each\s+shift|بنفس\s+الوقت|بنفس\s+اللحظة|أونلاين|اونلاين|متواجدين|في\s+نفس\s+الوقت|متصلين\s+دائماً/i;

function concurrentCount(t) {
  const s = norm(t).replace(/24\s*\/\s*7/g, ' ');
  const p = [
    /(\d{1,4})\s*(?:agents?|employees|موظف(?:ين|ون)?)\s*(?:online|logged\s*in|available|working|متصلين|متواجدين)/i,
    /(\d{1,4})\s*(?:online|simultaneously|concurrently|متصلين|متواجدين)/i,
    /(?:online|simultaneously|concurrently|متصلين|متواجدين)\s*(?:with|:|=|of)?\s*(\d{1,4})\s*(?:agents?|employees|موظف(?:ين|ون)?)?/i
  ];
  for (const re of p) {
    const m = s.match(re);
    if (m && good(Number(m[1]))) return Number(m[1]);
  }
  return null;
}

const reTotal =
  /in\s+total|total\s+agents|total\s+team|overall\s+headcount|إجمالي|بالمجموع|العدد\s+الكلي/i;

const reAdvice =
  /recommend|suggest|team\s*structure|staffing\s*structure|supervision|which\s*roles|هيكل|تنصح|توصي|اقتراح|مشرف|توزيع\s*الفريق/i;

const rePrice =
  /pric|cost|quote|quotation|estimate|how\s*much|monthly|budget|سعر|أسعار|اسعار|تكلف|قديش|بكم|شهري|عرض\s*سعر|التسعير/i;

const reShrink =
  /shrinkage|shrink|relief\s*staff|backup\s*staff|staffing\s*buffer|احتياط|الغياب|الإجازات|الاجازات|شرنكج|شرينكج|شرنك/i;

const reDay =
  /day\s*shift|daytime|day\s*only|نهاري|شفت\s*نهار|دوام\s*نهار/i;

const reNight =
  /night\s*shift|nighttime|night\s*only|agents?\s+at\s+night|working\s+at\s+night|ليلي|شفت\s*ليل|دوام\s*ليل|موظف(?:ين|ون)?\s+بالليل/i;

const reHours =
  /\b\d{1,2}\s*(?:hours?|hrs?)\s*(?:per\s*day|a\s*day|daily)|\b\d{1,2}\s*ساعات?\s*(?:يومياً|باليوم)/i;

const roleRegex = [
  [
    "nightAgent",
    /(?:night\s*(?:shift\s*)?agents?|agents?\s*(?:on\s*)?night\s*shift|موظف(?:ين|ون)?\s*ليلي)/i
  ],
  [
    "seniorAgent",
    /(?:senior\s*agents?|موظف(?:ين|ون)?\s*أقدم)/i
  ],
  [
    "teamLeader",
    /(?:team\s*leaders?|\bTLs?\b|مشرف(?:ين|ون)?|قائد\s*فريق)/i
  ],
  [
    "groupLeader",
    /(?:group\s*leaders?|\bGLs?\b|قائد\s*مجموعة)/i
  ],
  [
    "qaAnalyst",
    /(?:\bQA\b|quality\s*analysts?|مراقب\s*جودة)/i
  ],
  [
    "operationsManager",
    /(?:operations\s*managers?|\bOMs?\b|مدير\s*عمليات)/i
  ],
  [
    "agent",
    /(?:standard\s*agents?|support\s*agents?|customer\s*(?:service|support)\s*agents?|\bagents?\b|موظف(?:ين|ون)?)/i
  ]
];

function headcount(t) {
  // Exclude 24/7 notation so it cannot be mistaken for a headcount.
  const s = norm(t).replace(/24\s*\/\s*7/g, " ");

  const patterns = [
    /(\d{1,4})\s*(?:total|overall|إجمالي|بالمجموع)\s*(?:agents?|employees|staff|seats?|positions?|موظف(?:ين|ون)?|مقاعد?)/i,
    /(\d{1,4})\s*(?:agents?|employees|staff|seats?|positions?|موظف(?:ين|ون)?|مقاعد?)/i,
    /(?:agents?|employees|staff|seats?|positions?|موظف(?:ين|ون)?|مقاعد?)\s*(?:x|:|=|of)?\s*(\d{1,4})/i,
    /(?:need|require|want|looking for|أحتاج|نحتاج|أريد|نريد)\s*(\d{1,4})/i,
    /^(\d{1,4})$/
  ];

  for (const p of patterns) {
    const m = s.match(p);

    if (m && good(Number(m[1]))) {
      return Number(m[1]);
    }
  }

  return null;
}

function parseRoles(t) {
  const s = norm(t);
  const hits = [];

  for (const [key, p] of roleRegex) {
    const patterns = [
      new RegExp(
        "(\\d{1,4})\\s*(?:x|×)?\\s*(?:" +
        p.source + ")",
        "giu"
      ),
      new RegExp(
        "(?:" + p.source +
        ")\\s*(?:x|×|:|=|of)?\\s*(\\d{1,4})",
        "giu"
      )
    ];

    for (const r of patterns) {
      for (const m of s.matchAll(r)) {
        const n = Number(m[1]);

        if (good(n)) {
          hits.push({
            key,
            n,
            start: m.index,
            end: m.index + m[0].length,
            length: m[0].length
          });
        }
      }
    }
  }

  hits.sort((a, b) =>
    Number(a.key === "agent") -
    Number(b.key === "agent") ||
    b.length - a.length
  );

  const selected = [];

  for (const hit of hits) {
    if (!selected.some(x =>
      hit.start < x.end &&
      x.start < hit.end
    )) {
      selected.push(hit);
    }
  }

  const counts = {};

  for (const hit of selected) {
    if (
      counts[hit.key] !== undefined &&
      counts[hit.key] !== hit.n
    ) {
      return {
        ambiguous: true,
        counts: {}
      };
    }

    counts[hit.key] = hit.n;
  }

  return {
    ambiguous: false,
    counts
  };
}

function scopeOf(t) {
  const s = norm(t);
  const n = headcount(s);
  const parsed = parseRoles(s);

  if (re247.test(s)) {
    return {
      kind: "247",
      n: concurrentCount(s) || n,
      mode: reConcurrent.test(s)
        ? "concurrent"
        : reTotal.test(s)
          ? "total"
          : null
    };
  }

  if (reDay.test(s) || reNight.test(s)) {
    const shift =
      reNight.test(s) && !reDay.test(s)
        ? "night"
        : "day";

    const counts = { ...parsed.counts };

    if (
      n &&
      !counts.agent &&
      !counts.nightAgent
    ) {
      counts[
        shift === "night"
          ? "nightAgent"
          : "agent"
      ] = n;
    }

    if (
      shift === "night" &&
      counts.agent &&
      !counts.nightAgent
    ) {
      counts.nightAgent = counts.agent;
      delete counts.agent;
    }

    return {
      kind: "shift",
      shift,
      n: n || counts.agent || counts.nightAgent,
      counts,
      ambiguous: parsed.ambiguous
    };
  }

  if (Object.keys(parsed.counts).length) {
    return {
      kind: "roles",
      counts: parsed.counts,
      ambiguous: parsed.ambiguous
    };
  }

  if (
    n &&
    /\b(?:need|want|require|team|staff|employees|agents)\b|أحتاج|نحتاج|موظف/.test(s)
  ) {
    return {
      kind: "roles",
      counts: { agent: n },
      ambiguous: false
    };
  }

  return null;
}

function latestScope(h, m = "") {
  const u = h
    .filter(x => x.role === "user")
    .map(x => x.content);

  if (m) u.push(m);

  for (let i = u.length - 1; i >= 0; i--) {
    const s = scopeOf(u[i]);
    if (s) return s;
  }

  return null;
}

function resolve247(m, h) {
  const current = scopeOf(m);

  const users = h
    .filter(x => x.role === "user")
    .map(x => x.content);

  const prev = [...users]
    .reverse()
    .map(scopeOf)
    .find(x => x?.kind === "247");

  const prevN = [...users]
    .reverse()
    .map(headcount)
    .find(good);

  if (current?.kind === "247") {
    return {
      ...current,
      n: concurrentCount(m) || current.n || prev?.n || prevN || null,
      mode: current.mode || prev?.mode || null
    };
  }

  const s = norm(m);

  const mode =
    reConcurrent.test(s) && !reTotal.test(s)
      ? "concurrent"
      : reTotal.test(s) && !reConcurrent.test(s)
        ? "total"
        : null;

  if (prev && mode) {
    return {
      ...prev,
      mode,
      n: concurrentCount(s) || headcount(s) || prev.n || prevN || null
    };
  }

  if (
    prev &&
    /^(?:yes|correct|exactly|نعم|اي|أيوه|صح|بالضبط)[.!\s]*$/i.test(s)
  ) {
    return prev;
  }

  return null;
}

function quote(c) {
  let total = 0;
  const lines = [];

  for (const [key, rate] of Object.entries(RATES)) {
    if (good(c?.[key])) {
      const amount = c[key] * rate;
      total += amount;

      lines.push(
        `${c[key]} × ${NAMES[key]} × ` +
        `${usd(rate)} = ${usd(amount)}`
      );
    }
  }

  return { total, lines };
}

function shrinkFactor(t) {
  const m = norm(t).match(
    /(?:shrinkage|shrink|شرنكج|شرينكج|شرنك)\s*(?:of|at|:|=)?\s*(\d{1,2}(?:\.\d+)?)\s*%|(\d{1,2}(?:\.\d+)?)\s*%\s*(?:shrinkage|shrink|شرنكج|شرينكج|شرنك)/i
  );

  if (!m) return SHRINKAGE;

  const v = Number(m[1] || m[2]) / 100;

  return v >= 0 && v <= 0.5
    ? v
    : SHRINKAGE;
}

function coveragePlan(seats, factor = SHRINKAGE) {
  const productive = 40 * (1 - factor);

  const day = Math.ceil(
    seats * 112 / productive
  );

  const night = Math.ceil(
    seats * 56 / productive
  );

  return {
    seats,
    day,
    night,
    total: day + night,
    cost:
      day * RATES.agent +
      night * RATES.nightAgent,
    hours: seats * 168,
    theoretical: seats * 168 / 40
  };
}

function coverageAnswer(
  scope,
  ar,
  factor = SHRINKAGE
) {
  if (!scope?.n) {
    return ar
      ? "كم موظفاً تحتاج أن يكون متصلاً في الوقت نفسه لتغطية 24/7؟"
      : "How many agents must be online simultaneously for 24/7 coverage?";
  }

  if (!scope.mode) {
    return ar
      ? `هل تقصد ${scope.n} موظفين إجمالاً، أم ${scope.n} موظفين متواجدين في الوقت نفسه على مدار الساعة؟`
      : `Do you mean ${scope.n} employees in total, or ${scope.n} agents online simultaneously 24/7?`;
  }

  if (scope.mode === "total") {
    return ar
      ? `إذا كان العدد الإجمالي ${scope.n} موظفين، فكم موظفاً تحتاج متواجداً في الوقت نفسه؟`
      : `With ${scope.n} employees in total, how many need to be online simultaneously?`;
  }

  const p = coveragePlan(scope.n, factor);
  const pct = Math.round(factor * 100);
  if (ar) {
    return `تقدير أولي غير ملزم لتغطية 24/7 مع ${scope.n} موظفين متواجدين بنفس الوقت:

• ساعات التغطية أسبوعياً: ${p.hours} ساعة
• ${p.day} موظفاً بالتسعير العادي × $900 = ${usd(p.day * RATES.agent)}
• ${p.night} موظفاً بالتسعير الليلي × $1,050 = ${usd(p.night * RATES.nightAgent)}
• إجمالي الفريق التقديري: ${p.total} FTE

**التكلفة الشهرية التقديرية: ${usd(p.cost)}**

الافتراضات للتقدير فقط: 16 ساعة عادية و8 ساعات ليلية يومياً، و40 ساعة مدفوعة أسبوعياً لكل موظف، و${pct}% Shrinkage. تقسيم المناوبات الفعلي والمنطقة الزمنية ومتطلبات الخدمة قد تغيّر العدد والسعر النهائي. الإدارة وQA غير مشمولين تلقائياً.

هل ترغب بعرض مبدئي لمراجعة التفاصيل؟`;
  }
  return `Illustrative, nonbinding 24/7 estimate for ${scope.n} agents online simultaneously:

• Weekly coverage: ${p.hours} agent-hours
• ${p.day} Standard-rate FTE × $900 = ${usd(p.day * RATES.agent)}
• ${p.night} Night-rate FTE × $1,050 = ${usd(p.night * RATES.nightAgent)}
• Indicative team: ${p.total} FTE

**ESTIMATED MONTHLY TOTAL: ${usd(p.cost)}**

Planning assumptions only: 16 standard-rate hours and 8 night-rate hours per day, 40 paid hours/FTE/week and ${pct}% shrinkage. The actual shift roster, client time zone and service requirements may change final staffing and pricing. Management and QA are not automatically included.

Would you like a preliminary proposal to review the scope?`;
}

function structure(n, ar) {
  if (!good(n)) {
    return ar
      ? "كم عدد موظفي الدعم المطلوب حتى أقترح هيكل الفريق؟"
      : "How many support agents do you need for a team structure recommendation?";
  }

  const lines = [
    ar
      ? `هيكل مبدئي لفريق من ${n} موظفين:`
      : `Suggested structure for ${n} agents:`,
    `• Support Agents: ${n}`
  ];

  if (n < 10) {
    lines.push(
      ar
        ? "• Senior Agent / Player-Coach: خيار للإشراف على فريق صغير."
        : "• Senior Agent / Player-Coach: optional for a small team."
    );
  } else {
    lines.push(
      `• Team Leaders: ${Math.ceil(n / 10)}`
    );
  }

  if (n >= 20) {
    lines.push(
      ar
        ? "• QA Analyst: حسب حجم المراجعات."
        : "• QA Analyst: depending on review volume."
    );
  }

  if (n >= 30) {
    lines.push(
      ar
        ? "• Group Leader: حسب عدد الفرق."
        : "• Group Leader: depending on team structure."
    );
  }

  if (n >= 40) {
    lines.push(
      ar
        ? "• Operations Manager: حسب تعقيد التشغيل."
        : "• Operations Manager: depending on complexity."
    );
  }

  lines.push(
    ar
      ? "هذه توصيات اختيارية ولا تُضاف تكلفتها دون موافقتك."
      : "These are optional recommendations, never automatic charges."
  );

  return lines.join("\n");
}

function baseAnswer(scope, ar, custom = false) {
  if (scope?.ambiguous) {
    return ar
      ? "يرجى تأكيد العدد المطلوب لكل دور."
      : "Please confirm the quantity for each role.";
  }

  const q = quote(scope?.counts || {});

  if (!q.lines.length) {
    return ar
      ? "كم موظفاً تحتاج؟ يمكنني حساب التكلفة الشهرية."
      : "How many agents do you need? I can calculate the monthly cost.";
  }

  const customNote = custom
    ? (ar ? '\n\nخدمات الأتمتة وتصنيف البيانات والإشراف على المحتوى غير مشمولة، وتحتاج عرضاً منفصلاً حسب نطاق المشروع.' : '\n\nAI automation, data annotation and content moderation are not included; they require a separate scoped quote.')
    : '';

  if (ar) {
    return `تقدير التكلفة الشهرية:

${q.lines.join("\n")}

الإجمالي: ${usd(q.total)} شهرياً.${customNote}

لا رسوم مخفية أو خصومات تلقائية، ولا تُضاف الإدارة أو التغطية الاحتياطية تلقائياً.

تغطية 24/7 تحتاج حساباً منفصلاً.

هل ترغب بعرض مبدئي؟`;
  }

  return `Monthly estimate:

${q.lines.join("\n")}

Total: ${usd(q.total)}/month.${customNote}

No hidden fees or automatic volume discounts.

Relief staffing and management are not automatically included.

24/7 coverage needs a separate calculation.

Would you like a preliminary proposal?`;
}

function shrinkAnswer(scope, m) {
  const ar = isAr(m);
  const factor = shrinkFactor(m);
  const pct = Math.round(factor * 100);

  if (!scope) {
    return ar
      ? "كم موظفاً تريد احتساب تغطية الإجازات والغياب لهم؟"
      : "How many agents need relief coverage?";
  }

  if (scope.kind === "247") {
    return coverageAnswer(scope, ar, factor);
  }

  const c = scope.counts || {};
  const base = quote(c);

  let total = base.total;
  const lines = [];

  for (const key of ["agent", "nightAgent"]) {
    if (!good(c[key])) continue;

    const staffed = Math.ceil(
      c[key] / (1 - factor)
    );

    const extra = staffed - c[key];

    total += extra * RATES[key];

    lines.push(
      `${NAMES[key]}: ${c[key]} → ` +
      `${staffed} FTE (+${extra})`
    );
  }

  if (!lines.length) {
    return ar
      ? "كم موظف دعم تريد احتساب التغطية الاحتياطية لهم؟"
      : "How many support agents need relief coverage?";
  }

  if (ar) {
    return `التكلفة الأساسية: ${usd(base.total)}/شهر

مع ${pct}% Shrinkage:

${lines.join("\n")}

الإجمالي التقديري: ${usd(total)}/شهر

الفرق ${usd(total - base.total)} تكلفة موظفين إضافيين، وليس رسماً مستقلاً.

يلزم تأكيد المناوبات.`;
  }

  return `Base cost: ${usd(base.total)}/month

With ${pct}% shrinkage:

${lines.join("\n")}

Estimated total: ${usd(total)}/month

Difference ${usd(total - base.total)} is additional staffing, not a separate fee.

Shifts require confirmation.`;
}

function resolveProposalScope(h) {
  const users = h
    .filter(x => x.role === "user")
    .map(x => x.content);

  let scope = null;

  for (const m of users) {
    const current = scopeOf(m);

    if (current?.kind === "247") {
      scope = {
        ...current,
        n: current.n || scope?.n || null,
        mode:
          current.mode ||
          (scope?.kind === "247"
            ? scope.mode
            : null)
      };
    } else if (current) {
      scope = current;
    } else if (scope?.kind === "247") {
      if (
        reConcurrent.test(m) &&
        !reTotal.test(m)
      ) {
        scope = {
          ...scope,
          mode: "concurrent",
          n: headcount(m) || scope.n
        };
      } else if (
        reTotal.test(m) &&
        !reConcurrent.test(m)
      ) {
        scope = {
          ...scope,
          mode: "total",
          n: headcount(m) || scope.n
        };
      }
    }
  }

  return scope;
}

function proposal(data, history) {
  const company = safe(data?.company);
  const email = safe(data?.email, 254);

  if (
    !data?.consent ||
    company.length < 2 ||
    !emailOK(email)
  ) {
    return {
      reply:
        "Please provide a valid company name, business email and consent.",
      proposalReady: false
    };
  }

  const scope = resolveProposalScope(history);
  const teamSize = Number(data?.teamSize);
  const coverage = String(data?.coverage || "unsure");
  const hasTeamSize = good(teamSize);

  let details =
    "Scope to be confirmed with the client.";

  let amount = null;
  let requiresReview = true;

  if (hasTeamSize && coverage === "247concurrent") {
    const p = coveragePlan(teamSize);
    details =
      `24/7 coverage requested: ${teamSize} agents online simultaneously.\n` +
      `Weekly coverage: ${p.hours.toLocaleString("en-US")} agent-hours.\n\n` +
      `INDICATIVE STAFFING:\n` +
      `• Standard-rate day coverage: ${p.day} FTE × $900 = ${usd(p.day * RATES.agent)}/month\n` +
      `• Night-shift coverage: ${p.night} FTE × $1,050 = ${usd(p.night * RATES.nightAgent)}/month\n` +
      `Indicative team: ${p.total} FTE.\n\n` +
      `Assumptions: 16 standard-rate / 8 night-rate hours per day, 40 paid hours/FTE/week, 25% shrinkage.\n` +
      `Final roster, customer time zone, night window and SLAs require confirmation; management and QA excluded.`;
    amount = p.cost;
    requiresReview = true;

  } else if (hasTeamSize && coverage === "247total") {
    details =
      `Requested team size from ScaleBridge: ${teamSize} total agents for 24/7 coverage. Day/night shift distribution and the final roster require confirmation; management and QA excluded.`;

  } else if (hasTeamSize && coverage === "night") {
    amount = teamSize * RATES.nightAgent;
    details =
      `Requested night-shift team from ScaleBridge: ${teamSize} agents.\n` +
      `${teamSize} Night Shift Agents x $1,050 = ${usd(amount)}\n` +
      `Base headcount only. Relief staffing and management excluded; shift hours require confirmation.`;
    requiresReview = true;

  } else if (hasTeamSize) {
    amount = teamSize * RATES.agent;
    details =
      `Requested team from ScaleBridge: ${teamSize} standard support agents.\n` +
      `${teamSize} Standard Support Agents x $900 = ${usd(amount)}\n` +
      `Base headcount only. Relief staffing and management excluded.`;
    requiresReview = coverage === "unsure";

  } else if (
    scope?.kind === "247" &&
    scope.n &&
    scope.mode === "concurrent"
  ) {
    const p = coveragePlan(scope.n);
    details =
      `24/7: ${scope.n} agents online simultaneously.\n` +
      `Weekly coverage: ${p.hours} agent-hours.\n` +
      `Illustrative staffing: ${p.day} standard-rate FTE x $900 = ${usd(p.day * RATES.agent)}; ` +
      `${p.night} night-rate FTE x $1,050 = ${usd(p.night * RATES.nightAgent)}.\n` +
      `Indicative team: ${p.total} FTE.\n` +
      `Assumptions: 16 standard-rate / 8 night-rate hours per day, 40 paid hours/FTE/week, 25% shrinkage.\n` +
      `Final roster, customer time zone, night window and SLAs require confirmation; management and QA excluded.`;
    amount = p.cost;
    requiresReview = true;

  } else if (scope?.kind === "247") {
    details =
      `24/7 inquiry: ${scope.n || "unspecified"} agents; ` +
      `simultaneous coverage versus total headcount ` +
      `requires confirmation.`;

  } else if (scope && !scope.ambiguous) {
    const q = quote(scope.counts);

    if (q.lines.length) {
      details =
        q.lines.join("\n") +
        "\nBase headcount only. Relief staffing " +
        "and management excluded.";

      amount = q.total;
      requiresReview = false;
    }

  } else if (scope?.ambiguous) {
    details =
      "Role quantities require clarification.";
  }

  const customRequested = history.some(x => x.role === 'user' && isUnpricedService(x.content));
  if (customRequested) {
    details += '\nCustom AI, annotation or moderation services are excluded and require a separate scoped quote.';
    requiresReview = true;
  }

  const text = `SCALEBRIDGE SOLUTIONS
PRELIMINARY PROPOSAL / INQUIRY

Prepared for: ${company}
Business email: ${email}

${details}

${amount === null
  ? "PRICE: Custom quote pending scope confirmation."
  : `ESTIMATED MONTHLY TOTAL: ${usd(amount)} USD`}

${requiresReview
  ? "STATUS: Indicative, nonbinding estimate subject to scope and roster validation."
  : "STATUS: Preliminary, nonbinding estimate."}

No automatic volume discounts or unrequested roles.

Operating hours, coverage, SLAs, software,
taxes, integrations and optional costs
require written confirmation.

Transparent Pricing. No Hidden Fees.

Contact: ${EMAIL}`;

  const displayText = text
    .replace(/^(Requested (?:team|night-shift team).*|Indicative team:.*|ESTIMATED MONTHLY TOTAL:.*)$/gm, "**$1**")
    .replace(/\$[\d,]+(?:\.\d+)?/g, "**  return {
    reply: text,
    proposalText: text,
    proposalReady: true,
    requiresReview
  };**");

  return {
    reply: displayText,
    proposalText: text,
    proposalReady: true,
    requiresReview
  };
}


function workloadEstimate(input) {
  if (!input || typeof input !== "object") return null;
  const channel = String(input.channel || "");
  const volume = Number(input.monthlyVolume);
  const aht = Number(input.ahtMinutes);
  const days = Number(input.workingDays);
  const hoursPerDay = Number(input.hoursPerDay);
  const occupancy = Number(input.occupancyPct);
  const shrink = Number(input.shrinkagePct);
  const valid = ["tickets", "email", "chat", "voice"].includes(channel) &&
    Number.isInteger(volume) && volume >= 1 && volume <= 10000000 &&
    Number.isFinite(aht) && aht >= 0.5 && aht <= 180 &&
    Number.isInteger(days) && days >= 1 && days <= 31 &&
    Number.isFinite(hoursPerDay) && hoursPerDay >= 1 && hoursPerDay <= 12 &&
    Number.isFinite(occupancy) && occupancy >= 50 && occupancy <= 90 &&
    Number.isFinite(shrink) && shrink >= 0 && shrink <= 45;
  if (!valid) return { error: "Please check workload inputs and allowed ranges." };
  const workloadHours = volume * aht / 60;
  const productiveHoursPerFte = days * hoursPerDay * (occupancy / 100) * (1 - shrink / 100);
  const fte = Math.ceil(workloadHours / productiveHoursPerFte);
  if (!Number.isSafeInteger(fte) || fte > 5000) return { error: "Volume exceeds supported estimation range. Request a custom workforce plan." };
  const cost = fte * RATES.agent;
  const needsReview = channel === "voice" || channel === "chat";
  const reason = channel === "voice"
    ? "Voice requires arrival patterns, peak intervals, target service level and an Erlang-based staffing review; monthly averages alone cannot validate queue coverage."
    : channel === "chat"
      ? "Live chat requires concurrency, arrival patterns, response-time targets and peak staffing validation."
      : "This is a workload-capacity estimate, not a shift roster or response-time SLA guarantee.";
  return { channel, volume, aht, days, hoursPerDay, occupancy, shrink, workloadHours, productiveHoursPerFte, fte, cost, needsReview, reason };
}

function workloadProposal(data, history) {
  const company = safe(data?.company);
  const email = safe(data?.email, 254);
  if (!data?.consent || company.length < 2 || !emailOK(email)) {
    return { reply: "Please provide a valid company name, business email and consent.", proposalReady: false };
  }
  const p = workloadEstimate(data.workload);
  if (!p || p.error) return { reply: p?.error || "Workload details are required.", proposalReady: false };
  const coverage = String(data.coverage || "unsure");
  const coverageReview = coverage === "247total" || coverage === "247concurrent" || coverage === "night";
  const text = [
    "SCALEBRIDGE SOLUTIONS",
    "WORKLOAD-BASED PRELIMINARY ASSESSMENT",
    "",
    "Prepared for: " + company,
    "Business email: " + email,
    "Channel: " + p.channel,
    "Monthly volume: " + p.volume.toLocaleString("en-US"),
    "Average handling time: " + p.aht + " minutes",
    "Estimated monthly handling workload: " + p.workloadHours.toFixed(1) + " hours",
    "Working days/month: " + p.days,
    "Paid hours/FTE/day: " + p.hoursPerDay,
    "Occupancy: " + p.occupancy + "%",
    "Shrinkage: " + p.shrink + "%",
    "Estimated productive capacity/FTE/month: " + p.productiveHoursPerFte.toFixed(1) + " hours",
    "Indicative workload-equivalent team: " + p.fte + " FTE",
    "Indicative workload-only base agent cost: " + usd(p.cost) + "/month at $900/FTE",
    "",
    "IMPORTANT: " + p.reason,
    coverageReview ? "Requested coverage requires a separate roster and shift-pricing review. The workload-only cost above is NOT a coverage quote." : "Coverage and staffing by interval require confirmation.",
    "This estimate excludes night premiums, management, QA, software, integrations, taxes and unpriced custom services.",
    "Do not treat the indicative cost as a final contractual quote.",
    "Client notes: " + safe(data.details, 1000),
    "Contact: " + EMAIL
  ].join("\n");
  return { reply: text, proposalText: text, proposalReady: true, requiresReview: true, workloadBased: true };
}

async function notify(
  env,
  subject,
  body,
  replyTo
) {
  if (
    !env.RESEND_API_KEY ||
    !env.NOTIFY_FROM_EMAIL
  ) {
    console.error(
      "Resend configuration missing",
      JSON.stringify({
        apiKeyConfigured: Boolean(env.RESEND_API_KEY),
        senderConfigured: Boolean(env.NOTIFY_FROM_EMAIL)
      })
    );
    return false;
  }

  const payload = {
    from: env.NOTIFY_FROM_EMAIL,
    to: [EMAIL],
    subject: subject.slice(0, 180),
    text: body.slice(0, 15000)
  };

  if (emailOK(replyTo)) {
    payload.reply_to = replyTo;
  }

  try {
    const r = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization:
            "Bearer " + env.RESEND_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    if (!r.ok) {
      console.error(
        "Resend status",
        r.status
      );
    }

    return r.ok;

  } catch (e) {
    console.error(
      "Resend delivery error",
      String(e)
    );

    return false;
  }
}

async function meeting(m, env) {
  const name = safe(m?.name);
  const company = safe(m?.company);
  const email = safe(m?.email, 254);
  const tz = safe(m?.timezone, 80);

  let validZone = false;

  try {
    new Intl.DateTimeFormat(
      "en-GB",
      { timeZone: tz }
    );

    validZone = true;
  } catch {}

  if (
    m?.website ||
    !m?.consent ||
    name.length < 2 ||
    company.length < 2 ||
    !emailOK(email) ||
    !Array.isArray(m?.slots) ||
    m.slots.length !== 3 ||
    !validZone
  ) {
    return {
      reply:
        "Please enter your details and three valid meeting times.",
      requestReceived: false
    };
  }

  const times = m.slots.map(s =>
    typeof s === "string" &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s)
      ? Date.parse(s)
      : NaN
  );

  const now = Date.now();

  if (
    times.some(t =>
      !Number.isFinite(t) ||
      t < now + 72 * 3600000 ||
      t > now + 120 * 86400000
    ) ||
    new Set(times).size !== 3
  ) {
    return {
      reply:
        "Choose three different times at least 72 hours ahead, within 120 days.",
      requestReceived: false
    };
  }

  const fmt = zone =>
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: zone,
        dateStyle: "full",
        timeStyle: "short"
      }
    );

  const local = fmt(tz);
  const germany = fmt("Europe/Berlin");

  const slots = times.map((t, i) =>
    `${i + 1}. ${local.format(t)} (${tz}) | ` +
    `Germany: ${germany.format(t)} | ` +
    `UTC: ${new Date(t).toISOString()}`
  );

  const body = `NEW MEETING REQUEST — NOT CONFIRMED

Name: ${name}
Company: ${company}
Email: ${email}

Preferred times:
${slots.join("\n")}

Please confirm one time and email a Google Meet link.`;

  const sent = await notify(
    env,
    "ScaleBridge | Meeting request | " + company,
    body,
    email
  );

  if (sent) {
    return {
      reply:
        "Thank you! We've received your three preferred meeting times. Our team will confirm one by email. Your meeting is not booked yet.",
      requestReceived: true
    };
  }

  return {
    reply:
      `Your request could not be delivered. Please email ${EMAIL}.`,
    requestReceived: false
  };
}

function headers(origin) {
  const allowed = [
    ORIGIN,
    "https://www.scalebridgesolutions.de"
  ];

  return {
    "Access-Control-Allow-Origin":
      allowed.includes(origin)
        ? origin
        : ORIGIN,

    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type",

    "Content-Type":
      "application/json; charset=utf-8",

    "Vary": "Origin"
  };
}

function json(data, status, origin) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: headers(origin)
    }
  );
}

function isUnpricedService(s) {
  return /\b(?:AI|automation|chatbot|bot\b|data annotation|content moderation|integration|software|setup|implementation)\b|الذكاء الاصطناعي|أتمتة|روبوت|تعليق البيانات|تصنيف البيانات|إشراف المحتوى|تكامل/i.test(s);
}

function asksOnlyUnpriced(s) {
  return isUnpricedService(s) &&
    rePrice.test(s) &&
    !/(?:\bagents?\b|\bFTE\b|موظف)/i.test(s);
}

export default {
  async fetch(request, env) {
    const origin =
      request.headers.get("Origin") || "";

    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: headers(origin)
      });
    }

    if (
      request.method === "GET" &&
      url.pathname === "/"
    ) {
      return json(
        {
          status: "ok",
          service: "ScaleBridge AI V19",
          aiConfigured: Boolean(env.AI),
          emailNotificationsConfigured: Boolean(env.RESEND_API_KEY && env.NOTIFY_FROM_EMAIL),
          shrinkageDefault: "25%"
        },
        200,
        origin
      );
    }

    if (url.pathname !== "/chat") {
      return json(
        { error: "Not found" },
        404,
        origin
      );
    }

    if (request.method !== "POST") {
      return json(
        { error: "Method not allowed" },
        405,
        origin
      );
    }

    if (
      origin &&
      ![
        ORIGIN,
        "https://www.scalebridgesolutions.de"
      ].includes(origin)
    ) {
      return json(
        { error: "Origin not allowed" },
        403,
        origin
      );
    }

    let body;

    try {
      const raw = await request.text();

      if (raw.length > 24000) {
        return json(
          { error: "Request too large" },
          413,
          origin
        );
      }

      body = JSON.parse(raw);

    } catch {
      return json(
        { error: "Invalid JSON" },
        400,
        origin
      );
    }

    const message =
      String(body?.message || "").trim();

    const history =
      cleanHistory(body?.history);

    if (message.length > 4000) {
      return json(
        { error: "Message too long" },
        400,
        origin
      );
    }

    try {

      // MEETING REQUEST

      if (body?.meeting) {
        return json(
          await meeting(body.meeting, env),
          200,
          origin
        );
      }

      // PRELIMINARY PROPOSAL

      if (body?.proposal) {
        const result = body.proposal.mode === 'workload'
          ? workloadProposal(body.proposal, history)
          : proposal(body.proposal, history);

        if (result.proposalReady) {
          result.notificationSent =
            await notify(
              env,
              "ScaleBridge | Preliminary proposal | " +
                safe(body.proposal.company),
              result.proposalText +
                "\n\nClient consent: Yes",
              safe(body.proposal.email, 254)
            );

          if (!result.notificationSent) {
            result.notificationMessage =
              "Proposal generated, but email notification failed. Please contact our team.";
          }
        }

        return json(result, 200, origin);
      }

      if (!message) {
        return json(
          { error: "Message required" },
          400,
          origin
        );
      }

      const current = scopeOf(message);
      const previous = latestScope(history);
      const arabic = isAr(message);

      const wantsAdvice =
        reAdvice.test(message);

      const wantsPrice =
        rePrice.test(message);

      const wantsShrink =
        reShrink.test(message);

      const coverage =
        resolve247(message, history);

      // CUSTOM SERVICE PRICING

      if (asksOnlyUnpriced(message)) {
        return json(
          {
            reply: arabic
              ? "تُسعّر هذه الخدمة حسب نطاق المشروع والتكاملات المطلوبة، ولا يوجد سعر شهري ثابت معتمد لها حالياً. هل ترغب في مناقشة المتطلبات للحصول على عرض مخصص؟"
              : "This service is priced according to project scope and required integrations. We do not have a published fixed monthly rate for it. Would you like a tailored quote?"
          },
          200,
          origin
        );
      }

      // SHRINKAGE CALCULATIONS

      if (wantsShrink) {
        return json(
          {
            reply: shrinkAnswer(
              coverage || current || previous,
              message
            )
          },
          200,
          origin
        );
      }

      // 24/7 COVERAGE CALCULATIONS

      if (coverage) {
        return json(
          {
            reply: coverageAnswer(
              coverage,
              arabic
            )
          },
          200,
          origin
        );
      }

      // STAFFING RECOMMENDATIONS

      if (wantsAdvice) {
        const n =
          current?.counts?.agent ||
          current?.counts?.nightAgent ||
          current?.n ||
          previous?.counts?.agent ||
          previous?.counts?.nightAgent ||
          previous?.n;

        let reply = structure(n, arabic);

        if (
          wantsPrice &&
          current &&
          current.kind !== "247"
        ) {
          reply +=
            "\n\n" +
            baseAnswer(current, arabic, isUnpricedService(message));
        }

        return json(
          { reply },
          200,
          origin
        );
      }

      // STANDARD ROLE PRICING

      if (
        current &&
        (
          current.kind === "roles" ||
          current.kind === "shift"
        ) &&
        wantsPrice
      ) {
        return json(
          {
            reply: baseAnswer(
              current,
              arabic,
              isUnpricedService(message)
            )
          },
          200,
          origin
        );
      }

      // PRICING FOLLOW-UP

      if (
        wantsPrice &&
        previous &&
        !isUnpricedService(message)
      ) {
        return json(
          {
            reply:
              previous.kind === "247"
                ? coverageAnswer(
                    previous,
                    arabic
                  )
                : baseAnswer(
                    previous,
                    arabic
                  )
          },
          200,
          origin
        );
      }

      // AI FALLBACK

      if (!env.AI) {
        return json(
          {
            reply: arabic
              ? `يسعدنا مساعدتك! تواصل مع فريق ScaleBridge عبر ${EMAIL}.`
              : `We're happy to help! Contact ${EMAIL}.`
          },
          200,
          origin
        );
      }

      const result = await env.AI.run(
        MODEL,
        {
          messages: [
            {
              role: "system",
              content: SYSTEM
            },
            ...history,
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 260,
          temperature: 0.15
        }
      );

      return json(
        {
          reply: String(
            result?.response ||
            (
              arabic
                ? "هل يمكنك توضيح طلبك قليلاً؟"
                : "Could you clarify your question?"
            )
          )
            .replace(/\*\*/g, "")
            .trim()
        },
        200,
        origin
      );

    } catch (e) {
      console.error(
        "ScaleBridge V16",
        String(e)
      );

      return json(
        {
          reply: isAr(message)
            ? `واجهنا مشكلة تقنية مؤقتة. تواصل معنا عبر ${EMAIL}.`
            : `A temporary technical issue occurred. Please contact ${EMAIL}.`
        },
        200,
        origin
      );
    }
  }
};

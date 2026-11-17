SCALEBRIDGE — DEPLOYMENT INSTRUCTIONS (17 NOV 2026)

GITHUB (replace these three files only):
- index.html
- styles.css
- chatbot.js
Do NOT delete logo.png, chatbot-additions.css, chatbot-mobile-fix.css or chatbot-mobile-fix.js.

CLOUDFLARE WORKERS:
- Replace your Worker source with worker.js from this ZIP, then deploy.
- Keep your existing Workers AI binding named AI.
- Configure a Resend account and VERIFY your sender domain.
- In Worker Settings > Variables and Secrets add secret RESEND_API_KEY (your actual key).
- Add variable NOTIFY_FROM_EMAIL (e.g. ScaleBridge <notifications@scalebridgesolutions.de>) ONLY after sender/domain is verified with Resend.
- The Worker sends notifications to info@scalebridgesolutions.de. No API key belongs in GitHub.
- Until both variables and sender verification are set, meeting requests will NOT be accepted as delivered; the site will show an email fallback. Proposal estimates still appear but notification failure is disclosed.

IMPORTANT:
- Meeting is a REQUEST, not a confirmed booking. Three preferred times are sent for manual confirmation and Google Meet link.
- Earliest requested slot is at least 72 hours ahead; maximum 120 days. Timezone is sent in client and Germany time.
- A verified sending service is needed for automatic email. No calendar account integration is required.
- Before public launch add rate limiting / Turnstile, privacy-policy and data-retention review for submitted contact details.
- Test email sending and mobile display after deploying.

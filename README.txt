SCALEBRIDGE CHATBOT — INSTALLATION

1. Back up the current GitHub repository.
2. Replace existing chatbot.js with this file.
3. Append chatbot-additions.css to the END of existing styles.css (do not replace styles.css).
4. Existing index.html chat markup can remain unchanged; chatbot.js updates it at runtime.
5. Until AI is configured, the widget works as a keyword-based interactive assistant and prepares a mailto proposal request; it does NOT automatically store leads.
6. For live AI: create a Cloudflare Worker with worker.js, bind Workers AI as AI, configure ALLOWED_ORIGIN = https://www.scalebridgesolutions.de, deploy, and test.
7. In index.html immediately BEFORE <script defer="" src="chatbot.js"></script>, insert:
   <script>window.SCALEBRIDGE_CHAT_API = 'https://YOUR-WORKER.workers.dev';</script>
8. Set worker CORS origin to the exact actual website origin (www vs non-www), test both mobile and desktop. Consider a custom subdomain and Cloudflare rate limiting / bot protection before launch. AI usage may incur fees.
9. The proposal form opens visitor's email client; the visitor must send the email. For automatic lead saving, a separate consent-aware server-side form and storage/notification integration must be configured and tested.
10. Review your website's privacy notice before activating AI or collecting leads. Do not send sensitive customer data to a model without appropriate agreements and data-transfer review.
11. Update website copy that currently says 'Start from one agent' and 'guided demo' to align with the 5-agent standard minimum and AI status. This bundle does not overwrite the main website layout.

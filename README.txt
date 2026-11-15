ScaleBridge Chat Mobile Fix

1. Upload chatbot-mobile-fix.css and chatbot-mobile-fix.js to the ROOT of your GitHub Pages repository (same folder as index.html).
2. Edit index.html:
   In <head>, add just before </head>:
   <link rel="stylesheet" href="chatbot-mobile-fix.css">
   Before </body>, immediately AFTER <script defer="" src="chatbot.js"></script>, add:
   <script defer src="chatbot-mobile-fix.js"></script>
3. Commit, wait for GitHub Pages to deploy, and refresh the site.
4. Test Arabic, English, long messages, Enter to send, Shift+Enter for a newline, and the proposal form.

This patch changes only the chat UI. It does not enable Cloudflare AI or automatic lead saving.

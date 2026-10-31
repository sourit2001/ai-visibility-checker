# Mentioned (provisional name; was GEO Lite)
Keyword-test landing page: a free AI visibility checker for websites. Audience: founders and small businesses who want AI assistants to recommend them. No "GEO" jargon in headings; plain buyer phrasing.

How the check works (no backend, no API cost): the page builds 3 buyer questions + 1 "does the AI know you" question from the user's category, audience, brand and optional competitor, and opens each in ChatGPT (chatgpt.com/?hints=search&q=), Perplexity (perplexity.ai/search?q=) and Google AI Mode (google.com/search?udm=50&q=). The user marks Named first / Named / Not named; score = 100/60/0 averaged. Inputs and marks stay in localStorage. Waitlist for automatic weekly checks: set WAITLIST_ENDPOINT in dist/app.js (Formspree/Tally); empty falls back to mailto.

Target keywords (autocomplete-verified Oct 2026): ai visibility checker (for website), ai brand visibility checker, ai visibility score, how to check if chatgpt mentions my brand, how to get your brand mentioned / business cited by chatgpt, best ai search optimization tools, ai search monitoring / tracking tools. Also covered: how to show up in chatgpt, rank in ai search, appear in google ai overviews, does chatgpt know my business.

Before launch: replace https://sourit2001.github.io/ai-visibility-checker and hello@mentioned.example everywhere in dist/. Never present sample answers as live data.

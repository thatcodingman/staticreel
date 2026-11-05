# AdSense readiness checklist for staticreel.com (Nov 4, 2026)

## Done in this update
- Privacy policy rewritten: discloses Google Analytics, Google AdSense and advertising cookies, opt-out links, EEA/UK consent, CCPA rights, children, contact. The old one said "no advertising cookies", which would have been wrong with ads.
- Terms: added an advertising / external links section.
- About: rewritten (removed "early build" and "coming next"), explains sourcing labels, corrections, funding.
- Contact page created (hello@staticreel.com). CONFIRM this mailbox receives mail before applying.
- Footer text "homepage concept, interactive preview" replaced with "independent streaming-changes tracker"; footer links now include About, Contact.

## Still needed (needs files or your account)
1. Footer and nav on index.html and the generated pages (build-seo.js): add About / Contact / Privacy / Terms links and remove "concept" wording. Needs current index.html and build-seo.js.
2. Content depth. AdSense rejects "low value content". Today most pages are templated lists. Add original written content: a /blog/ section with weekly posts, plus a short intro paragraph on guide pages. Aim for 15-20 substantial posts before applying.
3. Consent banner. In AdSense, go to Privacy & messaging and turn on the Google-certified consent message for EEA/UK/Switzerland. No code needed beyond the AdSense snippet.
4. AdSense account: add site, paste the AdSense snippet into <head> of every page (build-seo.js template + index.html + legal pages), wait for review.
5. ads.txt: after approval, create /ads.txt with: google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
   (use your own publisher ID).
6. Traffic and indexing: get pages indexed in Google Search Console first. Reviewers want a live, navigable site with real visitors.
7. Do not click your own ads, and do not place ads on pages with no content (legal pages, error pages).

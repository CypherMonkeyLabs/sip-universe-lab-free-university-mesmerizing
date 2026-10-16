# SIP signature kit

This lab copies the Webex university chrome and retargets it to SIP.

## Brand links

Only these three belong in the chrome:

- https://cyphermonkeylabs.com
- https://github.com/CypherMonkeyLabs
- https://linktr.ee/cyphermonkey

Contact is https://cyphermonkeylabs.com/#contact

## What was copied

`assets/css/frame.css`, `wow.css`, `footer.css`, `assets/js/frame.js`, `university.js`, `phone-nav.js`, `onboard.js`, `polish.js`, `guide/`, `sw.js`, `scripts/gzip-static.mjs`.

`node scripts/build-university.mjs` rebuilds rooms from `campus/data`.

Sibling labs checked on 2026-10: https://cyphermonkeylabs.com/<repo>/ returned HTTP 200 and is the linked host. https://cyphermonkeylabs.github.io/<repo>/ returned 301 to that host. https://cipher0x9.github.io/<repo>/ returned 404, so it is not used as a live link.

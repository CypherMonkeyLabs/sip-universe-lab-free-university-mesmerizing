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

Sibling labs that returned HTTP 200 on 2026-10 use https://cyphermonkeylabs.github.io/<repo>/. https://cipher0x9.github.io/<repo>/ returned 404 that day, so those URLs are not used as live links.

# What is the font asset directory for?
This is where fonts hosted on the app server would go. Hopefully, this remains empty:

1. Recommend using svgs over icon fonts. Either way, inline if http 1.1 and otherwise sensible.
2. Use web fonts where possible and [precache those assets](/src/application/client/sw/assets.js) in service worker. You may have to [source the web font URIs from CSS](/src/build/service-worker.js) - This project uses [cannibalizr](https://github.com/localnerve/cannibalizr) for this.

/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Install activate message handler for this code's concerns.
 *
 * TODO: maintain IndexedDB too.
 * This is tricky because:
 * 1. sw/index uses idb immediately to setup routes on startup.
 * 2. activate will occur after startup.
 */
/* global self, Promise, caches */
'use strict';

var toolbox = require('sw-toolbox');
var cacheId = require('./data').cacheId;
var debug = require('./utils/debug')('activate');

/**
 * Remove any previous cache that might have been under this code's governance.
 * Relies on how cacheName is constructed in index.js
 *
 * Previous caches are identified using the following:
 * 1. starts with cacheId
 * 2. contains the current scope.
 * 3. does not end with the 'inactive$$$'.
 * 4. is not exactly the current sw-toolbox cacheName
 */
self.addEventListener('activate', function (event) {
  debug('activate event fired, scope: ', toolbox.options.scope);

  if (!toolbox.options.scope) {
    return debug('Unable to determine cache scope, no action taken');
  }

  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName.indexOf(cacheId) === 0 &&
              cacheName.indexOf(toolbox.options.scope) > -1 &&
              !/inactive\${3}$/i.test(cacheName) &&
              cacheName !== toolbox.options.cache.name
          ) {
            debug('deleting old cache ', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

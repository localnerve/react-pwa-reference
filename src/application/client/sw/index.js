/***
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Entry point for the service worker.
 *
 * The 'precache' and 'sw/data' modules are generated by the build.
 * @see src/build/service-worker.js
 */
/*eslint no-console:0 */
import './precache';
import toolbox from 'sw-toolbox';
import data from 'sw/data';
import debugLib from 'sw/utils/debug';
import { initCommand, initData } from './init';
import { setupAssetRequests } from './assets';
import './activate';
import './push';
import './messages';

const dataManifest = data.manifest || {
  debug: false,
  cacheId: 'app'
};

toolbox.options.debug = dataManifest.debug;

// Construct cache name and save scope.
// Relies on sw-toolbox default name format for scope.
// CacheId must always start name.
const m = toolbox.options.cache.name.match(/([^$]+)\${3}$/);
toolbox.options.scope = m && m[1];
toolbox.options.cache.name = dataManifest.cacheId + '-' +
  toolbox.options.cache.name;

const debug = debugLib('index');

// Setup non-project static asset precaching (cdn requests)
setupAssetRequests();

// If all initData exists (and service-worker is starting), run the init command.
// The init message may never come if service-worker was restarted by the system.
const initPromise = initData()
  .then((payload) => {
    payload.startup = true;
    return initCommand(payload, (res) => {
      if (res.error) {
        console.error('startup init command failed', res.error);
      }
    });
  })
  .catch((error) => {
    debug('startup not running init command', error);
  })
  .then(() => {
    // Successful or not, we're done and don't want to impede other fetch
    // handlers.
    toolbox.router.default = null;
  });

// #43, Setup a temporary default handler for async startup needs.
toolbox.router.default =
  /**
   * The toolbox routes are not setup until the init command installs
   * the dynamic routes. Setup a default handler until init completes.
   *
   * @param {Request} request - The fetch event request object.
   * @returns {Promise} Resolves to a Response or a Network Error.
   */
  function defaultHandler (request) {
    return initPromise.then(() => {
      debug('defaultHandler request ', request.url);

      // Since init complete, get the handler.
      const handler = toolbox.router.match(request);
      if (handler) {
        debug('defaultHandler successfully handled ', request.url);
        return handler(request);
      }

      debug('defaultHandler could not handle ', request);
    });
  };

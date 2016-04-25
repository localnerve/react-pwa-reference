/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * A heavily modified serviceWorker registration script originally from Google.
 * This module is the entry point for an sw-reg bundle.
 *
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*eslint no-console:0 */
/* global document, window */

if ('serviceWorker' in window.navigator &&
    // See http://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features
    (window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname.indexOf('127.') === 0)) {
  // this, and named things like it are not leaking globally because this
  // file is built as a module.
  const serviceWorkerContainer = window.navigator.serviceWorker;

  // Pull the name of the service worker script from the data-service-worker attribute
  const serviceWorkerScript = document.currentScript.dataset.serviceWorker;

  /**
   * When DOMContentLoaded and serviceWorkerContainer is ready,
   * send the init event to transfer the initial flux store state to the service worker.
   * The flux store state contains config and data from the data backend.
   *
   * Since the flux store state comes from the server on each server side render,
   * we wait until DOMContentLoaded to ensure the state is available to transfer.
   */
  document.addEventListener('DOMContentLoaded', function contentReady () {
    document.removeEventListener('DOMContentLoaded', contentReady);
    // Now, its safe to get app state from the DOM.

    const timestamp = window.App.timestamp;
    const stores = JSON.parse(
      JSON.stringify(window.App.context.dispatcher.stores)
    );
    const apis = {};
    const fetchrPlugin = JSON.parse(
      JSON.stringify(window.App.context.plugins.FetchrPlugin)
    );

    apis[fetchrPlugin.xhrPath] = fetchrPlugin;

    /**
     * When the ServiceWorkerContainer is ready, send the init message
     * to the active worker. The message payload contains the latest store data
     * directly from the server. This gives whomever is in
     * charge a chance to update the cache with the latest info.
     * See https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-ready-attribute
     */
    serviceWorkerContainer.ready.then((registration) => {
      const messages = require('utils/messages');

      messages.workerSendMessage({
        command: 'init',
        payload: {
          stores: stores,
          apis: apis,
          timestamp: timestamp
        }
      }, registration.active).then(() => {
        console.log('[sw-reg] Successfully sent init to worker');
      }).catch((error) => {
        console.error('[sw-reg] Failed to send init to worker:', error);
      });
    });
  });

  // Your service-worker.js *must* be located at the top-level directory relative to your site.
  // It won't be able to control pages unless it's located at the same level or higher than them.
  // *Don't* register service worker file in, e.g., a scripts/ sub-directory!
  // See https://github.com/slightlyoff/ServiceWorker/issues/468
  serviceWorkerContainer.register(serviceWorkerScript, {
    scope: './'
  }).then((registration) => {
    /**
     * updatefound is fired if service-worker.js changes.
     */
    registration.onupdatefound = () => {
      // The updatefound event implies that registration.installing is set; see
      // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
      const installingWorker = registration.installing;

      /**
       * onstatechange is fired when installation state changes
       */
      installingWorker.onstatechange = () => {
        const msgPayload = {
          command: 'notify',
          show: true,
          time: 3000
        };

        switch (installingWorker.state) {
          case 'installed':
            if (serviceWorkerContainer.controller) {
              // At this point, the old content will have been purged and the fresh content will
              // have been added to the cache.
              // It's the perfect time to display a "New content is available; please refresh."
              // message in the page's interface.
              console.log('[sw-reg] New or updated content is available.');
              msgPayload.message = 'New content is available. Please refresh.';
              window.postMessage(msgPayload, window.location.origin);
            } else {
              // At this point, everything has been precached, but the service worker is not
              // controlling the page. The service worker will not take control until the next
              // reload or navigation to a page under the registered scope.
              // It's the perfect time to display a "Content is cached for offline use." message.
              console.log('[sw-reg] Content is cached, and will be available for offline use the ' +
                          'next time the page is loaded.');
              msgPayload.message = 'Content is cached for offline use.';
              window.postMessage(msgPayload, window.location.origin);
            }
            break;

          case 'redundant':
            console.error('[sw-reg] The installing service worker became redundant.');
            break;
        }
      };
    };
  }).catch((e) => {
    console.error('[sw-reg] Error during service worker registration:', e);
  });
}

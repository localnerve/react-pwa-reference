/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/*eslint no-console:0 */
import swPrecache from 'sw-precache';
import cannibalizr from 'cannibalizr';

/**
 * Factory for the serviceWorker task.
 * Prepares for service worker bundling by generating code.
 *
 * @param {Object} settings - The project settings.
 * @param {Boolean} prod - True for production, false otherwise.
 * @param {Boolean} debug - True to include debug info, false otherwise.
 * @returns {Function} The serviceWorker task.
 */
export default function serviceWorkerTaskFactory (settings, prod, debug) {
  return function serviceWorker (done) {
    settings.pkgInfo((err, pkg) => {
      if (err) {
        return done(err);
      }

      // Ugh. Use source code as a data source for service worker.
      cannibalizr({
        output: {
          file: settings.src.serviceWorker.data,
          manifest: {
            cacheId: pkg.name,
            version: pkg.version,
            pushNotificationIcon:
              settings.web.assets.revAsset('android-chrome-192x192.png'),
            debug: debug
          }
        },
        input: {
          assets: [{
            file: `${settings.src.styles}/_fonts.scss`,
            captures: [{
              global: true,
              matchIndex: 1,
              re: /url\(([^\)]+)\)/ig
            }]
          }]
        },
        logger: console.log
      });

      // Write the sw-precache script.
      swPrecache.write(settings.src.serviceWorker.precache, {
        logger: console.log,
        debug: debug,
        verbose: true,
        cacheId: pkg.name,
        handleFetch: prod,
        directoryIndex: false,
        stripPrefix: settings.dist.baseDir,
        replacePrefix: settings.web.baseDir,
        staticFileGlobs: [
          `${settings.dist.fonts}/**.*`,
          // in this project, photos are only served via image service
          `${settings.dist.images}/**.!(jpg|jpeg)`,
          // precache all scripts except those that are inlined
          `${settings.dist.scripts}/!(header|inline).*`,
          // precache all styles except those that are inlined
          `${settings.dist.styles}/!(index|inline).*`
        ]
      }, done);
    });
  };
}

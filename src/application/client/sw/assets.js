/***
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Precaching and route installs for non-project (cdn) assets.
 * The 'sw/data' module is generated by the build @see src/build/service-worker.
 */
import toolbox from 'sw-toolbox';
import urlm from 'utils/urls';
import data from 'sw/data';

/**
 * Install route GET handlers for CDN requests and precache assets.
 *
 * Route handlers for CDN requests are installed everytime as a side effect
 * of setting up precaching. However, precaching is only carried out as a result
 * of an 'install' event (not everytime).
 *
 * @see sw-toolbox
 */
export function setupAssetRequests () {
  let hostname;

  toolbox.precache(
    data.assets
      .sort()
      .map(function (asset) {
        const next = urlm.getHostname(asset);

        if (hostname !== next) {
          hostname = next;
          // New hostname, so install GET handler for that host
          toolbox.router.get('*', toolbox.networkFirst, {
            origin: hostname,
            // any/all CDNs get 3 seconds max
            networkTimeoutSeconds: 3
          });
        }

        // Precache the asset in 'install'
        return asset;
      })
  );
}

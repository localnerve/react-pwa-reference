/***
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Rewrite middleware.
 */
import rewrite from 'connect-modrewrite';

/**
 * Basic rewrite rules.
 *
 * @param {Object} settings - The application config settings.
 * @returns {Function} Basic rewrite middleware.
 */
export function rewriteBasics (settings) {
  const rewriteRules = [
    // rewrite root image requests to settings.web.images
    '^/([^\\/]+\\.(?:png|jpg|jpeg|webp|ico|svg|gif)(?:\\?.*)?$) ' +
      settings.web.images + '/$1 [NC L]',
    // alias home to root
    '^/home/?$ / [L]',
    // forbid 404 and 500 direct requests
    '^/(?:404|500)/?$ [F L]'
  ];

  return rewrite(rewriteRules);
}

/**
 * Transforms root /sw.js request to the actual asset location.
 * In addition, handle sw source map.
 * Service worker rewrites delayed so assets.json not required on app start.
 *
 * @param {Object} settings - The application config settings.
 * @returns {Function} Service Worker rewrite middleware.
 */
export function rewriteServiceWorker (settings) {
  return function applyServiceWorkerRewrite (req, res, next) {
    const swRule = new RegExp(
      '^(/' + settings.web.assets.swMainScript(true) + ')$', 'i'
    );

    if (swRule.test(req.url)) {
      req.url = req.url.replace(swRule, settings.web.assets.swMainScript());
    } else {
      let reSourceMap = new RegExp(
        '^(/' + settings.web.assets.swMainScriptMap(true) + ')$', 'i'
      );
      if (reSourceMap.test(req.url)) {
        req.url = req.url.replace(reSourceMap, settings.web.assets.swMainScriptMap());
      }
    }
    next();
  };
}

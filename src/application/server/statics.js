/***
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * static asset serving middleware.
 */
import glob from 'glob';
import express from 'express';

/**
 * Use simple static with far future expires.
 * If not found, check to see if a distinct, different version exists that would
 * satisfy the request. If so, serve that.
 * Expects to be mounted on settings.web.baseDir.
 *
 * @param {Object} settings - The application config settings.
 * @returns {Function} serveStatic middleware.
 */
export default function statics (settings) {
  const serveStatic = express.static(
    settings.dist.baseDir, { maxAge: settings.web.assetAge }
  );

  return function serveStaticAsset (req, res, next) {
    serveStatic(req, res, (err) => {
      if (err) {
        return next(err);
      }
      // If a newer version exists, rewrite and serve that.
      const urlMatch = req.url.replace(/[a-f0-9]+\./, '*.');
      glob(settings.dist.baseDir + urlMatch, {
        silent: true
      }, (matchError, matches) => {
        if (matchError || matches.length !== 1) {
          return next();
        }
        req.url = matches[0].replace(settings.dist.baseDir, '');
        return serveStatic(req, res, next);
      });
    });
  };
}

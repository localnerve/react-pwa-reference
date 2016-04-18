/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Handle robots request.
 * Dynamically create allowed urls from mainNav routes.
 * Reads a robots.txt template and replaces SITEMAPURL and ALLOWURLS.
 *
 * Reminder: There is a compression minimum threshold below which no compression
 *   occurs.
 */
/* global Promise */
import debugLib from 'debug';
import fs from 'fs';
import urlLib from 'url';
import utils from '../utils';
import serviceData from '../services/data';
import configs from '../configs';

const debug = debugLib('server:robots');

const config = configs.create({
  baseDir: '..'
});
const settings = config.settings;

/**
 * Handle requests for robots.txt.
 *
 * @param {Object} req - The request object, not used.
 * @param {Object} res - The response object.
 * @param {Object} next - The next object.
 */
export default function robots (req, res, next) {
  debug('Read routes and robots template ', settings.dist.robotsTemplate);

  Promise.all([
    utils.nodeCall(serviceData.fetch, {
      resource: config.data.FRED.mainResource
    }),

    utils.nodeCall(fs.readFile, settings.dist.robotsTemplate, {
      encoding: 'utf8'
    })
  ])
  .then(function (results) {
    const robotsTemplate = results[1],
      routes = results[0].content;
    let robotsContent;

    debug('Got template', robotsTemplate);

    robotsContent = robotsTemplate
      .replace(/(SITEMAPURL)/i, () => {
        var ssl = settings.web.sslRemote || settings.web.ssl;

        return urlLib.format({
          protocol: ssl ? 'https' : 'http',
          hostname: settings.web.appHostname,
          pathname: settings.web.sitemap
        });
      })
      .replace(/(ALLOWURLS)/i, () => {
        return Object.keys(routes)
          .filter((key) => {
            return routes[key].mainNav;
          })
          .map((key) => {
            return 'Allow: ' + routes[key].path;
          })
          .join('\n');
      });

    res.header('Content-Type', 'text/plain');
    res.send(robotsContent);
  })
  .catch((err) => {
    debug('Request failed: ', err);
    err.status = err.statusCode = (err.statusCode || err.status || 500);
    next(err);
  });
}

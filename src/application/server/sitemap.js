/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Handle sitemap request.
 *
 * Reminder: There is a compression minimum threshold below which no compression
 *   occurs.
 */
import debugLib from 'debug';
import urlLib from 'url';
import sitemapLib from 'sitemap-xml';
import utils from 'utils';
import configs from 'configs';
import serviceData from './services/data';

const debug = debugLib('server:sitemap');

const config = configs.create({
  baseDir: '..'
});
const settings = config.settings;

/**
 * Handle requests for sitemap.xml.
 *
 * @param {Object} req - The request object, not used.
 * @param {Object} res - The response object.
 * @param {Object} next - The next object.
 */
export default function sitemap (req, res, next) {
  debug('Read routes');

  utils.nodeCall(serviceData.fetch, {
    resource: config.data.FRED.mainResource
  })
  .then((result) => {
    const routes = result.content,
      ssl = settings.web.ssl || settings.web.sslRemote,
      stream = sitemapLib();

    res.header('Content-Type', 'text/xml');
    stream.pipe(res);

    Object.keys(routes)
      .filter((key) => {
        return routes[key].mainNav;
      })
      .forEach((key) => {
        stream.write({
          loc: urlLib.format({
            protocol: ssl ? 'https' : 'http',
            hostname: settings.web.appHostname,
            pathname: routes[key].path
          }),
          priority: routes[key].siteMeta ?
            routes[key].siteMeta.priority : 1.0,
          changefreq: routes[key].siteMeta ?
            routes[key].siteMeta.changefreq : 'monthly'
        });
      });

    stream.end();
  })
  .catch((err) => {
    debug('Request failed: ', err);
    err.status = err.statusCode = (err.statusCode || err.status || 500);
    next(err);
  });
}

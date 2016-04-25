/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Creates an Express application, the middleware stack,
 * registers the app services, initializes the data layer, and binds to a port.
 */
/*eslint no-console:0 */
import express from 'express';
import favicon from 'serve-favicon';
import compress from 'compression';
import logger from 'morgan';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import errorHandler from 'express-error-handler';
import rewrite from 'connect-modrewrite';
import https from 'https';
import http from 'http';
import configs from 'configs';
import fluxibleApp from 'application/app';
import main from './main';
import robots from './robots';
import sitemap from './sitemap';
import servicesData from './services/data';
import servicesRoutes from './services/routes';
import servicesPage from './services/page';
import servicesContact from './services/contact';
import servicesSubscription from './services/subscription';
import servicesPush from './services/push';

const config = configs.create();
const settings = config.settings;
const protocol = settings.web.ssl ? https : http;
const rewriteRules = [
  // rewrite root image requests to settings.web.images
  '^/([^\\/]+\\.(?:png|jpg|jpeg|webp|ico|svg|gif)(?:\\?.*)?$) ' +
    settings.web.images + '/$1 [NC L]',
  // alias home to root
  '^/home/?$ / [L]',
  // forbid 404 and 500 direct requests
  '^/(?:404|500)/?$ [F L]'
];
const app = express();
const server = protocol.createServer(app);

app.use(favicon(settings.dist.favicon));
app.use(logger(settings.loggerFormat));
app.use(compress());
app.use(errorHandler.maintenance());

// Handle special requests
app.use(rewrite(rewriteRules));
// Service worker rewrites delayed so assets.json not required on app start.
app.use((req, res, next) => {
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
});

// Serve cached statics
app.use(settings.web.baseDir, express.static(
  settings.dist.baseDir, { maxAge: settings.web.assetAge }
));

// Setup security
app.use(cookieParser({
  httpOnly: true,
  secure: settings.web.ssl
}));
app.use(bodyParser.json());
app.use(csrf({ cookie: true }));

// Register services, handle service requests
var fetchrPlugin = fluxibleApp.getPlugin('FetchrPlugin');
fetchrPlugin.registerService(servicesRoutes);
fetchrPlugin.registerService(servicesPage);
fetchrPlugin.registerService(servicesContact);
fetchrPlugin.registerService(servicesSubscription);
fetchrPlugin.registerService(servicesPush);
app.use(fetchrPlugin.getXhrPath(), fetchrPlugin.getMiddleware());

// Handle robots.txt
app.get(settings.web.robots, robots);

// Handle sitemap.xml
app.get(settings.web.sitemap, sitemap);

// Every other request gets the app bootstrap
app.use(main(fluxibleApp));

// Handle all errors
app.use(errorHandler({
  server: server,
  static: {
    // This 'hard' 500 will cause a restart.
    // Actually covers all 500s except for 503 via errorHandler.
    // The PM in charge should be configured to notify dev on restarts.
    '500': settings.dist.five00,
    // The notice for maintenance mode.
    '503': settings.dist.five03
  }
}));

// Initialize the data layer and start the server.
servicesData.initialize((err) => {
  if (err) {
    throw err;
  }
  server.listen(config.PORT, () => {
    console.log(`Listening on port ${config.PORT}`);
  });
});

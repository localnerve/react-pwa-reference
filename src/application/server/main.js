/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise */
import debugLib from 'debug';
import fs from 'fs';
import serialize from 'serialize-javascript';
import React from 'react';
import ReactDOM from 'react-dom/server';
import { navigateAction } from 'fluxible-router';
import { createElementWithContext as createElement } from 'fluxible-addons-react';
import utils from 'utils';
import nodeUtils from 'utils/node';
import configs from 'configs';
import html from 'application/components/Html';
import routesAction from 'application/actions/routes';
import initAction from 'application/actions/init';

const debug = debugLib('server:main');

const HtmlComponent = React.createFactory(html);
const config = configs.create();
const settings = config.settings;

/**
 * Render the full application with props and send the response.
 *
 * @param {Object} req - The Request object.
 * @param {Object} res - The Response object.
 * @param {Object} context - The fluxible application context.
 * @param {Object} app - The fluxible app.
 * @param {Object} props - The already accumulated props object.
 */
function renderApp (req, res, context, app, props) {
  const clientSideRenderOnly = req.query.render === '0';
  let state;

  props.mainScript = settings.web.assets.mainScript();
  props.revAsset = settings.web.assets.revAsset.bind(settings.web.assets);
  props.trackingSnippet = config.analytics.snippet;
  props.browserConfig = settings.web.browserConfig;
  props.appManifest = settings.web.appManifest;
  props.otherStyles = settings.web.css.other;
  props.swRegistrationScript = settings.web.assets.swRegScript();
  props.swMainScript = '/' + settings.web.assets.swMainScript(true);

  debug('Creating app state');
  state = app.dehydrate(context);
  state.analytics = config.analytics.globalRef;
  state.timestamp = Date.now();
  props.state = `window.App=${serialize(state)};`;

  if (clientSideRenderOnly) {
    debug('NOT Rendering app component');
    props.markup = '';
  } else {
    debug('Rendering app component into html');
    props.markup = ReactDOM.renderToString(createElement(context));
  }

  props.context = context.getComponentContext();

  debug('Rendering html');
  res.send('<!DOCTYPE html>' +
    ReactDOM.renderToStaticMarkup(HtmlComponent(props))
  );
}

/**
 * Create the main bootstrapping route of the application.
 *
 * @param {Object} app - The fluxible app.
 * @returns {Function} The main bootstraping application middleware.
 */
export default function bootstrap (app) {
  /**
   * The main application middleware.
   * Gathers the props and state for the application, renders it,
   *  and sends the response.
   * Triggers 500 response if there is an error gathering the props and creating
   *  the application state.
   *
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {Object} next - The next object.
   */
  return function main (req, res, next) {
    let routes;
    const renderProps = {};

    debug('Creating app context');
    const context = app.createContext({
      req: req, // The fetchr plugin depends on this
      xhrContext: {
        _csrf: req.csrfToken() // Make sure all XHR requests have the CSRF token
      }
    });

    debug('Executing routes action');
    context
      .executeAction(routesAction, {
        resource: config.data.FRED.mainResource
      })
      .then((routesResult) => {
        routes = routesResult;
        debug('Executing init action');
        return context.executeAction(initAction, {
          backgrounds: {
            serviceUrl: config.images.service.url(),
            serviceOptions: {
              origin: {
                host: settings.web.assetHost,
                ssl: settings.web.ssl,
                path: settings.web.images
              },
              cloudName: config.images.service.cloudName()
            },
            currentBackground: routes[config.data.defaults.pageName].background,
            backgrounds: Object.keys(routes).map((route) => {
              return routes[route].background;
            })
          },
          page: {
            defaultPageName: config.data.defaults.pageName
          }
        });
      })
      .then(() => {
        debug('Prefetching priority 0 route content');
        return Promise.all(Object.keys(routes).map((route) => {
          if (routes[route].priority === 0) {
            debug('execute 0 route', routes[route]);
            return context.executeAction(routes[route].action, {});
          }
          return Promise.resolve();
        }));
      })
      .then(() => {
        debug('Executing navigate action');
        return context.executeAction(navigateAction, {
          url: req.url
        });
      })
      .then(null, (reason) => {
        debug('Navigate failure reason: ' +
          require('util').inspect(reason, { depth: null }));
        res.status(reason.statusCode);
        return context.executeAction(
          routes[utils.conformErrorStatus(reason.statusCode)].action, {}
        );
      })
      .then(() => {
        debug(`Reading the inline styles from ${settings.dist.css.inline}`);
        return nodeUtils.nodeCall(fs.readFile, settings.dist.css.inline, {
          encoding: 'utf8'
        });
      })
      .then((inlineStyles) => {
        renderProps.inlineStyles = inlineStyles;
        debug(`Reading the inline scripts from ${settings.dist.inlineScript}`);
        return nodeUtils.nodeCall(fs.readFile, settings.dist.inlineScript, {
          encoding: 'utf8'
        });
      })
      .then((inlineScript) => {
        renderProps.inlineScript = inlineScript;
        debug('Rendering the application');
        renderApp(req, res, context, app, renderProps);
      })
      .catch((err) => {
        debug('bootstrap main route failed');
        err.status = err.statusCode = 500;
        next(err);
      });
  };
}

/***
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * The client-side entry point.
 */
/* global document, window, DEBUG */
import debugLib from 'debug';
import React from 'react';
import { render } from 'react-dom';
import { createElementWithContext } from 'fluxible-addons-react';
import app from 'application/app';

/**
 * This is assigned to window.AppMain via webpack.
 */
export default function main () {
  if (DEBUG) {
    window.React = React; // for chrome dev tool support
    debugLib.enable('*'); // show debug trail
  }

  const debug = debugLib('client');
  const dehydratedState = window.App; // sent from the server

  debug('rehydrating app');
  app.rehydrate(dehydratedState, (err, context) => {
    if (err) {
      throw err;
    }

    if (DEBUG) {
      window.context = context;
    }

    debug('rendering app');
    render(
      createElementWithContext(context, {
        analytics: dehydratedState.analytics
      }),
      document.getElementById('application')
    );
  });
}

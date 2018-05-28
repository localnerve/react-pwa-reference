/***
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * The inline javascript, small, run first.
 *
 * This is the source of the built asset, not the asset itself.
 * This is an entry module, so there are no global concerns here.
 * You might save a couple bytes by reverting this to es5 (should that arise).
 */
/* eslint-disable no-console */
/* global window, document, Promise */

import FontFaceObserver from 'fontfaceobserver';
import { loadCSS } from 'fg-loadcss';

const docEl = document.documentElement;

// --------------------------------------------------
// js happens
//
docEl.className = docEl.className.replace('no-js', '');

// --------------------------------------------------
// Polyfill and main load script
//
const polyfills = document.currentScript.dataset.polyfills;
const polyfillHost = document.currentScript.dataset.polyfillHost;
const urls = [
  `https://${polyfillHost}/v2/polyfill.js?features=${polyfills}`,
  document.currentScript.dataset.mainScript // main is last
];

function load (s, url) {
  s.onload = function () {
    if (++load.count === urls.length) { // if last (main), run it
      window.AppMain(); // Assigned in webpack main client entry
    }
  };
  s.onerror = function () {
    load.count++;
    console.warn('polyfill failure');
  }
  s.setAttribute('async', true);
  s.setAttribute('defer', true);
  s.setAttribute('src', url);
  document.head.appendChild(s);
}
load.count = 0;

for (let i = 0; i < urls.length; i++) {
  load(
    document.createElement('script'),
    urls[i]
  );
}

// --------------------------------------------------
// Fontface observer to quickly load fonts.
// Relies on Promise - Don't wait for polyfill, start now (if possible)
//
if (Promise) {
  const font = new FontFaceObserver('Source Sans Pro', {});

  font.load()
    .then(() => {
      docEl.className += ' fonts-loaded';
    })
    .catch((error) => {
      console.error('font failed to load: ', error);
    });
} else {
  // Just let font-face work normally.
  docEl.className += ' fonts-loaded';
}

// --------------------------------------------------
// Load non-critical stylesheets
//
const cssHrefs = document.querySelectorAll('meta[content$=".css"]');

for (let i = 0; i < cssHrefs.length; i++) {
  loadCSS(cssHrefs[i].content);
}

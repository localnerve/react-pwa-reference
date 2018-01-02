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
/*eslint-disable no-console */
/* global document, Promise */

import FontFaceObserver from 'fontfaceobserver';
import { loadCSS } from 'fg-loadcss';

const docEl = document.documentElement;

// --------------------------------------------------
// js happens
//
docEl.className = docEl.className.replace('no-js', '');

// --------------------------------------------------
// Fontface observer to quickly load fonts.
// Relies on Promise.
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

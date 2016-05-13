/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * All custom header javascript.
 * This is the source of the built asset, not the asset itself.
 * This is an entry module, so there are no global concerns here.
 */
/*eslint no-console:0 */
/* global document, window */

// --------------------------------------------------
// Fontface observer to quickly load fonts.
// Relies on Promise polyfill.
//

require('fontfaceobserver/fontfaceobserver');

new window.FontFaceObserver('Source Sans Pro', {})
.check()
.then(function() {
  window.document.documentElement.className += 'fonts-loaded';
})
.catch(function (error) {
  console.error('font failed to load: ', error);
});

// --------------------------------------------------
// Load non-critical stylesheets
//
var i, loadCss = require('fg-loadcss').loadCSS,
  cssHrefs = document.querySelectorAll('meta[content$=".css"]');

for (i = 0; i < cssHrefs.length; i++) {
  loadCss(cssHrefs[i].content);
}

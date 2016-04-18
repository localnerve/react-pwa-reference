/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * A fixture to supply sw-data.
 * TODO: add to automatically generated test fixtures.
 */
'use strict';

var hostnames = [
  'fonts.gstatic.com',
  'cdn.google.com'
];

module.exports = {
  debug: false,
  cacheId: 'flux-react-example-sw/0.12.2',
  assets: [
    '//'+ hostnames[1] +'/somepath/to/some/resource',
    '//'+ hostnames[0] +'/s/sourcesanspro/v9/ODelI1aHBYDBqgeIAH2zlNV_2ngZ8dMf8fLgjYEouxg.woff2',
    '//'+ hostnames[0] +'/s/sourcesanspro/v9/ODelI1aHBYDBqgeIAH2zlBM0YzuT7MdOe03otPbuUS0.woff',
    '//'+ hostnames[0] +'/s/sourcesanspro/v9/ODelI1aHBYDBqgeIAH2zlEY6Fu39Tt9XkmtSosaMoEA.ttf'
  ]
};

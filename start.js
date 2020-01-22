/***
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * The development startup entry point.
 */
const basePath = require('path').basename(__dirname);

require('@babel/register')({
  ignore: [
    new RegExp(`${basePath}/node_modules/.*`)
  ]
});

module.exports = require('./src/application/server');

/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * The development startup entry point.
 */
'use strict';

require('babel-register')({
  ignore: [
    new RegExp(
      require('path').basename(__dirname) + '\/node_modules\/.*'
    )
  ]
});

module.exports = require('./src/application/server');

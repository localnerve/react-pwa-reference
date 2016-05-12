/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * The universal postinstall script.
 */
/* global require, console */
/*eslint-disable no-console */
'use strict';

const fs = require('fs'),
  path = require('path');

// try to setup the src symlink.
try {
  fs.symlinkSync(
    path.resolve('./src/application'),
    './src/node_modules/application',
    'dir'
  );
  console.log('*** Successfully setup src application symlink ***');
} catch(e){
  console.error(
    '*** FAILED to create src application symlink *** ' + e
  );
}

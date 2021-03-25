/***
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * The universal postinstall script.
 */
/*eslint-disable no-console */
const fs = require('fs');

/**
 * Create the appliction symlink, fail quietly if exists.
 * Setting up 'src' is only required for local development/running.
 * Setting up 'output' is only required for the remote host deployment.
 *
 * @param {String} type - one of 'src' or 'output'.
 */
function applicationSymLink (type) {
  try {
    fs.symlinkSync(
      '../application',
      `./${type}/node_modules/application`,
      'dir'
    );
    console.log(`*** Successfully setup ${type} application symlink ***`);
  } catch(e){
    if (e.code !== 'EEXIST') {
      console.error(
        `*** FAILED to create ${type} symlink. This might be ok. ***
        ${e}`
      );
    }
  }
}

['src', 'output'].forEach((type) => applicationSymLink(type));

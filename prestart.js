/**
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * To facilitate temporary, remote builds, update the output app symlink.
 */
/* eslint-disable no-console */

const fs = require('fs');

/**
 * Update the output symbolic link
 */
function updateLink () {
  try {
    fs.unlinkSync('./output/node_modules/application');
    fs.symlinkSync(
      '../application',
      './output/node_modules/application',
      'dir'
    );
    console.log('*** Successfully updated output application symlink ***');
  } catch(e){
    console.error('*** FAILED to update output symlink ***');
    console.error(e);
  }
}

/**
 * Conditionally update the application output symlink
 */
function conditionalLinkUpdate () {
  const shouldUpdate = 'DYNO' in process.env;

  if (shouldUpdate) {
    console.log('*** Updating symbolic output link ***');
    updateLink();
  } else {
    console.log('*** Skipping symbolic output link update ***');
  }
}

conditionalLinkUpdate();
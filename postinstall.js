/***
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * The universal postinstall script.
 */
/* global Promise */
/*eslint-disable no-console */
const fs = require('fs');
const { spawn } = require('child_process');

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

/**
 * Link 'src' and 'output' to application.
 */
function linkTypes () {
  ['src', 'output'].forEach(type => applicationSymLink(type));
}

/**
 * Conditionally build the application if on Heroku.
 *
 * @returns Promise resolves on success, rejects otherwise.
 */
function conditionalBuild () {
  const shouldBuild = 'DYNO' in process.env;

  if (shouldBuild) {
    return new Promise((resolve, reject) => {
      const cp = spawn('npm', ['run', 'build:server']);

      let rejectSentinel = true;
      const rejectCall = arg => {
        if (rejectSentinel) {
          rejectSentinel = false;
          reject(`Application build failed: ${arg}`);
        }
      }

      cp.on('exit', (code, signal) => {
        const error = code || signal;
        if (error) {
          return rejectCall(`code '${code}', signal '${signal}'`);
        }
        resolve();
      });

      cp.on('error', rejectCall);
    });
  }

  return Promise.resolve();
}

/**
 * Run the post install
 */
function postInstall () {
  conditionalBuild()
    .then(linkTypes)
    .catch(e => {
      console.error(e);
    })
}

postInstall();

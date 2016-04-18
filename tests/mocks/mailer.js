/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 */
'use strict';

function send (payload, done) {
  if (payload.emulateError) {
    return done(new Error('mailer'));
  }
  done(null, payload);
}

module.exports = {
  send: send
};
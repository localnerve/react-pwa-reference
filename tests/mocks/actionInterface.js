/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise */
'use strict';

function mockAction (context, payload, done) {
  var error;

  if (payload.emulateError) {
    error = new Error('mock');
  }

  if (done) {
    return done(error);
  }

  return error ? Promise.reject() : Promise.resolve();
}

module.exports = {
  page: mockAction,
  settings: mockAction
};

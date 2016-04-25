/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * A simple mock of the Fetch API Request, purposed for this test suite.
 */
/* global Promise */
'use strict';

function Request (url, options) {
  options = options || {};

  var body = options.body && options.body.content || options.body;

  if (Object.prototype.toString.call(body) === '[object Array]') {
    body = body[0];
  }

  this.url = url;
  this.method = options.method;
  this._body = body;
  this.mode = options.mode;
  this.headers = options.headers;
  this.bodyUsed = false;
  this.credentials = options.credentials;
}

Request.prototype = {
  json: function json () {
    this.bodyUsed = true;
    return Promise.resolve(this._body);
  },
  clone: function clone () {
    return new Request(this.url, {
      method: this.method,
      mode: this.mode,
      headers: this.headers,
      body: this._body,
      credentials: this.credentials
    });
  }
};

module.exports = Request;

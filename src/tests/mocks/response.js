/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * A simple mock for Fetch API Response, purposed for this test suite.
 */
/* global Promise */
'use strict';

function Response (body, init) {
  init = init || {};

  var status = parseInt(init.status, 10);

  this.bodyUsed = false;
  this.status = status >= 0 ? status : 200;
  this.statusText = init.statusText || 'OK';
  this.headers = init.headers;
  this.ok = status >= 200 && status <= 299;
  this._body = body;
}

Response.prototype = {
  json: function json () {
    this.bodyUsed = true;
    return Promise.resolve(this._body);
  },
  text: function text () {
    this.bodyUsed = true;
    return Promise.resolve(JSON.stringify(this._body));
  },
  clone: function clone () {
    return new Response(this._body, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers
    });
  }
};

module.exports = Response;

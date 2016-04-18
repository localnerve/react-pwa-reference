/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, after, describe,  afterEach */
'use strict';

var fs = require('fs');
var path = require('path');
var test = require('./sauce-travis');

describe(test.name + ' (' + test.caps + ')', function() {
  this.timeout(test.timeout);

  before(function(done) {
    test.beforeAll(done);
  });

  afterEach(function(done) {
    test.updateState(this);
    done();
  });

  after(function(done) {
    test.afterAll(done);
  });

  fs.readdirSync(__dirname).forEach(function(item) {
    var name = path.basename(item);
    if (name.indexOf('-specs') !== -1) {
      require('./' + name);
    }
  });
});
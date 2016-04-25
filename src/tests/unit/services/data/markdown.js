/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
 /* global before, after, describe, it */
'use strict';

var expect = require('chai').expect;
var mocks = require('../../../mocks');

describe('markdown', function () {
  var markdown;

  before(function () {
    this.timeout(5000);

    mocks.remarkable.begin();
    markdown = require('application/server/services/data/markdown').markdown;
  });

  after(function () {
    mocks.remarkable.end();
  });

  it('should return some markup', function () {
    expect(markdown('Hello')).to.contain('</').and.contain('Hello');
  });
});

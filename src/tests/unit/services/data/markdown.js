/**
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, after, describe, it */

import { expect } from 'chai';
import mocks from 'test/mocks';

describe('markdown', () => {
  let markdown;

  before(function () {
    this.timeout(5000);

    mocks.remarkable.begin();
    markdown = require('application/server/services/data/markdown').markdown;
  });

  after(() => {
    mocks.remarkable.end();
  });

  it('should return some markup', () => {
    expect(markdown('Hello')).to.contain('</').and.contain('Hello');
  });
});

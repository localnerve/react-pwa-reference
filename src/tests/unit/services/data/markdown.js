/**
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, after, describe, it */

import { expect } from 'chai';
import mocks from 'test/mocks';

describe('markdown', () => {
  let remarkHtml;
  let markdown;
  const testMd = `
# Hello World

## This is A Test Heading

This is a test paragraph. Whoopdie do.
`;

  before(function () {
    this.timeout(5000);

    mocks.remarkable.begin();
    markdown = require('application/server/services/data/markdown').markdown;
    remarkHtml = require('remark-html');
  });

  after(() => {
    mocks.remarkable.end();
  });

  it('should return some markup', () => {
    return markdown(testMd).then(markup => {
      expect(markup).to.contain('</').and.contain('Hello');
    });
  });

  it('should reject on error', () => {
    remarkHtml.mockError = true;
    return markdown(testMd).then(() => {
      expect.fail('expected markdown to reject');
    }).catch(err => {
      expect(err.message).to.contain('error');
    }).then(() => {
      remarkHtml.mockError = false;
    });
  })
});

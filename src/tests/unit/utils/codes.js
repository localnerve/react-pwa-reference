/**
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, describe, it */

import { expect } from 'chai';

describe('codes', () => {
  let codes, conformErrorStatus;

  before('codes', () => {
    codes = require('utils/codes');
    conformErrorStatus = codes.conformErrorStatus;
  });

  it('should expose expected operations', () => {
    expect(codes).to.respondTo('conformErrorStatus');
  });

  describe('conformErrorStatus', () => {
    it('should conform error status 404 to \'404\'', () => {
      const status = conformErrorStatus(404);
      expect(status).to.equal('404');
      expect(status).to.not.equal(404);
    });

    it('should conform any other status to \'500\'', () => {
      [
        0, 200, 300, 304, 400, 401, 403, '404', 410, 412, 499, 500, 501, 503
      ].forEach((status) => {
        expect(conformErrorStatus(status)).to.equal('500');
      });
    });
  });
});

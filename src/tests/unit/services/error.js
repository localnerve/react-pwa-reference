/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, before, it */
'use strict';

var expect = require('chai').expect;

describe('error decorator', function () {
  var error;

  before(function () {
    error = require('application/server/services/error').decorateFetchrError;
  });

  it('should pass through falsy error', function () {
    expect(error(false)).to.be.false;
    expect(error()).to.be.undefined;
    expect(error(null)).to.be.null;
    expect(error('')).to.be.a('string').that.is.empty;
    expect(error(0)).to.equal(0);
    expect(isNaN(error(NaN))).to.be.true;
  });

  it('should convert string to Error', function () {
    expect(error('this is an error')).to.be.an.instanceof(Error);
  });

  it('should decorate an object with Fetchr requirements', function () {
    var decoratedErr = error({});

    expect(decoratedErr).to.have.property('statusCode');
    expect(decoratedErr).to.have.property('output');
  });

  it('should decorate an Error with Fetchr requirements', function () {
    var err = new Error('this is an error');
    var decoratedErr = error(err);

    expect(decoratedErr).to.have.property('statusCode');
    expect(decoratedErr).to.have.property('output');
    expect(decoratedErr.output).to.have.property('message');
    expect(decoratedErr.output.message).to.equal(err.message);
  });
});

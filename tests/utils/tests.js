/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Specific tests for reuse
 */
'use strict';

function testTransform (expect, actual, expected) {
  Object.keys(expected).forEach(function (key) {
    expect(actual[key].page).to.eql(expected[key].page);
    expect(actual[key].path).to.eql(expected[key].path);
    expect(actual[key].method).to.eql(expected[key].method);
    expect(actual[key].label).to.eql(expected[key].label);

    var expectedActionContents = /\{([^\}]+)\}/.exec(''+expected[key].action)[1].replace(/\s+/g, '');

    expect(actual[key].action).to.be.a('function');
    expect(actual[key].action.length).to.eql(expected[key].action.length);

    // just compare function contents with no whitespace to cover instrumented code case.
    expect((''+actual[key].action).replace(/\s+/g, '')).to.contain(expectedActionContents);
  });
}

module.exports = {
  testTransform: testTransform
};

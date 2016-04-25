/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * A fixture to supply data for cache testing
 */
'use strict';

var markupData = '<h2>Sunshine and Rainbows</h2>';
var markdownData = '## Unicorns and Rainbows';
var resourceName = 'testResourceName';
var jsonData = JSON.stringify({
  test: {
    testPropTest: 'testValueTest',
    resource: resourceName
  }
});
var validModels = JSON.stringify({
  models: {
    ValidModel1: {
      testProp: 'value'
    },
    ValidModel2: {
      testPropAnother: 'anotherValue'
    }
  }
});
var validModelRef = [ 'ValidModel1' ];
var validMultiModelRef = [ 'ValidModel1', 'ValidModel2' ];
var invalidModelRef = [ 'InvalidModel' ];

var i = 0;
function makeResId () {
  return 'res' + (i++);
}

function makeResource (params) {
  var testRes = {};

  if (params.hasId) {
    testRes.resource = params.idValue || makeResId();
  }
  if (params.hasFormat) {
    testRes.format = params.formatValue;
  }
  if (params.hasModels) {
    testRes.models = params.modelsValue;
  }
  if (params.hasData) {
    testRes.data = params.dataValue;
  }

  return testRes;
}

function makeMarkupResource (hasModels, modelsValue) {
  return makeResource({
    hasId: true,
    idValue: null,
    hasFormat: true,
    formatValue: 'markup',
    hasModels: hasModels,
    modelsValue: modelsValue,
    hasData: true,
    dataValue: markupData
  });
}

module.exports = {
  markupData: markupData,
  markdownData: markdownData,
  jsonData: JSON.parse(jsonData),
  validModels: JSON.parse(validModels),
  models: makeResource({
    hasId: true,
    idValue: 'models',
    hasFormat: true,
    formatValue: 'json',
    hasModels: false,
    modelsValue: null,
    hasData: true,
    dataValue: validModels
  }),
  nothing: makeResource({
    hasId: false,
    idValue: null,
    hasFormat: false,
    formatValue: null,
    hasModels: false,
    modelsValue: null,
    hasData: false,
    dataValue: null
  }),
  noFormat: makeResource({
    hasId: true,
    idValue: 'test',
    hasFormat: false,
    formatValue: null,
    hasModels: false,
    modelsValue: null,
    hasData: true,
    dataValue: jsonData
  }),
  badFormat: makeResource({
    hasId: true,
    idValue: 'test',
    hasFormat: true,
    formatValue: 'bad',
    hasModels: false,
    modelsValue: null,
    hasData: true,
    dataValue: jsonData
  }),
  noData: makeResource({
    hasId: true,
    idValue: null,
    hasFormat: true,
    formatValue: undefined,
    hasModels: false,
    modelsValue: null,
    hasData: false,
    dataValue: null
  }),
  markup: {
    validNone: makeMarkupResource(false, null),
    validSingle: makeMarkupResource(true, validModelRef),
    validMulti: makeMarkupResource(true, validMultiModelRef),
    invalid: makeMarkupResource(true, invalidModelRef)
  }
};

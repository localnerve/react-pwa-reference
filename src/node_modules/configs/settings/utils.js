/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

var path = require('path');
var toString = Object.prototype.toString;

/**
 * Prepends a path to string properties of an object or array.
 * Returns a new object or array result.
 * If a property value is not a 'string' or null, it is passed along by reference.
 * If a property value is an 'object', recurse.
 *
 * @param {Object|Array} fromObj - Collection whose String properties are to have paths prepended to them.
 * @param {String} prePath - The path to prepend.
 * @returns {Object} A fromObject copy with the given path prepended to the String values.
 */
function prependPath (fromObj, prePath) {
  var conversion = toString.call(fromObj) === '[object Array]' ? {
    from: fromObj,
    to: [],
    /**
     * Get the value from an array
     */
    getValue: function (val, index) {
      return fromObj[index];
    },
    /**
     * Set the value to an array
     */
    setValue: function (obj, val, index, newValue) {
      obj[index] = newValue;
    }
  } : {
    from: Object.keys(fromObj),
    to: {},
    /**
     * Get the value from an Object
     */
    getValue: function (val) {
      return fromObj[val];
    },
    /**
     * Set the value to an Object
     */
    setValue: function (obj, val, index, newValue) {
      obj[val] = newValue;
    }
  };

  return conversion.from.reduce(function (obj, val, index) {
    var fromValue = conversion.getValue(val, index);
    if (typeof fromValue === 'string') {
      // prepend the prePath to fromValue
      conversion.setValue(obj, val, index, path.join(prePath, fromValue));
    } else if (fromValue && typeof fromValue === 'object') {
      // go again
      conversion.setValue(obj, val, index, prependPath(fromValue, prePath));
    } else {
      // pass thru
      conversion.setValue(obj, val, index, fromValue);
    }
    return obj;
  }, conversion.to);
}

module.exports = {
  prependPathToObject: prependPath
};

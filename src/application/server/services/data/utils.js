/***
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */

/**
 * Find the first [object Object] with key that matches value.
 *
 * @param {String} key - The property name.
 * @param {String} value - The property value.
 * @param {Object} obj - The object to search.
 * @returns {Object} the object that contains key===value. Otherwise undefined.
 */
export function objContains (key, value, obj) {
  if (obj[key] === value) {
    return obj;
  }

  let found;

  Object.keys(obj).some((k) => {
    if (Object.prototype.toString.call(obj[k]) === '[object Object]') {
      found = objContains(key, value, obj[k]);
      return !!found;
    }
  });

  return found;
}

export default {
  objContains
};

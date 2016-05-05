/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import merge from 'lodash/merge';
import { conformErrorStatus } from 'utils';
import Spinner from './Spinner';
import ContentPage from './ContentPage';
import Contact from './contact';

/***
 * Component to class map
 */
const pageTypes = {
  ContentPage,
  Contact: Contact
};

/**
 * Exchange a component string for a React class.
 *
 * @param {String} component - The name of a page component.
 * @returns {Object} A React class named by the component parameter.
 */
function getClass (component) {
  return pageTypes[component];
}

/**
 * Form a props object given content and models.
 *
 * @param {String|Object} content - page html or json content.
 * @param {Object} models - Json containing models for the page.
 * @returns {Object} If content is undefined returns a spinner property,
 * otherwise returns an object with content and models.
 */
function getProps (content, models) {
  let props;

  if (content) {
    props = Object.prototype.toString.call(content) === '[object Object]' ?
      merge(content, { models }) : {
        models,
        content
      };
  } else {
    props = {
      spinner: true
    };
  }

  return props;
}

/**
 * Return the main navigable pages for the app as an ordered array.
 * These are routes that have mainNav === 'true'.
 * If there is an error, the page at the ordinal will be the required error page.
 *
 * @param {Object} error - A fluxible routes navigationError.
 * @param {Number} error.statusCode - The error status code.
 * @param {Object} pages - A routes object from RouteStore.
 * @param {Number} ordinal - A zero based order for the current page in the routes Object.
 * @returns {Array} An ordered array of the main navigable pages of the application.
 */
export function getMainNavPages (error, pages, ordinal) {
  const mainPages = Object.keys(pages)
  .filter(function (page) {
    return pages[page].mainNav;
  })
  .sort(function (a, b) {
    return pages[a].order - pages[b].order;
  })
  .map(function (page) {
    return pages[page];
  });

  if (error) {
    mainPages[ordinal] = pages[conformErrorStatus(error.statusCode)];
  }

  return mainPages;
}

/**
 * Create React elements for the given navigable pages.
 * Unfortunately, the key and id have to always be the same for each slot for swipe.
 *
 * @param {Array} navPages - An ordered array of the main navigable pages.
 * @param {Object} contentStore - A reference to the ContentStore.
 * @returns {Array} Array of React Elements, one for each navPage.
 */
export function createElements (navPages, contentStore) {
  const key = 'page';
  let count = 0;

  return navPages.map(function (np) {
    const data = contentStore.get(np.page) || {};

    return React.createElement('div', {
      key: key + count,
      id: key + count++
    }, React.createElement(
        getClass(np.component),
        getProps(data.content, data.models)
      )
    );
  });
}

/*eslint-disable react/prop-types */
/**
 * Create a React element for a modal dialog given component and props.
 *
 * @param {String} component - The name of the component for the modal.
 * @param {Object} props - The props for the component.
 * @param {Boolean} failure - Modal creation failure.
 * @returns {Object} A React Element.
 */
export function createModalElement (component, props, failure) {
  if (component) {
    props = props || {};

    props = merge(getProps(props.content, props.models), { failure: failure });

    return React.createElement(component, props);
  }
  return React.createElement(Spinner);
}
/*eslint-enable react/prop-types */

export default {
  createElements,
  getMainNavPages,
  createModalElement
}

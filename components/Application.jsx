/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global window, document */
import debugLib from 'debug';
import React from 'react';
import { connectToStores, provideContext } from 'fluxible-addons-react';
import { handleHistory, navigateAction } from 'fluxible-router';

const debug = debugLib('application');

let Application = React.createClass({
  contextTypes: {
    getStore: React.PropTypes.func.isRequired,
    executeAction: React.PropTypes.func.isRequired
  },

  handleMessage: function (event) {
    if (event.data.command === 'navigate') {
      this.modalClose();
      this.context.executeAction(navigateAction, {
        url: event.data.url
      });
    }
  },

  render: function () {
    debug('rendering application');

    return (
      <div className="app-block">
        <h1>Place Application Here</h1>
      </div>
    );
  },

  componentDidMount: function () {
    if ('serviceWorker' in window.navigator) {
      window.navigator.serviceWorker.addEventListener(
        'message', this.handleMessage
      );
    }
  },

  componentWillUnmount: function () {
    if ('serviceWorker' in window.navigator) {
      window.navigator.serviceWorker.removeEventListener(
        'message', this.handleMessage
      );
    }
  },

  shouldComponentUpdate: function (nextProps) {
    return nextProps.navigateComplete && this.props.navigateComplete;
  },

  componentDidUpdate: function () {
    document.title = this.props.pageTitle;

    var analytics = window[this.props.analytics];
    if (analytics) {
      analytics('set', {
        title: this.props.pageTitle
      });
      analytics('send', 'pageview');
    }
  }
});

Application = connectToStores(
  Application, ['ApplicationStore', 'ContentStore', 'RouteStore'],
  (context) => {
    const routeStore = context.getStore('RouteStore'),
      appStore = context.getStore('ApplicationStore'),
      currentRoute = routeStore.getCurrentRoute(),
      pageName = (currentRoute && currentRoute.page) ||
        appStore.getDefaultPageName();

    return {
      navigateComplete: routeStore.isNavigateComplete(),
      pageName: pageName,
      pageTitle: appStore.getCurrentPageTitle(),
      pageModels: context.getStore('ContentStore').getCurrentPageModels(),
      pages: routeStore.getRoutes()
    };
  }
);

Application = handleHistory(Application, {
  enableScroll: false
});

Application = provideContext(Application);

export default Application;

/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global window, document */
import debugLib from 'debug';
import React from 'react';
import { connectToStores, provideContext } from 'fluxible-addons-react';
import { handleHistory, navigateAction } from 'fluxible-router';
import ReactSwipe from 'react-swipe';
import Background from './Background';
import Header from './Header';
import Footer from './Footer';
import PageContainer from './PageContainer';
import pages from './pages';

const debug = debugLib('application');

let Application = React.createClass({
  propTypes: {
    navigateComplete: React.PropTypes.bool.isRequired,
    currentNavigateError: React.PropTypes.object,
    pageTitle: React.PropTypes.string.isRequired,
    analytics: React.PropTypes.string.isRequired,
    pageName: React.PropTypes.string.isRequired,
    pages: React.PropTypes.object.isRequired,
    pageModels: React.PropTypes.object.isRequired
  },
  contextTypes: {
    getStore: React.PropTypes.func.isRequired,
    executeAction: React.PropTypes.func.isRequired
  },

  handleMessage: function (event) {
    if (event.data.command === 'navigate') {
      // this.modalClose();
      this.context.executeAction(navigateAction, {
        url: event.data.url
      });
    }
  },

  handleSwipe: function (index) {
    var pages = this.props.pages;
    if (pages[this.props.pageName].order !== index) {
      var nextPageName = Object.keys(pages).filter(function (page) {
        return pages[page].order === index && pages[page].mainNav;
      })[0];

      this.context.executeAction(navigateAction, {
        name: nextPageName,
        url: pages[nextPageName].path
      });
    }
  },

  render: function () {
    debug('pageName', this.props.pageName);
    debug('pages', this.props.pages);
    debug('navigateError', this.props.currentNavigateError);

    const routeOrdinal = this.props.pages[this.props.pageName].order;

    const navPages = pages.getMainNavPages(
      this.props.currentNavigateError,
      this.props.pages,
      routeOrdinal
    );

    const pageElements = pages.createElements(
      navPages, this.context.getStore('ContentStore')
    );

    return (
      <div className="app-block">
        <Background prefetch={false} />
        <Header
          selected={navPages[routeOrdinal].page}
          links={navPages}
          models={this.props.pageModels}
        />
        <PageContainer>
          <ReactSwipe
            className="swipe-container"
            callback={this.handleSwipe}
            startSlide={routeOrdinal}
            slideToIndex={routeOrdinal}>
            {pageElements}
          </ReactSwipe>
        </PageContainer>
        <Footer models={this.props.pageModels} />
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

Application = provideContext(
  handleHistory(Application, {
    enableScroll: false
  })
);

export default Application;

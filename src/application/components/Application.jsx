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
import PageContainer from './PageContainer';
import Header from './header';
import Footer from './footer';
import pages from './pages';

const debug = debugLib('application');

let Application = React.createClass({
  propTypes: {
    navigateComplete: React.PropTypes.bool.isRequired,
    currentNavigateError: React.PropTypes.object,
    pageTitle: React.PropTypes.string.isRequired,
    analytics: React.PropTypes.string,
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
    const pages = this.props.pages;
    if (pages[this.props.pageName].order !== index) {
      const nextPageName = Object.keys(pages).filter(function (page) {
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
    debug('pageTitle', this.props.pageTitle);
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
            slideToIndex={routeOrdinal}
            shouldUpdate={() => {
              return true;
            }}>
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

  /**
   * Allow rendering if the page has changed (The result of NAVIGATE_START).
   * Allow rendering if the navigation has completed (and been complete -
   * NAVIGATE_SUCCESS + 1).
   *
   * @param {Object} nextProps - The nextProps, per React lifecycle docs.
   */
  shouldComponentUpdate: function (nextProps) {
    const pageChange = nextProps.pageName !== this.props.pageName;
    const navigationComplete =
      nextProps.navigateComplete && this.props.navigateComplete;
    return pageChange || navigationComplete;
  },

  componentDidUpdate: function () {
    document.title = this.props.pageTitle;

    const analytics = window[this.props.analytics];
    if (analytics) {
      analytics('set', {
        title: this.props.pageTitle
      });
      analytics('send', 'pageview');
    }
  }
});

Application = connectToStores(
  Application, ['ContentStore', 'RouteStore'], (context) => {
    const routeStore = context.getStore('RouteStore'),
      contentStore = context.getStore('ContentStore'),
      currentRoute = routeStore.getCurrentRoute(),
      pageName = (currentRoute && currentRoute.page) ||
        contentStore.getDefaultResource(),
      pageTitle = (currentRoute && currentRoute.pageTitle) ||
        contentStore.getDefaultResource();

    return {
      navigateComplete: routeStore.isNavigateComplete(),
      pageName: pageName,
      pageTitle: pageTitle,
      pageModels: contentStore.getCurrentPageModels(),
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

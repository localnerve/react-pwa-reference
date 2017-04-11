/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global window, document */
import debugLib from 'debug';
import React from 'react';
import PropTypes from 'prop-types';
import { connectToStores, provideContext } from 'fluxible-addons-react';
import { handleHistory, navigateAction } from 'fluxible-router';
import ReactSwipe from 'react-swipe';
import { closeModal as modalAction } from 'application/actions/modal';
import Background from './Background';
import PageContainer from './PageContainer';
import Header from './header';
import Footer from './footer';
import pages from './pages';

const debug = debugLib('application');

class Application extends React.Component {
  constructor (props) {
    super(props);

    this.handleSwipe = this.handleSwipe.bind(this);
    this.modalClose = this.modalClose.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
  }

  static get propTypes () {
    return {
      hasServiceWorker: PropTypes.bool.isRequired,
      navigateComplete: PropTypes.bool.isRequired,
      currentNavigateError: PropTypes.object,
      pageTitle: PropTypes.string.isRequired,
      analytics: PropTypes.string,
      pageName: PropTypes.string.isRequired,
      pages: PropTypes.object.isRequired,
      pageModels: PropTypes.object.isRequired,
      modal: PropTypes.object
    };
  }

  static get contextTypes () {
    return {
      getStore: PropTypes.func.isRequired,
      executeAction: PropTypes.func.isRequired
    };
  }

  handleMessage (event) {
    if (event.data.command === 'navigate') {
      this.modalClose();
      this.context.executeAction(navigateAction, {
        url: event.data.url
      });
      return;
    }

    if (event.data.command === 'ping') {
      debug('ping');
      const respondTo = event.data.port || (event.ports && event.ports[0]) ||
        event.source;

      if (respondTo) {
        debug('pong');
        respondTo.postMessage({
          message: 'pong'
        });
      }
      return;
    }
  }

  handleSwipe (index) {
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
  }

  modalClose () {
    this.context.executeAction(modalAction);
  }

  render () {
    debug('props', this.props);

    const routeOrdinal = this.props.pages[this.props.pageName].order;

    const navPages = pages.getMainNavPages(
      this.props.currentNavigateError,
      this.props.pages,
      routeOrdinal
    );

    const pageElements = pages.createElements(
      navPages, this.context.getStore('ContentStore')
    );

    const modalElement = pages.createModal(this.props.modal, this.modalClose);

    return (
      <div id="app-element" className="app-block">
        {modalElement}
        <Background prefetch={!this.props.hasServiceWorker} />
        <Header
          selected={navPages[routeOrdinal].page}
          links={navPages}
          models={this.props.pageModels}
          hasServiceWorker={this.props.hasServiceWorker}
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
  }

  componentDidMount () {
    if (this.props.hasServiceWorker) {
      window.navigator.serviceWorker.addEventListener(
        'message', this.handleMessage
      );
    }
    pages.assignAppElementToModal(document.getElementById('app-element'));
  }

  componentWillUnmount () {
    if (this.props.hasServiceWorker) {
      window.navigator.serviceWorker.removeEventListener(
        'message', this.handleMessage
      );
    }
  }

  /**
   * Allow rendering if the page has changed (The result of NAVIGATE_START).
   * Allow rendering if the navigation has completed (and been complete -
   * NAVIGATE_SUCCESS + 1).
   *
   * @param {Object} nextProps - The nextProps, per React lifecycle docs.
   */
  shouldComponentUpdate (nextProps) {
    const pageChange = nextProps.pageName !== this.props.pageName;
    const navigationComplete =
      nextProps.navigateComplete && this.props.navigateComplete;
    return pageChange || navigationComplete;
  }

  componentDidUpdate () {
    document.title = this.props.pageTitle;

    const analytics = window[this.props.analytics];
    if (analytics) {
      analytics('set', {
        title: this.props.pageTitle
      });
      analytics('send', 'pageview');
    }
  }
}

const application = provideContext(
  handleHistory(
    connectToStores(
      Application, ['ContentStore', 'RouteStore', 'ModalStore'], (context) => {
        const
          routeStore =
            context.getStore('RouteStore'),
          contentStore =
            context.getStore('ContentStore'),
          modalStore =
            context.getStore('ModalStore'),
          currentRoute =
            routeStore.getCurrentRoute(),
          pageName =
            (currentRoute && currentRoute.page) ||
              contentStore.getDefaultResource(),
          pageTitle =
            (currentRoute && currentRoute.pageTitle) ||
              contentStore.getDefaultResource(),
          hasServiceWorker =
            typeof window !== 'undefined' && 'serviceWorker' in window.navigator;

        return {
          hasServiceWorker: hasServiceWorker,
          navigateComplete: routeStore.isNavigateComplete(),
          pageName: pageName,
          pageTitle: pageTitle,
          pageModels: contentStore.getCurrentPageModels(),
          pages: routeStore.getRoutes(),
          modal: {
            open: modalStore.getIsOpen(),
            component: modalStore.getComponent(),
            componentName: modalStore.getComponentName(),
            props: modalStore.getProps(),
            failure: modalStore.getFailure()
          }
        };
      }
    )
  , {
    enableScroll: false
  })
);

export default application;

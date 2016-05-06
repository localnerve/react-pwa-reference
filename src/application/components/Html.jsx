/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Only rendered on the server
 */
/*eslint react/no-danger:0 */
import React from 'react';
import { connectToStores, provideContext } from 'fluxible-addons-react';

let Html = React.createClass({
  propTypes: {
    currentPageTitle: React.PropTypes.string.isRequired,
    imageServiceHost: React.PropTypes.string.isRequired,
    images: React.PropTypes.string.isRequired,
    inlineStyles: React.PropTypes.string.isRequired,
    trackingSnippet: React.PropTypes.string.isRequired,
    inlineScript: React.PropTypes.string.isRequired,
    markup: React.PropTypes.string.isRequired,
    state: React.PropTypes.string.isRequired,
    mainScript: React.PropTypes.string.isRequired,
    appManifest: React.PropTypes.string.isRequired,
    otherStyles: React.PropTypes.array.isRequired,
    browserConfig: React.PropTypes.string.isRequired,
    swRegistrationScript: React.PropTypes.string.isRequired,
    swMainScript: React.PropTypes.string.isRequired
  },
  render: function () {
    const asyncStyleImports = this.props.otherStyles.map((otherStyle, i) => {
      // considering:
      // return <link rel="preload" as="style" href={otherStyle} />;
      return <meta key={'otherStyle-'+i} itemProp="stylesheet" content={otherStyle} />;
    });

    return (
      <html>
        <head>
          <meta charSet="utf-8" />
          <title>{this.props.currentPageTitle}</title>
          <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no" />
          <meta httpEquiv="x-dns-prefetch-control" content="on" />
          <link rel="dns-prefetch" href="//fonts.gstatic.com" />
          <link rel="preconnect" href="//fonts.gstatic.com" />
          <link rel="dns-prefetch" href={this.props.imageServiceHost} />
          <link rel="preconnect" href={this.props.imageServiceHost} />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="application-name" content="Flux React Example SW" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black" />
          <meta name="apple-mobile-web-app-title" content="Flux React Example SW" />
          <link rel="apple-touch-icon" sizes="57x57" href={this.props.images + '/apple-touch-icon-57x57.png'} />
          <link rel="apple-touch-icon" sizes="60x60" href={this.props.images + '/apple-touch-icon-60x60.png'} />
          <link rel="apple-touch-icon" sizes="72x72" href={this.props.images + '/apple-touch-icon-72x72.png'} />
          <link rel="apple-touch-icon" sizes="76x76" href={this.props.images + '/apple-touch-icon-76x76.png'} />
          <link rel="apple-touch-icon" sizes="114x114" href={this.props.images + '/apple-touch-icon-114x114.png'} />
          <link rel="apple-touch-icon" sizes="120x120" href={this.props.images + '/apple-touch-icon-120x120.png'} />
          <link rel="apple-touch-icon" sizes="144x144" href={this.props.images + '/apple-touch-icon-144x144.png'} />
          <link rel="apple-touch-icon" sizes="152x152" href={this.props.images + '/apple-touch-icon-152x152.png'} />
          <link rel="apple-touch-icon" sizes="180x180" href={this.props.images + '/apple-touch-icon-180x180.png'} />
          <link rel="icon" type="image/png" href={this.props.images + '/favicon-32x32.png'} sizes="32x32" />
          <link rel="icon" type="image/png" href={this.props.images + '/android-chrome-192x192.png'} sizes="192x192" />
          <link rel="icon" type="image/png" href={this.props.images + '/favicon-96x96.png'} sizes="96x96" />
          <link rel="icon" type="image/png" href={this.props.images + '/favicon-16x16.png'} sizes="16x16" />
          <link rel="manifest" href={this.props.appManifest} />
          <meta name="msapplication-config" content={this.props.browserConfig} />
          <meta name="msapplication-TileColor" content="#1B5E20" />
          <meta name="msapplication-TileImage" content={this.props.images + '/mstile-144x144.png'} />
          <meta name="theme-color" content="#1B5E20" />
          {asyncStyleImports}
          <style dangerouslySetInnerHTML={{__html: this.props.inlineStyles}}></style>
          <script dangerouslySetInnerHTML={{__html: this.props.trackingSnippet}}></script>
          <script async src={this.props.swRegistrationScript} data-service-worker={this.props.swMainScript}></script>
        </head>
        <body>
          <svg style={{position: 'absolute', width: 0, height: 0}} width="0" height="0" version="1.1">
            <defs>
            <symbol id="icon-phone" viewBox="0 0 16 16">
            <title>phone</title>
            <path d="M11 10c-1 1-1 2-2 2s-2-1-3-2-2-2-2-3 1-1 2-2-2-4-3-4-3 3-3 3c0 2 2.055 6.055 4 8s6 4 8 4c0 0 3-2 3-3s-3-4-4-3z"></path>
            </symbol>
            <symbol id="icon-cog" viewBox="0 0 16 16">
            <title>cog</title>
            <path d="M14.59 9.535c-0.839-1.454-0.335-3.317 1.127-4.164l-1.572-2.723c-0.449 0.263-0.972 0.414-1.529 0.414-1.68 0-3.042-1.371-3.042-3.062h-3.145c0.004 0.522-0.126 1.051-0.406 1.535-0.839 1.454-2.706 1.948-4.17 1.106l-1.572 2.723c0.453 0.257 0.845 0.634 1.123 1.117 0.838 1.452 0.336 3.311-1.12 4.16l1.572 2.723c0.448-0.261 0.967-0.41 1.522-0.41 1.675 0 3.033 1.362 3.042 3.046h3.145c-0.001-0.517 0.129-1.040 0.406-1.519 0.838-1.452 2.7-1.947 4.163-1.11l1.572-2.723c-0.45-0.257-0.839-0.633-1.116-1.113zM8 11.24c-1.789 0-3.24-1.45-3.24-3.24s1.45-3.24 3.24-3.24c1.789 0 3.24 1.45 3.24 3.24s-1.45 3.24-3.24 3.24z"></path>
            </symbol>
            <symbol id="icon-mail2" viewBox="0 0 16 16">
            <title>mail</title>
            <path d="M13.333 0h-10.666c-1.467 0-2.667 1.2-2.667 2.667v10.666c0 1.468 1.2 2.667 2.667 2.667h10.666c1.467 0 2.667-1.199 2.667-2.667v-10.666c0-1.467-1.2-2.667-2.667-2.667zM13.333 2c0.125 0 0.243 0.036 0.344 0.099l-5.678 4.694-5.677-4.694c0.101-0.063 0.219-0.099 0.344-0.099h10.666zM2.667 14c-0.030 0-0.060-0.002-0.089-0.006l3.525-4.89-0.457-0.457-3.646 3.646v-9.549l6 7.256 6-7.256v9.549l-3.646-3.646-0.457 0.457 3.525 4.89c-0.029 0.004-0.059 0.006-0.088 0.006h-10.666z"></path>
            </symbol>
            <symbol id="icon-twitter" viewBox="0 0 16 16">
            <title>twitter</title>
            <path d="M16 3.538c-0.588 0.263-1.222 0.438-1.884 0.516 0.678-0.406 1.197-1.050 1.444-1.816-0.634 0.375-1.338 0.65-2.084 0.797-0.6-0.638-1.453-1.034-2.397-1.034-1.813 0-3.281 1.469-3.281 3.281 0 0.256 0.028 0.506 0.084 0.747-2.728-0.138-5.147-1.444-6.766-3.431-0.281 0.484-0.444 1.050-0.444 1.65 0 1.138 0.578 2.144 1.459 2.731-0.538-0.016-1.044-0.166-1.488-0.409 0 0.013 0 0.028 0 0.041 0 1.591 1.131 2.919 2.634 3.219-0.275 0.075-0.566 0.116-0.866 0.116-0.212 0-0.416-0.022-0.619-0.059 0.419 1.303 1.631 2.253 3.066 2.281-1.125 0.881-2.538 1.406-4.078 1.406-0.266 0-0.525-0.016-0.784-0.047 1.456 0.934 3.181 1.475 5.034 1.475 6.037 0 9.341-5.003 9.341-9.341 0-0.144-0.003-0.284-0.009-0.425 0.641-0.459 1.197-1.038 1.637-1.697z"></path>
            </symbol>
            <symbol id="icon-github" viewBox="0 0 16 16">
            <title>github</title>
            <path d="M8 0.198c-4.418 0-8 3.582-8 8 0 3.535 2.292 6.533 5.471 7.591 0.4 0.074 0.547-0.174 0.547-0.385 0-0.191-0.008-0.821-0.011-1.489-2.226 0.484-2.695-0.944-2.695-0.944-0.364-0.925-0.888-1.171-0.888-1.171-0.726-0.497 0.055-0.486 0.055-0.486 0.803 0.056 1.226 0.824 1.226 0.824 0.714 1.223 1.872 0.869 2.328 0.665 0.072-0.517 0.279-0.87 0.508-1.070-1.777-0.202-3.645-0.888-3.645-3.954 0-0.873 0.313-1.587 0.824-2.147-0.083-0.202-0.357-1.015 0.077-2.117 0 0 0.672-0.215 2.201 0.82 0.638-0.177 1.322-0.266 2.002-0.269 0.68 0.003 1.365 0.092 2.004 0.269 1.527-1.035 2.198-0.82 2.198-0.82 0.435 1.102 0.162 1.916 0.079 2.117 0.513 0.56 0.823 1.274 0.823 2.147 0 3.073-1.872 3.749-3.653 3.947 0.287 0.248 0.543 0.735 0.543 1.481 0 1.070-0.009 1.932-0.009 2.195 0 0.213 0.144 0.462 0.55 0.384 3.177-1.059 5.466-4.057 5.466-7.59 0-4.418-3.582-8-8-8z"></path>
            </symbol>
            </defs>
          </svg>
          <script dangerouslySetInnerHTML={{__html: this.props.inlineScript}}></script>
          <section id="application" className="app-frame"
            dangerouslySetInnerHTML={{__html: this.props.markup}}>
          </section>
          <script dangerouslySetInnerHTML={{__html: this.props.state}}></script>
          <script src={this.props.mainScript}></script>
        </body>
      </html>
    );
  }
});

Html = provideContext(
  connectToStores(Html, ['ApplicationStore', 'BackgroundStore'], (context) => {
    return {
      currentPageTitle: context.getStore('ApplicationStore').getCurrentPageTitle(),
      imageServiceHost: context.getStore('BackgroundStore').getImageServiceUrl().replace(/https?\:/, '')
    };
  })
);

export default Html;

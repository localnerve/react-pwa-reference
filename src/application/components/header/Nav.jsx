/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import { NavLink } from 'fluxible-router';
import sizeAction from 'application/actions/size';
import { fluxibleWindowResizeReporter } from 'react-element-size-reporter';
import cx from 'classnames';

let Nav = React.createClass({
  propTypes: {
    selected: React.PropTypes.string.isRequired,
    links: React.PropTypes.array.isRequired
  },

  render: function () {
    const selected = this.props.selected,
      links = this.props.links,
      linkHTML = links.map(function (link) {
        return (
          <li className={cx({
            'navigation-link': true,
            selected: selected === link.page
          })} key={link.path}>
            <NavLink routeName={link.page}>{link.label}</NavLink>
          </li>
        );
      });
    return (
      <ul className="grid-row-spaced navigation">
        {linkHTML}
      </ul>
    );
  }
});

Nav = fluxibleWindowResizeReporter(Nav, '.navigation', sizeAction, {
  resizeWait: 50,
  sizeReporter: {
    reportTop: true,
    reportHeight: true,
    grow: {
      top: 5,
      height: 10
    }
  }
});

export default Nav;

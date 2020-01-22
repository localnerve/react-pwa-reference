/**
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

class ContactNav extends React.Component {
  static get propTypes () {
    return {
      stepCurrent: PropTypes.number.isRequired,
      stepFinal: PropTypes.number.isRequired,
      onPrevious: PropTypes.func.isRequired,
      nav: PropTypes.object.isRequired
    };
  }

  shouldComponentUpdate (nextProps) {
    return nextProps.stepCurrent !== this.props.stepCurrent;
  }

  render () {
    const last = this.props.stepCurrent === this.props.stepFinal;
    const nav = last ? [] : this.renderContactNav();

    return (
      <div className={cx({
        'form-navigation': true,
        hide: last
      })}>
        {nav}
      </div>
    );
  }

  renderContactNav () {
    const complete = this.props.stepCurrent === this.props.stepFinal - 1;
    const nextText = complete ? this.props.nav.next.last :
      this.props.nav.next.text;

    return [
      <button type="button"
        id="previous" name="previous" key="previous"
        value={this.props.nav.previous.text}
        title={this.props.nav.previous.help}
        className={cx({hide: this.props.stepCurrent === 0})}
        onClick={this.props.onPrevious}>
        <span>{this.props.nav.previous.text}</span>
      </button>,
      <button type="submit"
        id="submit" name="submit" key="submit"
        value={nextText}
        title={this.props.nav.next.help}
        className={cx({last: complete})}>
        <span>{nextText}</span>
      </button>
    ];
  }
}

export default ContactNav;

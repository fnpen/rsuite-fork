// @flow

import * as React from 'react';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { FormattedMessage } from 'rsuite-intl';

import { getUnhandledProps, prefix, defaultProps } from '../utils';

type Range = {
  label: React.Node,
  closeOverlay?: boolean,
  value: dayjs.Dayjs | ((pageDate?: dayjs.Dayjs) => dayjs.Dayjs)
};

type Props = {
  ranges: Array<Range>,
  className?: string,
  classPrefix?: string,
  pageDate?: dayjs.Dayjs,
  onShortcut?: (value: dayjs.Dayjs, closeOverlay?: boolean, event?: SyntheticEvent<*>) => void,
  onOk?: (event: SyntheticEvent<*>) => void,
  disabledHandle?: (date?: dayjs.Dayjs) => boolean
};

const defaultRanges = [
  {
    label: 'today',
    value: dayjs(),
    closeOverlay: true
  },
  {
    label: 'yesterday',
    value: dayjs().add(-1, 'd'),
    closeOverlay: true
  }
];

function hasLocaleKey(key: any) {
  return defaultRanges.some(item => item.label === key);
}

class Toolbar extends React.PureComponent<Props> {
  static defaultProps = {
    ranges: defaultRanges
  };

  addPrefix = (name: string) => prefix(this.props.classPrefix)(name);

  renderOkButton() {
    const { disabledHandle, pageDate, onOk } = this.props;
    const disabled = disabledHandle && disabledHandle(pageDate);
    const classes = classNames(this.addPrefix('right-btn-ok'), {
      [this.addPrefix('btn-disabled')]: disabled
    });
    return (
      <div className={this.addPrefix('right')}>
        <button className={classes} onClick={disabled ? undefined : onOk}>
          <FormattedMessage id="ok" />
        </button>
      </div>
    );
  }

  render() {
    const {
      ranges,
      onShortcut,
      disabledHandle,
      className,
      pageDate,
      classPrefix,
      ...rest
    } = this.props;

    const classes = classNames(classPrefix, className);
    const unhandled = getUnhandledProps(Toolbar, rest);

    return (
      <div {...unhandled} className={classes}>
        <div className={this.addPrefix('ranges')}>
          {ranges.map((item: Range, index: number) => {
            let value: any = typeof item.value === 'function' ? item.value(pageDate) : item.value;
            let disabled = disabledHandle && disabledHandle(value);
            let itemClassName = classNames(this.addPrefix('option'), {
              [this.addPrefix('option-disabled')]: disabled
            });
            return (
              <a
                /* eslint-disable */
                key={index}
                role="button"
                tabIndex="-1"
                className={itemClassName}
                onClick={event => {
                  !disabled && onShortcut && onShortcut(value, item.closeOverlay, event);
                }}
              >
                {hasLocaleKey(item.label) ? <FormattedMessage id={item.label} /> : item.label}
              </a>
            );
          })}
        </div>
        {this.renderOkButton()}
      </div>
    );
  }
}

const enhance = defaultProps({
  classPrefix: 'picker-toolbar'
});

export default enhance(Toolbar);

// @flow

import * as React from 'react';
import { findDOMNode } from 'react-dom'; /* eslint-disable react/no-find-dom-node */
import classNames from 'classnames';
import _ from 'lodash';
import { on, DOMMouseMoveTracker, addStyle, getWidth, getHeight, getOffset } from 'dom-lib';

import { getUnhandledProps, defaultProps, prefix } from './utils';
import Tooltip from './Tooltip';

type Props = {
  min: number,
  max: number,
  step: number,
  value?: number,
  defaultValue: number,
  className?: string,
  classPrefix?: string,
  handleClassName?: string,
  handleTitle?: React.Node,
  barClassName?: string,
  hanldeStyle?: Object,
  disabled?: boolean,
  graduated?: boolean,
  tooltip?: boolean,
  progress?: boolean,
  vertical?: boolean,
  onChange?: (value: number) => void
};

type State = {
  value: number,
  barWidth: number,
  barHeight: number,
  barOffset: Object,
  handleDown?: boolean
};

class Slider extends React.Component<Props, State> {
  static defaultProps = {
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 0,
    tooltip: true
  };

  constructor(props: Props) {
    super(props);

    this.state = {
      value: this.checkValue(props.value || props.defaultValue),
      barWidth: 0,
      barHeight: 0,
      barOffset: {}
    };
  }

  componentDidMount() {
    this.updateBar();
    this.onWindowResizeListener = on(window, 'resize', _.debounce(this.handleWindowResize, 100));
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.value !== this.props.value) {
      this.setState({
        value: nextProps.value
      });
    }
  }

  componentWillUnmount() {
    this.releaseMouseMoves();
    this.onWindowResizeListener && this.onWindowResizeListener.off();
  }

  onWindowResizeListener = null;
  getMouseMoveTracker() {
    return (
      this.mouseMoveTracker ||
      new DOMMouseMoveTracker(this.hanldeDragMove, this.hanldeDragEnd, document.body)
    );
  }

  getSplitCount() {
    const { max, min, step } = this.props;
    return (max - min) / step;
  }

  setValue(value: number) {
    const { onChange, min, max } = this.props;
    if (value < min) {
      value = min;
    }
    if (value > max) {
      value = max;
    }
    this.setState({ value });
    onChange && onChange(value);
  }

  setTooltipPosition() {
    const { tooltip } = this.props;
    if (tooltip) {
      const handle: any = findDOMNode(this.handle);
      const tip = handle.querySelector(`.${this.addPrefix('tooltip')}`);
      const width = getWidth(tip);
      addStyle(tip, 'left', `-${width / 2}px`);
    }
  }

  checkValue(value: number) {
    const { max, min } = this.props;
    if (value < min) {
      return min;
    }
    if (value > max) {
      return max;
    }
    return value;
  }

  /**
   * 通过偏移量计算值
   * @param {number} offset 偏移量
   */
  calculateValue(offset: number) {
    const { step, vertical } = this.props;
    const { barWidth, barHeight } = this.state;
    const count = this.getSplitCount();

    let value = 0;

    if (isNaN(offset)) {
      return value;
    }

    if (vertical) {
      value = Math.round(offset / (barHeight / count)) * step;
    } else {
      value = Math.round(offset / (barWidth / count)) * step;
    }

    return value;
  }

  hanldeClick = (event: SyntheticDragEvent<*>) => {
    if (this.props.disabled) {
      return;
    }

    const { vertical, min } = this.props;
    const { barOffset } = this.state;
    const offset = vertical ? event.pageY - barOffset.top : event.pageX - barOffset.left;
    this.setValue(this.calculateValue(offset) + min);
  };

  mouseMoveTracker = null;
  bar = null;
  handle = null;

  hanldeMouseDown = (event: SyntheticEvent<*>) => {
    if (this.props.disabled) {
      return;
    }

    this.mouseMoveTracker = this.getMouseMoveTracker();
    this.mouseMoveTracker.captureMouseMoves(event);
    this.setState({
      handleDown: true
    });
  };

  hanldeDragEnd = () => {
    this.releaseMouseMoves();
    this.setState({
      handleDown: false
    });
  };

  hanldeDragMove = (deltaX: number, deltaY: number, event: SyntheticDragEvent<*>) => {
    if (!this.mouseMoveTracker || !this.mouseMoveTracker.isDragging()) {
      return;
    }

    const { vertical, min } = this.props;
    const { barOffset } = this.state;
    const offset = vertical ? event.pageY - barOffset.top : event.pageX - barOffset.left;
    this.setValue(this.calculateValue(offset) + min);
    this.setTooltipPosition();
  };

  /**
   * 释放鼠标移动事件
   */
  releaseMouseMoves = () => {
    if (this.mouseMoveTracker) {
      this.mouseMoveTracker.releaseMouseMoves();
      this.mouseMoveTracker = null;
    }
  };

  handleWindowResize = () => {
    this.updateBar();
  };

  updateBar() {
    this.setState({
      barOffset: getOffset(this.bar),
      barWidth: getWidth(this.bar),
      barHeight: getHeight(this.bar)
    });
  }

  addPrefix = (name: string) => prefix(this.props.classPrefix)(name);

  /**
   * 渲染标尺
   */
  renderGraduated() {
    const { vertical, step, max, min } = this.props;
    const count = this.getSplitCount();
    const { barHeight, value } = this.state;
    const graduatedItems = [];
    const pass = value / step - min / step;
    const active = Math.ceil((value - min) / (max - min) * count);

    for (let i = 0; i < count; i += 1) {
      let style = {};
      let classes = classNames({
        [this.addPrefix('pass')]: i <= pass,
        [this.addPrefix('active')]: i === active
      });

      if (barHeight && vertical) {
        style.height = barHeight / count;
      }
      graduatedItems.push(
        <li className={classes} style={style} key={i}>
          {' '}
        </li>
      );
    }
    return (
      <div className={this.addPrefix('graduator')}>
        <ul>{graduatedItems}</ul>
      </div>
    );
  }

  renderHanlde() {
    const { handleClassName, handleTitle, max, min, vertical, tooltip, hanldeStyle } = this.props;
    const { value, handleDown } = this.state;

    const direction = vertical ? 'top' : 'left';
    const offset = {
      [direction]: `${(value - min) / (max - min) * 100}%`
    };
    const style = Object.assign({}, hanldeStyle, offset);

    // 通过 value 计算出手柄位置
    return (
      <div
        className={classNames(this.addPrefix('handle'), handleClassName, {
          [this.addPrefix('showtip')]: handleDown
        })}
        role="presentation"
        onMouseDown={this.hanldeMouseDown}
        style={style}
        ref={ref => {
          this.handle = ref;
        }}
      >
        {tooltip && (
          <Tooltip placement="top" className={this.addPrefix('tooltip')}>
            {value}
          </Tooltip>
        )}
        {handleTitle}
      </div>
    );
  }

  renderProgress() {
    const { vertical, max, min } = this.props;
    const { value } = this.state;
    const key = vertical ? 'height' : 'width';
    const style = {
      [key]: `${(value - min) / (max - min) * 100}%`
    };

    return <div style={style} className={this.addPrefix('progress-bar')} />;
  }

  render() {
    const {
      graduated,
      className,
      barClassName,
      progress,
      vertical,
      disabled,
      classPrefix,
      ...rest
    } = this.props;

    const { handleDown } = this.state;
    const classes = classNames(classPrefix, className, {
      [this.addPrefix('vertical')]: vertical,
      [this.addPrefix('disabled')]: disabled,
      [this.addPrefix('graduated')]: graduated,
      [this.addPrefix('dragging')]: handleDown
    });

    const unhandled = getUnhandledProps(Slider, rest);

    return (
      <div {...unhandled} className={classes} onClick={this.hanldeClick} role="presentation">
        <div
          className={classNames(this.addPrefix('bar'), barClassName)}
          ref={ref => {
            this.bar = ref;
          }}
        >
          {progress && this.renderProgress()}
          {graduated && this.renderGraduated()}
        </div>
        {this.renderHanlde()}
      </div>
    );
  }
}

export default defaultProps({
  classPrefix: 'slider'
})(Slider);
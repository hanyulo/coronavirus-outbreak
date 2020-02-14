import React, { Component } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const Container = styled.div`

`;

const Bar = styled.div`
  height: 13px;
  background: white;
  border-radius: 5px;
  position: relative;
  flex-grow: 1;
  margin-bottom: 14px;
`;

const Thumb = styled.div.attrs(props => ({
  style: {
    left: `${props.left || 0}%`,
  },
}))`
  position: absolute;
  top: 50%;
  border-radius: 5px;
  height: 20px;
  width: 11px;
  background-color: #A0A0A0;
  transform: translate(-50%, -50%);
  @media (max-width: 767px) {
    height: 25px;
    width: 14px;
  }
`;

const LabelRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const StartDate = styled.div`

`
const EndDate = styled.div`

`



class Slider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      xPosition: 0,
    };
    this.bar = null;
    this.onMouseDownHandler = this._onMouseDownHandler.bind(this);
    this.onMouseMoveHandler = this._onMouseMoveHandler.bind(this);
    this.onMouseUpHandler = this._onMouseUpHandler.bind(this);
    this.startXPosition = null;
    this.barWidth = null
    this.thumb = null;
    this.currentStep = 0;
  }

  componentWillUnmount() {
    // document.removeEventListener('mouseup', this.onMouseUpHandler)
  }

  componentDidMount() {

  }

  _passCurrentStep() {
    const { updateData, totalSteps } = this.props;
    const { xPosition } = this.state;
    const currentStep = Math.ceil(xPosition / (100 / totalSteps));
    if (currentStep !== this.currentStep && currentStep < totalSteps) {
      this.currentStep = currentStep;
      updateData(currentStep);
    }
  }

  _onMouseMoveHandler(e) {
    const pointer = e.touches ? e.touches[0] : e;
    const difference = pointer.clientX - this.startXPosition;
    const ratio = (difference / this.barWidth) * 100;
    if (difference <= 0) {
      this.setState({
        xPosition: 0,
      }, () => {
        this._passCurrentStep();
      });
      return;
    }
    if (ratio >= 0 && ratio <= 100) {
      this.setState({
        xPosition: ratio,
      }, () => {
        this._passCurrentStep();
      });
    }
  }

  _onMouseDragHandler() {

  }

  _onMouseDownHandler(e) {
    this.barWidth = this.bar.clientWidth;
    this.startXPosition = this.bar.getBoundingClientRect().left;
    document.addEventListener('mousemove', this.onMouseMoveHandler);
    document.addEventListener('touchmove', this.onMouseMoveHandler);
    document.addEventListener('mouseup', this.onMouseUpHandler);
    document.addEventListener('touchend', this.onMouseUpHandler);
  }

  _onMouseUpHandler(e) {
    document.removeEventListener('mousemove', this.onMouseMoveHandler);
    document.removeEventListener('touchmove', this.onMouseMoveHandler);
    document.removeEventListener('mouseup', this.onMouseUpHandler);
    document.removeEventListener('touchend', this.onMouseUpHandler);
  }

  render() {
    const { totalSteps, startLabel, endLabel } = this.props;
    const { xPosition } = this.state;
    return (
      <Container>
        <Bar
          type="range"
          ref={node => { this.bar = node; }}
        >
          <Thumb
            onTouchStart={this.onMouseDownHandler}
            onMouseDown={this.onMouseDownHandler}
            left={xPosition}
            ref={node => { this.thumb = node; }}
          />
        </Bar>
        <LabelRow>
          <StartDate>
            {startLabel}
          </StartDate>
          <EndDate>
            {endLabel}
          </EndDate>
        </LabelRow>
      </Container>
    );
  }
}

Slider.defaultProps = {
};

Slider.propTypes = {
  totalSteps: PropTypes.number.isRequired,
  updateData: PropTypes.func.isRequired,
  startLabel: PropTypes.string.isRequired,
  endLabel: PropTypes.string.isRequired,
};

export default Slider;

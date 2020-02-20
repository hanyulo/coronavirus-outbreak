import React, { Component } from 'react';
import styled from 'styled-components';
import ReactDOM from 'react-dom';


const Mask = styled.div`

`;


class Modal extends Component {
  constructor(props) {
    super(props);
    this.node = null;
  }

  componentDidMount() {
    this.node = document.createElement('div');
    this.node.className = 'hans-modal';
    document.body.appendChild(this.node);
    this._renderPortal();
  }

  _renderPortal() {
    const { children } = this.props;
    return ReactDOM.createPortal(
      children,
      this.node,
    );
  }

  render() {
    const { children } = this.props;

    if (!this.node) {
      this.node = document.createElement('div');
    }

    return ReactDOM.createPortal(
      children,
      this.node,
    );
  }
}

export default Modal;

import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  width: 400px;
  height: 400px;
  border: 1px solid black;
  margin: 0 auto;
`;

const MySvg = styled.svg`
  width: 400px;
  height: 400px;
`;

const SvgBasic = () => {
  return (
    <Container>
      <MySvg xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(150, 150) scale(0.5, 0.5)" fill="green" stroke="red" strokeWidth="2">
          <circle cx="100" cy="100" r="50" />
        </g>
      </MySvg>
    </Container>

  );
}

export default SvgBasic;

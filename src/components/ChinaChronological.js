import React, { Component } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import geoWorld from '../data/world.topojson';

const Canvas = styled.div`
  max-width: 600px;
  margin: 0 auto;
  margin-top: 20px;
  border: 1px solid black;
`;


const Geo = styled.svg`
  width: 600px;
  height: 600px;
`;


const Path = styled.path`

`


class ChinaChronological extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
    };
    this.geo = null;
  }

  componentDidMount() {
    if (this.geo) {
      this._drawGeo();
    }
  }

  _drawGeo() {
    const projection = d3
      .geoEquirectangular()
      .translate([300, 300])
      .scale(100)
    const path = d3.geoPath(projection);
    const countries = topojson.feature(geoWorld, geoWorld.objects.countries).features;
    d3
      .select(this.geo)
      .selectAll('path')
      .data(countries)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', '#cccccc')
      .attr('stroke', '#333')
      .attr('stroke-width', '0.5')
      .on('click', () => {
        d3.select(this).attr('fill', 'blue')
      });
  }

  render() {
    return (
      <Canvas>
        <Geo
          ref={(node) => { this.geo = node; }}
        />
      </Canvas>
    );
  }
}

export default ChinaChronological;

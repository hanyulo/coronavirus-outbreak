import React, { Component } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import cn from '../data/zh-mainland-provinces.topojson';
import global from '../data/world.topojson';

const width = 700;
const height = 500;
const DEFAULT_MAP_COLOE = '#ACB9BF';
const BORDER_COLOR = '#333';
const HOVER_COLOR = '#0083CB';

const Canvas = styled.div`
  width: ${width};
  margin: 0 auto;
  margin-top: 20px;
  border: 1px solid black;
`;

const Geo = styled.svg`
  margin: 0 auto;
  width: ${width}px;
  height: ${height}px;
`;

const ToolTip = styled.div`
  color: #222;
  background: #fff;
  border-radius: 3px;
  box-shadow: 0px 0px 2px 0px #a6a6a6;
  padding: .2em;
  text-shadow: #f5f5f5 0 1px 0;
  opacity: 0.9;
  position: absolute;
  display: none;
`;


class ChinaChronological extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
    };
    this.geo = null;
    this.tooltip = null;
  }

  componentDidMount() {
    if (this.geo) {
      this._drawChina();
    }
  }

  _drawChina() {
    const projection = d3
      .geoMercator()
      .scale(600)
      .center([104.4898, 37.5854])
      .translate([width / 2, height / 2])

    const path = d3.geoPath(projection);
    // const countries = topojson.feature(global, global.objects.countries).features;
    const provinces = topojson.feature(cn, cn.objects.provinces).features;
    const tooltip = d3.select(this.tooltip);
    const truncateSimplifiedMandarine = str => (str && typeof str === 'string') ? str.split('|')[0] : '';
    d3
      .select(this.geo)
      .selectAll('path')
      .data(provinces)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', DEFAULT_MAP_COLOE)
      .attr('stroke', BORDER_COLOR)
      .attr('stroke-width', '0.5')
      .on('mouseover', function (d) {
        d3
          .select(this)
          .attr('fill', HOVER_COLOR)
          .attr('stroke-width', 2);
        tooltip.style('display', 'block').html(truncateSimplifiedMandarine(d.properties.name_local));
      })
      .on('mousemove', (d) => {
        tooltip
          .style('top', `${d3.event.pageY}px`)
          .style('left', `${d3.event.pageX + 10}px`)
          .html(truncateSimplifiedMandarine(d.properties.name_local));
      })
      .on('mouseout', function () {
        d3
          .select(this)
          .attr('fill', DEFAULT_MAP_COLOE)
          .attr('stroke-width', 1);
        tooltip.style('display', 'none');
      });
  }

  render() {
    return (
      <Canvas>
        <Geo
          ref={(node) => { this.geo = node; }}
        />
        <ToolTip
          ref={(node) => { this.tooltip = node; }}
        />
      </Canvas>
    );
  }
}

export default ChinaChronological;

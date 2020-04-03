import React, { useEffect, memo, useState } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import versor from 'versor';
import countries from '../data/countries.json';
import { formatNumber } from '../utils';
import { getTooltipContent, getConfirmedCount } from '../utils/earth';


const scaleRatio = 0.5;

const DEFAULT_MAP_COLOR = '#DADADA';

// const mapLegends = ['0', '1 - 50', '51 - 500', '500 +', '3,000 +', '6,000 +', '80,000 +'];

const stageColorMap = {
  0: DEFAULT_MAP_COLOR,
  1: '#F4E2EE',
  2: '#DBAAC9',
  3: '#963671',
  4: '#CD4266',
  5: '#D01645',
  6: '#7B0221',
};

const getInfectedStageFromCount = (count) => {
  if (count === 0 || !count) {
    return 0;
  }
  if (count >= 1 && count <= 50) {
    return 1;
  }
  if (count >= 51 && count <= 500) {
    return 2;
  }
  if (count >= 501 && count <= 3000) {
    return 3;
  }
  if (count >= 3001 && count <= 6000) {
    return 4;
  }
  if (count >= 6001 && count <= 80000) {
    return 5;
  }
  if (count > 80000) {
    return 6;
  }
  return 0;
};


const Container = styled.div`
  margin: 0 auto;
  width: 100%;
  background-color: #2B2828;
`;

const SVG = styled.svg`
  width: 100%;
  height: 100%;
`;

const ToolTip = styled.div`
  color: #222;
  background: #fff;
  border-radius: 3px;
  box-shadow: 0px 0px 2px 0px #a6a6a6;
  padding: .5em;
  text-shadow: #f5f5f5 0 1px 0;
  opacity: 0.9;
  position: fixed;
  display: none;
`;


function Earth({
  data,
}) {
  let containerNode = null;
  let svgNode = null;
  let gNode = null;
  let tooltipNode = null;
  function cleanCanvas() {
    d3
      .select(gNode)
      .selectAll('path')
      .remove();
  }
  function drawEarth() {
    const { clientWidth } = containerNode;
    const clientHeight = clientWidth;
    containerNode.style.height = `${clientHeight}px`;
    const scaleValue = clientWidth * scaleRatio;
    const projection = d3
      .geoOrthographic()
      .translate([clientWidth / 2, clientHeight / 2])
      .scale(scaleValue)
      .clipAngle(90 + 1e-6)
      .precision(1)
      .rotate([-120, -20]);
    const path = d3.geoPath(projection);
    const d3SelectedG = d3.select(gNode);
    const d3SelectedTooltip = d3.select(tooltipNode);
    const graticule = d3.geoGraticule()
      .step([10, 10]);
    const allCountries = topojson.feature(countries, countries.objects.countries).features;

    d3SelectedG
      .append('path')
      .datum(graticule)
      .attr('class', 'graticule')
      .attr('d', path)
      .style('fill', '#2B2828')
      .style('stroke', 'white')
      .style('stroke-dasharray', ('1', '1'))
      .attr('stroke-width', 0.2);

    d3SelectedG
      .selectAll('.subunit')
      .data(allCountries)
      .enter()
      .append('path')
      .attr('class', 'subunit')
      .attr('d', path)
      .attr('fill', (d) => stageColorMap[getInfectedStageFromCount(getConfirmedCount({ data, propertyName: d.properties.name }))])
      .attr('stroke', 'white')
      .attr('stroke-width', 0.5)
      .on('mouseover', function (d) {
        const {
          name,
          confirmed,
        } = getTooltipContent({
          data,
          propertyName: d.properties.name,
        });
        d3
          .select(this)
          .attr('stroke-width', 1);
        d3SelectedTooltip.style('display', 'block').html(`
          <div>
            <div>${name}</div>
            <div>
              確診：${confirmed}
            </div>
          </div>
        `);
      })
      .on('mousemove', (d) => {
        const {
          name,
          confirmed,
        } = getTooltipContent({
          data,
          propertyName: d.properties.name,
        });
        let positionX = d3.event.clientX + 10;
        const positionY = d3.event.clientY;
        const tooltipRect = tooltipNode.getBoundingClientRect();
        if ((positionX + tooltipRect.width) > window.innerWidth) {
          positionX = d3.event.clientX - tooltipRect.width - 10;
        }
        d3SelectedTooltip
          .style('top', `${positionY}px`)
          .style('left', `${positionX}px`)
          .html(`
            <div>
              <div>${name}</div>
              <div>
                確診：${confirmed}
              </div>
            </div>
          `);
      })
      .on('mouseout', function () {
        d3
          .select(this)
          .attr('stroke-width', 0.5);
        d3SelectedTooltip.style('display', 'none');
      });

    let v0 = null;
    let r0 = null;
    let q0 = null;

    const angles = ["λ", "φ", "γ"];
    function update(eulerAngles){
      angles.forEach(function(angle, index){
        d3.select(".angle-label-" + index + " span").html(Math.round(eulerAngles[index]))
        d3.select(".angle-" + index).property("value", eulerAngles[index])
      });
      projection.rotate(eulerAngles);
    }


    function dragstarted() {
      const mousePosition = d3.mouse(this);
      v0 = versor.cartesian(projection.invert(mousePosition));
      r0 = projection.rotate();
      q0 = versor(r0);
      d3SelectedG
        .insert('path')
        .datum({
          type: 'Point',
          coordinates: projection.invert(mousePosition),
        })
        .attr('class', 'point point-mouse')
        .attr('d', path);
    }

    function dragged() {
      const mousePosition = d3.mouse(this);
      const v1 = versor.cartesian(projection.rotate(r0).invert(mousePosition));
      const q1 = versor.multiply(q0, versor.delta(v0, v1));
      const r1 = versor.rotation(q1);
      if (r1) {
        update(r1);
        d3SelectedG
          .selectAll('path').attr('d', path);
        d3SelectedG
          .selectAll('.point-mouse')
          .datum({
            type: 'Point',
            coordinates: projection.invert(mousePosition)
          });
      }
    }

    function dragended() {
      d3SelectedG
        .selectAll('.point')
        .remove();
    }

    const drag = d3.drag();
    drag
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);

    d3SelectedG.call(drag);
  }

  useEffect(() => {
    d3.select(window).on(`resize.${Earth.name}`, () => {
      cleanCanvas();
      drawEarth();
    });
  });

  useEffect(() => {
    cleanCanvas();
    drawEarth();
  }, [data]);
  return (
    <Container
      ref={(node) => { containerNode = node; }}
    >
      <SVG
        ref={(node) => { svgNode = node; }}
      >
        <g
          ref={(node) => { gNode = node; }}
        />
      </SVG>
      <ToolTip
        ref={(node) => { tooltipNode = node; }}
      />
    </Container>
  );
}

export default memo(Earth);

import React, { useEffect, memo } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import versor from 'versor';
import countries from '../data/countries.json';

const scaleRatio = 0.5;

const Container = styled.div`
  margin: 0 auto;
  width: 100%;
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


function Earth() {
  let containerNode = null;
  let svgNode = null;
  let gNode = null;
  let tooltipNode = null;

  useEffect(() => {
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
        .rotate([-100, -40]);
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
        .style('fill', '#fff')
        .style('stroke', '#ccc')

      d3SelectedG
        .selectAll('.subunit')
        .data(allCountries)
        .enter()
        .append('path')
        .attr('class', 'subunit')
        .attr('d', path)
        .attr('fill', (d) => 'black')
        .attr('stroke', 'white')
        .attr('stroke-width', 0.5)
        .on('mouseover', function (d) {
          d3
            .select(this)
            .attr('stroke-width', 1);
          d3SelectedTooltip.style('display', 'block').html(`
            <div>
              ${d.properties.name}
            </div>
          `);
        })
        .on('mousemove', (d) => {
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
                ${d.properties.name}
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
    drawEarth();
  });
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
  )
}

export default memo(Earth);

import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import provinces from '../data/china-provinces-tranditional.json';
import prefectures from '../data/china-prefectural-cities/congregated-data-geo-tranditional.json';
import ZoomResetIcon from '../assets/zoom_reset_icon_dark.svg';


const width = 650;
const mapRatio = 0.72;
const scaleRatio = 0.88;
const centerChinaLongtitude = 104.4898;
const centerChinaLatitude = 37.5854;
const DEFAULT_MAP_COLOR = '#DADADA';
const DEFAULT_STROKE_COLOR = 'white';
const DEFAULT_STROKE_WIDTH = 0.5;


const Container = styled.div`
  border: 1px solid black;
  margin: 0 auto;
  width: ${width};
  height: ${width * mapRatio};
  overflow: hidden;
  position: relative;
  background-color: #EEEEEE;
`;

const SVG = styled.svg`
  width: 100%;
  height: 100%;
`;

const ZoomResetButton = styled.div`
  position: absolute;
  bottom: 3px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  > svg {
    margin-right: 10px;
  }
`;

const isProvince = (d) => d.properties.level === 'province';




function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}


function PrefecturalChinaRefactor() {
  let container = null;
  let svg = null;
  let g = null;
  let currentAutoScaleValue = 1;
  let currentTranslatedX = 0;
  let currentTranslatedY = 0;
  const zoom = d3.zoom();
  const [centeredProvince, setCenteredProvince] = useState(null);
  const previousCenteredProvince = usePrevious(centeredProvince);

  function setContainerRef(node) {
    if (node) {
      container = node;
    }
  }

  function setSVGRef(node) {
    if (node) {
      svg = node;
    }
  }

  function setGRef(node) {
    if (node) {
      g = node;
    }
  }

  const onClickProvince = ({
    d,
  }) => {
    if ((d.properties.level === 'province' && centeredProvince && d.properties.adcode !== centeredProvince.properties.adcode) || (d.properties.level === 'province' && !centeredProvince)) {
      setCenteredProvince(d);
    }
  };

  const clearProvince = () => {
    setCenteredProvince(null);
  };


  function resetCustomizedHook() {
    const d3SelectedG = d3.select(g);
    const d3SelectedSVG = d3.select(svg);
    d3SelectedG
      .selectAll('path')
      .transition()
      .duration(750)
      .attr('transform', `scale(${1}) translate(${0}, ${0})`)
      .end()
      .then(() => {
        d3SelectedSVG.call(zoom.transform, d3.zoomIdentity);
      })
      .catch((e) => {
        console.log('transition error: ', e);
      });
  }

  const autoZoomIn = ({
    d,
    path,
    g,
    container,
    previousCenteredProvince,
  }) => {
    let x = 0;
    let y = 0;
    let scaleValue = 1;
    const bounds = path.bounds(d);
    const centroidX = (bounds[0][0] + bounds[1][0]) / 2;
    const centroidY = (bounds[0][1] + bounds[1][1]) / 2;
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];
    const { clientWidth, clientHeight } = container;
    const d3SelectedG = d3.select(g);
    const d3SelectedSVG = d3.select(svg)
    scaleValue = Math.min(clientWidth / dx, clientHeight / dy) * 0.95;
    x = clientWidth / 2 - centroidX * scaleValue;
    y = clientHeight / 2 - centroidY * scaleValue;
    currentAutoScaleValue = scaleValue;
    currentTranslatedX = x;
    currentTranslatedY = y;

    d3SelectedSVG.call(zoom.transform, d3.zoomIdentity);

    if (previousCenteredProvince && (previousCenteredProvince.properties.adcode === d.properties.parent.adcode)) {
      return;
    }

    if (previousCenteredProvince) {
      d3SelectedG
        .selectAll('path.prefecture')
        .filter((prefecture) => prefecture.properties.parent.adcode === previousCenteredProvince.properties.adcode)
        .style('display', 'none');

      d3SelectedG
        .selectAll('path.province')
        .filter((province) => province.properties.adcode === previousCenteredProvince.properties.adcode)
        .attr('stroke-width', `${DEFAULT_STROKE_WIDTH}`);
    }

    currentAutoScaleValue = scaleValue;

    d3SelectedG
      .transition()
      .duration(750)
      .attr('transform', `translate(${x}, ${y}) scale(${scaleValue})`)
      .end()
      .then(() => {

      })
      .catch((e) => {
        console.log('transition error');
      });

    d3SelectedG
      .selectAll('path.prefecture')
      .filter((prefecture) => prefecture.properties.parent.adcode === d.properties.adcode)
      .style('display', 'block')
      .attr('stroke-width', `${DEFAULT_STROKE_WIDTH / scaleValue}`);

    d3SelectedG
      .selectAll('path.province')
      .filter((province) => province.properties.adcode === d.properties.adcode)
      .attr('stroke-width', `${(DEFAULT_STROKE_WIDTH * 10) / scaleValue}`)
  };


  const autoZoomOut = ({
    g,
    previousCenteredProvince,
  }) => {
    const x = 0;
    const y = 0;
    const scaleValue = 1;

    const d3SelectedG = d3.select(g);
    resetCustomizedHook();
    currentAutoScaleValue = 1;

    d3SelectedG
      .transition()
      .duration(750)
      .attr('transform', `translate(${x}, ${y}) scale(${scaleValue}) `)
      .end()
      .then(() => {

      })
      .catch((e) => {
        console.log('transition error');
      });

    d3SelectedG
      .selectAll('path.prefecture')
      .filter((prefecture) => prefecture.properties.parent.adcode === previousCenteredProvince.properties.adcode)
      .style('display', 'none');

    d3SelectedG
      .selectAll('path.province')
      .filter((province) => province.properties.adcode === previousCenteredProvince.properties.adcode)
      .attr('stroke-width', `${DEFAULT_STROKE_WIDTH}`)
  };




  function drawChina() {
    const { clientWidth, clientHeight } = container;
    const scaleValue = clientWidth * scaleRatio;
    const projection = d3
      .geoMercator()
      .scale(scaleValue)
      .center([centerChinaLongtitude, centerChinaLatitude])
      .translate([clientWidth / 2, clientHeight / 2]);
    const path = d3.geoPath(projection);
    const d3SelectedG = d3.select(g);
    d3SelectedG
      .selectAll('path')
      .data([...provinces.features, ...prefectures.features])
      .enter()
      .append('path')
      .attr('d', path)
      .attr('class', (d) => {
        if (isProvince(d)) {
          return 'province';
        }
        return 'prefecture';
      })
      .style('display', (d) => {
        if (isProvince(d)) {
          return 'block';
        }
        return 'none';
      })
      .attr('fill-opacity', (d) => {
        if (isProvince(d)) {
          return '1';
        }
        return '0';
      })
      .attr('fill', (d) => {
        if (isProvince(d)) {
          return DEFAULT_MAP_COLOR;
        }
        return 'transparent';
      })
      .attr('stroke', DEFAULT_STROKE_COLOR)
      .attr('fill', DEFAULT_MAP_COLOR)
      .attr('stroke-width', `${DEFAULT_STROKE_WIDTH}`)
      .on('click', (d) => {
        onClickProvince({
          d,
        });
      });

    if (centeredProvince) {
      autoZoomIn({
        d: centeredProvince,
        path,
        g,
        container,
        previousCenteredProvince,
      });
    }
    if (previousCenteredProvince && !centeredProvince) {
      autoZoomOut({
        g,
        previousCenteredProvince,
      });
    }
  }

  function hookUpCustomizedZoom() {
    const d3SelectedSVG = d3.select(svg);
    const d3SelectedG = d3.select(g);
    zoom
      .scaleExtent([1, 8])
      .on('zoom', () => {
        const translatedTransform = d3.event.transform.translate(currentTranslatedX, currentTranslatedY);
        const scaledTransform = translatedTransform.scale(currentAutoScaleValue);
        const { x, y, k } = scaledTransform;
        d3SelectedG
          .attr('transform', `translate(${x}, ${y}) scale(${k})`);
      });
    d3SelectedSVG
      .call(zoom);
  }

  useEffect(() => {
    drawChina(centeredProvince);
    hookUpCustomizedZoom();
    return () => {

    }
  }, [centeredProvince]);

  return (
    <Container
      ref={(node) => { setContainerRef(node); }}
    >
      <SVG
        ref={(node) => { setSVGRef(node); }}
      >
        <g
          ref={(node) => { setGRef(node); }}
        />
      </SVG>
      <ZoomResetButton
        zoomed={centeredProvince}
        onClick={() => {
          clearProvince();
        }}
      >
        <ZoomResetIcon />
        <span>回上一層</span>
      </ZoomResetButton>
    </Container>
  );
}

export default PrefecturalChinaRefactor;

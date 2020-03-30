import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import provinces from '../data/china-provinces-tranditional.json';
import prefectures from '../data/china-prefectural-cities/congregated-data-geo-tranditional.json';
import ZoomResetIconDark from '../assets/zoom_reset_icon_dark.svg';
import ZoomResetIconLight from '../assets/zoom_reset_icon.svg'
import { formatNumber } from '../utils';


const width = 650;
const mapRatio = 0.72;
const scaleRatio = 0.88;
const centerChinaLongtitude = 104.4898;
const centerChinaLatitude = 37.5854;
const DEFAULT_MAP_COLOR = '#DADADA';
const DEFAULT_STROKE_COLOR = 'white';
const DEFAULT_STROKE_WIDTH = 0.5;
const breakPoint = '910px';

const mapLegends = ['0', '1 - 50', '51 - 100', '100 +', '1000 +', '5,000 +', '10,000 +'];


const stageColorMap = {
  0: DEFAULT_MAP_COLOR,
  1: '#FAF4C0',
  2: '#FFE09D',
  3: '#F2A966',
  4: '#D493BC',
  5: '#803D79',
  6: '#270048',
};

const getInfectedStageFromCount = (count) => {
  if (count === 0) {
    return 0;
  }
  if (count >= 1 && count <= 50) {
    return 1;
  }
  if (count >= 51 && count <= 100) {
    return 2;
  }
  if (count >= 101 && count <= 1000) {
    return 3;
  }
  if (count >= 1001 && count <= 5000) {
    return 4;
  }
  if (count >= 5001 && count <= 10000) {
    return 5;
  }
  if (count >= 10001 && count <= 100000) {
    return 6;
  }
  return 0;
};


const Container = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: ${width};
  height: ${width * mapRatio};
  position: relative;
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
  cursor: ${props => (props.zoomed ? 'pointer' : 'not-allowed')};
  color: ${props => (props.zoomed ? 'black' : '#d1d1d1')};
  > svg {
    margin-right: 10px;
  }
`;

const ToolTipWrapper = styled.div`
  right: 0;
  bottom: 0;
  position: absolute;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  transform: translate(100%, 0);
  @media (max-width: ${breakPoint}) {
    transform: translate(0,100%);
    bottom: -3px;
  }
`;

const ToolTip = styled.div`
  min-width: 180px;
  min-height: 157px;
  color: #222;
  background: #fff;
  border: 1px solid #707070;
  color: black;
  > div {
    padding: 16px;
  }
  > div > div {
    &:nth-child(3) {
      margin: 8px 0;
    }
  }
  > div > div {
    &:nth-child(1) {
      border-bottom: 1px solid black;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
  }
`;

const LegendContainer = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  font-size: 12px;
  transform: translate(-100%, 0);
  @media (max-width: ${breakPoint}) {
    transform: translate(0,100%);
    bottom: -3px;
  }
`;

const LegendsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 10px 0;
  @media (max-width: 910px) {
    display: grid;
    grid-template-columns: auto auto auto auto;
    > div {
      padding-right: 15px;
    }
  }
  @media (max-width: 767px) {
    display: grid;
    grid-template-columns: auto auto auto;
    > div {
      padding-right: 10px;
    }
  }
  @media (max-width: 470px) {
    display: grid;
    grid-template-columns: auto auto;
    > div {
      padding-right: 10px;
    }
  }
  @media (max-width: 373px) {
    display: grid;
    grid-template-columns: auto;
    > div {
      padding-right: 5px;
    }
  }
`;

const Legend = styled.div`
  white-space: nowrap;
  padding: 5px 0 5px 0;
  display: flex;
  align-items: center;
`;

const ColorIcon = styled.div`
  width: 10px;
  height: 10px;
  background-color: ${props => props.backgrounColor || 'white'};
  border-radius: 50%;
  margin-right: 5px;
`;


const isProvince = (d) => d.properties.level === 'province';

const colorProcessor = ({
  d,
  isProvince,
  data,
}) => {
  if (!data) {
    return stageColorMap[0];
  }
  const { adcode } = d.properties;
  const entities = isProvince ? data.provinces : data.cities;
  if (!entities[adcode]) {
    // console.log('adcode: ', adcode)
  }
  const stage = getInfectedStageFromCount((entities[adcode] && entities[adcode].confirmedCount) || 0);
  return stageColorMap[stage];
};

const generateTooltipContent = ({ name, adcode, data }) => {
  const emptyString = '目前尚無數據';
  if (!data) {
    return `
      <div>
        <div>${name}</div>
        <div>${emptyString}</div>
      </div>
    `;
  }
  const entity = data[adcode];
  if (!entity) {
    // console.log('has no data for the area - adcode ', adcode);
    return `
      <div>
        <div>${name}</div>
        <div>${emptyString}</div>
      </div>
    `;
  }
  const {
    confirmedCount,
    currentConfirmedCount,
    suspectedCount,
    curedCount,
    deadCount,
  } = entity;
  return `
    <div>
      <div>
        ${name}
      </div>
      <div>
        確診：${formatNumber(confirmedCount)}
      </div>
      <div>
        死亡：${formatNumber(deadCount)}
      </div>
      <div>
        康復：${formatNumber(curedCount)}
      </div>
    </div>
  `;
};



function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}


function PrefecturalChinaRefactor({
  countryData,
  data,
}) {
  let container = null;
  let svg = null;
  let g = null;
  let tooltipNode = null;
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
      // const d3SelectedG = d3.select(g);
      // d3SelectedG
      //   .selectAll('path.prefecture')
      //   .filter((prefecture) => prefecture.properties.parent.adcode === d.properties.adcode)
      //   .style('display', 'block')
      //
      // d3SelectedG
      //   .selectAll('path.province')
      //   .filter((province) => province.properties.adcode === d.properties.adcode)
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
      .attr('stroke', 'black')
      .attr('stroke-width', `${(DEFAULT_STROKE_WIDTH * 3) / scaleValue}`);

    // d3SelectedG
    //   .selectAll('path.province')
    //   .attr('display', 'none')
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

  function cleanCanvas() {
    d3
      .select(svg)
      .selectAll('path')
      .remove();
  }


  function drawChina() {
    const { clientWidth } = container;
    const clientHeight = clientWidth * mapRatio;
    container.style.height = `${clientHeight}px`;
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
        return '1';
      })
      .attr('stroke', DEFAULT_STROKE_COLOR)
      .attr('fill', (d) => {
        return colorProcessor({
          d,
          isProvince: isProvince(d),
          data,
        });
      })
      .attr('stroke-width', `${DEFAULT_STROKE_WIDTH}`)
      .on('click', (d) => {
        onClickProvince({
          d,
        });
      })
      .on('mouseover', (d) => {
        const d3SelectedTooltip = d3.select(tooltipNode);
        const getTooltipData = (d, data) => {
          if (!data) {
            return null;
          }
          return isProvince(d) ? data.provinces : data.cities;
        };
        d3SelectedTooltip
          .style('display', 'block')
          .html(generateTooltipContent({
            name: d.properties.name,
            adcode: d.properties.adcode,
            data: getTooltipData(d, data),
          }));
      })

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

  function renderDefaultToolTipContent() {
    if (!countryData || !tooltipNode) {
      return null;
    }
    const { confirmedCount, deadCount, curedCount } = countryData;
    if (tooltipNode) {
      tooltipNode.innerHTML = `
        <div>
          <div>中國</div>
          <div>
            確診：${formatNumber(confirmedCount)}
          </div>
          <div>
            死亡：${formatNumber(deadCount)}
          </div>
          <div>
            康復：${formatNumber(curedCount)}
          </div>
        </div>
      `;
    }
  }

  function renderLegend() {
    const dateObject = data ? new Date(data.latestUpdatedTimeStamp) : null;
    const dateString = dateObject ? `${dateObject.getFullYear()}/${dateObject.getMonth() + 1}/${dateObject.getDate()}` : '';
    const Legends = mapLegends.map((label, index) => {
      return (
        <Legend
          key={`${index}_${label}`}
        >
          <ColorIcon
            backgrounColor={stageColorMap[index]}
          />
          <span>{label}</span>
        </Legend>
      );
    });
    return (
      <LegendContainer>
        <div>確診人數</div>
        <LegendsWrapper>
          {Legends}
        </LegendsWrapper>
        <div>更新時間：{dateString}</div>
      </LegendContainer>
    );
  }

  useEffect(() => {
    d3.select(window).on(`resize.${PrefecturalChinaRefactor.name}`, () => {
      cleanCanvas();
      drawChina();
    });
  });

  useEffect(() => {
    cleanCanvas();
    drawChina();
    hookUpCustomizedZoom();
    return () => {

    }
  }, [centeredProvince, data]);

  useEffect(() => {
    renderDefaultToolTipContent();
  }, [countryData]);

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
        {centeredProvince ? <ZoomResetIconDark /> : <ZoomResetIconLight />}
        <span>回上一層</span>
      </ZoomResetButton>
      <ToolTipWrapper>
        <ToolTip
          ref={(node) => { tooltipNode = node; }}
        />
      </ToolTipWrapper>
      {renderLegend()}
    </Container>
  );
}

export default PrefecturalChinaRefactor;

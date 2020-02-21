import React, { PureComponent } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import provinces from '../data/china-provinces-tranditional.json';
import prefectures from '../data/china-prefectural-cities/congregated-data-geo-tranditional.json';
import { formatNumber } from '../utils';
// import InfoIcon from '../assets/map_legend_info_icon.svg';
import ZoomResetIcon from '../assets/zoom_reset_icon_dark.svg';
// import Modal from './Modal';


const width = 650;
const mapRatio = 0.72;
const scaleRatio = 0.88;
const height = width * mapRatio;
const centerChinaLongtitude = 104.4898;
const centerChinaLatitude = 37.5854;
const DEFAULT_MAP_COLOR = '#DADADA';

const breakPoint = '910px';

const mapLegends = ['0', '1 - 50', '51 - 100', '100 +', '1000 +', '5,000 +', '10,000 +'];


const strokeWidth = {
  default: 0.2,
  focus: 0.4,
  howverFocus: 0.4,
};

const strokeColor = {
  default: 'white',
  focus: '#333',
};

const Container = styled.div`
  margin: 0 auto;
  width: 100%;
`;


const CanvasContainer = styled.div`
  max-width: ${width}px;
  box-sizing: border-box;
  margin: 20px auto;
  position: relative;
`;

const SubCanvasContainer = styled.div`
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
`;

const Map = styled.svg`
  width: 100%;
  height: ${height}px;
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

const ColorIcon = styled.div`
  width: 10px;
  height: 10px;
  background-color: ${props => props.backgrounColor || 'white'};
  border-radius: 50%;
  margin-right: 5px;
`;

const Legend = styled.div`
  white-space: nowrap;
  padding: 5px 0 5px 0;
  display: flex;
  align-items: center;
`;

const InfoIconContainer = styled.div`
  margin: 8px 0 7px 0;
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


const ResetZoom = styled.div`
  position: absolute;
  bottom: 3px;
  right: 8px;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  color: #000000;
  cursor: pointer;
  > svg {
    margin-right: 10px;
  }
`;


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


class PrefecturalChinaV2 extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      test: null,
    };
    const { data } = props;
    this.map = null;
    this.canvasContainer = null;
    this.centered = null;
    this.tooltip = null;
    this.isTransitioning = null;
    this.updateLegendStage = this._updateLegendStage.bind(this);
    this.zoom = null;
    this.hookUpZoomMap = null;
  }

  componentDidMount() {
    this._hookupZoom();

    d3.select(window).on(`resize.${PrefecturalChinaV2.name}`, () => {
      this._cleanCanvas();
      this._drawChina();
    });
    this._drawChina();
  }

  componentDidUpdate() {
    this._cleanCanvas();
    this._drawChina();
  }

  _hookupZoom() {
    const { clientWidth } = this.canvasContainer;
    const scaleValue = clientWidth * scaleRatio;
    const map = d3.select(this.map);
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', () => { this._customizedZoom(map); });
    map.call(zoom);
    this.hookUpZoomMap = map;
    this.zoom = zoom;
  }

  _customizedZoom(map) {
    // const { k,x,y } = d3.event.transform;
    map
      .selectAll('path') // To prevent stroke width from scaling
      .attr('transform', d3.event.transform);
  }

  _resetCustomizedZoom(d3SelectedMap) {
    d3SelectedMap
      .selectAll('path')
      .transition()
      .duration(750)
      .attr('transform', `scale(${1}) translate(${0}, ${0})`)
      .end()
      .then(() => {
        if (this.hookUpZoomMap && this.zoom) {
          this.hookUpZoomMap.call(this.zoom.transform, d3.zoomIdentity);
        }
      })
      .catch((e) => {
        console.log('transition error');
      })
  }

  _renderLegend() {
    const { data } = this.props;
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
        {/*<InfoIconContainer>
          <InfoIcon width={17} height={17} />
        </InfoIconContainer>*/}
        <div>更新時間：{dateString}</div>
      </LegendContainer>
    );
  }

  _updateLegendStage(legendStage) {
    const { data } = this.props;
    this.setState({
      legendStage,
    }, () => {
      this._cleanCanvas();
      this._drawChina();
    });
  }

  _getTransitionStatus() {
    return this.isTransitioning;
  }

  _cleanCanvas() {
    d3
      .select(this.map)
      .selectAll('path')
      .remove();
  }

  // _cleanToolTip() {
  //   this.tooltip.style.display = 'none';
  // }

  _zoomOut(d3SelectedMap) {
    this.isTransitioning = true;
    const x = 0;
    const y = 0;
    const scaleValue = 1;

    this._resetCustomizedZoom(d3SelectedMap);

    d3SelectedMap.transition()
      .duration(750)
      .attr('transform', `scale(${scaleValue}) translate(${x}, ${y})`)
      .end()
      .then(() => {
        this.isTransitioning = false;
        // this._cleanToolTip();
      })
      .catch((e) => {
        console.log('transition error');
      })
  }

  _zoomIn(d, d3SelectedMap, path) {
    // this._cleanToolTip();
    this.isTransitioning = true;
    let x = 0;
    let y = 0;
    let scaleValue = 1;
    const bounds = path.bounds(d);
    const centroidX = (bounds[0][0] + bounds[1][0]) / 2;
    const centroidY = (bounds[0][1] + bounds[1][1]) / 2;
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];
    const { clientWidth, clientHeight } = this.map;
    x = clientWidth / 2 - centroidX;
    y = clientHeight / 2 - centroidY;
    scaleValue = Math.min(clientWidth / dx, clientHeight / dy) * 0.95;

    this._resetCustomizedZoom(d3SelectedMap);

    d3SelectedMap
      .transition()
      .duration(750)
      .attr('transform', `scale(${scaleValue}) translate(${x}, ${y})`)
      .end()
      .then(() => {
        this.isTransitioning = false;
        // this._cleanToolTip();
      })
      .catch((e) => {
        console.log('transition error');
      })
  }

  _cleanOutPrefectures(d3SelectedMap) {
    if (this.centered) {
      d3SelectedMap
        .selectAll('path.prefecture')
        .filter((prefecture) => prefecture.properties.parent.adcode === this.centered.properties.adcode)
        .style('display', 'none')
        .attr('stroke-width', strokeWidth.default)
        .attr('stroke', strokeColor.default);

      d3SelectedMap
        .selectAll('path.province')
        .filter((province) => province.properties.adcode === this.centered.properties.adcode)
        .attr('stroke-width', strokeWidth.default)
        .attr('stroke', strokeColor.default);
    }
  }

  _onClickPrefecture(d, d3SelectedMap) {
    // this._cleanOutPrefectures(d3SelectedMap);
    // this._zoomOut(d3SelectedMap);
    // this.centered = null;
  }

  _onClickProvince(d, d3SelectedMap, path) {
    if (!d || this.centered === d) {
      // this.centered = null;
      // this._zoomOut(d3SelectedMap);
      // d3SelectedMap
      //   .selectAll('path.prefecture')
      //   .style('display', 'none');
    } else {
      // const centroid = path.centroid(d);
      if (this.centered) {
        this._cleanOutPrefectures(d3SelectedMap);
      }
      // const thePrefecturalCity = prefecturalCities[this.centered.properties.adcode];
      d3SelectedMap
        .selectAll('path.prefecture')
        .filter((prefecture) => prefecture.properties.parent.adcode === d.properties.adcode)
        .style('display', 'block')
        .attr('stroke-width', strokeWidth.focus)

      d3SelectedMap
        .selectAll('path.province')
        .filter((province) => province.properties.adcode === d.properties.adcode)
        .attr('stroke-width', strokeWidth.focus)

      this.centered = d;
      this._zoomIn(d, d3SelectedMap, path);
    }
  }

  _colorProcessor(d, isProvince) {
    const { data } = this.props;
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
  }

  _drawChina() {
    const { clientWidth } = this.canvasContainer;
    const { data } = this.props;
    const clientHeight = clientWidth * mapRatio;
    this.canvasContainer.style.height = `${clientHeight}px`;
    this.map.style.height = `${clientHeight}px`;
    const scaleValue = clientWidth * scaleRatio;
    const projection = d3
      .geoMercator()
      .scale(scaleValue)
      .center([centerChinaLongtitude, centerChinaLatitude])
      .translate([clientWidth / 2, clientHeight / 2]);

    const path = d3.geoPath(projection);
    const map = d3.select(this.map);

    const isProvince = (d) => d.properties.level === 'province';
    const d3SelectedTooltip = d3.select(this.tooltip);

    const _getTransitionStatus = this._getTransitionStatus.bind(this);

    const getTooltipData = (d, data) => {
      if (!data) {
        return null;
      }
      return isProvince(d) ? data.provinces : data.cities;
    };

    map
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
      .attr('data-adcode', (d) => d.properties.adcode)
      .attr('data-parent-adcode', (d) => d.properties.parent.adcode)
      .style('display', (d) => {
        if (isProvince(d)) {
          return 'block';
        }
        return 'none';
      })
      .attr('stroke', strokeColor.default)
      .attr('fill', (d) => this._colorProcessor(d, isProvince(d)))
      .attr('stroke-width', strokeWidth.default)
      .on('click', (d) => {
        if (isProvince(d)) {
          this._onClickProvince(d, map, path);
        } else {
          this._onClickPrefecture(d, map)
        }
      })
      .on('mouseover', function (d) {
        d3
          .select(this)
        d3SelectedTooltip
          .style('display', 'block')
          .html(generateTooltipContent({
            name: d.properties.name,
            adcode: d.properties.adcode,
            data: getTooltipData(d, data),
          }));
      })
      .on('mousemove', (d) => {
        // let positionX = d3.event.clientX + 10;
        // const positionY = d3.event.clientY;
        // const tooltipRect = this.tooltip.getBoundingClientRect();
        // if ((positionX + tooltipRect.width) > window.innerWidth) {
        //   positionX = d3.event.clientX - tooltipRect.width - 10;
        // }
        d3SelectedTooltip
          // .style('top', `${positionY}px`)
          // .style('left', `${positionX}px`)
          .html(generateTooltipContent({
            name: d.properties.name,
            adcode: d.properties.adcode,
            data: getTooltipData(d, data),
          }));
      })
      .on('mouseout', () => {
        if (!_getTransitionStatus()) {
          this._renderDefaultToolTipContent();
        }
      });
  }

  _renderDefaultToolTipContent() {
    const { countryData } = this.props;
    if (!countryData || !this.tooltip) {
      return null;
    }
    const { confirmedCount, deadCount, curedCount } = countryData;
    if (this.tooltip) {
      this.tooltip.innerHTML = `
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

  render() {
    this._renderDefaultToolTipContent();
    return (
      <Container>
        <CanvasContainer
          ref={node => { this.canvasContainer = node; }}
        >
          <SubCanvasContainer>
            <Map
              ref={node => { this.map = node; }}
            />
          </SubCanvasContainer>
          <ResetZoom
            onClick={() => {
              const map = d3.select(this.map);
              this._cleanOutPrefectures(map)
              this._zoomOut(map);
              this.centered = null;
            }}
          >
            <ZoomResetIcon />
            <span>回上一層</span>
          </ResetZoom>
          <ToolTipWrapper>
            {/*<ResetZoom
              onClick={() => {
                const map = d3.select(this.map);
                this._cleanOutPrefectures(map)
                this._zoomOut(map);
                this.centered = null;
              }}
            >
              <ZoomResetIcon />
              <span>回上一層</span>
            </ResetZoom>*/}
            <ToolTip
              ref={(node) => { this.tooltip = node; }}
            />
          </ToolTipWrapper>
          {this._renderLegend()}
        </CanvasContainer>
        {/*<Modal>
          test
        </Modal>*/}
      </Container>
    );
  }
}


export default PrefecturalChinaV2;

(() => {
  if (window.UAV_WORLD) return;

  const missionMap = Object.freeze({
    originPx: Object.freeze({ x: 730, y: 254 }),
    nmPerPx: 0.0113
  });

  const regionalAir = Object.freeze({
    rangeNm: 120,
    plotCenterPx: Object.freeze({ x: 195, y: 160 }),
    plotRadiusPx: 150
  });

  const weather = Object.freeze({
    source: 'REMOTE_REGIONAL',
    rangeNm: 60,
    referenceBearingDeg: 335,
    followsAircraftHeading: false
  });

  function primaryPixelToWorld(point) {
    if (!point) return null;
    return {
      eastNm: (Number(point.x) - missionMap.originPx.x) * missionMap.nmPerPx,
      northNm: (missionMap.originPx.y - Number(point.y)) * missionMap.nmPerPx
    };
  }

  function worldToPrimaryPixel(point) {
    if (!point) return null;
    return {
      x: missionMap.originPx.x + Number(point.eastNm) / missionMap.nmPerPx,
      y: missionMap.originPx.y - Number(point.northNm) / missionMap.nmPerPx
    };
  }

  function airPlotPointToRelativeNm(point) {
    if (!point) return null;
    const nmPerPlotPx = regionalAir.rangeNm / regionalAir.plotRadiusPx;
    return {
      eastNm: (Number(point.x) - regionalAir.plotCenterPx.x) * nmPerPlotPx,
      northNm: (regionalAir.plotCenterPx.y - Number(point.y)) * nmPerPlotPx
    };
  }

  window.UAV_WORLD = Object.freeze({
    units: 'nautical_miles',
    missionMap,
    regionalAir,
    weather,
    primaryPixelToWorld,
    worldToPrimaryPixel,
    airPlotPointToRelativeNm
  });
})();

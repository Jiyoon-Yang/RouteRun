import { describe, expect, it, vi } from 'vitest';

import { extractPathCoordinates, extractSavedRoutePoints } from './path-parser';

// DB에 실제로 저장되는 형태 (useCourseSubmit.toPathDataRecord)
const savedPathData = {
  path: [
    { lat: 36.3383, lng: 127.4186 },
    { lat: 36.339, lng: 127.419 },
    { lat: 36.3395, lng: 127.4201 },
  ],
  waypoint_points: [
    { lat: 36.3383, lng: 127.4186 },
    { lat: 36.3395, lng: 127.4201 },
  ],
  path_source: 'pedestrianRoute.path',
};

describe('path-parser', () => {
  it('저장 형태에서 상세 경로와 웨이포인트를 lat/lng 그대로 꺼낸다', () => {
    expect(extractPathCoordinates(savedPathData, 'c1')).toEqual(savedPathData.path);
    expect(extractSavedRoutePoints(savedPathData)).toEqual(savedPathData.waypoint_points);
  });

  it('JSON 문자열로 저장된 path_data도 같은 결과를 낸다', () => {
    const raw = JSON.stringify(savedPathData);
    expect(extractPathCoordinates(raw, 'c1')).toEqual(savedPathData.path);
    expect(extractSavedRoutePoints(raw)).toEqual(savedPathData.waypoint_points);
  });

  it('비어 있거나 깨진 path_data는 빈 배열을 돌려준다', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(extractPathCoordinates({}, 'c1')).toEqual([]);
    expect(extractPathCoordinates('not json', 'c1')).toEqual([]);
    expect(extractSavedRoutePoints(null)).toEqual([]);
  });
});

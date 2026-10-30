import { describe, expect, it } from 'vitest';
import { earthVector, solarPosition, TAIPEI } from '../src/solar';

describe('臺北日照的幾何估算', () => {
  it('shows the expected equinox and solstice pattern at noon and nighttime', () => {
    expect(solarPosition(79, 12).altitude).toBeCloseTo(64.5, 0);
    expect(solarPosition(172, 12).altitude).toBeGreaterThan(87);
    expect(solarPosition(355, 12).altitude).toBeCloseTo(41.5, 0);
    expect(solarPosition(172, 0).altitude).toBeLessThan(-40);
    expect(solarPosition(172, 12).declination).toBeCloseTo(23.45, 0);
    expect(solarPosition(355, 12).declination).toBeCloseTo(-23.42, 0);
  });
  it('aligns the illuminated hemisphere with the reported altitude', () => {
    for (const [day, hour] of [[79, 12], [172, 0], [172, 12], [355, 18]]) {
      const sun = solarPosition(day, hour);
      const normal = earthVector(TAIPEI.latitude, TAIPEI.longitude);
      const light = earthVector(sun.declination, sun.subsolarLongitude);
      const dot = normal.reduce((sum, coordinate, i) => sum + coordinate * light[i], 0);
      expect(dot).toBeCloseTo(Math.sin(sun.altitude * Math.PI / 180), 10);
    }
  });
});

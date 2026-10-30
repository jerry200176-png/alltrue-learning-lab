/** Geometric solar position from NOAA's fractional-year approximation.
 * A non-leap year is assumed; atmospheric refraction and terrain are not modeled.
 * https://gml.noaa.gov/grad/solcalc/solareqns.PDF
 */
export const TAIPEI = { latitude: 25.033, longitude: 121.5654, timeZone: 8 } as const;
const radians = (degrees: number) => degrees * Math.PI / 180;
const degrees = (radiansValue: number) => radiansValue * 180 / Math.PI;

export function solarPosition(day: number, localHour: number) {
  const gamma = 2 * Math.PI / 365 * (day - 1 + (localHour - 12) / 24);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const declination = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
  const solarMinutes = localHour * 60 + eqTime + 4 * TAIPEI.longitude - 60 * TAIPEI.timeZone;
  const hourAngle = solarMinutes / 4 - 180;
  const lat = radians(TAIPEI.latitude);
  const altitude = degrees(Math.asin(Math.max(-1, Math.min(1, Math.sin(lat) * Math.sin(declination) + Math.cos(lat) * Math.cos(declination) * Math.cos(radians(hourAngle))))));
  const subsolarLongitude = ((TAIPEI.longitude - hourAngle + 180) % 360 + 360) % 360 - 180;
  return { altitude, declination: degrees(declination), subsolarLongitude };
}

/** Earth-fixed coordinates aligned with three.js's sphere UVs and the upstream equirectangular texture. */
export function earthVector(latitude: number, longitude: number): [number, number, number] {
  const lat = radians(latitude); const lon = radians(longitude);
  return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)];
}

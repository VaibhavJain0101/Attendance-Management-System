const EARTH_RADIUS_METERS = 6371000;

const toRadians = (value) => (value * Math.PI) / 180;

export const calculateHaversineDistanceMeters = (pointA, pointB) => {
  const latitudeA = Number(pointA.latitude);
  const longitudeA = Number(pointA.longitude);
  const latitudeB = Number(pointB.latitude);
  const longitudeB = Number(pointB.longitude);

  const deltaLat = toRadians(latitudeB - latitudeA);
  const deltaLon = toRadians(longitudeB - longitudeA);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
};

export const isWithinRadius = (distanceMeters, radiusInMeters) => Number(distanceMeters) <= Number(radiusInMeters);
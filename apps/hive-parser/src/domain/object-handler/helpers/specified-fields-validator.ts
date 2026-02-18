export interface MapData {
  latitude?: number;
  longitude?: number;
  type?: string;
  coordinates?: number[];
}

export interface NewsFilterData {
  allowList?: string[][];
  ignoreList?: string[];
  typeList?: string[];
  authors?: string[];
}

export const validateMap = (map: MapData | null | undefined): boolean => {
  if (!map) return false;
  if (
    !map.longitude ||
    typeof map.longitude !== 'number' ||
    map.longitude < -180 ||
    map.longitude > 180
  ) {
    return false;
  }
  if (
    !map.latitude ||
    typeof map.latitude !== 'number' ||
    map.latitude < -90 ||
    map.latitude > 90
  ) {
    return false;
  }
  return true;
};

export const validateNewsFilter = (
  newsFilter: NewsFilterData | null | undefined,
): boolean => {
  if (!newsFilter) return false;

  const requiredFields: (keyof NewsFilterData)[] = [
    'allowList',
    'ignoreList',
    'typeList',
  ];

  for (const field of requiredFields) {
    if (newsFilter[field] === null || newsFilter[field] === undefined) {
      return false;
    }
  }

  if (newsFilter.allowList) {
    for (const allowRule of newsFilter.allowList) {
      if (!Array.isArray(allowRule)) {
        return false;
      }
    }
  }

  if (newsFilter.ignoreList && !Array.isArray(newsFilter.ignoreList)) {
    return false;
  }

  if (newsFilter.typeList && !Array.isArray(newsFilter.typeList)) {
    return false;
  }

  return true;
};

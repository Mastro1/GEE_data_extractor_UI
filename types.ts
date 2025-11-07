export interface Band {
  name: string;
  units: string;
  min: number;
  max: number;
  description: string;
}

export interface Satellite {
  id: string;
  name: string;
  ee_collection_name: string;
  description: string;
  website: string;
  startDate: string;
  pixelSize: number;
  bands: Band[];
}

export interface MaskFilterOption {
  key: string;
  label: string;
  options: string[];
}

export interface Mask {
  id: string;
  name: string;
  ee_collection_name: string;
  description: string;
  website: string;
  startDate: string;
  endDate: string;
  pixelSize: number;
  bands: Band[];
  filters: MaskFilterOption[];
}

export enum WhereType {
  POINT = 'Point',
  POINTS = 'Set of Points',
  SHAPE_GADM = 'GADM Shape',
  SHAPE_PERSONAL = 'Personal Shape',
}

export enum HowType {
  DRIVE = 'Google Drive',
  LOCAL = 'Local Folder',
}

export interface Configuration {
  satelliteId: string;
  where: {
    type: WhereType;
    point: { lat: string; lon: string };
    pointsFile: string | null;
    gadm: { country: string; region: string; subregion: string };
    personalShapeFile: string | null;
  };
  when: {
    startYear: number;
    endYear: number;
    startDoy: number;
    endDoy: number;
  };
  what: {
    bands: string[];
  };
  how: {
    type: HowType;
    localPath: string;
    outputFilename: string;
  };
  settings: {
    geeProject: string;
    driveFolder: string;
  };
  mask: {
    enabled: boolean;
    maskId: string | null;
    filters: Record<string, string>;
  };
}
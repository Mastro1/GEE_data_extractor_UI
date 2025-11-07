import { Configuration, Satellite, WhereType, HowType, Mask } from '../types';

const getWhereSnippet = (config: Configuration['where']): string => {
  switch (config.type) {
    case WhereType.POINT:
      return `aoi = ee.Geometry.Point([${config.point.lon}, ${config.point.lat}])
# Description: A single point for data extraction.`;

    case WhereType.POINTS:
      return `# AOI from a set of points
# TODO: You need to implement the logic to read your points file.
# The file '${config.pointsFile || 'your_points.csv'}' should contain 'lat' and 'lon' columns.
# Example using pandas:
# import pandas as pd
# df = pd.read_csv('${config.pointsFile || 'your_points.csv'}')
# points = [ee.Geometry.Point([row.lon, row.lat]) for index, row in df.iterrows()]
# aoi = ee.FeatureCollection(points) # Use this for mapping over points
aoi_info = "Extraction will be performed for each point in '${config.pointsFile || 'your_points.csv'}'"
print(aoi_info)`;

    case WhereType.SHAPE_GADM:
      return `# AOI from GADM administrative boundaries using the 'pygadm' library.
# NOTE: This requires 'pygadm' and 'geopandas' to be installed.
# You can install them with: pip install pygadm geopandas
import pygadm
import geopandas as gpd

country = '${config.gadm.country}'
region = '${config.gadm.region || ''}'
subregion = '${config.gadm.subregion || ''}'

# Determine the most specific administrative name and level provided
adm_name = subregion or region or country
adm_level = 0
if subregion:
    adm_level = 2
elif region:
    adm_level = 1

if not adm_name:
    raise Exception("GADM country name must be provided.")

try:
    print(f"Fetching GADM shape for '{adm_name}' at level {adm_level} using pygadm...")
    # pygadm.Items returns an object that can be converted to a GeoDataFrame
    # This might download data on the first run, which can take a moment.
    gdf = pygadm.Items(name=adm_name, content_level=adm_level).to_geodataframe()

    if gdf.empty:
        raise Exception(f"Pygadm did not find any matching shape for '{adm_name}' at level {adm_level}.")

    # If multiple shapes are returned (e.g., for a country with islands),
    # merge them into a single geometry for the AOI.
    merged_geometry = gdf.geometry.unary_union
    
    # Convert the merged shapely geometry to a GeoJSON dictionary
    geojson = merged_geometry.__geo_interface__
    
    # Create the Earth Engine Geometry object from the GeoJSON
    aoi = ee.Geometry(geojson)
    print("Successfully created GADM AOI from pygadm data.")

except Exception as e:
    print(f"An error occurred while fetching GADM data: {e}")
    print("Please check the spelling of the administrative names and ensure pygadm is installed correctly.")
    sys.exit(1)`;
    
    case WhereType.SHAPE_PERSONAL:
        return `# AOI from a personal shapefile
# TODO: You need to have the shapefile accessible to your Python environment.
# This part of the script ASSUMES you have a helper function to load it.
# Common libraries for this are 'geopandas' or 'pyshp'.
# The filename you provided is '${config.personalShapeFile || 'your_shape.zip'}'.
# Example using a hypothetical loader:
# from your_utils import load_shapefile_to_ee_geometry
# aoi = load_shapefile_to_ee_geometry('${config.personalShapeFile || 'your_shape.zip'}')
aoi_info = "AOI must be loaded manually from '${config.personalShapeFile || 'your_shape.zip'}'"
print(aoi_info)`;

    default:
      return '# Area of Interest (AOI) not configured.';
  }
};

const generateClassCode = (): string => {
  return `import ee

class Mask:
    """Handles the creation of a mask layer from a GEE collection."""
    def __init__(self, collection_name, filters, band):
        self.collection_name = collection_name
        self.filters = filters
        self.band = band
        self.mask_image = None

    def prepare(self):
        """
        Prepares the mask image from the collection.
        This method mosaics the filtered collection and creates a binary mask
        where the specified band's value is not equal to 0.
        """
        if self.mask_image:
            return self.mask_image
            
        print("Preparing mask...")
        collection = ee.ImageCollection(self.collection_name)
        for key, value in self.filters.items():
            collection = collection.filter(ee.Filter.eq(key, value))
        
        image = collection.mosaic()
        # Create a binary mask (1 where band is not 0, 0 otherwise)
        self.mask_image = image.select(self.band).neq(0)
        print("Mask prepared successfully.")
        return self.mask_image

class DataExtractor:
    """A general class to handle GEE data extraction."""

    def __init__(self, collection_name, start_year, end_year, start_doy, end_doy, aoi, bands, scale, mask=None):
        self.collection_name = collection_name
        self.start_year = start_year
        self.end_year = end_year
        self.start_doy = start_doy
        self.end_doy = end_doy
        self.aoi = aoi
        self.bands = bands
        self.scale = scale
        self.image_collection = None
        self.mask = mask # This should be an instance of the Mask class

    def _filter_by_date(self):
        """Filters the image collection by year and day of year."""
        years = ee.List.sequence(self.start_year, self.end_year)
        
        def yearly_filter(year):
            start_date = ee.Date.fromYMD(year, 1, 1).advance(self.start_doy - 1, 'day')
            # Handle date range wrapping around the new year
            end_date_year = ee.Number(year).add(1) if self.start_doy > self.end_doy else ee.Number(year)
            end_date = ee.Date.fromYMD(end_date_year, 1, 1).advance(self.end_doy - 1, 'day')
            return self.image_collection.filterDate(start_date, end_date)

        # Map over the years and flatten the result into a single collection
        filtered_collections = years.map(yearly_filter)
        self.image_collection = ee.ImageCollection(filtered_collections).flatten()
        return self

    def process(self):
        """Prepares the image collection for extraction."""
        print(f"Processing collection: {self.collection_name}")
        self.image_collection = ee.ImageCollection(self.collection_name)
        self._filter_by_date()
        self.image_collection = self.image_collection.select(self.bands)
        
        if self.mask:
            print("Applying mask to the image collection...")
            mask_image = self.mask.prepare()
            def apply_mask(image):
                # The mask should be an image with 1s where data should be kept.
                return image.updateMask(mask_image)
            self.image_collection = self.image_collection.map(apply_mask)

        print(f"Found {self.image_collection.size().getInfo()} images matching criteria.")
        return self

    def export(self, export_method, drive_folder, file_name_prefix='gee_export'):
        """
        Exports the processed data.
        NOTE: This is a sample export implementation that exports the FIRST image
        in the filtered collection. For a real-world use case, you might want to
        create a mosaic, a median composite, or loop through all images to export them.
        """
        if self.image_collection.size().getInfo() == 0:
            print("No images to export.")
            return

        image_to_export = self.image_collection.first()
        image_date = ee.Date(image_to_export.get('system:time_start')).format('YYYY-MM-dd').getInfo()
        
        # Combine the user-defined prefix with the image's date for a unique name.
        final_prefix = f"{file_name_prefix}_{image_date}"
        
        print(f"Preparing export for image from {image_date} with prefix: {final_prefix}")
        
        if export_method == 'drive':
            task = ee.batch.Export.image.toDrive(
                image=image_to_export,
                description=final_prefix.replace(' ', '_'),
                folder=drive_folder,
                fileNamePrefix=final_prefix,
                region=self.aoi.bounds() if self.aoi else None,
                scale=self.scale
            )
            task.start()
            print(f"Started export task to Drive: {final_prefix}")
        elif export_method == 'local':
            # NOTE: Exporting directly to local requires a library like 'geedim'.
            # This example generates a download URL for manual download.
            url = image_to_export.getDownloadURL({
                'scale': self.scale,
                'crs': 'EPSG:4326',
                'region': self.aoi.bounds().toGeoJSONString() if self.aoi else None,
                'filePerBand': False,
                'name': final_prefix
            })
            print(f"Export to local is not automated. Please download the first image from this URL:")
            print(url)
        else:
            print(f"Unknown export method: {export_method}")


class CHIRPSDataExtractor(DataExtractor):
    """Specific data extractor for CHIRPS Daily."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        print("Initialized CHIRPS Daily Extractor.")


class MODISMOD13Q1Extractor(DataExtractor):
    """Specific data extractor for MODIS/061/MOD13Q1."""
    # NOTE: This product has a scale factor of 0.0001 for NDVI and EVI bands.
    # The raw values are returned by this script. You may need to apply the
    # scale factor in your post-processing analysis.
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        print("Initialized MODIS MOD13Q1 Extractor.")


class ERA5LandHourlyExtractor(DataExtractor):
    """Specific data extractor for ECMWF/ERA5_LAND/HOURLY."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        print("Initialized ERA5-Land Hourly Extractor.")

class ERA5LandDailyAggrExtractor(DataExtractor):
    """Specific data extractor for ECMWF/ERA5_LAND/DAILY_AGGR."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        print("Initialized ERA5-Land Daily Aggregated Extractor.")`;
}

export const generatePythonScripts = (config: Configuration, satellite: Satellite, selectedMask?: Mask): { fullScript: string, classCode: string } => {
  const whereSnippet = getWhereSnippet(config.where);
  const classCode = generateClassCode();

  let maskConfigSnippet = `
# --- Mask Settings ---
MASK_ENABLED = ${config.mask.enabled && !!selectedMask}
`;

  if (config.mask.enabled && selectedMask) {
      maskConfigSnippet += `
MASK_COLLECTION = '${selectedMask.ee_collection_name}'
MASK_FILTERS = ${JSON.stringify(config.mask.filters)}
# Masking logic is based on the 'classification' band for the ESA WorldCereal product.
# It keeps pixels where the value is not 0.
MASK_BAND = 'classification' 
`;
  }

  const fullScript = `
# Generated by GEE Data Extractor UI
# ----------------------------------
# This script is designed to work with the classes provided in the 'Class Code' tab.
#
# --- INSTRUCTIONS ---
# 1. Save the content from the 'Class Code' tab into a file named \`gee_classes.py\`.
# 2. Place \`gee_classes.py\` in the same directory as this script.
# 3. Make sure you have the required libraries installed (e.g., earthengine-api, pandas, pygadm, geopandas).
# 4. Run this script from your terminal.

import ee
import os
import sys
from gee_classes import DataExtractor, CHIRPSDataExtractor, MODISMOD13Q1Extractor, ERA5LandHourlyExtractor, ERA5LandDailyAggrExtractor, Mask

# ==============================================================================
# --- CONFIGURATION ---
# ==============================================================================

# --- Earth Engine Settings ---
# It's recommended to run 'earthengine authenticate' in your terminal first.
EE_PROJECT = '${config.settings.geeProject}'

# --- Data Extraction Parameters ---
SATELLITE_COLLECTION = '${satellite.ee_collection_name}'
START_YEAR = ${config.when.startYear}
END_YEAR = ${config.when.endYear}
START_DOY = ${config.when.startDoy}
END_DOY = ${config.when.endDoy}
BANDS = ${JSON.stringify(config.what.bands)}
SCALE = ${satellite.pixelSize}  # Pixel size in meters

# --- Area of Interest (AOI) ---
${whereSnippet}

${maskConfigSnippet}

# --- Export Settings ---
EXPORT_METHOD = '${config.how.type === HowType.DRIVE ? 'drive' : 'local'}'
FILENAME_PREFIX = '${config.how.outputFilename}'
# Folder in your Google Drive for exports.
DRIVE_FOLDER = '${config.settings.driveFolder}'
# Absolute path to a local folder for exports.
LOCAL_FOLDER = r'${config.how.localPath.replace(/\\/g, '\\\\')}'


# ==============================================================================
# --- EXECUTION ---
# ==============================================================================

def main():
    """Main function to run the data extraction process."""
    try:
        print(f"Initializing Earth Engine with project: {EE_PROJECT}...")
        ee.Initialize(project=EE_PROJECT)
        print("Earth Engine initialized successfully.")
    except Exception as e:
        print(f"Error initializing Earth Engine: {e}")
        print("Please ensure you have authenticated and the project ID is correct.")
        sys.exit(1)

    # Check if aoi is defined. It might not be if manual intervention is needed.
    if 'aoi' not in locals():
        print("\\nERROR: 'aoi' is not defined.")
        print("Please complete the AOI section for 'Set of Points' or 'Personal Shape' manually.")
        sys.exit(1)

    # --- Prepare Mask object (if enabled) ---
    mask_object = None
    if MASK_ENABLED:
        print("Creating Mask object...")
        mask_object = Mask(
            collection_name=MASK_COLLECTION,
            filters=MASK_FILTERS,
            band=MASK_BAND
        )

    # Simple factory to select the correct extractor class
    extractor_map = {
        'UCSB-CHG/CHIRPS/DAILY': CHIRPSDataExtractor,
        'MODIS/061/MOD13Q1': MODISMOD13Q1Extractor,
        'ECMWF/ERA5_LAND/HOURLY': ERA5LandHourlyExtractor,
        'ECMWF/ERA5_LAND/DAILY_AGGR': ERA5LandDailyAggrExtractor,
    }

    ExtractorClass = extractor_map.get(SATELLITE_COLLECTION)
    if not ExtractorClass:
        print(f"No specific extractor found for {SATELLITE_COLLECTION}. Using generic extractor.")
        ExtractorClass = DataExtractor

    extractor = ExtractorClass(
        collection_name=SATELLITE_COLLECTION,
        start_year=START_YEAR,
        end_year=END_YEAR,
        start_doy=START_DOY,
        end_doy=END_DOY,
        aoi=aoi,
        bands=BANDS,
        scale=SCALE,
        mask=mask_object
    )

    extractor.process()
    extractor.export(
        export_method=EXPORT_METHOD,
        drive_folder=DRIVE_FOLDER,
        file_name_prefix=FILENAME_PREFIX
    )
    
    print("\\nScript finished. Check your GEE Tasks or local folder.")


if __name__ == "__main__":
    main()
`;

  return { fullScript, classCode };
};
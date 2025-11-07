"""Reusable classes that wrap Earth Engine collections for data extraction."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional

from .engine import ee


@dataclass
class ExportResult:
    """Represents the result of an export request."""

    method: str
    description: str
    extra: Dict[str, str]


class Mask:
    """Handles the creation of a mask layer from a GEE collection."""

    def __init__(self, collection_name: str, filters: Dict[str, str], band: str):
        self.collection_name = collection_name
        self.filters = filters
        self.band = band
        self.mask_image = None

    def prepare(self):
        if self.mask_image is not None:
            return self.mask_image

        collection = ee.ImageCollection(self.collection_name)
        for key, value in self.filters.items():
            collection = collection.filter(ee.Filter.eq(key, value))

        image = collection.mosaic()
        self.mask_image = image.select(self.band).neq(0)
        return self.mask_image


class DataExtractor:
    """A general class to handle GEE data extraction."""

    def __init__(
        self,
        collection_name: str,
        start_year: int,
        end_year: int,
        start_doy: int,
        end_doy: int,
        aoi,
        bands: Iterable[str],
        scale: int,
        mask: Optional[Mask] = None,
    ):
        self.collection_name = collection_name
        self.start_year = start_year
        self.end_year = end_year
        self.start_doy = start_doy
        self.end_doy = end_doy
        self.aoi = aoi
        self.bands = list(bands)
        self.scale = scale
        self.image_collection = ee.ImageCollection(self.collection_name)
        self.mask = mask

    def _filter_year(self, year: int):
        start_date = ee.Date.fromYMD(year, 1, 1).advance(self.start_doy - 1, "day")
        end_year = year + 1 if self.start_doy > self.end_doy else year
        end_date = ee.Date.fromYMD(end_year, 1, 1).advance(self.end_doy - 1, "day")
        return self.image_collection.filterDate(start_date, end_date)

    def process(self) -> int:
        filtered = None
        for year in range(self.start_year, self.end_year + 1):
            yearly = self._filter_year(year)
            filtered = yearly if filtered is None else filtered.merge(yearly)

        if filtered is None:
            filtered = ee.ImageCollection([])

        filtered = filtered.select(self.bands)

        if self.mask is not None:
            mask_image = self.mask.prepare()

            def apply_mask(image):  # pragma: no cover - lambda equivalent
                return image.updateMask(mask_image)

            filtered = filtered.map(apply_mask)

        self.image_collection = filtered
        return int(filtered.size().getInfo())

    def export(self, export_method: str, drive_folder: str, file_name_prefix: str) -> ExportResult:
        size = int(self.image_collection.size().getInfo())
        if size == 0:
            return ExportResult(method=export_method, description="no-images", extra={})

        image_to_export = self.image_collection.first()
        image_date = ee.Date(image_to_export.get("system:time_start")).format("YYYY-MM-dd").getInfo()
        final_prefix = f"{file_name_prefix}_{image_date}"

        if export_method == "drive":
            task = ee.batch.Export.image.toDrive(
                image=image_to_export,
                description=final_prefix.replace(" ", "_"),
                folder=drive_folder,
                fileNamePrefix=final_prefix,
                region=self.aoi.bounds() if self.aoi else None,
                scale=self.scale,
            )
            task.start()
            return ExportResult(
                method="drive",
                description="task-started",
                extra={"task_description": final_prefix, "drive_folder": drive_folder},
            )

        if export_method == "local":
            url = image_to_export.getDownloadURL(
                {
                    "scale": self.scale,
                    "crs": "EPSG:4326",
                    "region": self.aoi.bounds().toGeoJSONString() if self.aoi else None,
                    "filePerBand": False,
                    "name": final_prefix,
                }
            )
            return ExportResult(method="local", description="url-generated", extra={"download_url": url})

        return ExportResult(method=export_method, description="unsupported", extra={})


class CHIRPSDataExtractor(DataExtractor):
    pass


class MODISMOD13Q1Extractor(DataExtractor):
    pass


class ERA5LandHourlyExtractor(DataExtractor):
    pass


class ERA5LandDailyAggrExtractor(DataExtractor):
    pass


EXTRACTOR_MAP = {
    "UCSB-CHG/CHIRPS/DAILY": CHIRPSDataExtractor,
    "MODIS/061/MOD13Q1": MODISMOD13Q1Extractor,
    "ECMWF/ERA5_LAND/HOURLY": ERA5LandHourlyExtractor,
    "ECMWF/ERA5_LAND/DAILY_AGGR": ERA5LandDailyAggrExtractor,
}


def get_extractor(collection_name: str) -> DataExtractor:
    return EXTRACTOR_MAP.get(collection_name, DataExtractor)

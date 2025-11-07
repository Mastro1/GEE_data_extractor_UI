"""Shared catalog metadata for satellites and masks."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass(frozen=True)
class Satellite:
    id: str
    ee_collection_name: str
    pixel_size: int
    default_bands: List[str]


@dataclass(frozen=True)
class Mask:
    id: str
    ee_collection_name: str
    default_band: str
    filters: List[str]


SATELLITES: Dict[str, Satellite] = {
    "CHIRPS_DAILY": Satellite(
        id="CHIRPS_DAILY",
        ee_collection_name="UCSB-CHG/CHIRPS/DAILY",
        pixel_size=5566,
        default_bands=["precipitation"],
    ),
    "MODIS_MOD13Q1_061": Satellite(
        id="MODIS_MOD13Q1_061",
        ee_collection_name="MODIS/061/MOD13Q1",
        pixel_size=250,
        default_bands=["NDVI", "EVI", "DetailedQA"],
    ),
    "ERA5_LAND_HOURLY": Satellite(
        id="ERA5_LAND_HOURLY",
        ee_collection_name="ECMWF/ERA5_LAND/HOURLY",
        pixel_size=11132,
        default_bands=[
            "dewpoint_temperature_2m",
            "temperature_2m",
            "skin_temperature",
        ],
    ),
    "ERA5_LAND_DAILY_AGGR": Satellite(
        id="ERA5_LAND_DAILY_AGGR",
        ee_collection_name="ECMWF/ERA5_LAND/DAILY_AGGR",
        pixel_size=11132,
        default_bands=[
            "dewpoint_temperature_2m",
            "temperature_2m",
            "skin_temperature",
        ],
    ),
}

MASKS: Dict[str, Mask] = {
    "ESA_WORLDCEREAL_V100": Mask(
        id="ESA_WORLDCEREAL_V100",
        ee_collection_name="ESA/WorldCereal/2021/MODELS/v100",
        default_band="classification",
        filters=["product", "season"],
    )
}


def get_satellite(satellite_id: str) -> Satellite:
    try:
        return SATELLITES[satellite_id]
    except KeyError as exc:
        raise ValueError(f"Unknown satellite id: {satellite_id}") from exc


def get_mask(mask_id: Optional[str]) -> Optional[Mask]:
    if mask_id is None:
        return None
    try:
        return MASKS[mask_id]
    except KeyError as exc:
        raise ValueError(f"Unknown mask id: {mask_id}") from exc

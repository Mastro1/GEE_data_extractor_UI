"""Core execution logic for Google Earth Engine extractions."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional

from .data import get_mask, get_satellite
from .engine import ee
from .extractor import ExportResult, Mask, DataExtractor, get_extractor


@dataclass
class RunSummary:
    status: str
    images_found: int
    export_method: str
    collection: str
    mask_applied: bool
    mask_filters: Dict[str, str]
    export_details: Dict[str, str]


def _validate_config(config: Dict[str, Any]) -> None:
    required_keys = {"satelliteId", "where", "when", "what", "how", "settings", "mask"}
    missing = required_keys.difference(config)
    if missing:
        raise ValueError(f"Missing configuration keys: {', '.join(sorted(missing))}")

    when = config["when"]
    start_doy = int(when["startDoy"])
    end_doy = int(when["endDoy"])
    if not (1 <= start_doy <= 366 and 1 <= end_doy <= 366):
        raise ValueError("Validation error: Day of year must be between 1 and 366")

    if config["when"]["startYear"] > config["when"]["endYear"]:
        raise ValueError("Validation error: startYear cannot be after endYear")

    if config["what"].get("bands") in (None, []):
        raise ValueError("Validation error: at least one band must be selected")


def _build_aoi(where_config: Dict[str, Any]):
    where_type = where_config.get("type")
    if where_type == "Point":
        lat = float(where_config["point"]["lat"])
        lon = float(where_config["point"]["lon"])
        return ee.Geometry.Point([lon, lat])
    if where_type == "Set of Points":
        raise ValueError("Set of Points AOI requires manual implementation in the backend.")
    if where_type == "GADM Shape":
        raise ValueError("GADM Shape AOI is not yet implemented in the Flask runner.")
    if where_type == "Personal Shape":
        raise ValueError("Personal Shape AOI is not yet implemented in the Flask runner.")
    raise ValueError(f"Unsupported AOI type: {where_type}")


def _prepare_mask(mask_config: Dict[str, Any]) -> Optional[Mask]:
    if not mask_config.get("enabled"):
        return None

    mask_meta = get_mask(mask_config.get("maskId"))
    if mask_meta is None:
        return None

    filters = mask_config.get("filters") or {}
    return Mask(mask_meta.ee_collection_name, filters=filters, band=mask_meta.default_band)


def validate_config(config: Dict[str, Any]) -> None:
    _validate_config(config)


def execute_extraction(config: Dict[str, Any]) -> Dict[str, Any]:
    """Runs the extraction workflow and returns a serialisable summary."""

    _validate_config(config)

    satellite = get_satellite(config["satelliteId"])
    aoi = _build_aoi(config["where"])
    mask_object = _prepare_mask(config["mask"])

    ee.Initialize(project=config["settings"].get("geeProject"))

    extractor_cls = get_extractor(satellite.ee_collection_name)
    extractor: DataExtractor = extractor_cls(
        collection_name=satellite.ee_collection_name,
        start_year=int(config["when"]["startYear"]),
        end_year=int(config["when"]["endYear"]),
        start_doy=int(config["when"]["startDoy"]),
        end_doy=int(config["when"]["endDoy"]),
        aoi=aoi,
        bands=config["what"]["bands"],
        scale=satellite.pixel_size,
        mask=mask_object,
    )

    images_found = extractor.process()
    export_method = "drive" if config["how"]["type"] == "Google Drive" else "local"
    export_result: ExportResult = extractor.export(
        export_method=export_method,
        drive_folder=config["settings"].get("driveFolder", ""),
        file_name_prefix=config["how"].get("outputFilename", "gee_export"),
    )

    summary = RunSummary(
        status="success",
        images_found=images_found,
        export_method=export_result.method,
        collection=satellite.ee_collection_name,
        mask_applied=mask_object is not None,
        mask_filters=config["mask"].get("filters", {}),
        export_details=export_result.extra,
    )

    return {"status": summary.status, "summary": summary.__dict__}


__all__ = ["execute_extraction", "RunSummary", "validate_config"]

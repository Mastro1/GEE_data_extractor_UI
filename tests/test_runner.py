import pytest

from gee_extractor import runner


def basic_config(mask_enabled=False):
    config = {
        "satelliteId": "CHIRPS_DAILY",
        "where": {
            "type": "Point",
            "point": {"lat": "10.0", "lon": "-84.0"},
            "pointsFile": None,
            "gadm": {"country": "", "region": "", "subregion": ""},
            "personalShapeFile": None,
        },
        "when": {"startYear": 2020, "endYear": 2020, "startDoy": 1, "endDoy": 2},
        "what": {"bands": ["precipitation"]},
        "how": {"type": "Google Drive", "localPath": "", "outputFilename": "chirps_test"},
        "settings": {"geeProject": "test-project", "driveFolder": "GEE_TESTS"},
        "mask": {"enabled": mask_enabled, "maskId": "ESA_WORLDCEREAL_V100" if mask_enabled else None, "filters": {}},
    }
    if mask_enabled:
        config["mask"]["filters"] = {"product": "temporarycrops", "season": "tc-annual"}
    return config


def test_run_extraction_returns_summary():
    result = runner.run_extraction(basic_config())
    assert result["status"] == "success"
    summary = result["summary"]
    assert summary["images_found"] >= 1
    assert summary["export_method"] == "drive"
    assert summary["collection"] == "UCSB-CHG/CHIRPS/DAILY"


def test_run_extraction_with_mask_reports_mask_usage():
    result = runner.run_extraction(basic_config(mask_enabled=True))
    assert result["status"] == "success"
    summary = result["summary"]
    assert summary["mask_applied"] is True
    assert summary["mask_filters"] == {"product": "temporarycrops", "season": "tc-annual"}


def test_run_extraction_invalid_config_raises():
    bad_config = basic_config()
    bad_config["when"]["startDoy"] = 400  # invalid day of year
    with pytest.raises(ValueError):
        runner.run_extraction(bad_config)

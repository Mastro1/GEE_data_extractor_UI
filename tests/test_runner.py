from pathlib import Path

import pytest

from gee_extractor import runner


def basic_config(how_type="Google Drive", mask_enabled=False):
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
        "how": {
            "type": how_type,
            "localPath": "./exports",
            "outputFilename": "chirps_test",
        },
        "settings": {"geeProject": "test-project", "driveFolder": "GEE_TESTS"},
        "mask": {"enabled": mask_enabled, "maskId": "ESA_WORLDCEREAL_V100" if mask_enabled else None, "filters": {}},
    }
    if mask_enabled:
        config["mask"]["filters"] = {"product": "temporarycrops", "season": "tc-annual"}
    return config


@pytest.mark.parametrize("how_type", ["Google Drive", "Local"])
@pytest.mark.parametrize("mask_enabled", [False, True])
def test_run_extraction_creates_summary_and_artifacts(tmp_path, monkeypatch, how_type, mask_enabled):
    monkeypatch.chdir(tmp_path)
    config = basic_config(how_type=how_type, mask_enabled=mask_enabled)
    result = runner.run_extraction(config)

    assert result["status"] == "success"
    summary = result["summary"]
    assert summary["images_found"] >= 1
    expected_method = "drive" if how_type == "Google Drive" else "local"
    assert summary["export_method"] == expected_method
    assert summary["collection"] == "UCSB-CHG/CHIRPS/DAILY"
    assert summary["mask_applied"] is mask_enabled

    artifacts = result.get("artifacts", {})
    runner_path = Path(artifacts["runner_path"])
    class_path = Path(artifacts["class_path"])
    output_path = Path(artifacts["output_path"])
    log_path = Path(artifacts["log_path"])
    assert runner_path.exists()
    assert class_path.exists()
    assert output_path.exists()
    assert log_path.exists()


def test_run_extraction_invalid_config_reports_error(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    config = basic_config()
    config["when"]["startDoy"] = 400

    with pytest.raises(ValueError):
        runner.run_extraction(config)

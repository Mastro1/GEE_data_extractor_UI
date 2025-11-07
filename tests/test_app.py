import pytest

from app import create_app


def test_run_extraction_endpoint():
    app = create_app()
    client = app.test_client()

    payload = {
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
        "mask": {"enabled": False, "maskId": None, "filters": {}},
    }

    response = client.post("/api/run-extraction", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "success"
    assert data["summary"]["images_found"] >= 1


def test_run_extraction_endpoint_validation_error():
    app = create_app()
    client = app.test_client()

    payload = {
        "satelliteId": "CHIRPS_DAILY",
        "where": {
            "type": "Point",
            "point": {"lat": "10.0", "lon": "-84.0"},
            "pointsFile": None,
            "gadm": {"country": "", "region": "", "subregion": ""},
            "personalShapeFile": None,
        },
        "when": {"startYear": 2020, "endYear": 2020, "startDoy": 0, "endDoy": 0},
        "what": {"bands": ["precipitation"]},
        "how": {"type": "Google Drive", "localPath": "", "outputFilename": "chirps_test"},
        "settings": {"geeProject": "test-project", "driveFolder": "GEE_TESTS"},
        "mask": {"enabled": False, "maskId": None, "filters": {}},
    }

    response = client.post("/api/run-extraction", json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert data["status"] == "error"
    assert "validation" in data["message"].lower()

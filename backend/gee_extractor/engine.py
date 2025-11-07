"""Helpers to obtain an Earth Engine client or its stub."""

from __future__ import annotations

import os
from importlib import import_module
from typing import Any


def load_ee() -> Any:
    if os.environ.get("GEE_EXTRACTOR_USE_STUB") == "1":
        from . import earth_engine_stub as ee_stub

        return ee_stub

    try:
        return import_module("ee")
    except ModuleNotFoundError:  # pragma: no cover - exercised when EE not installed
        from . import earth_engine_stub as ee_stub

        return ee_stub


ee = load_ee()

"""Helpers to obtain an Earth Engine client or its stub."""

from __future__ import annotations

from importlib import import_module
from typing import Any


def load_ee() -> Any:
    try:
        return import_module("ee")
    except ModuleNotFoundError:  # pragma: no cover - exercised when EE not installed
        from . import earth_engine_stub as ee_stub

        return ee_stub


ee = load_ee()

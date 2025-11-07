"""A lightweight stub of the earthengine-api used for unit tests."""

from __future__ import annotations

import datetime as _dt
from dataclasses import dataclass
from typing import Any, Callable, Dict, Iterable, List, Optional


class _InfoObject:
    def __init__(self, value: Any):
        self._value = value

    def getInfo(self) -> Any:  # noqa: N802 - mimics EE API naming
        return self._value


class FakeFilter:
    def __init__(self, key: str, value: Any):
        self.key = key
        self.value = value


class Filter:
    @staticmethod
    def eq(key: str, value: Any) -> FakeFilter:
        return FakeFilter(key, value)


class Number(_InfoObject):
    def __init__(self, value: int):
        super().__init__(value)

    def add(self, other: int) -> "Number":
        return Number(self._value + other)


class Date:
    def __init__(self, dt: Any):
        if isinstance(dt, _dt.datetime):
            self._dt = dt
        elif isinstance(dt, (int, float)):
            self._dt = _dt.datetime.fromtimestamp(dt / 1000)
        else:
            raise TypeError(f"Unsupported date input: {dt!r}")

    @classmethod
    def fromYMD(cls, year: int, month: int, day: int) -> "Date":
        return cls(_dt.datetime(year, month, day))

    def advance(self, delta: int, unit: str) -> "Date":
        if unit != "day":
            raise ValueError("Stub only supports day increments")
        return Date(self._dt + _dt.timedelta(days=delta))

    def format(self, _fmt: str) -> _InfoObject:
        return _InfoObject(self._dt.strftime("%Y-%m-%d"))

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"Date({self._dt!r})"


@dataclass
class FakeImage:
    name: str
    timestamp: _dt.datetime

    def get(self, key: str) -> Any:
        if key == "system:time_start":
            return self.timestamp.timestamp() * 1000
        raise KeyError(key)

    def updateMask(self, mask_image: "FakeImage") -> "FakeImage":  # noqa: N802
        return FakeImage(name=f"{self.name}|masked", timestamp=self.timestamp)

    def getDownloadURL(self, params: Dict[str, Any]) -> str:  # noqa: N802
        return f"https://example.com/download/{self.name}?scale={params.get('scale')}"

    def select(self, band: str) -> "FakeImage":  # for mask
        return self

    def neq(self, value: int) -> "FakeImage":
        return self


class _Size(Number):
    pass


class ImageCollection:
    def __init__(self, items: Any):
        if isinstance(items, list):
            self.images = items
            self.collection_id = "custom"
        elif isinstance(items, ImageCollection):
            self.images = list(items.images)
            self.collection_id = items.collection_id
        else:
            self.collection_id = str(items)
            base_time = _dt.datetime(2020, 1, 1)
            self.images = [
                FakeImage(name=f"{self.collection_id}_{i}", timestamp=base_time + _dt.timedelta(days=i))
                for i in range(2)
            ]
        self.filters: List[FakeFilter] = []
        self.selected_bands: Optional[Iterable[str]] = None

    def filter(self, fake_filter: FakeFilter) -> "ImageCollection":
        self.filters.append(fake_filter)
        return self

    def filterDate(self, start: Date, end: Date) -> "ImageCollection":  # noqa: N802
        filtered = [
            image for image in self.images if start._dt <= image.timestamp <= end._dt
        ]
        return ImageCollection(filtered)

    def select(self, bands: Iterable[str]) -> "ImageCollection":
        self.selected_bands = list(bands)
        return self

    def map(self, func: Callable[[FakeImage], FakeImage]) -> "ImageCollection":
        self.images = [func(image) for image in self.images]
        return self

    def size(self) -> _Size:
        return _Size(len(self.images))

    def first(self) -> FakeImage:
        return self.images[0]

    def mosaic(self) -> FakeImage:
        return FakeImage(name=f"mosaic_{self.collection_id}", timestamp=self.images[0].timestamp)

    def merge(self, other: "ImageCollection") -> "ImageCollection":
        return ImageCollection(self.images + other.images)

    def bounds(self) -> "Geometry":
        return Geometry.Point([0, 0])


class Geometry:
    def __init__(self, coords: Any):
        self.coords = coords

    @staticmethod
    def Point(coords: List[float]) -> "Geometry":
        return Geometry(coords)

    def bounds(self) -> "Geometry":
        return self

    def toGeoJSONString(self) -> str:  # noqa: N802
        return "{\"type\": \"Point\"}"


class batch:
    class Export:
        class image:
            @staticmethod
            def toDrive(**kwargs):  # noqa: N802
                return FakeTask(kwargs)


class FakeTask:
    def __init__(self, params: Dict[str, Any]):
        self.params = params
        self.started = False

    def start(self) -> None:
        self.started = True


_initialized_project: Optional[str] = None


def Initialize(project: Optional[str] = None) -> None:  # noqa: N802
    global _initialized_project
    _initialized_project = project or "default"


def reset() -> None:
    global _initialized_project
    _initialized_project = None


def get_initialized_project() -> Optional[str]:
    return _initialized_project

"""A tiny subset of Flask used for testing without external dependencies."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Dict, Optional, Tuple


@dataclass
class _Request:
    json: Optional[Dict[str, Any]] = None

    def get_json(self, force: bool = False) -> Dict[str, Any]:
        if self.json is not None:
            return self.json
        if force:
            return {}
        raise ValueError("No JSON payload provided")


request = _Request()


class Response:
    def __init__(self, data: Any, status_code: int = 200):
        self.data = data
        self.status_code = status_code

    def get_json(self) -> Any:
        return self.data


def jsonify(data: Any) -> Response:
    return Response(data, status_code=200)


def send_from_directory(directory: Path, filename: str) -> str:
    return str(Path(directory) / filename)


ViewFunc = Callable[[], Any]


class Flask:
    def __init__(self, import_name: str, static_folder: Optional[str] = None, static_url_path: str = ""):
        self.import_name = import_name
        self.static_folder = static_folder or "."
        self.static_url_path = static_url_path
        self._routes: Dict[Tuple[str, str], ViewFunc] = {}

    def route(self, rule: str, methods: Optional[list[str]] = None) -> Callable[[ViewFunc], ViewFunc]:
        methods = methods or ["GET"]

        def decorator(func: ViewFunc) -> ViewFunc:
            for method in methods:
                self._routes[(method.upper(), rule)] = func
            return func

        return decorator

    def post(self, rule: str) -> Callable[[ViewFunc], ViewFunc]:
        return self.route(rule, methods=["POST"])

    def dispatch_request(self, method: str, path: str) -> Response:
        func = self._routes.get((method.upper(), path))
        if func is None:
            return Response({"status": "error", "message": "Not Found"}, status_code=404)
        result = func()
        if isinstance(result, Response):
            return result
        if isinstance(result, tuple):
            payload, status_code = result
            if isinstance(payload, Response):
                payload.status_code = status_code
                return payload
            return Response(payload, status_code=status_code)
        return Response(result)

    def test_client(self):
        app = self

        class _Client:
            def post(self, path: str, json: Optional[Dict[str, Any]] = None):
                request.json = json
                response = app.dispatch_request("POST", path)
                request.json = None
                return response

        return _Client()

    def run(self, host: str = "127.0.0.1", port: int = 5000, debug: bool = False):  # pragma: no cover
        raise RuntimeError("Flask stub does not support running a development server")

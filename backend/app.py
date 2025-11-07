from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

try:  # pragma: no cover - prefer real Flask when available
    from flask import Flask, jsonify, request, send_from_directory
except ModuleNotFoundError:  # pragma: no cover - used in constrained environments
    try:
        from backend.flask_stub import Flask, jsonify, request, send_from_directory
    except ModuleNotFoundError:  # pragma: no cover - fallback when imported as top-level script
        from flask_stub import Flask, jsonify, request, send_from_directory

from gee_extractor.runner import run_extraction


def create_app() -> Flask:
    app = Flask(
        __name__,
        static_folder=str(Path(__file__).resolve().parent.parent / "dist"),
        static_url_path="",
    )

    @app.post("/api/run-extraction")
    def api_run_extraction():
        data: Dict[str, Any] = request.get_json(force=True)  # type: ignore[assignment]
        try:
            result = run_extraction(data)
        except ValueError as exc:
            return jsonify({"status": "error", "message": str(exc)}), 400
        except Exception as exc:  # pragma: no cover - unexpected failure
            return jsonify({"status": "error", "message": str(exc)}), 500
        return jsonify(result)

    @app.route("/")
    def index():  # pragma: no cover - requires built frontend
        dist_path = Path(app.static_folder)
        index_file = dist_path / "index.html"
        if index_file.exists():
            return send_from_directory(dist_path, "index.html")
        return "Frontend build not found. Please run 'npm run build'.", 200

    @app.route("/<path:path>")
    def serve_static(path):  # pragma: no cover - requires built frontend
        dist_path = Path(app.static_folder)
        file_path = dist_path / path
        if file_path.exists():
            return send_from_directory(dist_path, path)
        return send_from_directory(dist_path, "index.html")

    return app


if __name__ == "__main__":  # pragma: no cover
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)

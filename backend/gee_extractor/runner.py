"""High-level runner that orchestrates script generation and execution."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict

from .runtime import validate_config


@dataclass
class ScriptArtifacts:
    directory: Path
    runner_path: Path
    class_path: Path
    config_path: Path
    output_path: Path
    log_path: Path


def _write_class_file(directory: Path) -> Path:
    import inspect

    from .extractor import (
        CHIRPSDataExtractor,
        ERA5LandDailyAggrExtractor,
        ERA5LandHourlyExtractor,
        MODISMOD13Q1Extractor,
        DataExtractor,
        Mask,
    )

    class_path = directory / "gee_classes.py"
    sections = ["import ee\n"]
    for obj in (Mask, DataExtractor, CHIRPSDataExtractor, MODISMOD13Q1Extractor, ERA5LandHourlyExtractor, ERA5LandDailyAggrExtractor):
        sections.append(inspect.getsource(obj))
        sections.append("\n")
    class_path.write_text("".join(sections))
    return class_path


def _write_runner_script(directory: Path) -> Path:
    runner_path = directory / "run_extraction.py"
    runner_path.write_text(
        """
import json
from pathlib import Path

from gee_extractor.runtime import execute_extraction


def main() -> None:
    base = Path(__file__).parent
    config = json.loads((base / "config.json").read_text())
    result = execute_extraction(config)
    (base / "output.json").write_text(json.dumps(result))


if __name__ == "__main__":
    main()
""".strip()
    )
    return runner_path


def _create_artifacts(config: Dict[str, Any]) -> ScriptArtifacts:
    directory = Path(tempfile.mkdtemp(prefix="gee-run-"))
    config_path = directory / "config.json"
    output_path = directory / "output.json"
    log_path = directory / "run.log"

    config_path.write_text(json.dumps(config))
    class_path = _write_class_file(directory)
    runner_path = _write_runner_script(directory)

    return ScriptArtifacts(
        directory=directory,
        runner_path=runner_path,
        class_path=class_path,
        config_path=config_path,
        output_path=output_path,
        log_path=log_path,
    )


def run_extraction(config: Dict[str, Any]) -> Dict[str, Any]:
    """Runs the extraction in a dedicated Python process and returns its summary."""

    validate_config(config)
    artifacts = _create_artifacts(config)

    env = os.environ.copy()
    pythonpath = env.get("PYTHONPATH", "")
    backend_root = str(Path(__file__).resolve().parent.parent)
    if backend_root not in pythonpath.split(os.pathsep):
        env["PYTHONPATH"] = os.pathsep.join(filter(None, [backend_root, pythonpath]))

    process = subprocess.run(
        [sys.executable, str(artifacts.runner_path)],
        cwd=str(artifacts.directory),
        capture_output=True,
        text=True,
        env=env,
    )

    artifacts.log_path.write_text(
        "STDOUT:\n" + process.stdout + "\nSTDERR:\n" + process.stderr
    )

    if process.returncode != 0:
        stderr_line = process.stderr.strip().splitlines()[-1] if process.stderr.strip() else ""
        message = f"Extraction script failed with exit code {process.returncode}."
        if stderr_line:
            message = f"{message} Last error: {stderr_line}"
        return {
            "status": "error",
            "message": message,
            "artifacts": {
                "config_path": str(artifacts.config_path),
                "runner_path": str(artifacts.runner_path),
                "class_path": str(artifacts.class_path),
                "output_path": str(artifacts.output_path),
                "log_path": str(artifacts.log_path),
            },
        }

    if not artifacts.output_path.exists():
        return {
            "status": "error",
            "message": "Extraction script did not produce an output summary.",
            "artifacts": {
                "config_path": str(artifacts.config_path),
                "runner_path": str(artifacts.runner_path),
                "class_path": str(artifacts.class_path),
                "output_path": str(artifacts.output_path),
                "log_path": str(artifacts.log_path),
            },
        }

    summary = json.loads(artifacts.output_path.read_text())
    summary.setdefault("artifacts", {})
    summary["artifacts"].update(
        {
            "config_path": str(artifacts.config_path),
            "runner_path": str(artifacts.runner_path),
            "class_path": str(artifacts.class_path),
            "output_path": str(artifacts.output_path),
            "log_path": str(artifacts.log_path),
        }
    )
    return summary

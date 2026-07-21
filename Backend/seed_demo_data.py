"""
Populate the backend with a month of realistic coding sessions.

Intended for demos and local development: the dashboard has nothing to render
against an empty database, and hand-clicking sessions into existence is
tedious. Generation is seeded per-day so re-running produces the same history.

    python seed_demo_data.py                 # 35 days into localhost:8000
    python seed_demo_data.py --days 60
    python seed_demo_data.py --url http://localhost:8000 --clear
"""

from __future__ import annotations

import argparse
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone

import requests

# Weighting keeps the mix plausible: real work concentrates in a few projects,
# and config/markdown files never dominate a language breakdown.
PROJECTS = [
    ("gmux", "D:/dev/gmux", 30, [("Rust", 82), ("TOML", 10), ("Markdown", 8)]),
    ("afk.exe", "D:/dev/afk.exe", 24, [("TypeScript", 60), ("Python", 32), ("CSS", 8)]),
    ("gkey", "D:/dev/gkey", 18, [("Rust", 88), ("TOML", 12)]),
    ("cosmic", "D:/work/cosmic", 18, [("TypeScript", 62), ("Python", 30), ("Shell", 8)]),
    ("kernel-bench", "D:/work/kernel", 10, [("Python", 65), ("C++", 28), ("Markdown", 7)]),
]

LANG_FILES = {
    "Rust": ("rs", ["main", "session", "pane", "mux", "hook", "config", "toast"]),
    "TypeScript": ("ts", ["api", "tracker", "monitor", "store", "extension", "types"]),
    "Python": ("py", ["main", "sessions", "models", "verify", "bench", "adapters"]),
    "C++": ("cu", ["gemm", "attention", "reduce", "softmax"]),
    "CSS": ("css", ["index", "theme", "dashboard"]),
    "TOML": ("toml", ["Cargo", "config", "manifest"]),
    "Shell": ("sh", ["sync", "release", "run-e2e"]),
    "Markdown": ("md", ["README", "ROADMAP", "CHANGELOG"]),
}

EDITORS = ["vscode", "cursor"]


def weighted(rng: random.Random, items):
    """items: sequence of (value, weight)."""
    total = sum(w for _, w in items)
    target = rng.uniform(0, total)
    acc = 0.0
    for value, weight in items:
        acc += weight
        if target <= acc:
            return value
    return items[-1][0]


def build_sessions(days: int):
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    sessions = []

    for day_back in range(days):
        day = today - timedelta(days=day_back)
        rng = random.Random(day.toordinal())
        weekend = day.weekday() >= 5

        count = rng.randint(1, 7) if weekend else rng.randint(5, 16)

        # Each day leans on one project rather than spreading evenly.
        day_project = weighted(rng, [(p, p[2]) for p in PROJECTS])

        for _ in range(count):
            project = day_project if rng.random() < 0.62 else weighted(
                rng, [(p, p[2]) for p in PROJECTS]
            )
            name, path, _w, langs = project
            language = weighted(rng, langs)
            ext, stems = LANG_FILES[language]
            file_name = f"{rng.choice(stems)}.{ext}"

            # Today only fills up to the current hour, so nothing lands in the
            # future and gets filtered out of "today" views.
            latest = max(11, now.hour) if day_back == 0 else 25
            hour = rng.randint(9, max(10, latest))
            start = day + timedelta(hours=hour, minutes=rng.randint(0, 59))
            if start > now:
                continue

            deep = rng.random() < 0.18
            duration = rng.randint(1800, 5400) if deep else rng.randint(120, 1020)

            intensity = rng.random()
            lines_added = int(intensity * (duration / 60) * 3.5)
            lines_deleted = int(lines_added * rng.uniform(0.2, 0.7))
            lines_modified = int(lines_added * rng.uniform(0.3, 0.9))

            end = start + timedelta(seconds=duration)
            sessions.append(
                {
                    "session": {
                        "id": str(uuid.uuid4()),
                        "filePath": f"{path}/src/{file_name}",
                        "fileName": file_name,
                        "fileExtension": ext,
                        "language": language,
                        "projectName": name,
                        "projectPath": path,
                        "sessionStartTime": start.isoformat(),
                        "sessionEndTime": end.isoformat(),
                        "totalDuration": duration,
                        "linesAdded": lines_added,
                        "linesDeleted": lines_deleted,
                        "linesModified": lines_modified,
                        "charactersAdded": lines_added * rng.randint(28, 48),
                        "charactersDeleted": lines_deleted * rng.randint(26, 44),
                        "charactersModified": lines_modified * rng.randint(24, 46),
                        "totalEdits": lines_added + lines_deleted + lines_modified,
                        "isActive": False,
                    },
                    "systemInfo": {
                        "editor": rng.choice(EDITORS),
                        "platform": "win32",
                    },
                }
            )

    sessions.sort(key=lambda s: s["session"]["sessionStartTime"])
    return sessions


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:8000")
    ap.add_argument("--days", type=int, default=35)
    args = ap.parse_args()

    base = args.url.rstrip("/")

    try:
        health = requests.get(f"{base}/api/health", timeout=5)
        health.raise_for_status()
    except Exception as exc:  # noqa: BLE001
        print(f"backend not reachable at {base}: {exc}")
        return 1

    sessions = build_sessions(args.days)
    print(f"posting {len(sessions)} sessions to {base} ...")

    ok = failed = 0
    for payload in sessions:
        try:
            r = requests.post(f"{base}/api/sessions", json=payload, timeout=10)
            if r.status_code < 300 and r.json().get("success"):
                ok += 1
            else:
                failed += 1
                if failed <= 3:
                    print(f"  failed {r.status_code}: {r.text[:200]}")
        except Exception as exc:  # noqa: BLE001
            failed += 1
            if failed <= 3:
                print(f"  error: {exc}")

    print(f"done. inserted={ok} failed={failed}")
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    sys.exit(main())

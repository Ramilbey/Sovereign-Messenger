#!/usr/bin/env python3
"""
render_homeserver.py — Render homeserver.yaml from its template.

Loads secrets directly from .env (repo root) — no `source .env` or
`export` required. Just run:

    python3 backend/scripts/render_homeserver.py

Reads  backend/homeserver.yaml.template
Writes backend/synapse-data/homeserver.yaml

Called automatically by dev.sh and prod.sh before `docker compose up`.
"""

import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
TEMPLATE  = REPO_ROOT / "backend" / "homeserver.yaml.template"
OUTPUT    = REPO_ROOT / "backend" / "synapse-data" / "homeserver.yaml"
ENV_FILE  = REPO_ROOT / ".env"

REQUIRED_VARS = ["POSTGRES_PASSWORD", "REGISTRATION_SHARED_SECRET"]


def load_env_file(path: Path) -> dict:
    """Parse a .env file into a dict. Skips comments and blank lines."""
    env = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, _, val = line.partition("=")
            env[key.strip()] = val.strip()
    return env


def main():
    # Load .env file
    if not ENV_FILE.exists():
        print(f"❌  ERROR: .env not found at {ENV_FILE}", file=sys.stderr)
        print( "    Copy .env.example to .env and fill in real values.", file=sys.stderr)
        sys.exit(1)

    env_vars = load_env_file(ENV_FILE)

    # Merge .env into os.environ (env already present takes precedence,
    # so explicit `export VAR=x` in the shell still wins)
    for k, v in env_vars.items():
        os.environ.setdefault(k, v)

    # Verify required vars are present and non-empty
    missing = [v for v in REQUIRED_VARS if not os.environ.get(v)]
    if missing:
        print(f"❌  ERROR: Missing required variables in .env: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)

    if not TEMPLATE.exists():
        print(f"❌  ERROR: Template not found: {TEMPLATE}", file=sys.stderr)
        sys.exit(1)

    content = TEMPLATE.read_text()

    # Substitute ${VAR} placeholders with environment values
    def substitute(m):
        key = m.group(1)
        val = os.environ.get(key, "")
        if not val:
            print(f"   ⚠️   WARNING: ${{{key}}} is empty — check .env", file=sys.stderr)
        return val

    rendered = re.sub(r"\$\{([^}]+)\}", substitute, content)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(rendered)
    print(f"   ✅ homeserver.yaml rendered → {OUTPUT.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()

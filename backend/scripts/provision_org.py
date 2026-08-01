#!/usr/bin/env python3
"""
provision_org.py — Sovereign Messenger Org Structure Provisioning Script
Phase 1 implementation: §3, §4.2, §4.3, §4.4, §8 (PRD)

USAGE
-----
  export SYNAPSE_BASE_URL=https://gov.local
  export SYNAPSE_ADMIN_TOKEN=syt_...
  export REGISTRATION_SHARED_SECRET=...

  # Provision full org from JSON:
  python3 provision_org.py --org-file org_structure.json

  # Single user:
  python3 provision_org.py --create-user --username johndoe --password "P@ss" \
      --display-name "John Doe" --department Finance --region Tashkent \
      --title "Analyst" --role employee

  # Single department under existing region space:
  python3 provision_org.py --create-department --dept-name Finance \
      --region-name Tashkent --region-space-id "!abc:gov.local"

  # Dry-run (no API calls):
  python3 provision_org.py --org-file org_structure.json --dry-run

See org_structure.example.json for config file format.
Dependencies: pip install requests python-dotenv
"""

import argparse
import json
import logging
import os
import sys
import time
from pathlib import Path

try:
    import requests
    from dotenv import load_dotenv
except ImportError:
    print("ERROR: pip install requests python-dotenv")
    sys.exit(1)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("provision_org")

# ── Power levels per PRD §2 ──────────────────────────────────────────────────
PL_NATIONAL_ADMIN = 100
PL_REGIONAL_ADMIN = 75
PL_DEPT_MANAGER   = 50
PL_EMPLOYEE       = 0

# §4.2 department channel — any member can post
DEPT_CHANNEL_PLs = {
    "ban": PL_DEPT_MANAGER,
    "events": {
        "m.room.name":             PL_DEPT_MANAGER,
        "m.room.power_levels":     PL_NATIONAL_ADMIN,
        "m.room.history_visibility": PL_DEPT_MANAGER,
        "m.room.canonical_alias":  PL_DEPT_MANAGER,
        "m.space.child":           PL_DEPT_MANAGER,
        "m.room.topic":            PL_DEPT_MANAGER,
        "m.room.pinned_events":    PL_DEPT_MANAGER,
    },
    "events_default": PL_EMPLOYEE,
    "invite":         PL_DEPT_MANAGER,
    "kick":           PL_DEPT_MANAGER,
    "redact":         PL_DEPT_MANAGER,
    "state_default":  PL_DEPT_MANAGER,
    "users_default":  PL_EMPLOYEE,
}

# §4.4 announcements — only PL≥50 can send messages (employees read-only)
ANNOUNCE_PLs = {**DEPT_CHANNEL_PLs, "events_default": PL_DEPT_MANAGER}

ROLE_TO_PL = {
    "national_admin":    PL_NATIONAL_ADMIN,
    "it_admin":          PL_NATIONAL_ADMIN,
    "regional_admin":    PL_REGIONAL_ADMIN,
    "dept_manager":      PL_DEPT_MANAGER,
    "employee":          PL_EMPLOYEE,
    "security_officer":  PL_EMPLOYEE,
    "auditor":           PL_EMPLOYEE,
    "help_desk":         PL_EMPLOYEE,
}


class MatrixAdminClient:
    """Thin wrapper around Matrix C-S API and Synapse Admin API."""

    def __init__(self, base_url: str, token: str, dry_run: bool = False):
        self.base_url = base_url.rstrip("/")
        self.dry_run  = dry_run
        self.s = requests.Session()
        self.s.verify = False  # self-signed cert in dev
        self.s.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        })

    def _url(self, path):
        return f"{self.base_url}{path}"

    def get(self, path):
        r = self.s.get(self._url(path))
        r.raise_for_status()
        return r.json()

    def post(self, path, body):
        if self.dry_run:
            log.info("[DRY-RUN] POST %s", path)
            return {"room_id": "!dry:gov.local", "user_id": "@dry:gov.local"}
        r = self.s.post(self._url(path), json=body)
        r.raise_for_status()
        return r.json()

    def put(self, path, body):
        if self.dry_run:
            log.info("[DRY-RUN] PUT %s", path)
            return {}
        r = self.s.put(self._url(path), json=body)
        r.raise_for_status()
        return r.json()

    def whoami(self):
        return self.get("/_matrix/client/v3/account/whoami")["user_id"]

    # ── Spaces / rooms ───────────────────────────────────────────────────────

    def create_space(self, name, alias, topic=""):
        log.info("Creating Space: %s  (#%s)", name, alias)
        d = self.post("/_matrix/client/v3/createRoom", {
            "name": name,
            "room_alias_name": alias,
            "topic": topic,
            "preset": "private_chat",
            "creation_content": {"type": "m.space"},
            "power_level_content_override": {
                "events_default": PL_EMPLOYEE,
                "invite": PL_DEPT_MANAGER,
                "kick": PL_DEPT_MANAGER,
                "ban": PL_DEPT_MANAGER,
                "state_default": PL_DEPT_MANAGER,
                "events": {
                    "m.space.child":   PL_DEPT_MANAGER,
                    "m.space.parent":  PL_DEPT_MANAGER,
                    "m.room.power_levels": PL_NATIONAL_ADMIN,
                },
            },
            "initial_state": [{"type": "m.room.join_rules",
                                "content": {"join_rule": "invite"}}],
        })
        return d["room_id"]

    def create_room(self, name, alias, topic, power_levels):
        log.info("Creating room: %s  (#%s)", name, alias)
        d = self.post("/_matrix/client/v3/createRoom", {
            "name": name,
            "room_alias_name": alias,
            "topic": topic,
            "preset": "private_chat",
            "power_level_content_override": power_levels,
            "initial_state": [{"type": "m.room.join_rules",
                                "content": {"join_rule": "invite"}}],
        })
        return d["room_id"]

    def add_space_child(self, space_id, child_id, order=""):
        log.info("  space.child  %s → %s", child_id, space_id)
        body = {"via": ["gov.local"], "suggested": True}
        if order:
            body["order"] = order
        self.put(
            f"/_matrix/client/v3/rooms/{space_id}/state/m.space.child/{child_id}",
            body,
        )

    def set_room_parent(self, room_id, parent_id):
        self.put(
            f"/_matrix/client/v3/rooms/{room_id}/state/m.space.parent/{parent_id}",
            {"via": ["gov.local"], "canonical": True},
        )

    def invite(self, room_id, user_id):
        log.info("  invite %s → %s", user_id, room_id)
        self.post(f"/_matrix/client/v3/rooms/{room_id}/invite",
                  {"user_id": user_id})

    def set_pl(self, room_id, user_id, pl):
        log.info("  PL=%d  %s  in %s", pl, user_id, room_id)
        state = self.get(
            f"/_matrix/client/v3/rooms/{room_id}/state/m.room.power_levels"
        )
        state.setdefault("users", {})[user_id] = pl
        self.put(
            f"/_matrix/client/v3/rooms/{room_id}/state/m.room.power_levels",
            state,
        )

    # ── Users ────────────────────────────────────────────────────────────────

    def register_user(self, username, password, display_name, is_admin=False):
        """Register via Synapse Admin API (v2 upsert endpoint)."""
        user_id = f"@{username}:gov.local"
        log.info("Registering: %s (%s)", user_id, display_name)
        self.put(f"/_synapse/admin/v2/users/{user_id}", {
            "password": password,
            "displayname": display_name,
            "admin": is_admin,
            "deactivated": False,
        })
        return user_id

    def set_profile_fields(self, user_id, department, region, title, role):
        """
        Store gov-specific profile fields as user account_data (§8 baseline).
        Custom key: uz.gov.sovereign.profile
        Readable by provisioning scripts; Phase 2 Element card will render it.
        """
        log.info("  profile fields → %s", user_id)
        self.put(
            f"/_synapse/admin/v1/users/{user_id}/account_data"
            f"/uz.gov.sovereign.profile",
            {
                "department":   department,
                "region":       region,
                "title":        title,
                "role":         role,
                "verified":     True,
                "verified_by":  "IT Administrator",
                "verified_at":  int(time.time() * 1000),
            },
        )


# ── Department provisioning ───────────────────────────────────────────────────

def provision_department(client, dept_name, region_name, region_space_id,
                         manager_user_id=None):
    """
    Creates: Department Space + #general + #announcements under region_space_id.
    Returns dict of room_ids.
    """
    s = dept_name.lower().replace(" ", "-")
    r = region_name.lower().replace(" ", "-")

    dept_space_id = client.create_space(
        name=dept_name,
        alias=f"dept-{r}-{s}",
        topic=f"Department workspace for {dept_name}, {region_name}.",
    )
    client.add_space_child(region_space_id, dept_space_id, order="a")
    client.set_room_parent(dept_space_id, region_space_id)

    if manager_user_id:
        client.invite(dept_space_id, manager_user_id)
        client.set_pl(dept_space_id, manager_user_id, PL_DEPT_MANAGER)

    general_id = client.create_room(
        name=f"{dept_name} — General",
        alias=f"dept-{r}-{s}-general",
        topic=f"Day-to-day coordination for {dept_name}.",
        power_levels=DEPT_CHANNEL_PLs,
    )
    client.add_space_child(dept_space_id, general_id, order="a")
    client.set_room_parent(general_id, dept_space_id)
    if manager_user_id:
        client.invite(general_id, manager_user_id)
        client.set_pl(general_id, manager_user_id, PL_DEPT_MANAGER)

    announce_id = client.create_room(
        name=f"{dept_name} — Announcements",
        alias=f"dept-{r}-{s}-announcements",
        topic=f"Official announcements. Only managers can post.",
        power_levels=ANNOUNCE_PLs,
    )
    client.add_space_child(dept_space_id, announce_id, order="b")
    client.set_room_parent(announce_id, dept_space_id)
    if manager_user_id:
        client.invite(announce_id, manager_user_id)
        client.set_pl(announce_id, manager_user_id, PL_DEPT_MANAGER)

    log.info("✅ Department '%s' provisioned.", dept_name)
    return {
        "dept_space_id":         dept_space_id,
        "general_room_id":       general_id,
        "announcements_room_id": announce_id,
    }


def provision_from_file(client, org_file):
    with open(org_file) as f:
        org = json.load(f)
    log.info("=== Provisioning from: %s ===", org_file)

    national_space_id = client.create_space(
        name=org.get("national_space_name", "Government of Uzbekistan"),
        alias="national-gov-uz",
        topic="National workspace — Government of the Republic of Uzbekistan.",
    )

    # National announcements (PL_NATIONAL_ADMIN to post)
    nat_announce_id = client.create_room(
        name="National Announcements",
        alias="national-announcements",
        topic="Official national announcements. Only National Administrators can post.",
        power_levels={**ANNOUNCE_PLs, "events_default": PL_NATIONAL_ADMIN},
    )
    client.add_space_child(national_space_id, nat_announce_id, order="a")
    client.set_room_parent(nat_announce_id, national_space_id)

    for region in org.get("regions", []):
        region_name = region["name"]
        r = region_name.lower().replace(" ", "-")
        regional_admin = region.get("admin_user")

        region_space_id = client.create_space(
            name=f"{region_name} Region",
            alias=f"region-{r}",
            topic=f"Regional workspace for {region_name}.",
        )
        client.add_space_child(national_space_id, region_space_id, order="b")
        client.set_room_parent(region_space_id, national_space_id)

        if regional_admin:
            client.invite(region_space_id, regional_admin)
            client.set_pl(region_space_id, regional_admin, PL_REGIONAL_ADMIN)

        for dept in region.get("departments", []):
            manager_uid = dept.get("manager_user")
            rooms = provision_department(
                client, dept["name"], region_name, region_space_id,
                manager_user_id=manager_uid,
            )

            for member in dept.get("members", []):
                role = member.get("role", "employee")
                uid = client.register_user(
                    username=member["username"],
                    password=member["password"],
                    display_name=member.get("display_name", member["username"]),
                    is_admin=role in ("national_admin", "it_admin"),
                )
                client.set_profile_fields(
                    user_id=uid,
                    department=dept["name"],
                    region=region_name,
                    title=member.get("title", ""),
                    role=role,
                )
                for room_id in rooms.values():
                    client.invite(room_id, uid)
                pl = ROLE_TO_PL.get(role, PL_EMPLOYEE)
                if pl > 0:
                    for room_id in rooms.values():
                        client.set_pl(room_id, uid, pl)

    log.info("=== ✅ Provisioning complete. ===")


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    env_path = Path(__file__).parent.parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)

    p = argparse.ArgumentParser(description="Sovereign Messenger org provisioning")
    p.add_argument("--base-url",       default=os.environ.get("SYNAPSE_BASE_URL", "https://gov.local"))
    p.add_argument("--token",          default=os.environ.get("SYNAPSE_ADMIN_TOKEN", ""))
    p.add_argument("--dry-run",        action="store_true")
    p.add_argument("--org-file",       help="Path to org_structure.json")
    # --create-user flags
    p.add_argument("--create-user",    action="store_true")
    p.add_argument("--username")
    p.add_argument("--password")
    p.add_argument("--display-name")
    p.add_argument("--department")
    p.add_argument("--region")
    p.add_argument("--title",          default="")
    p.add_argument("--role",           default="employee",
                   choices=list(ROLE_TO_PL.keys()))
    # --create-department flags
    p.add_argument("--create-department", action="store_true")
    p.add_argument("--dept-name")
    p.add_argument("--region-name")
    p.add_argument("--region-space-id")
    p.add_argument("--manager-user-id")
    args = p.parse_args()

    if not args.token:
        log.error("SYNAPSE_ADMIN_TOKEN not set. See backend/scripts/README.md.")
        sys.exit(1)

    client = MatrixAdminClient(args.base_url, args.token, dry_run=args.dry_run)

    if not args.dry_run:
        try:
            log.info("Authenticated as: %s", client.whoami())
        except Exception as e:
            log.error("Auth failed: %s", e)
            sys.exit(1)

    if args.org_file:
        provision_from_file(client, args.org_file)

    elif args.create_user:
        for req in ("username", "password", "display_name", "department", "region"):
            if not getattr(args, req.replace("-", "_")):
                log.error("--create-user requires: --%s", req)
                sys.exit(1)
        uid = client.register_user(args.username, args.password, args.display_name,
                                   is_admin=args.role in ("national_admin", "it_admin"))
        client.set_profile_fields(uid, args.department, args.region,
                                  args.title, args.role)
        log.info("✅ User created: %s", uid)

    elif args.create_department:
        for req in ("dept_name", "region_name", "region_space_id"):
            if not getattr(args, req.replace("-", "_")):
                log.error("--create-department requires: --%s", req.replace("_", "-"))
                sys.exit(1)
        rooms = provision_department(client, args.dept_name, args.region_name,
                                     args.region_space_id, args.manager_user_id)
        for k, v in rooms.items():
            log.info("  %-30s %s", k, v)

    else:
        p.print_help()


if __name__ == "__main__":
    main()

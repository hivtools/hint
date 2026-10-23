"""Clients for the control APIs of the recording/faulting proxy and the stub ADR/flow/IdP server, and Postgres."""
from __future__ import annotations

import json
from typing import Any

import httpx

from .env import Env


class ControlApi:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self._http = httpx.Client(timeout=30)

    def reset(self):
        self._http.post(f"{self.base_url}/__control/reset").raise_for_status()

    def calls(self, clear: bool = True) -> list[dict]:
        r = self._http.get(f"{self.base_url}/__control/calls", params={"clear": "1" if clear else "0"})
        r.raise_for_status()
        return r.json()

    def set_faults(self, faults: list[dict]):
        self._http.post(f"{self.base_url}/__control/faults", content=json.dumps(faults)).raise_for_status()

    def set_state(self, state: dict):
        self._http.post(f"{self.base_url}/__control/state", content=json.dumps(state)).raise_for_status()


def fault(action: dict, path_regex: str = ".*", method: str | None = None, times: int | None = None) -> dict:
    return {"method": method, "path_regex": path_regex, "times": times, "action": action}


class Db:
    """Direct Postgres access: reset between scenarios and take snapshots of side effects."""

    # tables that hold per-scenario data (users are restored from the seed file)
    DATA_TABLES = ["version_file", "session_file", "user_session", "project_version", "project", "file",
                   "onetime_token", "adr_key"]

    def __init__(self, env: Env):
        import psycopg
        self._psycopg = psycopg
        self.env = env
        self.conn = psycopg.connect(env.db_url, autocommit=True)
        self._seed: list[dict] | None = None

    def close(self):
        self.conn.close()

    def execute(self, sql: str, params=()) -> list[dict]:
        with self.conn.cursor(row_factory=self._psycopg.rows.dict_row) as cur:
            cur.execute(sql, params)
            return cur.fetchall() if cur.description else []

    # -- seeding -----------------------------------------------------------------------------------------
    def snapshot_seed_users(self) -> list[dict]:
        rows = self.execute("select * from users order by id")
        self.env.users_seed_file.parent.mkdir(parents=True, exist_ok=True)
        self.env.users_seed_file.write_text(json.dumps(rows, indent=1))
        return rows

    def seed_users(self) -> list[dict]:
        if self._seed is None:
            if self.env.users_seed_file.exists():
                self._seed = json.loads(self.env.users_seed_file.read_text())
            else:
                self._seed = self.snapshot_seed_users()
        return self._seed

    def local_data_summary(self) -> dict[str, int]:
        """What `reset` would delete that a person (not a test) may have made: projects, uploaded files, ADR keys and
        users other than the seeded ones.  Bare session rows (project_version) are not counted."""
        seed_ids = {u["id"] for u in self.seed_users()}
        counts = {
            "projects": self.execute("select count(*) as n from project")[0]["n"],
            "uploaded files": self.execute("select count(*) as n from file")[0]["n"],
            "ADR keys": self.execute("select count(*) as n from adr_key")[0]["n"],
            "extra users": len([u for u in self.execute("select id from users") if u["id"] not in seed_ids]),
        }
        return {k: v for k, v in counts.items() if v}

    def reset(self):
        """Truncate every data table with identity restart and restore the seeded users."""
        seed = self.seed_users()
        self.execute("truncate table " + ", ".join(self.DATA_TABLES) + " restart identity cascade")
        self.execute("delete from users")
        for u in seed:
            cols = list(u.keys())
            self.execute(f"insert into users ({', '.join(cols)}) values ({', '.join(['%s'] * len(cols))})",
                         [u[c] for c in cols])

    # -- snapshots ---------------------------------------------------------------------------------------
    QUERIES = {
        # ordering never depends on random ids: project_version.created is the tie-breaker
        "version_file": "select vf.version, vf.type, vf.hash, vf.filename, vf.from_adr, vf.resource_url "
                        "from version_file vf left join project_version pv on pv.id = vf.version "
                        "order by coalesce(pv.project_id, 0), pv.version_number, pv.created, vf.type, vf.hash, "
                        "vf.filename",
        "file": "select hash from file order by hash",
        "project": "select id, user_id, name, note, shared_by, is_uploaded from project order by id",
        "project_version": "select id, project_id, version_number, note, deleted, state is not null as has_state, "
                           "state from project_version order by coalesce(project_id, 0), version_number, created, "
                           "note",
        "users": "select id, username from users order by id",
        "onetime_token": "select count(*) as tokens from onetime_token",
        "adr_key": "select user_id, length(api_key) > 0 as has_key from adr_key order by user_id",
    }

    def table(self, name: str) -> list[dict]:
        return self.execute(self.QUERIES[name])

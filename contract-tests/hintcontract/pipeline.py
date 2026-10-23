"""The expensive hintr work (mock model fit -> calibrate -> downloads), done once per test session.

hintr task results live in Redis / the results dir and are independent of hint's database, so scenarios can safely
re-use these task ids (bound to stable tokens such as <TASK:fit>).  The pipeline is itself recorded as a golden
scenario (`_pipeline/model_pipeline`) so that the whole chain is regression-tested too.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from .flows import CALIBRATE_OPTIONS, MODEL_OPTIONS, download_payload, login_and_open, upload, upload_minimal
from .scenario import Scenario

DOWNLOAD_TYPES = ["spectrum", "coarse-output", "summary", "comparison", "agyw", "datapack"]


@dataclass
class Pipeline:
    fit_id: str = ""
    calibrate_id: str = ""
    version: dict = field(default_factory=dict)
    downloads: dict[str, str] = field(default_factory=dict)
    error_fit_id: str = ""
    error_calibrate_id: str = ""

    def bind(self, scn: Scenario):
        scn.bind_task(self.fit_id, "fit")
        scn.bind_task(self.calibrate_id, "calibrate")
        scn.bind_task(self.error_fit_id, "fit-error")
        scn.bind_task(self.error_calibrate_id, "calibrate-error")
        for t, i in self.downloads.items():
            scn.bind_task(i, f"download-{t}")


def done(r) -> bool:
    return r.status == 200 and r.json()["data"]["done"] is True


def run_pipeline(scn: Scenario) -> Pipeline:
    p = Pipeline()
    a = login_and_open(scn, "A")
    upload_minimal(a)
    opts = a.get("/model/options/", name="model options")
    p.version = opts.json()["version"]
    a.post("/model/validate/options/", json={"options": MODEL_OPTIONS, "version": {}, "iso3": None},
           name="validate model options")
    r = a.post("/model/run/", json={"options": MODEL_OPTIONS, "version": p.version, "iso3": "MWI"}, name="run model",
               bind_task="fit")
    p.fit_id = r.data["id"]
    # also a failing fit (the mock model's deterministic error trigger)
    bad = dict(MODEL_OPTIONS, mock_model_trigger_error="true")
    r = a.post("/model/run/", json={"options": bad, "version": p.version, "iso3": "MWI"}, name="run model that errors",
               bind_task="fit-error")
    p.error_fit_id = r.data["id"]
    a.poll(f"/model/status/{p.fit_id}", done, "data.done == true", name="fit finished")
    a.get(f"/model/result/{p.fit_id}", name="fit result")
    a.poll(f"/model/status/{p.error_fit_id}", done, "data.done == true", name="errored fit finished")
    a.get(f"/model/result/{p.error_fit_id}", name="errored fit result")

    r = a.post(f"/calibrate/submit/{p.fit_id}", json={"options": CALIBRATE_OPTIONS, "version": p.version,
                                                      "iso3": "MWI"}, name="calibrate",
               bind_task="calibrate")
    p.calibrate_id = r.data["id"]
    badcal = dict(CALIBRATE_OPTIONS, calibrate_method="bogus")
    r = a.post(f"/calibrate/submit/{p.fit_id}", json={"options": badcal, "version": p.version, "iso3": "MWI"},
               name="calibrate with invalid method",
               bind_task="calibrate-error")
    p.error_calibrate_id = r.data["id"]
    a.poll(f"/calibrate/status/{p.calibrate_id}", done, "data.done == true", name="calibrate finished")
    a.poll(f"/calibrate/status/{p.error_calibrate_id}", done, "data.done == true", name="bad calibrate finished")
    a.get(f"/calibrate/result/metadata/{p.calibrate_id}", name="calibrate metadata")

    for kind in ("programme", "anc", "vmmc"):
        upload(a, kind)
    payload = download_payload(p.fit_id, p.calibrate_id)
    for t in DOWNLOAD_TYPES:
        r = a.post(f"/download/submit/{t}/{p.calibrate_id}", json=payload, name=f"submit download {t}",
                   bind_task=f"download-{t}")
        p.downloads[t] = r.data["id"]
    for t in DOWNLOAD_TYPES:
        a.poll(f"/download/status/{p.downloads[t]}", done, "data.done == true", name=f"download {t} finished")
    return p

#!/usr/bin/env python3
"""Print a compact human summary of golden files: scripts/show-golden.py goldens/auth [maxlen]"""
import glob, json, sys, os
target = sys.argv[1]; n = int(sys.argv[2]) if len(sys.argv) > 2 else 260
files = [target] if target.endswith(".json") else sorted(glob.glob(os.path.join(target, "**/*.json"), recursive=True))
for f in files:
    d = json.load(open(f)); print("==", os.path.basename(f))
    for s in d["steps"]:
        if s.get("type"):
            print("  [%s] %s: %s" % (s["type"], s["name"], json.dumps(s.get("rows", s.get("files", s.get("emails"))))[:n])); continue
        r = s["response"]; b = r.get("body", {})
        print("  %-38s| %s %s %s%s" % (s["name"][:38], r["status"], r.get("headers", {}).get("location", ""), json.dumps(b)[:n], " COOKIE" if s.get("session_cookie") else ""))
        if s.get("outbound"):
            for c in s["outbound"]:
                print("       ->", c["to"], c["method"], c["path"], c.get("query", ""), json.dumps({k: v for k, v in c.items() if k in ("json", "form", "multipart", "fault", "status")})[:n])

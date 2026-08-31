#!/usr/bin/env python3
"""Fail if any tracked file contains a credential.

A token used to live in index.html split across an array so it would not
match a scanner. This check collapses string concatenation and decodes
base64 before matching, so that trick does not work again.
"""

from __future__ import annotations

import base64
import pathlib
import re
import sys

PREFIXES = [
    (r"gh[pousr]_[A-Za-z0-9]{36}", "GitHub token"),
    (r"github_pat_[A-Za-z0-9_]{60,}", "GitHub fine-grained PAT"),
    (r"sk-ant-[A-Za-z0-9_-]{24,}", "Anthropic API key"),
    (r"sk-[A-Za-z0-9]{32,}", "OpenAI-style API key"),
    (r"xox[baprs]-[A-Za-z0-9-]{10,}", "Slack token"),
    (r"AKIA[0-9A-Z]{16}", "AWS access key id"),
    (r"AIza[A-Za-z0-9_-]{35}", "Google API key"),
    (r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----", "private key"),
]
COMPILED = [(re.compile(p), label) for p, label in PREFIXES]

CONCAT = re.compile(r"""(['"])((?:(?!\1).)*)\1(\s*(?:\+|,)\s*(['"])((?:(?!\4).)*)\4)+""")
QUOTED = re.compile(r"""(['"])((?:(?!\1).)*)\1""")
B64 = re.compile(r"[A-Za-z0-9+/]{24,}={0,2}")

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEXT_SUFFIXES = {".html", ".js", ".json", ".md", ".yml", ".yaml", ".py", ".css", ".txt"}


def collapse(text: str) -> str:
    return CONCAT.sub(lambda m: "".join(q.group(2) for q in QUOTED.finditer(m.group(0))), text)


def decoded(text: str) -> str:
    out = []
    for candidate in B64.findall(text):
        try:
            out.append(base64.b64decode(candidate + "=" * (-len(candidate) % 4)).decode("utf-8", "ignore"))
        except Exception:
            pass
    return "\n".join(out)


def main() -> int:
    problems = []
    scanned = 0
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file() or ".git" in path.parts or path.suffix not in TEXT_SUFFIXES:
            continue
        if path.name == "check_no_secrets.py":
            continue  # this file names the prefixes it looks for
        scanned += 1
        text = path.read_text(encoding="utf-8", errors="replace")
        for variant, how in ((text, "plain"), (collapse(text), "concatenated"), (decoded(text), "base64")):
            for pattern, label in COMPILED:
                if pattern.search(variant):
                    rel = path.relative_to(ROOT)
                    problems.append(f"{rel}: {label} ({how})")

    print(f"scanned {scanned} files")
    if problems:
        print("\ncredentials found:", file=sys.stderr)
        for problem in sorted(set(problems)):
            print(f"  {problem}", file=sys.stderr)
        return 1
    print("no credentials found")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

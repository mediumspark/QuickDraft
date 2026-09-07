#!/usr/bin/env python3
"""
AQuickDraft — Prompt of the Day desktop admin

Uses your Supabase service role key locally so you can publish
the homepage prompt without opening the Supabase dashboard.

Setup (once):
  1. Copy .env.example → .env
  2. Fill SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
     (Supabase → Project Settings → API)
  3. Run: ./run.sh
"""

from __future__ import annotations

import json
import os
import ssl
import tkinter as tk
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from tkinter import messagebox, ttk

APP_DIR = Path(__file__).resolve().parent
ENV_PATH = APP_DIR / ".env"


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def supabase_request(
    method: str,
    url: str,
    key: str,
    path: str,
    body: dict | None = None,
) -> tuple[int, object]:
    endpoint = url.rstrip("/") + path
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=data,
        method=method,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation,resolution=merge-duplicates",
        },
    )
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {err.code}: {detail}") from err


class PromptAdminApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("AQuickDraft — Prompt of the Day")
        self.minsize(520, 420)
        self.geometry("640x480")
        self.configure(bg="#eef1f4")

        self.env = load_env(ENV_PATH)
        self.url = self.env.get("SUPABASE_URL", "").rstrip("/")
        self.key = self.env.get("SUPABASE_SERVICE_ROLE_KEY", "")

        self._build_ui()
        self.after(100, self.load_prompt)

    def _build_ui(self) -> None:
        pad = {"padx": 16, "pady": 8}
        root = ttk.Frame(self, padding=16)
        root.pack(fill="both", expand=True)

        style = ttk.Style(self)
        if "clam" in style.theme_names():
            style.theme_use("clam")

        ttk.Label(
            root,
            text="Prompt of the Day",
            font=("serif", 18, "bold"),
        ).pack(anchor="w", **pad)

        ttk.Label(
            root,
            text="Publishes to the AQuickDraft homepage. Leave blank and save to hide it.",
            wraplength=560,
        ).pack(anchor="w", padx=16, pady=(0, 8))

        self.status = tk.StringVar(value="Ready")
        ttk.Label(root, textvariable=self.status, foreground="#5c6672").pack(anchor="w", padx=16)

        self.text = tk.Text(
            root,
            wrap="word",
            height=12,
            font=("sans-serif", 12),
            relief="solid",
            borderwidth=1,
            padx=10,
            pady=10,
        )
        self.text.pack(fill="both", expand=True, padx=16, pady=8)

        buttons = ttk.Frame(root)
        buttons.pack(fill="x", padx=16, pady=8)

        ttk.Button(buttons, text="Reload", command=self.load_prompt).pack(side="left")
        ttk.Button(buttons, text="Clear", command=self.clear_prompt).pack(side="left", padx=8)
        ttk.Button(buttons, text="Publish to homepage", command=self.publish_prompt).pack(side="right")

        if not self.url or not self.key or "your-" in self.url or "your-" in self.key:
            self.status.set("Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to prompt-admin/.env")

    def _require_config(self) -> bool:
        if not self.url or not self.key or "your-" in self.url or "your-" in self.key:
            messagebox.showerror(
                "Missing config",
                "Copy prompt-admin/.env.example to .env and set:\n"
                "• SUPABASE_URL\n"
                "• SUPABASE_SERVICE_ROLE_KEY\n\n"
                "Find both under Supabase → Project Settings → API.",
            )
            return False
        return True

    def load_prompt(self) -> None:
        if not self._require_config():
            return
        self.status.set("Loading…")
        self.update_idletasks()
        try:
            _status, data = supabase_request(
                "GET",
                self.url,
                self.key,
                "/rest/v1/prompt_of_the_day?id=eq.1&select=body,updated_at",
            )
            body = ""
            updated = None
            if isinstance(data, list) and data:
                body = data[0].get("body") or ""
                updated = data[0].get("updated_at")
            self.text.delete("1.0", "end")
            self.text.insert("1.0", body)
            if updated:
                self.status.set(f"Loaded · last updated {updated}")
            else:
                self.status.set("Loaded · no prompt set yet")
        except Exception as err:  # noqa: BLE001 — show in UI
            self.status.set("Load failed")
            messagebox.showerror("Could not load prompt", str(err))

    def clear_prompt(self) -> None:
        self.text.delete("1.0", "end")

    def publish_prompt(self) -> None:
        if not self._require_config():
            return
        body = self.text.get("1.0", "end").strip()
        self.status.set("Publishing…")
        self.update_idletasks()
        payload = {
            "id": 1,
            "body": body,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": None,
        }
        try:
            supabase_request(
                "POST",
                self.url,
                self.key,
                "/rest/v1/prompt_of_the_day",
                payload,
            )
            if body:
                self.status.set("Published to homepage")
                messagebox.showinfo("Published", "Prompt of the day is live on the homepage.")
            else:
                self.status.set("Cleared from homepage")
                messagebox.showinfo("Cleared", "Homepage prompt is now hidden.")
        except Exception as err:  # noqa: BLE001 — show in UI
            self.status.set("Publish failed")
            messagebox.showerror("Could not publish", str(err))


def main() -> None:
    app = PromptAdminApp()
    app.mainloop()


if __name__ == "__main__":
    main()

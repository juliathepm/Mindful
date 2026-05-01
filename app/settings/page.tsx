"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  clearEvents,
  clearGenerated,
  exportBackup,
  importBackup,
  readSettings,
  writeSettings,
} from "@/lib/storage";
import { TOPUP_DAILY_LIMIT, type Settings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [statusMsg, setStatusMsg] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(readSettings());
  }, []);

  if (!settings) {
    return (
      <main className="h-screen-d flex items-center justify-center bg-ink text-paper/40">
        <div className="font-serif">Loading…</div>
      </main>
    );
  }

  const last4 = settings.apiKey ? settings.apiKey.slice(-4) : "";

  const saveKey = () => {
    if (!keyInput.trim()) return;
    const next = writeSettings({ apiKey: keyInput.trim() });
    setSettings(next);
    setKeyInput("");
    setStatusMsg("Key saved.");
  };

  const forgetKey = () => {
    const next = writeSettings({ apiKey: undefined });
    setSettings(next);
    setStatusMsg("Key forgotten.");
  };

  const onExport = () => {
    const data = exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mindful-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg("Backup downloaded.");
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      importBackup(json);
      setSettings(readSettings());
      setStatusMsg("Backup imported. Reload the home screen to see it.");
    } catch (err) {
      setStatusMsg(
        "Import failed: " + (err instanceof Error ? err.message : "unknown error"),
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onClearEvents = () => {
    if (!confirm("Clear all hearts and seen history?")) return;
    clearEvents();
    setStatusMsg("History cleared.");
  };
  const onClearGenerated = () => {
    if (!confirm("Clear all generated cards?")) return;
    clearGenerated();
    setStatusMsg("Generated cards cleared.");
  };

  return (
    <main
      className="min-h-screen-d w-full bg-ink text-paper px-5"
      style={{
        paddingTop: "max(1rem, var(--safe-top))",
        paddingBottom: "max(1.5rem, var(--safe-bottom))",
      }}
    >
      <div className="max-w-md mx-auto py-4">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-sm text-paper/70 rounded-full bg-paper/10 px-3 py-1.5"
          >
            ← Back
          </Link>
          <h1 className="font-serif text-xl">Settings</h1>
          <div style={{ width: 64 }} />
        </div>

        <Section title="Anthropic API key">
          <p className="text-sm text-paper/65 mb-3">
            Optional. When set, Mindful generates new cards in the background to keep your deck fresh.
          </p>
          {settings.apiKey ? (
            <div className="flex items-center justify-between bg-paper/5 rounded-xl px-3 py-2 mb-2">
              <span className="font-mono text-sm text-paper/80">…{last4}</span>
              <button
                type="button"
                onClick={forgetKey}
                className="text-xs px-3 py-1 rounded-full bg-paper/15 active:bg-paper/30"
              >
                Forget
              </button>
            </div>
          ) : null}
          <div className="flex gap-2">
            <input
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-ant-..."
              className="flex-1 bg-paper/5 border border-paper/15 rounded-xl px-3 py-2 text-sm font-mono"
            />
            <button
              type="button"
              onClick={saveKey}
              className="bg-paper text-ink rounded-xl px-4 py-2 text-sm font-medium"
            >
              Save
            </button>
          </div>
          <p className="text-[11px] text-paper/45 mt-2">
            Stored only on this device. Sent only to Anthropic via the same-origin proxy.
          </p>
        </Section>

        <Section title="Top-up usage today">
          <div className="text-sm text-paper/75">
            {settings.topupCallsToday}/{TOPUP_DAILY_LIMIT} calls used
            {settings.topupTokensToday
              ? ` · ${settings.topupTokensToday.toLocaleString()} tokens`
              : ""}
            <div className="text-[11px] text-paper/45 mt-1">
              Resets each calendar day. New cards generate when fewer than 10
              unseen remain.
            </div>
          </div>
        </Section>

        <Section title="Backup">
          <p className="text-sm text-paper/65 mb-3">
            iOS Safari clears data after ~7 days of no use. Export your hearts, generated cards, and settings to a file you can re-import.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onExport}
              className="rounded-xl bg-paper/10 active:bg-paper/20 px-4 py-2 text-sm"
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-xl bg-paper/10 active:bg-paper/20 px-4 py-2 text-sm"
            >
              Import
            </button>
            <input
              ref={fileRef}
              onChange={onImport}
              type="file"
              accept="application/json"
              className="hidden"
            />
          </div>
        </Section>

        <Section title="Reset">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onClearEvents}
              className="rounded-xl bg-paper/5 active:bg-paper/15 px-4 py-2 text-sm text-left"
            >
              Clear hearts and seen history
            </button>
            <button
              type="button"
              onClick={onClearGenerated}
              className="rounded-xl bg-paper/5 active:bg-paper/15 px-4 py-2 text-sm text-left"
            >
              Clear generated cards
            </button>
          </div>
        </Section>

        {statusMsg ? (
          <div className="text-sm text-paper/60 text-center mt-4">{statusMsg}</div>
        ) : null}

        <div className="text-[11px] text-paper/35 text-center mt-10">
          Mindful · v0
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-[11px] uppercase tracking-wider text-paper/45 mb-2">
        {title}
      </h2>
      <div className="bg-paper/[0.03] border border-paper/10 rounded-2xl p-4">
        {children}
      </div>
    </section>
  );
}

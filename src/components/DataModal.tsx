import { useRef, useState } from 'react';
import { Modal } from './Modal';
import { useDialogs } from './Dialogs';
import { useStore } from '../lib/store';
import { parseCsTimer, parseExport } from '../lib/importers';
import { dayKey } from '../lib/format';

export function DataModal({ onClose }: { onClose: () => void }) {
  const solves = useStore((s) => s.solves.length);
  const sessions = useStore((s) => s.sessions.length);
  const { confirm, toast } = useDialogs();
  const [error, setError] = useState<string | null>(null);
  const jsonRef = useRef<HTMLInputElement>(null);
  const csRef = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const data = useStore.getState().exportData();
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `speedcubing-backup-${dayKey(Date.now())}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Backup downloaded');
  };

  const readFile = (f: File) => f.text();

  const importJson = async (f: File) => {
    setError(null);
    try {
      const file = parseExport(await readFile(f));
      const replace = await confirm({
        title: 'Import backup',
        message: (
          <>
            The file has {file.solves.length} solves in {file.sessions.length} sessions.
            <br />
            <b>Replace</b> wipes current data and restores the file. Cancel to <b>merge</b> it in instead (duplicates are skipped).
          </>
        ),
        confirmLabel: 'Replace everything',
        danger: true,
      });
      useStore.getState().importData(file, replace ? 'replace' : 'merge');
      toast(replace ? 'Backup restored' : 'Backup merged');
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const importCs = async (f: File) => {
    setError(null);
    try {
      const items = parseCsTimer(await readFile(f));
      const n = items.reduce((a, i) => a + i.solves.length, 0);
      const ok = await confirm({
        title: 'Import from csTimer',
        message: `Add ${n} solves as ${items.length} new session${items.length === 1 ? '' : 's'} (${items
          .map((i) => i.session.name)
          .join(', ')})?`,
        confirmLabel: 'Import',
      });
      if (!ok) return;
      useStore.getState().addImportedSessions(items);
      toast(`Imported ${n} solves from csTimer`);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Modal title="Your data" onClose={onClose}>
      <p className="muted small">
        Everything is stored in this browser only ({solves} solves, {sessions} sessions). Export a backup now and then,
        especially before clearing browser data or switching devices.
      </p>
      <div className="card stack" style={{ padding: 14 }}>
        <div className="row">
          <div className="spacer">
            <h3>Export backup</h3>
            <p className="small muted">Solves, sessions and learning progress as JSON.</p>
          </div>
          <button className="btn primary" onClick={exportJson}>
            Export JSON
          </button>
        </div>
        <div className="row">
          <div className="spacer">
            <h3>Import backup</h3>
            <p className="small muted">Restore or merge a file exported from this site.</p>
          </div>
          <button className="btn" onClick={() => jsonRef.current?.click()}>
            Import JSON
          </button>
        </div>
        <div className="row">
          <div className="spacer">
            <h3>Import from csTimer</h3>
            <p className="small muted">In csTimer: Export → Export to file. Each session becomes a new session here.</p>
          </div>
          <button className="btn" onClick={() => csRef.current?.click()}>
            Choose file
          </button>
        </div>
      </div>
      {error && <p className="small bad">{error}</p>}
      <input
        ref={jsonRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) importJson(f);
        }}
      />
      <input
        ref={csRef}
        type="file"
        accept=".txt,.json,text/plain,application/json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) importCs(f);
        }}
      />
    </Modal>
  );
}

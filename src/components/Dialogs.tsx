import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal } from './Modal';

interface ConfirmOpts {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}
interface PromptOpts {
  title: string;
  label?: string;
  initial?: string;
  confirmLabel?: string;
}

interface Ctx {
  confirm: (o: ConfirmOpts) => Promise<boolean>;
  prompt: (o: PromptOpts) => Promise<string | null>;
  toast: (msg: string) => void;
}

const DialogCtx = createContext<Ctx | null>(null);

type Pending =
  | { kind: 'confirm'; opts: ConfirmOpts; resolve: (v: boolean) => void }
  | { kind: 'prompt'; opts: PromptOpts; resolve: (v: string | null) => void };

export function DialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [value, setValue] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const confirm = useCallback(
    (opts: ConfirmOpts) => new Promise<boolean>((resolve) => setPending({ kind: 'confirm', opts, resolve })),
    [],
  );
  const prompt = useCallback(
    (opts: PromptOpts) =>
      new Promise<string | null>((resolve) => {
        setValue(opts.initial ?? '');
        setPending({ kind: 'prompt', opts, resolve });
      }),
    [],
  );
  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2400);
  }, []);

  useEffect(() => {
    if (pending?.kind === 'prompt') setTimeout(() => inputRef.current?.select(), 30);
  }, [pending]);

  const close = (result: boolean) => {
    if (!pending) return;
    if (pending.kind === 'confirm') pending.resolve(result);
    else pending.resolve(result ? value : null);
    setPending(null);
  };

  return (
    <DialogCtx.Provider value={{ confirm, prompt, toast }}>
      {children}
      {pending && (
        <Modal
          title={pending.opts.title}
          onClose={() => close(false)}
          footer={
            <>
              <button className="btn" onClick={() => close(false)}>
                Cancel
              </button>
              <button
                className={'btn ' + (pending.kind === 'confirm' && pending.opts.danger ? 'danger' : 'primary')}
                onClick={() => close(true)}
                autoFocus={pending.kind === 'confirm'}
              >
                {pending.opts.confirmLabel ?? 'OK'}
              </button>
            </>
          }
        >
          {pending.kind === 'confirm' ? (
            pending.opts.message && <div className="muted">{pending.opts.message}</div>
          ) : (
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                close(true);
              }}
            >
              {pending.opts.label && <label className="small muted">{pending.opts.label}</label>}
              <input ref={inputRef} className="input" value={value} onChange={(e) => setValue(e.target.value)} />
            </form>
          )}
        </Modal>
      )}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </DialogCtx.Provider>
  );
}

export function useDialogs(): Ctx {
  const ctx = useContext(DialogCtx);
  if (!ctx) throw new Error('useDialogs outside DialogProvider');
  return ctx;
}

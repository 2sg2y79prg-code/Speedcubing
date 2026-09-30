import { useEffect, type ReactNode } from 'react';

interface Props {
  title?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function Modal({ title, onClose, children, footer, wide }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    document.body.dataset.modal = '1';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      delete document.body.dataset.modal;
    };
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true">
        {title !== undefined && (
          <div className="modal-head">
            <h2>{title}</h2>
            <button className="btn ghost sm icon" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/** True while any modal is open or focus is in a text field; timer shortcuts should ignore keys then. */
export function keyboardBusy(): boolean {
  if (document.body.dataset.modal) return true;
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

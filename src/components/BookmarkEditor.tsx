import { useState, type FormEvent } from 'react';
import type { Bookmark } from '../types';

type Props = {
  initial?: Bookmark;
  onCancel: () => void;
  onSave: (input: Omit<Bookmark, 'id'> & { id?: string }) => void;
};

export function BookmarkEditor({ initial, onCancel, onSave }: Props) {
  const [label, setLabel] = useState(initial?.label ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [text, setText] = useState(initial?.text ?? '');

  const trimmedLabel = label.trim();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!trimmedLabel) return;
    onSave({
      id: initial?.id,
      label: trimmedLabel,
      title: title.trim() || undefined,
      text: text.trim() || undefined,
    });
  };

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bm-editor-title"
    >
      <div className="modal__backdrop" onClick={onCancel} />
      <form className="modal__panel" onSubmit={handleSubmit}>
        <h2 id="bm-editor-title" className="modal__title">
          {initial ? 'Edit bookmark' : 'New bookmark'}
        </h2>

        <label className="field">
          <span className="field__label">Label</span>
          <input
            className="field__input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Mom"
            autoFocus
            maxLength={40}
            required
          />
        </label>

        <label className="field">
          <span className="field__label">Title (optional)</span>
          <input
            className="field__input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Subject line for emails"
            maxLength={120}
          />
        </label>

        <label className="field">
          <span className="field__label">Caption (optional)</span>
          <textarea
            className="field__input field__input--textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message that pre-fills when sharing"
            rows={3}
            maxLength={500}
          />
        </label>

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={!trimmedLabel}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

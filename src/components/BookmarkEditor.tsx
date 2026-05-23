import { useState, type FormEvent } from 'react';
import type { Bookmark, ShareRoute, ShareRouteKind } from '../types';

type Props = {
  initial?: Bookmark;
  onCancel: () => void;
  onSave: (input: Omit<Bookmark, 'id'> & { id?: string }) => void;
};

type DraftState = {
  webShare: { title: string; text: string };
  appleShortcut: { shortcutName: string; passImage: boolean };
  androidIntent: {
    pkg: string;
    action: string;
    mimeType: string;
    text: string;
    passImage: boolean;
  };
  urlScheme: {
    template: string;
    recipient: string;
    text: string;
    passImage: 'clipboard' | 'download' | 'none';
  };
};

const KIND_LABELS: Record<ShareRouteKind, string> = {
  'web-share': 'Web Share',
  'apple-shortcut': 'Apple Shortcut',
  'android-intent': 'Android Intent',
  'url-scheme': 'URL Scheme',
};

const URL_PRESETS: { label: string; template: string }[] = [
  { label: 'WhatsApp', template: 'https://wa.me/{recipient}?text={text}' },
  { label: 'SMS', template: 'sms:{recipient}?body={text}' },
  {
    label: 'Mail',
    template: 'mailto:{recipient}?subject=Photo&body={text}',
  },
  { label: 'Telegram', template: 'tg://msg?text={text}' },
];

function initialDraft(initial?: Bookmark): DraftState {
  const draft: DraftState = {
    webShare: { title: '', text: '' },
    appleShortcut: { shortcutName: '', passImage: true },
    androidIntent: {
      pkg: '',
      action: 'android.intent.action.SEND',
      mimeType: 'image/jpeg',
      text: '',
      passImage: true,
    },
    urlScheme: {
      template: '',
      recipient: '',
      text: '',
      passImage: 'clipboard',
    },
  };
  if (!initial) return draft;
  const r = initial.route;
  switch (r.kind) {
    case 'web-share':
      draft.webShare = { title: r.title ?? '', text: r.text ?? '' };
      break;
    case 'apple-shortcut':
      draft.appleShortcut = {
        shortcutName: r.shortcutName,
        passImage: r.passImageVia === 'clipboard',
      };
      break;
    case 'android-intent':
      draft.androidIntent = {
        pkg: r.package,
        action: r.action,
        mimeType: r.mimeType,
        text: r.text ?? '',
        passImage: r.passImageVia === 'clipboard',
      };
      break;
    case 'url-scheme':
      draft.urlScheme = {
        template: r.template,
        recipient: r.recipient ?? '',
        text: r.text ?? '',
        passImage: r.passImageVia,
      };
      break;
  }
  return draft;
}

function buildRoute(
  kind: ShareRouteKind,
  draft: DraftState,
): ShareRoute | null {
  switch (kind) {
    case 'web-share':
      return {
        kind: 'web-share',
        title: draft.webShare.title.trim() || undefined,
        text: draft.webShare.text.trim() || undefined,
      };
    case 'apple-shortcut': {
      const name = draft.appleShortcut.shortcutName.trim();
      if (!name) return null;
      return {
        kind: 'apple-shortcut',
        shortcutName: name,
        passImageVia: draft.appleShortcut.passImage ? 'clipboard' : 'none',
      };
    }
    case 'android-intent': {
      const pkg = draft.androidIntent.pkg.trim();
      const action = draft.androidIntent.action.trim();
      const mimeType = draft.androidIntent.mimeType.trim();
      if (!pkg || !action || !mimeType) return null;
      return {
        kind: 'android-intent',
        package: pkg,
        action,
        mimeType,
        text: draft.androidIntent.text.trim() || undefined,
        passImageVia: draft.androidIntent.passImage ? 'clipboard' : 'none',
      };
    }
    case 'url-scheme': {
      const template = draft.urlScheme.template.trim();
      if (!template) return null;
      return {
        kind: 'url-scheme',
        template,
        recipient: draft.urlScheme.recipient.trim() || undefined,
        text: draft.urlScheme.text.trim() || undefined,
        passImageVia: draft.urlScheme.passImage,
      };
    }
  }
}

export function BookmarkEditor({ initial, onCancel, onSave }: Props) {
  const [label, setLabel] = useState(initial?.label ?? '');
  const [kind, setKind] = useState<ShareRouteKind>(
    initial?.route.kind ?? 'web-share',
  );
  const [draft, setDraft] = useState<DraftState>(() => initialDraft(initial));

  const trimmedLabel = label.trim();
  const route = buildRoute(kind, draft);
  const canSave = !!trimmedLabel && !!route;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!trimmedLabel || !route) return;
    onSave({ id: initial?.id, label: trimmedLabel, route });
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

        <div className="field" role="group" aria-labelledby="bm-kind-label">
          <span id="bm-kind-label" className="field__label">
            Route
          </span>
          <div className="segmented">
            {(Object.keys(KIND_LABELS) as ShareRouteKind[]).map((k) => (
              <button
                key={k}
                type="button"
                className={
                  'segmented__option' +
                  (kind === k ? ' segmented__option--active' : '')
                }
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
              >
                {KIND_LABELS[k]}
              </button>
            ))}
          </div>
        </div>

        {kind === 'web-share' && (
          <>
            <label className="field">
              <span className="field__label">Title (optional)</span>
              <input
                className="field__input"
                value={draft.webShare.title}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    webShare: { ...d.webShare, title: e.target.value },
                  }))
                }
                placeholder="Subject line for emails"
                maxLength={120}
              />
            </label>
            <label className="field">
              <span className="field__label">Caption (optional)</span>
              <textarea
                className="field__input field__input--textarea"
                value={draft.webShare.text}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    webShare: { ...d.webShare, text: e.target.value },
                  }))
                }
                placeholder="Message that pre-fills when sharing"
                rows={3}
                maxLength={500}
              />
            </label>
            <p className="field__hint">
              Opens the system share sheet with this title and caption
              pre-filled. The destination is still picked by you.
            </p>
          </>
        )}

        {kind === 'apple-shortcut' && (
          <>
            <label className="field">
              <span className="field__label">Shortcut name</span>
              <input
                className="field__input"
                value={draft.appleShortcut.shortcutName}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    appleShortcut: {
                      ...d.appleShortcut,
                      shortcutName: e.target.value,
                    },
                  }))
                }
                placeholder="e.g. Send to Mom"
                maxLength={120}
                required
              />
            </label>
            <label className="field field--row">
              <input
                type="checkbox"
                checked={draft.appleShortcut.passImage}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    appleShortcut: {
                      ...d.appleShortcut,
                      passImage: e.target.checked,
                    },
                  }))
                }
              />
              <span>Copy photo to clipboard before running</span>
            </label>
            <p className="field__hint">
              Create a matching shortcut in the iOS Shortcuts app (works on iOS,
              iPadOS, and macOS). Have it read the clipboard image and do
              whatever you want with it.
            </p>
          </>
        )}

        {kind === 'android-intent' && (
          <>
            <label className="field">
              <span className="field__label">Package</span>
              <input
                className="field__input"
                value={draft.androidIntent.pkg}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    androidIntent: { ...d.androidIntent, pkg: e.target.value },
                  }))
                }
                placeholder="com.whatsapp"
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Action</span>
              <input
                className="field__input"
                value={draft.androidIntent.action}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    androidIntent: {
                      ...d.androidIntent,
                      action: e.target.value,
                    },
                  }))
                }
                required
              />
            </label>
            <label className="field">
              <span className="field__label">MIME type</span>
              <input
                className="field__input"
                value={draft.androidIntent.mimeType}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    androidIntent: {
                      ...d.androidIntent,
                      mimeType: e.target.value,
                    },
                  }))
                }
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Text (optional)</span>
              <input
                className="field__input"
                value={draft.androidIntent.text}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    androidIntent: {
                      ...d.androidIntent,
                      text: e.target.value,
                    },
                  }))
                }
                placeholder="Caption forwarded to the target app"
                maxLength={500}
              />
            </label>
            <label className="field field--row">
              <input
                type="checkbox"
                checked={draft.androidIntent.passImage}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    androidIntent: {
                      ...d.androidIntent,
                      passImage: e.target.checked,
                    },
                  }))
                }
              />
              <span>Copy photo to clipboard before launching</span>
            </label>
            <p className="field__hint">
              Chrome on Android only. The target app must be able to read the
              image from the clipboard when you paste.
            </p>
          </>
        )}

        {kind === 'url-scheme' && (
          <>
            <div className="field">
              <span className="field__label">Presets</span>
              <div className="chiprow">
                {URL_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className="chip"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        urlScheme: { ...d.urlScheme, template: p.template },
                      }))
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="field">
              <span className="field__label">URL template</span>
              <input
                className="field__input"
                value={draft.urlScheme.template}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    urlScheme: { ...d.urlScheme, template: e.target.value },
                  }))
                }
                placeholder="https://wa.me/{recipient}?text={text}"
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Recipient (optional)</span>
              <input
                className="field__input"
                value={draft.urlScheme.recipient}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    urlScheme: { ...d.urlScheme, recipient: e.target.value },
                  }))
                }
                placeholder="Phone, email, handle — fills {recipient}"
              />
            </label>
            <label className="field">
              <span className="field__label">Text (optional)</span>
              <input
                className="field__input"
                value={draft.urlScheme.text}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    urlScheme: { ...d.urlScheme, text: e.target.value },
                  }))
                }
                placeholder="Caption — fills {text}"
                maxLength={500}
              />
            </label>
            <label className="field">
              <span className="field__label">Photo handoff</span>
              <select
                className="field__input"
                value={draft.urlScheme.passImage}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    urlScheme: {
                      ...d.urlScheme,
                      passImage: e.target
                        .value as DraftState['urlScheme']['passImage'],
                    },
                  }))
                }
              >
                <option value="clipboard">Copy to clipboard</option>
                <option value="download">Trigger download</option>
                <option value="none">Don't attach photo</option>
              </select>
            </label>
            <p className="field__hint">
              URL schemes can't attach files — the photo travels via clipboard
              or a download, and you paste/attach it in the target app.
            </p>
          </>
        )}

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={!canSave}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { deleteBookmark, listBookmarks, saveBookmark } from '../lib/bookmarks';
import type { Bookmark } from '../types';
import { BookmarkEditor } from './BookmarkEditor';

type Props = {
  onBack: () => void;
  toast: (msg: string) => void;
};

export function BookmarksScreen({ onBack, toast }: Props) {
  const [items, setItems] = useState<Bookmark[]>(() => listBookmarks());
  const [editing, setEditing] = useState<Bookmark | 'new' | null>(null);

  const refresh = () => setItems(listBookmarks());

  const handleSave = (input: Omit<Bookmark, 'id'> & { id?: string }) => {
    saveBookmark(input);
    refresh();
    setEditing(null);
    toast(input.id ? 'Bookmark updated' : 'Bookmark added');
  };

  const handleDelete = (id: string) => {
    const ok = window.confirm('Delete this bookmark?');
    if (!ok) return;
    deleteBookmark(id);
    refresh();
    toast('Bookmark deleted');
  };

  return (
    <div className="screen">
      <header className="topbar">
        <button
          type="button"
          className="iconbtn"
          onClick={onBack}
          aria-label="Back"
        >
          <BackIcon />
        </button>
        <h1 className="topbar__title">Bookmarks</h1>
        <button
          type="button"
          className="iconbtn iconbtn--primary"
          onClick={() => setEditing('new')}
          aria-label="Add bookmark"
        >
          <PlusIcon />
        </button>
      </header>

      <div className="screen__body">
        <p className="screen__intro">
          Bookmarks are share presets — a label plus an optional title and
          caption. Tap one on a photo to open the system share sheet with the
          message pre-filled.
        </p>

        {items.length === 0 ? (
          <div className="screen__empty">
            <p>No bookmarks yet.</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setEditing('new')}
            >
              Add your first bookmark
            </button>
          </div>
        ) : (
          <ul className="bookmarklist">
            {items.map((b) => (
              <li key={b.id} className="bookmarklist__item">
                <button
                  type="button"
                  className="bookmarklist__main"
                  onClick={() => setEditing(b)}
                  aria-label={`Edit ${b.label}`}
                >
                  <div className="bookmarklist__label">{b.label}</div>
                  {(b.title || b.text) && (
                    <div className="bookmarklist__sub">
                      {[b.title, b.text].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  className="iconbtn iconbtn--danger"
                  onClick={() => handleDelete(b.id)}
                  aria-label={`Delete ${b.label}`}
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <BookmarkEditor
          initial={editing === 'new' ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function BackIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

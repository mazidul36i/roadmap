import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Link2, Plus, X } from "lucide-react";
import type { NoteCategory } from "@app-types/index";
import { uid, useApp } from "@context/AppContext";
import { Button, Card, CardHeader, IconButton, Select } from "@ui/index";
import { formatRelative } from "@lib/dates";
import s from "./LinkedNotes.module.css";

interface LinkedNotesProps {
  /** Ids currently linked on the (already saved) entity. */
  linkedIds: string[] | undefined;
  /** Persists the new list of ids on the entity. */
  onChange: (ids: string[]) => void;
  /** Title for a freshly created note. */
  title: string;
  category: NoteCategory;
}

/** Notes attached to a story, mock, problem… Creating a note links it in the same step. */
export function LinkedNotes({ linkedIds = [], onChange, title, category }: LinkedNotesProps) {
  const { state, dispatch } = useApp();
  const [picking, setPicking] = useState(false);
  const linked = useMemo(() => state.notes.filter(n => linkedIds.includes(n.id)), [state.notes, linkedIds]);
  const candidates = useMemo(
    () => state.notes.filter(n => !linkedIds.includes(n.id)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [state.notes, linkedIds],
  );

  const create = () => {
    const now = new Date().toISOString();
    const note = {
      id: uid(),
      title: `Notes: ${title || "Untitled"}`,
      content: "",
      category,
      tags: [category],
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: "ADD_NOTE", note });
    onChange([...linkedIds, note.id]);
  };

  return (
    <Card>
      <CardHeader
        title="Linked notes"
        icon={<Link2 size={20} />}
        action={
          <Button size="sm" variant="soft" icon={<Plus size={14} />} onClick={create}>
            New
          </Button>
        }
      />
      {linked.length === 0 && !picking && <p className="u-sm u-faint">Attach longer write-ups without leaving this page.</p>}
      <ul className={s.list} role="list">
        {linked.map(n => (
          <li key={n.id} className={s.row}>
            <FileText size={16} aria-hidden className={s.icon} />
            <Link to={`/notes/${n.id}`} className={s.title}>
              {n.title || "Untitled note"}
            </Link>
            <span className="u-xs u-faint">{formatRelative(n.updatedAt)}</span>
            <IconButton
              size="sm"
              variant="ghost"
              label={`Unlink ${n.title}`}
              icon={<X size={14} />}
              onClick={() => onChange(linkedIds.filter(x => x !== n.id))}
            />
          </li>
        ))}
      </ul>
      {candidates.length > 0 &&
        (picking ? (
          <Select
            aria-label="Link an existing note"
            value=""
            autoFocus
            onBlur={() => setPicking(false)}
            onChange={e => {
              if (e.target.value) onChange([...linkedIds, e.target.value]);
              setPicking(false);
            }}
            options={[
              { value: "", label: "Choose a note…" },
              ...candidates.slice(0, 200).map(n => ({
                value: n.id,
                label: n.title || "Untitled note",
              })),
            ]}
          />
        ) : (
          <Button size="sm" variant="ghost" icon={<Link2 size={14} />} onClick={() => setPicking(true)}>
            Link an existing note
          </Button>
        ))}
    </Card>
  );
}

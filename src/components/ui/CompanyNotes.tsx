import { useState, useRef } from "react";
import { MoreVertical, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  notes: string;
  onSave: (newNotes: string) => Promise<void>;
  onDelete?: () => Promise<void>;

  // Optional controlled mode
  isEditing?: boolean;
  setIsEditing?: React.Dispatch<React.SetStateAction<boolean>>;
  noteDraft?: string;
  setNoteDraft?: React.Dispatch<React.SetStateAction<string>>;
  showMenu?: boolean;
  setShowMenu?: React.Dispatch<React.SetStateAction<boolean>>;
  menuRef?: React.RefObject<HTMLDivElement | null>;
  embedded?: boolean;
};

export default function CompanyNotes({
  notes,
  onSave,
  onDelete,
  isEditing,
  setIsEditing,
  noteDraft,
  setNoteDraft,
  showMenu,
  setShowMenu,
  menuRef,
  embedded = false,
}: Props) {
  // Internal fallback state if none provided
  const [internalEditing, setInternalEditing] = useState(false);
  const [internalDraft, setInternalDraft] = useState(notes || "");
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const internalMenuRef = useRef<HTMLDivElement>(null);

  const editing = isEditing ?? internalEditing;
  const updateEditing = setIsEditing ?? setInternalEditing;
  const draft = noteDraft ?? internalDraft;
  const updateDraft = setNoteDraft ?? setInternalDraft;
  const menuOpen = showMenu ?? internalMenuOpen;
  const updateMenuOpen = setShowMenu ?? setInternalMenuOpen;
  const ref = menuRef ?? internalMenuRef;

  // embedded: render open, without the collapsible box (used inside record tabs)
  const content = (
    <>

      <div className="p-4">
        {!notes && !editing ? (
          <Button
            onClick={() => updateEditing(true)}
            size="sm"
          >
            Add Note
          </Button>
        ) : editing ? (
          <div className="space-y-2">
            <textarea
              value={draft}
              onChange={(e) => updateDraft(e.target.value)}
              rows={4}
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="Enter notes here"
            />
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  await onSave(draft);
                  updateEditing(false);
                }}
                size="sm"
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  updateEditing(false);
                  updateDraft(notes || "");
                }}
                size="sm" variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative border border-gray-200 rounded p-4 bg-white shadow-sm">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{notes}</p>
            <div className="absolute top-2 right-2" ref={ref}>
              <button
                onClick={() => updateMenuOpen(!menuOpen)}
                className="text-gray-500 hover:text-gray-700"
              >
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-24 bg-white border rounded shadow-md z-10">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      updateEditing(true);
                      updateMenuOpen(false);
                    }}
                  >
                    Edit
                  </button>
                  {onDelete && (
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      onClick={onDelete}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (embedded) return content;

  return (
    <details className="bg-white rounded shadow-sm border">
      <summary className="cursor-pointer px-4 py-2 font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-t flex items-center gap-2">
        <StickyNote size={16} /> Notes
      </summary>
      {content}
    </details>
  );
}

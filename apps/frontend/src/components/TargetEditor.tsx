import type { ReactNode } from "react";
import type { StackTarget } from "../types";

type TargetKind = StackTarget["kind"];

type TargetEditorProps = {
  kind: TargetKind;
  onKindChange: (kind: TargetKind) => void;
  kindOptions: Array<{ value: TargetKind; label: string }>;
  kindLabel: string;
  renderInputsForKind: (kind: TargetKind) => ReactNode;
  onAddTarget: () => void;
  addButtonLabel: string;
  addButtonAriaLabel?: string;
  targets: StackTarget[];
  formatTarget: (target: StackTarget) => string;
  onRemoveTarget: (targetIndex: number) => void;
};

export function TargetEditor({
  kind,
  onKindChange,
  kindOptions,
  kindLabel,
  renderInputsForKind,
  onAddTarget,
  addButtonLabel,
  addButtonAriaLabel,
  targets,
  formatTarget,
  onRemoveTarget
}: TargetEditorProps): JSX.Element {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label={kindLabel}
          value={kind}
          onChange={(event) => onKindChange(event.target.value as TargetKind)}
          className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
        >
          {kindOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {renderInputsForKind(kind)}
        <button
          type="button"
          aria-label={addButtonAriaLabel}
          onClick={onAddTarget}
          className="rounded-md border border-slate-500 bg-slate-700 px-2 py-1 text-xs text-slate-100"
        >
          {addButtonLabel}
        </button>
      </div>
      {targets.length > 0 && (
        <ul className="space-y-1">
          {targets.map((target, index) => (
            <li key={`${target.kind}-${index}`} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-200">{formatTarget(target)}</span>
              <button
                type="button"
                onClick={() => onRemoveTarget(index)}
                className="rounded border border-slate-500 px-1.5 py-0.5 text-[11px] text-slate-100"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

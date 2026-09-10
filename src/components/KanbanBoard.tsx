import type { ReactNode } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
  type DragEndEvent,
} from "@dnd-kit/core";

export interface KanbanColumn {
  id: string; // WorkflowStage id
  title: string;
  color?: string | null;
}

export interface KanbanBoardProps<T extends { id: string }> {
  columns: KanbanColumn[];
  items: T[];
  getColumnId: (item: T) => string | null; // null = unplaced, rendered in the first column's overflow bucket
  renderCard: (item: T) => ReactNode;
  onMove: (itemId: string, newColumnId: string) => void;
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  items,
  getColumnId,
  renderCard,
  onMove,
}: KanbanBoardProps<T>) {
  // Without an activation distance, PointerSensor treats every mousedown as a
  // drag start and swallows the click, so cards become unclickable for
  // navigation. Require 8px of movement before a drag "counts" -- plain
  // clicks (or the tiny jitter a synthetic click can produce) pass through.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const columnId = String(over.id);
    if (columnId !== getColumnId(items.find((i) => i.id === active.id) as T)) {
      onMove(String(active.id), columnId);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <Column
            key={col.id}
            column={col}
            items={items.filter((i) => getColumnId(i) === col.id || (col === columns[0] && getColumnId(i) === null))}
            renderCard={renderCard}
          />
        ))}
      </div>
    </DndContext>
  );
}

function Column<T extends { id: string }>({
  column,
  items,
  renderCard,
}: {
  column: KanbanColumn;
  items: T[];
  renderCard: (item: T) => ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border p-2 transition-colors ${
        isOver ? "border-[#5b8cff] bg-[#5b8cff]/5" : "border-[#2a2f3a] bg-[#171a21]"
      }`}
    >
      <div className="flex items-center gap-2 px-2 py-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color ?? "#9aa1ac" }} />
        <span className="text-sm font-semibold text-white">{column.title}</span>
        <span className="text-xs text-[#9aa1ac]">{items.length}</span>
      </div>
      <div className="flex flex-col gap-2 px-1 pb-1">
        {items.map((item) => (
          <Card key={item.id} item={item}>
            {renderCard(item)}
          </Card>
        ))}
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-[#2a2f3a] py-6 text-center text-xs text-[#9aa1ac]">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

function Card<T extends { id: string }>({ item, children }: { item: T; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-lg border border-[#2a2f3a] bg-[#1e2229] p-3 active:cursor-grabbing ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      {children}
    </div>
  );
}

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export default function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(
      transform && isDragging
        ? { ...transform, scaleX: 1.03, scaleY: 1.03 }
        : transform
    ),
    transition,
    boxShadow: isDragging ? '0 22px 40px -12px rgba(15, 23, 42, 0.28)' : undefined,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border p-5 shadow-sm flex gap-3 ${
        isDragging
          ? 'border-[#0058BE] cursor-grabbing'
          : 'border-gray-200'
      }`}
    >
      <button
        type="button"
        className="mt-1 shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder question"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
      <div className="flex-1 min-w-0 space-y-4">{children}</div>
    </div>
  );
}

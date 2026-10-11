import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { FileItem } from '../lib/fileList';
import { FileCard } from './FileCard';

interface Props {
  items: FileItem[];
  onMove(activeId: string, overId: string): void;
  onRemove(id: string): void;
  onRotate?(id: string): void;
}

export function SortableFileGrid({ items, onMove, onRemove, onRotate }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <ul aria-label="Selected files" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <FileCard key={item.id} item={item} onRemove={onRemove} onRotate={onRotate} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

import React from 'react';

export interface FloorPlanTable {
  id: string;
  name: string;
  capacity?: number;
  area?: string | null;
  status?: string;
  pos_x?: number | null;
  pos_y?: number | null;
}

interface FloorPlanViewProps {
  imageUrl?: string | null;
  tables: FloorPlanTable[];
  selectedTableId?: string;
  onTableClick?: (table: FloorPlanTable) => void;
  onPlace?: (x: number, y: number) => void;
  className?: string;
}

const statusClasses = (status?: string) => {
  switch (status) {
    case 'occupied':
      return 'bg-destructive text-destructive-foreground border-destructive';
    case 'reserved':
      return 'bg-accent text-accent-foreground border-accent';
    case 'cleaning':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-primary text-primary-foreground border-primary';
  }
};

export function FloorPlanView({
  imageUrl,
  tables,
  selectedTableId,
  onTableClick,
  onPlace,
  className,
}: FloorPlanViewProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onPlace) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onPlace(Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
  };

  const placed = tables.filter(t => t.pos_x != null && t.pos_y != null);

  return (
    <div
      onClick={handleClick}
      className={`relative w-full overflow-hidden rounded-lg border bg-muted/30 ${onPlace ? 'cursor-crosshair' : ''} ${className || ''}`}
      style={{ minHeight: 320 }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="Restaurant floor plan layout" className="w-full select-none" draggable={false} />
      ) : (
        <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
          Upload a floor plan image to map your tables
        </div>
      )}

      {placed.map(table => (
        <button
          key={table.id}
          type="button"
          onClick={e => {
            e.stopPropagation();
            onTableClick?.(table);
          }}
          style={{ left: `${table.pos_x}%`, top: `${table.pos_y}%` }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-md border px-2 py-1 text-xs font-semibold shadow transition-transform hover:scale-105 ${statusClasses(
            table.status,
          )} ${selectedTableId === table.id ? 'ring-2 ring-ring ring-offset-2' : ''}`}
          title={`${table.name}${table.capacity ? ` · ${table.capacity} seats` : ''}`}
        >
          {table.name}
        </button>
      ))}
    </div>
  );
}

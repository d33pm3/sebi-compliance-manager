import { TileColor } from '@/lib/chartTheme';

interface StatTileProps {
  icon?: React.ReactNode;
  label: string;
  value: number;
  bg: TileColor;
  active?: boolean;
  onClick?: () => void;
  title?: string;
}

/**
 * Shared clickable stat tile used by the Dashboard and Risk Assessment modules.
 * Colours come from the shared chart palette so tiles always match their charts.
 */
export function StatTile({ icon, label, value, bg, active, onClick, title }: StatTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group w-full rounded-lg text-left transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${active ? 'ring-2 ring-offset-2 ring-ring' : ''}`}
      style={{ backgroundColor: bg.bg, color: bg.fg }}
      title={title ?? `View ${label} in the Master Compliance Register`}
    >
      <div className="p-3 flex items-center gap-3">
        {icon && <div className="opacity-80 flex-shrink-0" style={{ color: bg.fg }}>{icon}</div>}
        <div className="min-w-0">
          <p className="text-xl font-bold leading-none" style={{ color: bg.fg }}>{value}</p>
          <p className="text-[10px] font-medium mt-1 truncate opacity-80" style={{ color: bg.fg }}>{label}</p>
        </div>
      </div>
    </button>
  );
}

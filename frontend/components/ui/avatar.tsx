import { cn, getInitials } from "@/lib/utils";

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

const colorMap = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
];

function getColorIndex(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return hash % colorMap.length;
}

interface AvatarProps {
  name: string;
  src?: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const colorClass = colorMap[getColorIndex(name)];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold flex-shrink-0",
        sizeClasses[size],
        colorClass,
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}

interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: keyof typeof sizeClasses;
}

export function AvatarGroup({ names, max = 3, size = "sm" }: AvatarGroupProps) {
  const visible = names.slice(0, max);
  const rest = names.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((name) => (
        <Avatar
          key={name}
          name={name}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {rest > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-slate-200 text-slate-600 font-medium ring-2 ring-white text-xs",
            sizeClasses[size]
          )}
        >
          +{rest}
        </div>
      )}
    </div>
  );
}

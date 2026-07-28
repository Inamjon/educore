"use client";

import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function Checkbox({ checked, onCheckedChange, label, className }: CheckboxProps) {
  return (
    <label className={cn("flex items-center gap-2 cursor-pointer select-none", className)}>
      <RadixCheckbox.Root
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className={cn(
          "h-[18px] w-[18px] rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
          checked ? "bg-indigo-600 border-indigo-600" : "border-slate-300 hover:border-indigo-400 bg-white"
        )}
      >
        <RadixCheckbox.Indicator>
          <Check className="h-3 w-3 text-white" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label && <span className="text-sm text-slate-600">{label}</span>}
    </label>
  );
}

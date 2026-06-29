"use client";

import { optionBClassNames } from "@/components/option-b/theme";
import { Badge } from "@/components/ui/badge";

interface FingeringHintBadgeProps {
  fingering: number[];
}

export function FingeringHintBadge({ fingering }: FingeringHintBadgeProps) {
  if (fingering.length === 0) {
    return (
      <Badge
        variant="outline"
        className={`${optionBClassNames.body} rounded-sm border-[#d2c6ae] bg-[#fefcf8] text-[#7a6f5c]`}
      >
        Fingering unavailable
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={`${optionBClassNames.body} rounded-sm border border-[#d9ccb2] bg-[#f1e8d8] text-[#5a5246]`}
    >
      RH fingering: {fingering.join("-")}
    </Badge>
  );
}


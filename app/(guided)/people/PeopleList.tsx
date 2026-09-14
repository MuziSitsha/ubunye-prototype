"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface PersonCard {
  userId: string;
  firstName: string;
  lastName: string;
  city: string | null;
  total: number;
  whyMatched: string;
}

const MAX_SELECTION = 3;

export function PeopleList({ people }: { people: PersonCard[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else if (next.size < MAX_SELECTION) {
        next.add(userId);
      }
      return next;
    });
  }

  function handleContinue() {
    const params = new URLSearchParams({ members: [...selected].join(",") });
    router.push(`/opportunity?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {people.map((person) => {
          const isSelected = selected.has(person.userId);
          return (
            <li key={person.userId}>
              <Card className={isSelected ? "border-terracotta ring-2 ring-terracotta/20" : ""}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-ink">
                      {person.firstName} {person.lastName}
                    </h3>
                    {person.city && <p className="text-sm text-ink-muted">{person.city}</p>}
                  </div>
                  <span className="shrink-0 rounded-full bg-green-light px-2.5 py-1 text-xs font-semibold text-green">
                    {Math.round(person.total * 100)}% fit
                  </span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  <span className="font-medium text-ink">Why Ubunye matched you: </span>
                  {person.whyMatched}
                </p>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant={isSelected ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => toggle(person.userId)}
                    disabled={!isSelected && selected.size >= MAX_SELECTION}
                  >
                    {isSelected ? "Selected" : "Interested"}
                  </Button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-4">
        <Button size="lg" fullWidth disabled={selected.size === 0} onClick={handleContinue}>
          {`Find Our Opportunity${selected.size > 0 ? ` (${selected.size} selected)` : ""}`}
        </Button>
      </div>
    </div>
  );
}

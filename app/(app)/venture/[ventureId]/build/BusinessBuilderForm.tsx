"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextAreaField } from "@/components/ui/FormField";
import { fetchJson, ApiError } from "@/lib/fetchJson";
import type { Venture } from "@/types/domain";

type Section = "business_concept" | "customer" | "operations" | "money";

const SECTIONS: {
  section: Section;
  title: string;
  fields: { key: string; label: string; placeholder: string }[];
}[] = [
  {
    section: "business_concept",
    title: "Business Concept",
    fields: [
      { key: "whatWeSell", label: "What will we sell?", placeholder: "e.g. On-site fridge and washing machine repairs" },
      { key: "whoWillBuy", label: "Who will buy it?", placeholder: "e.g. Households in and around Johannesburg" },
      { key: "whyChooseUs", label: "Why would they choose us?", placeholder: "e.g. Faster and cheaper than retail repair shops" },
    ],
  },
  {
    section: "customer",
    title: "Customer",
    fields: [
      { key: "targetCustomer", label: "Target customer", placeholder: "e.g. Homeowners with ageing appliances" },
      { key: "customerProblem", label: "Customer problem", placeholder: "e.g. Repairs are slow, expensive or hard to find" },
    ],
  },
  {
    section: "operations",
    title: "Operations",
    fields: [{ key: "needs", label: "What does the team need to operate?", placeholder: "e.g. Spare parts supplier, booking system" }],
  },
  {
    section: "money",
    title: "Money",
    fields: [
      { key: "startupRequirement", label: "Estimated startup requirement", placeholder: "e.g. R8,000 for tools and stock" },
      { key: "revenueConcept", label: "Basic revenue concept", placeholder: "e.g. R350 average call-out fee" },
    ],
  },
];

function sectionValues(venture: Venture, section: Section): Record<string, string> {
  const raw =
    section === "business_concept"
      ? venture.businessConcept
      : section === "customer"
        ? venture.customer
        : section === "operations"
          ? venture.operations
          : venture.money;
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v ?? ""])) as Record<string, string>;
}

export function BusinessBuilderForm({ ventureId, venture }: { ventureId: string; venture: Venture }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<Section, Record<string, string>>>({
    business_concept: sectionValues(venture, "business_concept"),
    customer: sectionValues(venture, "customer"),
    operations: sectionValues(venture, "operations"),
    money: sectionValues(venture, "money"),
  });
  const [savingSection, setSavingSection] = useState<Section | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(section: Section) {
    setError(null);
    setSavingSection(section);
    try {
      await fetchJson(`/api/ventures/${ventureId}/business-builder`, {
        method: "PATCH",
        body: JSON.stringify({ section, values: values[section] }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't save that. Please try again.");
    } finally {
      setSavingSection(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-xl bg-danger-light px-3.5 py-2.5 text-sm text-danger">{error}</p>}
      {SECTIONS.map(({ section, title, fields }) => (
        <Card key={section}>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <div className="mt-3 space-y-3">
            {fields.map((field) => (
              <TextAreaField
                key={field.key}
                id={`${section}-${field.key}`}
                label={field.label}
                placeholder={field.placeholder}
                rows={2}
                value={values[section][field.key] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [section]: { ...prev[section], [field.key]: e.target.value } }))
                }
              />
            ))}
          </div>
          <Button size="sm" variant="secondary" className="mt-3" disabled={savingSection === section} onClick={() => handleSave(section)}>
            {savingSection === section ? "Saving…" : "Save"}
          </Button>
        </Card>
      ))}
    </div>
  );
}

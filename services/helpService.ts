// "Ask For Help" (spec §25). Prototype response only — no partner integration exists.

import { AppError } from "@/lib/errors";
import type { HelpTopic } from "@/types/domain";
import type { SupabaseClientType } from "@/types/supabase-helpers";

export const HELP_TOPICS: { value: HelpTopic; label: string; title: string; description: string }[] = [
  {
    value: "business_plan",
    label: "Business plan",
    title: "Business Plan Support",
    description: "A participating Ubunye banking partner could help your team develop a funding-ready business plan.",
  },
  {
    value: "financial_plan",
    label: "Financial plan",
    title: "Financial Plan Support",
    description: "Get help turning your startup and revenue estimates into a full financial plan.",
  },
  {
    value: "funding_application",
    label: "Funding application",
    title: "Funding Application Support",
    description: "Guidance on preparing a strong application for the funding and support programmes listed in Ubunye.",
  },
  {
    value: "marketing",
    label: "Marketing",
    title: "Marketing Support",
    description: "Ideas and templates for reaching your first customers with the resources your team already has.",
  },
  {
    value: "pricing",
    label: "Pricing",
    title: "Pricing Support",
    description: "Help setting prices that cover your costs and match what customers in your area expect to pay.",
  },
  {
    value: "registration",
    label: "Registration",
    title: "Business Registration Support",
    description: "A walkthrough of what's needed to formally register your business.",
  },
  {
    value: "compliance",
    label: "Compliance",
    title: "Compliance Support",
    description: "Guidance on the basic compliance requirements for a business like yours.",
  },
  {
    value: "business_banking",
    label: "Business banking",
    title: "Business Banking Support",
    description: "Help opening a business bank account and understanding what documents you'll need.",
  },
  {
    value: "contracts",
    label: "Contracts",
    title: "Contract Support",
    description: "Guidance on the basic agreements a small service business typically needs with clients.",
  },
  {
    value: "general_advice",
    label: "General business advice",
    title: "General Business Advice",
    description: "Speak to someone about any part of the journey your team isn't sure about.",
  },
];

export async function submitHelpRequest(
  supabase: SupabaseClientType,
  userId: string,
  topic: HelpTopic,
  options: { ventureId?: string; message?: string } = {}
) {
  const { data, error } = await supabase
    .from("help_requests")
    .insert({ user_id: userId, venture_id: options.ventureId ?? null, topic, message: options.message ?? null })
    .select("*")
    .single();

  if (error || !data) throw new AppError("We couldn't submit your request. Please try again.", error);

  const topicInfo = HELP_TOPICS.find((t) => t.value === topic)!;
  return { request: data, topicInfo };
}

export async function listHelpRequests(supabase: SupabaseClientType, userId: string) {
  const { data, error } = await supabase
    .from("help_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new AppError("We couldn't load your help requests.", error);
  return data ?? [];
}

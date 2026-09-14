import { apiRoute, requireDemoPanel } from "@/lib/api";
import { resetDemo } from "@/services/demoService";

export const POST = apiRoute(async () => {
  requireDemoPanel();
  return resetDemo();
});

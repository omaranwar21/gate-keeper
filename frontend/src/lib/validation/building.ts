import { z } from "zod";

export const buildingFormSchema = z.object({
  name: z.string().min(1).max(120),
});

export type BuildingFormInput = z.infer<typeof buildingFormSchema>;

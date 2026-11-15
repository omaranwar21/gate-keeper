import { z } from "zod";

export const compoundSettingsFormSchema = z.object({
  // Empty input means "no limit" (null).
  maxActivePassesPerUnitPerDay: z
    .union([z.literal(""), z.coerce.number().int().min(1)])
    .transform((value) => (value === "" ? null : value)),
});

export type CompoundSettingsFormInput = z.input<typeof compoundSettingsFormSchema>;
export type CompoundSettingsFormOutput = z.output<typeof compoundSettingsFormSchema>;

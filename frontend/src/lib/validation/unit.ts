import { z } from "zod";

export const unitFormSchema = z.object({
  buildingId: z.string().uuid(),
  number: z.string().min(1).max(40),
  floor: z
    .union([z.literal(""), z.coerce.number().int()])
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : value)),
});

export type UnitFormInput = z.input<typeof unitFormSchema>;
export type UnitFormOutput = z.output<typeof unitFormSchema>;

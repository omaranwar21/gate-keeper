import { z } from "zod";

const baseFields = {
  unitId: z.string().uuid(),
  guestName: z.string().min(1).max(120),
};

const oneTimeSchema = z.object({
  ...baseFields,
  type: z.literal("one_time"),
  visitDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
});

const recurringSchema = z.object({
  ...baseFields,
  type: z.literal("recurring"),
  startDate: z.string().min(1),
  untilDate: z.string().min(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
  dailyStartTime: z.string().min(1),
  dailyEndTime: z.string().min(1),
});

export const guestPassFormSchema = z
  .discriminatedUnion("type", [oneTimeSchema, recurringSchema])
  .superRefine((data, ctx) => {
    if (data.type === "one_time") {
      if (data.endTime <= data.startTime) {
        ctx.addIssue({ code: "custom", message: "window", path: ["endTime"] });
      }
    } else {
      if (data.untilDate < data.startDate) {
        ctx.addIssue({ code: "custom", message: "window", path: ["untilDate"] });
      }
      if (data.dailyEndTime <= data.dailyStartTime) {
        ctx.addIssue({ code: "custom", message: "dailyWindow", path: ["dailyEndTime"] });
      }
    }
  });

export type GuestPassFormInput = z.infer<typeof guestPassFormSchema>;

import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1)
});

export const spinSchema = z.object({
  betAmount: z.number().int().positive().max(5000)
});

export const claimSchema = z.object({
  rewardId: z.string().trim().min(1)
});

import { z } from "zod"

export const createFlagSchema = z.object({
  paperId: z.string().min(1),
  reason: z.string().min(1).max(500),
})

export type CreateFlag = z.infer<typeof createFlagSchema>



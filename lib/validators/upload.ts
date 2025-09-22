import { z } from "zod"

export const uploadMetadataSchema = z.object({
  title: z.string().min(3).max(200),
  category: z.enum([
    "business-case",
    "equity-research",
    "accounting",
    "financial-modeling",
    "strategy",
  ]),
  competition: z.string().min(2).max(200),
  year: z.union([z.string().regex(/^\d{4}$/), z.number().int().min(1900).max(3000)]),
  university: z.string().min(2).max(200),
  team: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().default(""),
  topics: z.array(z.string().min(1)).max(50).default([]),
  companies: z.array(z.string().min(1)).max(100).default([]),
})

export type UploadMetadata = z.infer<typeof uploadMetadataSchema>
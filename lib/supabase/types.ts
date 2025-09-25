export type PaperRow = {
  id: string
  title: string
  category: string
  competition: string
  year: number
  university: string
  team: string | null
  description: string | null
  topics: string[] | null
  companies: string[] | null
  author_user_id: string
  storage_path: string
  file_type: string
  file_size: number
  views: number
  downloads: number
  likes: number
  verified: boolean
  status: "active" | "flagged" | "under-review" | "removed"
  created_at: string
  updated_at: string
}

export type FlagRow = {
  id: string
  paper_id: string
  user_id: string
  reason: string
  status: "open" | "resolved" | "rejected"
  created_at: string
  updated_at: string
}

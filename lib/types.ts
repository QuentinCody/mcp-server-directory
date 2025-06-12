// Ensure these enum values match the PostgreSQL ENUM types if you created them
export type ServerAuthentication = "Public" | "API Key" | "OAuth" | "Private" | "Unknown"
export type ServerDeployment = "Local" | "Remote" | "Cloud-Hosted" | "Unknown"

export interface MCPServer {
  id: string // UUID from database
  name: string
  author: string
  description?: string
  tools_count: number // snake_case to match db column
  authentication: ServerAuthentication
  deployment: ServerDeployment
  location?: string
  tags: string[]
  icon_url?: string // snake_case
  github_url?: string // snake_case

  detailed_info_statistics_requests_per_month?: string
  detailed_info_statistics_uptime?: string
  detailed_info_statistics_average_response_time?: string
  detailed_info_capabilities?: string
  detailed_info_documentation_url?: string
  detailed_info_usage_instructions?: string

  last_fetched_from_github_at: string // timestamptz
  created_at: string // timestamptz
  updated_at: string // timestamptz
}

// For data extracted from GitHub before inserting into DB
export type ExtractedMCPServerData = {
  name: string
  author: string
  description?: string
  toolsCount?: number // camelCase from extraction
  authentication?: ServerAuthentication
  deployment?: ServerDeployment
  location?: string
  tags?: string[] | string // Can be string from form, then parsed
  iconUrl?: string
  detailedInfo?: {
    statistics?: {
      requestsPerMonth?: string
      uptime?: string
      averageResponseTime?: string
    }
    capabilities?: string
    documentationUrl?: string
    usageInstructions?: string
  }
}

export interface FilterOptions {
  authentication: ServerAuthentication[]
  deployment: ServerDeployment[]
}

export type SortOption = "name-asc" | "name-desc" | "tools-asc" | "tools-desc" | "updated-asc" | "updated-desc"

// For Supabase table mapping
export interface MCPServerInsert {
  name: string
  author: string
  description?: string
  tools_count?: number
  authentication?: ServerAuthentication
  deployment?: ServerDeployment
  location?: string
  tags?: string[]
  icon_url?: string
  github_url: string // Must be present
  detailed_info_statistics_requests_per_month?: string
  detailed_info_statistics_uptime?: string
  detailed_info_statistics_average_response_time?: string
  detailed_info_capabilities?: string
  detailed_info_documentation_url?: string
  detailed_info_usage_instructions?: string
  last_fetched_from_github_at?: string
}

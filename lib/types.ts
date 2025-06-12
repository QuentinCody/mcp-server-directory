export type ServerAuthentication = "Public" | "API Key" | "OAuth" | "Private" | "Unknown"
export type ServerDeployment = "Local" | "Remote" | "Cloud-Hosted" | "Unknown"

export interface MCPServer {
  id: string
  name: string
  author: string
  description?: string // Made optional
  toolsCount: number // Will default to 0 if not found
  authentication: ServerAuthentication // Added "Unknown"
  deployment: ServerDeployment // Added "Unknown"
  location?: string
  tags: string[] // Will default to empty array
  lastUpdated: string
  iconUrl?: string
  githubUrl?: string
  detailedInfo: {
    statistics: {
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

export type ExtractedMCPServerData = {
  name: string
  author: string
  description?: string
  toolsCount?: number
  authentication?: ServerAuthentication
  deployment?: ServerDeployment
  location?: string
  tags?: string[]
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

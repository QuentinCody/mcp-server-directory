"use server"

import { Octokit } from "octokit"
import { githubUrlSchema, extractedMCPServerSchema } from "@/lib/schemas"
import { addMCPServer, mcpServers } from "@/lib/mcp-data"
import type { MCPServer, ExtractedMCPServerData } from "@/lib/types"
import { revalidatePath } from "next/cache"

export interface SubmitFromGitHubState {
  message: string
  error?: string
  success: boolean
  extractedData?: Partial<MCPServer>
}

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
})

// Helper to decode base64 content
function decodeBase64(encoded: string): string {
  return Buffer.from(encoded, "base64").toString("utf-8")
}

// List of potential manifest file names to check
const MANIFEST_FILES = ["mcp.json", "mcp-manifest.json", ".mcp/config.json", "manifest.json"]

async function fetchRepoContent(owner: string, repo: string, path: string): Promise<any | null> {
  try {
    const response = await octokit.rest.repos.getContent({ owner, repo, path })
    if (response.data && "content" in response.data && response.data.content) {
      const content = decodeBase64(response.data.content)
      return JSON.parse(content)
    }
  } catch (error: any) {
    if (error.status !== 404) {
      console.warn(`Error fetching content at ${owner}/${repo}/${path}:`, error.message)
    }
  }
  return null
}

async function fetchAndParseGitHubRepo(repoUrl: string): Promise<Partial<ExtractedMCPServerData>> {
  const url = new URL(repoUrl)
  const pathParts = url.pathname.split("/").filter(Boolean)
  if (pathParts.length < 2) {
    throw new Error("Invalid GitHub repository URL format.")
  }
  const owner = pathParts[0]
  const repo = pathParts[1]

  let extracted: Partial<ExtractedMCPServerData> = {}

  try {
    // 1. Fetch basic repository details
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo })
    extracted.name =
      repoData.name
        .split(/[-_]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") || "Untitled Server"
    extracted.author = repoData.owner?.login || "Unknown Author"
    extracted.description = repoData.description || undefined // Use repo description as a fallback

    // 2. Try to fetch a dedicated manifest file (e.g., mcp.json)
    let manifestJson: any = null
    for (const manifestPath of MANIFEST_FILES) {
      manifestJson = await fetchRepoContent(owner, repo, manifestPath)
      if (manifestJson) {
        console.log(`Found manifest file at: ${manifestPath}`)
        break
      }
    }

    if (manifestJson) {
      // If manifest found, use it as the primary source
      extracted = {
        ...extracted, // Keep inferred name/author if not in JSON
        name: manifestJson.name || extracted.name,
        author: manifestJson.author || extracted.author,
        description: manifestJson.description || extracted.description,
        toolsCount: typeof manifestJson.toolsCount === "number" ? manifestJson.toolsCount : undefined,
        authentication: manifestJson.authentication,
        deployment: manifestJson.deployment,
        location: manifestJson.location,
        tags: manifestJson.tags,
        iconUrl: manifestJson.iconUrl,
        detailedInfo: manifestJson.detailedInfo,
      }
    } else {
      // 3. If no manifest file, fetch and parse README
      let readmeContent = ""
      try {
        const { data: readmeData } = await octokit.rest.repos.getReadme({ owner, repo })
        if (readmeData.content) {
          readmeContent = decodeBase64(readmeData.content)
        }
      } catch (e) {
        console.warn(`Could not fetch README for ${owner}/${repo}.`)
      }

      if (readmeContent) {
        // Try to find a JSON code block in README
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/
        const match = readmeContent.match(jsonRegex)
        if (match && match[1]) {
          try {
            const readmeJson = JSON.parse(match[1])
            console.log("Found JSON in README for " + repoUrl)
            extracted = {
              ...extracted,
              name: readmeJson.name || extracted.name,
              author: readmeJson.author || extracted.author,
              description: readmeJson.description || extracted.description,
              toolsCount: typeof readmeJson.toolsCount === "number" ? readmeJson.toolsCount : undefined,
              authentication: readmeJson.authentication,
              deployment: readmeJson.deployment,
              location: readmeJson.location,
              tags: readmeJson.tags,
              iconUrl: readmeJson.iconUrl,
              detailedInfo: readmeJson.detailedInfo,
            }
          } catch (e) {
            console.warn("Failed to parse JSON from README for " + repoUrl + ":", e)
            // If JSON parsing fails, use README text for description if not already set by repoData.description
            if (!extracted.description && readmeContent) {
              const firstMeaningfulLine = readmeContent
                .split("\n")
                .find((line) => line.trim().length > 20 && !line.trim().startsWith("#"))
                ?.trim()
              if (firstMeaningfulLine && firstMeaningfulLine.length < 250) {
                extracted.description = firstMeaningfulLine
              }
            }
          }
        } else if (!extracted.description && readmeContent) {
          // No JSON in README, use first meaningful line as description if not set
          const firstMeaningfulLine = readmeContent
            .split("\n")
            .find((line) => line.trim().length > 20 && !line.trim().startsWith("#"))
            ?.trim()
          if (firstMeaningfulLine && firstMeaningfulLine.length < 250) {
            extracted.description = firstMeaningfulLine
          }
        }

        // Very basic keyword spotting for tags (example)
        if (!extracted.tags || extracted.tags.length === 0) {
          const newTags: string[] = []
          if (
            readmeContent.toLowerCase().includes(" mcp ") ||
            readmeContent.toLowerCase().includes("model context protocol")
          )
            newTags.push("mcp")
          if (readmeContent.toLowerCase().includes(" ai ")) newTags.push("ai")
          if (readmeContent.toLowerCase().includes(" llm")) newTags.push("llm")
          if (repoData.topics) newTags.push(...repoData.topics) // Add GitHub topics
          extracted.tags = Array.from(new Set(newTags))
        }
      }
    }

    // Ensure tags are an array and clean them up
    if (typeof extracted.tags === "string") {
      extracted.tags = extracted.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    }
    extracted.tags = Array.from(new Set(extracted.tags || []))

    // Validate the extracted data. Schema will apply defaults.
    const validation = extractedMCPServerSchema.safeParse(extracted)
    if (validation.success) {
      return validation.data
    } else {
      console.warn(`Validation failed for extracted data from ${repoUrl}:`, validation.error.flatten())
      // Return minimal valid data based on repo info if schema validation fails
      return {
        name: extracted.name || "Unknown Repo",
        author: extracted.author || "Unknown Owner",
        description: extracted.description || "Could not determine description.",
      }
    }
  } catch (error: any) {
    console.error(`Error processing repository ${owner}/${repo}:`, error.message)
    // Fallback if API calls fail catastrophically
    return {
      name:
        repo
          .split(/[-_]/)
          .map((w) => w[0].toUpperCase() + w.slice(1))
          .join(" ") || "Error Processing Repo",
      author: owner || "Unknown Owner",
      description: `Failed to fetch details: ${error.message}`,
    }
  }
}

export async function submitMCPServerFromGitHub(
  prevState: SubmitFromGitHubState,
  formData: FormData,
): Promise<SubmitFromGitHubState> {
  if (!process.env.GITHUB_ACCESS_TOKEN) {
    return {
      message: "Configuration Error.",
      error: "GitHub Access Token is not configured on the server. Please contact the administrator.",
      success: false,
    }
  }

  const urlValidationResult = githubUrlSchema.safeParse({
    githubUrl: formData.get("githubUrl"),
  })

  if (!urlValidationResult.success) {
    return {
      message: "Invalid GitHub URL.",
      error: urlValidationResult.error.errors[0].message,
      success: false,
    }
  }

  const { githubUrl } = urlValidationResult.data

  if (mcpServers.some((server) => server.githubUrl === githubUrl)) {
    return {
      message: "This repository has already been submitted.",
      success: false,
    }
  }

  try {
    const extractedData = await fetchAndParseGitHubRepo(githubUrl)
    const finalDataValidation = extractedMCPServerSchema.safeParse(extractedData) // Schema applies defaults

    if (!finalDataValidation.success) {
      console.error(`Final validation of extracted data failed for ${githubUrl}:`, finalDataValidation.error.flatten())
      return {
        message: "Could not extract enough valid information from the repository.",
        error: "Please ensure the repository is public and contains recognizable information.",
        success: false,
      }
    }

    const serverDataFromRepo = finalDataValidation.data

    const id = `${serverDataFromRepo.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")}-${Date.now().toString().slice(-5)}`

    const newServer: MCPServer = {
      id,
      name: serverDataFromRepo.name,
      author: serverDataFromRepo.author,
      description: serverDataFromRepo.description,
      toolsCount: serverDataFromRepo.toolsCount,
      authentication: serverDataFromRepo.authentication,
      deployment: serverDataFromRepo.deployment,
      location: serverDataFromRepo.location,
      tags: serverDataFromRepo.tags || [],
      iconUrl: serverDataFromRepo.iconUrl,
      detailedInfo: serverDataFromRepo.detailedInfo || { statistics: {} },
      githubUrl,
      lastUpdated: new Date().toISOString(),
    }

    addMCPServer(newServer) // Still using in-memory for this example
    revalidatePath("/")
    revalidatePath(`/servers/${id}`)

    return {
      message: `Successfully processed "${newServer.name}" from GitHub! Check the directory. Information quality depends on repository content.`,
      success: true,
      extractedData: newServer,
    }
  } catch (error: any) {
    console.error(`Submission error for ${githubUrl}:`, error)
    return {
      message: "Failed to process repository.",
      error: error.message || "An unknown error occurred during processing.",
      success: false,
    }
  }
}

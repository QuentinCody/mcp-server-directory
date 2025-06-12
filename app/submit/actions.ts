"use server"

import { Octokit } from "octokit"
import { githubUrlSchema, extractedMCPServerSchema } from "@/lib/schemas" // extractedMCPServerSchema is still useful for initial validation of parsed data
import type { MCPServerInsert, ExtractedMCPServerData } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { supabaseAdmin as supabase } from "@/lib/supabase/server" // Use the admin/direct client for server actions

export interface SubmitFromGitHubState {
  message: string
  error?: string
  success: boolean
  extractedData?: Partial<MCPServerInsert> & { name?: string } // Reflects DB structure
}

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
})

function decodeBase64(encoded: string): string {
  return Buffer.from(encoded, "base64").toString("utf-8")
}

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
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo })
    extracted.name =
      repoData.name
        .split(/[-_]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") || "Untitled Server"
    extracted.author = repoData.owner?.login || "Unknown Author"
    extracted.description = repoData.description || undefined

    let manifestJson: any = null
    for (const manifestPath of MANIFEST_FILES) {
      manifestJson = await fetchRepoContent(owner, repo, manifestPath)
      if (manifestJson) break
    }

    if (manifestJson) {
      extracted = {
        ...extracted,
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
      let readmeContent = ""
      try {
        const { data: readmeData } = await octokit.rest.repos.getReadme({ owner, repo })
        if (readmeData.content) readmeContent = decodeBase64(readmeData.content)
      } catch (e) {
        /* ... */
      }

      if (readmeContent) {
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/
        const match = readmeContent.match(jsonRegex)
        if (match && match[1]) {
          try {
            const readmeJson = JSON.parse(match[1])
            extracted = {
              /* ... merge readmeJson similar to manifestJson ... */
              ...extracted,
              name: readmeJson.name || extracted.name,
              author: readmeJson.author || extracted.author,
              description: readmeJson.description || extracted.description,
              toolsCount: typeof readmeJson.toolsCount === "number" ? readmeJson.toolsCount : extracted.toolsCount,
              authentication: readmeJson.authentication || extracted.authentication,
              deployment: readmeJson.deployment || extracted.deployment,
              location: readmeJson.location || extracted.location,
              tags: readmeJson.tags || extracted.tags,
              iconUrl: readmeJson.iconUrl || extracted.iconUrl,
              detailedInfo: readmeJson.detailedInfo || extracted.detailedInfo,
            }
          } catch (e) {
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
          const firstMeaningfulLine = readmeContent
            .split("\n")
            .find((line) => line.trim().length > 20 && !line.trim().startsWith("#"))
            ?.trim()
          if (firstMeaningfulLine && firstMeaningfulLine.length < 250) {
            extracted.description = firstMeaningfulLine
          }
        }

        if (!extracted.tags || (Array.isArray(extracted.tags) && extracted.tags.length === 0)) {
          const newTags: string[] = []
          if (
            readmeContent.toLowerCase().includes(" mcp ") ||
            readmeContent.toLowerCase().includes("model context protocol")
          )
            newTags.push("mcp")
          if (readmeContent.toLowerCase().includes(" ai ")) newTags.push("ai")
          if (readmeContent.toLowerCase().includes(" llm")) newTags.push("llm")
          if (repoData.topics) newTags.push(...repoData.topics)
          extracted.tags = Array.from(new Set(newTags))
        }
      }
    }

    if (typeof extracted.tags === "string") {
      extracted.tags = extracted.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    }
    extracted.tags = Array.from(new Set(extracted.tags || []))

    const validation = extractedMCPServerSchema.safeParse(extracted) // Use the Zod schema for initial validation
    if (validation.success) return validation.data

    return {
      // Fallback if Zod validation fails
      name: extracted.name || "Unknown Repo",
      author: extracted.author || "Unknown Owner",
      description: extracted.description || "Could not determine description.",
    }
  } catch (error: any) {
    /* ... error handling ... */
    console.error(`Error processing repository ${owner}/${repo}:`, error.message)
    throw new Error(`Failed to process repository ${owner}/${repo}: ${error.message}`)
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
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { message: "Database Error.", error: "Supabase environment variables are not configured.", success: false }
  }

  const urlValidationResult = githubUrlSchema.safeParse({ githubUrl: formData.get("githubUrl") })
  if (!urlValidationResult.success) {
    return {
      message: "Invalid GitHub URL.",
      error: urlValidationResult.error.errors[0].message,
      success: false,
    }
  }

  const { githubUrl } = urlValidationResult.data

  // Check if already submitted
  const { data: existingServer, error: selectError } = await supabase
    .from("mcp_servers")
    .select("id")
    .eq("github_url", githubUrl)
    .maybeSingle()

  if (selectError) {
    console.error("Supabase select error:", selectError)
    return { message: "Database Error.", error: "Could not check for existing server.", success: false }
  }
  if (existingServer) {
    return { message: "This repository has already been submitted.", success: false }
  }

  try {
    const extractedData = await fetchAndParseGitHubRepo(githubUrl)

    // Validate with Zod schema which applies defaults
    const finalDataValidation = extractedMCPServerSchema.safeParse(extractedData)
    if (!finalDataValidation.success) {
      console.error(`Final validation of extracted data failed for ${githubUrl}:`, finalDataValidation.error.flatten())
      return {
        message: "Could not extract enough valid information.",
        error: "Please ensure the repository is public and contains recognizable information.",
        success: false,
      }
    }
    const serverDataFromRepo = finalDataValidation.data

    const serverToInsert: MCPServerInsert = {
      name: serverDataFromRepo.name,
      author: serverDataFromRepo.author,
      description: serverDataFromRepo.description,
      tools_count: serverDataFromRepo.toolsCount || 0,
      authentication: serverDataFromRepo.authentication || "Unknown",
      deployment: serverDataFromRepo.deployment || "Unknown",
      location: serverDataFromRepo.location,
      tags: serverDataFromRepo.tags || [],
      icon_url: serverDataFromRepo.iconUrl,
      github_url: githubUrl,
      detailed_info_statistics_requests_per_month: serverDataFromRepo.detailedInfo?.statistics?.requestsPerMonth,
      detailed_info_statistics_uptime: serverDataFromRepo.detailedInfo?.statistics?.uptime,
      detailed_info_statistics_average_response_time: serverDataFromRepo.detailedInfo?.statistics?.averageResponseTime,
      detailed_info_capabilities: serverDataFromRepo.detailedInfo?.capabilities,
      detailed_info_documentation_url: serverDataFromRepo.detailedInfo?.documentationUrl,
      detailed_info_usage_instructions: serverDataFromRepo.detailedInfo?.usageInstructions,
      last_fetched_from_github_at: new Date().toISOString(),
    }

    const { error: insertError } = await supabase.from("mcp_servers").insert(serverToInsert)

    if (insertError) {
      console.error("Supabase insert error:", insertError)
      return { message: "Database Error.", error: `Could not submit server: ${insertError.message}`, success: false }
    }

    revalidatePath("/")
    // We don't know the new ID here unless we select it back, so revalidating specific path is harder.
    // Revalidating '/' should be enough for the list to update.

    return {
      message: `Successfully submitted "${serverToInsert.name}" from GitHub! It should appear in the directory shortly.`,
      success: true,
      extractedData: { name: serverToInsert.name, ...serverToInsert },
    }
  } catch (error: any) {
    console.error(`Submission error for ${githubUrl}:`, error)
    return {
      message: "Failed to process repository.",
      error: error.message || "An unknown error occurred.",
      success: false,
    }
  }
}

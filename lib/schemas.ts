import { z } from "zod"
import type { ServerAuthentication, ServerDeployment } from "./types"

// Extended with "Unknown" for more flexible parsing
const AUTH_OPTIONS_EXTENDED: [ServerAuthentication, ...ServerAuthentication[]] = [
  "Public",
  "API Key",
  "OAuth",
  "Private",
  "Unknown",
]
const DEPLOYMENT_OPTIONS_EXTENDED: [ServerDeployment, ...ServerDeployment[]] = [
  "Local",
  "Remote",
  "Cloud-Hosted",
  "Unknown",
]

// This schema is now for data *extracted or inferred* from GitHub, so many fields are optional.
// The strictness will be on the GitHub URL itself.
export const extractedMCPServerSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
  author: z.string().min(1, "Author cannot be empty"),
  description: z.string().optional(),
  toolsCount: z.coerce.number().int().min(0).default(0), // Default to 0 if not found
  authentication: z.enum(AUTH_OPTIONS_EXTENDED).default("Unknown"),
  deployment: z.enum(DEPLOYMENT_OPTIONS_EXTENDED).default("Unknown"),
  location: z.string().optional(),
  tags: z
    .union([z.array(z.string()), z.string()])
    .default([])
    .optional()
    .transform((val): string[] =>
      typeof val === "string"
        ? val
            .split(",")
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : val || [],
    ), // Handle if tags come as a string
  iconUrl: z.string().url("Must be a valid URL for icon").optional().or(z.literal("")),
  detailedInfo: z
    .object({
      statistics: z
        .object({
          requestsPerMonth: z.string().optional(),
          uptime: z.string().optional(),
          averageResponseTime: z.string().optional(),
        })
        .default({}),
      capabilities: z.string().optional(),
      documentationUrl: z.string().url("Must be a valid URL for docs").optional().or(z.literal("")),
      usageInstructions: z.string().optional(),
    })
    .default({}), // Default to empty object if no detailed info found
})

export type ExtractedMCPServerData = z.infer<typeof extractedMCPServerSchema>

export const githubUrlSchema = z.object({
  githubUrl: z
    .string()
    .url("Please enter a valid URL.")
    .regex(
      /^https?:\/\/github\.com\/[\w-]+\/[\w-.]+(?:\/.*)?$/,
      "Please enter a valid public GitHub repository URL (e.g., https://github.com/user/repo).",
    ),
})

// Original mcpServerSchema for reference or direct form submission (if ever re-enabled)
export const mcpServerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must be at most 100 characters"),
  author: z.string().min(2, "Author must be at least 2 characters").max(100, "Author must be at most 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be at most 500 characters"),
  toolsCount: z.coerce.number().int().positive("Tools count must be a positive number"),
  authentication: z.enum(["Public", "API Key", "OAuth", "Private"]),
  deployment: z.enum(["Local", "Remote", "Cloud-Hosted"]),
  location: z.string().max(100, "Location must be at most 100 characters").optional().or(z.literal("")),
  tags: z
    .string()
    .max(200, "Tags string is too long")
    .optional()
    .transform((val) =>
      val
        ? val
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
    ),
  iconUrl: z.string().url("Must be a valid URL").max(255, "Icon URL too long").optional().or(z.literal("")),
  detailedInfo: z.object({
    statistics: z.object({
      requestsPerMonth: z.string().max(50, "Requests per month too long").optional().or(z.literal("")),
      uptime: z.string().max(20, "Uptime too long").optional().or(z.literal("")),
      averageResponseTime: z.string().max(20, "Avg. response time too long").optional().or(z.literal("")),
    }),
    capabilities: z
      .string()
      .min(20, "Capabilities description must be at least 20 characters")
      .max(2000, "Capabilities description must be at most 2000 characters"),
    documentationUrl: z
      .string()
      .url("Must be a valid URL")
      .max(255, "Documentation URL too long")
      .optional()
      .or(z.literal("")),
    usageInstructions: z.string().max(2000, "Usage instructions too long").optional().or(z.literal("")),
  }),
})
export type MCPServerFormData = z.infer<typeof mcpServerSchema>

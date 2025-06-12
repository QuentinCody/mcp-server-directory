import type { MCPServer } from "./types"

export const mcpServers: MCPServer[] = [
  {
    id: "alpha-coder-v1",
    name: "AlphaCoder V1",
    author: "DevDynamics Inc.",
    description:
      "A versatile MCP server with a wide range of coding assistance tools. Optimized for Python and JavaScript development.",
    toolsCount: 15,
    authentication: "API Key",
    deployment: "Cloud-Hosted",
    location: "AWS us-east-1",
    tags: ["coding", "python", "javascript", "ai"],
    lastUpdated: "2025-06-10T10:00:00Z",
    iconUrl: "/placeholder.svg?height=60&width=60",
    githubUrl: "https://github.com/devdynamicsinc/alphacoder-v1",
    detailedInfo: {
      statistics: {
        requestsPerMonth: "1.2M+",
        uptime: "99.95%",
        averageResponseTime: "150ms",
      },
      capabilities:
        "Provides advanced code completion, bug detection, and automated refactoring. Supports custom tool integration.",
      documentationUrl: "https://docs.alphacoder.example.com",
      usageInstructions:
        "Refer to the official documentation for API key generation and usage limits. SDKs available for Python and Node.js.",
    },
  },
  {
    id: "lingua-bot-pro",
    name: "LinguaBot Pro",
    author: "Polyglot Systems",
    description:
      "Specialized MCP server for natural language processing tasks, including translation, summarization, and sentiment analysis.",
    toolsCount: 8,
    authentication: "OAuth",
    deployment: "Remote",
    location: "Self-Hosted (EU)",
    tags: ["nlp", "translation", "text-analysis"],
    lastUpdated: "2025-05-28T14:30:00Z",
    iconUrl: "/placeholder.svg?height=60&width=60",
    githubUrl: "https://github.com/polyglotsys/linguabot-pro",
    detailedInfo: {
      statistics: {
        requestsPerMonth: "800K",
        uptime: "99.8%",
        averageResponseTime: "250ms",
      },
      capabilities:
        "High-accuracy translation for 20+ languages, advanced sentiment analysis models, and customizable summarization lengths.",
      usageInstructions:
        "OAuth2 authentication required. Check API rate limits. Ideal for chatbots and content analysis platforms.",
    },
  },
  {
    id: "local-dev-helper",
    name: "Local Dev Helper",
    author: "OpenSource Community",
    description:
      "A lightweight, public MCP server for local development and testing. Includes basic text and image manipulation tools.",
    toolsCount: 5,
    authentication: "Public",
    deployment: "Local",
    tags: ["development", "testing", "utility"],
    lastUpdated: "2025-06-01T08:00:00Z",
    iconUrl: "/placeholder.svg?height=60&width=60",
    githubUrl: "https://github.com/local-dev-helper/local-dev-helper",
    detailedInfo: {
      statistics: {
        requestsPerMonth: "N/A (Local)",
        uptime: "N/A (Local)",
        averageResponseTime: "50ms",
      },
      capabilities:
        "Offers simple tools like JSON formatting, Base64 encoding/decoding, and image resizing. Great for quick local tasks.",
      documentationUrl: "https://github.com/local-dev-helper",
      usageInstructions: "Run locally via Docker. No authentication needed. Ideal for offline development workflows.",
    },
  },
  {
    id: "secure-compute-engine",
    name: "SecureCompute Engine",
    author: "CyberGuard Solutions",
    description: "Enterprise-grade MCP server focused on secure data processing and cryptographic tools.",
    toolsCount: 12,
    authentication: "Private",
    deployment: "Cloud-Hosted",
    location: "Azure Gov Cloud",
    tags: ["security", "crypto", "enterprise"],
    lastUpdated: "2025-06-11T12:00:00Z",
    iconUrl: "/placeholder.svg?height=60&width=60",
    githubUrl: "https://github.com/cyberguardsolutions/securecompute-engine",
    detailedInfo: {
      statistics: {
        requestsPerMonth: "Restricted",
        uptime: "99.99%",
        averageResponseTime: "100ms",
      },
      capabilities:
        "Provides tools for data encryption, secure multi-party computation, and anomaly detection in sensitive datasets.",
      documentationUrl: "Internal Portal",
      usageInstructions: "Access restricted to authorized personnel. Requires VPN and multi-factor authentication.",
    },
  },
]

export function addMCPServer(server: MCPServer) {
  // Basic check to prevent duplicate IDs if this were a real scenario
  if (!mcpServers.find((s) => s.id === server.id)) {
    mcpServers.unshift(server) // Add to the beginning of the array
  }
}

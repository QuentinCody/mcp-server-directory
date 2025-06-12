"use client"

import { Button } from "@/components/ui/button"

import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { mcpServers } from "@/lib/mcp-data"
import type { MCPServer } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Wrench,
  Lock,
  PresentationIcon as DeploymentIcon,
  User,
  CalendarDays,
  MapPin,
  BarChart3,
  BookOpenText,
  Info,
  ExternalLink,
  Github,
} from "lucide-react"
import { useEffect, useState } from "react"

export default function ServerDetailPage() {
  const params = useParams()
  const serverId = params.id as string
  const [server, setServer] = useState<MCPServer | undefined>(undefined)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const foundServer = mcpServers.find((s) => s.id === serverId)
    setServer(foundServer)
  }, [serverId])

  const timeSinceUpdate = (dateString: string | undefined) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    const days = Math.floor(diffInSeconds / (3600 * 24))
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`

    const hours = Math.floor(diffInSeconds / 3600)
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`

    const minutes = Math.floor(diffInSeconds / 60)
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`

    return `Just now`
  }

  if (!isClient) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Loading server details...</p>
      </div>
    )
  }

  if (!server) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-semibold">Server Not Found</h1>
        <p className="text-muted-foreground mt-2">The MCP server you are looking for does not exist.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button asChild variant="outline" className="mb-6">
        <Link href="/">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
        </Link>
      </Button>

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {server.iconUrl && (
              <Image
                src={server.iconUrl || "/placeholder.svg"}
                alt={`${server.name} icon`}
                width={80}
                height={80}
                className="rounded-lg border"
              />
            )}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-3xl font-bold">{server.name}</CardTitle>
                {server.githubUrl && (
                  <Button asChild variant="outline" className="mt-2 sm:mt-0">
                    <a href={server.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      View on GitHub
                    </a>
                  </Button>
                )}
              </div>
              <div className="flex items-center text-md text-muted-foreground mt-1">
                <User className="w-4 h-4 mr-1.5" />
                <span>{server.author}</span>
              </div>
              <CardDescription className="text-base mt-2">{server.description}</CardDescription>
              {server.tags && server.tags.length > 0 && (
                <div className="mt-3">
                  {server.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="mr-1 mb-1 capitalize">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center p-4 bg-background rounded-lg border">
              <Wrench className="w-6 h-6 mr-3 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Tools Available</p>
                <p className="text-lg font-semibold">{server.toolsCount}</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-background rounded-lg border">
              <Lock className="w-6 h-6 mr-3 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Authentication</p>
                <p className="text-lg font-semibold">{server.authentication}</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-background rounded-lg border">
              <DeploymentIcon className="w-6 h-6 mr-3 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Deployment</p>
                <p className="text-lg font-semibold">{server.deployment}</p>
              </div>
            </div>
            {server.location && (
              <div className="flex items-center p-4 bg-background rounded-lg border">
                <MapPin className="w-6 h-6 mr-3 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-lg font-semibold">{server.location}</p>
                </div>
              </div>
            )}
            <div className="flex items-center p-4 bg-background rounded-lg border col-span-1 lg:col-span-2">
              <CalendarDays className="w-6 h-6 mr-3 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-lg font-semibold">
                  {new Date(server.lastUpdated).toLocaleDateString()} ({timeSinceUpdate(server.lastUpdated)})
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 mb-4">
              <TabsTrigger value="overview">
                <Info className="w-4 h-4 mr-2 sm:hidden md:inline-block" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="statistics">
                <BarChart3 className="w-4 h-4 mr-2 sm:hidden md:inline-block" />
                Statistics
              </TabsTrigger>
              <TabsTrigger value="usage">
                <BookOpenText className="w-4 h-4 mr-2 sm:hidden md:inline-block" />
                Usage & Docs
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="overview"
              className="prose dark:prose-invert max-w-none p-4 border rounded-md bg-background"
            >
              <h3 className="text-xl font-semibold mb-2">Capabilities</h3>
              <p>{server.detailedInfo.capabilities}</p>
            </TabsContent>
            <TabsContent value="statistics" className="p-4 border rounded-md bg-background">
              <h3 className="text-xl font-semibold mb-4">Server Statistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3 border rounded">
                  <p className="text-sm text-muted-foreground">Requests / Month</p>
                  <p className="text-lg font-medium">{server.detailedInfo.statistics.requestsPerMonth}</p>
                </div>
                <div className="p-3 border rounded">
                  <p className="text-sm text-muted-foreground">Uptime</p>
                  <p className="text-lg font-medium">{server.detailedInfo.statistics.uptime}</p>
                </div>
                <div className="p-3 border rounded">
                  <p className="text-sm text-muted-foreground">Avg. Response Time</p>
                  <p className="text-lg font-medium">{server.detailedInfo.statistics.averageResponseTime}</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent
              value="usage"
              className="prose dark:prose-invert max-w-none p-4 border rounded-md bg-background"
            >
              <h3 className="text-xl font-semibold mb-2">Usage Instructions</h3>
              <p>{server.detailedInfo.usageInstructions || "No specific usage instructions provided."}</p>
              {server.detailedInfo.documentationUrl && (
                <div className="mt-4">
                  <h4 className="text-lg font-semibold mb-1">Documentation</h4>
                  {server.detailedInfo.documentationUrl.startsWith("http") ? (
                    <Button asChild variant="link" className="px-0">
                      <a href={server.detailedInfo.documentationUrl} target="_blank" rel="noopener noreferrer">
                        View Documentation <ExternalLink className="w-4 h-4 ml-1.5" />
                      </a>
                    </Button>
                  ) : (
                    <p>{server.detailedInfo.documentationUrl}</p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

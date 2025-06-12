// Make this a Server Component
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { MCPServer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
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
import { notFound } from "next/navigation"

async function fetchMCPServerById(id: string): Promise<MCPServer | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("mcp_servers").select("*").eq("id", id).single()

  if (error) {
    console.error(`Error fetching server ${id}:`, error)
    return null
  }
  return data as MCPServer
}

// Helper for time since update
const timeSince = (dateString: string | undefined) => {
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

export default async function ServerDetailPage({ params }: { params: { id: string } }) {
  const server = await fetchMCPServerById(params.id)

  if (!server) {
    notFound() // Triggers the not-found.tsx page
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
            {server.icon_url && (
              <Image
                src={server.icon_url || "/placeholder.svg"}
                alt={`${server.name} icon`}
                width={80}
                height={80}
                className="rounded-lg border"
              />
            )}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-3xl font-bold">{server.name}</CardTitle>
                {server.github_url && (
                  <Button asChild variant="outline" className="mt-2 sm:mt-0">
                    <a href={server.github_url} target="_blank" rel="noopener noreferrer">
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
              <CardDescription className="text-base mt-2">
                {server.description || "No description provided."}
              </CardDescription>
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
                <p className="text-lg font-semibold">{server.tools_count}</p>
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
                <p className="text-sm text-muted-foreground">Last Updated (DB)</p>
                <p className="text-lg font-semibold">
                  {new Date(server.updated_at).toLocaleDateString()} ({timeSince(server.updated_at)})
                </p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-background rounded-lg border col-span-1 lg:col-span-2">
              <CalendarDays className="w-6 h-6 mr-3 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Last Fetched (GitHub)</p>
                <p className="text-lg font-semibold">
                  {new Date(server.last_fetched_from_github_at).toLocaleDateString()} (
                  {timeSince(server.last_fetched_from_github_at)})
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
              <p>{server.detailed_info_capabilities || "No capabilities description provided."}</p>
            </TabsContent>
            <TabsContent value="statistics" className="p-4 border rounded-md bg-background">
              <h3 className="text-xl font-semibold mb-4">Server Statistics</h3>
              {server.detailed_info_statistics_requests_per_month ||
              server.detailed_info_statistics_uptime ||
              server.detailed_info_statistics_average_response_time ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {server.detailed_info_statistics_requests_per_month && (
                    <div className="p-3 border rounded">
                      <p className="text-sm text-muted-foreground">Requests / Month</p>
                      <p className="text-lg font-medium">{server.detailed_info_statistics_requests_per_month}</p>
                    </div>
                  )}
                  {server.detailed_info_statistics_uptime && (
                    <div className="p-3 border rounded">
                      <p className="text-sm text-muted-foreground">Uptime</p>
                      <p className="text-lg font-medium">{server.detailed_info_statistics_uptime}</p>
                    </div>
                  )}
                  {server.detailed_info_statistics_average_response_time && (
                    <div className="p-3 border rounded">
                      <p className="text-sm text-muted-foreground">Avg. Response Time</p>
                      <p className="text-lg font-medium">{server.detailed_info_statistics_average_response_time}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No specific statistics provided for this server.</p>
              )}
            </TabsContent>
            <TabsContent
              value="usage"
              className="prose dark:prose-invert max-w-none p-4 border rounded-md bg-background"
            >
              <h3 className="text-xl font-semibold mb-2">Usage Instructions</h3>
              <p>{server.detailed_info_usage_instructions || "No specific usage instructions provided."}</p>
              {server.detailed_info_documentation_url && (
                <div className="mt-4">
                  <h4 className="text-lg font-semibold mb-1">Documentation</h4>
                  {server.detailed_info_documentation_url.startsWith("http") ? (
                    <Button asChild variant="link" className="px-0">
                      <a href={server.detailed_info_documentation_url} target="_blank" rel="noopener noreferrer">
                        View Documentation <ExternalLink className="w-4 h-4 ml-1.5" />
                      </a>
                    </Button>
                  ) : (
                    <p>{server.detailed_info_documentation_url}</p>
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

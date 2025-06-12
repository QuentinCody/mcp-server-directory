"use client"

import Link from "next/link"
import Image from "next/image"
import type { MCPServer } from "@/lib/types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Wrench, Lock, PresentationIcon as DeploymentIcon, User, CalendarDays, MapPin } from "lucide-react" // Renamed ServerIcon to DeploymentIcon to avoid conflict

interface ServerCardProps {
  server: MCPServer
}

export function ServerCard({ server }: ServerCardProps) {
  const timeSinceUpdate = (dateString: string) => {
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

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-1">
              <Link href={`/servers/${server.id}`} className="hover:underline">
                {server.name}
              </Link>
            </CardTitle>
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <User className="w-4 h-4 mr-1.5" />
              <span>{server.author}</span>
            </div>
          </div>
          {server.iconUrl && (
            <Image
              src={server.iconUrl || "/placeholder.svg"}
              alt={`${server.name} icon`}
              width={48}
              height={48}
              className="rounded-md ml-4"
            />
          )}
        </div>
        <CardDescription className="text-sm line-clamp-2">{server.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pb-4 space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <Wrench className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{server.toolsCount} Tools Available</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Lock className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>
            Auth: <Badge variant="outline">{server.authentication}</Badge>
          </span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <DeploymentIcon className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>
            Deploy: <Badge variant="outline">{server.deployment}</Badge>
          </span>
        </div>
        {server.location && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>Location: {server.location}</span>
          </div>
        )}
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>Updated: {timeSinceUpdate(server.lastUpdated)}</span>
        </div>
        {server.tags && server.tags.length > 0 && (
          <div className="pt-1">
            {server.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="mr-1 mb-1 capitalize">
                {tag}
              </Badge>
            ))}
            {server.tags.length > 3 && <Badge variant="secondary">...</Badge>}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" asChild className="w-full">
          <Link href={`/servers/${server.id}`}>
            View Details <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

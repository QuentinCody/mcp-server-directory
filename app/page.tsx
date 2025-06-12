"use client"

import { useState, useMemo, useEffect } from "react"
import { mcpServers } from "@/lib/mcp-data"
import type { FilterOptions, SortOption, ServerAuthentication, ServerDeployment } from "@/lib/types"
import { ServerCard } from "@/components/mcp/server-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, FilterIcon, X } from "lucide-react"

const AUTH_OPTIONS: ServerAuthentication[] = ["Public", "API Key", "OAuth", "Private"]
const DEPLOYMENT_OPTIONS: ServerDeployment[] = ["Local", "Remote", "Cloud-Hosted"]

export default function MCPDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<FilterOptions>({
    authentication: [],
    deployment: [],
  })
  const [sortOption, setSortOption] = useState<SortOption>("updated-desc")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleFilterChange = (type: keyof FilterOptions, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[type] as string[]
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]
      return { ...prev, [type]: newValues }
    })
  }

  const clearFilters = () => {
    setFilters({ authentication: [], deployment: [] })
  }

  const filteredAndSortedServers = useMemo(() => {
    const servers = mcpServers.filter((server) => {
      const searchMatch =
        server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        server.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        server.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        server.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

      const authMatch = filters.authentication.length === 0 || filters.authentication.includes(server.authentication)

      const deployMatch = filters.deployment.length === 0 || filters.deployment.includes(server.deployment)

      return searchMatch && authMatch && deployMatch
    })

    switch (sortOption) {
      case "name-asc":
        servers.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "name-desc":
        servers.sort((a, b) => b.name.localeCompare(a.name))
        break
      case "tools-asc":
        servers.sort((a, b) => a.toolsCount - b.toolsCount)
        break
      case "tools-desc":
        servers.sort((a, b) => b.toolsCount - a.toolsCount)
        break
      case "updated-asc":
        servers.sort((a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime())
        break
      case "updated-desc":
        servers.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
        break
    }
    return servers
  }, [searchTerm, filters, sortOption])

  if (!isClient) {
    // Render a loading state or null on the server to avoid hydration mismatch
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Loading directory...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">MCP Server Directory</h1>
        <p className="mt-2 text-lg text-muted-foreground">Discover and explore Model Context Protocol servers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="md:col-span-1 space-y-6">
          <h2 className="text-xl font-semibold flex items-center">
            <FilterIcon className="w-5 h-5 mr-2" />
            Filters
          </h2>
          <Accordion type="multiple" defaultValue={["auth", "deploy"]} className="w-full">
            <AccordionItem value="auth">
              <AccordionTrigger className="text-base font-medium">Authentication</AccordionTrigger>
              <AccordionContent className="space-y-2 pt-2">
                {AUTH_OPTIONS.map((auth) => (
                  <div key={auth} className="flex items-center space-x-2">
                    <Checkbox
                      id={`auth-${auth}`}
                      checked={filters.authentication.includes(auth)}
                      onCheckedChange={() => handleFilterChange("authentication", auth)}
                    />
                    <Label htmlFor={`auth-${auth}`} className="font-normal">
                      {auth}
                    </Label>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="deploy">
              <AccordionTrigger className="text-base font-medium">Deployment</AccordionTrigger>
              <AccordionContent className="space-y-2 pt-2">
                {DEPLOYMENT_OPTIONS.map((deploy) => (
                  <div key={deploy} className="flex items-center space-x-2">
                    <Checkbox
                      id={`deploy-${deploy}`}
                      checked={filters.deployment.includes(deploy)}
                      onCheckedChange={() => handleFilterChange("deployment", deploy)}
                    />
                    <Label htmlFor={`deploy-${deploy}`} className="font-normal">
                      {deploy}
                    </Label>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          {(filters.authentication.length > 0 || filters.deployment.length > 0) && (
            <Button variant="outline" onClick={clearFilters} className="w-full">
              <X className="w-4 h-4 mr-2" /> Clear All Filters
            </Button>
          )}
        </aside>

        {/* Main Content: Search, Sort, Server Grid */}
        <main className="md:col-span-3">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search servers by name, author, description, or tags..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated-desc">Last Updated (Newest)</SelectItem>
                <SelectItem value="updated-asc">Last Updated (Oldest)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="tools-desc">Tools (Most)</SelectItem>
                <SelectItem value="tools-asc">Tools (Fewest)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredAndSortedServers.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedServers.map((server) => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">No servers found matching your criteria.</p>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

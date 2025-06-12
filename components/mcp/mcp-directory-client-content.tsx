"use client"

import type React from "react"
import { useCallback } from "react" // Removed useState and useEffect
import type { MCPServer, FilterOptions, SortOption, ServerAuthentication, ServerDeployment } from "@/lib/types"
import { ServerCard } from "@/components/mcp/server-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, FilterIcon, X } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"

const AUTH_OPTIONS: ServerAuthentication[] = ["Public", "API Key", "OAuth", "Private", "Unknown"]
const DEPLOYMENT_OPTIONS: ServerDeployment[] = ["Local", "Remote", "Cloud-Hosted", "Unknown"]

interface MCPDirectoryClientContentProps {
  initialServers: MCPServer[]
  // Initial props are used for the first server-side render.
  // The client will then rely solely on the URL state.
  initialSearchTerm?: string
  initialFilters?: FilterOptions
  initialSortOption?: SortOption
}

export function MCPDirectoryClientContent({
  initialServers,
}: // We no longer need to pass initial props down, as the URL is the source of truth.
MCPDirectoryClientContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // DERIVE state directly from URL search params on every render.
  // This is the single source of truth on the client.
  const searchTerm = searchParams.get("search") || ""
  const filters: FilterOptions = {
    authentication: searchParams.getAll("auth") as ServerAuthentication[],
    deployment: searchParams.getAll("deploy") as ServerDeployment[],
  }
  const sortOption = (searchParams.get("sort") as SortOption) || "updated-desc"

  // This function builds the new query string and navigates.
  // It's wrapped in useCallback to stabilize its identity.
  const updateUrl = useCallback(
    (newSearch: string, newFilters: FilterOptions, newSort: SortOption) => {
      const params = new URLSearchParams(searchParams.toString())
      if (newSearch) {
        params.set("search", newSearch)
      } else {
        params.delete("search")
      }

      params.delete("auth")
      newFilters.authentication.forEach((auth) => params.append("auth", auth))

      params.delete("deploy")
      newFilters.deployment.forEach((deploy) => params.append("deploy", deploy))

      params.set("sort", newSort)

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // We pass the current filters and sort options along with the new search term.
    debouncedUpdateUrl(e.target.value, filters, sortOption)
  }

  const handleFilterChange = (type: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters }
    const currentValues = newFilters[type] as string[]
    const updatedValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]
    newFilters[type] = updatedValues
    updateUrl(searchTerm, newFilters, sortOption)
  }

  const handleSortChange = (newSort: SortOption) => {
    updateUrl(searchTerm, filters, newSort)
  }

  const clearFilters = () => {
    const newFilters = { authentication: [], deployment: [] }
    updateUrl(searchTerm, newFilters, sortOption)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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

      <main className="md:col-span-3">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search servers by name, author, description, or tags..."
              className="pl-10 w-full"
              // The input value is now uncontrolled on the client and driven by the debounced URL update.
              // We can set a key to force re-mount when search term changes from URL, or use defaultValue.
              key={searchTerm}
              defaultValue={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <Select value={sortOption} onValueChange={handleSortChange}>
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

        {initialServers.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {initialServers.map((server) => (
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
  )
}

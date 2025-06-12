"use client"

import type React from "react"
import { useCallback, useState, useEffect } from "react"
import type { MCPServer, FilterOptions, SortOption, ServerAuthentication, ServerDeployment, PaginationResult } from "@/lib/types"
import { ServerCard } from "@/components/mcp/server-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, FilterIcon, X } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"

const AUTH_OPTIONS: ServerAuthentication[] = ["Public", "API Key", "OAuth", "Private", "Unknown"]
const DEPLOYMENT_OPTIONS: ServerDeployment[] = ["Local", "Remote", "Cloud-Hosted", "Unknown"]

interface MCPDirectoryClientContentProps {
  paginationResult: PaginationResult<MCPServer>
  // Initial props are used for the first server-side render.
  // The client will then rely solely on the URL state.
  initialSearchTerm?: string
  initialFilters?: FilterOptions
  initialSortOption?: SortOption
}

export function MCPDirectoryClientContent({
  paginationResult,
}: // We no longer need to pass initial props down, as the URL is the source of truth.
MCPDirectoryClientContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // DERIVE state directly from URL search params on every render.
  // This is the single source of truth on the client.
  const urlSearchTerm = searchParams.get("search") || ""
  const filters: FilterOptions = {
    authentication: searchParams.getAll("auth") as ServerAuthentication[],
    deployment: searchParams.getAll("deploy") as ServerDeployment[],
  }
  const sortOption = (searchParams.get("sort") as SortOption) || "updated-desc"
  const currentPage = parseInt(searchParams.get("page") || "1", 10)

  // Local state for search input to ensure immediate responsiveness
  const [localSearchTerm, setLocalSearchTerm] = useState(urlSearchTerm)

  // Sync local state with URL when URL changes (e.g., back/forward navigation)
  useEffect(() => {
    setLocalSearchTerm(urlSearchTerm)
  }, [urlSearchTerm])

  // This function builds the new query string and navigates.
  // It's wrapped in useCallback to stabilize its identity.
  const updateUrl = useCallback(
    (newSearch: string, newFilters: FilterOptions, newSort: SortOption, newPage = 1) => {
      const params = new URLSearchParams()
      
      if (newSearch) {
        params.set("search", newSearch)
      }

      newFilters.authentication.forEach((auth) => params.append("auth", auth))
      newFilters.deployment.forEach((deploy) => params.append("deploy", deploy))

      if (newSort !== "updated-desc") {
        params.set("sort", newSort)
      }

      if (newPage > 1) {
        params.set("page", newPage.toString())
      }

      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
      router.push(newUrl)
    },
    [pathname, router],
  )

  // Debounced function for search updates - increased delay for fast typists
  const debouncedSearchUpdate = useDebouncedCallback((searchValue: string) => {
    updateUrl(searchValue, filters, sortOption, 1)
  }, 500) // Increased to 500ms to prevent character loss during fast typing

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    // Update local state immediately for responsive UI
    setLocalSearchTerm(newValue)
    // Trigger debounced server update
    debouncedSearchUpdate(newValue)
  }

  const handleFilterChange = (type: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters }
    if (type === "authentication") {
      const currentValues = newFilters.authentication
      const updatedValues = currentValues.includes(value as ServerAuthentication)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value as ServerAuthentication]
      newFilters.authentication = updatedValues
    } else if (type === "deployment") {
      const currentValues = newFilters.deployment
      const updatedValues = currentValues.includes(value as ServerDeployment)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value as ServerDeployment]
      newFilters.deployment = updatedValues
    }
    // Reset to page 1 when filtering
    updateUrl(urlSearchTerm, newFilters, sortOption, 1)
  }

  const handleSortChange = (newSort: SortOption) => {
    // Reset to page 1 when sorting
    updateUrl(urlSearchTerm, filters, newSort, 1)
  }

  const handlePageChange = (newPage: number) => {
    updateUrl(urlSearchTerm, filters, sortOption, newPage)
  }

  const clearFilters = () => {
    const newFilters = { authentication: [], deployment: [] }
    updateUrl(urlSearchTerm, newFilters, sortOption, 1)
  }

  const generatePageNumbers = () => {
    const { page, totalPages } = paginationResult
    const pages: (number | "ellipsis")[] = []

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (page <= 4) {
        // Show pages 2, 3, 4, 5, ..., last
        for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
          pages.push(i)
        }
        if (totalPages > 5) {
          pages.push("ellipsis")
        }
        pages.push(totalPages)
      } else if (page >= totalPages - 3) {
        // Show 1, ..., last-4, last-3, last-2, last-1, last
        pages.push("ellipsis")
        for (let i = Math.max(2, totalPages - 4); i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Show 1, ..., page-1, page, page+1, ..., last
        pages.push("ellipsis")
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i)
        }
        pages.push("ellipsis")
        pages.push(totalPages)
      }
    }

    return pages
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
              // Use local state for immediate responsiveness
              value={localSearchTerm}
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
            </SelectContent>
          </Select>
        </div>

        {/* Results summary */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {paginationResult.data.length} of {paginationResult.total} servers
          {paginationResult.totalPages > 1 && ` (Page ${paginationResult.page} of ${paginationResult.totalPages})`}
        </div>

        {paginationResult.data.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {paginationResult.data.map((server) => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>

            {/* Pagination controls */}
            {paginationResult.totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    {paginationResult.hasPrev ? (
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(currentPage - 1)
                        }}
                      />
                    ) : (
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="pointer-events-none opacity-50"
                      />
                    )}
                  </PaginationItem>

                  {generatePageNumbers().map((pageNum, index) => (
                    <PaginationItem key={index}>
                      {pageNum === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            handlePageChange(pageNum)
                          }}
                          isActive={pageNum === currentPage}
                        >
                          {pageNum}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    {paginationResult.hasNext ? (
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(currentPage + 1)
                        }}
                      />
                    ) : (
                      <PaginationNext
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="pointer-events-none opacity-50"
                      />
                    )}
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
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

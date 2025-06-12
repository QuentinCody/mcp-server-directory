import { createSupabaseServerClient } from "@/lib/supabase/server" // Use server client for RSC
import type { MCPServer, FilterOptions, SortOption, ServerAuthentication, ServerDeployment, PaginationResult } from "@/lib/types"
import { MCPDirectoryClientContent } from "@/components/mcp/mcp-directory-client-content"

const ITEMS_PER_PAGE = 12

async function fetchMCPServersFromDB(
  searchTerm = "",
  filters: FilterOptions = { authentication: [], deployment: [] },
  sortOption: SortOption = "updated-desc",
  page = 1,
  pageSize = ITEMS_PER_PAGE,
): Promise<PaginationResult<MCPServer>> {
  const supabase = await createSupabaseServerClient() // Use the server client for RSC
  let query = supabase.from("mcp_servers").select("*", { count: "exact" })

  // Search
  if (searchTerm) {
    // Adjust for searching multiple text fields. Using 'or' condition.
    // Example: (name.ilike.%term%, description.ilike.%term%)
    // Supabase textSearch (fts) is better for complex search but requires setup.
    // For simplicity, using ilike on a few fields.
    const searchPattern = `%${searchTerm}%`
    query = query.or(
      `name.ilike.${searchPattern},author.ilike.${searchPattern},description.ilike.${searchPattern},tags.cs.{${searchTerm}}`,
    ) // tags.cs for array contains
  }

  // Filters
  if (filters.authentication.length > 0) {
    query = query.in("authentication", filters.authentication)
  }
  if (filters.deployment.length > 0) {
    query = query.in("deployment", filters.deployment)
  }

  // Sorting
  // The MCPServer type uses camelCase, DB uses snake_case.
  // Supabase client often handles this, but be explicit if needed.
  // For 'updated-desc', we'll use 'updated_at' from the DB.
  let sortField = "updated_at"
  let sortAsc = false
  switch (sortOption) {
    case "name-asc":
      sortField = "name"
      sortAsc = true
      break
    case "name-desc":
      sortField = "name"
      sortAsc = false
      break
    case "tools-asc":
      sortField = "tools_count"
      sortAsc = true
      break
    case "tools-desc":
      sortField = "tools_count"
      sortAsc = false
      break
    case "updated-asc":
      sortField = "updated_at"
      sortAsc = true
      break
    case "updated-desc":
      sortField = "updated_at"
      sortAsc = false
      break
  }
  query = query.order(sortField, { ascending: sortAsc })

  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error("Error fetching MCP servers:", error)
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    }
  }
  
  const total = count || 0
  const totalPages = Math.ceil(total / pageSize)

  return {
    data: (data as MCPServer[]) || [],
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

export default async function MCPDirectoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Parse searchParams for server-side filtering/sorting
  const resolvedSearchParams = await searchParams
  const searchTerm = typeof resolvedSearchParams?.search === "string" ? resolvedSearchParams.search : ""
  const authFilters = resolvedSearchParams && Array.isArray(resolvedSearchParams.auth)
    ? (resolvedSearchParams.auth as ServerAuthentication[])
    : resolvedSearchParams && typeof resolvedSearchParams.auth === "string"
      ? [resolvedSearchParams.auth as ServerAuthentication]
      : []
  const deployFilters = resolvedSearchParams && Array.isArray(resolvedSearchParams.deploy)
    ? (resolvedSearchParams.deploy as ServerDeployment[])
    : resolvedSearchParams && typeof resolvedSearchParams.deploy === "string"
      ? [resolvedSearchParams.deploy as ServerDeployment]
      : []
  const sort = typeof resolvedSearchParams?.sort === "string" ? (resolvedSearchParams.sort as SortOption) : "updated-desc"
  const page = typeof resolvedSearchParams?.page === "string" ? parseInt(resolvedSearchParams.page, 10) : 1

  const initialFilters: FilterOptions = {
    authentication: authFilters,
    deployment: deployFilters,
  }

  // Fetch initial data on the server
  const paginationResult = await fetchMCPServersFromDB(searchTerm, initialFilters, sort, page, ITEMS_PER_PAGE)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">MCP Server Directory</h1>
        <p className="mt-2 text-lg text-muted-foreground">Discover and explore Model Context Protocol servers.</p>
      </div>
      <MCPDirectoryClientContent
        paginationResult={paginationResult}
        initialSearchTerm={searchTerm}
        initialFilters={initialFilters}
        initialSortOption={sort}
      />
    </div>
  )
}

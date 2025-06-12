import { createSupabaseServerClient } from "@/lib/supabase/server" // Use server client for RSC
import type { MCPServer, FilterOptions, SortOption, ServerAuthentication, ServerDeployment } from "@/lib/types"
import { MCPDirectoryClientContent } from "@/components/mcp/mcp-directory-client-content"

async function fetchMCPServersFromDB(
  searchTerm = "",
  filters: FilterOptions = { authentication: [], deployment: [] },
  sortOption: SortOption = "updated-desc",
): Promise<MCPServer[]> {
  const supabase = createSupabaseServerClient() // Use the server client for RSC
  let query = supabase.from("mcp_servers").select("*")

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

  const { data, error } = await query

  if (error) {
    console.error("Error fetching MCP servers:", error)
    return []
  }
  // Map snake_case from DB to camelCase for MCPServer type if Supabase doesn't do it automatically
  // However, Supabase client usually handles this mapping. If not, manual mapping is needed.
  // For now, assuming Supabase client handles it or types are adjusted.
  // Let's adjust the MCPServer type to use snake_case for DB fields for clarity.
  return data as MCPServer[]
}

export default async function MCPDirectoryPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  // Parse searchParams for server-side filtering/sorting
  const searchTerm = typeof searchParams?.search === "string" ? searchParams.search : ""
  const authFilters = Array.isArray(searchParams?.auth)
    ? (searchParams.auth as ServerAuthentication[])
    : typeof searchParams?.auth === "string"
      ? [searchParams.auth as ServerAuthentication]
      : []
  const deployFilters = Array.isArray(searchParams?.deploy)
    ? (searchParams.deploy as ServerDeployment[])
    : typeof searchParams?.deploy === "string"
      ? [searchParams.deploy as ServerDeployment]
      : []
  const sort = typeof searchParams?.sort === "string" ? (searchParams.sort as SortOption) : "updated-desc"

  const initialFilters: FilterOptions = {
    authentication: authFilters,
    deployment: deployFilters,
  }

  // Fetch initial data on the server
  const initialServers = await fetchMCPServersFromDB(searchTerm, initialFilters, sort)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">MCP Server Directory</h1>
        <p className="mt-2 text-lg text-muted-foreground">Discover and explore Model Context Protocol servers.</p>
      </div>
      <MCPDirectoryClientContent
        initialServers={initialServers}
        initialSearchTerm={searchTerm}
        initialFilters={initialFilters}
        initialSortOption={sort}
      />
    </div>
  )
}

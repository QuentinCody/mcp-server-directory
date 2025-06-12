-- Create ENUM types for stricter validation (optional, but good practice)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mcp_authentication_type') THEN
        CREATE TYPE mcp_authentication_type AS ENUM ('Public', 'API Key', 'OAuth', 'Private', 'Unknown');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mcp_deployment_type') THEN
        CREATE TYPE mcp_deployment_type AS ENUM ('Local', 'Remote', 'Cloud-Hosted', 'Unknown');
    END IF;
END$$;

-- Create the mcp_servers table
CREATE TABLE IF NOT EXISTS public.mcp_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    tools_count INTEGER DEFAULT 0,
    authentication mcp_authentication_type DEFAULT 'Unknown',
    deployment mcp_deployment_type DEFAULT 'Unknown',
    location TEXT,
    tags TEXT[],
    icon_url TEXT,
    github_url TEXT UNIQUE, -- Ensure a GitHub repo can only be submitted once
    
    -- Flattened detailedInfo for easier querying
    detailed_info_statistics_requests_per_month TEXT,
    detailed_info_statistics_uptime TEXT,
    detailed_info_statistics_average_response_time TEXT,
    detailed_info_capabilities TEXT,
    detailed_info_documentation_url TEXT,
    detailed_info_usage_instructions TEXT,
    
    last_fetched_from_github_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) - IMPORTANT for public anon key access
ALTER TABLE public.mcp_servers ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS:
-- 1. Allow public read access to all rows
DROP POLICY IF EXISTS "Allow public read access" ON public.mcp_servers;
CREATE POLICY "Allow public read access"
ON public.mcp_servers
FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Allow anon insert access
-- This is used by the server action when it uses the anon key.
-- For production, consider more restrictive policies or service_role key for inserts.
DROP POLICY IF EXISTS "Allow anon insert access" ON public.mcp_servers;
CREATE POLICY "Allow anon insert access"
ON public.mcp_servers
FOR INSERT
TO anon 
WITH CHECK (true);


-- Optional: Function and Trigger to auto-update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_mcp_servers_updated ON public.mcp_servers;
CREATE TRIGGER on_mcp_servers_updated
BEFORE UPDATE ON public.mcp_servers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add some indexes for performance
CREATE INDEX IF NOT EXISTS idx_mcp_servers_github_url ON public.mcp_servers(github_url);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_tags ON public.mcp_servers USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_last_fetched ON public.mcp_servers(last_fetched_from_github_at DESC);

-- Grant necessary privileges
GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- The 'postgres' role (or your superuser) should own the tables by default.
-- Granting specific privileges to anon and authenticated roles for RLS.
GRANT SELECT ON TABLE public.mcp_servers TO anon, authenticated;
GRANT INSERT ON TABLE public.mcp_servers TO anon, authenticated; 
-- Add UPDATE, DELETE if needed by your application logic for these roles
-- GRANT UPDATE ON TABLE public.mcp_servers TO anon, authenticated;
-- GRANT DELETE ON TABLE public.mcp_servers TO anon, authenticated;

#!/usr/bin/env node

// Bulk import script for MCP servers from GitHub URLs
// Usage: node scripts/bulk-import.mjs urls.txt
// or: node scripts/bulk-import.mjs "https://github.com/user/repo1" "https://github.com/user/repo2"

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Import dependencies
import { Octokit } from 'octokit';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check required environment variables
if (!process.env.GITHUB_ACCESS_TOKEN) {
  console.error('❌ GITHUB_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are required');
  process.exit(1);
}

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function decodeBase64(encoded) {
  return Buffer.from(encoded, 'base64').toString('utf-8');
}

const MANIFEST_FILES = ['mcp.json', 'mcp-manifest.json', '.mcp/config.json', 'manifest.json'];

async function fetchRepoContent(owner, repo, path) {
  try {
    const response = await octokit.rest.repos.getContent({ owner, repo, path });
    if (response.data && 'content' in response.data && response.data.content) {
      const content = decodeBase64(response.data.content);
      return JSON.parse(content);
    }
  } catch (error) {
    if (error.status !== 404) {
      console.warn(`Error fetching content at ${owner}/${repo}/${path}:`, error.message);
    }
  }
  return null;
}

async function processGitHubRepo(repoUrl) {
  console.log(`Processing: ${repoUrl}`);
  
  const url = new URL(repoUrl);
  const pathParts = url.pathname.split('/').filter(Boolean);
  if (pathParts.length < 2) {
    throw new Error('Invalid GitHub repository URL format.');
  }
  const owner = pathParts[0];
  const repo = pathParts[1];

  // Check if already exists
  const { data: existing } = await supabase
    .from('mcp_servers')
    .select('id')
    .eq('github_url', repoUrl)
    .single();

  if (existing) {
    console.log(`⏭️  Skipping ${repoUrl} - already exists`);
    return { skipped: true };
  }

  let extracted = {};

  try {
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    extracted.name = repoData.name
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Untitled Server';
    extracted.author = repoData.owner?.login || 'Unknown Author';
    extracted.description = repoData.description || undefined;

    // Try to find manifest files
    let manifestJson = null;
    for (const manifestPath of MANIFEST_FILES) {
      manifestJson = await fetchRepoContent(owner, repo, manifestPath);
      if (manifestJson) break;
    }

    if (manifestJson) {
      extracted = {
        ...extracted,
        name: manifestJson.name || extracted.name,
        author: manifestJson.author || extracted.author,
        description: manifestJson.description || extracted.description,
        tools_count: typeof manifestJson.toolsCount === 'number' ? manifestJson.toolsCount : 0,
        authentication: manifestJson.authentication || 'Unknown',
        deployment: manifestJson.deployment || 'Unknown',
        location: manifestJson.location,
        tags: manifestJson.tags || [],
        icon_url: manifestJson.iconUrl,
      };
    } else {
      // Try to get info from README
      let readmeContent = '';
      try {
        const { data: readmeData } = await octokit.rest.repos.getReadme({ owner, repo });
        if (readmeData.content) readmeContent = decodeBase64(readmeData.content);
      } catch (e) {
        // README not found
      }

      if (readmeContent) {
        // Extract JSON from README if present
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = readmeContent.match(jsonRegex);
        if (match && match[1]) {
          try {
            const readmeJson = JSON.parse(match[1]);
            extracted = { ...extracted, ...readmeJson };
          } catch (e) {
            // Invalid JSON in README
          }
        }

        // Extract description from README
        if (!extracted.description && readmeContent) {
          const firstMeaningfulLine = readmeContent
            .split('\n')
            .find(line => line.trim().length > 20 && !line.trim().startsWith('#'))
            ?.trim();
          if (firstMeaningfulLine && firstMeaningfulLine.length < 250) {
            extracted.description = firstMeaningfulLine;
          }
        }

        // Extract tags from content and topics
        if (!extracted.tags || extracted.tags.length === 0) {
          const newTags = [];
          if (readmeContent.toLowerCase().includes(' mcp ') || 
              readmeContent.toLowerCase().includes('model context protocol')) {
            newTags.push('mcp');
          }
          if (readmeContent.toLowerCase().includes(' ai ')) newTags.push('ai');
          if (readmeContent.toLowerCase().includes(' llm')) newTags.push('llm');
          if (repoData.topics) newTags.push(...repoData.topics);
          extracted.tags = Array.from(new Set(newTags));
        }
      }
    }

    // Prepare data for insertion
    const serverData = {
      name: extracted.name || 'Unknown Server',
      author: extracted.author || 'Unknown Author',
      description: extracted.description || null,
      tools_count: extracted.tools_count || 0,
      authentication: extracted.authentication || 'Unknown',
      deployment: extracted.deployment || 'Unknown',
      location: extracted.location || null,
      tags: Array.isArray(extracted.tags) ? extracted.tags : [],
      icon_url: extracted.icon_url || null,
      github_url: repoUrl,
      last_fetched_from_github_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('mcp_servers')
      .insert(serverData)
      .select()
      .single();

    if (error) {
      console.error(`❌ Error inserting ${repoUrl}:`, error.message);
      return { error: error.message };
    }

    console.log(`✅ Successfully added: ${extracted.name} by ${extracted.author}`);
    return { success: true, data };

  } catch (error) {
    console.error(`❌ Error processing ${repoUrl}:`, error.message);
    return { error: error.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/bulk-import.mjs <file.txt> or node scripts/bulk-import.mjs <url1> <url2> ...');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/bulk-import.mjs urls.txt');
    console.log('  node scripts/bulk-import.mjs "https://github.com/user/repo1" "https://github.com/user/repo2"');
    process.exit(1);
  }

  let urls = [];

  // Check if first argument is a file
  if (args.length === 1 && !args[0].startsWith('http')) {
    try {
      const fileContent = readFileSync(args[0], 'utf-8');
      urls = fileContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#') && line.startsWith('http'));
    } catch (error) {
      console.error('Error reading file:', error.message);
      process.exit(1);
    }
  } else {
    urls = args.filter(arg => arg.startsWith('http'));
  }

  if (urls.length === 0) {
    console.error('No valid GitHub URLs found');
    process.exit(1);
  }

  console.log(`🚀 Processing ${urls.length} URLs...\n`);

  const results = {
    success: 0,
    skipped: 0,
    errors: 0,
    details: []
  };

  for (const url of urls) {
    try {
      const result = await processGitHubRepo(url);
      if (result.success) {
        results.success++;
      } else if (result.skipped) {
        results.skipped++;
      } else {
        results.errors++;
        results.details.push({ url, error: result.error });
      }
    } catch (error) {
      results.errors++;
      results.details.push({ url, error: error.message });
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully added: ${results.success}`);
  console.log(`⏭️  Skipped (already exists): ${results.skipped}`);
  console.log(`❌ Errors: ${results.errors}`);

  if (results.details.length > 0) {
    console.log('\n❌ Error details:');
    results.details.forEach(({ url, error }) => {
      console.log(`  ${url}: ${error}`);
    });
  }
}

main().catch(console.error); 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GitHubSubmissionForm } from "@/components/mcp/github-submission-form"

export const metadata = {
  title: "Submit MCP Server | MCP Directory",
  description: "Add your Model Context Protocol server to our directory via its GitHub repository.",
}

export default function SubmitServerPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Submit via GitHub</CardTitle>
          <CardDescription>
            Enter the URL of a public GitHub repository containing an `mcp.json` manifest file in its root. We'll handle
            the rest.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GitHubSubmissionForm />
        </CardContent>
      </Card>
    </div>
  )
}

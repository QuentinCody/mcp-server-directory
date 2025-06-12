"use client"

import { useState } from "react"
import { SubmitFromGitHubState, submitMCPServerFromGitHub } from "@/app/submit/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react"

const initialState: SubmitFromGitHubState = {
  message: "",
  success: false,
}

export function GitHubSubmissionForm() {
  const [state, setState] = useState<SubmitFromGitHubState>(initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await submitMCPServerFromGitHub(state, formData)
      setState(result)
    } catch (error) {
      setState({
        message: "An unexpected error occurred.",
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <form action={handleSubmit} className="space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="githubUrl">GitHub Repository URL</Label>
          <Input
            type="url"
            id="githubUrl"
            name="githubUrl"
            placeholder="https://github.com/username/mcp-server-repo"
            required
            disabled={isSubmitting}
          />
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Extract & Submit"
          )}
        </Button>
      </form>

      {state.message && (
        <Alert variant={state.success ? "default" : "destructive"}>
          <div className="flex items-center">
            {state.success ? (
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 mr-2 text-red-600" />
            )}
            <AlertDescription>{state.message}</AlertDescription>
          </div>
          {state.error && (
            <AlertDescription className="mt-2 text-sm text-red-600">Error: {state.error}</AlertDescription>
          )}
        </Alert>
      )}

      {state.extractedData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Extracted Data</CardTitle>
            <CardDescription>Here's what we found in your repository:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Name:</strong> {state.extractedData.name}
              </div>
              <div>
                <strong>Author:</strong> {state.extractedData.author}
              </div>
              <div className="md:col-span-2">
                <strong>Description:</strong> {state.extractedData.description || "No description found"}
              </div>
              <div>
                <strong>Tools:</strong> {state.extractedData.tools_count}, <strong>Auth:</strong>{" "}
                <Badge variant="outline">{state.extractedData.authentication || "Unknown"}</Badge>
              </div>
              <div>
                <strong>Deployment:</strong>{" "}
                <Badge variant="outline">{state.extractedData.deployment || "Unknown"}</Badge>
              </div>
              {state.extractedData.location && (
                <div>
                  <strong>Location:</strong> {state.extractedData.location}
                </div>
              )}
              {state.extractedData.tags && state.extractedData.tags.length > 0 && (
                <div className="md:col-span-2">
                  <strong>Tags:</strong>{" "}
                  {state.extractedData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="mr-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {state.extractedData.icon_url && (
                <div className="md:col-span-2">
                  <strong>Icon URL:</strong>{" "}
                  <a
                    href={state.extractedData.icon_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    {state.extractedData.icon_url} <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

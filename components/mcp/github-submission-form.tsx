"use client"

import { useActionState, useEffect, useRef } from "react" // Changed from "react-dom"
import { useFormStatus } from "react-dom" // useFormStatus is still from "react-dom"
import { submitMCPServerFromGitHub, type SubmitFromGitHubState } from "@/app/submit/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2, Github, Info } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus() // useFormStatus is correct for components inside the form
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Process Repository
    </Button>
  )
}

export function GitHubSubmissionForm() {
  const initialState: SubmitFromGitHubState = { message: "", success: false }
  // Updated to use React.useActionState
  // It returns [state, formAction, isPending]
  // We can use the isPending from here if needed, or keep using useFormStatus in SubmitButton
  const [state, formAction, isPending] = useActionState(submitMCPServerFromGitHub, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  return (
    <form action={formAction} ref={formRef} className="space-y-6">
      <div>
        <Label htmlFor="githubUrl" className="sr-only">
          GitHub Repository URL
        </Label>
        <div className="relative">
          <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="githubUrl"
            name="githubUrl"
            type="url"
            placeholder="https://github.com/user/repo"
            required
            className="pl-10"
            defaultValue={state.success ? "" : undefined}
          />
        </div>
      </div>

      {/* SubmitButton uses useFormStatus internally, which is fine.
          Alternatively, we could pass `isPending` from useActionState to it.
          For simplicity and idiomatic use of useFormStatus, we'll keep SubmitButton as is.
      */}
      <SubmitButton />

      {state.message && (
        <Alert
          variant={state.success ? "default" : "destructive"}
          className={state.success ? "bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700" : ""}
        >
          {state.success ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{state.success ? "Processing Complete!" : "Error"}</AlertTitle>
          <AlertDescription>{state.error || state.message}</AlertDescription>
        </Alert>
      )}
      {state.success && state.extractedData && (
        <Alert variant="default" className="mt-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Extracted Information Preview</AlertTitle>
          <AlertDescription className="text-xs space-y-1">
            <p>
              <strong>Name:</strong> {state.extractedData.name}
            </p>
            <p>
              <strong>Author:</strong> {state.extractedData.author}
            </p>
            <p>
              <strong>Description:</strong> {state.extractedData.description || "N/A"}
            </p>
            <p>
              <strong>Tools:</strong> {state.extractedData.toolsCount}, <strong>Auth:</strong>{" "}
              {state.extractedData.authentication}, <strong>Deploy:</strong> {state.extractedData.deployment}
            </p>
            <p className="mt-2 italic">
              This server has been added to the directory. Some details might be inferred or default.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="text-xs text-muted-foreground space-y-2 pt-4 border-t">
        <p>We'll try our best to extract MCP server details from your repository's README or any `mcp.json` file.</p>
        <p>
          <strong>Example (with JSON in README):</strong> https://github.com/vercel/ai
        </p>
        <p>
          <strong>Example (basic repo):</strong> https://github.com/shadcn/ui
        </p>
        <p>
          <strong>Example (empty repo):</strong> https://github.com/someuser/empty-repo
        </p>
      </div>
    </form>
  )
}

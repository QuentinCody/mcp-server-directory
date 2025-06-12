export function Footer() {
  return (
    <footer className="py-6 md:px-8 md:py-0 border-t">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built by v0. Inspired by Hugging Face.
          <br />
          &copy; {new Date().getFullYear()} MCP Directory. All rights reserved.
        </p>
        {/* Add social links or other footer content here if needed */}
      </div>
    </footer>
  )
}

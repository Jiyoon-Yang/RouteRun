import { Toaster } from "@/commons/components/ui/sonner"
import { TooltipProvider } from "@/commons/components/ui/tooltip"
import { ThemeProvider } from "@/commons/providers/theme"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster />
    </ThemeProvider>
  )
}

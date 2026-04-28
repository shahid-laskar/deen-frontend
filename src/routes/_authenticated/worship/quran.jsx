import { createFileRoute, Outlet } from '@tanstack/react-router'
import { QuranTabs } from '@/components/quran/QuranTabs'

export const Route = createFileRoute('/_authenticated/worship/quran')({
  component: QuranLayout,
})

function QuranLayout() {
  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      {/* Background radial gradient for premium feel */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent -z-10" />

      {/* Dynamic Tabs across top, sticky */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 shadow-soft/50">
        <div className="max-w-4xl mx-auto">
          <QuranTabs />
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 md:p-8 pb-32">
        <Outlet />
      </main>
    </div>
  )
}

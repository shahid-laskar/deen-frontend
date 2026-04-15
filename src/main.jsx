import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { routeTree } from './routeTree.gen'
import { queryClient } from './lib/queryClient'
import { useAuthStore } from './store/authStore'
import './index.css'

// Create the router with auth context
const router = createRouter({
  routeTree,
  context: {
    auth: undefined, // will be set by the router on first render
  },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

function App() {
  const auth = useAuthStore()
  return <RouterProvider router={router} context={{ auth }} />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          className: '!rounded-xl !shadow-lg !border !border-border !bg-card !text-foreground !text-sm',
          success: { iconTheme: { primary: 'oklch(0.60 0.10 155)', secondary: '#fff' } },
          error:   { iconTheme: { primary: 'oklch(0.577 0.245 27.325)', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
)

import { createRoot } from 'react-dom/client'
import './index.css'
import router from './router.jsx'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './context/ThemeContext.jsx'
import AuthInitializer from './Components/AuthInitializer.jsx'
// import AuthInitializer from './components/AuthInitializer.jsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <RouterProvider router={router} />
      </AuthInitializer>
    </QueryClientProvider>
  </ThemeProvider>
)

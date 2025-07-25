import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner' 
import './index.css'
import { router } from './router'

createRoot(document.getElementById('root')!).render(
  <>
    <Toaster richColors position="top-center" />
    <RouterProvider router={router} />
  </>,
)

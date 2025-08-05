import { Outlet } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Toaster } from '@/components/ui/sonner'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <AppSidebar />
        <div className="relative flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <Outlet />
            <Footer />
          </main>
        </div>
        <Toaster position="top-right" richColors />
      </div>
    </SidebarProvider>
  )
}

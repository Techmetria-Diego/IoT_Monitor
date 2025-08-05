/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './auth'
import { PrivateRoute } from './PrivateRoute'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import PeriodDetails from './pages/PeriodDetails'
import ReportDetails from './pages/ReportDetails'
import SettingsPage from './pages/Settings'
import AuthCallbackPage from './pages/AuthCallback'
import LoginPage from './pages/Login'
import { ThemeProvider } from './components/theme-provider'
import SearchPage from './pages/Search'
import AlertsOverview from './pages/AlertsOverview'
import Documentation from './pages/Documentation'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter
        future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
      >
        <TooltipProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<PrivateRoute><Index /></PrivateRoute>} />
              <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
              <Route path="/alerts" element={<PrivateRoute><AlertsOverview /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
              <Route path="/docs" element={<PrivateRoute><Documentation /></PrivateRoute>} />
              <Route path="/periodo/:periodoId" element={<PrivateRoute><PeriodDetails /></PrivateRoute>} />
              <Route path="/relatorio/:reportId" element={<PrivateRoute><ReportDetails /></PrivateRoute>} />
            </Route>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/login" element={<LoginPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
)

export default App

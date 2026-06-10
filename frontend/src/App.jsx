// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LangProvider } from './context/LangContext'
import { LoginPage } from './pages/LoginPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { HistorialPage } from './pages/HistorialPage'
import { AnalisisDetallePage } from './pages/AnalisisDetallePage'
import { NuevoAnalisisPage } from './pages/NuevoAnalisisPage'
import { ProgramacionesPage } from './pages/ProgramacionesPage'
import { Layout } from './components/Layout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="insights" element={<Navigate to="/dashboard" replace />} />
              <Route path="historial" element={<HistorialPage />} />
              <Route path="historial/:id" element={<AnalisisDetallePage />} />
              <Route path="nuevo" element={<NuevoAnalisisPage />} />
              <Route path="programaciones" element={<ProgramacionesPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import PsicologoDashboard from './pages/PsicologoDashboard'
import DocenteDashboard from './pages/DocenteDashboard'
import AdmisionPortal from './pages/AdmisionPortal'
import PadreDashboard from './pages/PadreDashboard'
import SecretarioDashboard from './pages/SecretarioDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import ChatWidget from './components/ChatWidget'
import useAuthStore from './store/useAuthStore'
import { useEffect } from 'react'

function App() {
  const { role, logout } = useAuthStore()

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (response.status === 401) {
          useAuthStore.getState().logout();
          // Opcionalmente redirigir o alertar
          window.location.href = '/login?expired=1';
        }
        if (response.status === 403) {
          useAuthStore.getState().logout();
          window.location.href = '/login?suspended=1';
        }
        return response;
      } catch (err) {
        throw err;
      }
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  useEffect(() => {
    // Verificación periódica del token (cada 5 segundos)
    // Si la cuenta es suspendida por el admin, este ping fallará (401/403)
    // y el interceptor global cerrará la sesión inmediatamente sin F5.
    const interval = setInterval(() => {
      const token = useAuthStore.getState().token;
      if (token) {
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => {
          // Si hay error de red, ignoramos. El interceptor de fetch ya maneja 401/403.
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <ChatWidget />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admisiones" element={<AdmisionPortal />} />
        
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['PSICOLOGO', 'ADMIN']} />}>
          <Route path="/psicologo" element={<PsicologoDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['DOCENTE', 'ADMIN']} />}>
          <Route path="/docente" element={<DocenteDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ALUMNO_PADRE', 'ADMIN']} />}>
          <Route path="/padre" element={<PadreDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['SECRETARIO', 'ADMIN']} />}>
          <Route path="/secretario" element={<SecretarioDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (searchParams.get('suspended') === '1') {
      setError('Tu cuenta ha sido suspendida por el Administrador.')
    } else if (searchParams.get('expired') === '1') {
      setError('Credenciales inválidas o tu sesión ha expirado.')
    }
  }, [searchParams])

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password })
      })

      if (!response.ok) {
        if (response.status === 403) throw new Error('Cuenta suspendida temporalmente por el Administrador.')
        throw new Error('Credenciales inválidas o servidor inactivo')
      }
      
      const data = await response.json()
      setAuth(data.access_token, data.role)
      
      if (data.role === 'ADMIN') navigate('/admin')
      else if (data.role === 'DOCENTE') navigate('/docente')
      else if (data.role === 'PSICOLOGO') navigate('/psicologo')
      else if (data.role === 'ALUMNO_PADRE') navigate('/padre')
      else if (data.role === 'SECRETARIO') navigate('/secretario')
      else navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-800/30 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <form 
        onSubmit={handleLogin} 
        className="relative z-10 p-10 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl max-w-sm w-full"
      >
        <div className="flex justify-center mb-6">
          <img 
            src="/logo.png" 
            alt="Logo José María Arguedas" 
            className="h-24 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" 
          />
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-8 text-white tracking-tight">I.E.P. José María Arguedas</h2>
        
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="mb-6 p-4 rounded-xl bg-blue-900/40 border border-blue-800/50 text-blue-200 text-xs text-left">
          <p className="font-bold mb-2">Credenciales de prueba:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><span className="font-mono text-white">admin / admin123</span> (Directora)</li>
            <li><span className="font-mono text-white">docente1 / doc123</span> (Docente)</li>
            <li><span className="font-mono text-white">psico1 / psico123</span> (Psicología)</li>
            <li><span className="font-mono text-white">padre1 / padre123</span> (Admisión)</li>
            <li><span className="font-mono text-white">secretario1 / sec123</span> (Caja)</li>
          </ul>
        </div>

        <div className="mb-5">
          <label className="block text-slate-300 text-sm font-medium mb-2">Usuario</label>
          <input 
            type="text" 
            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Ej: admin"
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
          />
        </div>
        
        <div className="mb-8">
          <label className="block text-slate-300 text-sm font-medium mb-2">Contraseña</label>
          <input 
            type="password" 
            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="••••••••"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(30,58,138,0.4)]"
        >
          Autenticar
        </button>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors">
            Volver al inicio
          </Link>
        </div>
      </form>
    </div>
  )
}

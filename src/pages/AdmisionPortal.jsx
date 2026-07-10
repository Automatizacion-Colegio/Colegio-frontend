import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'

export default function AdmisionPortal() {
  const { token, logout } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('nueva') // 'nueva' | 'seguimiento'
  const [config, setConfig] = useState({ primaria: 500, secundaria: 700 })

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/config`)
      .then(res => res.json())
      .then(setConfig)
      .catch(console.error)
  }, [])

  // Wizard States
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    dni: '', nombres: '', apellidos: '', nivel: 'Primaria', grado: '1',
    promedio: '', conducta: 'A',
    ap_nombre: '', ap_correo: '', ap_telefono: ''
  })
  
  // Submit States
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // { status, mensaje, codigo_est, citas }
  
  // Appointment selection
  const [selectedCita, setSelectedCita] = useState(null)
  const [agendando, setAgendando] = useState(false)

  // Tracking States
  const [trackCode, setTrackCode] = useState('')
  const [trackResult, setTrackResult] = useState(null)
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackError, setTrackError] = useState(null)

  // Payment Form States
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pagoForm, setPagoForm] = useState({
    monto: 0,
    tarjeta: '',
    vencimiento: '',
    cvv: ''
  })
  const [pagando, setPagando] = useState(false)

  const handleNext = () => {
    // Basic validations before next
    if (step === 1) {
      if (formData.dni.length !== 8) return alert("DNI debe tener exactamente 8 dígitos.")
      if (!formData.nombres || !formData.apellidos) return alert("Nombres y apellidos son obligatorios.")
    }
    if (step === 2) {
      const prom = parseFloat(formData.promedio)
      if (isNaN(prom) || prom < 0 || prom > 20) return alert("Promedio debe estar entre 0.0 y 20.0")
    }
    if (step === 3) {
      if (!formData.ap_nombre || !formData.ap_correo) return alert("Faltan datos del apoderado.")
      if (formData.ap_telefono.length !== 9) return alert("Teléfono debe tener exactamente 9 dígitos.")
    }
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admision`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          grado: parseInt(formData.grado),
          promedio: parseFloat(formData.promedio)
        })
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      alert('Error de conexión con IA.')
    }
    setLoading(false)
  }

  const handleConfirmCita = async () => {
    if(!selectedCita) return alert("Selecciona un horario.")
    setAgendando(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admision/agendar_cita`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente: { ...formData, grado: parseInt(formData.grado), promedio: parseFloat(formData.promedio) },
          dia: selectedCita.dia,
          hora: selectedCita.hora
        })
      })
      const data = await res.json()
      setResult({ status: 'agendado', codigo_obs: data.codigo_obs, mensaje: data.mensaje })
    } catch (err) {
      alert("Error al agendar.")
    }
    setAgendando(false)
  }

  const handleSeguimiento = async (e) => {
    e.preventDefault()
    setTrackLoading(true)
    setTrackError(null)
    setTrackResult(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admision/seguimiento/${trackCode}`)
      const data = await res.json()
      if (res.ok) setTrackResult(data)
      else setTrackError(data.detail)
    } catch (err) {
      setTrackError("Error de conexión.")
    }
    setTrackLoading(false)
  }

  const handlePago = async (e) => {
    e.preventDefault()
    if (!pagoForm.tarjeta || !pagoForm.vencimiento || !pagoForm.cvv) {
      return alert("Por favor complete los datos de la tarjeta.")
    }
    setPagando(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/caja/pagar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo_est: trackCode, monto_pagado: parseFloat(pagoForm.monto) })
      })
      const data = await res.json()
      if (res.ok) {
        if (data.credenciales) {
          alert(`¡Pago procesado con éxito! Tu matrícula está confirmada.\n\nEl sistema ha generado automáticamente tu acceso al portal familiar:\nUsuario: ${data.credenciales.usuario}\nContraseña: ${data.credenciales.password}\n\nPor favor, guarda estos datos para poder ingresar.`)
        } else {
          alert("¡Pago procesado con éxito! Tu matrícula está confirmada.")
        }
        setShowPaymentModal(false)
        // Re-fetch seguimiento to update UI
        const trackRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admision/seguimiento/${trackCode}`)
        if (trackRes.ok) setTrackResult(await trackRes.json())
      } else {
        alert(data.detail || "Error al procesar el pago")
      }
    } catch (err) {
      alert("Error de conexión al procesar el pago.")
    }
    setPagando(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-800/20 rounded-full blur-[120px] pointer-events-none"></div>

      <nav className="fixed w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
            <span className="text-xl font-bold tracking-tight uppercase tracking-widest">José María Arguedas</span>
          </Link>
          <div className="flex gap-4">
            <Link to="/" className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Volver al inicio</Link>
            {token && (
              <button onClick={() => { logout(); navigate('/') }} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 text-sm">
                Cerrar Sesión
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-32">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold mb-4">Portal de Admisiones IA</h1>
          <div className="inline-flex bg-slate-900 border border-slate-800 rounded-full p-1">
            <button onClick={() => setActiveTab('nueva')} className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'nueva' ? 'bg-blue-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              Nueva Postulación
            </button>
            <button onClick={() => setActiveTab('seguimiento')} className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'seguimiento' ? 'bg-blue-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              Seguimiento de Expediente
            </button>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md shadow-2xl min-h-[500px]">
          
          {activeTab === 'nueva' && (
            <div className="animate-fade-in-up">
              {!result || result.status === 'requiere_cita' ? (
                <>
                  {/* Progress Bar */}
                  <div className="flex justify-between items-center mb-8 relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -z-10 -translate-y-1/2 rounded-full"></div>
                    <div className="absolute top-1/2 left-0 h-1 bg-blue-600 -z-10 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
                    
                    {[1,2,3,4].map(num => (
                      <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= num ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-900 text-slate-500 border border-slate-700'}`}>
                        {num}
                      </div>
                    ))}
                  </div>

                  {step === 1 && (
                    <div className="space-y-4 animate-fade-in-up">
                      <h2 className="text-2xl font-bold mb-6">Datos del Alumno</h2>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">DNI (8 dígitos)</label>
                        <input type="text" maxLength="8" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value.replace(/\D/g,'')})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Nombres</label>
                          <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Apellidos</label>
                          <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white" value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Nivel</label>
                          <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white" value={formData.nivel} onChange={e => setFormData({...formData, nivel: e.target.value, grado: '1'})}>
                            <option value="Primaria">Primaria</option>
                            <option value="Secundaria">Secundaria</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Grado</label>
                          <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white" value={formData.grado} onChange={e => setFormData({...formData, grado: e.target.value})}>
                            {formData.nivel === 'Primaria' ? [1,2,3,4,5,6].map(g => <option key={g} value={g}>{g}° Grado</option>) : [1,2,3,4,5].map(g => <option key={g} value={g}>{g}° Grado</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4 animate-fade-in-up">
                      <h2 className="text-2xl font-bold mb-6">Perfil Académico</h2>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Promedio General Anterior (0.0 a 20.0)</label>
                        <input type="number" step="0.1" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white font-mono" value={formData.promedio} onChange={e => setFormData({...formData, promedio: e.target.value})} placeholder="Ej: 16.5" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Calificación Conductual</label>
                        <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white" value={formData.conducta} onChange={e => setFormData({...formData, conducta: e.target.value})}>
                          <option value="A">A - Conducta Ejemplar</option>
                          <option value="B">B - Conducta Regular (Requiere mejora)</option>
                          <option value="C">C - Deficiente (Llamados de atención)</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-2">La Inteligencia Artificial evaluará estos datos estrictamente.</p>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4 animate-fade-in-up">
                      <h2 className="text-2xl font-bold mb-6">Datos del Apoderado</h2>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Nombre Completo del Apoderado</label>
                        <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white" value={formData.ap_nombre} onChange={e => setFormData({...formData, ap_nombre: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Correo Electrónico</label>
                        <input type="email" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white" value={formData.ap_correo} onChange={e => setFormData({...formData, ap_correo: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Teléfono Móvil (9 dígitos)</label>
                        <input type="text" maxLength="9" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white" value={formData.ap_telefono} onChange={e => setFormData({...formData, ap_telefono: e.target.value.replace(/\D/g,'')})} />
                      </div>
                    </div>
                  )}

                  {step === 4 && !result && (
                    <div className="text-center py-12 animate-fade-in-up">
                      <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-indigo-500/50 flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <div className="w-8 h-8 bg-blue-600 rounded-full animate-ping"></div>
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Revisión Final IA</h2>
                      <p className="text-slate-400 mb-8 max-w-sm mx-auto">El Orquestador IA y el Agente de Evaluación analizarán los datos en milisegundos.</p>
                      
                      <button onClick={handleSubmit} disabled={loading} className="px-8 py-4 bg-blue-700 hover:bg-blue-800 rounded-xl font-bold transition-all shadow-lg shadow-blue-800/40 w-full max-w-sm">
                        {loading ? 'Analizando expediente con IA...' : 'Enviar Expediente Oficial'}
                      </button>
                    </div>
                  )}

                  {result?.status === 'requiere_cita' && (
                    <div className="animate-fade-in-up">
                      <div className="bg-yellow-500/10 border border-yellow-500/30 p-6 rounded-2xl mb-6 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></span>
                          <h3 className="text-xl font-bold text-yellow-400">Atención Pedagógica Requerida</h3>
                        </div>
                        <p className="text-yellow-200/80 mb-6">Requerimos una evaluación psicológica adicional para asegurar el mejor acompañamiento conductual del estudiante.</p>
                        
                        <h4 className="font-bold text-white mb-3">Horarios Disponibles (Elige uno):</h4>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          {result.citas.map((c, i) => (
                            <button 
                              key={i} 
                              onClick={() => setSelectedCita(c)}
                              className={`p-3 rounded-xl border text-sm text-left transition-all ${selectedCita === c ? 'bg-yellow-500 text-slate-900 border-yellow-500 font-bold' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-yellow-500/50'}`}
                            >
                              <div className="font-bold mb-1">{c.dia}</div>
                              <div className="opacity-80">{c.hora}</div>
                            </button>
                          ))}
                        </div>

                        <button onClick={handleConfirmCita} disabled={agendando} className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 rounded-xl font-bold transition-colors">
                          {agendando ? 'Agendando...' : 'Confirmar Cita y Generar Código'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons (Only show on steps 1,2,3) */}
                  {step < 4 && (
                    <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                      <button 
                        onClick={() => setStep(s => Math.max(1, s - 1))}
                        className={`px-6 py-2 rounded-lg font-bold text-sm ${step === 1 ? 'invisible' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                      >
                        Atrás
                      </button>
                      <button 
                        onClick={handleNext}
                        className="px-6 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg font-bold text-sm transition-colors text-white"
                      >
                        Siguiente Paso
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Success Screens after Submit */
                <div className="animate-fade-in-up text-center py-10">
                  {result.status === 'admitido' && (
                    <div className="bg-green-500/10 border border-green-500/30 p-8 rounded-3xl shadow-[0_0_40px_rgba(34,197,94,0.15)] inline-block w-full">
                      <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-green-500/40">✓</div>
                      <h2 className="text-3xl font-bold text-green-400 mb-2">¡Felicitaciones!</h2>
                      <p className="text-green-200/80 mb-6">El estudiante ha sido Admitido directamente por su excelente perfil.</p>
                      
                      <div className="bg-black/40 border border-green-500/20 rounded-xl p-4 mb-4">
                        <p className="text-xs text-green-400/70 mb-1 uppercase tracking-widest">CÓDIGO DE MATRÍCULA (EST)</p>
                        <p className="text-3xl font-mono font-bold text-white tracking-wider">{result.codigo_est}</p>
                      </div>
                      <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 mb-6">
                        <h4 className="font-bold text-emerald-400">Monto de Matrícula: S/ {formData.nivel === 'Primaria' ? config.primaria.toFixed(2) : config.secundaria.toFixed(2)}</h4>
                        <p className="text-sm text-emerald-200/80 mt-1">Dirígete a la pestaña "Seguimiento de Expediente" e ingresa tu código para efectuar el pago y asegurar tu vacante.</p>
                      </div>
                      <p className="text-sm text-slate-400 font-bold">Por favor, anota o copia tu código antes de continuar.</p>
                    </div>
                  )}

                  {result.status === 'agendado' && (
                    <div className="bg-purple-500/10 border border-purple-500/30 p-8 rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.15)] inline-block w-full">
                      <div className="w-20 h-20 bg-purple-500 text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-purple-500/40">📅</div>
                      <h2 className="text-3xl font-bold text-purple-400 mb-2">Cita Confirmada</h2>
                      <p className="text-purple-200/80 mb-6">Se ha registrado el horario de evaluación psicológica.</p>
                      
                      <div className="bg-black/40 border border-purple-500/20 rounded-xl p-4 mb-4">
                        <p className="text-xs text-purple-400/70 mb-1 uppercase tracking-widest">CÓDIGO DE OBSERVACIÓN (OBS)</p>
                        <p className="text-3xl font-mono font-bold text-white tracking-wider">{result.codigo_obs}</p>
                      </div>
                      <p className="text-sm text-slate-400">Preséntate en el horario elegido e indica este código. Haz seguimiento desde este mismo portal.</p>
                    </div>
                  )}
                  
                  <button onClick={() => { setStep(1); setResult(null); }} className="mt-8 text-indigo-400 hover:text-indigo-300 font-bold text-sm">
                    Volver al inicio
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'seguimiento' && (
            <div className="animate-fade-in-up py-4">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Rastreador de Expedientes</h2>
                <p className="text-slate-400">Ingresa tu código único (EST-... u OBS-...) para consultar el estado en la base de datos centralizada.</p>
              </div>

              <form onSubmit={handleSeguimiento} className="flex gap-3 mb-10 max-w-lg mx-auto">
                <input 
                  type="text" 
                  required
                  placeholder="Ej: EST-2026-PRI-001"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 text-center font-mono font-bold focus:border-blue-500 outline-none text-white tracking-widest uppercase"
                  value={trackCode}
                  onChange={e => setTrackCode(e.target.value.toUpperCase())}
                />
                <button type="submit" disabled={trackLoading} className="px-8 bg-blue-700 hover:bg-blue-600 rounded-xl font-bold transition-colors">
                  {trackLoading ? '...' : 'Consultar'}
                </button>
              </form>

              {trackError && (
                <div className="text-center text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-xl max-w-lg mx-auto">
                  {trackError}
                </div>
              )}

              {trackResult && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-lg mx-auto shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold">{trackResult.data.nombres}</h3>
                      <p className="text-sm text-slate-400">DNI: {trackResult.data.dni} | {trackResult.data.grado}° {trackResult.data.nivel}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-3 py-1 rounded text-xs font-mono">
                      {trackCode}
                    </div>
                  </div>

                  <div className="relative pl-6 border-l-2 border-slate-800 space-y-6 mt-8">
                    
                    {/* Step 1: Postulado (Always active if code exists) */}
                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 bg-blue-600 rounded-full ring-4 ring-slate-900"></div>
                      <h4 className="font-bold text-white">Postulación Recibida</h4>
                      <p className="text-sm text-slate-400">Datos procesados por Orquestador IA.</p>
                    </div>

                    {/* Step 2: Evaluación / Rechazo */}
                    {trackResult.data.estado_proceso === "Rechazado" ? (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-4 h-4 bg-red-500 rounded-full ring-4 ring-slate-900"></div>
                        <h4 className="font-bold text-red-400">Expediente Rechazado</h4>
                        <p className="text-sm text-red-300/70">{trackResult.data.motivo || 'No apto.'}</p>
                      </div>
                    ) : trackResult.data.estado_proceso === "En Observación" ? (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-4 h-4 bg-yellow-500 rounded-full ring-4 ring-slate-900 animate-pulse"></div>
                        <h4 className="font-bold text-yellow-400">Evaluación Psicológica Pendiente</h4>
                        <p className="text-sm text-yellow-200/70">Acércate en la fecha acordada.</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-4 h-4 bg-blue-600 rounded-full ring-4 ring-slate-900"></div>
                        <h4 className="font-bold text-white">Evaluación Superada</h4>
                        <p className="text-sm text-slate-400">Perfil óptimo confirmado por IA.</p>
                      </div>
                    )}

                    {/* Step 3: Matrícula */}
                    {trackResult.data.estado_proceso === "Admitido (Falta Pago)" && (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-4 h-4 bg-slate-700 rounded-full ring-4 ring-slate-900"></div>
                        <h4 className="font-bold text-slate-300">Pendiente de Matrícula</h4>
                        <p className="text-sm text-slate-500 mb-3">Realiza el pago en caja para asegurar la vacante.</p>
                        <button 
                          onClick={() => {
                            const monto = trackResult.data.nivel === 'Primaria' ? config.primaria : config.secundaria
                            setPagoForm({...pagoForm, monto: monto})
                            setShowPaymentModal(true)
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform"
                        >
                          Pagar Matrícula Ahora
                        </button>
                      </div>
                    )}

                    {trackResult.data.estado_proceso === "Matriculado" && (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-4 h-4 bg-green-500 rounded-full ring-4 ring-slate-900 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                        <h4 className="font-bold text-green-400">Oficialmente Matriculado</h4>
                        <p className="text-sm text-green-200/70">Bienvenido a I.E.P. José María Arguedas.</p>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-xl font-bold">Pasarela de Pago</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handlePago} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Monto a Pagar (S/)</label>
                <input 
                  type="number" 
                  value={pagoForm.monto} 
                  onChange={e => setPagoForm({...pagoForm, monto: e.target.value})} 
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 text-lg font-bold"
                  readOnly // En un caso real podría ser readonly si el monto es fijo
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Número de Tarjeta</label>
                <input 
                  type="text" 
                  placeholder="0000 0000 0000 0000"
                  value={pagoForm.tarjeta}
                  onChange={e => setPagoForm({...pagoForm, tarjeta: e.target.value})}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 font-mono"
                  maxLength={19}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-1">Vencimiento</label>
                  <input 
                    type="text" 
                    placeholder="MM/AA"
                    value={pagoForm.vencimiento}
                    onChange={e => setPagoForm({...pagoForm, vencimiento: e.target.value})}
                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 font-mono"
                    maxLength={5}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-1">CVV</label>
                  <input 
                    type="password" 
                    placeholder="123"
                    value={pagoForm.cvv}
                    onChange={e => setPagoForm({...pagoForm, cvv: e.target.value})}
                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 font-mono"
                    maxLength={4}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={pagando}
                className="w-full mt-6 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(30,58,138,0.4)] disabled:opacity-50 transition-all text-lg flex items-center justify-center gap-2"
              >
                {pagando ? 'Procesando...' : `Pagar S/ ${pagoForm.monto}`}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

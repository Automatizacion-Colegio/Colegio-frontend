import { useEffect, useState } from 'react'
import useAuthStore from '../store/useAuthStore'
import ChatWidget from '../components/ChatWidget'
import { 
  ClipboardCheck, 
  Users, 
  Brain, 
  Bot, 
  LogOut, 
  CheckCircle, 
  Coffee, 
  AlertTriangle, 
  AlertCircle, 
  Mail, 
  ClipboardList, 
  Check, 
  X 
} from 'lucide-react'

export default function PsicologoDashboard() {
  const { token, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('admision') // admision, rendimiento, historial, evaluador_ia
  const [observed, setObserved] = useState({})
  const [citasRendimiento, setCitasRendimiento] = useState([])
  const [loading, setLoading] = useState(null) 
  const [observaciones, setObservaciones] = useState({}) 
  const [resultMsg, setResultMsg] = useState(null)
  const [historialCitas, setHistorialCitas] = useState([])
  const [alertasIa, setAlertasIa] = useState([])
  const [modalAtender, setModalAtender] = useState({ open: false, cita_id: null })
  const [informeTexto, setInformeTexto] = useState('')

  // Evaluador IA state
  const [evalForm, setEvalForm] = useState({ student_id: 1, student_name: '', grades: { "Matematica": 10 }, absences: 0, teacher_observations: [] })
  const [evalObsStr, setEvalObsStr] = useState('')
  const [evalGradesStr, setEvalGradesStr] = useState('{"Matematica": 14, "Comunicacion": 10}')
  const [evalResult, setEvalResult] = useState(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const fetchData = () => {
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/state`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(data => {
        setObserved(data.observed_students || {})
        setAlertasIa(data.alertas_ia || [])
      })
      
    fetch(`${import.meta.env.VITE_API_URL}/api/psicologia/citas_rendimiento`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(setCitasRendimiento)
      
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/citas_historial`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(setHistorialCitas)
  }

  useEffect(() => { fetchData() }, [token])

  const handleEvaluate = async (codigo_obs, decision) => {
    const obs = observaciones[codigo_obs] || ''
    if (!obs.trim()) return alert('Debes escribir una observación antes de emitir tu dictamen.')
    
    setLoading(codigo_obs)
    setResultMsg(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/psicologia/evaluar/${codigo_obs}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ decision, observacion: obs })
      })
      const data = await res.json()
      setResultMsg({ tipo: decision === 'Aprobado' ? 'success' : 'reject', texto: data.mensaje })
      fetchData()
    } catch (err) { console.error(err) }
    setLoading(null)
  }

  const handleAtenderCita = async () => {
    if (!informeTexto.trim()) return alert("Debes escribir un informe de la evaluación.")
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/psicologia/citas/${modalAtender.cita_id}/atender`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ informe: informeTexto })
      })
      if (res.ok) {
        alert("Cita de rendimiento atendida y guardada en el historial.")
        setModalAtender({ open: false, cita_id: null })
        setInformeTexto('')
        fetchData()
      }
    } catch (err) { console.error(err) }
  }

  const handleEvaluateAI = async (e) => {
    e.preventDefault()
    setIsEvaluating(true)
    setEvalResult(null)
    
    try {
      const parsedGrades = JSON.parse(evalGradesStr)
      const parsedObs = evalObsStr.split(',').map(s => s.trim()).filter(s => s)
      
      const payload = {
        ...evalForm,
        grades: parsedGrades,
        teacher_observations: parsedObs,
        student_id: parseInt(evalForm.student_id) || 1
      }
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deep-agents/evaluate-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error("Error en el servidor")
      const data = await res.json()
      setEvalResult(data)
    } catch (err) {
      alert("Hubo un error al evaluar al estudiante. Verifica el formato JSON de las notas.")
    } finally {
      setIsEvaluating(false)
    }
  }

  const TabButton = ({ id, label, icon }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === id ? 'bg-blue-800/20 text-blue-400 border border-blue-800/50 shadow-blue-800/40' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-white/5'}`}
    >
      <div className={`p-2 rounded-lg ${activeTab === id ? 'bg-blue-800/30 text-blue-400' : 'bg-white/5 text-slate-400'}`}>
        {icon}
      </div>
      <span className="text-sm text-left">{label}</span>
    </button>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-hidden flex relative">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-800/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      {/* Sidebar */}
      <aside className="w-[320px] flex-shrink-0 bg-slate-900/60 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-[8px_0_32px_rgba(0,0,0,0.5)] z-20 relative">
        <div className="p-6 border-b border-white/10 flex items-center gap-4 bg-black/20">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-tight">José María<br/>Arguedas</h1>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mb-3 mt-2">Menú</p>
          <TabButton id="admision" label="Evaluación de Admisión" icon={<ClipboardCheck className="w-4 h-4" />} />
          <TabButton id="rendimiento" label="Citas de Rendimiento" icon={<Users className="w-4 h-4" />} />
          <TabButton id="historial" label="Expediente Psicológico" icon={<ClipboardList className="w-4 h-4" />} />
          <TabButton id="evaluador_ia" label="Análisis Conductual" icon={<Brain className="w-4 h-4" />} />
        </nav>
        
        <div className="p-4 border-t border-white/10 bg-black/20">
          <button onClick={logout} className="w-full py-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all font-medium flex items-center justify-center">
            <LogOut className="w-4 h-4 mr-2 inline" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col relative z-10 w-full">
        {/* Header */}
        <header className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-md flex justify-between items-center shadow-sm">
          <div>
             <p className="text-sm text-blue-300 font-medium tracking-wide uppercase">I.E.P. José María Arguedas</p>
             <h2 className="text-2xl font-bold mt-1 capitalize text-white">
                {activeTab === 'evaluador_ia' ? 'Análisis Conductual' : activeTab === 'historial' ? 'Expediente Psicológico' : activeTab.replace('_', ' ')}
             </h2>
          </div>
          <div className="flex gap-3">
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar w-full">
          <div className="max-w-[1600px] mx-auto w-full">
            
            {resultMsg && (
              <div className={`mb-6 p-4 rounded-xl border text-sm font-bold animate-fade-in-up ${resultMsg.tipo === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {resultMsg.texto}
              </div>
            )}

            {modalAtender.open && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full">
                  <h3 className="text-xl font-bold text-yellow-600 mb-4">Evaluar y Atender Caso</h3>
                  <p className="text-sm text-slate-400 mb-4">Ingresa tu informe u observaciones. Este documento quedará en el historial del estudiante.</p>
                  <textarea 
                    className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white h-32 mb-4 focus:outline-none focus:border-blue-600"
                    placeholder="Escribe los puntos de vista de la evaluación..."
                    value={informeTexto}
                    onChange={e => setInformeTexto(e.target.value)}
                  ></textarea>
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setModalAtender({ open: false, cita_id: null })} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">Cancelar</button>
                    <button onClick={handleAtenderCita} className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-bold shadow-[0_0_15px_rgba(202,138,4,0.3)]">Guardar y Atender</button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeTab === 'admision' && (
                Object.keys(observed).length === 0 ? (
                  <div className="col-span-full p-16 text-center border border-dashed border-slate-700 rounded-2xl">
                    <div className="flex justify-center mb-4">
                      <CheckCircle className="w-12 h-12 text-slate-500" />
                    </div>
                    <p className="text-slate-500 text-lg">No hay alumnos en observación por admisión actualmente.</p>
                  </div>
                ) : (
                  Object.entries(observed).map(([codigo, data]) => (
                    <div key={codigo} className="bg-slate-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 to-yellow-400"></div>
                      
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-mono text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">{codigo}</span>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">{data.grado}° {data.nivel}</span>
                      </div>
                      
                      <h3 className="text-lg font-bold mb-1">{data.nombres}</h3>
                      <p className="text-slate-400 text-sm mb-2">DNI: {data.dni}</p>
                      
                      <div className="bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-lg text-sm text-yellow-200/70 mb-4">
                        <span className="text-yellow-500 font-bold text-xs uppercase block mb-1">Datos Académicos:</span>
                        Promedio: {data.datos_originales?.promedio || 'N/A'} | Conducta: {data.datos_originales?.conducta || 'N/A'}
                      </div>

                      <div className="mb-4">
                        <textarea rows="3" placeholder="Observación Profesional *" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-600 outline-none text-white resize-none" value={observaciones[codigo] || ''} onChange={e => setObservaciones({...observaciones, [codigo]: e.target.value})} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleEvaluate(codigo, 'Aprobado')} disabled={loading === codigo} className="py-3 bg-green-600 hover:bg-green-500 rounded-xl text-sm font-bold flex justify-center items-center gap-2">
                          <Check className="w-4 h-4" /> Aprobar
                        </button>
                        <button onClick={() => handleEvaluate(codigo, 'Rechazado')} disabled={loading === codigo} className="py-3 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-bold flex justify-center items-center gap-2">
                          <X className="w-4 h-4" /> Rechazar
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeTab === 'rendimiento' && (
                citasRendimiento.length === 0 ? (
                  <div className="col-span-full p-16 text-center border border-dashed border-slate-700 rounded-2xl">
                    <div className="flex justify-center mb-4">
                      <Coffee className="w-12 h-12 text-slate-500" />
                    </div>
                    <p className="text-slate-500 text-lg">No hay citas de rendimiento agendadas por tutores.</p>
                  </div>
                ) : (
                  citasRendimiento.map(cita => (
                    <div key={cita.id} className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-sm font-bold text-blue-400 bg-blue-800/30 px-3 py-1 rounded-full">{cita.dia} a las {cita.hora}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${cita.estado === 'Atendido' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{cita.estado}</span>
                        </div>
                        <h3 className="text-xl font-bold mb-1">Alumno: {cita.alumno}</h3>
                        <p className="text-slate-400 text-sm mb-4">Motivo: Cita Tripartita por Bajo Rendimiento / Conducta.</p>
                      </div>
                      
                      {cita.estado === 'Pendiente' && (
                        <div className="mt-4">
                          <button onClick={() => setModalAtender({ open: true, cita_id: cita.id })} className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(202,138,4,0.3)] flex items-center justify-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Evaluar y Atender Cita (Informe)
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )
              )}

              {activeTab === 'historial' && (
                <div className="col-span-full grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl font-semibold mb-4 text-yellow-600 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" /> Casos Críticos (Análisis Predictivo)
                    </h3>
                    {alertasIa.length === 0 ? (
                      <p className="text-slate-500 italic">No hay alertas de reincidencia generadas por el sistema predictivo.</p>
                    ) : (
                      <div className="space-y-4">
                        {alertasIa.map((alerta, i) => (
                          <div key={i} className="bg-yellow-600/10 border border-yellow-600/30 p-4 rounded-xl border-l-4 border-l-yellow-600">
                            <h4 className="font-bold text-yellow-500">Alumno: {alerta.alumno} ({alerta.citas} citas recurrentes)</h4>
                            <p className="text-sm mt-2 text-slate-300 italic">"{alerta.reporte}"</p>
                            <p className="text-xs text-yellow-600/70 mt-3 flex items-center gap-2">
                              <Mail className="w-3 h-3" /> Notificación enviada por correo a apoderado_id: {alerta.apoderado_id}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl font-semibold mb-4 text-yellow-600 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5" /> Expediente Completo de Citas
                    </h3>
                    {historialCitas.length === 0 ? (
                      <p className="text-slate-500 italic">No hay historial de citas registrado en la base de datos.</p>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <table className="w-full text-left">
                          <thead><tr className="text-xs text-slate-500 uppercase"><th>Alumno</th><th>Motivo</th><th>Fecha</th><th>Estado</th><th>Informe</th></tr></thead>
                          <tbody>
                            {historialCitas.map(c => (
                              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                                <td className="py-4 font-bold text-blue-300">{c.alumno}</td>
                                <td className="py-4">{c.motivo}</td>
                                <td className="py-4 text-slate-400">{c.dia} a las {c.hora}</td>
                                <td className="py-4">
                                  <span className={`px-2 py-1 text-xs rounded font-bold ${c.estado === 'Atendido' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{c.estado}</span>
                                </td>
                                <td className="py-4 text-slate-300 italic">{c.informe || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'evaluador_ia' && (
                <div className="col-span-full bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-xl">
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <Brain className="w-8 h-8 text-yellow-600" /> Análisis Clínico y Predictivo
                  </h2>
                  <p className="text-slate-400 mb-8">Ingresa los datos del estudiante para que el sistema de análisis conductual evalúe el nivel de riesgo de deserción o problemas severos.</p>
                  
                  <form onSubmit={handleEvaluateAI} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Nombre del Estudiante</label>
                      <input required value={evalForm.student_name} onChange={e => setEvalForm({...evalForm, student_name: e.target.value})} placeholder="Ej: Carlos Pérez" className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-white focus:border-yellow-600 focus:outline-none"/>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Faltas Injustificadas</label>
                      <input type="number" required value={evalForm.absences} onChange={e => setEvalForm({...evalForm, absences: parseInt(e.target.value) || 0})} placeholder="Ej: 5" className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-white focus:border-yellow-600 focus:outline-none"/>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-slate-400 mb-2">Promedios por Curso (JSON)</label>
                      <textarea required value={evalGradesStr} onChange={e => setEvalGradesStr(e.target.value)} rows={3} className="w-full font-mono text-sm bg-black/40 border border-slate-700 rounded-xl p-3 text-white focus:border-yellow-600 focus:outline-none"/>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-slate-400 mb-2">Observaciones Docentes (Separadas por coma)</label>
                      <input required value={evalObsStr} onChange={e => setEvalObsStr(e.target.value)} placeholder="Ej: Se distrae mucho, No trae tarea, Agresivo en recreo" className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-white focus:border-yellow-600 focus:outline-none"/>
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <button disabled={isEvaluating} type="submit" className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(202,138,4,0.4)]">
                        {isEvaluating ? "Procesando Análisis Predictivo..." : "Analizar Conducta y Riesgo"}
                      </button>
                    </div>
                  </form>

                  {evalResult && (
                    <div className={`border rounded-2xl p-6 mt-6 ${evalResult.risk_level === 'Alto' ? 'bg-red-500/10 border-red-500/50' : evalResult.risk_level === 'Medio' ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-green-500/10 border-green-500/50'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          Diagnóstico Clínico Predictivo
                          <span className={`text-xs px-3 py-1 rounded-full text-white ${evalResult.risk_level === 'Alto' ? 'bg-red-600' : evalResult.risk_level === 'Medio' ? 'bg-yellow-600' : 'bg-green-600'}`}>
                            Riesgo {evalResult.risk_level}
                          </span>
                        </h3>
                      </div>
                      <p className="text-slate-300 mb-4 whitespace-pre-wrap"><strong className="text-white">Diagnóstico:</strong> {evalResult.diagnostico}</p>
                      <p className="text-slate-300 whitespace-pre-wrap"><strong className="text-white">Plan de Acción:</strong> {evalResult.accion_recomendada}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <ChatWidget roleName="Asistente Clínico" />
    </div>
  )
}

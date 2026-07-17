import { useState, useEffect } from 'react'
import useAuthStore from '../store/useAuthStore'
import ChatWidget from '../components/ChatWidget'
import { 
  BarChart, 
  Calendar, 
  Bot, 
  GraduationCap, 
  Brain, 
  LogOut, 
  User, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react'

export default function PadreDashboard() {
  const { token, logout } = useAuthStore()
  
  const [alumno, setAlumno] = useState(null)
  const [activeTab, setActiveTab] = useState('rendimiento')
  
  // Tutor Virtual
  const [tutorQuery, setTutorQuery] = useState('')
  const [tutorResponse, setTutorResponse] = useState('')
  const [loadingTutor, setLoadingTutor] = useState(false)
  const [libreta, setLibreta] = useState([])
  const [alertas, setAlertas] = useState([])
  const [error, setError] = useState(null)
  const [observaciones, setObservaciones] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [pctAsistencia, setPctAsistencia] = useState(0)
  const [citasPendientes, setCitasPendientes] = useState([])
  const [horario, setHorario] = useState([])
  const [anioEstado, setAnioEstado] = useState(null)
  const [showPoll, setShowPoll] = useState(false)

  // Orientación Vocacional (Secundaria)
  const [vocationalQuery, setVocationalQuery] = useState('')
  const [vocationalResponse, setVocationalResponse] = useState('')
  const [loadingVocational, setLoadingVocational] = useState(false)

  // Justificación Médica (OCR)
  const [medicalFile, setMedicalFile] = useState(null)
  const [medicalResult, setMedicalResult] = useState(null)
  const [loadingMedical, setLoadingMedical] = useState(false)
  const [certificados, setCertificados] = useState([])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/padre/libreta`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async res => {
        if (!res.ok) throw new Error("No se pudo cargar la información del estudiante.")
        return res.json()
      })
      .then(data => {
        setAlumno(data.alumno)
    fetch(`${import.meta.env.VITE_API_URL}/api/padre/certificados`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setCertificados(data || []))
      .catch(console.error)

        setLibreta(data.libreta || [])
        setAlertas(data.alertas_ia || [])
        setObservaciones(data.observaciones || [])
        setAsistencias(data.asistencias || [])
        setPctAsistencia(data.porcentaje_inasistencia || 0)
        setCitasPendientes(data.citas_psicologia || [])
        setHorario(data.horario || [])
        setAnioEstado(data.anio_escolar_estado)
        if (data.anio_escolar_estado === 'CERRADO' && data.alumno?.estado_continuidad === 'PENDIENTE') {
          setShowPoll(true)
        }
      })
      .catch(err => setError(err.message))
  }, [token])

  const isPrimaria = alumno?.nivel === 'PRIMARIA'

  const handleTutorQuery = async () => {
    if (!tutorQuery.trim() || !alumno) return;
    setLoadingTutor(true);
    setTutorResponse('');
    
    const perfil = `Alumno: ${alumno.nombres}\nGrado: ${alumno.grado}`;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deep-agents/student-tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pregunta: tutorQuery, perfil_alumno: perfil })
      });
      const data = await res.json();
      if(res.ok) setTutorResponse(data.response);
      else setTutorResponse("Lo siento, hubo un error conectando con el sistema.");
    } catch (e) {
      setTutorResponse("Error de conexión con el sistema.");
    } finally {
      setLoadingTutor(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center justify-center">
        <h1 className="text-3xl text-red-400 mb-4">Error de Acceso</h1>
        <p className="text-slate-400 mb-8">{error}</p>
        <button onClick={logout} className="px-6 py-2 bg-red-600 rounded-lg">Cerrar Sesión</button>
      </div>
    )
  }

  const handleVocationalQuery = async () => {
    if (!vocationalQuery.trim()) return
    setLoadingVocational(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deep-agents/vocational-advisor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ alumno_id: alumno.id, intereses: vocationalQuery })
      })
      const data = await res.json()
      if (res.ok) setVocationalResponse(data.advice)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingVocational(false)
    }
  }

  const handleUploadMedical = async (e) => {
    e.preventDefault()
    if (!medicalFile) return alert("Selecciona una foto del documento")
    setLoadingMedical(true)
    setMedicalResult(null)
    const formData = new FormData()
    formData.append("file", medicalFile)
    formData.append("alumno_id", alumno.id)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deep-agents/justify-absence`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setMedicalResult(data)
      } else {
        alert(data.detail)
      }
    } catch (err) {
      alert("Error subiendo el documento")
    } finally {
      setLoadingMedical(false)
    }
  }

  const handleRatificar = async (respuesta) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/padre/ratificar_vacante`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ continuidad: respuesta })
      })
      const data = await res.json()
      if (res.ok) {
        setShowPoll(false)
        setAlumno({...alumno, estado_continuidad: respuesta === 'SI' ? 'RATIFICADO' : 'NO_CONTINUARA'})
        alert(data.message)
      } else {
        alert(data.detail)
      }
    } catch (e) {
      alert("Error enviando respuesta de ratificación")
    }
  }

  if (!alumno) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white">Cargando datos del alumno...</div>

  const TabButton = ({ id, label, icon }) => (
    <button 
      onClick={() => { setActiveTab(id); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === id ? 'bg-yellow-600/20 text-yellow-500 border border-yellow-600/30 shadow-yellow-900/40' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-white/5'}`}
    >
      <div className={`p-2 rounded-lg ${activeTab === id ? 'bg-yellow-600/20 text-yellow-500' : 'bg-white/5 text-slate-400'}`}>
        {icon}
      </div>
      <span className="text-sm text-left">{label}</span>
    </button>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-hidden flex relative">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      {/* Sidebar */}
      <aside className="w-[320px] flex-shrink-0 bg-slate-900 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-[8px_0_32px_rgba(0,0,0,0.5)] z-20 relative">
        <div className="p-6 border-b border-white/10 flex items-center gap-4 bg-slate-950">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-tight">José María<br/>Arguedas</h1>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mb-3 mt-2">Menú</p>
          <TabButton id="rendimiento" label="Reporte Académico" icon={<BarChart className="w-4 h-4" />} />
          <TabButton id="asistencia" label="Asistencia" icon={<Calendar className="w-4 h-4" />} />
          <TabButton id="tutor_ia" label="Apoyo Académico" icon={<Bot className="w-4 h-4" />} />
          {!isPrimaria && <TabButton id="vocacional" label="Proyección Vocacional" icon={<GraduationCap className="w-4 h-4" />} />}
          <TabButton id="certificados" label="Mis Certificados" icon={<FileText className="w-4 h-4" />} />
          <TabButton id="psicologia" label="Seguimiento" icon={<Brain className="w-4 h-4" />} />
        </nav>
        
        <div className="p-4 border-t border-white/10 bg-slate-950">
          <button onClick={logout} className="w-full py-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all font-medium flex items-center justify-center">
            <LogOut className="w-4 h-4 mr-2 inline" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col relative z-10 w-full">
        {/* Header */}
        <header className="p-6 border-b border-white/10 bg-slate-900 backdrop-blur-md flex justify-between items-center shadow-sm">
          <div>
             <p className="text-sm text-yellow-600 font-medium tracking-wide uppercase">I.E.P. José María Arguedas</p>
             <h2 className="text-2xl font-bold mt-1 capitalize text-white">
                {activeTab.replace('_', ' ')}
             </h2>
          </div>
          <div className="flex gap-3">
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar w-full">
          <div className="max-w-[1600px] mx-auto w-full">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 backdrop-blur-md mb-8 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-yellow-600/20 border border-yellow-600/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(202,138,4,0.15)]">
                  <span className="text-3xl font-bold text-yellow-500">{alumno.nombres.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold">{alumno.nombres}</h2>
                  <p className="text-yellow-500 text-lg">{alumno.grado}° {alumno.nivel} - Sección "{alumno.seccion}"</p>
                </div>
              </div>
              <div className="text-right bg-slate-950 p-4 rounded-xl border border-white/10">
                <p className="text-sm text-slate-400 mb-1">Tutor Oficial de Aula</p>
                <p className="font-bold text-lg text-yellow-500 flex items-center justify-end gap-2"><User className="w-4 h-4" /> Prof. {alumno.tutor}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {activeTab === 'rendimiento' && (
                  <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-xl">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">Reporte Académico Oficial</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 text-sm bg-slate-950">
                            <th className="py-3 px-4 rounded-tl-lg">Curso</th>
                            {isPrimaria ? (
                              <><th className="py-3 px-4">Fichas</th><th className="py-3 px-4">Trabajos</th><th className="py-3 px-4">Lectura</th><th className="py-3 px-4 text-yellow-500">Particip.</th></>
                            ) : (
                              <><th className="py-3 px-4">Tareas</th><th className="py-3 px-4">Particip.</th><th className="py-3 px-4">Prácticas</th><th className="py-3 px-4 text-yellow-500">Examen</th></>
                            )}
                            <th className="py-3 px-4 rounded-tr-lg font-bold">Nota Final</th>
                          </tr>
                        </thead>
                        <tbody>
                          {libreta.map((nota, i) => {
                            const c = nota.criterios
                            let finalStr = '-'
                            let isRojo = false
                            
                            if (isPrimaria) {
                              finalStr = c.participacion || c.fichas || '-'
                              isRojo = finalStr === 'C'
                            } else {
                              const finalNum = ((parseFloat(c.tareas)||0)*0.2) + ((parseFloat(c.participacion)||0)*0.1) + ((parseFloat(c.practicas)||0)*0.3) + ((parseFloat(c.examen)||0)*0.4)
                              if (!isNaN(finalNum) && Object.keys(c).length > 0) {
                                finalStr = finalNum.toFixed(1)
                                isRojo = finalNum < 11
                              }
                            }

                            return (
                              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-4 px-4 font-bold text-slate-200">{nota.curso}</td>
                                {isPrimaria ? (
                                  <><td className="py-4 px-4 font-bold text-slate-300">{c.fichas||'-'}</td><td className="py-4 px-4 font-bold text-slate-300">{c.trabajos||'-'}</td><td className="py-4 px-4 font-bold text-slate-300">{c.lectura||'-'}</td><td className="py-4 px-4 font-bold text-slate-300">{c.participacion||'-'}</td></>
                                ) : (
                                  <><td className="py-4 px-4 font-mono">{c.tareas||'-'}</td><td className="py-4 px-4 font-mono">{c.participacion||'-'}</td><td className="py-4 px-4 font-mono">{c.practicas||'-'}</td><td className="py-4 px-4 font-bold font-mono text-yellow-500">{c.examen||'-'}</td></>
                                )}
                                <td className="py-4 px-4 font-bold text-lg font-mono">
                                  <span className={`px-2 py-1 rounded-md ${isRojo ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-yellow-600/20 text-yellow-500 border border-yellow-600/30'}`}>
                                    {finalStr}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'asistencia' && (
                  <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-xl">
                     <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2 text-white">Historial de Asistencias</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm">Inasistencia:</span>
                        <span className={`px-4 py-1 rounded-full font-bold ${pctAsistencia > 30 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-yellow-600/20 text-yellow-500 border border-yellow-600/30'}`}>
                          {pctAsistencia.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {asistencias.map((asis, i) => (
                        <div key={i} className="bg-slate-950 p-3 rounded-xl border border-white/5 text-center">
                          <p className="text-xs text-slate-400 mb-1">{asis.fecha}</p>
                          <p className={`font-bold ${asis.estado === 'Presente' ? 'text-yellow-500' : asis.estado === 'Tardanza' ? 'text-orange-400' : 'text-red-400'}`}>{asis.estado}</p>
                        </div>
                      ))}
                    </div>

                    {/* Justificación Médica */}
                    <div className="mt-8 bg-slate-950 border border-yellow-600/30 p-6 rounded-2xl">
                      <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><FileText className="w-5 h-5 text-yellow-500" /> Validación de Justificaciones</h3>
                      <p className="text-slate-400 mb-4 text-sm">Sube una foto clara de la receta médica, boleta de consulta o certificado de salud. Nuestro sistema procesará el documento y enviará la justificación automáticamente.</p>
                      
                      <form onSubmit={handleUploadMedical} className="flex gap-4 items-end">
                        <div className="flex-1">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => setMedicalFile(e.target.files[0])}
                            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-yellow-600 file:text-white hover:file:bg-yellow-500 transition-all bg-slate-900 border border-white/10 rounded-xl"
                          />
                        </div>
                        <button 
                          type="submit"
                          disabled={loadingMedical || !medicalFile}
                          className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all h-[42px]"
                        >
                          {loadingMedical ? 'Analizando Documento...' : 'Validar y Justificar'}
                        </button>
                      </form>

                      {medicalResult && (
                        <div className={`mt-4 p-4 rounded-xl border ${medicalResult.valido ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'}`}>
                          <h4 className={`font-bold flex items-center gap-2 ${medicalResult.valido ? 'text-green-400' : 'text-red-400'}`}>
                            {medicalResult.valido ? <><CheckCircle2 className="w-4 h-4" /> Documento Válido Aceptado</> : <><XCircle className="w-4 h-4" /> Documento No Reconocido</>}
                          </h4>
                          <p className="text-sm text-slate-300 mt-2"><strong>Días de reposo concedidos:</strong> {medicalResult.dias_reposo} días</p>
                          <p className="text-sm text-slate-400 mt-1"><strong>Diagnóstico / Motivo:</strong> {medicalResult.resumen}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'tutor_ia' && (
                  <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-xl animate-fade-in-up space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="p-3 bg-yellow-600/20 text-yellow-500 rounded-xl"><Bot className="w-6 h-6" /></span>
                      <h2 className="text-2xl font-bold text-white">Apoyo Académico</h2>
                    </div>
                    <p className="text-slate-400 mb-6">Esta es una herramienta diseñada para apoderados. Úsala para guiar a {alumno.nombres} en sus tareas en casa, recibiendo sugerencias metodológicas paso a paso.</p>
                    
                    <div className="flex gap-4 mb-6">
                      <input 
                        type="text" 
                        value={tutorQuery} 
                        onChange={e => setTutorQuery(e.target.value)}
                        placeholder={`Ej: Mi hijo ${alumno.nombres} no entiende las fracciones, ¿cómo se las explico?`}
                        className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-600/50"
                      />
                      <button 
                        onClick={handleTutorQuery}
                        disabled={loadingTutor}
                        className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                      >
                        {loadingTutor ? 'Analizando...' : 'Consultar'}
                      </button>
                    </div>
                    
                    {tutorResponse && (
                      <div className="bg-slate-950 p-6 rounded-2xl border border-white/10">
                        <h3 className="font-bold text-yellow-500 mb-3 flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Respuesta:</h3>
                        <p className="text-slate-300">{tutorResponse}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'psicologia' && (
                  <div className="space-y-6">
                    {citasPendientes.map((cita, i) => (
                      <div key={`cita-${i}`} className="w-full bg-slate-950 text-white rounded-2xl overflow-hidden border border-red-500/50 p-6">
                        <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> CITA PENDIENTE</h3>
                        <p>Día: {cita.dia} a las {cita.hora}</p>
                        <p className="text-slate-400">Motivo: {cita.motivo}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

                {activeTab === 'certificados' && (
                  <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-xl animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="p-3 bg-yellow-600/20 text-yellow-500 rounded-xl">
                        <FileText className="w-6 h-6" />
                      </span>
                      <h2 className="text-2xl font-bold text-white">Mis Certificados</h2>
                    </div>
                    
                    {certificados.length === 0 ? (
                      <p className="text-slate-400 italic">No hay certificados disponibles.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {certificados.map((cert) => (
                          <div key={cert.id} className="bg-slate-950 p-6 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-yellow-600/50 transition-all shadow-md">
                            <div>
                              <div className="flex justify-between items-center mb-4">
                                <span className="px-3 py-1 bg-yellow-600/20 text-yellow-500 rounded-full text-xs font-bold border border-yellow-600/30">
                                  {cert.anio_escolar}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {new Date(cert.fecha_emision).toLocaleDateString()}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-white mb-2">
                                {cert.tipo === 'MERITO' ? 'Certificado de Mérito' : cert.tipo === 'CONCLUSION_PRIMARIA' ? 'Conclusión de Primaria' : 'Conclusión de Secundaria'}
                              </h3>
                              {cert.puesto && (
                                <p className="text-sm text-slate-400 mb-4">
                                  Puesto: <strong className="text-yellow-500">{cert.puesto}</strong>
                                </p>
                              )}
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/padre/certificados/${cert.id}/descargar`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  if (!res.ok) throw new Error("Error al descargar");
                                  const blob = await res.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a'); a.href = url; a.download = `Certificado-${cert.tipo}-${cert.anio_escolar}.pdf`; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
                                } catch (e) {
                                  alert("Hubo un error al descargar el certificado.");
                                }
                              }}
                              className="mt-4 w-full py-2 bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-500 border border-yellow-600/30 rounded-xl font-medium transition-all"
                            >
                              Descargar PDF
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              <div className="space-y-8">
                <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-xl">
                  <h3 className="text-xl font-semibold mb-6 text-yellow-500">Observaciones del Tutor</h3>
                  <div className="space-y-4">
                    {observaciones.length > 0 ? (
                      observaciones.map((obs, i) => (
                        <div key={`obs-${i}`} className="bg-slate-950 p-4 rounded-xl border border-white/10">
                          <p className="text-sm text-slate-300">{obs.texto || obs.observacion || (typeof obs === 'string' ? obs : "Observación registrada")}</p>
                          {obs.fecha && <p className="text-xs text-slate-500 mt-2">{obs.fecha}</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic">No hay observaciones registradas.</p>
                    )}
                  </div>

                </div>

                {alertas.length === 0 && citasPendientes.length === 0 && (
                  <button className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] flex justify-center items-center gap-2 opacity-50 cursor-not-allowed">
                    <span>Sin Citas Obligatorias Pendientes</span>
                  </button>
                )}
                {activeTab === 'vocacional' && !isPrimaria && (
                  <div className="bg-slate-900 border border-yellow-600/30 rounded-3xl p-8 backdrop-blur-md shadow-xl animate-fade-in-up space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="p-3 bg-yellow-600/20 text-yellow-500 rounded-xl"><GraduationCap className="w-6 h-6" /></span>
                      <h2 className="text-2xl font-bold text-white">Proyección Vocacional</h2>
                    </div>
                    <p className="text-slate-400 mb-6">Nuestro sistema analizará el **historial real de notas** del estudiante a lo largo de los años y sugerirá áreas profesionales acordes a sus fortalezas académicas.</p>
                    
                    <div className="flex gap-4 mb-6">
                      <input 
                        type="text" 
                        value={vocationalQuery} 
                        onChange={e => setVocationalQuery(e.target.value)}
                        placeholder={`Ej: ${alumno.nombres} me ha dicho que quiere estudiar Ingeniería de Sistemas, ¿qué áreas debe reforzar?`}
                        className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-600/50"
                      />
                      <button 
                        onClick={handleVocationalQuery}
                        disabled={loadingVocational}
                        className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                      >
                        {loadingVocational ? 'Consultando historial...' : 'Analizar Perfil'}
                      </button>
                    </div>
                    
                    {vocationalResponse && (
                      <div className="bg-slate-950 p-6 rounded-2xl border border-white/10 shadow-inner">
                        <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {vocationalResponse}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Ratificación de Vacante */}
      {showPoll && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-yellow-500/30 rounded-2xl p-8 max-w-lg w-full text-center shadow-[0_0_50px_rgba(202,138,4,0.1)]">
            <div className="w-20 h-20 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Ratificación de Vacante</h2>
            <p className="text-slate-300 mb-8 text-lg">
              Estimado padre de familia, el año escolar ha concluido. Para garantizar la reserva del cupo para 
              el próximo año, necesitamos que confirme si su menor hijo(a) <strong className="text-white">{alumno.nombres}</strong> continuará 
              sus estudios en la I.E.P. José María Arguedas.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => handleRatificar('SI')}
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl flex items-center gap-2 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5" /> Sí, mantendrá su vacante
              </button>
              <button 
                onClick={() => handleRatificar('NO')}
                className="px-6 py-3 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl flex items-center gap-2 transition-colors"
              >
                <XCircle className="w-5 h-5" /> No continuará
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-6">
              * Nota: De no responder, el sistema asumirá que cede la vacante y entrará al proceso de purga.
            </p>
          </div>
        </div>
      )}

      {/* ChatWidget Integrado para Padres */}
      <ChatWidget sessionType="padre" />
    </div>
  )
}

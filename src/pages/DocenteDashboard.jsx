import { useState, useEffect } from 'react'
import { Calendar, UserCheck, FileSpreadsheet, BookOpen, Users, FileEdit, Sparkles, ScanText, Feather, LogOut } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'
import ChatWidget from '../components/ChatWidget'

export default function DocenteDashboard() {
  const { token, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('asistencia') // asistencia, notas, tutoria, planificador, corrector
  const [cursos, setCursos] = useState([])
  const [tutorias, setTutorias] = useState([])
  const [cursoActivo, setCursoActivo] = useState(null)
  
  // Jerarquía para Secundaria
  const [selectedGrado, setSelectedGrado] = useState('')
  const [selectedSeccion, setSelectedSeccion] = useState('')
  
  const [alumnos, setAlumnos] = useState([])
  
  // Asistencia state
  const [asistencia, setAsistencia] = useState({})
  
  // Notas state
  const [notas, setNotas] = useState({})
  
  // Tutoria Riesgo state
  const [alumnosRiesgo, setAlumnosRiesgo] = useState([])
  
  const [modalObs, setModalObs] = useState({ open: false, alumno_id: null, alumno_nombre: '' })
  const [obsTexto, setObsTexto] = useState('')
  const [miHorario, setMiHorario] = useState([])

  // Generador de Exámenes
  const [examTopic, setExamTopic] = useState('')
  const [examDifficulty, setExamDifficulty] = useState('Intermedio')
  const [examQuestions, setExamQuestions] = useState(5)
  const [examGenerated, setExamGenerated] = useState('')
  const [loadingExam, setLoadingExam] = useState(false)

  // Cuentos Mágicos (Primaria)
  const [storyValue, setStoryValue] = useState('')
  const [storyGenerated, setStoryGenerated] = useState('')
  const [loadingStory, setLoadingStory] = useState(false)

  // Planificador Mágico state
  const [planForm, setPlanForm] = useState({ grade: '', subject: '', topic: '' })
  const [planResult, setPlanResult] = useState(null)
  const [isPlanning, setIsPlanning] = useState(false)

  // Corrector OCR state
  const [ocrFile, setOcrFile] = useState(null)
  const [ocrRubric, setOcrRubric] = useState('')
  const [ocrResult, setOcrResult] = useState(null)
  const [isGrading, setIsGrading] = useState(false)

  // Sílabo state
  const [silabo, setSilabo] = useState(null)
  const [silaboLoading, setSilaboLoading] = useState(false)
  const [silaboEditando, setSilaboEditando] = useState(false)
  const [silaboForm, setSilaboForm] = useState({})
  const [silaboGuardando, setSilaboGuardando] = useState(false)
  const [silaboCursoSel, setSilaboCursoSel] = useState(null)
  const [silaboGenerando, setSilaboGenerando] = useState(false)
  const [silaboGenFase, setSilaboGenFase] = useState('')

  // Fetch initial data
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/docente/cursos`, { headers: { Authorization: `Bearer ${token}` }})
      .then(res => res.json()).then(data => { 
        setCursos(data)
        if (data.length > 0) {
          if (data[0].nivel === 'PRIMARIA') {
            setCursoActivo(data[0])
          } else {
            const uniqueGrados = [...new Set(data.map(c => c.grado))]
            setSelectedGrado(uniqueGrados[0])
            const secciones = [...new Set(data.filter(c => c.grado == uniqueGrados[0]).map(c => c.seccion))]
            setSelectedSeccion(secciones[0])
            setCursoActivo(data.find(c => c.grado == uniqueGrados[0] && c.seccion == secciones[0]))
          }
        }
      })
      
    fetch(`${import.meta.env.VITE_API_URL}/api/docente/tutorias`, { headers: { Authorization: `Bearer ${token}` }})
      .then(res => res.json()).then(data => {
        setTutorias(data)
        if (data.length > 0) {
          fetch(`${import.meta.env.VITE_API_URL}/api/tutor/alumnos_riesgo`, { headers: { Authorization: `Bearer ${token}` }})
            .then(r => r.json()).then(setAlumnosRiesgo)
        }
      })

    fetch(`${import.meta.env.VITE_API_URL}/api/docente/mi_horario`, { headers: { Authorization: `Bearer ${token}` }})
      .then(res => res.json()).then(setMiHorario)
  }, [token])

  // Fetch alumnos when curso changes
  useEffect(() => {
    if (cursoActivo && activeTab !== 'tutoria' && activeTab !== 'horario' && activeTab !== 'planificador' && activeTab !== 'corrector' && activeTab !== 'generador_examen' && activeTab !== 'silabo') {
      fetch(`${import.meta.env.VITE_API_URL}/api/docente/alumnos?curso_id=${cursoActivo.id}`, { headers: { Authorization: `Bearer ${token}` }})
        .then(res => res.json()).then(data => {
          setAlumnos(data)
          // Initialize state
          const asis = {}
          const nts = {}
          data.forEach(al => {
            asis[al.id] = 'Presente'
            nts[al.id] = { c1: '', c2: '', c3: '', c4: '' }
          })
          setAsistencia(asis)
          setNotas(nts)
        })
    }
  }, [cursoActivo, activeTab, token])

  const handleAsistenciaSubmit = async () => {
    const payload = {
      asistencias: alumnos.map(al => ({
        alumno_id: al.id,
        fecha: new Date().toISOString().split('T')[0],
        estado: asistencia[al.id]
      }))
    }
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/docente/asistencia/batch`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload)
    })
    if (res.ok) alert("Asistencia guardada masivamente.")
  }

  const handleNotasSubmit = async () => {
    const criteriosPri = ["Competencia 1", "Competencia 2", "Competencia 3", "Competencia 4"]
    const criteriosSec = ["Evidencia 1", "Evidencia 2", "Práctica Calificada", "Examen Bimestral"]
    const crits = cursoActivo.nivel === 'PRIMARIA' ? criteriosPri : criteriosSec
    
    const notasList = []
    alumnos.forEach(al => {
      ['c1','c2','c3','c4'].forEach((k, idx) => {
        if (notas[al.id][k]) {
          notasList.push({
            alumno_id: al.id,
            curso_id: cursoActivo.id,
            criterio: crits[idx],
            semana: "Actual",
            valor_numerico: cursoActivo.nivel === 'SECUNDARIA' ? parseFloat(notas[al.id][k]) : null,
            valor_letra: cursoActivo.nivel === 'PRIMARIA' ? notas[al.id][k] : null
          })
        }
      })
    })

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/docente/notas/batch`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ notas: notasList })
    })
    if (res.ok) alert("Calificaciones procesadas y enviadas al historial.")
  }

  // Tutoria Logic
  const [citasDisp, setCitasDisp] = useState([])
  const [citaForm, setCitaForm] = useState({ alumno_id: '', dia: '', hora: '' })
  const [alertasTutor, setAlertasTutor] = useState([])
  
  useEffect(() => {
    if (activeTab === 'tutoria') {
      fetch(`${import.meta.env.VITE_API_URL}/api/tutor/horarios_disponibles`, { headers: { Authorization: `Bearer ${token}` }})
        .then(res => res.json()).then(setCitasDisp)
        
      fetch(`${import.meta.env.VITE_API_URL}/api/admin/state`, { headers: { Authorization: `Bearer ${token}` }})
        .then(res => res.json()).then(state => setAlertasTutor(state.alertas_ia || []))
    }
  }, [activeTab, token])
  
  const handleAgendarCita = async (e) => {
    e.preventDefault()
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tutor/citas`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(citaForm)
    })
    if (res.ok) {
      alert("Cita tripartita agendada exitosamente.")
      setCitaForm({ alumno_id: '', dia: '', hora: '' })
      fetch(`${import.meta.env.VITE_API_URL}/api/tutor/horarios_disponibles`, { headers: { Authorization: `Bearer ${token}` }})
        .then(res => res.json()).then(setCitasDisp)
    } else {
      const data = await res.json()
      alert(data.detail)
    }
  }

  const handleAgregarObservacion = async () => {
    if (!obsTexto.trim()) return alert("Debe escribir una observación.")
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/docente/observacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ alumno_id: modalObs.alumno_id, texto: obsTexto })
      })
      const data = await res.json()
      alert(data.message)
      setModalObs({ open: false, alumno_id: null, alumno_nombre: '' })
      setObsTexto('')
    } catch (err) { console.error(err) }
  }

  const handleGenerateExam = async () => {
    if (!examTopic.trim()) return alert('Debes ingresar un tema')
    setLoadingExam(true)
    setExamGenerated('')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deep-agents/generate-exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tema: examTopic, dificultad: examDifficulty, num_preguntas: Number(examQuestions) })
      })
      const data = await res.json()
      if (res.ok) {
        setExamGenerated(data.exam_content)
      } else {
        alert(data.detail || 'Error generando examen')
      }
    } catch (e) {
      alert('Error de red')
    } finally {
      setLoadingExam(false)
    }
  }

  const handleGenerateStory = async () => {
    if (!cursoActivo) return alert('Selecciona un curso primero')
    if (!storyValue.trim()) return alert('Debes ingresar un valor o tema moral')
    setLoadingStory(true)
    setStoryGenerated('')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deep-agents/generate-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ curso_id: cursoActivo.id, valor_moral: storyValue })
      })
      const data = await res.json()
      if (res.ok) {
        setStoryGenerated(data.story_content)
      } else {
        alert(data.detail || 'Error generando el cuento')
      }
    } catch (e) {
      alert('Error de red')
    } finally {
      setLoadingStory(false)
    }
  }

  // === LOGICA SILABO ===
  const cargarSilabo = async (curso) => {
    if (!curso) return
    setSilaboLoading(true)
    setSilabo(null)
    setSilaboEditando(false)
    try {
      const params = new URLSearchParams({ nivel: curso.nivel, grado: curso.grado, curso_nombre: curso.nombre })
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/silabos/por-curso?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSilabo(data)
        setSilaboForm({
          competencias: data.competencias || '',
          capacidades: data.capacidades || '',
          desempennos: data.desempennos || '',
          enfoques: data.enfoques || '',
          bimestre_1: data.bimestre_1 || '',
          bimestre_2: data.bimestre_2 || '',
          bimestre_3: data.bimestre_3 || '',
          bimestre_4: data.bimestre_4 || '',
          sistema_evaluacion: data.sistema_evaluacion || '',
          materiales: data.materiales || '',
        })
      } else {
        alert('No se pudo cargar el sílabo')
      }
    } catch (e) { console.error(e) } finally { setSilaboLoading(false) }
  }



  const handleGeneratePlan = async (e) => {
    e.preventDefault()
    setIsPlanning(true)
    setPlanResult(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deep-agents/teacher-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(planForm)
      })
      if (!res.ok) throw new Error("Error en el servidor")
      const data = await res.json()
      setPlanResult(data)
    } catch (err) {
      alert("Hubo un error al generar la clase.")
    } finally {
      setIsPlanning(false)
    }
  }

  const handleGradeExam = async (e) => {
    e.preventDefault()
    if (!ocrFile) return alert("Por favor, sube una foto o PDF del examen.")
    setIsGrading(true)
    setOcrResult(null)
    
    const formData = new FormData()
    formData.append("rubric", ocrRubric)
    formData.append("file", ocrFile)
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deep-agents/grade-exam`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Error en el servidor")
      setOcrResult(data)
    } catch (err) {
      alert("Error en el corrector: " + err.message)
    } finally {
      setIsGrading(false)
    }
  }

  const isPrimaria = cursos.length > 0 && cursos[0].nivel === 'PRIMARIA'

  const TabButton = ({ id, label, icon, onClickExtra }) => (
    <button 
      onClick={() => { setActiveTab(id); if (onClickExtra) onClickExtra(); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === id ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-white/5'}`}
    >
      <div className={`p-2 rounded-lg ${activeTab === id ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-slate-400'}`}>
        {icon}
      </div>
      <span className="text-sm text-left">{label}</span>
    </button>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-hidden flex relative">
      
      {/* Sidebar */}
      <aside className="w-[320px] flex-shrink-0 bg-slate-900 border-r border-white/10 flex flex-col z-20 relative shadow-xl">
        <div className="p-6 border-b border-white/10 flex items-center gap-4 bg-slate-950/50">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-tight">José María<br/>Arguedas</h1>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mb-3 mt-2">Menú</p>
          <TabButton id="horario" label="Mi Horario" icon={<Calendar className="w-4 h-4" />} />
          <TabButton id="asistencia" label="Tomar Asistencia" icon={<UserCheck className="w-4 h-4" />} />
          <TabButton id="notas" label="Registro de Evaluaciones" icon={<FileSpreadsheet className="w-4 h-4" />} />
          <TabButton id="silabo" label="Sílabo Curricular" icon={<BookOpen className="w-4 h-4" />} onClickExtra={() => {
            const cursoParaSilabo = silaboCursoSel || cursoActivo || (cursos.length > 0 ? cursos[0] : null);
            setSilaboCursoSel(cursoParaSilabo);
            cargarSilabo(cursoParaSilabo);
          }} />
          {tutorias.length > 0 && (
            <TabButton id="tutoria" label="Tutoría y Alertas" icon={<Users className="w-4 h-4" />} />
          )}
          <TabButton id="generador_examen" label="Generador de Exámenes" icon={<FileEdit className="w-4 h-4" />} />
          <TabButton id="planificador" label="Planificador de Sesiones" icon={<Sparkles className="w-4 h-4" />} />
          <TabButton id="corrector" label="Evaluación Automática" icon={<ScanText className="w-4 h-4" />} />
          {isPrimaria && <TabButton id="cuentos" label="Generador de Cuentos" icon={<Feather className="w-4 h-4" />} />}
        </nav>
        
        <div className="p-4 border-t border-white/10 bg-slate-950/50">
          <button onClick={logout} className="w-full py-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all font-medium flex items-center justify-center">
            <LogOut className="w-4 h-4 mr-2 inline" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col relative z-10 w-full">
        {/* Header */}
        <header className="p-6 border-b border-white/10 bg-slate-900 flex justify-between items-center shadow-sm">
          <div>
             <p className="text-sm text-yellow-500 font-medium tracking-wide uppercase">I.E.P. José María Arguedas</p>
             <h2 className="text-2xl font-bold mt-1 capitalize text-white">
                {activeTab.replace('_', ' ')}
             </h2>
          </div>
          <div className="flex gap-3">
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar w-full relative">
          {modalObs && modalObs.open && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full relative">
                <h3 className="text-xl font-bold text-teal-400 mb-4">Agregar Observación</h3>
                <p className="text-sm text-slate-400 mb-4">La observación será visible inmediatamente en el Portal de Familia del alumno {modalObs.alumno_nombre}.</p>
                <textarea 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white h-32 mb-4 focus:outline-none focus:border-yellow-500"
                  placeholder="Escribe la actualización o aviso para el apoderado..."
                  value={obsTexto}
                  onChange={e => setObsTexto(e.target.value)}
                ></textarea>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setModalObs({ open: false, alumno_id: null, alumno_nombre: '' })} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">Cancelar</button>
                  <button onClick={handleAgregarObservacion} className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 font-bold text-slate-900 shadow-sm">Enviar a Portal</button>
                </div>
              </div>
            </div>
          )}
          
          <div className="max-w-[1600px] mx-auto w-full">
            {!isPrimaria && activeTab !== 'tutoria' && activeTab !== 'horario' && activeTab !== 'planificador' && activeTab !== 'corrector' && activeTab !== 'generador_examen' && activeTab !== 'silabo' && cursos.length > 0 && (
          <div className="mb-6 flex gap-4 p-4 bg-slate-900 border border-white/10 rounded-2xl items-end shadow-lg animate-fade-in-up">
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-1">Grado</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm outline-none text-white focus:border-blue-500"
                value={selectedGrado}
                onChange={e => {
                  const g = e.target.value
                  setSelectedGrado(g)
                  const sec = [...new Set(cursos.filter(c => c.grado == g).map(c => c.seccion))]
                  setSelectedSeccion(sec[0])
                  setCursoActivo(cursos.find(c => c.grado == g && c.seccion == sec[0]))
                }}
              >
                {[...new Set(cursos.map(c => c.grado))].map(g => <option key={g} value={g}>{g}° Secundaria</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-1">Sección</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm outline-none text-white focus:border-blue-500"
                value={selectedSeccion}
                onChange={e => {
                  const s = e.target.value
                  setSelectedSeccion(s)
                  setCursoActivo(cursos.find(c => c.grado == selectedGrado && c.seccion == s))
                }}
              >
                {[...new Set(cursos.filter(c => c.grado == selectedGrado).map(c => c.seccion))].map(s => <option key={s} value={s}>"{s}"</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-1">Curso</label>
              <select 
                className="w-full bg-slate-950 border border-yellow-500/50 rounded-lg p-2 text-sm outline-none text-yellow-500 focus:border-yellow-400 font-bold"
                value={cursoActivo?.id}
                onChange={e => setCursoActivo(cursos.find(c => c.id == e.target.value))}
              >
                {cursos.filter(c => c.grado == selectedGrado && c.seccion == selectedSeccion).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>
        )}
            {/* ============================= SÍLABO CURRICULAR ============================= */}
        {activeTab === 'silabo' && (
          <div className="animate-fade-in-up space-y-6">
            {/* Header + selector de curso */}
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-yellow-500/20 text-yellow-500 rounded-2xl text-3xl"></div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Sílabo Curricular</h2>
                    <p className="text-slate-400 text-sm mt-1">Currículo Nacional 2019 &bull; Año Escolar {silabo?.anno_escolar || '2025'}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-sm border border-slate-700">Modo Lectura (Emitido por Dirección)</span>
                </div>
              </div>

              {/* Selector de curso para cargar sílabo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/20 rounded-2xl border border-white/10">
                <div>
                  <label className="block text-xs font-semibold text-emerald-300 mb-2 uppercase tracking-widest">Curso</label>
                  <select
                    className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl p-3 text-white text-sm outline-none focus:border-emerald-400"
                    value={silaboCursoSel?.id || ''}
                    onChange={e => {
                      const c = cursos.find(x => x.id == e.target.value)
                      setSilaboCursoSel(c)
                      cargarSilabo(c)
                    }}
                  >
                    {cursos.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} — {c.grado}° {c.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'} Secc. {c.seccion}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  {silabo && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
                      silabo.nivel === 'PRIMARIA'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    }`}>
                      <span>{silabo.nivel === 'PRIMARIA' ? '' : ''}</span>
                      {silabo.nivel === 'PRIMARIA' ? 'Educación Primaria' : 'Educación Secundaria'}
                      &bull; {silabo.grado}° Grado
                      &bull; Escala: {silabo.nivel === 'PRIMARIA' ? 'AD / A / B / C' : '00 – 20'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {silaboLoading && (
              <div className="flex justify-center items-center py-16">
                <div className="w-10 h-10 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                <span className="ml-4 text-yellow-500">Cargando sílabo...</span>
              </div>
            )}

            {silabo && !silaboLoading && (
              <>
                {/* 14 Secciones MINEDU */}
                <div className="grid grid-cols-1 gap-6">
                  {[
                    { key: 'datos_informativos', label: '1. Datos Informativos', color: 'emerald' },
                    { key: 'fundamentacion', label: '2. Fundamentación', color: 'teal' },
                    { key: 'proposito', label: '3. Propósito de Aprendizaje', color: 'cyan' },
                    { key: 'competencias', label: '4. Competencias', color: 'sky' },
                    { key: 'capacidades', label: '5. Capacidades', color: 'blue' },
                    { key: 'estandares', label: '6. Estándares de Aprendizaje', color: 'indigo' },
                    { key: 'desempennos', label: '7. Desempeños', color: 'violet' },
                    { key: 'enfoques', label: '8. Enfoques Transversales', color: 'fuchsia' },
                    { key: 'organizacion_unidades', label: '9. Organización Anual de Unidades', color: 'pink' },
                    { key: 'contenidos', label: '10. Contenidos', color: 'rose' },
                    { key: 'metodologia', label: '11. Metodología', color: 'orange' },
                    { key: 'sistema_evaluacion', label: '12. Evaluación', color: 'amber' },
                    { key: 'materiales', label: '13. Recursos y Materiales', color: 'yellow' },
                    { key: 'bibliografia', label: '14. Bibliografía', color: 'lime' },
                  ].map(({ key, label, color }) => (
                    <div key={key} className="bg-slate-950 border border-white/10 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-yellow-500 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
                        {label}
                      </h3>
                      <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                        {silabo[key] || <span className="text-slate-500 italic">No especificado</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer de metadata */}
                <div className="text-xs text-slate-500 text-right pr-2">
                  {silabo.updated_at
                    ? `Última actualización: ${silabo.updated_at}`
                    : `Creado: ${silabo.created_at}`
                  } &bull; ID: #{silabo.id}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'horario' && (
          <div className="animate-fade-in-up bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-lg mb-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">Mi Horario Semanal</h2>
            {miHorario.length > 0 ? (
              <div className="overflow-x-auto mt-6 custom-scrollbar bg-slate-950 rounded-xl border border-white/10">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-amber-900/20 text-amber-300 text-xs uppercase tracking-wider">
                      <th className="p-3 border-b border-r border-white/10 font-bold text-center w-24">Hora</th>
                      {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(dia => (
                        <th key={dia} className="p-3 border-b border-white/10 font-bold text-center w-1/5">{dia}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {[
                      { inicio: "08:00", fin: "08:45" },
                      { inicio: "08:45", fin: "09:30" },
                      { inicio: "09:30", fin: "10:15" },
                      { isRecreo: true, label: "RECREO", time: "10:15 - 10:45" },
                      { inicio: "10:45", fin: "11:30" },
                      { inicio: "11:30", fin: "12:15" },
                      { inicio: "12:15", fin: "13:00" },
                      { isRecreo: true, label: "RECREO", time: "13:00 - 13:15" },
                      { inicio: "13:15", fin: "14:00" },
                    ].map((bloque, idx) => {
                      if (bloque.isRecreo) {
                        return (
                          <tr key={`recreo-${idx}`} className="bg-white/5 border-b border-white/10">
                            <td className="p-2 border-r border-white/10 text-center text-slate-500 font-mono text-[10px]">{bloque.time}</td>
                            <td colSpan="5" className="p-2 text-center text-amber-500/50 font-bold tracking-[0.5em]">{bloque.label}</td>
                          </tr>
                        )
                      }
                      return (
                        <tr key={bloque.inicio} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-2 border-r border-white/10 text-center text-slate-400 font-mono text-[10px]">
                            {bloque.inicio}<br/>|<br/>{bloque.fin}
                          </td>
                          {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(dia => {
                            const clase = miHorario.find(h => h.dia === dia && h.hora_inicio === bloque.inicio)
                            return (
                              <td key={`${dia}-${bloque.inicio}`} className="p-2 border-r border-white/5 last:border-0 align-top">
                                {clase ? (
                                  <div className="h-full bg-blue-900/20 border border-blue-500/20 rounded p-2 flex flex-col justify-between hover:border-blue-400/50 transition-colors">
                                    <span className="font-bold text-white leading-tight mb-1">{clase.curso}</span>
                                    <span className="text-[10px] text-amber-300 truncate">Aula: {clase.aula}</span>
                                  </div>
                                ) : (
                                  <div className="h-full min-h-[48px] rounded border border-dashed border-white/10 flex items-center justify-center">
                                    <span className="text-[10px] text-slate-600">Libre</span>
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 italic">No tienes bloques de horario asignados aún.</p>
            )}
          </div>
        )}

        {activeTab === 'asistencia' && cursoActivo && (
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 animate-fade-in-up shadow-lg">
            <h2 className="text-xl font-semibold mb-6 flex items-center justify-between">
              Lista de Asistencia - {isPrimaria ? `Aula ${cursoActivo.grado}° Primaria "${cursoActivo.seccion}"` : cursoActivo.nombre}
              <span className="text-sm bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full">{alumnos.length} Alumnos</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-sm">
                    <th className="pb-3 px-4">DNI</th>
                    <th className="pb-3 px-4">Alumno</th>
                    <th className="pb-3 px-4">Estado de Asistencia</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnos.map(al => (
                    <tr key={al.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4 font-mono text-sm">{al.dni}</td>
                      <td className="py-4 px-4 font-medium">{al.nombres}</td>
                      <td className="py-4 px-4">
                        <select 
                          value={asistencia[al.id] || 'Presente'} 
                          onChange={e => setAsistencia({...asistencia, [al.id]: e.target.value})}
                          className={`w-full max-w-[200px] border rounded-lg p-2 text-sm font-bold outline-none transition-colors ${
                            asistencia[al.id] === 'Presente' ? 'bg-green-900/30 text-green-400 border-green-500/50' :
                            asistencia[al.id] === 'Tardanza' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50' :
                            asistencia[al.id] === 'Falta Injustificada' ? 'bg-red-900/30 text-red-400 border-red-500/50' :
                            asistencia[al.id] === 'Falta Justificada' ? 'bg-blue-900/30 text-blue-400 border-blue-500/50' :
                            'bg-orange-900/30 text-orange-400 border-orange-500/50'
                          }`}
                        >
                          <option value="Presente">Presente</option>
                          <option value="Tardanza">Tardanza</option>
                          <option value="Falta Justificada">Falta Justificada</option>
                          <option value="Falta Injustificada">Falta Injustificada</option>
                          {!isPrimaria && <option value="Evasión">Evasión (Se fugó)</option>}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={handleAsistenciaSubmit} className="mt-8 px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-slate-900 rounded-xl font-bold transition-all shadow-sm">Guardar Asistencia</button>
          </div>
        )}

        {activeTab === 'notas' && cursoActivo && (
          <div className="animate-fade-in-up bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-lg">
            <h2 className="text-xl font-semibold mb-6">Registro de Evaluaciones: {cursoActivo.nombre}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-sm">
                    <th className="pb-3 px-4">Alumno</th>
                    <th className="pb-3 px-2">C1</th><th className="pb-3 px-2">C2</th><th className="pb-3 px-2">C3</th><th className="pb-3 px-2">C4</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnos.map(al => (
                    <tr key={al.id} className="border-b border-white/5">
                      <td className="py-4 px-4">{al.nombres}</td>
                      {['c1','c2','c3','c4'].map((k) => (
                        <td key={k} className="py-4 px-2">
                          <input value={notas[al.id]?.[k] || ''} onChange={e => setNotas({...notas, [al.id]: {...notas[al.id], [k]: e.target.value}})} type="text" className="w-full bg-black/30 border border-white/10 rounded p-2 text-center" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={handleNotasSubmit} className="mt-8 px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-slate-900 rounded-xl font-bold transition-all shadow-sm">Guardar Notas</button>
          </div>
        )}

        {activeTab === 'generador_examen' && (
          <div className="space-y-6 animate-fade-in-up bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-yellow-500/20 text-yellow-500 rounded-xl"></div>
              <h2 className="text-2xl font-bold text-white">Generador de Exámenes</h2>
            </div>
            
            <div className="bg-slate-950 p-6 rounded-2xl border border-white/10">
              <p className="text-slate-400 mb-6">El sistema generará un examen formateado listo para imprimir.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Tema de la Evaluación</label>
                  <input type="text" value={examTopic} onChange={e => setExamTopic(e.target.value)} placeholder="Ej: La Revolución Francesa..." className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Dificultad</label>
                  <select value={examDifficulty} onChange={e => setExamDifficulty(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none">
                    <option value="Básico">Básico</option><option value="Intermedio">Intermedio</option><option value="Avanzado">Avanzado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Nº Preguntas</label>
                  <input type="number" value={examQuestions} onChange={e => setExamQuestions(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"/>
                </div>
              </div>

              <button onClick={handleGenerateExam} disabled={loadingExam} className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-all shadow-sm">
                {loadingExam ? 'Generando...' : 'Generar Examen'}
              </button>
              
              {examGenerated && (
                <div className="mt-8 bg-slate-950 p-6 rounded-xl border border-white/10">
                  <h3 className="text-xl font-bold mb-4 text-yellow-500">Examen Generado:</h3>
                  <div className="whitespace-pre-wrap text-slate-300">{examGenerated}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'planificador' && (
          <div className="animate-fade-in-up bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Planificador de Sesiones</h2>
            <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <input required value={planForm.grade} onChange={e => setPlanForm({...planForm, grade: e.target.value})} placeholder="Grado" className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white"/>
              <input required value={planForm.subject} onChange={e => setPlanForm({...planForm, subject: e.target.value})} placeholder="Materia" className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white"/>
              <input required value={planForm.topic} onChange={e => setPlanForm({...planForm, topic: e.target.value})} placeholder="Tema" className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white"/>
              <button disabled={isPlanning} type="submit" className="md:col-span-3 py-3 bg-yellow-600 hover:bg-yellow-500 text-slate-900 rounded-xl font-bold shadow-sm">{isPlanning ? "Generando..." : "Generar Sesión"}</button>
            </form>
            {planResult && <div className="bg-slate-950 p-6 rounded-2xl whitespace-pre-wrap">{planResult.plan_content}</div>}
          </div>
        )}

        {activeTab === 'corrector' && (
          <div className="animate-fade-in-up bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Evaluación Automática</h2>
            <form onSubmit={handleGradeExam} className="space-y-4">
              <input type="file" onChange={e => setOcrFile(e.target.files[0])} className="w-full"/>
              <textarea value={ocrRubric} onChange={e => setOcrRubric(e.target.value)} placeholder="Rúbrica..." className="w-full bg-slate-950 border border-white/10 p-3 rounded-lg text-white"/>
              <button type="submit" disabled={isGrading} className="bg-yellow-600 hover:bg-yellow-500 text-slate-900 px-8 py-3 rounded-xl font-bold shadow-sm">{isGrading ? "Procesando..." : "Evaluar Examen"}</button>
            </form>
            {ocrResult && <div className="mt-6 bg-slate-950 border border-white/10 p-4 rounded-xl">{ocrResult.grading.nota_sugerida}</div>}
          </div>
        )}
        
        {activeTab === 'cuentos' && isPrimaria && (
          <div className="space-y-6 animate-fade-in-up bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-lg mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-yellow-500/20 text-yellow-500 rounded-xl text-2xl"></div>
              <h2 className="text-2xl font-bold text-white">Generador de Cuentos</h2>
            </div>
            
            <p className="text-slate-400 mb-6">Selecciona un curso de primaria en la barra superior. El sistema leerá los nombres de los alumnos de ese salón y creará un cuento corto personalizado para enseñarles un valor moral en el que ellos serán los protagonistas.</p>
            
            <div className="flex gap-4 mb-6">
              <input 
                type="text" 
                value={storyValue} 
                onChange={e => setStoryValue(e.target.value)}
                placeholder="Ej: La importancia de compartir, El respeto a la naturaleza, El trabajo en equipo..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500"
              />
              <button 
                onClick={handleGenerateStory}
                disabled={loadingStory || !cursoActivo}
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-all disabled:opacity-50 shadow-sm"
              >
                {loadingStory ? 'Escribiendo Cuento...' : 'Generar Cuento'}
              </button>
            </div>
            
            {!cursoActivo && <p className="text-slate-400 text-sm">Debes seleccionar un curso en la barra superior (Ej: 3ro de Primaria).</p>}
            
            {storyGenerated && (
              <div className="bg-slate-950 p-8 rounded-2xl border border-white/10 shadow-inner">
                <h3 className="font-bold text-yellow-500 mb-6 flex items-center gap-2 text-xl">El Cuento de la Clase de {cursoActivo.nombre}:</h3>
                <div className="prose prose-invert max-w-none whitespace-pre-wrap text-slate-200 text-lg leading-relaxed">
                  {storyGenerated}
                </div>
              </div>
            )}
          </div>
        )}

          </div>
        </div>
      </main>
      <ChatWidget roleName="Soporte Docente" />
    </div>
  )
}

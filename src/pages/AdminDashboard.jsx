import React, { useEffect, useState } from 'react'
import useAuthStore from '../store/useAuthStore'
import ChatWidget from '../components/ChatWidget'
import { 
  GraduationCap, Users, UserPlus, BookOpen, Clock, AlertTriangle, 
  PartyPopper, Brain, BarChart3, Bot, DollarSign, Settings,
  RefreshCw, LogOut, ChevronRight, Zap
} from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, errorMsg: '' }; }
  static getDerivedStateFromError(error) { return { hasError: true, errorMsg: error.toString() }; }
  componentDidCatch(error, errorInfo) { console.error("ErrorBoundary caught:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return <div className="p-10 bg-red-900/50 text-white rounded-xl"><h2>¡Error de Renderizado!</h2><p className="font-mono text-sm mt-2 text-red-200">{this.state.errorMsg}</p></div>;
    }
    return this.props.children;
  }
}

export default function AdminDashboard() {
  const { token, logout } = useAuthStore()
  const [telemetry, setTelemetry] = useState(null)
  const [state, setState] = useState(null)
  
  // BI States
  const [biQuery, setBiQuery] = useState('')
  const [biResponse, setBiResponse] = useState('')
  const [loadingBi, setLoadingBi] = useState(false)
  
  const [activeTab, setActiveTab] = useState('alumnos') 
  
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'DOCENTE', nivel_asignado: 'PRIMARIA' })
  const [tutorForm, setTutorForm] = useState({ nivel: 'SECUNDARIA', grado: '1', seccion: 'A', docente_id: '' })
  const [tutoresAsignados, setTutoresAsignados] = useState([])
  
  // Intelligent Assignment States
  const [asignacionNivel, setAsignacionNivel] = useState('PRIMARIA')
  const [primariaTutores, setPrimariaTutores] = useState({})
  const [primariaEspeciales, setPrimariaEspeciales] = useState({ 'Inglés': [], 'Educación Física': [], 'Religión': [] })
  const [secundariaCursos, setSecundariaCursos] = useState({
    'Matemática': [], 'Comunicación': [], 'Ciencia y Tecnología': [], 'Ciencias Sociales': [],
    'Desarrollo Personal, Ciudadanía y Cívica (DPCC)': [], 'Inglés': [], 'Educación para el Trabajo (EPT)': [],
    'Arte y Cultura': [], 'Educación Física': [], 'Religión': []
  })
  const [docentes, setDocentes] = useState([])
  const [users, setUsers] = useState([])
  const [cursos, setCursos] = useState([])
  const [historialCitas, setHistorialCitas] = useState([])
  const [cajasHistorial, setCajasHistorial] = useState([])
  const [msg, setMsg] = useState(null)
  
  const [horarioPreview, setHorarioPreview] = useState([])
  const [previewMode, setPreviewMode] = useState('AULA') // 'AULA' or 'DOCENTE'
  const [horarioForm, setHorarioForm] = useState({ nivel: 'SECUNDARIA', grado: '1', seccion: 'A' })
  const [horarioDocenteId, setHorarioDocenteId] = useState('')

  // Smart Match State
  const [isMatching, setIsMatching] = useState(false)
  const [matchResult, setMatchResult] = useState(null)

  // Config State
  const [sysConfig, setSysConfig] = useState({ primaria: 500, secundaria: 700, cupos_aula_primaria: 30, cupos_aula_secundaria: 30 })

  // Silabo Gen Masivo State
  const [silaboGenNivel, setSilaboGenNivel] = useState('PRIMARIA')
  const [silaboGenGrado, setSilaboGenGrado] = useState(1)
  const [silaboGenLoading, setSilaboGenLoading] = useState(false)
  const [silaboGenFase, setSilaboGenFase] = useState('')
  const [silaboGenResultados, setSilaboGenResultados] = useState(null)
  const [silaboGenTodosLoading, setSilaboGenTodosLoading] = useState(false)
  const [silaboGenTodosResult, setSilaboGenTodosResult] = useState(null)

  const [showCursoModal, setShowCursoModal] = useState(false)
  const [cursoForm, setCursoForm] = useState({ nombre: '', nivel: 'SECUNDARIA' })
  const GRADOS = { PRIMARIA: [1,2,3,4,5,6], SECUNDARIA: [1,2,3,4,5] }
  const [gradosSeleccionados, setGradosSeleccionados] = useState([1,2,3,4,5])

  const fetchData = () => {
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/telemetry`, { headers: { Authorization: `Bearer ${token}` }})
      .then(res => res.json()).then(setTelemetry)
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/state`, { headers: { Authorization: `Bearer ${token}` }})
      .then(res => res.json()).then(setState)
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/docentes`, { headers: { Authorization: `Bearer ${token}` }})
      .then(res => res.json()).then(setDocentes)
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/cursos_list`, { headers: { Authorization: `Bearer ${token}` }})
      .then(res => res.json()).then(setCursos)
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/citas_historial`, { headers: { Authorization: `Bearer ${token}` }})
      .then(res => res.json()).then(setHistorialCitas)
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/tutores_asignados`, { headers: { Authorization: `Bearer ${token}` }})
      .then(res => res.json()).then(data => setTutoresAsignados(data.tutores || []))
    fetch(`${import.meta.env.VITE_API_URL}/api/secretaria/admin/auditoria_cajas`, { headers: { Authorization: `Bearer ${token}` }})
      .then(res => res.json()).then(setCajasHistorial)
    fetch(`${import.meta.env.VITE_API_URL}/api/config`)
      .then(res => res.json()).then(setSysConfig).catch(console.error)
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` }})
      .then(res => res.json()).then(setUsers)
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [token])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setMsg(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...userForm, nivel_asignado: userForm.role === 'DOCENTE' ? userForm.nivel_asignado : null })
      })
      const data = await res.json()
      setMsg({ text: data.message || data.detail, type: res.ok ? 'success' : 'error' })
      if(res.ok) { setUserForm({ username: '', password: '', role: 'DOCENTE', nivel_asignado: 'PRIMARIA' }); fetchData() }
    } catch(err) { setMsg({ text: 'Error de conexión', type: 'error' }) }
  }

  const handleToggleStatus = async (userId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/toggle_status`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setMsg({ text: data.message || data.detail, type: res.ok ? 'success' : 'error' })
      if(res.ok) fetchData()
    } catch(err) {
      setMsg({ text: 'Error de conexión', type: 'error' })
    }
  }

  const handleCreateTutor = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (!tutorForm.docente_id) return setMsg({ text: 'Debes seleccionar un docente', type: 'error' })
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/tutores`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(tutorForm)
      })
      const data = await res.json()
      setMsg({ text: data.message || data.detail, type: res.ok ? 'success' : 'error' })
      if(res.ok) { setTutorForm({ nivel: 'SECUNDARIA', grado: '1', seccion: 'A', docente_id: '' }); fetchData() }
    } catch(err) { setMsg({ text: 'Error de conexión', type: 'error' }) }
  }

  const handleCrearCurso = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (gradosSeleccionados.length === 0) {
      setMsg({ text: 'Debes seleccionar al menos un grado.', type: 'error' })
      return
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/cursos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombre: cursoForm.nombre,
          nivel: cursoForm.nivel,
          grados: gradosSeleccionados
        })
      })
      const data = await res.json()
      setMsg({ text: data.message || data.detail || 'Curso creado exitosamente', type: res.ok ? 'success' : 'error' })
      if(res.ok) {
        setShowCursoModal(false)
        fetchData()
        setCursoForm({ nombre: '', nivel: 'SECUNDARIA' })
        setGradosSeleccionados([1,2,3,4,5])
      }
    } catch(err) {
      setMsg({ text: 'Error de conexión', type: 'error' })
    }
  }

  const enrolled = state?.enrolled_students || {}
  const rejected = state?.rejected_students || {}

  const handleGenerarHorarios = async (targetNivel) => {
    if (!confirm(`Esto regenerará y reemplazará todos los horarios para ${targetNivel}. ¿Proceder?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/generar_horarios?nivel=${targetNivel}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error()
      setMsg({ text: `Horario académico de ${targetNivel} generado óptimamente.`, type: 'success' })
      fetchHorario()
    } catch {
      setMsg({ text: 'No se pudo generar el horario. Verifica si asignaste suficientes docentes.', type: 'error' })
    }
  }

  const fetchHorario = async () => {
    try {
      let endpoint = previewMode === 'AULA' 
        ? `${import.meta.env.VITE_API_URL}/api/horarios/${horarioForm.nivel}/${horarioForm.grado}/${horarioForm.seccion}`
        : `${import.meta.env.VITE_API_URL}/api/admin/horarios/docente/${horarioDocenteId}`
        
      if (previewMode === 'DOCENTE' && !horarioDocenteId) return setMsg({ text: 'Selecciona un docente', type: 'error' })

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setHorarioPreview(data)
      }
    } catch (e) { console.error(e) }
  }

  const handleBiQuery = async () => {
    if(!biQuery.trim()) return;
    setLoadingBi(true);
    setBiResponse('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deep-agents/bi-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: biQuery })
      });
      const data = await res.json();
      setBiResponse(data.response || "No se obtuvo respuesta.");
    } catch (e) {
      setBiResponse("Error al consultar el agente de base de datos.");
    } finally {
      setLoadingBi(false);
    }
  }

  const [isAssigningPrimaria, setIsAssigningPrimaria] = useState(false)

  const handleGuardarAsignacionesInteligentes = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/cursos/asignacion_inteligente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nivel: asignacionNivel,
          primaria_tutores: primariaTutores,
          primaria_especialistas: primariaEspeciales,
          secundaria_cursos: secundariaCursos
        })
      })
      const data = await res.json()
      setMsg({ text: data.message || 'Asignaciones guardadas correctamente', type: res.ok ? 'success' : 'error' })
      if(res.ok) { fetchData() }
    } catch (e) { setMsg({ text: 'Error de conexión', type: 'error' }) }
  }

  const handleAutoAssignPrimaria = async () => {
    setIsAssigningPrimaria(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/cursos/asignacion_primaria_ia`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.tutores && Object.keys(data.tutores).length > 0) {
        setPrimariaTutores(data.tutores)
        setPrimariaEspeciales(data.especialistas)
        setMsg({ text: 'Asignación automática cargada, ¡revisa y guarda!', type: 'success' })
      } else {
        setMsg({ text: 'No se pudo generar la asignación automática', type: 'error' })
      }
    } catch (e) {
      setMsg({ text: 'Error contactando a la IA', type: 'error' })
    } finally {
      setIsAssigningPrimaria(false)
    }
  }

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          primaria: parseFloat(sysConfig.primaria), 
          secundaria: parseFloat(sysConfig.secundaria),
          cupos_aula_primaria: parseInt(sysConfig.cupos_aula_primaria),
          cupos_aula_secundaria: parseInt(sysConfig.cupos_aula_secundaria)
        })
      })
      const data = await res.json()
      setMsg({ text: data.message, type: res.ok ? 'success' : 'error' })
    } catch (e) {
      setMsg({ text: 'Error guardando config', type: 'error' })
    }
  }

  const handleRunSmartMatch = async () => {
    const docentesSec = docentes.filter(d => d.nivel_asignado === 'SECUNDARIA')
    if (docentesSec.length === 0) {
      return alert("No hay docentes de secundaria registrados.");
    }
    
    setIsMatching(true)
    setMatchResult(null)
    
    const classProfiles = [
      { diff: "Indisciplina Alta", needs: ["Control de grupo", "Disciplina"] },
      { diff: "Aplicados, Retos", needs: ["Motivación académica", "Retos intelectuales"] },
      { diff: "Rezago Académico", needs: ["Paciencia", "Acompañamiento cercano"] },
      { diff: "Estándar", needs: ["Asignación automática", "Acompañamiento"] }
    ];

    const secondaryClassrooms = [
      "1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B"
    ].map((c, idx) => {
      const p = classProfiles[idx % classProfiles.length];
      return {
        classroom_id: c + "-Secundaria",
        difficulty_level: p.diff,
        needs: p.needs
      };
    });

    const teacherProfiles = [
      { style: "Estricto, Disciplina", strengths: ["Liderazgo", "Control de clase"] },
      { style: "Dinámico, Motivación", strengths: ["Creatividad", "Inspiración"] },
      { style: "Analítico, Estructurado", strengths: ["Planificación", "Claridad"] },
      { style: "Paciente, Empático", strengths: ["Tutoría", "Escucha activa"] }
    ];

    const teachersList = docentesSec.map((d, idx) => {
      const p = teacherProfiles[idx % teacherProfiles.length];
      return {
        teacher_id: d.id,
        name: d.username,
        teaching_style: p.style,
        strengths: p.strengths
      };
    });

    const payload = {
      classrooms: secondaryClassrooms,
      teachers: teachersList
    }
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deep-agents/smart-tutor-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error("Error en servidor")
      const data = await res.json()
      setMatchResult(data.matches)

      // Guardar en la DB
      for (const match of data.matches) {
        const classStr = match.classroom_id.replace('-Secundaria', '')
        const grado = parseInt(classStr[0])
        const seccion = classStr[1]
        
        await fetch(`${import.meta.env.VITE_API_URL}/api/admin/tutores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            nivel: 'SECUNDARIA',
            grado: grado,
            seccion: seccion,
            docente_id: match.teacher_id
          })
        })
      }
      fetchData()
      alert("Tutores de Secundaria asignados y guardados exitosamente. ¡Sin repeticiones!")
    } catch (err) {
      alert("Hubo un error al ejecutar el Asignador IA.")
    } finally {
      setIsMatching(false)
    }
  }

  const handleMultiSelect = (state, setState, courseName, teacherId) => {
    const current = state[courseName] || []
    if (current.includes(teacherId)) {
      setState({...state, [courseName]: current.filter(id => id !== teacherId)})
    } else {
      setState({...state, [courseName]: [...current, teacherId]})
    }
  }

  const docentesPrimaria = docentes.filter(d => d.nivel_asignado === 'PRIMARIA')
  const docentesSecundaria = docentes.filter(d => d.nivel_asignado === 'SECUNDARIA')

  const TabButton = ({ id, label, icon }) => (
    <button 
      onClick={() => { setActiveTab(id); setMsg(null); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-blue-800/40' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-white/5'}`}
    >
      <div className={`p-2 rounded-lg ${activeTab === id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400'}`}>
        {icon}
      </div>
      <span className="text-sm text-left">{label}</span>
    </button>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-hidden flex relative">
      
      {/* Sidebar */}
      <aside className="w-[320px] flex-shrink-0 bg-slate-950 border-r border-white/10 flex flex-col z-20 relative">
        <div className="p-6 border-b border-white/10 flex items-center gap-4 bg-slate-900">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-tight">I.E.P.<br/>José María Arguedas</h1>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mb-3 mt-2">Principal</p>
          <TabButton id="alumnos" label="Gestión de Alumnos" icon={<GraduationCap className="w-4 h-4" />} />
          <TabButton id="personal" label="Personal (RRHH)" icon={<Users className="w-4 h-4" />} />
          <TabButton id="asignacion_docente" label="Asignación Docente" icon={<UserPlus className="w-4 h-4" />} />
          <TabButton id="academico" label="Gestión Académica" icon={<BookOpen className="w-4 h-4" />} />
          <TabButton id="horarios_docentes" label="Horarios por Docente" icon={<Clock className="w-4 h-4" />} />
          
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mb-3 mt-6">Inteligencia</p>
          <TabButton id="riesgo" label="Riesgo Académico" icon={<AlertTriangle className="w-4 h-4" />} />
          <TabButton id="asignador_ia" label="Asignador de Aulas" icon={<Brain className="w-4 h-4" />} />
          <TabButton id="bi_analytics" label="Análisis de Datos" icon={<BarChart3 className="w-4 h-4" />} />
          <TabButton id="ia" label="Monitor de Recursos" icon={<BarChart3 className="w-4 h-4" />} />
          <TabButton id="silabos_ia" label="Gestor de Sílabos" icon={<Bot className="w-4 h-4" />} />
          
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mb-3 mt-6">Sistema</p>
          <TabButton id="cierre" label="Fin de Año Escolar" icon={<PartyPopper className="w-4 h-4" />} />
          <TabButton id="auditoria_caja" label="Auditoría de Cajas" icon={<DollarSign className="w-4 h-4" />} />
          <TabButton id="configuracion" label="Configuración" icon={<Settings className="w-4 h-4" />} />
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
                {activeTab.replace('_', ' ')}
             </h2>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchData} className="px-5 py-2.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20 rounded-xl transition-all flex items-center shadow-sm">
              <RefreshCw className="w-4 h-4 mr-2" /> Refrescar Datos
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar w-full">
          {msg && (
            <div className={`mb-8 p-4 rounded-xl border font-medium flex items-center gap-3 animate-fade-in-up ${msg.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              {msg.text}
            </div>
          )}
          
          <div className="max-w-[1600px] mx-auto w-full">
            {activeTab === 'alumnos' && (
              <div className="space-y-8 animate-fade-in-up">
                <div>
                  <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Alumnos Matriculados Oficialmente</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.keys(enrolled).length === 0 ? <p className="text-slate-500 italic">No hay alumnos matriculados.</p> :
                      Object.entries(enrolled).map(([id, data]) => (
                        <div key={id} className="bg-slate-900/60 backdrop-blur-md border border-green-500/20 p-4 rounded-xl border-l-4 border-l-green-500">
                          <h3 className="font-bold">{data.nombres}</h3>
                          <p className="text-sm text-slate-400">DNI: {data.dni}</p>
                          <p className="text-sm text-slate-400">Grado: {data.grado}° {data.nivel}</p>
                          <div className="mt-2 text-xs bg-green-500/20 text-green-300 w-fit px-2 py-1 rounded">EST-{id.substring(0,6)}</div>
                        </div>
                      ))
                    }
                  </div>
                </div>

                <div className="pt-8 border-t border-white/10">
                  <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Postulaciones Rechazadas</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.keys(rejected).length === 0 ? <p className="text-slate-500 italic">No hay expedientes rechazados.</p> :
                      Object.entries(rejected).map(([id, data]) => (
                        <div key={id} className="bg-slate-900/60 backdrop-blur-md border border-red-500/20 p-4 rounded-xl border-l-4 border-l-red-500">
                          <h3 className="font-bold">{data.nombres}</h3>
                          <p className="text-sm text-slate-400">DNI: {data.dni}</p>
                          <p className="text-sm mt-3 text-red-300 bg-red-500/10 p-2 rounded">Motivo: {data.motivo || "No apto según evaluación"}</p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'auditoria_caja' && (
              <div className="animate-fade-in-up">
                <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-sm">
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><DollarSign className="w-6 h-6 text-yellow-500" /> Auditoría de Cajas</h2>
                  <p className="text-slate-400 mb-8">El Sistema revisa automáticamente la cuadratura diaria de la Secretaría. Las anomalías se marcan en rojo.</p>

                  <div className="space-y-4">
                    {cajasHistorial.length === 0 ? <p className="text-slate-500 italic">No hay registros de cajas cerradas aún.</p> :
                      cajasHistorial.map(c => (
                        <div key={c.id} className={`p-6 rounded-2xl border ${c.estado === 'Abierta' ? 'bg-blue-900/10 border-blue-500/30' : (c.diferencia < 0 ? 'bg-red-900/20 border-red-500/50' : 'bg-green-900/10 border-green-500/30')}`}>
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-lg">Caja: {c.fecha}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${c.estado === 'Abierta' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>{c.estado.toUpperCase()}</span>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 mb-4 text-sm bg-slate-900/60 backdrop-blur-md p-4 rounded-xl">
                            <div><span className="block text-slate-500 text-xs">Apertura</span><span className="font-mono">S/ {c.monto_apertura.toFixed(2)}</span></div>
                            <div><span className="block text-slate-500 text-xs">Recaudado (ERP)</span><span className="font-mono">S/ {c.recaudado_sistema.toFixed(2)}</span></div>
                            <div><span className="block text-slate-500 text-xs">Cierre Físico</span><span className="font-mono">{c.monto_cierre ? `S/ ${c.monto_cierre.toFixed(2)}` : 'N/A'}</span></div>
                            <div>
                              <span className="block text-slate-500 text-xs">Diferencia</span>
                              <span className={`font-mono font-bold ${c.diferencia < 0 ? 'text-red-400' : (c.diferencia > 0 ? 'text-amber-400' : 'text-green-400')}`}>
                                {c.diferencia !== null ? `S/ ${c.diferencia.toFixed(2)}` : 'N/A'}
                              </span>
                            </div>
                          </div>

                          {c.estado === 'Cerrada' && c.reporte_ia && (
                            <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl mt-2 relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                              <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2 flex items-center gap-2">Reporte del Sistema</h4>
                              <p className="text-sm text-slate-300 italic">"{c.reporte_ia}"</p>
                            </div>
                          )}
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'configuracion' && (
              <div className="animate-fade-in-up max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Settings className="w-6 h-6 text-slate-400" /> Configuración General</h2>
                <p className="text-slate-400 mb-8">Administra los parámetros globales del ERP Escolar.</p>

                <form onSubmit={handleSaveConfig} className="bg-white/5 border border-white/10 p-8 rounded-3xl shadow-xl space-y-6">
                  <h3 className="font-bold text-lg text-emerald-400 border-b border-white/10 pb-2 mb-4">Costos de Matrícula</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Primaria (S/)</label>
                      <input 
                        type="number" step="0.1" required
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:border-blue-500 outline-none text-white font-mono" 
                        value={sysConfig.primaria} 
                        onChange={e => setSysConfig({...sysConfig, primaria: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Secundaria (S/)</label>
                      <input 
                        type="number" step="0.1" required
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:border-blue-500 outline-none text-white font-mono" 
                        value={sysConfig.secundaria} 
                        onChange={e => setSysConfig({...sysConfig, secundaria: e.target.value})} 
                      />
                    </div>
                  </div>

                  <h3 className="font-bold text-lg text-emerald-400 border-b border-white/10 pb-2 mb-4 mt-6">Cupos Máximos (Por Aula/Sección)</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Primaria (Max por sección)</label>
                      <input 
                        type="number" step="1" required
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:border-blue-500 outline-none text-white font-mono" 
                        value={sysConfig.cupos_aula_primaria || 30} 
                        onChange={e => setSysConfig({...sysConfig, cupos_aula_primaria: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Secundaria (Max por sección)</label>
                      <input 
                        type="number" step="1" required
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:border-blue-500 outline-none text-white font-mono" 
                        value={sysConfig.cupos_aula_secundaria || 30} 
                        onChange={e => setSysConfig({...sysConfig, cupos_aula_secundaria: e.target.value})} 
                      />
                    </div>
                  </div>
                  
                  <div className="bg-slate-900 border border-white/10 p-4 rounded-xl text-sm text-slate-300 mt-4">
                    <strong>Nota:</strong> Estos precios se actualizarán en tiempo real en la pasarela de Admisiones y el Sistema adaptará sus respuestas al instante.
                  </div>

                  <button type="submit" className="w-full py-4 mt-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-bold transition-all">
                    Guardar Configuración Global
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'personal' && (
              <div className="animate-fade-in-up max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-2">Registro de Personal</h2>
                <p className="text-slate-400 mb-8">Crea cuentas de acceso seguro para el cuerpo docente y psicológico.</p>
                
                <form onSubmit={handleCreateUser} className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-8 rounded-2xl space-y-5">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Nombre de Usuario (Login)</label>
                    <input type="text" required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:border-blue-500 outline-none text-white" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} placeholder="Ej: jmendoza" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Contraseña de Acceso</label>
                    <input type="password" required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:border-blue-500 outline-none text-white" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Rol en el Sistema</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:border-blue-500 outline-none text-white" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                      <option value="DOCENTE">Docente (Acceso a Notas)</option>
                      <option value="PSICOLOGO">Psicólogo (Evaluación Conductual)</option>
                      <option value="SECRETARIO">Secretario (Caja y Atención)</option>
                    </select>
                  </div>
                  
                  {userForm.role === 'DOCENTE' && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Nivel Asignado (Solo Docentes)</label>
                      <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:border-blue-500 outline-none text-white" value={userForm.nivel_asignado} onChange={e => setUserForm({...userForm, nivel_asignado: e.target.value})}>
                        <option value="PRIMARIA">Primaria (Polidocencia)</option>
                        <option value="SECUNDARIA">Secundaria (Especializado)</option>
                      </select>
                    </div>
                  )}

                  <button type="submit" className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all shadow-blue-800/40">
                    Crear Cuenta Institucional
                  </button>
                </form>

                <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-4">Gestión de Usuarios</h3>
                  {users.length === 0 ? <p className="text-slate-500">No hay usuarios registrados.</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
                          <tr>
                            <th className="px-4 py-3 rounded-tl-lg">Usuario</th>
                            <th className="px-4 py-3">Rol</th>
                            <th className="px-4 py-3">Nivel</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3 rounded-tr-lg">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map(u => (
                            <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 font-bold text-white">{u.username}</td>
                              <td className="px-4 py-3">{u.role}</td>
                              <td className="px-4 py-3">{u.nivel_asignado || '-'}</td>
                              <td className="px-4 py-3">
                                {u.is_active ? 
                                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold">Activo</span> : 
                                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold">Suspendido</span>
                                }
                              </td>
                              <td className="px-4 py-3">
                                <button 
                                  onClick={() => handleToggleStatus(u.id)}
                                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${u.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white'}`}
                                >
                                  {u.is_active ? 'Suspender' : 'Activar'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'academico' && (
              <ErrorBoundary>
                <div className="animate-fade-in-up flex flex-col gap-10 max-w-4xl mx-auto w-full">

                
                <div>
                  <div className="bg-white/5 border border-amber-500/30 p-8 rounded-3xl shadow-xl mb-8">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <button onClick={() => handleGenerarHorarios('PRIMARIA')} className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-500 hover:to-blue-500 rounded-xl font-bold transition-all shadow-blue-800/40">
                        Generar Horario Primaria
                      </button>
                      <button onClick={() => handleGenerarHorarios('SECUNDARIA')} className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                        Generar Horario Secundaria
                      </button>
                    </div>
                    
                    <div className="border-t border-white/10 pt-6">
                      <h3 className="font-bold text-slate-300 mb-4">Previsualizar Horario (Por Aula)</h3>
                      
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <select className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" value={horarioForm.nivel} onChange={e => {setHorarioForm({...horarioForm, nivel: e.target.value}); setPreviewMode('AULA'); setHorarioPreview([])}}>
                          <option value="PRIMARIA">Primaria</option><option value="SECUNDARIA">Secundaria</option>
                        </select>
                        <select className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" value={horarioForm.grado} onChange={e => {setHorarioForm({...horarioForm, grado: e.target.value}); setPreviewMode('AULA'); setHorarioPreview([])}}>
                          {(horarioForm.nivel === 'PRIMARIA' ? [1,2,3,4,5,6] : [1,2,3,4,5]).map(g => <option key={g} value={g}>{g}°</option>)}
                        </select>
                        <select className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" value={horarioForm.seccion} onChange={e => {setHorarioForm({...horarioForm, seccion: e.target.value}); setPreviewMode('AULA'); setHorarioPreview([])}}>
                          <option value="A">A</option><option value="B">B</option>
                        </select>
                      </div>
                      
                      <button onClick={fetchHorario} className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-300 mb-4">Ver Grilla</button>
                      
                      {horarioPreview.length > 0 ? (
                        <div className="overflow-x-auto mt-6 custom-scrollbar bg-black/40 rounded-xl border border-white/10">
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
                                      const clase = horarioPreview.find(h => h.dia === dia && h.hora_inicio === bloque.inicio)
                                      return (
                                        <td key={`${dia}-${bloque.inicio}`} className="p-2 border-r border-white/5 last:border-0 align-top">
                                          {clase ? (
                                            <div className="h-full bg-blue-900/20 border border-blue-500/20 rounded p-2 flex flex-col justify-between hover:border-blue-400/50 transition-colors">
                                              <span className="font-bold text-white leading-tight mb-1">{clase.curso}</span>
                                              <span className="text-[10px] text-blue-300 truncate">
                                                {previewMode === 'AULA' ? `${clase.docente ? clase.docente.split(' ')[0] : 'Sin Asignar'}` : `${clase.aula}`}
                                              </span>
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
                        <p className="text-slate-500 text-xs italic text-center">Genera y consulta un horario para previsualizarlo aquí.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Cursos Aperturados
                    </h2>
                    <button onClick={() => setShowCursoModal(true)} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-bold text-sm transition-all shadow-sm">
                      + Aperturar Curso
                    </button>
                  </div>
                  <div className="w-full">
                    {(() => {
                      if (cursos.length === 0) return <p className="text-slate-400 italic text-center p-12 bg-white/5 rounded-3xl border border-white/10 shadow-inner">No hay cursos registrados. Haz clic en "+ Aperturar Curso" para comenzar.</p>;
                      
                      const grouped = cursos.reduce((acc, c) => {
                        const key = `${c.nivel} - ${c.grado}° "${c.seccion}"`;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(c);
                        return acc;
                      }, {});

                      // Sort keys so PRIMARIA appears before SECUNDARIA and lower grades first
                      const sortedKeys = Object.keys(grouped).sort((a, b) => {
                        const lvlA = a.includes('PRIMARIA') ? 1 : 2;
                        const lvlB = b.includes('PRIMARIA') ? 1 : 2;
                        if (lvlA !== lvlB) return lvlA - lvlB;
                        return a.localeCompare(b);
                      });

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {sortedKeys.map((groupKey) => (
                            <div key={groupKey} className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:border-yellow-500/30 transition-all group flex flex-col h-full">
                              <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></span>
                                  {groupKey}
                                </h3>
                                <span className="text-xs bg-black/30 px-3 py-1 rounded-lg text-yellow-400 font-bold border border-yellow-500/20 shadow-inner">
                                  {grouped[groupKey].length} Cursos
                                </span>
                              </div>
                              <div className="p-4 space-y-3 flex-1">
                                {grouped[groupKey].map((c, i) => (
                                  <div key={i} className="flex justify-between items-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5 group-hover:border-white/10">
                                    <span className="font-bold text-slate-200">{c.nombre}</span>
                                    {c.docente_id ? (
                                      <span className="text-[10px] bg-blue-500/20 border border-blue-500/30 text-blue-300 px-2 py-1 rounded-md whitespace-nowrap font-medium">Prof. ID: {c.docente_id}</span>
                                    ) : (
                                      <span className="text-[10px] bg-red-500/20 border border-red-500/30 text-red-300 px-2 py-1 rounded-md whitespace-nowrap font-medium animate-pulse">Sin asignar</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  </div>
                </div>
              </ErrorBoundary>
            )}

            {activeTab === 'asignacion_docente' && (
              <div className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                      <UserPlus className="w-6 h-6 text-yellow-500" /> Asignación Docente
                    </h2>
                    <p className="text-slate-400 mt-2">Malla curricular global. Asigna los profesores a los cursos y el sistema balanceará las horas automáticamente.</p>
                  </div>
                  <button onClick={handleGuardarAsignacionesInteligentes} className="w-full mt-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-bold transition-all">
                    Guardar Asignaciones de {asignacionNivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'}
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 p-2 rounded-2xl mb-8 flex gap-2">
                  <button 
                    onClick={() => setAsignacionNivel('PRIMARIA')}
                    className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${asignacionNivel === 'PRIMARIA' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                  >
                    Nivel Primaria
                  </button>
                  <button 
                    onClick={() => setAsignacionNivel('SECUNDARIA')}
                    className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${asignacionNivel === 'SECUNDARIA' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                  >
                    Nivel Secundaria
                  </button>
                </div>

                <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl">
                  {asignacionNivel === 'PRIMARIA' && (
                    <div className="animate-fade-in-up">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-bold text-yellow-500 flex items-center gap-3">
                          Asignación Primaria
                        </h3>
                        <button 
                          onClick={handleAutoAssignPrimaria}
                          disabled={isAssigningPrimaria}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50"
                        >
                          {isAssigningPrimaria ? "Asignando..." : "Autocompletar Asignación"}
                        </button>
                      </div>
                      
                      <div className="mb-10">
                        <h4 className="font-bold text-xl text-slate-200 mb-6 border-b border-white/10 pb-3 flex items-center gap-2">
                          Tutores de Aula (Cursos Base)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                          {[1,2,3,4,5,6].map(g => (
                            ['A', 'B'].map(s => {
                              const key = `${g}-${s}`
                              return (
                                <div key={key} className="bg-slate-900 p-4 rounded-xl border border-white/5 hover:border-green-500/50 transition-all shadow-inner group">
                                  <label className="block text-sm font-bold text-slate-300 mb-3 group-hover:text-green-400 transition-colors">{g}° "{s}"</label>
                                  <select 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white outline-none focus:border-green-500 shadow-sm"
                                    value={primariaTutores[key] || ''}
                                    onChange={e => setPrimariaTutores({...primariaTutores, [key]: parseInt(e.target.value) || null})}
                                  >
                                    <option value="">Tutor...</option>
                                    {docentesPrimaria.map(d => <option key={d.id} value={d.id}>{d.username.split(' ')[0]}</option>)}
                                  </select>
                                </div>
                              )
                            })
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-xl text-slate-200 mb-6 border-b border-white/10 pb-3 flex items-center gap-2">
                          Especialistas Rotativos
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {['Inglés', 'Educación Física', 'Religión'].map(curso => (
                            <div key={curso} className="bg-slate-900 p-6 rounded-xl border border-white/5 hover:border-green-500/30 transition-all">
                              <label className="block text-lg font-bold text-white mb-4">{curso}</label>
                              <div className="flex flex-wrap gap-2">
                                {docentesPrimaria.map(d => (
                                  <button 
                                    key={d.id}
                                    onClick={() => setPrimariaEspeciales({...primariaEspeciales, [curso]: primariaEspeciales[curso]?.[0] === d.id ? [] : [d.id]})}
                                    className={`px-4 py-2 text-sm rounded-full border transition-all ${primariaEspeciales[curso]?.includes(d.id) ? 'bg-green-600 border-green-400 text-white shadow-[0_0_15px_rgba(22,163,74,0.4)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                                  >
                                    {d.username}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {asignacionNivel === 'SECUNDARIA' && (
                    <div className="animate-fade-in-up">
                      <div className="flex justify-between items-end mb-8">
                        <h3 className="text-2xl font-bold text-blue-400 flex items-center gap-3">
                          <span className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
                          Asignación Secundaria
                        </h3>
                        <p className="text-sm text-slate-400 bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-500/20">
                          Selecciona múltiples docentes por materia. El algoritmo dividirá las horas.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {Object.keys(secundariaCursos).map(curso => (
                          <div key={curso} className="bg-slate-900 p-5 rounded-xl border border-white/5 hover:border-blue-500/50 transition-all shadow-inner">
                            <label className="block text-base font-bold text-white mb-4 truncate border-b border-white/5 pb-3" title={curso}>{curso}</label>
                            <div className="flex flex-wrap gap-2">
                              {docentesSecundaria.map(d => (
                                <button 
                                  key={d.id}
                                  onClick={() => handleMultiSelect(secundariaCursos, setSecundariaCursos, curso, d.id)}
                                  className={`px-4 py-2 text-sm rounded-full border transition-all ${secundariaCursos[curso]?.includes(d.id) ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                                >
                                  {d.username.split(' ')[0]}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'horarios_docentes' && (
              <div className="animate-fade-in-up">
                <div className="bg-white/5 border border-blue-500/30 p-8 rounded-3xl shadow-xl">
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                    Horarios por Docente
                  </h2>
                  <p className="text-slate-400 text-sm mb-8">Consulta la carga horaria semanal y las aulas asignadas a cada profesor de la institución.</p>
                  
                  <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 mb-8">
                    <label className="block text-sm font-bold text-white mb-3">Seleccionar Profesor</label>
                    <select 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:border-blue-500 outline-none text-white shadow-inner" 
                      value={horarioDocenteId} 
                      onChange={e => {setHorarioDocenteId(e.target.value); setPreviewMode('DOCENTE'); setHorarioPreview([])}}
                    >
                      <option value="">Seleccione un profesor de la lista...</option>
                      <optgroup label="Secundaria">
                        {docentesSecundaria.map(d => <option key={d.id} value={d.id}>{d.username}</option>)}
                      </optgroup>
                      <optgroup label="Primaria">
                        {docentesPrimaria.map(d => <option key={d.id} value={d.id}>{d.username}</option>)}
                      </optgroup>
                    </select>
                    
                    <button onClick={fetchHorario} className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all shadow-blue-800/40">
                      Consultar Horario Semanal
                    </button>
                  </div>
                  
                  {horarioPreview.length > 0 ? (
                    <div className="overflow-x-auto custom-scrollbar bg-black/40 rounded-xl border border-white/10 shadow-lg">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="bg-blue-900/30 text-blue-300 text-xs uppercase tracking-wider">
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
                                  <td colSpan="5" className="p-2 text-center text-blue-500/50 font-bold tracking-[0.5em]">{bloque.label}</td>
                                </tr>
                              )
                            }
                            return (
                              <tr key={bloque.inicio} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-2 border-r border-white/10 text-center text-slate-400 font-mono text-[10px]">
                                  {bloque.inicio}<br/>|<br/>{bloque.fin}
                                </td>
                                {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(dia => {
                                  const clase = horarioPreview.find(h => h.dia === dia && h.hora_inicio === bloque.inicio)
                                  return (
                                    <td key={`${dia}-${bloque.inicio}`} className="p-2 border-r border-white/5 last:border-0 align-top">
                                      {clase ? (
                                        <div className="h-full bg-blue-900/20 border border-blue-500/20 rounded p-3 flex flex-col justify-between hover:border-blue-400/50 transition-colors shadow-sm">
                                          <span className="font-bold text-white leading-tight mb-2 text-sm">{clase.curso}</span>
                                          <span className="text-xs text-blue-300 font-medium bg-blue-950/50 py-1 px-2 rounded w-fit border border-blue-500/20">
                                            {clase.aula}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="h-full min-h-[56px] rounded border border-dashed border-white/10 flex items-center justify-center">
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
                    <div className="flex flex-col items-center justify-center p-12 bg-slate-900 rounded-2xl border border-white/10 border-dashed">
                      <p className="text-slate-500 text-sm">Selecciona un profesor y haz clic en "Consultar Horario Semanal" para visualizar su carga académica.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'riesgo' && (
              <div className="animate-fade-in-up space-y-8">
                <h2 className="text-2xl font-bold mb-6">Reporte de Riesgo Académico</h2>
                
                <div className="grid grid-cols-1 gap-8">
                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4 text-yellow-500">Casos Críticos por Bajo Rendimiento / Asistencia al Psicólogo</h3>
                    {(!state?.alertas_ia || state.alertas_ia.length === 0) ? (
                      <p className="text-slate-500 italic">No hay alertas de reincidencia generadas por el Sistema.</p>
                    ) : (
                      <div className="space-y-4">
                        {state.alertas_ia.map((alerta, i) => (
                          <div key={i} className="bg-slate-900 border border-white/10 p-4 rounded-xl border-l-4 border-l-yellow-500">
                            <h4 className="font-bold text-yellow-500">Alumno: {alerta.alumno} ({alerta.citas} citas recurrentes)</h4>
                            <p className="text-sm mt-2 text-slate-300 italic">"{alerta.reporte}"</p>
                            <p className="text-xs text-yellow-600 mt-3 flex items-center gap-1">El apoderado ya fue citado de urgencia vía correo automatizado.</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ia' && (
              <div className="animate-fade-in-up grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                  <h2 className="text-xl font-bold mb-4">Métricas del Sistema</h2>
                  {telemetry ? (
                    <div className="space-y-4">
                      <div className="p-5 bg-slate-900 border border-white/10 rounded-xl border-l-4 border-l-yellow-500">
                        <p className="text-sm text-slate-400">Llamadas Totales al Sistema</p>
                        <p className="text-3xl font-bold">{telemetry.calls}</p>
                      </div>
                      <div className="p-5 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl border-l-4 border-l-green-500">
                        <p className="text-sm text-slate-400">Tasa de Éxito</p>
                        <p className="text-3xl font-bold">{telemetry.calls > 0 ? Math.round((telemetry.success_calls/telemetry.calls)*100) : 0}%</p>
                      </div>
                      <div className="p-5 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl border-l-4 border-l-blue-500 flex flex-col justify-between">
                        <div>
                          <p className="text-sm text-slate-400">Tokens Consumidos</p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold">{telemetry.total_tokens?.toLocaleString()}</p>
                            <span className="text-sm text-blue-400 font-semibold">{telemetry.token_percentage?.toFixed(2)}%</span>
                          </div>
                        </div>
                        <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full ${telemetry.token_percentage > 90 ? 'bg-red-500 shadow-[0_0_10px_red]' : telemetry.token_percentage > 75 ? 'bg-orange-500 shadow-[0_0_10px_orange]' : 'bg-blue-500 shadow-[0_0_10px_blue]'} transition-all duration-1000 ease-out`} 
                            style={{ width: `${Math.min(telemetry.token_percentage || 0, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 text-right">Cuota: {telemetry.tokens_quota?.toLocaleString()}</p>
                      </div>
                    </div>
                  ) : <p className="text-slate-500">Cargando métricas...</p>}
                </div>
                
                <div className="lg:col-span-8 flex flex-col h-[600px]">
                  <h2 className="text-xl font-bold mb-4">Monitor de Memoria Compartida (Raw JSON)</h2>
                  <div className="flex-1 bg-[#0d1117] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                    <div className="h-8 bg-[#161b22] border-b border-slate-800 flex items-center px-4 gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="ml-4 text-xs font-mono text-slate-400">school_unified_db.json</span>
                    </div>
                    <div className="p-4 flex-1 overflow-auto custom-scrollbar">
                      <pre className="font-mono text-xs text-green-400">
                        {state ? JSON.stringify(state, null, 2).split('\n').map((l, i) => (
                          <div key={i} className="hover:bg-white/5 px-2 -mx-2"><span className="text-slate-600 mr-4 select-none">{i+1}</span>{l}</div>
                        )) : 'Cargando...'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bi_analytics' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    Análisis de Datos
                  </h2>
                </div>
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                  <p className="text-slate-400 mb-4">Haz preguntas en lenguaje natural sobre la base de datos del colegio. El sistema procesará tu pregunta de manera segura y analizará los resultados.</p>
                  
                  <div className="flex gap-4 mb-6">
                    <input 
                      type="text"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Ej: ¿Qué porcentaje de alumnos tienen alertas psicológicas de nivel Alto?"
                      value={biQuery}
                      onChange={(e) => setBiQuery(e.target.value)}
                    />
                    <button 
                      onClick={handleBiQuery}
                      disabled={loadingBi}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl disabled:opacity-50 transition-all"
                    >
                      {loadingBi ? 'Procesando...' : 'Preguntar'}
                    </button>
                  </div>

                  {biResponse && (
                    <div className="bg-slate-950 rounded-xl p-6 border border-white/10">
                      <h3 className="text-yellow-500 font-bold mb-3">Respuesta del Sistema:</h3>
                      <div className="text-slate-300 prose prose-invert max-w-none whitespace-pre-wrap">
                        {biResponse}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'cierre' && (
              <div className="animate-fade-in-up flex flex-col items-center justify-center min-h-[500px]">
                <div className="bg-white/5 border border-red-500/30 p-10 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.15)] max-w-2xl w-full text-center">
                  <h2 className="text-4xl font-black text-red-500 mb-4">Fin de Año Escolar</h2>
                  <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                    Al ejecutar el cierre escolar, el sistema procesará todas las notas para calcular el <b>promedio final</b> de cada alumno. Determinará quién aprueba y quién repite, y <b>enviará diplomas o reportes académicos</b> por correo electrónico a los padres.
                  </p>
                  <div className="bg-slate-900 border border-red-500/50 p-4 rounded-xl text-red-400 text-sm font-bold text-left mb-8 flex items-start gap-3">
                    <p>¡ADVERTENCIA! Esta acción no se puede deshacer. Borrará todos los horarios generados y liberará a todos los tutores para preparar el sistema para el siguiente año escolar.</p>
                  </div>
                  
                  <button 
                    onClick={async () => {
                      if(confirm('¿ESTÁ ABSOLUTAMENTE SEGURO? Se procesarán notas, se enviarán correos reales y se borrarán horarios y tutores.')) {
                        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/cierre_escolar`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
                        const data = await res.json()
                        alert(data.message)
                        fetchData()
                      }
                    }}
                    className="w-full py-5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 rounded-xl font-black text-xl transition-all shadow-[0_0_30px_rgba(225,29,72,0.4)] tracking-wide uppercase"
                  >
                    Ejecutar Cierre de Año Escolar
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'asignador_ia' && (
              <div className="animate-fade-in-up">
                <div className="bg-slate-900 border border-white/10 p-10 rounded-3xl max-w-4xl mx-auto">
                  <h2 className="text-3xl font-black text-yellow-500 mb-4 flex items-center gap-3">
                    Asignación Automática de Tutores
                  </h2>
                  <p className="text-slate-300 text-lg mb-8">
                    El Sistema distribuirá a los docentes de secundaria disponibles equitativamente entre las aulas para asignarles la tutoría principal del año escolar.
                  </p>
                  
                  <button 
                    onClick={handleRunSmartMatch}
                    disabled={isMatching}
                    className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 rounded-xl font-bold transition-all text-white text-lg"
                  >
                    {isMatching ? "Procesando asignaciones..." : "Ejecutar Asignación de Tutores"}
                  </button>

                  {matchResult && (
                    <div className="mt-10 animate-fade-in-up">
                      <h3 className="text-xl font-bold text-yellow-500 mb-6">Resultados de Asignación</h3>
                      <div className="grid gap-6">
                        {matchResult.map((match, idx) => (
                          <div key={idx} className="bg-slate-800 border border-white/10 p-6 rounded-2xl">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="bg-white/5 text-slate-200 px-4 py-2 rounded-lg font-bold border border-white/10">Aula: {match.classroom_id}</div>
                              <div className="text-slate-500">➡️</div>
                              <div className="bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-lg font-bold">Tutor: {match.teacher_id}</div>
                            </div>
                            <p className="text-slate-400 italic bg-slate-950 p-4 rounded-xl border border-white/10 text-sm">
                              Asignación procesada automáticamente para el año escolar en curso.
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======== SÍLABOS ======== */}
            {activeTab === 'silabos_ia' && (
              <div className="animate-fade-in-up space-y-8">
                <div className="bg-slate-900 border border-white/10 rounded-3xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-black text-white">Gestor de Sílabos</h2>
                      <p className="text-slate-400 text-sm mt-1">
                        Procesamiento Automatizado &bull; Currículo Nacional 2019
                      </p>
                    </div>
                  </div>

                  {/* Diagrama del pipeline */}
                  <div className="grid grid-cols-6 gap-1 mb-8">
                    {[
                      { label: 'Construcción\nde Contexto' },
                      { label: 'Definición\nde Competencias' },
                      { label: 'Creación\nde Cronograma' },
                      { label: 'Criterios\nde Evaluación' },
                      { label: 'Validación\nEstructural' },
                      { label: 'Registro\nen Sistema' },
                    ].map((node, i) => (
                      <div key={i} className={`flex flex-col items-center gap-2 p-3 bg-slate-800 border border-white/10 rounded-xl text-center`}>
                        <span className="text-[10px] text-slate-400 leading-tight whitespace-pre-line">{node.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Panel de generación por grado */}
                  <div className="bg-slate-950 border border-white/10 rounded-2xl p-6 mb-6">
                    <h3 className="text-lg font-bold text-yellow-500 mb-4">Generación por Grado</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Nivel</label>
                        <select
                          className="w-full bg-slate-900 border border-violet-500/30 rounded-xl p-3 text-white text-sm outline-none"
                          value={silaboGenNivel}
                          onChange={e => { setSilaboGenNivel(e.target.value); setSilaboGenGrado(1) }}
                        >
                          <option value="PRIMARIA">Primaria (1° - 6°)</option>
                          <option value="SECUNDARIA">Secundaria (1° - 5°)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Grado</label>
                        <select
                          className="w-full bg-slate-900 border border-violet-500/30 rounded-xl p-3 text-white text-sm outline-none"
                          value={silaboGenGrado}
                          onChange={e => setSilaboGenGrado(Number(e.target.value))}
                        >
                          {(silaboGenNivel === 'PRIMARIA'
                            ? [1,2,3,4,5,6]
                            : [1,2,3,4,5]
                          ).map(g => (
                            <option key={g} value={g}>{g}° Grado</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={async () => {
                            setSilaboGenLoading(true)
                            setSilaboGenResultados(null)
                            const fases = ['Marco curricular','Competencias','Cronograma','Evaluación','Validación','Persistencia']
                            let fi = 0; setSilaboGenFase(fases[0])
                            const t = setInterval(() => { fi = Math.min(fi+1, fases.length-1); setSilaboGenFase(fases[fi]) }, 5000)
                            try {
                              const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deep-agents/silabo/generar-grado`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ nivel: silaboGenNivel, grado: silaboGenGrado, anno_escolar: '2025' })
                              })
                              const data = await res.json()
                              setSilaboGenResultados(data)
                            } finally {
                              clearInterval(t); setSilaboGenLoading(false); setSilaboGenFase('')
                            }
                          }}
                          disabled={silaboGenLoading || silaboGenTodosLoading}
                          className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {silaboGenLoading
                            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Generando...</>
                            : 'Generar Sílabos del Grado'
                          }
                        </button>
                      </div>
                    </div>

                    {/* Indicador de fase */}
                    {silaboGenLoading && (
                      <div className="p-3 bg-slate-900 border border-white/10 rounded-xl flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-yellow-400/40 border-t-yellow-400 rounded-full animate-spin"></div>
                        <div>
                          <p className="text-yellow-500 text-xs font-semibold">Procesamiento en curso</p>
                          <p className="text-slate-400 text-xs">{silaboGenFase}</p>
                        </div>
                        <div className="ml-auto flex gap-1.5">
                          {[1,2,3,4,5,6].map((e, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-all bg-slate-700`}></div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resultados por grado */}
                    {silaboGenResultados && !silaboGenLoading && (
                      <div className="mt-4">
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-sm font-bold text-white">
                            {silaboGenNivel} {silaboGenGrado}° Grado
                          </span>
                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                            {silaboGenResultados.generados}/{silaboGenResultados.total_areas} generados
                          </span>
                          {silaboGenResultados.fallidos > 0 && (
                            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
                              {silaboGenResultados.fallidos} fallidos
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {silaboGenResultados.detalle?.map((d, i) => (
                            <div key={i} className={`p-3 rounded-xl border text-xs ${
                              d.status === 'OK'
                                ? 'bg-slate-900 border-green-500/20 text-green-400'
                                : 'bg-slate-900 border-red-500/20 text-red-400'
                            }`}>
                              <span className="font-bold">{d.status === 'OK' ? 'Completado' : 'Error'}</span> - {d.area}
                              {d.status === 'OK' && <span className="ml-1 text-green-400/60">(#{d.silabo_id})</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Panel de generación TOTAL */}
                  <div className="bg-slate-950 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-yellow-500 mb-2 flex items-center gap-2">
                      Generación Masiva — Todos los Grados
                    </h3>
                    <p className="text-slate-400 text-sm mb-4">
                      Genera automáticamente sílabos completos para <strong className="text-white">TODOS</strong> los grados
                      de Primaria (1°-6°) y Secundaria (1°-5°). El sistema procesa la información en paralelo por área dentro de cada grado. Esta operación puede tardar varios minutos.
                    </p>
                    <button
                      onClick={async () => {
                        if (!window.confirm('Esto iniciará la generación masiva para TODOS los grados y áreas. ¿Continuar?')) return
                        setSilaboGenTodosLoading(true)
                        setSilaboGenTodosResult(null)
                        try {
                          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deep-agents/silabo/generar-todos?anno_escolar=2025`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` }
                          })
                          const data = await res.json()
                          setSilaboGenTodosResult(data)
                        } finally {
                          setSilaboGenTodosLoading(false)
                        }
                      }}
                      disabled={silaboGenTodosLoading || silaboGenLoading}
                      className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-2xl transition-all text-base disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {silaboGenTodosLoading
                        ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Generando todos los sílabos... (puede tardar 3-10 min)</>
                        : <>Generar Sílabos para TODO el Colegio</>
                      }
                    </button>

                    {silaboGenTodosResult && !silaboGenTodosLoading && (
                      <div className="mt-6 animate-fade-in-up">
                        <div className="flex flex-wrap gap-3 mb-4">
                          <div className="px-4 py-2 bg-white/10 rounded-xl text-sm">
                            <span className="text-slate-400">Total:</span> <strong className="text-white">{silaboGenTodosResult.total_combinaciones}</strong>
                          </div>
                          <div className="px-4 py-2 bg-slate-900 border border-green-500/20 rounded-xl text-sm">
                            <span className="text-green-400">Generados: <strong>{silaboGenTodosResult.generados}</strong></span>
                          </div>
                          {silaboGenTodosResult.fallidos > 0 && (
                            <div className="px-4 py-2 bg-slate-900 border border-red-500/20 rounded-xl text-sm">
                              <span className="text-red-400">Fallidos: <strong>{silaboGenTodosResult.fallidos}</strong></span>
                            </div>
                          )}
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                          {silaboGenTodosResult.detalle?.map((d, i) => (
                            <div key={i} className={`flex items-center gap-3 p-2 rounded-lg text-xs ${
                              d.status === 'OK'
                                ? 'bg-slate-900 text-green-300'
                                : 'bg-slate-900 text-red-300'
                            }`}>
                              <span>{d.status === 'OK' ? 'Exitoso' : 'Error'}</span>
                              <span className="font-semibold">{d.nivel} {d.grado}°</span>
                              <span className="flex-1">{d.area}</span>
                              {d.status === 'OK' && (
                                <span className="text-slate-500">#{d.silabo_id} &bull; {d.retries || 0} retry(s)</span>
                              )}
                              {d.error && <span className="text-red-400 truncate max-w-32">{d.error}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <ChatWidget roleName="Asistente Directivo" />
      
      {showCursoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-slate-950 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowCursoModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">✕</button>
            <h3 className="text-xl font-bold text-yellow-500 mb-6">Aperturar Nuevo Curso</h3>
            <form onSubmit={handleCrearCurso} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nombre del Curso</label>
                <input type="text" required className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-yellow-500 transition-colors" placeholder="Ej: Matemática Avanzada" value={cursoForm.nombre} onChange={e => setCursoForm({...cursoForm, nombre: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nivel</label>
                <select className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-yellow-500 transition-colors"
                  value={cursoForm.nivel}
                  onChange={e => {
                    const nuevoNivel = e.target.value
                    setCursoForm({...cursoForm, nivel: nuevoNivel})
                    setGradosSeleccionados(GRADOS[nuevoNivel]) // reset a todos marcados
                  }}>
                  <option value="PRIMARIA">Primaria</option>
                  <option value="SECUNDARIA">Secundaria</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Grados aplicables</label>
                <p className="text-xs text-slate-500 mb-3">Todos marcados por defecto. Destilda los que no apliquen.</p>
                <div className="grid grid-cols-3 gap-2">
                  {GRADOS[cursoForm.nivel].map(g => (
                    <label key={g} className={`flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2 border transition-all
                      ${gradosSeleccionados.includes(g)
                        ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                        : 'border-white/10 bg-slate-900 text-slate-400'}`}>
                      <input
                        type="checkbox"
                        checked={gradosSeleccionados.includes(g)}
                        onChange={() => {
                          setGradosSeleccionados(prev =>
                            prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g].sort((a,b) => a - b)
                          )
                        }}
                        className="accent-yellow-500"
                      />
                      <span className="font-semibold">{g}°</span>
                    </label>
                  ))}
                </div>
                {gradosSeleccionados.length === 0 && (
                  <p className="text-xs text-red-400 mt-2">⚠ Selecciona al menos un grado.</p>
                )}
              </div>
              <button type="submit" disabled={gradosSeleccionados.length === 0}
                className="w-full py-4 mt-6 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all">
                {gradosSeleccionados.length > 0
                  ? `Aplicar a ${gradosSeleccionados.length} grado${gradosSeleccionados.length > 1 ? 's' : ''} seleccionado${gradosSeleccionados.length > 1 ? 's' : ''}`
                  : 'Selecciona al menos un grado'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


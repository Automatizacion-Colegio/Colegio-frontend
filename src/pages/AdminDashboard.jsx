import React, { useEffect, useState } from 'react'
import useAuthStore from '../store/useAuthStore'
import ChatWidget from '../components/ChatWidget'
import { 
  GraduationCap, Users, UserPlus, BookOpen, Clock, AlertTriangle, 
  PartyPopper, Brain, BarChart3, Bot, DollarSign, Settings,
  RefreshCw, LogOut, ChevronRight, Zap, UserCheck, TrendingUp
} from 'lucide-react'

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#0a0a0f',
  sidebar:     '#0f0f18',
  surface:     '#13131e',
  surfaceHigh: '#1a1a28',
  border:      'rgba(255,255,255,0.07)',
  borderHov:   'rgba(255,255,255,0.13)',
  accent:      '#4f6ef7',
  accentMuted: 'rgba(79,110,247,0.15)',
  textPrimary: '#e8e9f0',
  textSec:     '#8b8fa8',
  textMuted:   '#4a4d62',
  success:     '#3a8a5c',
  successText: '#6bcf9a',
  successBg:   'rgba(58,138,92,0.12)',
  danger:      '#8a3a3a',
  dangerText:  '#cf6b6b',
  dangerBg:    'rgba(138,58,58,0.12)',
  warn:        '#7a6a32',
  warnText:    '#c9a84c',
  warnBg:      'rgba(122,106,50,0.12)',
}

// ─── Error Boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, errorMsg: '' }; }
  static getDerivedStateFromError(error) { return { hasError: true, errorMsg: error.toString() }; }
  componentDidCatch(error, errorInfo) { console.error("ErrorBoundary caught:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: C.dangerBg, border: `1px solid ${C.dangerText}30`, borderRadius: 12 }}>
          <h2 style={{ color: C.dangerText, marginBottom: 8 }}>Error de Renderizado</h2>
          <p style={{ fontFamily: 'monospace', fontSize: 13, color: C.textSec }}>{this.state.errorMsg}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Shared UI Atoms ─────────────────────────────────────────────────────────
const Card = ({ children, style = {}, noPad = false }) => (
  <div style={{
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: noPad ? 0 : '1.5rem',
    ...style
  }}>
    {children}
  </div>
)

const MetricCard = ({ label, value, sub, icon, color }) => (
  <div style={{
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderLeft: `3px solid ${color}`,
    borderRadius: 14,
    padding: '1.25rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    transition: 'border-color 0.2s',
    background: `linear-gradient(135deg, ${color}08 0%, ${C.surface} 60%)`,
  }}>
    <div style={{
      width: 42, height: 42, borderRadius: 10, flexShrink: 0,
      background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: color,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: C.textPrimary, lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, fontFamily: 'monospace' }}>{sub}</div>}
    </div>
  </div>
)

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary, margin: 0 }}>{children}</h2>
    {sub && <p style={{ color: C.textSec, fontSize: 13, marginTop: 4 }}>{sub}</p>}
  </div>
)

const Badge = ({ label, variant = 'neutral' }) => {
  const variants = {
    success: { bg: C.successBg, color: C.successText, border: `1px solid ${C.success}40` },
    danger:  { bg: C.dangerBg,  color: C.dangerText,  border: `1px solid ${C.danger}40` },
    warn:    { bg: C.warnBg,    color: C.warnText,    border: `1px solid ${C.warn}40` },
    accent:  { bg: C.accentMuted, color: C.accent,    border: `1px solid ${C.accent}40` },
    neutral: { bg: 'rgba(255,255,255,0.05)', color: C.textSec, border: `1px solid ${C.border}` },
  }
  const s = variants[variant]
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 6,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
      background: s.bg, color: s.color, border: s.border,
    }}>{label}</span>
  )
}

const Btn = ({ children, onClick, disabled, variant = 'primary', size = 'md', style = {}, type = 'button' }) => {
  const sizes = { sm: { padding: '6px 14px', fontSize: 12 }, md: { padding: '10px 20px', fontSize: 13 }, lg: { padding: '13px 24px', fontSize: 14 } }
  const variants = {
    primary: { background: C.accent, color: '#fff', border: `1px solid ${C.accent}` },
    ghost:   { background: 'transparent', color: C.textSec, border: `1px solid ${C.border}` },
    danger:  { background: C.dangerBg, color: C.dangerText, border: `1px solid ${C.danger}40` },
    success: { background: C.successBg, color: C.successText, border: `1px solid ${C.success}40` },
    muted:   { background: 'rgba(255,255,255,0.04)', color: C.textSec, border: `1px solid ${C.border}` },
  }
  const v = variants[variant]
  const sz = sizes[size]
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      ...sz, ...v,
      borderRadius: 9, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1, transition: 'all 0.15s', display: 'inline-flex',
      alignItems: 'center', gap: 6, ...style
    }}>{children}</button>
  )
}

const Input = ({ style = {}, ...props }) => (
  <input {...props} style={{
    width: '100%', background: C.surfaceHigh, border: `1px solid ${C.border}`,
    borderRadius: 9, padding: '10px 14px', color: C.textPrimary, fontSize: 13,
    outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box', ...style
  }} onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
)

const Select = ({ style = {}, children, ...props }) => (
  <select {...props} style={{
    width: '100%', background: C.surfaceHigh, border: `1px solid ${C.border}`,
    borderRadius: 9, padding: '10px 14px', color: C.textPrimary, fontSize: 13,
    outline: 'none', cursor: 'pointer', boxSizing: 'border-box', ...style
  }}>{children}</select>
)

const Label = ({ children, style = {} }) => (
  <label style={{ display: 'block', color: C.textSec, fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', ...style }}>{children}</label>
)

const FieldGroup = ({ label, children, style = {} }) => (
  <div style={{ marginBottom: '1.25rem', ...style }}>
    <Label>{label}</Label>
    {children}
  </div>
)

const Divider = ({ style = {} }) => <div style={{ borderTop: `1px solid ${C.border}`, margin: '1.5rem 0', ...style }} />

const Alert = ({ children, variant = 'success' }) => {
  const v = { success: { bg: C.successBg, color: C.successText, border: C.success }, error: { bg: C.dangerBg, color: C.dangerText, border: C.danger }, warn: { bg: C.warnBg, color: C.warnText, border: C.warn } }
  const s = v[variant] || v.success
  return (
    <div style={{ padding: '12px 16px', borderRadius: 10, border: `1px solid ${s.border}40`, background: s.bg, color: s.color, fontSize: 13, fontWeight: 500, marginBottom: '1.5rem' }}>
      {children}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
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
  const [cursosDisponibles, setCursosDisponibles] = useState([])   // [{nombre, niveles}]
  const [especializaciones, setEspecializaciones] = useState([])   // [{curso_nombre, nivel}]
  const [horarioWarnings, setHorarioWarnings] = useState([])       // advertencias del timetabler
  const [tutorForm, setTutorForm] = useState({ nivel: 'SECUNDARIA', grado: '1', seccion: 'A', docente_id: '' })
  const [tutoresAsignados, setTutoresAsignados] = useState([])
  const [isGenerandoPrimaria, setIsGenerandoPrimaria] = useState(false)
  const [isGenerandoSecundaria, setIsGenerandoSecundaria] = useState(false)
  const [estadoFlujo, setEstadoFlujo] = useState(null)
  const [asignacionNivel, setAsignacionNivel] = useState('PRIMARIA')
  const [primariaTutores, setPrimariaTutores] = useState({})
  const [primariaEspeciales, setPrimariaEspeciales] = useState({ 'Inglés': [], 'Educación Física': [], 'Religión': [] })
  const [secundariaCursos, setSecundariaCursos] = useState({
    'Matemática': [], 'Comunicación': [], 'Ciencia y Tecnología': [], 'Ciencias Sociales': [],
    'Desarrollo Personal, Ciudadanía y Cívica (DPCC)': [], 'Inglés': [], 'Educación para el Trabajo (EPT)': [],
    'Arte y Cultura': [], 'Educación Física': [], 'Religión': []
  })
  const [secundariaTutores, setSecundariaTutores] = useState({})


  const handleEliminarTutor = async (id) => {
    if (!confirm("¿Eliminar este tutor asignado?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/tutores/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setMsg({ text: 'Tutor eliminado', type: 'success' })
        fetchData();
      }
    } catch(err) { setMsg({ text: 'Error eliminando tutor', type: 'error' }) }
  }
  
  const [docentes, setDocentes] = useState([])
  const [users, setUsers] = useState([])
  const [rrhhFilterNivel, setRrhhFilterNivel] = useState('')
  const [rrhhSearchQuery, setRrhhSearchQuery] = useState('')
  const [cursos, setCursos] = useState([])
  const [historialCitas, setHistorialCitas] = useState([])
  const [cajasHistorial, setCajasHistorial] = useState([])
  const [msg, setMsg] = useState(null)
  
  const [horarioPreview, setHorarioPreview] = useState([])
  const [previewMode, setPreviewMode] = useState('AULA')
  const [horarioForm, setHorarioForm] = useState({ nivel: 'SECUNDARIA', grado: '1', seccion: 'A' })
  const [horarioDocenteId, setHorarioDocenteId] = useState('')

  const [isMatching, setIsMatching] = useState(false)
  const [matchResult, setMatchResult] = useState(null)

  const [sysConfig, setSysConfig] = useState({ 
    primaria: 500, secundaria: 700, cupos_aula_primaria: 30, cupos_aula_secundaria: 30, 
    precio_recuperacion_primaria: 0, precio_recuperacion_secundaria: 0,
    inicio_matricula: '', fin_matricula: '', limite_rematricula: ''
  })

  const [silaboGenNivel, setSilaboGenNivel] = useState('PRIMARIA')
  const [silaboGenGrado, setSilaboGenGrado] = useState(1)
  const [silaboGenLoading, setSilaboGenLoading] = useState(false)
  const [silaboGenFase, setSilaboGenFase] = useState('')
  const [silaboGenResultados, setSilaboGenResultados] = useState(null)
  const [silaboGenTodosLoading, setSilaboGenTodosLoading] = useState(false)
  const [silaboGenTodosResult, setSilaboGenTodosResult] = useState(null)

  const [showCursoModal, setShowCursoModal] = useState(false)
  const [cierreResult, setCierreResult] = useState(null)
  const [cursoForm, setCursoForm] = useState({ nombre: '', nivel: 'SECUNDARIA' })
  const GRADOS = { PRIMARIA: [1,2,3,4,5,6], SECUNDARIA: [1,2,3,4,5] }
  const [gradosSeleccionados, setGradosSeleccionados] = useState([1,2,3,4,5])

  const fetchData = () => {
    const handleList = (setter) => (res) => {
      if (res.status === 401) { logout(); return res.json(); }
      return res.json().then(data => {
        if (data && data.detail === "Could not validate credentials") { logout(); return; }
        setter(Array.isArray(data) ? data : []);
      }).catch(() => setter([]))
    };

    fetch(`${import.meta.env.VITE_API_URL}/api/admin/telemetry`, { headers: { Authorization: `Bearer ${token}` }})
      .then(res => res.json()).then(setTelemetry).catch(() => {})
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/state`, { headers: { Authorization: `Bearer ${token}` }})
      .then(res => res.json()).then(setState).catch(() => {})
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/docentes`, { headers: { Authorization: `Bearer ${token}` }})
      .then(handleList(setDocentes))
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/cursos_list`, { headers: { Authorization: `Bearer ${token}` }})
      .then(handleList(setCursos))
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/citas_historial`, { headers: { Authorization: `Bearer ${token}` }})
      .then(handleList(setHistorialCitas))
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/tutores_asignados`, { headers: { Authorization: `Bearer ${token}` }})
      .then(res => {
        if (res.status === 401) { logout(); return; }
        return res.json().then(data => setTutoresAsignados(data.tutores || []))
      }).catch(() => setTutoresAsignados([]))
    fetch(`${import.meta.env.VITE_API_URL}/api/secretaria/admin/auditoria_cajas`, { headers: { Authorization: `Bearer ${token}` }})
      .then(handleList(setCajasHistorial))
    fetch(`${import.meta.env.VITE_API_URL}/api/config`)
      .then(res => res.json()).then(setSysConfig).catch(console.error)
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` }})
      .then(handleList(setUsers))
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [token])
  
  // Cálculo del total combinado de aulas faltantes para la tarjeta principal (RRHH)
  const faltanAulas = estadoFlujo ? estadoFlujo.primaria.aulas_sin_tutor.length + estadoFlujo.secundaria.aulas_sin_tutor.length : 0;

  // Cargar cursos disponibles para el multi-select de especialización
  useEffect(() => {
    if (userForm.role === 'DOCENTE' && userForm.nivel_asignado && token) {
      fetch(`${import.meta.env.VITE_API_URL}/api/cursos/nombres-unicos?nivel=${userForm.nivel_asignado}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setCursosDisponibles(data) })
        .catch(() => setCursosDisponibles([]))
      setEspecializaciones([])  // Reset al cambiar nivel
    } else {
      setCursosDisponibles([])
      setEspecializaciones([])
    }
  }, [userForm.role, userForm.nivel_asignado, token])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (userForm.role === 'DOCENTE' && especializaciones.length === 0) {
      return setMsg({ text: 'Debes seleccionar al menos una especialización para el docente.', type: 'error' })
    }
    try {
      const body = {
        ...userForm,
        nivel_asignado: userForm.role === 'DOCENTE' ? userForm.nivel_asignado : null,
        especializaciones: userForm.role === 'DOCENTE' ? especializaciones : undefined,
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      setMsg({ text: data.message || data.detail, type: res.ok ? 'success' : 'error' })
      if(res.ok) {
        setUserForm({ username: '', password: '', role: 'DOCENTE', nivel_asignado: 'PRIMARIA' })
        setEspecializaciones([])
        fetchData()
      }
    } catch(err) { setMsg({ text: 'Error de conexión', type: 'error' }) }
  }

  const handleToggleStatus = async (userId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/toggle_status`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setMsg({ text: data.message || data.detail, type: res.ok ? 'success' : 'error' })
      if(res.ok) fetchData()
    } catch(err) { setMsg({ text: 'Error de conexión', type: 'error' }) }
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
    if (gradosSeleccionados.length === 0) { setMsg({ text: 'Debes seleccionar al menos un grado.', type: 'error' }); return }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/cursos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: cursoForm.nombre, nivel: cursoForm.nivel, grados: gradosSeleccionados })
      })
      const data = await res.json()
      setMsg({ text: data.message || data.detail || 'Curso creado exitosamente', type: res.ok ? 'success' : 'error' })
      if(res.ok) { setShowCursoModal(false); fetchData(); setCursoForm({ nombre: '', nivel: 'SECUNDARIA' }); setGradosSeleccionados([1,2,3,4,5]) }
    } catch(err) { setMsg({ text: 'Error de conexión', type: 'error' }) }
  }

  const enrolled = state?.enrolled_students || {}
  const rejected = state?.rejected_students || {}

  const handleGenerarHorarios = async (targetNivel) => {
    if (!confirm(`Esto regenerará y reemplazará todos los horarios para ${targetNivel}. ¿Proceder?`)) return;
    setHorarioWarnings([])
    if (targetNivel === 'PRIMARIA') setIsGenerandoPrimaria(true)
    if (targetNivel === 'SECUNDARIA') setIsGenerandoSecundaria(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/generar_horarios?nivel=${targetNivel}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || 'Error al generar')
      const warnings = data.advertencias || []
      setHorarioWarnings(warnings)
      const estado = data.estado === 'OK' ? 'sin conflictos' : `con ${data.bloques_sin_docente} bloque(s) sin docente`
      setMsg({ text: `Horario de ${targetNivel} generado ${estado}.`, type: data.estado === 'OK' ? 'success' : 'warn' })
      fetchHorario()
      fetchData()
    } catch(err) {
      setMsg({ text: err.message || 'No se pudo generar el horario.', type: 'error' })
    } finally {
      if (targetNivel === 'PRIMARIA') setIsGenerandoPrimaria(false)
      if (targetNivel === 'SECUNDARIA') setIsGenerandoSecundaria(false)
    }
  }

  const fetchHorario = async () => {
    try {
      let endpoint = previewMode === 'AULA' 
        ? `${import.meta.env.VITE_API_URL}/api/horarios/${horarioForm.nivel}/${horarioForm.grado}/${horarioForm.seccion}`
        : `${import.meta.env.VITE_API_URL}/api/admin/horarios/docente/${horarioDocenteId}`
      if (previewMode === 'DOCENTE' && !horarioDocenteId) return setMsg({ text: 'Selecciona un docente', type: 'error' })
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const data = await res.json(); setHorarioPreview(data) }
    } catch (e) { console.error(e) }
  }

  const handleBiQuery = async () => {
    if(!biQuery.trim()) return;
    setLoadingBi(true); setBiResponse('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deep-agents/bi-query`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: biQuery })
      });
      const data = await res.json();
      setBiResponse(data.response || "No se obtuvo respuesta.");
      const payload = {
        nivel: asignacionNivel,
        primaria_tutores: primariaTutores,
        primaria_especialistas: primariaEspeciales,
        secundaria_cursos: secundariaCursos,
        secundaria_tutores: secundariaTutores,
      }
    } catch (e) {
      setBiResponse("Error al consultar el agente de base de datos.");
    } finally { setLoadingBi(false); }
  }

  const [isAssigningPrimaria, setIsAssigningPrimaria] = useState(false)

  const handleGuardarAsignacionesInteligentes = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/cursos/asignacion_inteligente`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nivel: asignacionNivel, primaria_tutores: primariaTutores, primaria_especialistas: primariaEspeciales, secundaria_cursos: secundariaCursos })
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
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.tutores && Object.keys(data.tutores).length > 0) {
        setPrimariaTutores(data.tutores); setPrimariaEspeciales(data.especialistas)
        setMsg({ text: 'Asignación automática cargada. Revisa y guarda los cambios.', type: 'success' })
      } else { setMsg({ text: 'No se pudo generar la asignación automática', type: 'error' }) }
    } catch (e) { setMsg({ text: 'Error de conexión', type: 'error' }) }
    finally { setIsAssigningPrimaria(false) }
  }

  const handleAssignAndSavePrimaria = async () => {
    setIsAssigningPrimaria(true)
    setMsg({ text: 'Generando asignación de primaria con IA...', type: 'info' })
    try {
      const res1 = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/cursos/asignacion_primaria_ia`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      const data1 = await res1.json()
      if (data1.tutores && Object.keys(data1.tutores).length > 0) {
        const res2 = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/cursos/asignacion_inteligente`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ nivel: 'PRIMARIA', primaria_tutores: data1.tutores, primaria_especialistas: data1.especialistas, secundaria_cursos: {} })
        })
        if (res2.ok) {
           alert("Tutores de Primaria asignados exitosamente.")
           fetchData()
        }
      } else { setMsg({ text: 'No se pudo generar asignación', type: 'error' }) }
    } catch (e) { setMsg({ text: 'Error de conexión', type: 'error' }) }
    finally { setIsAssigningPrimaria(false) }
  }

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/config`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          primaria: parseFloat(sysConfig.primaria), secundaria: parseFloat(sysConfig.secundaria),
          cupos_aula_primaria: parseInt(sysConfig.cupos_aula_primaria), cupos_aula_secundaria: parseInt(sysConfig.cupos_aula_secundaria),
          precio_recuperacion_primaria: parseFloat(sysConfig.precio_recuperacion_primaria || 0),
          precio_recuperacion_secundaria: parseFloat(sysConfig.precio_recuperacion_secundaria || 0),
          inicio_matricula: sysConfig.inicio_matricula,
          fin_matricula: sysConfig.fin_matricula,
          limite_rematricula: sysConfig.limite_rematricula
        })
      })
      const data = await res.json()
      setMsg({ text: data.message, type: res.ok ? 'success' : 'error' })
    } catch (e) { setMsg({ text: 'Error guardando configuración', type: 'error' }) }
  }

  const handleRunSmartMatch = async () => {
    const docentesSec = docentes.filter(d => d.nivel_asignado === 'SECUNDARIA')
    if (docentesSec.length === 0) { return alert("No hay docentes de secundaria registrados."); }
    setIsMatching(true); setMatchResult(null)
    const classProfiles = [
      { diff: "Indisciplina Alta", needs: ["Control de grupo", "Disciplina"] },
      { diff: "Aplicados, Retos", needs: ["Motivación académica", "Retos intelectuales"] },
      { diff: "Rezago Académico", needs: ["Paciencia", "Acompañamiento cercano"] },
      { diff: "Estándar", needs: ["Asignación automática", "Acompañamiento"] }
    ];
    const secondaryClassrooms = ["1A","1B","2A","2B","3A","3B","4A","4B","5A","5B"].map((c, idx) => {
      const p = classProfiles[idx % classProfiles.length];
      return { classroom_id: c + "-Secundaria", difficulty_level: p.diff, needs: p.needs };
    });
    const teacherProfiles = [
      { style: "Estricto, Disciplina", strengths: ["Liderazgo", "Control de clase"] },
      { style: "Dinámico, Motivación", strengths: ["Creatividad", "Inspiración"] },
      { style: "Analítico, Estructurado", strengths: ["Planificación", "Claridad"] },
      { style: "Paciente, Empático", strengths: ["Tutoría", "Escucha activa"] }
    ];
    const teachersList = docentesSec.map((d, idx) => {
      const p = teacherProfiles[idx % teacherProfiles.length];
      return { teacher_id: d.id, name: d.username, teaching_style: p.style, strengths: p.strengths };
    });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deep-agents/smart-tutor-match`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ classrooms: secondaryClassrooms, teachers: teachersList })
      })
      if (!res.ok) throw new Error("Error en servidor")
      const data = await res.json()
      setMatchResult(data.matches)
      for (const match of data.matches) {
        const classStr = match.classroom_id.replace('-Secundaria', '')
        const grado = parseInt(classStr[0]); const seccion = classStr[1]
        await fetch(`${import.meta.env.VITE_API_URL}/api/admin/tutores`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ nivel: 'SECUNDARIA', grado, seccion, docente_id: match.teacher_id })
        })
      }
      fetchData(); alert("Tutores de Secundaria asignados exitosamente.")
    } catch (err) { alert("Hubo un error al ejecutar el Asignador.") }
    finally { setIsMatching(false) }
  }

  const handleMultiSelect = (state, setState, courseName, teacherId) => {
    const current = state[courseName] || []
    if (current.includes(teacherId)) { setState({...state, [courseName]: current.filter(id => id !== teacherId)}) }
    else { setState({...state, [courseName]: [...current, teacherId]}) }
  }

  const docentesPrimaria = docentes.filter(d => d.nivel_asignado === 'PRIMARIA')
  const docentesSecundaria = docentes.filter(d => d.nivel_asignado === 'SECUNDARIA')

  // Sidebar nav items
  const navSections = [
    {
      label: 'PRINCIPAL',
      items: [
        { id: 'alumnos',          label: 'Alumnos',           icon: <GraduationCap size={15} /> },
        { id: 'personal',         label: 'Personal (RRHH)',    icon: <Users size={15} /> },
        { id: 'academico',        label: 'Gestión Académica',  icon: <BookOpen size={15} /> },
        { id: 'horarios_docentes',label: 'Horarios Docentes',  icon: <Clock size={15} /> },
      ]
    },
    {
      label: 'INTELIGENCIA',
      items: [
        { id: 'riesgo',       label: 'Riesgo Académico',   icon: <AlertTriangle size={15} /> },
        { id: 'asignador_ia', label: 'Asignador de Aulas', icon: <Brain size={15} /> },
        { id: 'bi_analytics', label: 'Análisis de Datos',  icon: <BarChart3 size={15} /> },
        { id: 'ia',           label: 'Monitor de Recursos',icon: <BarChart3 size={15} /> },
        { id: 'silabos_ia',   label: 'Gestor de Sílabos',  icon: <Bot size={15} /> },
      ]
    },
    {
      label: 'SISTEMA',
      items: [
        { id: 'cierre',        label: 'Fin de Año Escolar', icon: <PartyPopper size={15} /> },
        { id: 'auditoria_caja',label: 'Auditoría de Cajas', icon: <DollarSign size={15} /> },
        { id: 'configuracion', label: 'Configuración',      icon: <Settings size={15} /> },
      ]
    }
  ]

  const tabLabel = navSections.flatMap(s => s.items).find(i => i.id === activeTab)?.label || activeTab

  // Schedule blocks for timetable
  const bloques = [
    { inicio: "08:00", fin: "08:45" }, { inicio: "08:45", fin: "09:30" }, { inicio: "09:30", fin: "10:15" },
    { isRecreo: true, label: "RECREO", time: "10:15 – 10:45" },
    { inicio: "10:45", fin: "11:30" }, { inicio: "11:30", fin: "12:15" }, { inicio: "12:15", fin: "13:00" },
    { isRecreo: true, label: "RECREO", time: "13:00 – 13:15" },
    { inicio: "13:15", fin: "14:00" },
  ]
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.textPrimary, fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', overflow: 'hidden' }}>

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside style={{ width: 248, flexShrink: 0, background: C.sidebar, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', zIndex: 20 }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Logo" style={{ height: 36, width: 'auto', objectFit: 'contain', opacity: 0.9 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, lineHeight: 1.3 }}>I.E.P. José María</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, lineHeight: 1.3 }}>Arguedas</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
          {navSections.map(section => (
            <div key={section.label} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: '0.08em', padding: '10px 10px 6px' }}>
                {section.label}
              </div>
              {section.items.map(item => {
                const isActive = activeTab === item.id
                return (
                  <button key={item.id} onClick={() => { setActiveTab(item.id); setMsg(null) }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 8, marginBottom: 2,
                    background: isActive ? C.accentMuted : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    color: isActive ? C.accent : C.textSec,
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 13,
                    transition: 'all 0.12s',
                    borderLeft: isActive ? `3px solid ${C.accent}` : '3px solid transparent',
                    paddingLeft: isActive ? 7 : 10,
                  }}>
                    <span style={{ opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${C.border}` }}>
          <button onClick={logout} style={{
            width: '100%', padding: '10px 14px', borderRadius: 9, border: `1px solid ${C.border}`,
            background: 'transparent', color: C.textSec, cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
            transition: 'all 0.15s', fontWeight: 500,
          }}>
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main style={{ flex: 1, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{
          padding: '0 32px', height: 60, borderBottom: `1px solid ${C.border}`,
          background: C.sidebar, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
        }}>
          <div>
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Panel de Administración
            </span>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.textPrimary }}>{tabLabel}</h2>
          </div>
          <button onClick={fetchData} style={{
            padding: '7px 14px', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 8, color: C.textSec, cursor: 'pointer', fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', fontWeight: 500,
          }}>
            <RefreshCw size={13} /> Refrescar
          </button>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', boxSizing: 'border-box' }}>
          {/* ── KPI METRICS ROW ─────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
            <MetricCard
              label="Total Alumnos"
              value={Object.keys(state?.enrolled_students || {}).length}
              sub={`+${Object.keys(state?.enrolled_students || {}).length} matriculados`}
              icon={<GraduationCap size={20} />}
              color={C.successText}
            />
            <MetricCard
              label="Docentes Activos"
              value={users.filter(u => u.role === 'DOCENTE' && u.is_active).length}
              sub={`${users.filter(u => u.role === 'DOCENTE').length} registrados`}
              icon={<Users size={20} />}
              color={C.accent}
            />
            <MetricCard
              label="Cursos Aperturados"
              value={cursos.length}
              sub={`${[...new Set(cursos.map(c => c.nivel))].join(' · ') || '—'}`}
              icon={<BookOpen size={20} />}
              color={C.warnText}
            />
            <MetricCard
              label="Tutores Asignados"
              value={tutoresAsignados.length}
              sub={estadoFlujo && faltanAulas > 0 ? (
                <span>
                  Faltan {faltanAulas} aulas
                </span>
              ) : "asignaciones activas"}
              icon={<UserCheck size={20} />}
              color={estadoFlujo && faltanAulas > 0 ? C.warnText : "#a78bfa"}
            />
          </div>
          {msg && <Alert variant={msg.type === 'success' ? 'success' : 'error'}>{msg.text}</Alert>}

          <div style={{ width: '100%' }}>

            {/* ── ALUMNOS ──────────────────────────────────────── */}
            {activeTab === 'alumnos' && (
              <div>
                <SectionTitle>Alumnos Matriculados</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 32 }}>
                  {Object.keys(enrolled).length === 0
                    ? <p style={{ color: C.textMuted, fontStyle: 'italic', fontSize: 13 }}>No hay alumnos matriculados.</p>
                    : Object.entries(enrolled).map(([id, data]) => (
                      <Card key={id} style={{ borderLeft: `3px solid ${C.success}` }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.textPrimary, marginBottom: 4 }}>{data.nombres}</div>
                        <div style={{ fontSize: 12, color: C.textSec }}>DNI: {data.dni}</div>
                        <div style={{ fontSize: 12, color: C.textSec }}>Grado: {data.grado}° {data.nivel}</div>
                        <div style={{ marginTop: 10 }}><Badge label={`EST-${id.substring(0,6)}`} variant="success" /></div>
                      </Card>
                    ))
                  }
                </div>

                <Divider />
                <SectionTitle>Postulaciones Rechazadas</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {Object.keys(rejected).length === 0
                    ? <p style={{ color: C.textMuted, fontStyle: 'italic', fontSize: 13 }}>No hay expedientes rechazados.</p>
                    : Object.entries(rejected).map(([id, data]) => (
                      <Card key={id} style={{ borderLeft: `3px solid ${C.danger}` }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.textPrimary, marginBottom: 4 }}>{data.nombres}</div>
                        <div style={{ fontSize: 12, color: C.textSec }}>DNI: {data.dni}</div>
                        <div style={{ fontSize: 12, color: C.dangerText, marginTop: 8, padding: '8px 10px', background: C.dangerBg, borderRadius: 7 }}>
                          Motivo: {data.motivo || "No apto según evaluación"}
                        </div>
                      </Card>
                    ))
                  }
                </div>
              </div>
            )}

            {/* ── AUDITORÍA CAJA ────────────────────────────────── */}
            {activeTab === 'auditoria_caja' && (
              <div>
                <SectionTitle sub="El sistema verifica la cuadratura diaria. Las anomalías se indican en rojo.">
                  Auditoría de Cajas
                </SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {cajasHistorial.length === 0
                    ? <p style={{ color: C.textMuted, fontStyle: 'italic', fontSize: 13 }}>No hay registros de cajas cerradas aún.</p>
                    : cajasHistorial.map(c => {
                      const isOpen = c.estado === 'Abierta'
                      const hasDiff = c.diferencia < 0
                      const borderColor = isOpen ? C.accent : hasDiff ? C.dangerText : C.successText
                      return (
                        <Card key={c.id} style={{ borderLeft: `3px solid ${borderColor}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <span style={{ fontWeight: 700, fontSize: 15 }}>Caja: {c.fecha}</span>
                            <Badge label={c.estado.toUpperCase()} variant={isOpen ? 'accent' : 'neutral'} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                            {[
                              { label: 'Apertura', val: `S/ ${c.monto_apertura.toFixed(2)}` },
                              { label: 'Recaudado (ERP)', val: `S/ ${c.recaudado_sistema.toFixed(2)}` },
                              { label: 'Cierre Físico', val: c.monto_cierre ? `S/ ${c.monto_cierre.toFixed(2)}` : 'N/A' },
                              { label: 'Diferencia', val: c.diferencia !== null ? `S/ ${c.diferencia.toFixed(2)}` : 'N/A', color: c.diferencia < 0 ? C.dangerText : c.diferencia > 0 ? C.warnText : C.successText },
                            ].map(f => (
                              <div key={f.label} style={{ background: C.surfaceHigh, padding: '10px 12px', borderRadius: 8 }}>
                                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>{f.label}</div>
                                <div style={{ fontFamily: 'monospace', fontWeight: 600, color: f.color || C.textPrimary, fontSize: 13 }}>{f.val}</div>
                              </div>
                            ))}
                          </div>
                          {c.estado === 'Cerrada' && c.reporte_ia && (
                            <div style={{ marginTop: 12, padding: '10px 14px', background: C.surfaceHigh, borderRadius: 8, borderLeft: `3px solid ${C.warnText}` }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: C.warnText, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reporte del Sistema</div>
                              <p style={{ fontSize: 13, color: C.textSec, fontStyle: 'italic', margin: 0 }}>"{c.reporte_ia}"</p>
                            </div>
                          )}
                        </Card>
                      )
                    })
                  }
                </div>
              </div>
            )}

            {/* ── CONFIGURACIÓN ─────────────────────────────────── */}
            {activeTab === 'configuracion' && (
              <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <SectionTitle sub="Administra los parámetros globales del sistema.">Configuración General</SectionTitle>
                <form onSubmit={handleSaveConfig}>
                  <Card>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Costos de Matrícula</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                      <FieldGroup label="Primaria (S/)">
                        <Input type="number" step="0.1" required value={sysConfig.primaria} onChange={e => setSysConfig({...sysConfig, primaria: e.target.value})} />
                      </FieldGroup>
                      <FieldGroup label="Secundaria (S/)">
                        <Input type="number" step="0.1" required value={sysConfig.secundaria} onChange={e => setSysConfig({...sysConfig, secundaria: e.target.value})} />
                      </FieldGroup>
                    </div>
                    <Divider style={{ margin: '0 0 20px' }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Costos de Recuperación (Verano)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                      <FieldGroup label="Recup. Primaria (S/)">
                        <Input type="number" step="0.1" required value={sysConfig.precio_recuperacion_primaria || 0} onChange={e => setSysConfig({...sysConfig, precio_recuperacion_primaria: e.target.value})} />
                      </FieldGroup>
                      <FieldGroup label="Recup. Secundaria (S/)">
                        <Input type="number" step="0.1" required value={sysConfig.precio_recuperacion_secundaria || 0} onChange={e => setSysConfig({...sysConfig, precio_recuperacion_secundaria: e.target.value})} />
                      </FieldGroup>
                    </div>
                    <Divider style={{ margin: '0 0 20px' }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cupos Máximos por Aula</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                      <FieldGroup label="Primaria (max/sección)">
                        <Input type="number" step="1" required value={sysConfig.cupos_aula_primaria || 30} onChange={e => setSysConfig({...sysConfig, cupos_aula_primaria: e.target.value})} />
                      </FieldGroup>
                      <FieldGroup label="Secundaria (max/sección)">
                        <Input type="number" step="1" required value={sysConfig.cupos_aula_secundaria || 30} onChange={e => setSysConfig({...sysConfig, cupos_aula_secundaria: e.target.value})} />
                      </FieldGroup>
                    </div>
                    <Divider style={{ margin: '0 0 20px' }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fechas del Año Escolar</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                      <FieldGroup label="Inicio Matrícula">
                        <Input type="date" value={sysConfig.inicio_matricula || ''} onChange={e => setSysConfig({...sysConfig, inicio_matricula: e.target.value})} />
                      </FieldGroup>
                      <FieldGroup label="Fin Matrícula">
                        <Input type="date" value={sysConfig.fin_matricula || ''} onChange={e => setSysConfig({...sysConfig, fin_matricula: e.target.value})} />
                      </FieldGroup>
                      <FieldGroup label="Límite Rematrícula (Morosos)">
                        <Input type="date" value={sysConfig.limite_rematricula || ''} onChange={e => setSysConfig({...sysConfig, limite_rematricula: e.target.value})} />
                      </FieldGroup>
                    </div>
                    <div style={{ padding: '10px 14px', background: C.surfaceHigh, borderRadius: 8, fontSize: 12, color: C.textSec, marginBottom: 20 }}>
                      Los precios se actualizan en tiempo real en la pasarela de Admisiones.
                    </div>
                    <Btn type="submit" variant="primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Guardar Configuración
                    </Btn>
                  </Card>
                </form>
              </div>
            )}

            {/* ── PERSONAL ──────────────────────────────────────── */}
            {activeTab === 'personal' && (
              <div style={{ width: '100%' }}>
                <div style={{ maxWidth: 760, margin: '0 auto 32px' }}>
                  <SectionTitle sub="Crea cuentas de acceso para el cuerpo docente y psicológico.">Registro de Personal</SectionTitle>
                  <Card>
                  <form onSubmit={handleCreateUser}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <FieldGroup label="Nombre de Usuario (Login)">
                        <Input type="text" required value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} placeholder="Ej: jmendoza" />
                      </FieldGroup>
                      <FieldGroup label="Contraseña">
                        <Input type="password" required value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} placeholder="••••••••" />
                      </FieldGroup>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <FieldGroup label="Rol en el Sistema">
                        <Select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value, nivel_asignado: 'PRIMARIA'})}>
                          <option value="DOCENTE">Docente (Notas)</option>
                          <option value="PSICOLOGO">Psicólogo (Evaluación Conductual)</option>
                          <option value="SECRETARIO">Secretario (Caja y Atención)</option>
                        </Select>
                      </FieldGroup>
                      {userForm.role === 'DOCENTE' && (
                        <FieldGroup label="Nivel Asignado">
                          <Select value={userForm.nivel_asignado} onChange={e => setUserForm({...userForm, nivel_asignado: e.target.value})}>
                            <option value="PRIMARIA">Primaria (Polidocente)</option>
                            <option value="SECUNDARIA">Secundaria (Especializado)</option>
                          </Select>
                        </FieldGroup>
                      )}
                    </div>

                    {/* ── Especialización multi-select (solo DOCENTE) ── */}
                    {userForm.role === 'DOCENTE' && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <Label>Especialización(es) *</Label>
                        <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 10, marginTop: 0 }}>
                          Cursos que este docente está habilitado para enseñar en nivel {userForm.nivel_asignado}.
                        </p>
                        {cursosDisponibles.length === 0 ? (
                          <div style={{ padding: '10px 14px', background: C.surfaceHigh, borderRadius: 9, fontSize: 12, color: C.textMuted, fontStyle: 'italic' }}>
                            {userForm.nivel_asignado ? 'Cargando cursos…' : 'Selecciona un nivel primero.'}
                          </div>
                        ) : (
                          <>
                            {userForm.nivel_asignado === 'PRIMARIA' && (
                              <div style={{ marginBottom: 12 }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const exclusions = ['Inglés', 'Educación Física', 'Religión'];
                                    const base = cursosDisponibles
                                      .filter(c => !exclusions.includes(c.nombre))
                                      .map(c => ({ curso_nombre: c.nombre, nivel: 'PRIMARIA' }));
                                    setEspecializaciones(base);
                                  }}
                                  style={{
                                    padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
                                    fontWeight: 700, transition: 'all 0.15s',
                                    border: `1px solid ${C.accent}`, background: C.accent, color: '#fff',
                                    display: 'inline-flex', alignItems: 'center', gap: 6
                                  }}
                                >
                                  ✨ Auto-seleccionar Cursos Base (Polidocente)
                                </button>
                              </div>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {cursosDisponibles.map(c => {
                              const sel = especializaciones.some(e => e.curso_nombre === c.nombre)
                              return (
                                <button
                                  key={c.nombre}
                                  type="button"
                                  onClick={() => {
                                    if (sel) setEspecializaciones(prev => prev.filter(e => e.curso_nombre !== c.nombre))
                                    else setEspecializaciones(prev => [...prev, { curso_nombre: c.nombre, nivel: userForm.nivel_asignado }])
                                  }}
                                  style={{
                                    padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
                                    fontWeight: 600, transition: 'all 0.15s',
                                    border: `1px solid ${sel ? C.accent : C.border}`,
                                    background: sel ? C.accentMuted : 'transparent',
                                    color: sel ? C.accent : C.textSec,
                                  }}
                                >
                                  {sel ? '✓ ' : ''}{c.nombre}
                                </button>
                              )
                            })}
                          </div>
                          </>
                        )}
                        {especializaciones.length > 0 && (
                          <div style={{ marginTop: 10, padding: '8px 12px', background: `${C.accent}12`, border: `1px solid ${C.accent}25`, borderRadius: 8, fontSize: 11, color: C.accent }}>
                            Seleccionados: {especializaciones.map(e => e.curso_nombre).join(', ')}
                          </div>
                        )}
                        {userForm.role === 'DOCENTE' && especializaciones.length === 0 && cursosDisponibles.length > 0 && (
                          <div style={{ marginTop: 8, fontSize: 11, color: C.warnText }}>⚠ Selecciona al menos un curso.</div>
                        )}
                      </div>
                    )}

                    <Btn type="submit" variant="primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                      Crear Cuenta Institucional
                    </Btn>
                  </form>
                </Card>
                </div>

                <SectionTitle>Usuarios del Sistema</SectionTitle>
                <Card noPad>
                  <div style={{ padding: '16px 20px', display: 'flex', gap: 12, borderBottom: `1px solid ${C.border}`, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={rrhhFilterNivel}
                      onChange={e => setRrhhFilterNivel(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary, fontSize: 13, minWidth: 200 }}
                    >
                      <option value="">-- Selecciona Nivel para ver Personal --</option>
                      <option value="PRIMARIA">Docentes - Primaria</option>
                      <option value="SECUNDARIA">Docentes - Secundaria</option>
                      <option value="ADMINISTRATIVO">Personal Administrativo (Psicólogo/Secretario)</option>
                    </select>
                    
                    <Input 
                      placeholder="Buscar por nombre o curso..." 
                      value={rrhhSearchQuery}
                      onChange={e => setRrhhSearchQuery(e.target.value)}
                      style={{ minWidth: 250, margin: 0 }}
                    />
                  </div>

                  {(() => {
                    if (rrhhFilterNivel === '') {
                      return (
                        <div style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>
                          <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>Selecciona un nivel en el menú desplegable superior</div>
                          <div style={{ fontSize: 12, marginTop: 4 }}>Para proteger la carga visual, el personal solo se lista por categorías.</div>
                        </div>
                      )
                    }

                    const filteredUsers = users.filter(u => {
                      // Filtrar por nivel
                      if (rrhhFilterNivel === 'ADMINISTRATIVO') {
                        if (u.role === 'DOCENTE') return false;
                      } else {
                        if (u.role !== 'DOCENTE' || u.nivel_asignado !== rrhhFilterNivel) return false;
                      }
                      
                      // Filtrar por texto (nombre o curso)
                      if (rrhhSearchQuery) {
                        const q = rrhhSearchQuery.toLowerCase();
                        const nameMatch = u.username.toLowerCase().includes(q);
                        const cursoMatch = u.especializaciones?.some(e => e.curso_nombre.toLowerCase().includes(q));
                        return nameMatch || cursoMatch;
                      }
                      return true;
                    });

                    if (filteredUsers.length === 0) {
                      return <p style={{ padding: 20, color: C.textMuted, fontSize: 13 }}>No se encontraron usuarios con esos filtros.</p>;
                    }

                    return (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.surfaceHigh }}>
                              {['Usuario', 'Rol', 'Nivel', 'Especialización(es)', 'Estado', 'Acción'].map(h => (
                                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', color: C.textMuted, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUsers.map((u, idx) => {
                              const rolColor = { DOCENTE: C.accent, PSICOLOGO: '#a78bfa', SECRETARIO: C.warnText }[u.role] || C.textSec
                              const rolVariant = { DOCENTE: 'accent', PSICOLOGO: 'warn', SECRETARIO: 'warn' }[u.role] || 'neutral'
                              return (
                                <tr key={u.id} className="admin-tr" style={{ borderBottom: `1px solid ${C.border}`, background: idx % 2 === 0 ? 'transparent' : `${C.surfaceHigh}60` }}>
                                  <td style={{ padding: '11px 16px', fontWeight: 700, color: C.textPrimary }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${rolColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <span style={{ fontSize: 12, color: rolColor, fontWeight: 800 }}>{u.username[0]?.toUpperCase()}</span>
                                      </div>
                                      {u.username}
                                    </div>
                                  </td>
                                  <td style={{ padding: '11px 16px' }}>
                                    <Badge label={u.role} variant={rolVariant} />
                                  </td>
                                  <td style={{ padding: '11px 16px', color: C.textSec, fontFamily: 'monospace', fontSize: 12 }}>{u.nivel_asignado || '—'}</td>
                                  <td style={{ padding: '11px 16px', maxWidth: 220 }}>
                                    {u.role === 'DOCENTE' && u.especializaciones?.length > 0 ? (
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {u.especializaciones.map(e => (
                                          <span key={e.curso_nombre} style={{
                                            display: 'inline-block', padding: '2px 8px', borderRadius: 5,
                                            fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.05)',
                                            border: `1px solid ${C.border}`, color: C.textSec,
                                          }}>{e.curso_nombre}</span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span style={{ color: u.role === 'DOCENTE' ? C.warnText : C.textMuted, fontSize: 12 }}>
                                        {u.role === 'DOCENTE' ? '⚠ Sin especialización' : '—'}
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: '11px 16px' }}>
                                    <Badge label={u.is_active ? 'Activo' : 'Suspendido'} variant={u.is_active ? 'success' : 'danger'} />
                                  </td>
                                  <td style={{ padding: '11px 16px' }}>
                                    <Btn size="sm" variant={u.is_active ? 'danger' : 'success'} onClick={() => handleToggleStatus(u.id)}>
                                      {u.is_active ? 'Suspender' : 'Activar'}
                                    </Btn>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )
                  })()}
                </Card>
              </div>
            )}

            {/* ── ACADÉMICO ─────────────────────────────────────── */}
            {activeTab === 'academico' && (
              <ErrorBoundary>
                <div style={{ width: '100%' }}>
                  {/* Horarios */}
                  <SectionTitle sub="Genera la grilla horaria semanal para cada sección.">Gestión de Horarios</SectionTitle>
                  <Card style={{ marginBottom: 28 }}>
                    {estadoFlujo && (
                      <div style={{ marginBottom: 16, padding: '14px', background: C.surface, borderRadius: 8, border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>Estado de Prerrequisitos:</div>
                        <div style={{ fontSize: 13, color: C.textSec, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div>✅ Docentes registrados ({estadoFlujo.docentes_activos})</div>
                          <div>
                            {estadoFlujo.primaria.listo_para_generar_horario ? '✅' : '⚠️'} Tutores Primaria ({estadoFlujo.primaria.aulas_con_tutor}/{estadoFlujo.primaria.total_aulas})
                          </div>
                          <div>
                            {estadoFlujo.secundaria.listo_para_generar_horario ? '✅' : '⚠️'} Tutores Secundaria ({estadoFlujo.secundaria.aulas_con_tutor}/{estadoFlujo.secundaria.total_aulas})
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                      <Btn variant="muted" disabled={state?.has_horario_primaria || isGenerandoPrimaria} onClick={() => handleGenerarHorarios('PRIMARIA')} style={{ width: '100%', justifyContent: 'center' }}>
                        <TrendingUp size={14} /> {isGenerandoPrimaria ? 'Se está generando su horario espere unos segundos...' : state?.has_horario_primaria ? 'Horario Generado' : 'Generar Horario Primaria'}
                      </Btn>
                      <Btn variant="primary" disabled={state?.has_horario_secundaria || isGenerandoSecundaria} onClick={() => handleGenerarHorarios('SECUNDARIA')} style={{ width: '100%', justifyContent: 'center' }}>
                        <TrendingUp size={14} /> {isGenerandoSecundaria ? 'Se está generando su horario espere unos segundos...' : state?.has_horario_secundaria ? 'Horario Generado' : 'Generar Horario Secundaria'}
                      </Btn>
                    </div>
                    {horarioWarnings.length > 0 && (
                      <div style={{ padding: '12px 14px', background: C.warnBg, border: `1px solid ${C.warn}40`, borderLeft: `3px solid ${C.warnText}`, borderRadius: 9, marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.warnText, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          ⚠ {horarioWarnings.length} advertencia(s) — cursos sin docente especializado
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                          {horarioWarnings.map((w, i) => (
                            <div key={i} style={{ fontSize: 12, color: C.warnText, fontFamily: 'monospace' }}>• {w}</div>
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 8 }}>Registra docentes con esas especializaciones y regenera el horario.</div>
                      </div>
                    )}

                    <Divider />
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 12 }}>Previsualizar por Aula</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 12 }}>
                      <Select value={horarioForm.nivel} onChange={e => { setHorarioForm({...horarioForm, nivel: e.target.value}); setPreviewMode('AULA'); setHorarioPreview([]) }}>
                        <option value="PRIMARIA">Primaria</option>
                        <option value="SECUNDARIA">Secundaria</option>
                      </Select>
                      <Select value={horarioForm.grado} onChange={e => { setHorarioForm({...horarioForm, grado: e.target.value}); setPreviewMode('AULA'); setHorarioPreview([]) }}>
                        {(horarioForm.nivel === 'PRIMARIA' ? [1,2,3,4,5,6] : [1,2,3,4,5]).map(g => <option key={g} value={g}>{g}°</option>)}
                      </Select>
                      <Select value={horarioForm.seccion} onChange={e => { setHorarioForm({...horarioForm, seccion: e.target.value}); setPreviewMode('AULA'); setHorarioPreview([]) }}>
                        <option value="A">A</option><option value="B">B</option>
                      </Select>
                      <Btn variant="ghost" onClick={fetchHorario}>Ver</Btn>
                    </div>

                    {horarioPreview.length > 0 ? (
                      <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${C.border}`, marginTop: 8 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 580 }}>
                          <thead>
                            <tr style={{ background: C.surfaceHigh }}>
                              <th style={{ padding: '10px 12px', borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontSize: 11, width: 70, textAlign: 'center', fontWeight: 600 }}>Hora</th>
                              {dias.map(d => <th key={d} style={{ padding: '10px 8px', borderBottom: `1px solid ${C.border}`, color: C.textSec, fontWeight: 600, textAlign: 'center', fontSize: 11 }}>{d}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {bloques.map((bloque, idx) => {
                              if (bloque.isRecreo) return (
                                <tr key={`r-${idx}`} style={{ background: C.surfaceHigh }}>
                                  <td style={{ padding: '6px 8px', borderRight: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10, textAlign: 'center', fontFamily: 'monospace' }}>{bloque.time}</td>
                                  <td colSpan="5" style={{ padding: '6px', textAlign: 'center', color: C.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: '0.3em' }}>{bloque.label}</td>
                                </tr>
                              )
                              return (
                                <tr key={bloque.inicio} style={{ borderBottom: `1px solid ${C.border}` }}>
                                  <td style={{ padding: '8px', borderRight: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10, textAlign: 'center', fontFamily: 'monospace' }}>
                                    {bloque.inicio}<br/>—<br/>{bloque.fin}
                                  </td>
                                  {dias.map(dia => {
                                    const clase = horarioPreview.find(h => h.dia === dia && h.hora_inicio === bloque.inicio)
                                    return (
                                      <td key={dia} style={{ padding: '6px', borderRight: `1px solid ${C.border}80`, verticalAlign: 'top' }}>
                                        {clase
                                          ? <div style={{ background: C.accentMuted, border: `1px solid ${C.accent}25`, borderRadius: 6, padding: '6px 8px', minHeight: 42 }}>
                                              <div style={{ fontWeight: 600, color: C.textPrimary, fontSize: 11, marginBottom: 2 }}>{clase.curso}</div>
                                              <div style={{ color: C.accent, fontSize: 10 }}>{previewMode === 'AULA' ? (clase.docente ? clase.docente.split(' ')[0] : 'Sin Asignar') : clase.aula}</div>
                                            </div>
                                          : <div style={{ minHeight: 42, border: `1px dashed ${C.border}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                              <span style={{ fontSize: 10, color: C.textMuted }}>—</span>
                                            </div>
                                        }
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
                      <p style={{ color: C.textMuted, fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                        Selecciona nivel, grado y sección, luego haz clic en "Ver".
                      </p>
                    )}
                  </Card>

                  {/* Cursos */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <SectionTitle>Cursos Aperturados</SectionTitle>
                    <Btn variant="primary" size="sm" onClick={() => setShowCursoModal(true)}>+ Aperturar Curso</Btn>
                  </div>

                  {cursos.length === 0
                    ? <Card><p style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No hay cursos. Haz clic en "+ Aperturar Curso" para comenzar.</p></Card>
                    : (() => {
                        const grouped = cursos.reduce((acc, c) => {
                          const key = `${c.nivel} — ${c.grado}° "${c.seccion}"`
                          if (!acc[key]) acc[key] = []
                          acc[key].push(c); return acc
                        }, {})
                        const sortedKeys = Object.keys(grouped).sort((a, b) => {
                          const lvlA = a.includes('PRIMARIA') ? 1 : 2; const lvlB = b.includes('PRIMARIA') ? 1 : 2
                          if (lvlA !== lvlB) return lvlA - lvlB; return a.localeCompare(b)
                        })
                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                            {sortedKeys.map(groupKey => (
                              <Card key={groupKey} noPad>
                                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{groupKey}</span>
                                  <Badge label={`${grouped[groupKey].length} cursos`} variant="neutral" />
                                </div>
                                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {grouped[groupKey].map((c, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: C.surfaceHigh, borderRadius: 7 }}>
                                      <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{c.nombre}</span>
                                      {c.docente_nombre
                                        ? <Badge label={`Prof. ${c.docente_nombre}`} variant="accent" />
                                        : <Badge label="Sin asignar" variant="danger" />
                                      }
                                    </div>
                                  ))}
                                </div>
                              </Card>
                            ))}
                          </div>
                        )
                      })()
                  }
                </div>
              </ErrorBoundary>
            )}



            {/* ── HORARIOS DOCENTES ─────────────────────────────── */}
            {activeTab === 'horarios_docentes' && (
              <div style={{ maxWidth: 860, margin: '0 auto' }}>
                <SectionTitle sub="Consulta la carga horaria semanal de cada docente.">Horarios por Docente</SectionTitle>
                <Card style={{ marginBottom: 24 }}>
                  <FieldGroup label="Seleccionar Docente">
                    <Select value={horarioDocenteId} onChange={e => { setHorarioDocenteId(e.target.value); setPreviewMode('DOCENTE'); setHorarioPreview([]) }}>
                      <option value="">Seleccione un profesor…</option>
                      <optgroup label="Secundaria">{docentesSecundaria.map(d => <option key={d.id} value={d.id}>{d.username}</option>)}</optgroup>
                      <optgroup label="Primaria">{docentesPrimaria.map(d => <option key={d.id} value={d.id}>{d.username}</option>)}</optgroup>
                    </Select>
                  </FieldGroup>
                  <Btn variant="primary" onClick={fetchHorario} style={{ width: '100%', justifyContent: 'center' }}>
                    Ver Horario Semanal
                  </Btn>
                </Card>

                {horarioPreview.length > 0 ? (
                  <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 580 }}>
                      <thead>
                        <tr style={{ background: C.surfaceHigh }}>
                          <th style={{ padding: '10px 12px', borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontSize: 11, width: 70, textAlign: 'center', fontWeight: 600 }}>Hora</th>
                          {dias.map(d => <th key={d} style={{ padding: '10px 8px', borderBottom: `1px solid ${C.border}`, color: C.textSec, fontWeight: 600, textAlign: 'center', fontSize: 11 }}>{d}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {bloques.map((bloque, idx) => {
                          if (bloque.isRecreo) return (
                            <tr key={`r-${idx}`} style={{ background: C.surfaceHigh }}>
                              <td style={{ padding: '6px 8px', borderRight: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10, textAlign: 'center', fontFamily: 'monospace' }}>{bloque.time}</td>
                              <td colSpan="5" style={{ padding: '6px', textAlign: 'center', color: C.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: '0.3em' }}>{bloque.label}</td>
                            </tr>
                          )
                          return (
                            <tr key={bloque.inicio} style={{ borderBottom: `1px solid ${C.border}` }}>
                              <td style={{ padding: '8px', borderRight: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10, textAlign: 'center', fontFamily: 'monospace' }}>
                                {bloque.inicio}<br/>—<br/>{bloque.fin}
                              </td>
                              {dias.map(dia => {
                                const clase = horarioPreview.find(h => h.dia === dia && h.hora_inicio === bloque.inicio)
                                return (
                                  <td key={dia} style={{ padding: '6px', borderRight: `1px solid ${C.border}80`, verticalAlign: 'top' }}>
                                    {clase
                                      ? <div style={{ background: C.accentMuted, border: `1px solid ${C.accent}25`, borderRadius: 6, padding: '6px 8px', minHeight: 46 }}>
                                          <div style={{ fontWeight: 600, color: C.textPrimary, fontSize: 11, marginBottom: 4 }}>{clase.curso}</div>
                                          <div style={{ color: C.accent, fontSize: 10 }}>{clase.aula}</div>
                                        </div>
                                      : <div style={{ minHeight: 46, border: `1px dashed ${C.border}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <span style={{ fontSize: 10, color: C.textMuted }}>—</span>
                                        </div>
                                    }
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
                  <Card>
                    <p style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                      Selecciona un docente y haz clic en "Ver Horario Semanal".
                    </p>
                  </Card>
                )}
              </div>
            )}

            {/* ── RIESGO ACADÉMICO ─────────────────────────────── */}
            {activeTab === 'riesgo' && (
              <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <SectionTitle sub="Alertas generadas por el sistema de seguimiento académico.">Riesgo Académico</SectionTitle>
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Casos Críticos — Bajo Rendimiento / Reincidencia Psicológica
                  </div>
                  {(!state?.alertas_ia || state.alertas_ia.length === 0)
                    ? <p style={{ color: C.textMuted, fontStyle: 'italic', fontSize: 13 }}>No hay alertas activas en este momento.</p>
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {state.alertas_ia.map((alerta, i) => (
                          <div key={i} style={{ padding: '14px 16px', background: C.warnBg, border: `1px solid ${C.warn}40`, borderLeft: `3px solid ${C.warnText}`, borderRadius: 10 }}>
                            <div style={{ fontWeight: 700, color: C.warnText, marginBottom: 6, fontSize: 13 }}>
                              {alerta.alumno} — {alerta.citas} citas registradas
                            </div>
                            <p style={{ fontSize: 12, color: C.textSec, fontStyle: 'italic', margin: 0 }}>"{alerta.reporte}"</p>
                            <p style={{ fontSize: 11, color: C.textMuted, marginTop: 8 }}>El apoderado fue notificado por correo automáticamente.</p>
                          </div>
                        ))}
                      </div>
                  }
                </Card>
              </div>
            )}

            {/* ── MONITOR DE RECURSOS ───────────────────────────── */}
            {activeTab === 'ia' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
                {/* Métricas */}
                <div>
                  <SectionTitle>Métricas del Sistema</SectionTitle>
                  {telemetry ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        { label: 'Llamadas Totales', val: telemetry.calls, color: C.accent },
                        { label: 'Tasa de Éxito', val: `${telemetry.calls > 0 ? Math.round((telemetry.success_calls/telemetry.calls)*100) : 0}%`, color: C.successText },
                      ].map(m => (
                        <Card key={m.label}>
                          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                          <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>{m.val}</div>
                        </Card>
                      ))}
                      <Card>
                        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tokens Consumidos</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 24, fontWeight: 800, color: C.textPrimary }}>{telemetry.total_tokens?.toLocaleString()}</span>
                          <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>{telemetry.token_percentage?.toFixed(2)}%</span>
                        </div>
                        <div style={{ height: 4, background: C.surfaceHigh, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 4, transition: 'width 1s ease',
                            width: `${Math.min(telemetry.token_percentage || 0, 100)}%`,
                            background: telemetry.token_percentage > 90 ? C.dangerText : telemetry.token_percentage > 75 ? C.warnText : C.accent,
                          }} />
                        </div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, textAlign: 'right' }}>Cuota: {telemetry.tokens_quota?.toLocaleString()}</div>
                      </Card>
                    </div>
                  ) : <p style={{ color: C.textMuted, fontSize: 13 }}>Cargando métricas…</p>}
                </div>


              </div>
            )}

            {/* ── ANÁLISIS DE DATOS ─────────────────────────────── */}
            {activeTab === 'bi_analytics' && (
              <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <SectionTitle sub="Haz preguntas en lenguaje natural sobre la base de datos del colegio.">Análisis de Datos</SectionTitle>
                <Card>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <Input
                      type="text" value={biQuery} onChange={e => setBiQuery(e.target.value)}
                      placeholder="Ej: ¿Qué % de alumnos tienen alertas psicológicas de nivel Alto?"
                      style={{ flex: 1 }}
                    />
                    <Btn variant="primary" onClick={handleBiQuery} disabled={loadingBi} style={{ whiteSpace: 'nowrap' }}>
                      {loadingBi ? 'Procesando…' : 'Consultar'}
                    </Btn>
                  </div>
                  {biResponse && (
                    <div style={{ padding: '16px', background: C.surfaceHigh, borderRadius: 10, borderLeft: `3px solid ${C.accent}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Respuesta</div>
                      <div style={{ fontSize: 13, color: C.textSec, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{biResponse}</div>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* ── FIN DE AÑO ────────────────────────────────────── */}
            {activeTab === 'cierre' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 500 }}>
                <Card style={{ maxWidth: 520, width: '100%', textAlign: 'center', border: `1px solid ${C.danger}40` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.dangerText, marginBottom: 8 }}>Fin de Año Escolar</div>
                  <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
                    Al ejecutar el cierre, el sistema calculará el promedio final de cada alumno, determinará aprobados y reprobados, y enviará reportes académicos por correo a los padres.
                  </p>
                  
                  {estadoFlujo && estadoFlujo.cierre_escolar && estadoFlujo.cierre_escolar.cursos_sin_notas.length > 0 && (
                    <div style={{ padding: '12px 16px', background: C.warnBg, border: `1px solid ${C.warnText}40`, borderRadius: 9, fontSize: 13, color: C.warnText, textAlign: 'left', marginBottom: 20 }}>
                      <strong style={{ display: 'block', marginBottom: 6 }}>Advertencia:</strong> Hay cursos sin ninguna nota registrada. Si ejecutas el cierre, los alumnos en estos cursos tendrán promedio 0 (jalados):
                      <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                        {estadoFlujo.cierre_escolar.cursos_sin_notas.map(c => <li key={c}>{c}</li>)}
                      </ul>
                    </div>
                  )}
                  <div style={{ padding: '12px 16px', background: C.dangerBg, border: `1px solid ${C.danger}40`, borderRadius: 9, fontSize: 12, color: C.dangerText, textAlign: 'left', marginBottom: 24, fontWeight: 600 }}>
                    ⚠ Esta acción es irreversible. Borrará todos los horarios y liberará a todos los tutores.
                  </div>
                  <button onClick={async () => {
                    if(confirm('¿ESTÁ ABSOLUTAMENTE SEGURO? Se procesarán notas, se enviarán correos reales y se borrarán horarios y tutores.')) {
                      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/cierre_escolar`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
                      const data = await res.json()
                      alert(data.message); fetchData()
                    }
                  }} style={{
                    width: '100%', padding: '14px', borderRadius: 10, border: `1px solid ${C.dangerText}50`,
                    background: C.dangerBg, color: C.dangerText, cursor: 'pointer', fontSize: 14,
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.15s',
                  }}>
                    Ejecutar Cierre de Año Escolar
                  </button>
                </Card>
              </div>
            )}

            {/* ── ASIGNADOR IA ─────────────────────────────────── */}
            {activeTab === 'asignador_ia' && (
              <div style={{ maxWidth: 720, margin: '0 auto' }}>
                <SectionTitle sub="El sistema distribuye a los docentes de secundaria equitativamente entre las aulas.">
                  Asignación Automática de Tutores
                </SectionTitle>
                <Card>
                  <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                    Se analizarán los perfiles de docentes disponibles y se les asignará la tutoría principal del año escolar de forma óptima, sin repeticiones.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Btn variant="primary" onClick={handleRunSmartMatch} disabled={isMatching} style={{ width: '100%', justifyContent: 'center' }}>
                      {isMatching ? 'Procesando secundaria…' : 'Ejecutar Asignación de Secundaria'}
                    </Btn>
                    <Btn onClick={handleAssignAndSavePrimaria} disabled={isAssigningPrimaria} style={{ width: '100%', justifyContent: 'center', background: '#10b981' }}>
                      {isAssigningPrimaria ? 'Procesando primaria…' : 'Ejecutar Asignación de Primaria'}
                    </Btn>
                  </div>

                  {matchResult && (
                    <div style={{ marginTop: 24 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resultados</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {matchResult.map((match, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: C.surfaceHigh, borderRadius: 9 }}>
                            <Badge label={`Aula: ${match.classroom_id}`} variant="neutral" />
                            <span style={{ color: C.textMuted, fontSize: 12 }}>→</span>
                            <Badge label={`Tutor ID: ${match.teacher_id}`} variant="accent" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* ── SÍLABOS ──────────────────────────────────────── */}
            {activeTab === 'silabos_ia' && (
              <div style={{ maxWidth: 860, margin: '0 auto' }}>
                <SectionTitle sub="Generación automatizada · Currículo Nacional 2019">Gestor de Sílabos</SectionTitle>

                {/* Pipeline visual */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 28, overflowX: 'auto' }}>
                  {['Contexto', 'Competencias', 'Cronograma', 'Evaluación', 'Validación', 'Registro'].map((node, i, arr) => (
                    <React.Fragment key={node}>
                      <div style={{ flex: 1, minWidth: 90, padding: '8px 10px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, lineHeight: 1.4 }}>{node}</div>
                      </div>
                      {i < arr.length - 1 && <div style={{ alignSelf: 'center', color: C.textMuted, fontSize: 12 }}>›</div>}
                    </React.Fragment>
                  ))}
                </div>

                {/* Generación por grado */}
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Generación por Grado</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, marginBottom: 14 }}>
                    <div>
                      <Label>Nivel</Label>
                      <Select value={silaboGenNivel} onChange={e => { setSilaboGenNivel(e.target.value); setSilaboGenGrado(1) }}>
                        <option value="PRIMARIA">Primaria (1° – 6°)</option>
                        <option value="SECUNDARIA">Secundaria (1° – 5°)</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Grado</Label>
                      <Select value={silaboGenGrado} onChange={e => setSilaboGenGrado(Number(e.target.value))}>
                        {(silaboGenNivel === 'PRIMARIA' ? [1,2,3,4,5,6] : [1,2,3,4,5]).map(g => <option key={g} value={g}>{g}° Grado</option>)}
                      </Select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <Btn variant="primary" disabled={silaboGenLoading || silaboGenTodosLoading} onClick={async () => {
                        setSilaboGenLoading(true); setSilaboGenResultados(null)
                        const fases = ['Marco curricular','Competencias','Cronograma','Evaluación','Validación','Persistencia']
                        let fi = 0; setSilaboGenFase(fases[0])
                        const t = setInterval(() => { fi = Math.min(fi+1, fases.length-1); setSilaboGenFase(fases[fi]) }, 5000)
                        try {
                          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deep-agents/silabo/generar-grado`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ nivel: silaboGenNivel, grado: silaboGenGrado, anno_escolar: '2025' })
                          })
                          const data = await res.json(); setSilaboGenResultados(data)
                        } finally { clearInterval(t); setSilaboGenLoading(false); setSilaboGenFase('') }
                      }}>
                        {silaboGenLoading ? 'Generando…' : 'Generar'}
                      </Btn>
                    </div>
                  </div>

                  {silaboGenLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: C.surfaceHigh, borderRadius: 9 }}>
                      <div style={{ width: 14, height: 14, border: `2px solid ${C.accent}30`, borderTop: `2px solid ${C.accent}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <div>
                        <div style={{ fontSize: 12, color: C.textSec, fontWeight: 600 }}>Procesando</div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>{silaboGenFase}</div>
                      </div>
                    </div>
                  )}

                  {silaboGenResultados && !silaboGenLoading && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{silaboGenNivel} {silaboGenGrado}°</span>
                        <Badge label={`${silaboGenResultados.generados}/${silaboGenResultados.total_areas} generados`} variant="success" />
                        {silaboGenResultados.fallidos > 0 && <Badge label={`${silaboGenResultados.fallidos} fallidos`} variant="danger" />}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6 }}>
                        {silaboGenResultados.detalle?.map((d, i) => (
                          <div key={i} style={{ padding: '8px 10px', background: C.surfaceHigh, borderRadius: 7, fontSize: 11, color: d.status === 'OK' ? C.successText : C.dangerText, border: `1px solid ${d.status === 'OK' ? C.success : C.danger}30` }}>
                            <span style={{ fontWeight: 700 }}>{d.status === 'OK' ? '✓' : '✗'}</span> {d.area}
                            {d.status === 'OK' && <span style={{ color: C.textMuted, marginLeft: 4 }}>#{d.silabo_id}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Generación masiva */}
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Generación Masiva — Todos los Grados</div>
                  <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 16, lineHeight: 1.6 }}>
                    Genera sílabos para <strong style={{ color: C.textSec }}>todos</strong> los grados de Primaria y Secundaria en paralelo. Esta operación puede tardar varios minutos.
                  </p>
                  <Btn variant="primary" disabled={silaboGenTodosLoading || silaboGenLoading} style={{ width: '100%', justifyContent: 'center' }}
                    onClick={async () => {
                      if (!window.confirm('Iniciará la generación masiva para TODOS los grados. ¿Continuar?')) return
                      setSilaboGenTodosLoading(true); setSilaboGenTodosResult(null)
                      try {
                        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deep-agents/silabo/generar-todos?anno_escolar=2025`, {
                          method: 'POST', headers: { Authorization: `Bearer ${token}` }
                        })
                        const data = await res.json(); setSilaboGenTodosResult(data)
                      } finally { setSilaboGenTodosLoading(false) }
                    }}>
                    {silaboGenTodosLoading
                      ? <><div style={{ width: 14, height: 14, border: `2px solid #ffffff30`, borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Generando todos los sílabos…</>
                      : 'Generar Sílabos para Todo el Colegio'
                    }
                  </Btn>

                  {silaboGenTodosResult && !silaboGenTodosLoading && (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        <Badge label={`Total: ${silaboGenTodosResult.total_combinaciones}`} variant="neutral" />
                        <Badge label={`Generados: ${silaboGenTodosResult.generados}`} variant="success" />
                        {silaboGenTodosResult.fallidos > 0 && <Badge label={`Fallidos: ${silaboGenTodosResult.fallidos}`} variant="danger" />}
                      </div>
                      <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {silaboGenTodosResult.detalle?.map((d, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: C.surfaceHigh, borderRadius: 7, fontSize: 11, color: d.status === 'OK' ? C.successText : C.dangerText }}>
                            <span style={{ fontWeight: 700 }}>{d.status === 'OK' ? '✓' : '✗'}</span>
                            <span style={{ color: C.textSec, fontWeight: 600 }}>{d.nivel} {d.grado}°</span>
                            <span style={{ flex: 1, color: C.textMuted }}>{d.area}</span>
                            {d.status === 'OK' && <span style={{ color: C.textMuted }}>#{d.silabo_id}</span>}
                            {d.error && <span style={{ color: C.dangerText, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.error}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

          </div>
        </div>
      </main>

      <ChatWidget roleName="Asistente Directivo" />

      {/* ── Modal Aperturar Curso ─────────────────────────────────── */}
      {showCursoModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '2rem', maxWidth: 440, width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setShowCursoModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: C.textSec, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, marginBottom: 20 }}>Aperturar Nuevo Curso</div>
            <form onSubmit={handleCrearCurso}>
              <FieldGroup label="Nombre del Curso">
                <Input type="text" required placeholder="Ej: Matemática Avanzada" value={cursoForm.nombre} onChange={e => setCursoForm({...cursoForm, nombre: e.target.value})} />
              </FieldGroup>
              <FieldGroup label="Nivel">
                <Select value={cursoForm.nivel} onChange={e => { const n = e.target.value; setCursoForm({...cursoForm, nivel: n}); setGradosSeleccionados(GRADOS[n]) }}>
                  <option value="PRIMARIA">Primaria</option>
                  <option value="SECUNDARIA">Secundaria</option>
                </Select>
              </FieldGroup>
              <div style={{ marginBottom: 20 }}>
                <Label>Grados aplicables</Label>
                <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>Destilda los que no apliquen.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {GRADOS[cursoForm.nivel].map(g => (
                    <label key={g} style={{
                      display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                      padding: '8px 12px', borderRadius: 8,
                      background: gradosSeleccionados.includes(g) ? C.accentMuted : C.surfaceHigh,
                      border: `1px solid ${gradosSeleccionados.includes(g) ? C.accent : C.border}`,
                      color: gradosSeleccionados.includes(g) ? C.accent : C.textSec,
                      fontSize: 13, fontWeight: 600,
                    }}>
                      <input type="checkbox" checked={gradosSeleccionados.includes(g)} onChange={() => {
                        setGradosSeleccionados(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g].sort((a,b) => a-b))
                      }} style={{ accentColor: C.accent }} />
                      {g}°
                    </label>
                  ))}
                </div>
                {gradosSeleccionados.length === 0 && <p style={{ fontSize: 11, color: C.dangerText, marginTop: 8 }}>Selecciona al menos un grado.</p>}
              </div>
              <Btn type="submit" variant="primary" disabled={gradosSeleccionados.length === 0} style={{ width: '100%', justifyContent: 'center' }}>
                {gradosSeleccionados.length > 0 ? `Aplicar a ${gradosSeleccionados.length} grado${gradosSeleccionados.length > 1 ? 's' : ''}` : 'Selecciona al menos un grado'}
              </Btn>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
        *::-webkit-scrollbar { width: 5px; height: 5px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        optgroup { background: #13131e; color: #8b8fa8; }
        option { background: #13131e; color: #e8e9f0; }
        .admin-tr { transition: background 0.12s; }
        .admin-tr:hover { background: rgba(79,110,247,0.04) !important; }
      `}</style>
    </div>
  )
}

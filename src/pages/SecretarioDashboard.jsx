import { useState, useEffect, useRef } from 'react'
import useAuthStore from '../store/useAuthStore'
import ChatWidget from '../components/ChatWidget'
import { Wallet, Mail, Camera, Send, LogOut, Users, CheckCircle, XCircle } from 'lucide-react'

export default function SecretarioDashboard() {
  const { token, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('caja')
  
  // Caja State
  const [estadoCaja, setEstadoCaja] = useState('Cargando...')
  const [cajaInfo, setCajaInfo] = useState(null)
  const [transacciones, setTransacciones] = useState([])
  const [apertura, setApertura] = useState('')
  const [cierre, setCierre] = useState('')
  const [alertaCierre, setAlertaCierre] = useState(null)

  // Transaccion State
  const [matriculaDirecta, setMatriculaDirecta] = useState({
    nombres: '', apellidos: '', dni: '', nivel: 'Primaria', grado: '1', seccion: 'A',
    ap_nombre: '', ap_dni: '', ap_correo: '', ap_telefono: '',
    metodo: 'Efectivo', monto: '300.00', efectivoRecibido: ''
  })
  
  const [cobroModal, setCobroModal] = useState({ open: false, admisionId: null, nombres: '', monto: 300, metodo: 'Efectivo', efectivoRecibido: '' })
  
  // OCR State
  const [isReadingVoucher, setIsReadingVoucher] = useState(false)
  

  // Alumnos
  const [alumnos, setAlumnos] = useState([])

  // Admisiones State
  const [admisiones, setAdmisiones] = useState([])
  
  // Matricula State
  const [searchDni, setSearchDni] = useState('')
  const [matriculaPendiente, setMatriculaPendiente] = useState(null)
  const [pagoMatriculaForm, setPagoMatriculaForm] = useState({ metodo: 'Efectivo', monto: '' })
  
  // Recuperación Vacacional State
  const [alumnosRecuperacion, setAlumnosRecuperacion] = useState([])
  const [recuperacionForm, setRecuperacionForm] = useState({
    alumno_id: '',
    curso: '',
    calificacion: '',
    resultado: 'aprobado',
    monto_pago: '',
    metodo_pago: 'Efectivo'
  })

  const fetchAdmisiones = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secretaria/admisiones`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setAdmisiones(data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchRecuperacion = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secretaria/alumnos/recuperacion`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAlumnosRecuperacion(data)
      }
    } catch(e) {
      console.error(e)
    }
  }

  const handleBuscarMatricula = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secretaria/matriculas/pendientes?dni=${searchDni}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if(res.ok) {
        const data = await res.json()
        setMatriculaPendiente(data)
        setPagoMatriculaForm(prev => ({ ...prev, monto: data.monto_total || '' }))
      } else {
        alert("No se encontró matrícula pendiente para este DNI.")
        setMatriculaPendiente(null)
      }
    } catch(e) {
      console.error(e)
    }
  }

  const handlePagarMatricula = async (e) => {
    e.preventDefault()
    if(estadoCaja !== 'Abierta') {
       alert("Debes abrir la caja primero.")
       return
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secretaria/matricular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          matricula_id: matriculaPendiente.id,
          alumno_id: matriculaPendiente.alumno_id,
          metodo_pago: pagoMatriculaForm.metodo,
          monto: parseFloat(pagoMatriculaForm.monto)
        })
      })
      if (res.ok) {
        alert("Matrícula pagada y registrada exitosamente.")
        setMatriculaPendiente(null)
        setSearchDni('')
        fetchCaja()
      } else {
        const err = await res.json()
        alert(err.detail || "Error al registrar la matrícula.")
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleRegistrarRecuperacion = async (e) => {
    e.preventDefault()
    if(estadoCaja !== 'Abierta') {
       alert("Debes abrir la caja primero.")
       return
    }
    if(!recuperacionForm.alumno_id || !recuperacionForm.curso || recuperacionForm.alumno_id === '|') {
       alert("Selecciona un alumno y curso.")
       return
    }
    try {
      // The API expects: curso_recuperacion_id, nota, aprobado, metodo_pago, monto_pago
      // Let's find the curso_id
      const alumno = alumnosRecuperacion.find(a => a.id === parseInt(recuperacionForm.alumno_id))
      const cursoData = alumno?.cursos_pendientes.find(c => c.nombre_curso === recuperacionForm.curso)
      if(!cursoData) {
         alert("Curso no encontrado en los datos.")
         return
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secretaria/recuperacion/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          curso_recuperacion_id: cursoData.curso_recuperacion_id,
          nota: recuperacionForm.calificacion,
          aprobado: recuperacionForm.resultado === 'aprobado',
          metodo_pago: recuperacionForm.metodo_pago,
          monto_pago: parseFloat(recuperacionForm.monto_pago)
        })
      })
      if (res.ok) {
        alert("Recuperación registrada exitosamente")
        setRecuperacionForm({
          alumno_id: '',
          curso: '',
          calificacion: '',
          resultado: 'aprobado',
          monto_pago: '',
          metodo_pago: 'Efectivo'
        })
        fetchRecuperacion()
        fetchCaja()
      } else {
        const error = await res.json()
        alert(error.detail || "Error registrando recuperación")
      }
    } catch (e) {
      console.error(e)
      alert("Error registrando recuperación")
    }
  }

  const handleCambiarEstadoAdmision = async (id, estado) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secretaria/admisiones/${id}/estado?estado=${estado}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        alert(`Estado cambiado a ${estado} exitosamente.`)
        fetchAdmisiones()
      } else {
        const err = await res.json()
        alert(err.detail)
      }
    } catch (e) {
      console.error(e)
      alert('Error cambiando estado')
    }
  }


  useEffect(() => {
    fetchCaja()
    fetchAdmisiones()
    // Trick to get all students, using a dummy filter or an endpoint we already have
    // We can fetch from an admin endpoint for now
  }, [token])

  const fetchCaja = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secretaria/caja/estado`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setEstadoCaja(data.estado)
      setCajaInfo(data.caja)
      setTransacciones(data.transacciones)
    } catch (e) {
      console.error(e)
    }
  }

  const handleAbrirCaja = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secretaria/caja/abrir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ monto_apertura: parseFloat(apertura) })
      })
      if(res.ok) {
        alert("Caja abierta exitosamente.")
        fetchCaja()
      } else {
        const error = await res.json()
        alert(error.detail)
      }
    } catch (e) { console.error(e) }
  }

  const handleCerrarCaja = async (e) => {
    e.preventDefault()
    if(!window.confirm("¿Seguro que deseas cerrar la caja del día?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secretaria/caja/cerrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ monto_cierre: parseFloat(cierre) })
      })
      const data = await res.json()
      if(res.ok) {
        setAlertaCierre(data)
        fetchCaja()
      } else {
        alert(data.detail)
      }
    } catch (e) { console.error(e) }
  }

  const handleMatriculaDirecta = async (e) => {
    e.preventDefault()
    if(estadoCaja !== 'Abierta') { alert("Abre la caja primero."); return }
    
    // Calcular vuelto
    if(matriculaDirecta.metodo === 'Efectivo') {
       if (parseFloat(matriculaDirecta.efectivoRecibido || 0) < parseFloat(matriculaDirecta.monto)) {
           alert("El efectivo recibido es menor al monto a cobrar.")
           return
       }
    }
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secretaria/matricula_directa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(matriculaDirecta)
      })
      if(res.ok) {
        const vuelto = matriculaDirecta.metodo === 'Efectivo' ? parseFloat(matriculaDirecta.efectivoRecibido) - parseFloat(matriculaDirecta.monto) : 0
        if(vuelto > 0) alert(`Matrícula registrada exitosamente.
Vuelto a entregar: S/ ${vuelto.toFixed(2)}`)
        else alert("Matrícula registrada exitosamente.")
        
        setMatriculaDirecta({
          nombres: '', apellidos: '', dni: '', nivel: 'Primaria', grado: '1', seccion: 'A',
          ap_nombre: '', ap_dni: '', ap_correo: '', ap_telefono: '',
          metodo: 'Efectivo', monto: '300.00', efectivoRecibido: ''
        })
        fetchCaja()
        fetchAdmisiones()
      } else {
        const err = await res.json()
        alert(err.detail)
      }
    } catch(e) { console.error(e) }
  }

  const handleCobroModalSubmit = async (e) => {
    e.preventDefault()
    if(estadoCaja !== 'Abierta') { alert("Abre la caja primero."); return }
    if(cobroModal.metodo === 'Efectivo' && parseFloat(cobroModal.efectivoRecibido || 0) < parseFloat(cobroModal.monto)) {
       alert("Efectivo insuficiente.")
       return
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secretaria/admisiones/${cobroModal.admisionId}/cobrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
           monto: parseFloat(cobroModal.monto),
           metodo: cobroModal.metodo
        })
      })
      if(res.ok) {
        const vuelto = cobroModal.metodo === 'Efectivo' ? parseFloat(cobroModal.efectivoRecibido) - parseFloat(cobroModal.monto) : 0
        if(vuelto > 0) alert(`Cobro exitoso.
Vuelto a entregar: S/ ${vuelto.toFixed(2)}`)
        else alert("Cobro exitoso.")
        setCobroModal({ ...cobroModal, open: false })
        fetchCaja()
        fetchAdmisiones()
      } else {
        const err = await res.json()
        alert(err.detail)
      }
    } catch(e) { console.error(e) }
  }

  const handleVoucherOCR = async (e) => {
    const file = e.target.files[0]
    if(!file) return
    setIsReadingVoucher(true)
    const formData = new FormData()
    formData.append("file", file)
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secretaria/caja/leer_voucher`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if(res.ok) {
        setTxForm(prev => ({
          ...prev, 
          monto: data.monto || '', 
          concepto: data.nro_operacion ? `Pago con Transferencia / Op: ${data.nro_operacion}` : 'Pago por Transferencia',
          metodo: 'Transferencia'
        }))
        alert("Voucher procesado correctamente.")
      } else {
        alert(data.detail)
      }
    } catch (e) {
      alert("Error leyendo voucher: " + e.message)
    } finally {
      setIsReadingVoucher(false)
    }
  }



  const TabButton = ({ id, label, icon }) => (
    <button 
      onClick={() => { setActiveTab(id); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === id ? 'bg-yellow-600/20 text-yellow-500 border border-yellow-500/30 shadow-[0_0_15px_rgba(202,138,4,0.2)]' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-white/5'}`}
    >
      <div className={`p-2 rounded-lg ${activeTab === id ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-slate-400'}`}>
        {icon}
      </div>
      <span className="text-sm text-left">{label}</span>
    </button>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-hidden flex relative">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
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
          <TabButton id="caja" label="Caja" icon={<Wallet className="w-4 h-4" />} />
          <TabButton id="admisiones" label="Admisiones" icon={<Users className="w-4 h-4" />} />
          <TabButton id="matricula" label="Matrícula Presencial" icon={<CheckCircle className="w-4 h-4" />} />
          <TabButton id="recuperacion" label="Recuperación Vacacional" icon={<CheckCircle className="w-4 h-4" />} />
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
            {activeTab === 'caja' && (
              <div className="animate-fade-in-up grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Estado Actual</h2>
                    
                    {estadoCaja === 'Cargando...' ? <p>Cargando...</p> : 
                     estadoCaja === 'Cerrada' ? (
                      <form onSubmit={handleAbrirCaja} className="space-y-4">
                        <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-xl text-center">
                          <p className="text-red-400 font-bold mb-2">CAJA CERRADA</p>
                          <p className="text-xs text-slate-400 mb-4">Abre la caja para empezar a recibir pagos físicos.</p>
                          <input required type="number" step="0.01" value={apertura} onChange={e=>setApertura(e.target.value)} placeholder="Fondo Inicial (S/)" className="w-full bg-black/50 border border-slate-700 rounded-lg p-3 text-white text-center focus:border-emerald-500 outline-none mb-4" />
                          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all">Abrir Caja</button>
                        </div>
                      </form>
                    ) : (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl">
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-emerald-400 font-bold flex items-center gap-2"><span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></span> CAJA ABIERTA</span>
                        </div>
                        <div className="space-y-2 mb-6 text-sm text-slate-300">
                          <div className="flex justify-between"><span className="text-slate-500">Fondo Inicial:</span> <span className="font-mono">S/ {cajaInfo?.monto_apertura.toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Recaudado hoy:</span> <span className="font-mono text-emerald-300">S/ {cajaInfo?.recaudado_sistema.toFixed(2)}</span></div>
                          <div className="flex justify-between font-bold border-t border-white/10 pt-2"><span className="text-white">Total Esperado:</span> <span className="font-mono text-xl">S/ {((cajaInfo?.monto_apertura || 0) + (cajaInfo?.recaudado_sistema || 0)).toFixed(2)}</span></div>
                        </div>
                        
                        <form onSubmit={handleCerrarCaja} className="mt-8 pt-6 border-t border-slate-700/50 space-y-4">
                          <p className="text-xs text-slate-400 text-center">Para cerrar, cuenta el dinero físico e ingresa el monto total.</p>
                          <input required type="number" step="0.01" value={cierre} onChange={e=>setCierre(e.target.value)} placeholder="Dinero físico contado (S/)" className="w-full bg-black/50 border border-slate-700 rounded-lg p-3 text-white text-center font-mono focus:border-red-500 outline-none" />
                          <button type="submit" className="w-full bg-red-600/80 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-all border border-red-500/50">Realizar Cierre de Caja</button>
                        </form>
                      </div>
                    )}
                    
                    {alertaCierre && (
                      <div className="mt-6 bg-slate-900 border border-slate-700 p-4 rounded-xl">
                        <h3 className="font-bold text-sm text-white mb-2">Auditoría de Cierre:</h3>
                        <p className={`text-xs ${alertaCierre.diferencia < 0 ? 'text-red-400' : 'text-emerald-400'}`}>Diferencia: S/ {alertaCierre.diferencia.toFixed(2)}</p>
                        <p className="text-xs text-slate-400 mt-2 italic">"{alertaCierre.reporte}"</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-xl">
                    <div className="flex justify-between items-start mb-6">
                      <h2 className="text-xl font-bold">Crear Admisión / Matrícula Directa</h2>
                      
                      <div className="relative">
                        <input type="file" id="voucher" accept="image/*" className="hidden" onChange={handleVoucherOCR} />
                        <label htmlFor="voucher" className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-bold flex gap-2 items-center transition-all ${isReadingVoucher ? 'bg-slate-700 text-slate-400' : 'bg-yellow-600 hover:bg-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(202,138,4,0.3)]'}`}>
                          {isReadingVoucher ? "Procesando..." : <><Camera className="w-4 h-4"/> Procesar Voucher</>}
                        </label>
                      </div>
                    </div>
                    
                    
                    <form onSubmit={handleMatriculaDirecta} className="grid grid-cols-2 gap-4">
                      <div className="col-span-2"><h3 className="text-yellow-500 font-bold text-sm border-b border-white/10 pb-2">Datos del Estudiante</h3></div>
                      
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs text-slate-400 mb-1">DNI del Alumno</label>
                        <input required type="text" maxLength="8" value={matriculaDirecta.dni} onChange={e=>setMatriculaDirecta({...matriculaDirecta, dni: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-2 text-white text-sm" />
                      </div>
                      <div className="col-span-2 md:col-span-1 flex gap-2">
                         <div className="w-1/2">
                           <label className="block text-xs text-slate-400 mb-1">Nivel</label>
                           <select required value={matriculaDirecta.nivel} onChange={e=>setMatriculaDirecta({...matriculaDirecta, nivel: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-2 text-white text-sm"><option>Primaria</option><option>Secundaria</option></select>
                         </div>
                         <div className="w-1/4">
                           <label className="block text-xs text-slate-400 mb-1">Grado</label>
                           <select required value={matriculaDirecta.grado} onChange={e=>setMatriculaDirecta({...matriculaDirecta, grado: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-2 text-white text-sm"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select>
                         </div>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs text-slate-400 mb-1">Nombres</label>
                        <input required type="text" value={matriculaDirecta.nombres} onChange={e=>setMatriculaDirecta({...matriculaDirecta, nombres: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-2 text-white text-sm" />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs text-slate-400 mb-1">Apellidos</label>
                        <input required type="text" value={matriculaDirecta.apellidos} onChange={e=>setMatriculaDirecta({...matriculaDirecta, apellidos: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-2 text-white text-sm" />
                      </div>

                      <div className="col-span-2 mt-4"><h3 className="text-yellow-500 font-bold text-sm border-b border-white/10 pb-2">Datos del Apoderado</h3></div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs text-slate-400 mb-1">Nombre Completo</label>
                        <input required type="text" value={matriculaDirecta.ap_nombre} onChange={e=>setMatriculaDirecta({...matriculaDirecta, ap_nombre: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-2 text-white text-sm" />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs text-slate-400 mb-1">DNI Apoderado</label>
                        <input required type="text" maxLength="8" value={matriculaDirecta.ap_dni} onChange={e=>setMatriculaDirecta({...matriculaDirecta, ap_dni: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-2 text-white text-sm" />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs text-slate-400 mb-1">Correo Electrónico</label>
                        <input required type="email" value={matriculaDirecta.ap_correo} onChange={e=>setMatriculaDirecta({...matriculaDirecta, ap_correo: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-2 text-white text-sm" />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs text-slate-400 mb-1">Teléfono</label>
                        <input required type="text" value={matriculaDirecta.ap_telefono} onChange={e=>setMatriculaDirecta({...matriculaDirecta, ap_telefono: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-2 text-white text-sm" />
                      </div>

                      <div className="col-span-2 mt-4"><h3 className="text-emerald-500 font-bold text-sm border-b border-white/10 pb-2">Cobro de Matrícula</h3></div>
                      
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs text-slate-400 mb-1">Método de Pago</label>
                        <select required disabled={estadoCaja !== 'Abierta'} value={matriculaDirecta.metodo} onChange={e=>setMatriculaDirecta({...matriculaDirecta, metodo: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none disabled:opacity-50">
                          <option value="Efectivo">Efectivo</option>
                          <option value="Yape">Yape / Plin</option>
                          <option value="Transferencia">Transferencia Bancaria</option>
                        </select>
                      </div>
                      
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs text-slate-400 mb-1">Monto a Cobrar (S/)</label>
                        <input required disabled={estadoCaja !== 'Abierta'} type="number" step="0.01" value={matriculaDirecta.monto} onChange={e=>setMatriculaDirecta({...matriculaDirecta, monto: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white font-mono focus:border-emerald-500 outline-none disabled:opacity-50" />
                      </div>

                      {matriculaDirecta.metodo === 'Efectivo' && (
                         <div className="col-span-2 bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
                            <div>
                               <label className="block text-xs text-emerald-400 mb-1 font-bold">Efectivo Recibido (S/)</label>
                               <input required type="number" step="0.01" value={matriculaDirecta.efectivoRecibido} onChange={e=>setMatriculaDirecta({...matriculaDirecta, efectivoRecibido: e.target.value})} className="w-40 bg-black/50 border border-emerald-700 rounded-lg p-2 text-emerald-400 font-mono focus:border-emerald-400 outline-none" placeholder="Ej: 50.00"/>
                            </div>
                            <div className="text-right">
                               <span className="text-xs text-slate-400">Vuelto a entregar:</span><br/>
                               <span className="font-mono font-bold text-xl text-emerald-400">
                                 S/ {Math.max(0, (parseFloat(matriculaDirecta.efectivoRecibido || 0) - parseFloat(matriculaDirecta.monto || 0))).toFixed(2)}
                               </span>
                            </div>
                         </div>
                      )}

                      <div className="col-span-2 flex justify-end mt-2">
                        <button disabled={estadoCaja !== 'Abierta'} type="submit" className="px-8 py-3 bg-yellow-600 text-slate-950 rounded-xl font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(202,138,4,0.3)]">
                          Matricular y Cobrar
                        </button>
                      </div>
                    </form>

                  </div>

                  <div className="bg-slate-900 border border-white/10 rounded-3xl p-8">
                    <h3 className="font-bold text-slate-400 mb-4">Últimas Transacciones (Hoy)</h3>
                    {transacciones.length === 0 ? (
                      <p className="text-slate-600 text-sm italic text-center py-8">No hay transacciones registradas aún.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-white/10 text-slate-500">
                              <th className="pb-3">Hora</th>
                              <th className="pb-3">Concepto</th>
                              <th className="pb-3">Método</th>
                              <th className="pb-3 text-right">Monto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transacciones.map(t => (
                              <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-3 text-slate-400">{t.fecha_hora}</td>
                                <td className="py-3 text-slate-200">{t.concepto}</td>
                                <td className="py-3 text-slate-400">
                                  <span className={`px-2 py-1 rounded text-xs ${t.metodo === 'Efectivo' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                    {t.metodo}
                                  </span>
                                </td>
                                <td className="py-3 font-mono text-emerald-400 font-bold text-right">+ S/ {t.monto.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admisiones' && (
              <div className="animate-fade-in-up space-y-6">
                <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-xl">
                  <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2"><Users className="w-5 h-5 text-yellow-500" /> Gestión de Admisiones</h2>
                  
                  {admisiones.length === 0 ? (
                    <p className="text-slate-500 italic">No hay expedientes de admisión recientes.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-500">
                            <th className="pb-3">Expediente</th>
                            <th className="pb-3">Postulante</th>
                            <th className="pb-3">Nivel</th>
                            <th className="pb-3 text-center">Promedio</th>
                            <th className="pb-3 text-center">Conducta</th>
                            <th className="pb-3">Estado</th>
                            <th className="pb-3">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {admisiones.map(adm => (
                            <tr key={adm.id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="py-3 text-slate-300 font-mono text-xs">{adm.codigo_est}</td>
                              <td className="py-3 text-white font-medium">{adm.nombres}</td>
                              <td className="py-3 text-slate-400">{adm.nivel}</td>
                              <td className="py-3 text-center text-emerald-400 font-bold">{adm.promedio}</td>
                              <td className="py-3 text-center text-yellow-400 font-bold">{adm.conducta}</td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded text-xs border ${
                                  adm.estado_proceso.includes('Rechazado') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  adm.estado_proceso.includes('Admitido') || adm.estado_proceso.includes('Matriculado') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                }`}>
                                  {adm.estado_proceso}
                                </span>
                              </td>
                              
                              <td className="py-3">
                                {adm.estado_proceso === 'Evaluación Superada' ? (
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleCambiarEstadoAdmision(adm.id, 'Admitido (Falta Pago)')}
                                      className="px-3 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white rounded transition-colors text-xs font-bold"
                                    >
                                      Aprobar
                                    </button>
                                    <button 
                                      onClick={() => handleCambiarEstadoAdmision(adm.id, 'Rechazado')}
                                      className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white rounded transition-colors text-xs font-bold"
                                    >
                                      Rechazar
                                    </button>
                                  </div>
                                ) : adm.estado_proceso === 'Admitido (Falta Pago)' ? (
                                  <button 
                                      onClick={() => setCobroModal({ open: true, admisionId: adm.id, nombres: adm.nombres, monto: 300, metodo: 'Efectivo', efectivoRecibido: '' })}
                                      className="px-3 py-1 bg-yellow-600/20 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-600 hover:text-slate-900 rounded transition-colors text-xs font-bold whitespace-nowrap"
                                  >
                                      Cobrar y Matricular
                                  </button>
                                ) : (
                                  <span className="text-slate-600 text-xs italic">Sin acciones</span>
                                )}
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

            {activeTab === 'matricula' && (
              <div className="animate-fade-in-up space-y-6 max-w-4xl mx-auto">
                <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-xl">
                  <h2 className="text-xl font-bold mb-6 text-white">Buscar Matrícula Pendiente</h2>
                  <form onSubmit={handleBuscarMatricula} className="flex gap-4">
                    <input 
                      type="text" 
                      value={searchDni} 
                      onChange={e => setSearchDni(e.target.value)} 
                      placeholder="DNI del Alumno" 
                      className="flex-1 bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-yellow-500 outline-none" 
                      required
                    />
                    <button type="submit" className="px-6 py-3 bg-yellow-600 text-slate-950 rounded-xl font-bold hover:bg-yellow-500 transition-colors shadow-[0_0_15px_rgba(202,138,4,0.3)]">
                      Buscar
                    </button>
                  </form>
                </div>

                {matriculaPendiente && (
                  <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-xl">
                    <h3 className="text-lg font-bold text-yellow-500 mb-4">Detalles de Matrícula</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-white">
                      <p><span className="text-slate-400">Alumno:</span> <span className="font-bold">{matriculaPendiente.alumno_nombre}</span></p>
                      <p><span className="text-slate-400">Grado:</span> <span className="font-bold">{matriculaPendiente.grado}</span></p>
                      <p><span className="text-slate-400">Estado:</span> <span className="text-yellow-400 font-bold">{matriculaPendiente.estado_matricula || 'PENDIENTE_PAGO'}</span></p>
                      <p><span className="text-slate-400">Monto Total:</span> <span className="font-bold text-emerald-400">S/ {matriculaPendiente.monto_total}</span></p>
                    </div>
                    
                    <form onSubmit={handlePagarMatricula} className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                      <div className="col-span-2 md:col-span-1">
                         <label className="block text-xs text-slate-400 mb-1">Método de Pago</label>
                         <select 
                           value={pagoMatriculaForm.metodo} 
                           onChange={e => setPagoMatriculaForm({...pagoMatriculaForm, metodo: e.target.value})}
                           className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                         >
                           <option value="Efectivo">Efectivo</option>
                           <option value="Yape">Yape / Plin</option>
                           <option value="Transferencia">Transferencia Bancaria</option>
                         </select>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                         <label className="block text-xs text-slate-400 mb-1">Monto a Cobrar (S/)</label>
                         <input 
                           type="number" 
                           step="0.01" 
                           required
                           value={pagoMatriculaForm.monto} 
                           onChange={e => setPagoMatriculaForm({...pagoMatriculaForm, monto: e.target.value})}
                           className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white font-mono focus:border-emerald-500 outline-none" 
                           placeholder="Ej. 300.00"
                         />
                      </div>
                      <div className="col-span-2 flex justify-end mt-4">
                         <button type="submit" disabled={estadoCaja !== 'Abierta'} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                           Confirmar Matrícula
                         </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'recuperacion' && (
              <div className="animate-fade-in-up grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 text-white">Registrar Recuperación Vacacional</h2>
                    <form onSubmit={handleRegistrarRecuperacion} className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                        <label className="block text-xs text-slate-400 mb-1">Alumno y Curso Pendiente</label>
                        <select required value={`${recuperacionForm.alumno_id}|${recuperacionForm.curso}`} onChange={(e) => {
                          const [id, curso] = e.target.value.split('|')
                          setRecuperacionForm({...recuperacionForm, alumno_id: id, curso: curso})
                        }} className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-yellow-500 outline-none">
                          <option value="|">Seleccionar Alumno y Curso...</option>
                          {alumnosRecuperacion.map(al => (
                            al.cursos_pendientes?.map(cursoData => (
                              <option key={`${al.id}-${cursoData.nombre_curso}`} value={`${al.id}|${cursoData.nombre_curso}`}>{al.nombre_completo} - {cursoData.nombre_curso}</option>
                            ))
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Calificación Obtenida</label>
                        <input required type="number" min="0" max="20" step="0.1" value={recuperacionForm.calificacion} onChange={e=>setRecuperacionForm({...recuperacionForm, calificacion: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-yellow-500 outline-none" />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Resultado</label>
                        <select required value={recuperacionForm.resultado} onChange={e=>setRecuperacionForm({...recuperacionForm, resultado: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-yellow-500 outline-none">
                          <option value="aprobado">Aprobado</option>
                          <option value="jalado">Jalado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Monto Cobrado (S/)</label>
                        <input required type="number" step="0.01" value={recuperacionForm.monto_pago} onChange={e=>setRecuperacionForm({...recuperacionForm, monto_pago: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-yellow-500 outline-none" />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Método de Pago</label>
                        <select required value={recuperacionForm.metodo_pago} onChange={e=>setRecuperacionForm({...recuperacionForm, metodo_pago: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-yellow-500 outline-none">
                          <option value="Efectivo">Efectivo</option>
                          <option value="Yape">Yape / Plin</option>
                          <option value="Transferencia">Transferencia Bancaria</option>
                        </select>
                      </div>

                      <div className="col-span-2 flex justify-end mt-4">
                        <button type="submit" disabled={estadoCaja !== 'Abierta'} className="px-8 py-3 bg-yellow-600 text-slate-950 rounded-xl font-bold hover:bg-yellow-500 transition-colors shadow-[0_0_15px_rgba(202,138,4,0.3)] disabled:opacity-50 disabled:cursor-not-allowed">
                          Registrar Resultado y Pago
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-xl h-full">
                    <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">Alumnos Pendientes</h3>
                    {alumnosRecuperacion.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No hay alumnos pendientes de recuperación.</p>
                    ) : (
                      <div className="space-y-4">
                        {alumnosRecuperacion.map(al => (
                          <div key={al.id} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                            <p className="font-bold text-sm text-white">{al.nombre_completo}</p>
                            {al.dni && <p className="text-xs text-slate-400 mt-1">DNI: {al.dni}</p>}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {al.cursos_pendientes?.map(c => (
                                <span key={c.curso_recuperacion_id} className="px-2 py-1 bg-red-500/20 text-red-400 rounded-md text-[10px] font-bold uppercase tracking-wider">{c.nombre_curso}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
      
        {/* Modal de Cobro */}
        {cobroModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-bold mb-2">Cobrar Admisión</h2>
              <p className="text-slate-400 text-sm mb-6">Alumno: {cobroModal.nombres}</p>
              
              <form onSubmit={handleCobroModalSubmit} className="space-y-4">
                 <div>
                    <label className="block text-xs text-slate-400 mb-1">Método de Pago</label>
                    <select required value={cobroModal.metodo} onChange={e=>setCobroModal({...cobroModal, metodo: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none">
                      <option value="Efectivo">Efectivo</option>
                      <option value="Yape">Yape / Plin</option>
                      <option value="Transferencia">Transferencia Bancaria</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs text-slate-400 mb-1">Monto a Cobrar (S/)</label>
                    <input required type="number" step="0.01" value={cobroModal.monto} onChange={e=>setCobroModal({...cobroModal, monto: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white font-mono focus:border-emerald-500 outline-none" />
                 </div>

                 {cobroModal.metodo === 'Efectivo' && (
                     <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
                        <div>
                           <label className="block text-xs text-emerald-400 mb-1 font-bold">Efectivo Recibido (S/)</label>
                           <input required type="number" step="0.01" value={cobroModal.efectivoRecibido} onChange={e=>setCobroModal({...cobroModal, efectivoRecibido: e.target.value})} className="w-32 bg-black/50 border border-emerald-700 rounded-lg p-2 text-emerald-400 font-mono focus:border-emerald-400 outline-none" placeholder="Ej: 50.00"/>
                        </div>
                        <div className="text-right">
                           <span className="text-xs text-slate-400">Vuelto a entregar:</span><br/>
                           <span className="font-mono font-bold text-xl text-emerald-400">
                             S/ {Math.max(0, (parseFloat(cobroModal.efectivoRecibido || 0) - parseFloat(cobroModal.monto || 0))).toFixed(2)}
                           </span>
                        </div>
                     </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                     <button type="button" onClick={() => setCobroModal({...cobroModal, open: false})} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white">Cancelar</button>
                     <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors">Confirmar Pago</button>
                  </div>
              </form>
            </div>
          </div>
        )}

      <ChatWidget roleName="Asistente Administrativo" />
    </div>
  )
}

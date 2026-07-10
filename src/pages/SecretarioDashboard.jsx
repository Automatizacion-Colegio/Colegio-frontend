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
  const [txForm, setTxForm] = useState({ monto: '', concepto: '', metodo: 'Efectivo', alumno_id: '', montoEfectivo: '', montoDigital: '', metodoDigital: 'Yape' })
  
  // OCR State
  const [isReadingVoucher, setIsReadingVoucher] = useState(false)
  

  // Alumnos
  const [alumnos, setAlumnos] = useState([])

  // Admisiones State
  const [admisiones, setAdmisiones] = useState([])

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

  const handleTxSubmit = async (e) => {
    e.preventDefault()
    try {
      if (txForm.metodo === 'Mixto') {
        const amtEfectivo = parseFloat(txForm.montoEfectivo) || 0;
        const amtDigital = parseFloat(txForm.montoDigital) || 0;
        
        if(amtEfectivo > 0) {
          await fetch(`${import.meta.env.VITE_API_URL}/api/secretaria/caja/transaccion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ 
              monto: amtEfectivo, 
              concepto: `${txForm.concepto} (Parte Efectivo)`, 
              metodo: 'Efectivo',
              alumno_id: txForm.alumno_id ? parseInt(txForm.alumno_id) : null
            })
          })
        }
        
        if(amtDigital > 0) {
          await fetch(`${import.meta.env.VITE_API_URL}/api/secretaria/caja/transaccion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ 
              monto: amtDigital, 
              concepto: `${txForm.concepto} (Parte ${txForm.metodoDigital})`, 
              metodo: txForm.metodoDigital,
              alumno_id: txForm.alumno_id ? parseInt(txForm.alumno_id) : null
            })
          })
        }
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secretaria/caja/transaccion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ 
            monto: parseFloat(txForm.monto), 
            concepto: txForm.concepto, 
            metodo: txForm.metodo,
            alumno_id: txForm.alumno_id ? parseInt(txForm.alumno_id) : null
          })
        })
        if(!res.ok) {
          const error = await res.json()
          alert(error.detail)
          return
        }
      }
      
      setTxForm({ monto: '', concepto: '', metodo: 'Efectivo', alumno_id: '', montoEfectivo: '', montoDigital: '', metodoDigital: 'Yape' })
      fetchCaja()
    } catch (e) { console.error(e) }
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
                      <h2 className="text-xl font-bold">Registrar Nuevo Pago</h2>
                      
                      <div className="relative">
                        <input type="file" id="voucher" accept="image/*" className="hidden" onChange={handleVoucherOCR} />
                        <label htmlFor="voucher" className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-bold flex gap-2 items-center transition-all ${isReadingVoucher ? 'bg-slate-700 text-slate-400' : 'bg-yellow-600 hover:bg-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(202,138,4,0.3)]'}`}>
                          {isReadingVoucher ? "Procesando..." : <><Camera className="w-4 h-4"/> Procesar Voucher</>}
                        </label>
                      </div>
                    </div>
                    
                    <form onSubmit={handleTxSubmit} className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs text-slate-400 mb-1">Método de Pago</label>
                        <select required disabled={estadoCaja !== 'Abierta'} value={txForm.metodo} onChange={e=>setTxForm({...txForm, metodo: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none disabled:opacity-50">
                          <option value="Efectivo">Efectivo</option>
                          <option value="Yape">Yape / Plin</option>
                          <option value="Transferencia">Transferencia Bancaria</option>
                          <option value="Mixto">Mixto (Fraccionado)</option>
                        </select>
                      </div>
                      
                      {txForm.metodo === 'Mixto' ? (
                        <div className="col-span-2 grid grid-cols-2 gap-4 border border-emerald-500/30 p-4 rounded-xl bg-emerald-900/10 mb-2">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Monto en Efectivo (S/)</label>
                            <input required type="number" step="0.01" value={txForm.montoEfectivo} onChange={e=>setTxForm({...txForm, montoEfectivo: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-emerald-400 font-mono focus:border-emerald-500 outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Monto Digital (S/)</label>
                            <div className="flex gap-2">
                              <input required type="number" step="0.01" value={txForm.montoDigital} onChange={e=>setTxForm({...txForm, montoDigital: e.target.value})} className="w-1/2 bg-black/40 border border-slate-700 rounded-lg p-3 text-emerald-400 font-mono focus:border-emerald-500 outline-none" />
                              <select className="w-1/2 bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none" value={txForm.metodoDigital} onChange={e=>setTxForm({...txForm, metodoDigital: e.target.value})}>
                                <option value="Yape">Yape</option>
                                <option value="Transferencia">Transferencia</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="text-xs text-slate-400">Total a cobrar: </span>
                            <span className="font-mono font-bold text-lg text-white">S/ {((parseFloat(txForm.montoEfectivo)||0) + (parseFloat(txForm.montoDigital)||0)).toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="col-span-2 md:col-span-1">
                          <label className="block text-xs text-slate-400 mb-1">Monto Total (S/)</label>
                          <input required disabled={estadoCaja !== 'Abierta'} type="number" step="0.01" value={txForm.monto} onChange={e=>setTxForm({...txForm, monto: e.target.value})} className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white font-mono focus:border-emerald-500 outline-none disabled:opacity-50" />
                        </div>
                      )}

                      <div className="col-span-2">
                        <label className="block text-xs text-slate-400 mb-1">Concepto</label>
                        <input required disabled={estadoCaja !== 'Abierta'} type="text" value={txForm.concepto} onChange={e=>setTxForm({...txForm, concepto: e.target.value})} placeholder="Ej: Pensión Marzo - Alumno Juan Pérez" className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none disabled:opacity-50" />
                      </div>
                      <div className="col-span-2 flex justify-end mt-2">
                        <button disabled={estadoCaja !== 'Abierta'} type="submit" className="px-8 py-3 bg-yellow-600 text-slate-950 rounded-xl font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(202,138,4,0.3)]">
                          Registrar Ingreso
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


          </div>
        </div>
      </main>
      <ChatWidget roleName="Asistente Administrativo" />
    </div>
  )
}

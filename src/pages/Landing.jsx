import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ChatWidget from '../components/ChatWidget'

export default function Landing() {
  const [mounted, setMounted] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);

  useEffect(() => {
    setMounted(true);
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Siempre visible en el tope
      if (currentScrollY < 50) {
        setIsNavVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scroll hacia abajo
        setIsNavVisible(false);
      } else {
        // Scroll hacia arriba
        setIsNavVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      
      {/* HEADER NAVBAR */}
      <header className={`fixed z-50 transition-all duration-300 ease-in-out top-0 left-0 right-0 ${!mounted ? '-translate-y-4 opacity-0' : (isNavVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0')}`}>
        <nav className="w-full">
          <div className="flex items-center justify-between px-8 lg:px-12 h-24 w-full">
            <div className="flex items-center gap-4 group">
              <img 
                src="/logo.png" 
                alt="Logo José María Arguedas" 
                className="h-16 lg:h-20 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" 
              />
              <span className="font-bold tracking-widest text-xl lg:text-2xl text-white uppercase">
                José María Arguedas
              </span>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="text-sm text-white/70 hover:text-white transition-colors">
                Intranet
              </Link>
              <Link to="/admisiones" className="h-10 inline-flex items-center justify-center px-6 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                Admisión Online
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col justify-center items-start overflow-hidden bg-black">
        {/* Background Video Layer */}
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop playsInline preload="auto" className="w-full h-full object-cover object-center opacity-[0.35]">
            <source src="/videos/video1.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>
        </div>

        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none opacity-20">
          <div className="absolute h-px bg-white/10" style={{top:'25%', left:0, right:0}}></div>
          <div className="absolute h-px bg-white/10" style={{top:'50%', left:0, right:0}}></div>
          <div className="absolute h-px bg-white/10" style={{top:'75%', left:0, right:0}}></div>
          <div className="absolute w-px bg-white/10" style={{left:'25%', top:0, bottom:0}}></div>
          <div className="absolute w-px bg-white/10" style={{left:'50%', top:0, bottom:0}}></div>
          <div className="absolute w-px bg-white/10" style={{left:'75%', top:0, bottom:0}}></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 pt-32 pb-40">
          <div className="lg:max-w-[70%]">
            <div className={`mb-8 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="inline-flex items-center gap-3 text-sm font-mono text-white/60">
                <span className="w-8 h-px bg-white/30"></span>
                Colegio Inteligente impulsado por IA Multiagente
              </span>
            </div>
            
            <div className={`mb-12 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h1 className="text-left text-[clamp(2.5rem,7vw,6.5rem)] font-extrabold leading-[0.95] tracking-tight text-white">
                <span className="block">Gestión escolar,</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-blue-800">
                  automatizada.
                </span>
              </h1>
            </div>
            
            <p className={`text-xl lg:text-2xl text-slate-400 max-w-2xl leading-relaxed mb-10 transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              Despliega un enjambre de agentes autónomos para manejar admisiones, evaluaciones y soporte psicopedagógico 24/7.
            </p>

            <div className={`flex flex-wrap gap-4 transition-all duration-1000 delay-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Link to="/admisiones" className="px-8 py-4 bg-white text-black rounded-full font-bold transition-transform hover:scale-105 hover:bg-slate-200">
                Iniciar Admisión
              </Link>
              <Link to="/login" className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-bold hover:bg-white/10 transition-colors backdrop-blur-md">
                Acceso Personal
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Bottom Stats */}
        <div className={`absolute bottom-12 left-0 right-0 px-6 lg:px-12 transition-all duration-1000 delay-[1200ms] ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="max-w-[1400px] mx-auto flex items-start gap-10 lg:gap-20">
            <div className="flex flex-col gap-2">
              <span className="text-3xl lg:text-4xl font-bold text-white">7</span>
              <span className="text-xs font-mono text-white/50 leading-tight">AGENTES IA ACTIVOS</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-3xl lg:text-4xl font-bold text-white">&lt;100ms</span>
              <span className="text-xs font-mono text-white/50 leading-tight">LATENCIA DE RESPUESTA</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-3xl lg:text-4xl font-bold text-white">100%</span>
              <span className="text-xs font-mono text-white/50 leading-tight">AUTOMATIZACIÓN</span>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS SECTION */}
      <section id="process" className="relative py-24 lg:py-32 bg-[#02040a] border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-end mb-20">
            <div>
              <span className="inline-flex items-center gap-3 text-sm font-mono text-white/40 mb-6">
                <span className="w-12 h-px bg-white/20"></span>Flujo Autónomo
              </span>
              <h2 className="text-5xl md:text-6xl lg:text-8xl font-extrabold tracking-tight leading-[0.9]">
                <span className="block text-white">Analiza.</span>
                <span className="block text-white/30">Deriva.</span>
                <span className="block text-white/10">Resuelve.</span>
              </h2>
            </div>
            <div className="pb-4">
              <p className="text-xl text-slate-400 leading-relaxed max-w-md">
                Cada interacción de padres y alumnos es procesada por un enrutador semántico que delega las tareas a especialistas IA en tiempo real.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-black border border-white/10 p-10 lg:p-12 group hover:border-blue-800/60 transition-colors">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-4xl font-bold text-blue-600">01</span>
                <div className="flex-1 h-px bg-white/10 overflow-hidden">
                  <div className="h-full bg-blue-700 w-0 group-hover:w-full transition-all duration-1000"></div>
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-2">Recepción</h3>
              <span className="text-lg text-white/40 block mb-6 font-mono">Enrutador Llama 3</span>
              <p className="text-white/60 leading-relaxed">
                El Agente Soporte clasifica la consulta al instante. Si detecta matrícula, invoca al Agente Administrador; si hay quejas, llama al Psicólogo.
              </p>
            </div>
            
            <div className="bg-black border border-white/10 p-10 lg:p-12 group hover:border-yellow-600/40 transition-colors">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-4xl font-bold text-yellow-600">02</span>
                <div className="flex-1 h-px bg-white/10 overflow-hidden">
                  <div className="h-full bg-yellow-600 w-0 group-hover:w-full transition-all duration-1000"></div>
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-2">Evaluación</h3>
              <span className="text-lg text-white/40 block mb-6 font-mono">Agentes Especializados</span>
              <p className="text-white/60 leading-relaxed">
                El Agente Psicólogo evalúa conductas de riesgo. El Agente Evaluador emite reportes de desempeño académico y tutoría.
              </p>
            </div>

            <div className="bg-black border border-white/10 p-10 lg:p-12 group hover:border-blue-400/50 transition-colors">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-4xl font-bold text-blue-300">03</span>
                <div className="flex-1 h-px bg-white/10 overflow-hidden">
                  <div className="h-full bg-blue-400 w-0 group-hover:w-full transition-all duration-1000"></div>
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-2">Acción</h3>
              <span className="text-lg text-white/40 block mb-6 font-mono">Bases de Datos & Memoria</span>
              <p className="text-white/60 leading-relaxed">
                Los agentes ejecutan tools seguras para guardar matrículas en PostgreSQL o lanzar alertas pedagógicas globales por el Event Bus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* IMAGES SECTION: NOSOTROS / CAMPUS */}
      <section className="relative py-24 bg-black border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-6">
          <div className="relative group overflow-hidden rounded-2xl h-[400px] lg:h-[500px]">
            <img src="/images/nosotros.png" alt="Nosotros" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 p-10 pointer-events-none">
              <span className="inline-flex items-center gap-3 text-sm font-mono text-white/60 mb-4">
                <span className="w-8 h-px bg-white/30"></span>Quiénes Somos
              </span>
              <h3 className="text-4xl font-extrabold text-white mb-4">Nuestra Filosofía</h3>
              <p className="text-white/60 max-w-sm">
                Formamos estudiantes con valores sólidos y excelencia académica, preparados para liderar en un mundo digital.
              </p>
            </div>
          </div>
          <div className="relative group overflow-hidden rounded-2xl h-[400px] lg:h-[500px]">
            <img src="/images/campus.png" alt="Campus" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 p-10 pointer-events-none">
              <span className="inline-flex items-center gap-3 text-sm font-mono text-white/60 mb-4">
                <span className="w-8 h-px bg-white/30"></span>Instalaciones
              </span>
              <h3 className="text-4xl font-extrabold text-white mb-4">Campus de Vanguardia</h3>
              <p className="text-white/60 max-w-sm">
                Espacios diseñados para potenciar el aprendizaje colaborativo, la innovación y el desarrollo deportivo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VIDA ESCOLAR SECONDARY VIDEO SECTION */}
      <section className="relative py-32 lg:py-40 flex flex-col justify-center items-start overflow-hidden bg-black border-t border-white/5">
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop playsInline preload="auto" poster="/school-secondary-poster.jpg" className="w-full h-full object-cover object-center opacity-[0.35]">
            <source src="/videos/school-secondary.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="lg:max-w-[60%]">
            <div className="mb-6">
              <span className="inline-flex items-center gap-3 text-sm font-mono text-yellow-500">
                <span className="w-8 h-px bg-yellow-600"></span>Formación Integral
              </span>
            </div>
            <h2 className="text-left text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[0.95] tracking-tight text-white mb-8">
              <span className="block">Mucho más que</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-blue-800">
                solo clases académicas.
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-xl leading-relaxed mb-10">
              Vive la experiencia de un ecosistema escolar donde la tecnología, el arte y el deporte se unen para formar los líderes del mañana.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/admisiones" className="px-8 py-4 bg-blue-800 text-white rounded-full font-bold transition-transform hover:scale-105 hover:bg-blue-900 shadow-[0_0_20px_rgba(30,58,138,0.4)]">
                Unirse a la familia
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS SECTION */}
      <section className="relative py-32 bg-black border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="mb-20">
            <div className="flex items-center gap-4 mb-6">
              <span className="flex items-center gap-2 px-3 py-1 bg-blue-900/40 border border-blue-800/50 text-blue-300 text-xs font-mono rounded">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                SISTEMA LIVE
              </span>
            </div>
            <h2 className="text-5xl md:text-7xl lg:text-[100px] font-extrabold tracking-tight leading-[0.95] text-white">
              Trazabilidad<br/><span className="text-white/30">en tiempo real.</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white/[0.02] border border-white/10 p-10 lg:p-12">
              <div className="text-sm font-mono text-white/40 mb-2">MEMORIA COMPARTIDA</div>
              <div className="text-5xl font-bold text-white mb-6">Estado Central</div>
              <p className="text-slate-400">Un único Single Source of Truth para todos los agentes, evitando alucinaciones o datos desincronizados.</p>
            </div>
            <div className="bg-white/[0.02] border border-white/10 p-10 lg:p-12">
              <div className="text-sm font-mono text-white/40 mb-2">TELEMETRÍA LANGSMITH</div>
              <div className="text-5xl font-bold text-white mb-6">Doble Proveedor</div>
              <p className="text-slate-400">Enrutamiento inteligente. Groq para tareas ligeras a 800 t/s, Google Gemini AI Studio para razonamiento profundo.</p>
            </div>
            <div className="bg-white/[0.02] border border-white/10 p-10 lg:p-12">
              <div className="text-sm font-mono text-white/40 mb-2">CACHÉ SEMÁNTICA</div>
              <div className="text-5xl font-bold text-white mb-6">Redis Cache</div>
              <p className="text-slate-400">Respuestas frecuentes oxidadas en RAM, anulando el costo y bajando la latencia a cero milisegundos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black py-12 text-center text-slate-500 text-sm font-mono">
        © 2026 ERP Escolar AI. Arquitectura Swarm Multiagente.
      </footer>

      <ChatWidget roleName="Agente de Admisiones" />
    </div>
  )
}

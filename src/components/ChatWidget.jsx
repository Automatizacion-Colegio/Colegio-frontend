import { useState, useRef, useEffect, useCallback } from 'react'
import useAuthStore from '../store/useAuthStore'

/**
 * ChatWidget con SSE Streaming.
 */
export default function ChatWidget({ roleName = "Soporte Cognitivo IA" }) {
  const { token } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { sender: 'ai', text: `Hola, soy tu ${roleName}. Estoy conectado a la base de datos del colegio en tiempo real. ¿En qué te ayudo?` }
  ])
  const [input, setInput] = useState('')
  const [agentStatus, setAgentStatus] = useState(null)
  const [activeAgent, setActiveAgent] = useState('')
  const [activeTool, setActiveTool] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const abortRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, agentStatus, scrollToBottom])

  const parseSSEStream = async (reader) => {
    const decoder = new TextDecoder()
    let buffer = ''
    let currentText = ''
    let eventType = ''

    setMessages(prev => [...prev, { sender: 'ai', text: '', isStreaming: true }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim()
        } else if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            
            switch (eventType) {
              case 'thinking':
                setAgentStatus('thinking')
                setActiveAgent(data.agent || '')
                break

              case 'tool_call':
                setAgentStatus('tool')
                setActiveTool(data.tool || '')
                setActiveAgent(data.agent || '')
                break

              case 'token':
                setAgentStatus('streaming')
                currentText += data.content
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { sender: 'ai', text: currentText, isStreaming: true }
                  return updated
                })
                break

              case 'done':
                setAgentStatus(null)
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { sender: 'ai', text: currentText, traceId: data.trace_id || null, isStreaming: false }
                  return updated
                })
                return

              case 'error':
                setAgentStatus(null)
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { sender: 'ai', text: `⚠️ Error: ${data.message}`, isStreaming: false }
                  return updated
                })
                return

              default:
                break
            }
          } catch {}
        }
      }
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }])
    setInput('')
    setIsLoading(true)
    setAgentStatus('thinking')
    setActiveAgent('Swarm_Orchestrator')

    abortRef.current = new AbortController()

    const history = messages.slice(-10).map(m => ({
      role: m.sender === 'ai' ? 'assistant' : 'user',
      content: m.text
    }))

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/stream`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: userMsg, history }),
        signal: abortRef.current.signal
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      await parseSSEStream(reader)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setAgentStatus(null)
        setMessages(prev => [...prev, { sender: 'ai', text: '❌ Error de conexión. Verifica que el backend esté activo.', isStreaming: false }])
      }
    } finally {
      setIsLoading(false)
      setAgentStatus(null)
      abortRef.current = null
    }
  }

  const StatusIndicator = () => {
    if (!agentStatus) return null
    const configs = {
      thinking: { icon: '🧠', text: 'Analizando...', bgClass: 'bg-amber-500/10 border-amber-500/30', textClass: 'text-amber-300', dotClass: 'bg-amber-400' },
      tool: { icon: '🔧', text: `Herramienta: ${activeTool}`, bgClass: 'bg-cyan-500/10 border-cyan-500/30', textClass: 'text-cyan-300', dotClass: 'bg-cyan-400' },
      streaming: { icon: '✍️', text: 'Respondiendo...', bgClass: 'bg-indigo-500/10 border-indigo-500/30', textClass: 'text-indigo-300', dotClass: 'bg-indigo-400' }
    }
    const config = configs[agentStatus]
    if (!config) return null

    return (
      <div className={`self-start flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-sm shadow-sm ${config.bgClass} ${config.textClass} animate-fade-in-up`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass} animate-pulse`}></span>
        <span>{config.icon}</span>
        <span>{config.text}</span>
        {activeAgent && agentStatus !== 'streaming' && <span className="opacity-60 ml-1">({activeAgent})</span>}
      </div>
    )
  }

  const formatText = (text) => {
    if (!text) return { __html: '' }
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
      .replace(/^\*\s(.*)$/gm, '• $1')
    return { __html: formatted }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {isOpen ? (
        <div className="glass-panel w-[22rem] sm:w-96 h-[32rem] rounded-3xl flex flex-col overflow-hidden animate-fade-in-up ring-1 ring-white/10 shadow-2xl">
          <div className="bg-gradient-to-r from-indigo-600/80 to-purple-600/80 p-5 flex justify-between items-center text-white shrink-0 backdrop-blur-md border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse ring-2 ring-green-400/30"></div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">Asistente IA</h3>
                <p className="text-[10px] text-indigo-100 opacity-80">{roleName}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-indigo-200 hover:bg-white/10 p-1.5 rounded-full transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-slate-950/40">
            {messages.map((msg, i) => (
              <div key={i} className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm transition-all ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white self-end rounded-br-sm'
                    : 'bg-slate-800/80 backdrop-blur-sm text-slate-200 self-start rounded-bl-sm border border-slate-700/50'
                } ${msg.isStreaming ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : ''}`}
              >
                <span dangerouslySetInnerHTML={formatText(msg.text)} />
                {msg.isStreaming && <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-1 animate-pulse rounded-full align-middle"></span>}
              </div>
            ))}
            <StatusIndicator />
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-white/5 flex gap-2 shrink-0">
            <input
              type="text"
              className="flex-1 bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner disabled:opacity-50"
              placeholder={isLoading ? 'IA analizando...' : 'Escribe tu mensaje...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center min-w-[44px]"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin text-indigo-200" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              ) : (
                <svg className="w-5 h-5 translate-x-[-1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              )}
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-[0_8px_30px_rgba(79,70,229,0.4)] flex items-center justify-center text-white hover:scale-110 transition-all duration-300 group relative animate-pulse-glow"
        >
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
        </button>
      )}
    </div>
  )
}

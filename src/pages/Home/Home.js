import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { generateGeminiContent } from "../../services/geminiService"
import "./Home.css"
import { Clipboard, FileText, ArrowRight, RefreshCw, Upload, Bot, PenTool } from "lucide-react"

const FIXED_PROMPT = `Conectate a internet y Genera un caso de estudio real o ficticio de 500-1000 palabras sobre una empresa que implementa ISO 9001.  
Incluye contexto (sector, tamaño, ubicación), problemas ambientales identificados (emisiones, residuos, consumo de recursos), 
acciones tomadas para cumplir con ISO 9001(auditorías, políticas, objetivos ambientales), no me indiques resultados ni nada por estilo, solo quiero 
el caso de estudio completo...
El caso debe ser coherente, relevante para ISO 9001, y no contener información contradictoria. 
Toma en cuenta que cada que se genere un caso no quiero que se repita mas de 2 o 3 veces el caso
Escribe el texto en español y solo escribe el caso de estudio, nada más, no me hagas preguntas de nada, solo el caso de estudio y ya.`

// Componente para renderizar markdown
const MarkdownRenderer = ({ text }) => {
  const formatMarkdown = (text) => {
    if (!text) return ""
    
    // Convertir **texto** a <strong>texto</strong>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Convertir *texto* a <em>texto</em>  
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Convertir ### Título a <h3>
    formatted = formatted.replace(/^### (.*$)/gm, '<h3>$1</h3>')
    
    // Convertir ## Título a <h2>
    formatted = formatted.replace(/^## (.*$)/gm, '<h2>$1</h2>')
    
    // Convertir # Título a <h1>
    formatted = formatted.replace(/^# (.*$)/gm, '<h1>$1</h1>')
    
    // Convertir saltos de línea a <br>
    formatted = formatted.replace(/\n/g, '<br>')
    
    // Convertir listas con -
    formatted = formatted.replace(/^- (.*$)/gm, '<li>$1</li>')
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    
    return formatted
  }

  return (
    <div 
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: formatMarkdown(text) }}
    />
  )
}

const Home = () => {
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)
  const [caseMode, setCaseMode] = useState("generate") // "generate" o "upload"
  const [customCase, setCustomCase] = useState("")
  const navigate = useNavigate()

  const handleGenerate = async () => {
    setLoading(true)
    setResponse("Cargando...")
    try {
      const text = await generateGeminiContent(FIXED_PROMPT)
      setResponse(text)
      // Guardamos el caso en localStorage para usar en el resolver
      const caseData = {
        content: text,
        isCustom: false
      }
      localStorage.setItem("casoISO9001", JSON.stringify(caseData))
    } catch (err) {
      setResponse("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUseCustomCase = () => {
    if (!customCase.trim()) {
      alert("Por favor, escribe tu caso de estudio personalizado")
      return
    }
    
    setResponse(customCase)
    // Guardamos el caso personalizado en localStorage
    const caseData = {
      content: customCase,
      isCustom: true
    }
    localStorage.setItem("casoISO9001", JSON.stringify(caseData))
  }

  const handleStartTest = () => {
    navigate("/resolver")
  }

  const handleCopyText = () => {
    if (response && response !== "Cargando...") {
      navigator.clipboard.writeText(response)
      alert("Caso copiado al portapapeles")
    }
  }

  const handleModeChange = (mode) => {
    setCaseMode(mode)
    setResponse("")
    setCustomCase("")
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="logo-container">
          <div className="logo">
            <FileText size={28} />
          </div>
          <h1>ISO 9001 Generator</h1>
        </div>
      </header>

      <main className="home-main">
        <div className="card">
          <div className="card-header">
            <h2>Obtener caso de estudio</h2>
            <p>Elige cómo quieres obtener tu caso de estudio ISO 9001</p>
          </div>

          {/* Selector de modo */}
          <div className="mode-selector">
            <button
              className={`mode-button ${caseMode === "generate" ? "active" : ""}`}
              onClick={() => handleModeChange("generate")}
            >
              <Bot className="icon" />
              <div>
                <span className="mode-title">Generar con IA</span>
                <span className="mode-subtitle">La IA creará un caso automáticamente</span>
              </div>
            </button>
            
            <button
              className={`mode-button ${caseMode === "upload" ? "active" : ""}`}
              onClick={() => handleModeChange("upload")}
            >
              <PenTool className="icon" />
              <div>
                <span className="mode-title">Caso personalizado</span>
                <span className="mode-subtitle">Escribe tu propio caso de estudio</span>
              </div>
            </button>
          </div>

          {/* Contenido según el modo seleccionado */}
          {caseMode === "generate" && (
            <div className="generate-section">
              <div className="home-buttons">
                <button
                  className={`home-button primary ${loading ? "loading" : ""}`}
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="icon spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Bot className="icon" />
                      Generar Caso con IA
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {caseMode === "upload" && (
            <div className="upload-section">
              <textarea
                value={customCase}
                onChange={(e) => setCustomCase(e.target.value)}
                placeholder="Escribe aquí tu caso de estudio personalizado..."
                className="custom-case-textarea"
                rows={15}
              />
              <div className="textarea-info">
                <span className="char-count">{customCase.length} caracteres</span>
                <span className="tip">💡 Tip: Usa ## para títulos y ### para subtítulos</span>
              </div>
              
              <div className="home-buttons">
                <button
                  className="home-button primary"
                  onClick={handleUseCustomCase}
                  disabled={!customCase.trim()}
                >
                  <Upload className="icon" />
                  Usar este caso
                </button>
              </div>
            </div>
          )}

          {/* Botones adicionales cuando hay respuesta */}
          {response && !loading && (
            <div className="additional-buttons">
              <button className="home-button secondary" onClick={handleStartTest}>
                <ArrowRight className="icon" />
                Iniciar Test
              </button>
              <button className="home-button outline" onClick={handleCopyText}>
                <Clipboard className="icon" />
                Copiar
              </button>
            </div>
          )}

          {/* Mostrar el caso generado/personalizado */}
          {response && (
            <div className="response-container">
              <div className="response-header">
                <h3>Caso de Estudio</h3>
                {!loading && (
                  <span className={`badge ${caseMode === "generate" ? "generated" : "custom"}`}>
                    {caseMode === "generate" ? "Generado por IA" : "Personalizado"}
                  </span>
                )}
              </div>
              <div className={`home-response ${loading ? "loading" : ""}`}>
                {loading ? (
                  <div className="loading-container">
                    <RefreshCw className="loading-icon" />
                    <p>Generando caso de estudio...</p>
                  </div>
                ) : (
                  <MarkdownRenderer text={response} />
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="home-footer">
        <p>© {new Date().getFullYear()} ISO 9001 Generador | Grupo 7 :Cueva,Aguilar,Almeida</p>
      </footer>
    </div>
  )
}

export default Home
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { generateGeminiContent } from "../../services/geminiService"
import "./Home.css"
import { Clipboard, FileText, ArrowRight, RefreshCw } from "lucide-react"

const FIXED_PROMPT = `Conectate a internet y Genera un caso de estudio real o ficticio de 300-500 palabras sobre una empresa que implementa ISO 9001.  
Incluye contexto (sector, tamaño, ubicación), problemas ambientales identificados (emisiones, residuos, consumo de recursos), 
acciones tomadas para cumplir con ISO 9001(auditorías, políticas, objetivos ambientales) y 
resultados obtenidos (reducción de impacto ambiental, certificación, etc.). 
El caso debe ser coherente, relevante para ISO 9001, y no contener información contradictoria. 
Toma en cuenta que cada que se genere un caso no quiero que se repita mas de 2 o 3 veces el caso
Escribe el texto en español.`

const Home = () => {
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleGenerate = async () => {
    setLoading(true)
    setResponse("Cargando...")
    try {
      const text = await generateGeminiContent(FIXED_PROMPT)
      setResponse(text)
      localStorage.setItem("casoISO9001", text)
    } catch (err) {
      setResponse("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStartTest = () => {
    navigate("/test")
  }

  const handleCopyText = () => {
    if (response && response !== "Cargando...") {
      navigator.clipboard.writeText(response)
      alert("Caso copiado al portapapeles")
    }
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
        <p className="header-subtitle">Generador de casos de estudio para implementación de ISO 9001</p>
      </header>

      <main className="home-main">
        <div className="card">
          <div className="card-header">
            <h2>Generar nuevo caso de estudio</h2>
            <p>Crea un caso de estudio detallado sobre implementación de ISO 9001 en una empresa</p>
          </div>

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
                  <FileText className="icon" />
                  Generar Caso
                </>
              )}
            </button>

            {response && !loading && (
              <>
                <button className="home-button secondary" onClick={handleStartTest}>
                  <ArrowRight className="icon" />
                  Iniciar Test
                </button>

                <button className="home-button outline" onClick={handleCopyText}>
                  <Clipboard className="icon" />
                  Copiar
                </button>
              </>
            )}
          </div>

          {response && (
            <div className="response-container">
              <div className="response-header">
                <h3>Caso de Estudio</h3>
                {!loading && <span className="badge">Generado</span>}
              </div>
              <div id="response" className={`home-response ${loading ? "loading" : ""}`}>
                {loading ? (
                  <div className="loading-container">
                    <RefreshCw className="loading-icon" />
                    <p>Generando caso de estudio...</p>
                  </div>
                ) : (
                  response
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

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { compareResolutions, generateGeminiContent } from "../../services/geminiService"
import { ArrowLeft, BarChart3, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import "./Resolver.css"

const Resolver = () => {
  const [aiResolution, setAiResolution] = useState("")
  const [userResolution, setUserResolution] = useState("")
  const [comparisonResult, setComparisonResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)
  const navigate = useNavigate()

  const caso = localStorage.getItem("casoISO9001")
  const promptResolucion = `Resuelve este caso de estudio sobre ISO 9001 de manera detallada y estructurada. Incluye:
1. Análisis del problema
2. Aplicación de principios ISO 9001
3. Plan de implementación
4. Resultados esperados

Caso de estudio:
${caso}`

  useEffect(() => {
    if (!caso) {
      navigate("/")
      return
    }

    const fetchResolution = async () => {
      try {
        const response = await generateGeminiContent(promptResolucion)
        setAiResolution(response)
      } catch (err) {
        setAiResolution("Error al generar resolución con IA: " + err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchResolution()
  }, [caso, navigate, promptResolucion])

  const handleCompare = async () => {
    if (!userResolution.trim()) {
      alert("Por favor, escribe tu resolución antes de comparar.")
      return
    }

    setComparing(true)
    try {
      const result = await compareResolutions(aiResolution, userResolution)
      setComparisonResult(result)
    } catch (err) {
      alert("Error al comparar resoluciones: " + err.message)
      console.error("Error de comparación:", err)
    } finally {
      setComparing(false)
    }
  }

  const getScoreColor = (score, maxScore = 25) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (!caso) {
    return (
      <div className="resolver-container">
        <p>No hay caso de estudio disponible. Regresa al inicio para generar uno.</p>
        <button onClick={() => navigate("/")} className="btn-primary">
          <ArrowLeft className="icon" />
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <div className="resolver-container">
      <header className="resolver-header">
        <button onClick={() => navigate("/")} className="btn-back">
          <ArrowLeft size={20} />
          Volver
        </button>
        <h1>Resolución del Caso ISO 9001</h1>
      </header>

      {loading ? (
        <div className="loading-section">
          <RefreshCw className="loading-icon" />
          <p>Generando resolución con IA...</p>
        </div>
      ) : (
        <>
          <div className="caso-display">
            <h2>Caso de Estudio</h2>
            <div className="caso-content">
              {caso}
            </div>
          </div>

          <div className="resolutions-grid">
            <div className="resolution-card">
              <h2>
                <BarChart3 className="icon" />
                Resolución de la IA
              </h2>
              <textarea 
                value={aiResolution} 
                readOnly 
                className="resolution-textarea readonly"
                rows={15}
              />
            </div>
            
            <div className="resolution-card">
              <h2>
                <CheckCircle className="icon" />
                Tu Resolución
              </h2>
              <textarea
                value={userResolution}
                onChange={(e) => setUserResolution(e.target.value)}
                placeholder="Escribe tu resolución aquí...
                
Incluye:
• Análisis del problema
• Aplicación de ISO 9001
• Plan de implementación
• Resultados esperados"
                className="resolution-textarea"
                rows={15}
              />
              <div className="textarea-counter">
                {userResolution.length} caracteres
              </div>
            </div>
          </div>

          <div className="compare-section">
            <button 
              onClick={handleCompare} 
              disabled={comparing || !userResolution.trim()}
              className={`btn-compare ${comparing ? 'loading' : ''}`}
            >
              {comparing ? (
                <>
                  <RefreshCw className="icon spin" />
                  Comparando...
                </>
              ) : (
                <>
                  <BarChart3 className="icon" />
                  Comparar Resoluciones
                </>
              )}
            </button>
          </div>

          {comparisonResult && (
            <div className="comparison-result">
              <div className="result-header">
                <h3>
                  <BarChart3 className="icon" />
                  Análisis de Similitud
                </h3>
                <div className={`similarity-badge ${getPercentageColor(comparisonResult.porcentaje)}`}>
                  {comparisonResult.porcentaje}%
                </div>
              </div>

              <div className="scores-grid">
                <div className="score-item">
                  <span className="score-label">Comprensión del problema</span>
                  <span className={`score-value ${getScoreColor(comparisonResult.puntuacion_comprension)}`}>
                    {comparisonResult.puntuacion_comprension}/25
                  </span>
                </div>
                <div className="score-item">
                  <span className="score-label">Aplicación ISO 9001</span>
                  <span className={`score-value ${getScoreColor(comparisonResult.puntuacion_iso9001)}`}>
                    {comparisonResult.puntuacion_iso9001}/25
                  </span>
                </div>
                <div className="score-item">
                  <span className="score-label">Estructura y organización</span>
                  <span className={`score-value ${getScoreColor(comparisonResult.puntuacion_estructura)}`}>
                    {comparisonResult.puntuacion_estructura}/25
                  </span>
                </div>
                <div className="score-item">
                  <span className="score-label">Completitud de la solución</span>
                  <span className={`score-value ${getScoreColor(comparisonResult.puntuacion_completitud)}`}>
                    {comparisonResult.puntuacion_completitud}/25
                  </span>
                </div>
              </div>

              {comparisonResult.fortalezas && comparisonResult.fortalezas.length > 0 && (
                <div className="feedback-section fortalezas">
                  <h4>
                    <CheckCircle className="icon text-green-600" />
                    Fortalezas identificadas
                  </h4>
                  <ul>
                    {comparisonResult.fortalezas.map((fortaleza, index) => (
                      <li key={index}>{fortaleza}</li>
                    ))}
                  </ul>
                </div>
              )}

              {comparisonResult.areas_mejora && comparisonResult.areas_mejora.length > 0 && (
                <div className="feedback-section areas-mejora">
                  <h4>
                    <AlertCircle className="icon text-yellow-600" />
                    Áreas de mejora
                  </h4>
                  <ul>
                    {comparisonResult.areas_mejora.map((area, index) => (
                      <li key={index}>{area}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="detailed-analysis">
                <h4>Análisis detallado</h4>
                <p>{comparisonResult.detalle}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Resolver
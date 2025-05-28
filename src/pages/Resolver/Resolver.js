import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { compareResolutions, generateGeminiContent } from "../../services/geminiService"
import { ArrowLeft, BarChart3, CheckCircle, AlertCircle, RefreshCw, User, Bot, Send } from "lucide-react"
import "./Resolver.css"

const Resolver = () => {
  const [aiResolution, setAiResolution] = useState("")
  const [userResolution, setUserResolution] = useState("")
  const [comparisonResult, setComparisonResult] = useState(null)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [step, setStep] = useState("user") // "user", "ai", "compare"
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
  }, [caso, navigate])

  const handleGenerateAI = async () => {
    if (!userResolution.trim()) {
      alert("Por favor, escribe tu resolución antes de generar la respuesta de la IA.")
      return
    }

    setGeneratingAI(true)
    try {
      const response = await generateGeminiContent(promptResolucion)
      setAiResolution(response)
      setStep("ai")
    } catch (err) {
      alert("Error al generar resolución con IA: " + err.message)
      setAiResolution("Error al generar resolución con IA: " + err.message)
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleCompare = async () => {
    setComparing(true)
    try {
      const result = await compareResolutions(aiResolution, userResolution)
      setComparisonResult(result)
      setStep("compare")
    } catch (err) {
      alert("Error al comparar resoluciones: " + err.message)
      console.error("Error de comparación:", err)
    } finally {
      setComparing(false)
    }
  }

  const handleReset = () => {
    setUserResolution("")
    setAiResolution("")
    setComparisonResult(null)
    setStep("user")
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
        {step !== "user" && (
          <button onClick={handleReset} className="btn-reset">
            <RefreshCw size={16} />
            Reiniciar
          </button>
        )}
      </header>

      {/* Progress indicator */}
      <div className="progress-indicator">
        <div className={`progress-step ${step === "user" ? "active" : step !== "user" ? "completed" : ""}`}>
          <div className="step-circle">
            <User size={16} />
          </div>
          <span>Tu Resolución</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step === "ai" ? "active" : step === "compare" ? "completed" : ""}`}>
          <div className="step-circle">
            <Bot size={16} />
          </div>
          <span>Resolución IA</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step === "compare" ? "active" : ""}`}>
          <div className="step-circle">
            <BarChart3 size={16} />
          </div>
          <span>Comparación</span>
        </div>
      </div>

      <div className="caso-display">
        <h2>Caso de Estudio</h2>
        <div className="caso-content">
          {caso}
        </div>
      </div>

      {/* Step 1: User Resolution */}
      {step === "user" && (
        <div className="step-container">
          <div className="step-card">
            <div className="step-header">
              <User className="step-icon" />
              <h2>Paso 1: Escribe tu resolución</h2>
              <p>Resuelve el caso de estudio con tus conocimientos sobre ISO 9001</p>
            </div>
            
            <textarea
              value={userResolution}
              onChange={(e) => setUserResolution(e.target.value)}
              placeholder="Escribe tu resolución detallada aquí...

Incluye:
• Análisis del problema identificado
• Aplicación de principios ISO 9001
• Plan de implementación paso a paso
• Resultados esperados y métricas
• Acciones de seguimiento"
              className="resolution-textarea large"
              rows={20}
            />
            <div className="textarea-counter">
              {userResolution.length} caracteres
            </div>

            <div className="step-actions">
              <button 
                onClick={handleGenerateAI}
                disabled={!userResolution.trim() || generatingAI}
                className="btn-next"
              >
                {generatingAI ? (
                  <>
                    <RefreshCw className="icon spin" />
                    Generando respuesta IA...
                  </>
                ) : (
                  <>
                    <Send className="icon" />
                    Continuar - Generar respuesta IA
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: AI Resolution */}
      {step === "ai" && (
        <div className="step-container">
          <div className="resolutions-comparison">
            <div className="resolution-card">
              <h2>
                <User className="icon" />
                Tu Resolución
              </h2>
              <div className="resolution-display">
                {userResolution}
              </div>
            </div>
            
            <div className="resolution-card">
              <h2>
                <Bot className="icon" />
                Resolución de la IA
              </h2>
              <div className="resolution-display">
                {aiResolution}
              </div>
            </div>
          </div>

          <div className="step-actions">
            <button 
              onClick={handleCompare}
              disabled={comparing}
              className="btn-compare"
            >
              {comparing ? (
                <>
                  <RefreshCw className="icon spin" />
                  Comparando resoluciones...
                </>
              ) : (
                <>
                  <BarChart3 className="icon" />
                  Comparar y Analizar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Comparison Results */}
      {step === "compare" && comparisonResult && (
        <div className="step-container">
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

            <div className="final-actions">
              <button onClick={handleReset} className="btn-secondary">
                <RefreshCw className="icon" />
                Intentar con otro caso
              </button>
              <button onClick={() => navigate("/")} className="btn-primary">
                <ArrowLeft className="icon" />
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Resolver
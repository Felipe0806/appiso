import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { compareResolutions, generateGeminiContent } from "../../services/geminiService"
import { ArrowLeft, BarChart3, CheckCircle, AlertCircle, RefreshCw, User, Bot, Send, Download } from "lucide-react"
import "./Resolver.css"

// Importar jsPDF - Asegúrate de instalarlo con: npm install jspdf
import jsPDF from 'jspdf'

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

const Resolver = () => {
  const [aiResolution, setAiResolution] = useState("")
  const [userResolution, setUserResolution] = useState("")
  const [comparisonResult, setComparisonResult] = useState(null)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [step, setStep] = useState("user") // "user", "ai", "compare"
  const [caseData, setCaseData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Intentar cargar desde el nuevo formato primero
    const storedCase = localStorage.getItem("casoISO9001")
    if (storedCase) {
      try {
        const parsedCase = JSON.parse(storedCase)
        setCaseData(parsedCase)
      } catch (error) {
        // Si falla el parseo, asumir que es el formato antiguo (string directo)
        setCaseData({ content: storedCase, isCustom: false })
      }
    } else {
      navigate("/")
      return
    }
  }, [navigate])

  const promptResolucion = `Resuelve este caso de estudio sobre ISO 9001 de manera detallada y estructurada. Incluye:
1. Análisis del problema
2. Aplicación de principios ISO 9001
3. Plan de implementación
4. Resultados esperados

Caso de estudio:
${caseData?.content || ""}`

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

  // Función para limpiar texto de markdown para PDF
  const cleanTextForPDF = (text) => {
    if (!text) return ""
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Quitar negritas
      .replace(/\*(.*?)\*/g, '$1')     // Quitar cursivas
      .replace(/#{1,6}\s*(.*)/g, '$1') // Quitar headers markdown
      .replace(/<br>/g, '\n')          // Convertir <br> a saltos de línea
      .replace(/<[^>]*>/g, '')         // Quitar todas las etiquetas HTML
      .replace(/\n\s*\n/g, '\n\n')    // Normalizar saltos de línea dobles
      .trim()
  }

  // Función para agregar texto con salto de línea automático
  const addTextWithWrap = (doc, text, x, y, maxWidth, lineHeight = 6) => {
    const lines = doc.splitTextToSize(text, maxWidth)
    let currentY = y
    
    lines.forEach(line => {
      if (currentY > 280) { // Si se sale de la página, crear nueva página
        doc.addPage()
        currentY = 20
      }
      doc.text(line, x, currentY)
      currentY += lineHeight
    })
    
    return currentY + 5 // Retornar la posición Y final con espacio extra
  }

  const handleDownloadPDF = () => {
    try {
      // Crear nuevo documento PDF
      const doc = new jsPDF()
      
      // Configurar fuente
      doc.setFont("helvetica")
      
      let yPosition = 20
      
      // Título principal
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text("REPORTE COMPLETO - ANÁLISIS CASO ISO 9001", 20, yPosition)
      yPosition += 15
      
      // Línea separadora
      doc.setLineWidth(0.5)
      doc.line(20, yPosition, 190, yPosition)
      yPosition += 10
      
      // Caso de estudio
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("CASO DE ESTUDIO", 20, yPosition)
      yPosition += 10
      
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      const cleanedCase = cleanTextForPDF(caseData?.content || "")
      yPosition = addTextWithWrap(doc, cleanedCase, 20, yPosition, 170)
      
      // Resolución del usuario
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }
      
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("RESOLUCIÓN DEL USUARIO", 20, yPosition)
      yPosition += 10
      
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      const cleanedUserResolution = cleanTextForPDF(userResolution)
      yPosition = addTextWithWrap(doc, cleanedUserResolution, 20, yPosition, 170)
      
      // Resolución de la IA
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }
      
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("RESOLUCIÓN DE LA IA", 20, yPosition)
      yPosition += 10
      
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      const cleanedAIResolution = cleanTextForPDF(aiResolution)
      yPosition = addTextWithWrap(doc, cleanedAIResolution, 20, yPosition, 170)
      
      // Resultados de la comparación
      if (comparisonResult) {
        if (yPosition > 200) {
          doc.addPage()
          yPosition = 20
        }
        
        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.text("RESULTADOS DE LA COMPARACIÓN", 20, yPosition)
        yPosition += 15
        
        // Porcentaje de similitud
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text(`Porcentaje de similitud: ${comparisonResult.porcentaje || 0}%`, 20, yPosition)
        yPosition += 15
        
        // Puntuaciones detalladas
        doc.setFontSize(12)
        doc.text("Puntuaciones detalladas:", 20, yPosition)
        yPosition += 8
        
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(`• Comprensión del problema: ${comparisonResult.puntuacion_comprension || 0}/25`, 25, yPosition)
        yPosition += 6
        doc.text(`• Aplicación ISO 9001: ${comparisonResult.puntuacion_iso9001 || 0}/25`, 25, yPosition)
        yPosition += 6
        doc.text(`• Estructura y organización: ${comparisonResult.puntuacion_estructura || 0}/25`, 25, yPosition)
        yPosition += 6
        doc.text(`• Completitud de la solución: ${comparisonResult.puntuacion_completitud || 0}/25`, 25, yPosition)
        yPosition += 15
        
        // Fortalezas
        if (comparisonResult.fortalezas && comparisonResult.fortalezas.length > 0) {
          doc.setFontSize(12)
          doc.setFont("helvetica", "bold")
          doc.text("Fortalezas identificadas:", 20, yPosition)
          yPosition += 8
          
          doc.setFontSize(10)
          doc.setFont("helvetica", "normal")
          comparisonResult.fortalezas.forEach(fortaleza => {
            if (yPosition > 280) {
              doc.addPage()
              yPosition = 20
            }
            yPosition = addTextWithWrap(doc, `• ${fortaleza}`, 25, yPosition, 165)
          })
          yPosition += 5
        }
        
        // Áreas de mejora
        if (comparisonResult.areas_mejora && comparisonResult.areas_mejora.length > 0) {
          doc.setFontSize(12)
          doc.setFont("helvetica", "bold")
          doc.text("Áreas de mejora:", 20, yPosition)
          yPosition += 8
          
          doc.setFontSize(10)
          doc.setFont("helvetica", "normal")
          comparisonResult.areas_mejora.forEach(area => {
            if (yPosition > 280) {
              doc.addPage()
              yPosition = 20
            }
            yPosition = addTextWithWrap(doc, `• ${area}`, 25, yPosition, 165)
          })
          yPosition += 10
        }
        
        // Análisis detallado
        if (comparisonResult.detalle) {
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 20
          }
          
          doc.setFontSize(12)
          doc.setFont("helvetica", "bold")
          doc.text("Análisis detallado:", 20, yPosition)
          yPosition += 8
          
          doc.setFontSize(10)
          doc.setFont("helvetica", "normal")
          const cleanedDetail = cleanTextForPDF(comparisonResult.detalle)
          yPosition = addTextWithWrap(doc, cleanedDetail, 20, yPosition, 170)
        }
      }
      
      // Footer en la última página
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text(`Generado por ISO 9001 Generator - ${new Date().toLocaleDateString()}`, 20, 290)
        doc.text(`Página ${i} de ${pageCount}`, 170, 290)
      }
      
      // Descargar el PDF
      const fileName = `reporte-iso9001-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
      alert("Reporte PDF descargado exitosamente")
      
    } catch (error) {
      console.error("Error generando PDF:", error)
      alert("Error al generar el PDF. Intenta nuevamente.")
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

  if (!caseData) {
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
        <div className="caso-header">
          <h2>Caso de Estudio</h2>
          <span className={`case-badge ${caseData.isCustom ? "custom" : "generated"}`}>
            {caseData.isCustom ? "Personalizado" : "Generado por IA"}
          </span>
        </div>
        <div className="caso-content">
          <MarkdownRenderer text={caseData.content} />
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
                <MarkdownRenderer text={userResolution} />
              </div>
            </div>
            
            <div className="resolution-card">
              <h2>
                <Bot className="icon" />
                Resolución de la IA
              </h2>
              <div className="resolution-display">
                <MarkdownRenderer text={aiResolution} />
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
              <MarkdownRenderer text={comparisonResult.detalle} />
            </div>

            <div className="final-actions">
              <button onClick={handleDownloadPDF} className="btn-download">
                <Download className="icon" />
                Descargar Reporte PDF
              </button>
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
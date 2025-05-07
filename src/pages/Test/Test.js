"use client"

import { useState } from "react"
import { generateGeminiContent } from "../../services/geminiService"
import "./Test.css"
import { ArrowRight, BookOpen, CheckCircle, FileText, HelpCircle, RefreshCw, XCircle } from "lucide-react"

const Test = () => {
  const savedCase = localStorage.getItem("casoISO9001") || ""
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Estado para las respuestas de usuario
  const [answers, setAnswers] = useState([])
  // Estado para resultados comparativos
  const [results, setResults] = useState([])
  const [score, setScore] = useState(null)
  const [comparing, setComparing] = useState(false)
  const [compareError, setCompareError] = useState("")

  // Generar preguntas
  const handleIniciar = async () => {
    setError("")
    setResults([])
    setScore(null)
    if (!savedCase) {
      setError("No hay un caso guardado para generar preguntas.")
      return
    }

    setLoading(true)

    const prompt = `
Dado el siguiente caso de estudio sobre la implementación de ISO 9001:
"""
${savedCase}
"""
Genera cinco preguntas abiertas que:
1. Se centren en las acciones tomadas para cumplir ISO 9001.
2. Indaguen en problemas identificados y sus soluciones.
3. Sean claras y directas.

Devuélvelas solo en JSON puro (sin triple backticks, ni texto extra) con esta estructura:
{
  "questions": [
    "Pregunta 1…",
    "Pregunta 2…",
    …
    "Pregunta 5…"
  ]
}
    `

    try {
      const raw = await generateGeminiContent(prompt)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("No se encontró un objeto JSON en la respuesta.")

      const parsed = JSON.parse(jsonMatch[0])
      const qs = parsed.questions || []
      setQuestions(qs)
      // Inicializa respuestas vacías
      setAnswers(Array(qs.length).fill(""))
    } catch (err) {
      setError("Error generando preguntas: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Al escribir en un input guardamos en answers
  const handleAnswerChange = (idx, value) => {
    const copy = [...answers]
    copy[idx] = value
    setAnswers(copy)
  }

  // Comparar respuestas con la IA
  const handleComparar = async () => {
    setCompareError("")
    setScore(null)
    setResults([])
    setComparing(true)

    // montamos prompt dinámico con preguntas y respuestas de usuario
    const preguntasList = questions.map((q, i) => `${i + 1}. ${q}`).join("\n")
    const respuestasList = answers.map((ans, i) => `${i + 1}. ${ans}`).join("\n")

    const prompt = `
Dado el siguiente caso de estudio:
"""
${savedCase}
"""
Y estas preguntas:
${preguntasList}

El usuario respondió:
${respuestasList}

Ahora:
1. Genera las respuestas ideales a cada pregunta basadas en el caso.
2. Para cada pregunta, compara la respuesta del usuario con la ideal, indicando si es correcta o incorrecta.
3. Proporciona retroalimentación sobre en qué se equivocó o cómo mejorar.
Devuélvelo solo en JSON puro con esta estructura:
{
  "results": [
    {
      "question": "...",
      "userAnswer": "...",
      "correctAnswer": "...",
      "isCorrect": true,
      "feedback": "..."
    },
    // … total 5 objetos
  ],
  "score": X
}
    `

    try {
      const raw = await generateGeminiContent(prompt)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("No se encontró un objeto JSON en la respuesta de comparación.")

      const parsed = JSON.parse(jsonMatch[0])
      setResults(parsed.results || [])
      setScore(parsed.score ?? null)
    } catch (err) {
      setCompareError("Error al comparar: " + err.message)
    } finally {
      setComparing(false)
    }
  }

  return (
    <div className="test-container">
      <header className="test-header">
        <div className="logo-container">
          <div className="logo">
            <BookOpen size={28} />
          </div>
          <h1>Test ISO 9001</h1>
        </div>
        <p className="header-subtitle">Evalúa tu comprensión sobre la implementación de ISO 9001</p>
      </header>

      <main className="test-main">
        <div className="card">
          <div className="card-header">
            <h2>Caso de Estudio</h2>
            <p>Analiza el siguiente caso y responde a las preguntas</p>
          </div>

          <div className="test-case">
            {savedCase ? (
              <div className="case-content">{savedCase}</div>
            ) : (
              <div className="case-empty">
                <FileText size={32} />
                <p>No se encontró ningún caso guardado.</p>
                <p className="case-empty-hint">Genera un caso en la página principal primero.</p>
              </div>
            )}
          </div>

          {error && (
            <div className="alert alert-error">
              <XCircle className="alert-icon" />
              <p>{error}</p>
            </div>
          )}

          {/* Botón Iniciar */}
          {questions.length === 0 && (
            <div className="test-actions">
              <button
                className={`test-button primary ${loading ? "loading" : ""}`}
                onClick={handleIniciar}
                disabled={loading || !savedCase}
              >
                {loading ? (
                  <>
                    <RefreshCw className="icon spin" />
                    Generando preguntas...
                  </>
                ) : (
                  <>
                    <HelpCircle className="icon" />
                    Generar Preguntas
                  </>
                )}
              </button>
            </div>
          )}

          {/* Render de preguntas con inputs */}
          {questions.length > 0 && (
            <div className="test-questions-section">
              <div className="section-header">
                <h3>Preguntas</h3>
                <p>Responde a las siguientes preguntas basadas en el caso de estudio</p>
              </div>

              <div className="test-questions">
                {questions.map((q, i) => (
                  <div key={i} className="test-question">
                    <label htmlFor={`question-${i}`}>
                      <span className="question-number">{i + 1}</span>
                      <span className="question-text">{q}</span>
                    </label>
                    <textarea
                      id={`question-${i}`}
                      className="test-input"
                      value={answers[i]}
                      onChange={(e) => handleAnswerChange(i, e.target.value)}
                      placeholder="Escribe tu respuesta aquí..."
                      rows={3}
                    />
                  </div>
                ))}

                {/* Botón Comparar */}
                <div className="test-actions">
                  <button
                    className={`test-button primary ${comparing ? "loading" : ""}`}
                    onClick={handleComparar}
                    disabled={answers.some((a) => !a.trim()) || comparing}
                  >
                    {comparing ? (
                      <>
                        <RefreshCw className="icon spin" />
                        Comparando...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="icon" />
                        Evaluar Respuestas
                      </>
                    )}
                  </button>
                </div>

                {compareError && (
                  <div className="alert alert-error">
                    <XCircle className="alert-icon" />
                    <p>{compareError}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mostrar resultados comparativos */}
          {results.length > 0 && (
            <div className="test-results-section">
              <div className="section-header">
                <h3>Resultados</h3>
                {score !== null && (
                  <div className="score-badge">
                    <span>
                      Puntuación: {score}/{questions.length}
                    </span>
                  </div>
                )}
              </div>

              <div className="test-results">
                {results.map((res, i) => (
                  <div key={i} className={`result-card ${res.isCorrect ? "correct" : "incorrect"}`}>
                    <div className="result-header">
                      <div className="result-number">Pregunta {i + 1}</div>
                      <div className="result-status">
                        {res.isCorrect ? (
                          <CheckCircle className="status-icon correct" />
                        ) : (
                          <XCircle className="status-icon incorrect" />
                        )}
                      </div>
                    </div>

                    <div className="result-question">{res.question}</div>

                    <div className="result-details">
                      <table className="result-table">
                        <tbody>
                          <tr>
                            <th>Tu respuesta:</th>
                            <td>{res.userAnswer}</td>
                          </tr>
                          <tr>
                            <th>Respuesta ideal:</th>
                            <td>{res.correctAnswer}</td>
                          </tr>
                          <tr>
                            <th>Feedback:</th>
                            <td>{res.feedback}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {score !== null && (
                <div className="test-summary">
                  <div className="summary-score">
                    <div className="summary-title">Resultado Final</div>
                    <div className="summary-value">
                      {score}/{questions.length}
                    </div>
                  </div>
                  <div className="summary-message">
                    {score === questions.length ? (
                      <p>¡Excelente! Has respondido correctamente a todas las preguntas.</p>
                    ) : score >= questions.length / 2 ? (
                      <p>Buen trabajo. Has comprendido los conceptos principales, pero hay áreas para mejorar.</p>
                    ) : (
                      <p>Revisa el caso de estudio nuevamente para comprender mejor los conceptos de ISO 9001.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="test-footer">
        <p>© {new Date().getFullYear()} ISO 9001 Generador | Grupo 7 :Cueva,Aguilar,Almeida</p>
      </footer>
    </div>
  )
}

export default Test

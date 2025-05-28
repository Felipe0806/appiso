// src/services/geminiService.js

/**
 * Llama a la API de Gemini para generar texto a partir de un prompt.
 * @param {string} prompt - El texto de entrada.
 * @returns {Promise<string>} - El texto generado por la API.
 * @throws {Error} - Si la petición falla o la API responde con error.
 */
export async function generateGeminiContent(prompt) {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  const apiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  const res = await fetch(`${apiUrl}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Error en la API: ${errorData.error.message}`);
  }

  const data = await res.json();
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simula espera
  return data.candidates[0].content.parts[0].text;
}

/**
 * Compara dos resoluciones utilizando la API de Gemini.
 * @param {string} resolucionIA - Resolución generada por la IA.
 * @param {string} resolucionUsuario - Resolución escrita por el usuario.
 * @returns {Promise<Object>} - Objeto con porcentaje y análisis detallado.
 */
export async function compareResolutions(resolucionIA, resolucionUsuario) {
  const prompt = `Eres un evaluador experto en ISO 9001. Debes comparar una resolución de referencia (IA) con la resolución de un estudiante.

CRITERIOS DE EVALUACIÓN ESTRICTOS:

1. RELEVANCIA TEMÁTICA (CRÍTICO): 
   - Si la resolución del usuario NO trata sobre ISO 9001, calidad, procesos empresariales o temas relacionados, la puntuación DEBE ser 0-5%.
   - Si contiene texto irrelevante (comida, deportes, temas personales, etc.), penalizar severamente.

2. COMPRENSIÓN DEL PROBLEMA (0-25 puntos):
   - ¿Identifica correctamente los problemas del caso?
   - ¿Comprende el contexto empresarial?

3. APLICACIÓN DE ISO 9001 (0-25 puntos):
   - ¿Aplica correctamente los principios y requisitos de ISO 9001?
   - ¿Menciona cláusulas o conceptos específicos relevantes?

4. ESTRUCTURA Y ORGANIZACIÓN (0-25 puntos):
   - ¿Presenta una respuesta organizada y coherente?
   - ¿Sigue una lógica clara de implementación?

5. COMPLETITUD DE LA SOLUCIÓN (0-25 puntos):
   - ¿Proporciona una solución completa y práctica?
   - ¿Incluye pasos de implementación y seguimiento?

REGLAS DE PUNTUACIÓN:
- Si el texto es completamente irrelevante al tema: 0-5%
- Si es parcialmente relevante pero muy deficiente: 5-25%
- Si es relevante pero con errores importantes: 25-50%
- Si es bueno pero mejorable: 50-75%
- Si es excelente: 75-100%

Resolución de REFERENCIA (IA):
${resolucionIA}

Resolución del ESTUDIANTE:
${resolucionUsuario}

IMPORTANTE: Sé MUY ESTRICTO. Si la resolución del estudiante no trata sobre ISO 9001 o es irrelevante, asigna puntuaciones muy bajas (0-5%).

Responde EXACTAMENTE en este formato JSON:
{
  "porcentaje": 0,
  "puntuacion_comprension": 0,
  "puntuacion_iso9001": 0,
  "puntuacion_estructura": 0,
  "puntuacion_completitud": 0,
  "fortalezas": ["Lista de fortalezas encontradas"],
  "areas_mejora": ["Lista de áreas que necesitan mejora"],
  "detalle": "Análisis detallado explicando por qué se asignó esta puntuación, especialmente si es baja por irrelevancia temática."
}`;

  try {
    const response = await generateGeminiContent(prompt);
    
    // Intentar parsear como JSON
    try {
      // Limpiar la respuesta de posibles caracteres extra
      const cleanResponse = response.trim().replace(/```json|```/g, '');
      const parsedResult = JSON.parse(cleanResponse);
      
      // Validar que tiene las propiedades necesarias
      if (parsedResult.porcentaje !== undefined && parsedResult.detalle) {
        // Validación adicional: si el porcentaje es muy alto pero las puntuaciones individuales son bajas
        const totalPuntuacion = (parsedResult.puntuacion_comprension || 0) + 
                               (parsedResult.puntuacion_iso9001 || 0) + 
                               (parsedResult.puntuacion_estructura || 0) + 
                               (parsedResult.puntuacion_completitud || 0);
        
        // Recalcular porcentaje basado en puntuaciones individuales para mayor consistencia
        const porcentajeCalculado = Math.round((totalPuntuacion / 100) * 100);
        
        return {
          ...parsedResult,
          porcentaje: Math.min(parsedResult.porcentaje, porcentajeCalculado) // Tomar el menor para ser más estricto
        };
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (parseError) {
      // Si falla el parseo JSON, intentar extraer el porcentaje manualmente
      console.warn('No se pudo parsear JSON, extrayendo porcentaje manualmente');
      return extractPercentageFromText(response);
    }
  } catch (error) {
    throw new Error(`Error al comparar resoluciones: ${error.message}`);
  }
}

/**
 * Extrae el porcentaje de un texto cuando el parseo JSON falla
 * @param {string} text - Texto de respuesta
 * @returns {Object} - Objeto con porcentaje y detalle
 */
function extractPercentageFromText(text) {
  // Buscar patrones de porcentaje
  const percentageMatch = text.match(/(\d+)%/);
  const percentage = percentageMatch ? parseInt(percentageMatch[1]) : 0;
  
  // Si no se encuentra un porcentaje válido y el texto parece irrelevante, asignar 0
  const finalPercentage = percentage > 0 ? percentage : 0;
  
  // Buscar sección de justificación
  const justificationMatch = text.match(/justificación:?\s*(.*)/i);
  const justification = justificationMatch ? justificationMatch[1].trim() : text;
  
  return {
    porcentaje: finalPercentage,
    detalle: justification,
    fortalezas: [],
    areas_mejora: ["La respuesta no parece estar relacionada con ISO 9001 o gestión de calidad"],
    puntuacion_comprension: Math.round(finalPercentage * 0.25),
    puntuacion_iso9001: Math.round(finalPercentage * 0.25),
    puntuacion_estructura: Math.round(finalPercentage * 0.25),
    puntuacion_completitud: Math.round(finalPercentage * 0.25)
  };
}
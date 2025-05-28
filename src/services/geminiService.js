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
  const prompt = `Compara la siguiente resolución realizada por una IA y una resolución escrita por un usuario humano. Analiza similitudes en el razonamiento, la lógica de resolución, la estructura y el cumplimiento de los principios de ISO 9001.

Evalúa los siguientes aspectos:
1. Comprensión del problema (0-25 puntos)
2. Aplicación correcta de ISO 9001 (0-25 puntos)
3. Estructura y organización (0-25 puntos)
4. Completitud de la solución (0-25 puntos)

Resolución de la IA:
${resolucionIA}

Resolución del usuario:
${resolucionUsuario}

IMPORTANTE: Responde EXACTAMENTE en este formato JSON (sin texto adicional):
{
  "porcentaje": 85,
  "puntuacion_comprension": 20,
  "puntuacion_iso9001": 22,
  "puntuacion_estructura": 18,
  "puntuacion_completitud": 20,
  "fortalezas": ["Punto fuerte 1", "Punto fuerte 2"],
  "areas_mejora": ["Área de mejora 1", "Área de mejora 2"],
  "detalle": "Análisis detallado de la comparación explicando las similitudes y diferencias encontradas."
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
        return parsedResult;
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
  
  // Buscar sección de justificación
  const justificationMatch = text.match(/justificación:?\s*(.*)/i);
  const justification = justificationMatch ? justificationMatch[1].trim() : text;
  
  return {
    porcentaje: percentage,
    detalle: justification,
    fortalezas: [],
    areas_mejora: [],
    puntuacion_comprension: Math.round(percentage * 0.25),
    puntuacion_iso9001: Math.round(percentage * 0.25),
    puntuacion_estructura: Math.round(percentage * 0.25),
    puntuacion_completitud: Math.round(percentage * 0.25)
  };
}
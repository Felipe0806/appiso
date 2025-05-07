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
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return data.candidates[0].content.parts[0].text;
}

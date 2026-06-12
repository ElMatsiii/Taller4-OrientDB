// Define la URL de Ollama y el modelo a usar. 
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://host.docker.internal:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma2:2b';

// Verifica si la URL de Ollama y el modelo están definidos. 
if (!OLLAMA_URL) {
  throw new Error('OLLAMA_URL no está definido');
}
if (!OLLAMA_MODEL) {
  throw new Error('OLLAMA_MODEL no está definido');
}

// Crea la URL base para la solicitud a Ollama.
const baseUrl = (() => {
  try {
    return new URL(OLLAMA_URL);
  } catch (error) {
    throw new Error(`OLLAMA_URL inválido: ${OLLAMA_URL}`);
  }
})();

/**
 * Envía mensajes a Ollama y procesa la respuesta en streaming. 
 * @param {object} messages Los mensajes que se enviarán a Ollama. 
 * @param {function} onToken Callback que se llama para cada fragmento de texto que llega. 
 */
export async function streamChatResponse({ messages, onToken }) {
  let response;

  try {
    // Envía la solicitud al API de Ollama. 
    response = await fetch(`${baseUrl.href.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL, // Modelo a usar en Ollama
        messages, // Mensajes a enviar a Ollama
        stream: true, 
        keep_alive: -1, 
      }),
    });
  } catch (error) {
    // Si hay un error al conectar con Ollama, lanza una excepción.
    throw new Error(`Error conectando con Ollama en ${baseUrl.href}: ${error.message}`);
  }

  // Verifica si la respuesta de Ollama es correcta. 
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Error al comunicarse con Ollama en ${baseUrl.href}`);
  }

  // Lee el stream en chunks y procesa cada línea JSON. 
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullResponse = '';

  while (true) {
    // Lee un fragmento de texto del stream de Ollama.
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true }); 
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Revisa la línea final.

    for (const line of lines) {
      // Si la línea está vacía, continúa. 
      if (!line.trim()) continue; 
      try {
        // Parsar la línea JSON.
        const json = JSON.parse(line);
        const token = json.message?.content ?? ''; 

        if (token) { 
          fullResponse += token; // Agrega el texto a la respuesta final.
          onToken(token); // Llama al callback con el fragmento de texto.
        }
      
        // Verifica si se ha terminado la respuesta de Ollama. 
        if (json.done) { 
          if (json.done_reason === 'load') continue; 
          return fullResponse; // Retorna la respuesta completa.
        }
      } catch (error) { 
        // Si hay un error al parsear la línea JSON, lo imprime en consola. 
        console.error('Error parseando línea de Ollama:', line, error.message);
      }
    }
  }

  return fullResponse; // Retorna la respuesta completa. 
}

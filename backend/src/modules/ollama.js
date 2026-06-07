import dotenv from 'dotenv';
dotenv.config();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://host.docker.internal:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma2:2b';

if (!OLLAMA_URL) {
  throw new Error('OLLAMA_URL no está definido');
}
if (!OLLAMA_MODEL) {
  throw new Error('OLLAMA_MODEL no está definido');
}

const baseUrl = (() => {
  try {
    return new URL(OLLAMA_URL);
  } catch (error) {
    throw new Error(`OLLAMA_URL inválido: ${OLLAMA_URL}`);
  }
})();

export async function streamChatResponse({ messages, onToken }) {
  let response;
  try {
    response = await fetch(`${baseUrl.href.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: true,
        keep_alive: -1,
      }),
    });
  } catch (error) {
    throw new Error(`Error conectando con Ollama en ${baseUrl.href}: ${error.message}`);
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Error al comunicarse con Ollama en ${baseUrl.href}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const json = JSON.parse(line);
        const token = json.message?.content ?? '';
        if (token) {
          fullResponse += token;
          onToken(token);
        }

        if (json.done) {
          if (json.done_reason === 'load') continue;
          return fullResponse;
        }
      } catch (error) {
        console.error('Error parseando línea de Ollama:', line, error.message);
      }
    }
  }

  return fullResponse;
}

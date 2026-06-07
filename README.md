# Taller4-OrientDB

## Requisitos
- Docker Desktop
- Ollama → https://ollama.com/download

## Instalación

1. Instalar Ollama y descargar el modelo:
```bash
   ollama pull gemma2:2b
```

2. Clonar el repo y levantar:
```bash
   docker compose up --build
```

3. Abrir http://localhost:5173

## Primera vez
El sistema crea la base de datos y el usuario automáticamente.
La primera vez puede tardar ~1 minuto en estar listo.
# Clinical Intelligence Infrastructure

A clinical reasoning augmentation layer for modern therapists.

## 🚀 Vision
To move beyond simple AI note generation and provide longitudinal clinical intelligence, risk validation, and treatment alignment.

## 📂 Structure
- `backend/`: FastAPI + LlamaIndex + Ollama integration.
- `frontend/`: React (TypeScript) + Tailwind CSS dashboard.
- `data/`:
    - `org_configs/`: Multi-tenant configuration (Instructions, Schemas).
    - `knowledge_bases/`: Organization-specific RAG sources.
- `docs/`:
    - `ARCHITECTURE.md`: Technical design and extensibility.
    - `PROGRESS.md`: Current development status and roadmap.

## 🛠 Setup
Run the setup script to initialize the backend virtual environment and install frontend dependencies:
```bash
./setup.sh
```

## 🧠 Adaptability
To add a new organization:
1. Create a folder in `data/org_configs/{org_id}/`.
2. Add `config.json` (defines rules) and `instructions.md` (defines tone/reasoning).
3. Place relevant PDF/Markdown files in `data/knowledge_bases/{org_id}/` for the RAG engine to pick up.

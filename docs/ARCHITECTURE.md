# 🏗️ Clinical Intelligence Architecture

## Core Philosophy
A modular, multi-tenant clinical reasoning engine that separates the **Reasoning Logic** from **Clinical Knowledge** and **Organizational Instructions**.

## 1. Adaptability Layer (Org-Specific)
Organizations can customize the engine without changing the core code.
- **`data/org_configs/{org_id}/config.json`**: Defines tone, required SOAP elements, and specific clinical constraints.
- **`data/org_configs/{org_id}/instructions.md`**: System prompts specific to the organization's methodology.
- **`data/knowledge_bases/{org_id}/`**: Local PDF/Markdown repository for clinical guidelines, internal protocols, or research papers. These are indexed into ChromaDB.

## 2. Multi-Agent Reasoning Loop
- **Generator Agent**: Raw notes -> Draft SOAP/DAP.
- **Critique Agent**: Checks for fluff, ambiguity, and longitudinal consistency.
- **Risk Validator**: Scans for "Self-Harm", "Mandated Reporting", "High Risk" markers.
- **Alignment Agent**: Ensures the note matches the Treatment Plan and Goal Progress.

## 3. Technology Stack
- **Backend**: FastAPI (Python 3.11+)
- **LLM Orchestration**: LlamaIndex (for RAG and Agentic loops)
- **Local LLM**: Ollama (Llama 3 / Mistral)
- **Vector DB**: ChromaDB (Persistence for longitudinal memory)
- **Relational DB**: PostgreSQL/SQLite (Metadata and session records)
- **Frontend**: React + Tailwind CSS

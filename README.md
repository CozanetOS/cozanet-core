# @cozanet/core

CozanetOS Core AI Orchestration Engine.

This repository implements the core module of CozanetOS, providing the central executive orchestration (CEO) and specialized modular engines:
- **CEO AI Orchestration Engine**: Handles communication, intent routing, and event broadcasting.
- **Identity Engine**: Manages user identities and system/agent personalities.
- **Planning Engine**: Handles high-level goal decomposition and plan generation.
- **Reasoning Engine**: Delivers LLM reasoning via the Groq API (`llama3-70b-8192`).
- **Decision Engine**: Evaluates multiple options under specified contexts to make logical decisions.
- **Bootloader**: Initializes all engines, registers them with the central CEO, and boots the system.

## Installation & Setup

```bash
npm install
npm run build
```

## Environment Variables

- `GROQ_API_KEY_1`: Required for the reasoning engine to interact with the Groq API.

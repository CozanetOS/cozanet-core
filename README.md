# cozanet-core

[![CozanetOS Core](https://img.shields.io/badge/CozanetOS-Core-blue.svg)]()
[![AI-Native OS](https://img.shields.io/badge/Architecture-AI--Native%20OS-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-Apache%202.0-orange.svg)]()

`cozanet-core` is the central orchestration and runtime engine of **CozanetOS**, the world's premier AI-native operating system. Designed from the ground up to replace legacy process models with intelligent agentic execution, `cozanet-core` acts as the CPU, bootloader, executive branch, and ethical guide of the entire ecosystem. It translates high-level human and system objectives into structured execution plans, coordinates specialized sub-agents, and continuously monitors performance, confidence, and system constraints.

---

## 🚀 Key Capabilities

*   **CEO Orchestration & Intent Routing:** Directs high-level human objectives to correct specialized agentic sub-systems (`cozanet-agents`), acting as the supreme router.
*   **Multi-Step Reasoning & Planning Engine:** Formulates multi-phase execution graphs from unstructured prompts using advanced tree-of-thought and chain-of-thought paradigms.
*   **Goal Management & Task Decomposition:** Recursively breaks complex, long-running objectives into discrete, atomic, manageable tasks.
*   **Decision-Making & Policy Execution:** Evaluates choices dynamically against current state, capabilities, and system parameters.
*   **Self-Reflection & Response Verification:** Critically inspects self-generated solutions and agentic outputs before dispatch to eliminate errors.
*   **Confidence Estimation & Hallucination Detection:** Employs dual-pass evaluation to score certainty and halt/adjust execution paths when hallucination risks cross pre-defined thresholds.
*   **Multi-Agent & Multi-LLM Orchestration:** Coordinates cooperative task execution across multiple specialized agents while routing queries to optimal LLM models (frontier, utility, local, or specialized) based on cost, latency, and capability requirements.
*   **Adaptive Response Generation:** Synthesizes context-aware responses customized to the user’s preferred depth, medium, and style.
*   **Context & Working Memory Integration:** Interfaces directly with low-latency session contexts, ensuring continuous context-awareness.
*   **Bootloader Engine:** Powers up the OS. Responsible for starting, validating, and establishing heartbeat connections to all primary CozanetOS engines upon boot.
*   **Constitution & Guardrails Engine:** Enforces behavioral, ethical, safety, and security policies dynamically across all engines.
*   **Lifecycle Management Engine:** Provides full control over the execution state (start, pause, stop, hot-reload, restart) of any system engine or active agent.
*   **Capability Registry:** Catalogs and dynamically discovers available services, skills, tools, and interfaces across all modules.
*   **Personality Engine:** Maintains a cohesive, professional, AI-native brand identity, voice, and system persona across all user interactions.

---

## 🏛️ Architecture & Component Breakdown

```
                    +------------------------------------+
                    |        CozanetOS Bootloader        |
                    +-----------------+------------------+
                                      |
                                      v
                    +-----------------+------------------+
                    |          CEO Orchestrator          |
                    +----+------------+------------+-----+
                         |            |            |
                         v            v            v
           +-------------+--+  +------+------+  +--+-------------+
           | Planning Engine|  | Reason & Dec|  |  Constitution  |
           +-------------+--+  +------+------+  +--+-------------+
                         |            |            |
                         +------------+------------+
                                      |
                                      v
                    +-----------------+------------------+
                    |   Lifecycle & Capability Registry  |
                    +-----------------+------------------+
                                      |
                                      v
                    +-----------------+------------------+
                    |  Self-Reflection & Response Verif. |
                    +------------------------------------+
```

1.  **Bootloader (`/boot`):** The initial entry point. Initializes system configurations, mounts database and memory pools, registers core services, and signals readiness over the communication bus.
2.  **CEO Orchestrator (`/orchestration/ceo`):** The primary kernel-space orchestrator. Inspects incoming user intent, selects active agents, and schedules concurrent operations.
3.  **Planning & Reason Engines (`/reasoning`):** Houses the logic for complex problem solving, including goal representation models, task dependency resolvers, and alternative path search algorithms.
4.  **Constitution Engine (`/security/constitution`):** Evaluates every scheduled action, prompt template, and response payload against CozanetOS Safety and Alignment guidelines.
5.  **Lifecycle Manager (`/lifecycle`):** Tracks process threads, manages event-driven restarts, and executes clean tear-downs of system tasks.

---

## 🔌 API & Interface Overview

`cozanet-core` exposes a clean, programmatic interface via local IPC, WebSockets, and secure HTTP REST APIs.

### 1. Boot up the Core Engines
```bash
# Starts the core runtime and boots up all registered companion modules
cozanetos-core boot --config /etc/cozanet/core.yaml
```

### 2. Submit Goal to CEO Orchestrator (gRPC / HTTP REST)
*   **Endpoint:** `POST /api/v1/orchestration/goal`
*   **Payload:**
```json
{
  "goal_id": "goal-9011-alpha",
  "prompt": "Analyze our server logs in cozanet-memory, identify top 3 IP addresses with failed logins, and notify security group.",
  "priority": "HIGH",
  "execution_constraints": {
    "max_cost_limit": 1.50,
    "allow_external_browsing": true
  }
}
```
*   **Response:**
```json
{
  "status": "ACCEPTED",
  "plan_steps": [
    { "step": 1, "agent": "DatabaseAgent", "action": "query_logs" },
    { "step": 2, "agent": "AnalyticsAgent", "action": "rank_malicious_ips" },
    { "step": 3, "agent": "SecurityAgent", "action": "verify_ips" },
    { "step": 4, "agent": "EmailAgent", "action": "dispatch_alert" }
  ],
  "estimated_time_seconds": 12.5
}
```

---

## 🔗 Integration with Other CozanetOS Modules

`cozanet-core` is the executive branch of CozanetOS, connecting tightly to:
*   **`cozanet-memory`:** Pulls short-term context and long-term user profiles during planning.
*   **`cozanet-agents`:** Spawns and manages specialized worker engines to execute distinct planning nodes.
*   **`cozanet-communication`:** Broadcasts life-cycle events, receives intent vectors, and relays command outputs via the primary communication bus.
*   **`cozanet-security`:** Consults permission boundaries and authenticates code execution attempts.
*   **`cozanet-api`:** Exposes administrative access to remote developers and orchestration dashboards.

---

## ⚡ Quick-Start Notes

### Prerequisites
*   Python 3.11+
*   Docker & Redis (for state management)
*   Access keys to integrated model providers (OpenAI, Anthropic, or local Ollama endpoints)

### Local Development Setup
```bash
# Clone the repository
git clone https://github.com/CozanetOS/cozanet-core.git
cd cozanet-core

# Install dependencies
pip install -e .

# Configure Environment
cp .env.example .env
# Edit .env with your LLM credentials and Cozanet system paths

# Run System Bootstrap Diagnostic
python -m cozanet_core.boot --dry-run
```

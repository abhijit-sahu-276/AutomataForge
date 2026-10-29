# AutomataForge ⚙️
### An AI-Assisted Formal Language Compiler and Automata Analysis System

AutomataForge is an interactive, full-stack educational Theory of Computation (TOC) web application designed for computer science students and instructors to construct, simulate, minimize, compare, debug, and understand **Deterministic Finite Automata (DFAs)**.

---

## 📑 Table of Contents
1. [Overview & Project Objective](#overview--project-objective)
2. [Theory of Computation Concepts Covered](#theory-of-computation-concepts-covered)
3. [System Architecture](#system-architecture)
4. [Core Features](#core-features)
   - [Automata Doctor (DFA Debugger & Formally Verified Repairs)](#1-automata-doctor)
   - [Equivalence Hunter (Synchronous Product Automaton BFS)](#2-equivalence-hunter)
   - [Minimization Observatory (Hopcroft Partition Refinement)](#3-minimization-observatory)
   - [Natural Language to Automaton](#4-natural-language-to-automaton)
   - [Interactive String Simulator & Playground](#5-interactive-string-simulator)
5. [AI Integration & Security Model](#ai-integration--security-model)
6. [Project Structure](#project-structure)
7. [Prerequisites & Installation](#prerequisites--installation)
8. [Running the Application](#running-the-application)
9. [Running Automated Tests](#running-automated-tests)
10. [College Presentation & Demonstration Script](#college-presentation--demonstration-script)
11. [Known Limitations](#known-limitations)

---

## 1. Overview & Project Objective

AutomataForge provides a software workbench where formal regular language specifications are compiled into deterministic state machines, verified mathematically, and explained educationally:
- **Formal Correctness First**: Algorithms (equivalence, minimization, simulation, and verification) are strictly executed by deterministic Python TOC engines—**the LLM is never trusted to guess whether two automata are equivalent or correct**.
- **Assistive AI Role**: The LLM translates natural language into structured specifications, provides educational counterexample walkthroughs, and proposes candidate repair hypotheses that are **formally verified before being presented as valid fixes**.
- **Zero-Dependency Fallback**: All core automata algorithms and pattern compilations work 100% deterministically without requiring an AI API key.

---

## 2. Theory of Computation Concepts Covered

1. **Deterministic Finite Automaton (DFA) Formal Model**:
   $$M = (Q, \Sigma, \delta, q_0, F)$$
   - Finite state set $Q$, input alphabet $\Sigma$, transition function $\delta: Q \times \Sigma \to Q$, initial state $q_0 \in Q$, and accepting states $F \subseteq Q$.
2. **String Simulation & Language Recognition**:
   - Extended transition function $\hat{\delta}: Q \times \Sigma^* \to Q$.
   - Empty string $\varepsilon$ handling: $w = \varepsilon \iff q_0 \in F$.
3. **Cartesian Product Automaton & Equivalence**:
   - Product state space $Q_A \times Q_B$ with initial state $(q_{0A}, q_{0B})$.
   - Product transition: $\delta((p, q), a) = (\delta_A(p, a), \delta_B(q, a))$.
   - Symmetric difference distinguishability: $(p \in F_A) \neq (q \in F_B)$.
   - **Breadth-First Search (BFS)** traversal guarantees discovery of the **shortest counterexample** in minimal step depth.
4. **DFA Minimization (Hopcroft / Moore Style Refinement)**:
   - Reachability analysis: eliminates unreachable states from $q_0$.
   - Initial partition $P_0 = \{ F, Q \setminus F \}$ (0-equivalence).
   - Iterative refinement $P_{k+1}$: splitting classes whose transitions lead to distinct partitions under symbol $a \in \Sigma$.
   - Quotient automaton construction and formal equivalence verification: $L(M) \equiv L(M')$.
5. **Regular Language Synthesis & Intersection**:
   - Modular construction of suffixes, substrings, avoidance traps, and modulo parity counters.
   - Product intersection for composite constraints (e.g. *even number of zeros AND ending in 1*).

---

## 3. System Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │               AutomataForge Frontend                   │
                    │   React 18 + TypeScript + Vite + Tailwind CSS          │
                    │   @xyflow/react (Interactive Automata Graph)           │
                    │   Playback Controls, Transition Tables, Timeline       │
                    └───────────────────────────┬────────────────────────────┘
                                                │ REST API (/api/*)
                                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │               FastAPI TOC Engine (Python)              │
                    │   - Validation & Strict Schema Enforcement (Pydantic)  │
                    │   - Step-by-Step String Simulation (ε support)         │
                    │   - Product BFS Shortest Counterexample Finder         │
                    │   - Hopcroft Partition Refinement Minimizer            │
                    │   - Regular Pattern Compiler & Automata Intersection   │
                    └───────────────────────────┬────────────────────────────┘
                                                │
                        ┌───────────────────────┴───────────────────────┐
                        ▼                                               ▼
         ┌─────────────────────────────┐                 ┌─────────────────────────────┐
         │ Deterministic TOC Engine    │                 │ Assistive AI Layer          │
         │ - Equivalence Checker       │                 │ - Natural Language Parser   │
         │ - Candidate Repair Verifier │                 │ - Counterexample Explainer  │
         │ - Complete State Analysis   │                 │ - Candidate Fix Generator   │
         └─────────────────────────────┘                 └─────────────────────────────┘
```

---

## 4. Core Features

### 1. Automata Doctor
- **Problem**: A student builds an automaton that fails unexpected inputs.
- **Solution**: The Doctor compares the student's submission against an intended reference DFA.
- If not equivalent, the engine displays the exact shortest counterexample $w$, the reference path, and the student's erroneous path.
- The **AI Repair Assistant** diagnoses the fault and proposes candidate transition edits.
- **Crucial**: Every candidate is run through the equivalence checker. Only candidates that achieve $L(\text{Candidate}) \equiv L(\text{Reference})$ are labeled **Formally Verified ✓**. Students can click **"Apply This Fix"** with one click.

### 2. Equivalence Hunter
- Input two complete DFAs over the same alphabet.
- Runs BFS over the Cartesian product state space $Q_A \times Q_B$.
- If equivalent: proves that all reachable product states have identical acceptance status.
- If non-equivalent: outputs the **guaranteed shortest counterexample** $w \in L(A) \mathbin{\Delta} L(B)$ along with simultaneous dual state-by-state execution traces.
- The **Counterexample Explainer** provides a breakdown of why $w$ distinguishes the machines and why BFS guarantees minimality.

### 3. Minimization Observatory
- Takes any complete DFA and executes step-by-step minimization:
  1. **Reachable State Analysis**: Identifies and removes unreachable states.
  2. **Initial Partition $P_0$**: Separates accepting $F$ from non-accepting $Q \setminus F$.
  3. **Round-by-Round Refinement**: Visualizes signature buckets and state splits.
  4. **Quotient Automaton Construction**: Merges indistinguishable states.
  5. **Formal Verification**: Runs equivalence check confirming $L(M) \equiv L(M')$.
- Stepper timeline lets students navigate back and forth through each partition refinement round.

### 4. Natural Language to Automaton
- Translates plain English regular language queries into structured specifications:
  - Examples: *"Construct a DFA over {0,1} that accepts strings containing an even number of zeros and ending with 1"*, *"Strings ending in 01"*, *"Strings containing 101"*, *"Strings avoiding 00"*.
- The deterministic pattern compiler builds and minimizes the resulting DFA.
- Generates sample accepted and rejected strings and allows exporting the automaton directly into the Doctor, Hunter, or Observatory.

### 5. Interactive String Simulator
- Step forward, step backward, auto-play, pause, speed adjustment, and reset.
- Live state highlight in the React Flow graph diagram.
- Full support for the empty string $\varepsilon$.

---

## 5. AI Integration & Security Model

- **Configurable Provider**: Supports Google Gemini (default: `gemini-2.5-flash` or `gemini-1.5-flash`) and OpenAI-compatible endpoints (`gpt-4o-mini`).
- **Security First**:
  - The API key is stored strictly on the server in `.env`.
  - Keys are **never** exposed to browser JavaScript, API responses, or git.
  - Model outputs are parsed as structured JSON and treated as untrusted input.
- **Graceful Deterministic Fallback**: If no API key is provided, AutomataForge continues running using built-in high-precision regex/rule-based language parsers and formal counterexample analyzers.

---

## 6. Project Structure

```
automataforge/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application & health check
│   │   ├── models/
│   │   │   └── dfa_models.py        # Pydantic data schemas
│   │   ├── routes/
│   │   │   ├── dfa_routes.py        # Validate, simulate, minimize, equivalence, examples
│   │   │   └── ai_routes.py         # Interpret, counterexample explainer, repair suggestions
│   │   ├── services/
│   │   │   └── ai_service.py        # LLM integration & deterministic fallback engines
│   │   └── toc/
│   │       ├── dfa.py               # Complete DFA validation & reachability analysis
│   │       ├── simulator.py         # Step-by-step string simulation & ε handling
│   │       ├── equivalence.py       # Cartesian product automaton BFS & shortest counterexample
│   │       ├── minimizer.py         # Hopcroft partition refinement & quotient construction
│   │       └── pattern_compiler.py  # Regular language synthesis & DFA intersection
│   ├── tests/
│   │   ├── test_validation.py       # DFA completeness and error validation tests
│   │   ├── test_simulation.py       # ε string and symbol simulation tests
│   │   ├── test_equivalence.py      # Equivalence and shortest counterexample tests
│   │   ├── test_minimization.py     # Partition refinement and state reduction tests
│   │   ├── test_ai_features.py      # Pattern compiler and repair assistant tests
│   │   └── test_api_endpoints.py    # Route logic & serialization tests
│   ├── requirements.txt             # Python dependencies
│   └── .env.example                 # Environment configuration template
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DfaGraph.tsx         # React Flow interactive automata diagram
│   │   │   ├── DfaNode.tsx          # Custom node (start arrow, double accept ring, active glow)
│   │   │   ├── DfaEditor.tsx        # Visual transition matrix, state editor, JSON import/export
│   │   │   ├── DfaSimulator.tsx     # Play/pause/step controls & execution ribbon
│   │   │   ├── Header.tsx           # App header & status
│   │   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   │   └── StatusBadge.tsx      # Live backend & AI connectivity status
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx        # Overview, module shortcuts, interactive sandbox
│   │   │   ├── NaturalLanguageBuilder.tsx # Language prompt to compiled DFA
│   │   │   ├── AutomataDoctor.tsx   # Diagnosis, counterexamples & verified repairs
│   │   │   ├── EquivalenceHunter.tsx# Product BFS equivalence checker
│   │   │   ├── MinimizationObservatory.tsx # Step-by-step partition refinement
│   │   │   └── SavedExamples.tsx    # Standard TOC tested library
│   │   ├── services/
│   │   │   └── api.ts               # REST API client
│   │   ├── types/
│   │   │   └── dfa.ts               # TypeScript interfaces
│   │   ├── App.tsx                  # App root
│   │   ├── main.tsx                 # Entrypoint
│   │   └── index.css                # Tailwind base & custom themes
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── .gitignore
└── README.md
```

---

## 7. Prerequisites & Installation

### Prerequisites
- **Python**: Version 3.10+ (tested on Python 3.14)
- **Node.js**: Version 18+ (tested on Node v22)
- **npm** or **pnpm**

### Step 1: Clone or Navigate to Project
```bash
cd "c:/Users/abhij/Desktop/5th Sem/TOC Project"
```

### Step 2: Install Backend Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Step 4: Configure AI API Key (Optional)
Copy `.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your Gemini or OpenAI API key:
```env
AI_API_KEY=your_actual_gemini_or_openai_key
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash
```
> **Note**: If `AI_API_KEY` is not set, all deterministic TOC features, DFA simulation, equivalence checks, minimization, and fallback language translation will continue to operate completely offline.

---

## 8. Running the Application

### 1. Start the FastAPI Backend Server
Run from the project root directory:
```bash
python -m uvicorn app.main:app --app-dir backend --port 8000 --reload
```
- Backend API: `http://127.0.0.1:8000`
- Interactive API Docs (Swagger UI): `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

### 2. Start the Vite Frontend Development Server
Open a second terminal:
```bash
cd frontend
npm run dev
```
- Frontend Web App: `http://localhost:5173`

---

## 9. Running Automated Tests

Run the full pytest suite (30 comprehensive tests covering all TOC algorithms, edge cases, and endpoints):
```bash
python -m pytest backend/tests -v -o pythonpath=backend
```

Test coverage includes:
- Strict DFA validation (duplicate states, missing transitions, invalid targets, reachability warnings).
- $\varepsilon$ empty string simulation and character-by-character tracing.
- Cartesian product BFS equivalence checking.
- Shortest counterexample reconstruction where the start state acceptance or transition differentiates machines.
- Hopcroft partition refinement round calculations and dead-state pruning.
- AI language parser fallback, prompt structured extraction, and candidate repair verification.

---

## 10. College Presentation & Demonstration Script

Here is a 4-minute demonstration workflow for a college mini-project review:

1. **Dashboard & Playground (1 minute)**:
   - Open `http://localhost:5173`.
   - Highlight the **Status Indicator** in the header showing FastAPI engine status.
   - On the Dashboard sandbox, type `10101` in the string simulator. Click **Play** to demonstrate step-by-step token consumption and dynamic state highlighting ending in state `q3` (Accepted).
   - Test the empty string by clicking **ε (Empty)**.
2. **Feature 1: Natural Language Builder (1 minute)**:
   - Navigate to **Natural Language Builder**.
   - Select template: *"Construct a DFA over {0,1} that accepts strings containing an even number of zeros and ending with 1"*.
   - Click **Compile to DFA**.
   - Point out the **Interpreted Specification** panel showing formal conditions: $\text{count}(0) \pmod 2 = 0$ and suffix $= 1$.
   - Show the resulting 4-state DFA diagram and click **Send to Doctor**.
3. **Feature 2: Automata Doctor (1.5 minutes)**:
   - Click **Load Buggy '01' Sample** (deliberately flawed student automaton for *ending in 01*).
   - The Doctor runs equivalence checking against the reference DFA.
   - Result: **Divergence Found**. The shortest counterexample `'01'` is highlighted.
   - Inspect the dual traces: Reference visits $q_0 \to q_1 \to q_2$ (Accepts), but Student visits $q_0 \to q_1 \to q_0$ (Rejects).
   - Show the **AI Repair Assistant** section below: the assistant generated candidate fixes. Point out the badge: **Formally Verified ✓** vs **Fails Verification ✗**.
   - Click **"Apply This Fix"** on the verified repair: the student DFA transition $\delta(q_1, 1)$ updates to $q_2$, and the diagnosis turns to **Language Equivalence Confirmed**!
4. **Feature 3: Minimization Observatory (0.5 minutes)**:
   - Navigate to **Minimization Observatory**.
   - Show the 5-state input DFA (containing redundant states and an unreachable state).
   - Walk through the **Step Timeline**:
     - *Step 1*: Prunes unreachable state `q_unreachable`.
     - *Step 2*: Initial partition $P_0$ into non-accepting and accepting states.
     - *Step 3*: Signature refinement.
     - *Step 4*: Fixed point reached.
   - Point out the **States Saved** metric ($5 \to 2$ states) and the **Formal Equivalence Verified** badge!

---

## 11. Known Limitations

- **Regular Languages Only**: DFAs cannot recognize context-free or non-regular languages (e.g. $a^n b^n$, palindromes of arbitrary length, balanced parentheses). AutomataForge is strictly focused on finite-state automata.
- **Alphabet Size**: The UI and algorithms are optimized for alphabets with $|\Sigma| \le 10$ and $|Q| \le 50$ to maintain legible graph diagrams.
- **Natural Language Parsing Scope**: Supported regular patterns include suffixes, prefixes, substrings, avoidance, modulo symbol parities, and composite boolean intersections. Highly convoluted or ambiguous colloquial phrasing will trigger a clarification request.

---

## 📄 License
MIT License. Created for College Theory of Computation Mini-Project requirements.


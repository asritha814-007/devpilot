# DevPilot — AI Bug Detection and Code Repair Assistant

> **“Find the bug. Understand the why.”**  
> *Write better code with explanations you can actually understand.*

DevPilot is a modern developer tool that empowers Python programmers to analyze code statically, understand the root causes of runtime and syntax defects through beginner-friendly explanations, preview line-by-line diffs of proposed fixes, and safely verify fixes using isolated abstract syntax tree (AST) inspection suites.

---

## 🌟 Key Features

### 1. Interactive Python Code Editor
- Real-time syntax highlighting and line numbers powered by Monaco Editor (`@monaco-editor/react`).
- One-click sample snippet loader:
  - Confirmed Syntax Errors (missing colons, unbalanced parentheses)
  - Division by Zero (runtime denominator hazards)
  - Mutable Default Arguments (`items=[]` persistence bugs)
  - Bare Except Clauses (`except:` catching `BaseException`)
  - Literal Identity Comparisons (`is 'str'` vs `== 'str'`)
  - Undefined Variables (`NameError` reference before assignment)
  - Clean Python Function (0 defects)
- Instant input validation, character/line count indicators, and clear/reset actions.

### 2. AST & Static Bug Detection
- Built-in static analysis leveraging Python's `ast` compiler and custom node visitors.
- Detects confirmed syntax errors, zero division, undefined names, mutable defaults, bare excepts, infinite loop risks, unreachable code, and built-in name shadowing.
- Distinguishes **Confirmed AST Errors** from **Heuristic Static Warnings** and **Code Quality Info**.
- Provides line numbers, column offsets, source snippets, and concrete next-step recommendations.

### 3. AI-Powered & Rule-Based Explanations
- Modular AI backend supporting **Google Gemini 1.5 Flash** and **OpenAI GPT-4o-mini**.
- Explains:
  - **What It Means**: Plain English definition of the defect.
  - **Why It Occurred**: Python execution semantics and memory models.
  - **How to Fix**: Step-by-step corrective actions.
  - **Beginner Tip**: Practical memory aid for students and junior developers.
- **Graceful Offline Mode**: When no AI API key is configured or when offline, DevPilot seamlessly falls back to its deterministic rule-based knowledge engine without crashing or fabricating responses.

### 4. Automatic Repair & Visual Diff Engine
- Generates proposed Python code fixes with syntax validation (`ast.parse`) prior to presentation.
- Side-by-side and unified structured line diff views with color-coded additions (mint green) and deletions (coral red).
- "Copy Fixed Code" with clipboard feedback.
- "Apply Fix to Editor" with a confirmation safety modal to prevent accidental code replacement.

### 5. Safe Static Verification Suite
- Evaluates proposed code without executing arbitrary user code directly on the application server.
- Runs regression tests: AST syntax validation, issue reduction delta, denominator zero checks, exception safety, and immutable function signatures.
- Computes execution timings in milliseconds and issues clear verification badges: `VERIFIED`, `PARTIALLY_VERIFIED`, or `UNVERIFIED`.

### 6. Persistent Analysis History
- Backed by SQLite database (`devpilot.db`).
- Records analysis ID, UTC timestamps, source code, preview snippets, finding counts, AI explanation presence, repair availability, and verification status.
- Searchable and paginated list with 1-click "Open in Workbench" and deletion with confirmation modals.

### 7. Telemetry & Analytics Dashboard
- Computes real metrics from actual SQLite records:
  - Total Evaluated Runs
  - Defects Detected (Errors, Warnings, Info)
  - Syntax Error Rate %
  - Verified Repair Rate %
  - Category Distribution Breakdown
  - Recent Analysis Activity Feed

---

## 🎨 Design & Branding

- **Obsidian Black (`#111113`)**: Deep developer workspace canvas.
- **Charcoal (`#292529`)**: Elevated panels, cards, and toolbars.
- **Soft Porcelain (`#F5F1F2`)**: Readable, high-contrast typography.
- **Dusty Blush Pink (`#F2B8C6`)**: Disciplined accent used sparingly for active navigation indicators, key primary actions, and AI badges.
- **Typography**: Inter for modern interface text, Plus Jakarta Sans for branding, and Fira Code for Python editing.
- **Logo**: Minimal custom D-shaped mark featuring an embedded code bracket motif (`<D/>`).

---

## 🛠 Technology Stack & Documented Versions

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | React | `^18.3.1` | Component UI and reactive state |
| | Vite | `^5.4.2` | Fast developer server and production bundler |
| | Monaco Editor | `^4.6.0` | In-browser code editing with Python syntax highlighting |
| | Lucide React | `^0.460.0` | Consistent developer-tool iconography |
| **Backend** | Python | `3.14.x` | Runtime and static AST inspection |
| | FastAPI | `0.146.0` | High-performance asynchronous REST API |
| | Uvicorn | `0.54.0` | ASGI application server |
| | Pydantic | `2.14.1` | Request and response validation |
| | HTTPX | `0.28.1` | Asynchronous HTTP client for AI REST APIs |
| | Pytest | `9.1.1` | Unit and integration test suite |
| **Database** | SQLite 3 | Built-in | Embedded relational persistence for analysis history |

---

## 📂 Project Structure

```
devpilot/
├── .env                  # Local environment configuration (Git-ignored)
├── .env.example          # Template with documented environment variables
├── .gitignore            # Multi-stack ignore rules for Python, Node, Vite, SQLite
├── README.md             # Complete project documentation
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py       # FastAPI application, CORS, lifespan database init
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py # REST endpoints (/analyze, /repair, /verify, /history, /dashboard, /health)
│   │   ├── analyzers/
│   │   │   ├── __init__.py
│   │   │   └── ast_analyzer.py # Python AST visitor & static diagnostic engine
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   └── db.py     # SQLite connection, CRUD, schema migrations, and metrics
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py# Pydantic models for findings, diffs, and requests
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── ai_service.py # Gemini/OpenAI integration with offline rule fallback
│   │       ├── repair_service.py # Proposed fix generation and unified diff calculation
│   │       └── verification_service.py # Safe static verification test suite
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_analyzer.py # 10 AST unit tests
│   │   ├── test_api.py      # 5 API integration tests
│   │   └── test_repair.py   # 5 repair and verification tests
│   └── requirements.txt     # Python dependencies
└── frontend/
    ├── index.html           # SEO tags, Google Fonts, and custom SVG favicon
    ├── package.json         # Node dependencies and scripts
    ├── vite.config.js       # Vite configuration with /api reverse proxy
    └── src/
        ├── App.jsx          # Main application layout and navigation container
        ├── main.jsx         # React root mounting script
        ├── index.css        # Obsidian/Charcoal design system tokens and utilities
        ├── components/
        │   ├── Editor.jsx   # Python Monaco editor with sample snippet loader
        │   ├── FindingsPanel.jsx # Findings list with severity filters and code previews
        │   ├── AIExplanationPanel.jsx # Beginner-friendly root-cause cards
        │   ├── RepairPanel.jsx   # Side-by-side & unified diff viewer with apply fix modal
        │   ├── VerificationPanel.jsx # Static test results table and timings
        │   ├── Header.jsx   # Status indicators, logo, and API docs link
        │   ├── Sidebar.jsx  # Primary navigation with blush pink active pill
        │   └── Logo.jsx     # Minimal custom D-bracket SVG logo
        ├── pages/
        │   ├── AnalyzerPage.jsx  # Split-screen interactive workbench
        │   ├── DashboardPage.jsx # Real SQLite metrics and recent runs
        │   ├── HistoryPage.jsx   # Paginated history search and delete modal
        │   └── SettingsPage.jsx  # AI provider status and security policies
        └── services/
            └── api.js       # Centralized REST API client
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** (tested and verified on Python 3.14)
- **Node.js 18+** and **npm**

### 1. Clone & Setup Backend
```powershell
# Navigate to backend directory
cd backend

# Install dependencies
py -m pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the project root:
```powershell
cp .env.example .env
```
Inside `.env`, you can optionally add your Gemini or OpenAI key:
```env
PORT=8000
HOST=127.0.0.1
DATABASE_URL=sqlite:///./devpilot.db

# Optional AI Key (DevPilot works fully offline with rule-based heuristics if empty)
GEMINI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-1.5-flash
```

### 3. Setup Frontend
```powershell
cd ../frontend

# Install dependencies
npm install
```

---

## 🏃 Running the Application

### Start the Backend Server
```powershell
# In the backend directory:
py -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend will start at `http://127.0.0.1:8000`.  
Interactive Swagger documentation is available at `http://127.0.0.1:8000/docs`.

### Start the Frontend Dev Server
```powershell
# In the frontend directory:
npm run dev
```
The Vite development server will start at `http://127.0.0.1:5173`. Open this URL in any browser.

---

## 🧪 Running Tests

### Backend Unit & Integration Tests (Pytest)
```powershell
# In the project root:
py -m pytest backend/tests -v
```
**Test Results**: 20 passed tests in 0.44s:
- `test_syntax_error_detection`: PASSED
- `test_zero_division_detection`: PASSED
- `test_undefined_name_detection`: PASSED
- `test_mutable_default_argument`: PASSED
- `test_bare_except_clause`: PASSED
- `test_literal_identity_comparison`: PASSED
- `test_infinite_loop_risk`: PASSED
- `test_unreachable_code`: PASSED
- `test_clean_valid_code`: PASSED
- `test_empty_code_handling`: PASSED
- `test_health_check`: PASSED
- `test_analyze_empty_code_rejected`: PASSED
- `test_analyze_syntax_error`: PASSED
- `test_analyze_and_store_history`: PASSED
- `test_verify_endpoint`: PASSED
- `test_repair_missing_colon`: PASSED
- `test_repair_literal_identity`: PASSED
- `test_repair_bare_except`: PASSED
- `test_verification_success`: PASSED
- `test_verification_syntax_failure`: PASSED

### Frontend Build Verification
```powershell
cd frontend
npm run build
```
Builds the production distribution package (`dist/`) in ~2.1 seconds with zero errors.

---

## 🔒 Security Decisions & Known Limitations

1. **No Arbitrary Code Execution**: User code is never passed to Python's `exec()`, `eval()`, or spawned in unconstrained subprocesses. Analysis is conducted strictly through abstract syntax tree (`ast`) parsing and static visitor inspections.
2. **Deterministic Syntax Verification**: Suggested repairs are compiled through `ast.parse()` to confirm that proposed code is syntax-valid before it is labeled as valid.
3. **API Key Isolation**: API keys remain strictly on the server and are read from environment variables; they are never sent to the client.
4. **Scope of Static Analysis**: Static AST inspection detects common bug classes (syntax errors, literal division by zero, mutable default arguments, undefined names, bare excepts, literal identity comparisons). It is not intended to solve the theoretical Halting Problem or catch complex dynamic runtime state bugs that depend on live external data.

---

## 📜 License
Educational project developed for software engineering placement demonstrations.

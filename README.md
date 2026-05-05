<H1 align="center">
  Ben Waters COMP3000 - Final Year Project
</H1>
<p align="center">
  <img src='https://images.squarespace-cdn.com/content/v1/65d604f8ad635a5f79d03b14/07151cb7-1c84-4c11-9cd7-3f0b8275d598/plymouthlogopng.png' width='300' >
</p>

## Assessing the Dual-Use Potential of Agentic AI in OSINT-Based Targeted Email Generation

Phishing continues to be the dominant cyber threat to organisations. Agentic AI systems - capable of autonomous, multi-step reasoning and tool use - now make it possible to automate the full reconnaissance to personalised email pipeline that previously required significant manual effort. This project investigates the dual-use risks of such systems by building a controlled, ethically bounded platform that demonstrates how publicly available employee data can be gathered, analysed, and turned into realistic spearphishing simulations for security-awareness purposes.

**AIDEN** (Agentic Intelligence Dual-use Evaluation Network) is a consent-driven organisational platform that allows authorised administrators to:
- Register and manage their organisation and employee records
- Automatically collect OSINT via theHarvester (domain reconnaissance), Sherlock (username-based social media discovery), and Have I Been Pwned (breach exposure)
- Receive ranked findings, risk assessments, and training recommendations
- Generate structured, highly tailored spear-phishing email drafts (subject, sender details, HTML body, and effectiveness rationale) for review
- Export OSINT reports as PDFs and employee data as CSV
- View organisational risk metrics on a dashboard

The platform deliberately stops short of live email delivery, keeping a human reviewer in the loop at all times. All operations are scoped to the authenticated organisation, with caching of recent OSINT results and strict access controls.

### Architecture
AIDEN is implemented as a clean three-service architecture:
- **Frontend**: React single-page application with Tailwind CSS, React Router, and Chart.js
- **Backend**: Laravel API with Sanctum authentication, Eloquent models, and organisation-scoped access control
- **Agent service**: FastAPI + LangChain (ReAct-style agent) that orchestrates the OSINT tools and LLM-powered ranking/phishing-draft generation

This separation keeps AI-specific dependencies isolated while providing a maintainable, production-oriented web application.

### Ethical & Dual-Use Focus
The system was explicitly designed with dual-use risks in mind. It provides organisations with actionable insight into their public exposure and the persuasive power of AI-generated personalised lures, while incorporating safeguards such as:
- Organisation-level data isolation
- No automatic outbound email capability
- Human review of all generated drafts
- Reuse of recent OSINT results to minimise unnecessary data collection

The project therefore serves both as a practical awareness and assessment tool and as a concrete exploration of the governance challenges posed by agentic AI in offensive workflows.

### Technologies

| Layer          | Technologies                                      |
|----------------|---------------------------------------------------|
| **Frontend**   | React, Vite, Tailwind CSS, React Router, Chart.js, Axios |
| **Backend**    | Laravel (PHP), Sanctum, Eloquent, MySQL           |
| **Agent**      | FastAPI, Python, LangChain, ReAct agent           |
| **OSINT Tools**| theHarvester, Sherlock, Have I Been Pwned API     |
| **Other**      | Git submodules, Composer, npm                     |

<br>

## Getting Started

> **Note**: The project consists of **three separate services** that need to run simultaneously (Frontend + Backend + Agent).

#### Prerequisites
- PHP 8.2+ with Composer
- Node.js 18+ and npm
- Python 3.11+
- MySQL (or compatible database)
- Git

#### 1. Clone the repository & initialise submodules
```bash
git clone https://github.com/BenWaters2004/COMP3000_Project.git
cd COMP3000_Project
git submodule update --init --recursive
```
#### 2. Backend (Laravel API)
```bash
cd backend
composer install
cp .env.example .env
# Edit .env (set database credentials and AGENT_URL=http://localhost:8001)
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8000
```
#### 3. Agent Service (FastAPI + LangChain)
```bash
cd ../agent
python -m venv venv
source venv/bin/activate          # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your LLM API key (e.g. OPENAI_API_KEY) and Have I Been Pwned API key
uvicorn app:app --reload --port=8001
```
> **Note**: theHarvester and Sherlock are included as git submodules. Their own dependencies are usually satisfied by the main requirements.txt above, but if you encounter import errors you can also run their individual setup steps (see their respective READMEs inside the submodules).
#### 4. Frontend (React + Vite)
```bash
cd ../frontend
npm install
npm run dev
```
The frontend will be available at http://localhost:5173.
Make sure the Axios baseURL in the frontend points to your Laravel backend (http://localhost:8000).

<br>

### Project Supervisor
Nathan Clarke

### Kanban board and Gantt chart
[Kanban board link: click here](#) </br></br>

## Deadlines

| No. | Assessment Item                     | Submission Deadline           | Feedback                          |
|:---:|------------------------------------|-------------------------------|-----------------------------------|
| 00  | Project Preparation                | During the first 2 weeks of the semester | —                                 |
| 01  | Supervisor Selection               | **October 10th 2025 (15:00)** | By – final notification of supervisor |
| 02  | Project Initiation                 | **October 24th 2025 (15:00)** | During scheduled stand-ups        |
| 03  | Poster & Description for feedback  | **March 16th 2026 (15:00)**   | During scheduled stand-ups        |
| 03a | Print Deadline for Poster          | **April 20th 2026 (15:00)**   | —                                 |
| 04  | Project ePortfolio Complete        | **May 5th 2026 (15:00)**      | Within 20 working days            |
| 05  | Showcase                           | **May 7th 2026 (09:00 – 16:00)** | At posters                        |
| 06  | Viva                               | **w/c 11th May 2026**         | At the end of the Viva            |

---
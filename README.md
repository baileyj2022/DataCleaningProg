<img width="288.5" height="281" alt="Automated Data Cleaner logo with sparkle icon" src="https://github.com/user-attachments/assets/3e73147c-8c35-471c-9802-ce97b7b1290c" />

# Automated Data Cleaner
Website: https://data-cleaning-prog.vercel.app/

## Overview
The Automated Data Cleaner is a web-based platform that allows businesses to upload, clean, and export datasets without requiring technical expertise. Users can upload dirty datasets, configure cleaning operations through a simple interface, preview changes, and download cleaned data in multiple formats.

## Features
- File upload support: CSV, JSON, Excel (.xlsx), JPEG
- Cleaning operations: fill missing, predict missing values, value estimation
- Before-and-after data preview with cleaning summary
- Export formats: CSV, JSON, Excel (.xlsx), PDF cleaning report

## Tech Stack
- Frontend: React + Tailwind CSS (with custom CSS)
- Data Table: TanStack Table
- Backend: Python + FastAPI
- Data Processing: Pandas, NumPy, OpenPyXL, rapidfuzz
- Database: MongoDB
- File Handling: Local temp storage or S3/R2
- Frontend Deploy: Vercel
- Backend Deploy: Railway or Render
- Version Control: GitHub

## Directory Path
```text
DataCleaningProg/
├── README.md
├── package.json
├── package-lock.json
├── .venv/
├── .vscode/
├── frontend/
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── vercel.json
│   ├── dist/
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── api/
│       │   └── api.js
│       ├── assets/
│       │   └── adc_logo.PNG
│       ├── components/
│       │   ├── LoadingSpinner.jsx
│       │   ├── WorkflowLayout.jsx
│       │   ├── dataCleaning.jsx
│       │   └── parsers.js
│       └── screens/
│           ├── ConfigureScreen.jsx
│           ├── ExportScreen.jsx
│           ├── JobHistoryScreen.jsx
│           ├── LandingScreen.jsx
│           ├── PreviewScreen.jsx
│           └── UploadScreen.jsx
└── backend/
	├── .env.example
	├── .gitignore
	├── API_ENDPOINTS.md
	├── db.py
	├── main.py
	├── render.yaml
	├── requirements.txt
	├── __pycache__/
	├── routes/
	│   ├── clean.py
	│   ├── export.py
	│   ├── jobs.py
	│   ├── preview.py
	│   └── upload.py
	└── services/
		├── __init__.py
		├── cleaner.py
		├── exporter.py
		└── validator.py
```

## Major Files and Folders

**Root**
- `README.md` - has information about the app, contributors, screenshots, tech stack, etc.
- `package.json` - Node/workspace dependencies.
- `.venv/` - Python virtual environment for backend (optional).
- `.vscode/` - editor settings (optional).

**Frontend** (`frontend/`)
- `index.html` - HTML entry point for Vite.
- `package.json` - frontend dependencies and build scripts (`dev`, `build`, `preview`).
- `postcss.config.js`, `tailwind.config.js` - Tailwind and CSS pipeline config.
- `vite.config.js` - Vite bundler setup.
- `vercel.json` - deployment settings for Vercel.
- `dist/` - compiled build output (ignore, auto-generated).

**Frontend Source Code** (`frontend/src/`)
- `main.jsx` - boots up the React app and router.
- `App.jsx` - routes and main workflow state (landing page -> upload -> configure -> preview -> export).
- `index.css` - global styles and Tailwind configuration for the web app.
- `api/api.js` - helper for calling backend endpoints.
- `assets/` - folder for images and logos.
- `components/` - reusable UI parts:
  - `LoadingSpinner.jsx` - creates the loading spinner.
  - `WorkflowLayout.jsx` - creates the shared page layout.
  - `dataCleaning.jsx` - builds the cleaning logic for client-side previews.
  - `parsers.js` - parsers for CSV, JSON, Excel, and JPEG images (OCR).
- `screens/` - the main pages:
  - `LandingScreen.jsx` - landing page of web app.
  - `UploadScreen.jsx` - file upload for CSV, JSON, Excel, and JPEG images.
  - `ConfigureScreen.jsx` - allows the users to choose cleaning operations.
  - `PreviewScreen.jsx` - displays cleaned data and summary report.
  - `ExportScreen.jsx` - allows the users to download the cleaned dataset as a json or csv file.
  - `JobHistoryScreen.jsx` - displays previous job records and allows users to delete one at a time or clear them all.

**Backend** (`backend/`)
- `main.py` - sets up the FastAPI app and wires all the routes.
- `db.py` - MongoDB connection and database setup.
- `requirements.txt` - Python dependencies (pandas, numpy, etc.).
- `.env.example` - template for environment variables
- `render.yaml` - deployment configuration for hosting on Render.
- `routes/` - all the endpoints the frontend calls:
  - `upload.py` - handles incoming file uploads.
  - `clean.py` - runs the cleaning pipeline on uploaded data.
  - `preview.py` - generates a preview of cleaned data.
  - `export.py` - formats and exports cleaned data (CSV, JSON, Excel, PDF).
  - `jobs.py` - endpoints for fetching job history and results.
- `services/` - the actual logic that does the work:
  - `cleaner.py` - the cleaning algorithms (fill missing values, predict, estimate, etc.).
  - `exporter.py` - formats cleaned data for download.
  - `validator.py` - checks incoming files and data before processing.



## Contributors
- Ashamarie Parke (Z23723840, parkea2023@fau.edu) - Project Manager, Full-Stack Lead
- Jemima Gay ( ,jgay2022@fau.edu)- Project Manager, Backend Developer
- Francesca Dumary ( ,fdumary2024@fau.edu) - Frontend Developer, DevOps
- Jolie Bailey( , baileyj2022@fau.edu) - DevOps, Data/ML Specialist
- Denia Rosiclair( ,drosiclair2022@fau.edu) - Backend Developer, Data/ML Specialist

## Project Poster 
![Project poster showing features and team information](Project_Poster.png)

## Youtube Link for Demo


## How to Run
**Frontend only** (client-side cleaning, no backend needed)
1. `cd frontend`
2. `npm install`
3. `npm run dev`
4. Open the browser to `http://localhost:5173`

**With Backend** (server-side cleaning and database storage)
1. Set up backend:
   - `cd backend`
   - Copy `.env.example` to `.env` and fill in your MongoDB URL and other secrets
   - Create a Python virtual environment: `python -m venv .venv`
   - Activate it: `source .venv/bin/activate`
   - Install dependencies: `pip install -r requirements.txt`
   - Run: `python main.py`
2. In another terminal, set up frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`
3. Open the browser to `http://localhost:5173` — the frontend will call your local backend 

## Screenshots

<img width="473.5" height="238.75" alt="Landing page showing app hero section and workflow overview" src="https://github.com/user-attachments/assets/37bf3f21-c429-40fc-9249-6c6472f8eb95" />

<img width="473.5" height="238.75" alt="File upload screen for CSV, JSON, Excel, and JPEG files" src="https://github.com/user-attachments/assets/7f62a030-6b81-4f96-8055-89fa1f131d37" />

<img width="473.5" height="238.75" alt="Configure screen showing cleaning operation options" src="https://github.com/user-attachments/assets/29351667-ad5e-45da-b11f-829a77fa87e8" />

<img width="473.5" height="238.75" alt="Preview screen with data summary and cleaned dataset table" src="https://github.com/user-attachments/assets/511304b6-3e88-4665-8b16-894ac86bd764" />

<img width="473.5" height="238.75" alt="Export screen showing download format options" src="https://github.com/user-attachments/assets/b0c342c2-8ff7-4b9b-b806-8b1045e0b515" />

<img width="473.5" height="238.75" alt="Job history screen displaying previous cleaning tasks and results" src="https://github.com/user-attachments/assets/08b7401f-a014-4981-b965-bc4f8629074f" />

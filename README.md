<img width="288.5" height="281" alt="image" src="https://github.com/user-attachments/assets/3e73147c-8c35-471c-9802-ce97b7b1290c" />

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
- Frontend: React + Tailwind CSS + CSS
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
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── assets/
│   │   ├── components/
│   │   └── screens/
│   │       ├── LandingScreen.jsx
│   │       ├── UploadScreen.jsx
│   │       ├── ConfigureScreen.jsx
│   │       ├── PreviewScreen.jsx
│   │       ├── ExportScreen.jsx
│   │       └── JobHistoryScreen.jsx
└── backend/
	├── main.py
	├── db.py
	├── routes/
	│   ├── clean.py
	│   └── preview.py
	└── services/
		├── __init__.py
		└── cleaner.py
```

## Contributors
- Ashamarie Parke - Project Manager, Full-Stack Lead
- Jemima Gay - Project Manager, Backend Developer
- Francesca Dumary - Frontend Developer, DevOps
- Jolie Bailey - DevOps, Data/ML Specialist
- Denia Rosiclair - Backend Developer, Data/ML Specialist

## Screenshots
<img width="474.25" height="238.5" alt="Screenshot 2026-04-19 223027" src="https://github.com/user-attachments/assets/574aef68-4be0-4ad3-bc9a-621bcd1f32c4" />
<img width="474.25" height="238.5" alt="image" src="https://github.com/user-attachments/assets/aed64faf-6ea0-4cbc-bc47-61e89be5dffb" />
<img width="474.25" height="238.5" alt="image" src="https://github.com/user-attachments/assets/e1c1f3d5-0276-4910-b41e-5eecb7e16a66" />
<img width="474.25" height="238.5" alt="image" src="https://github.com/user-attachments/assets/527e6e53-f8c4-41e7-9050-d02e7e51261f" />
<img width="474.25" height="238.5" alt="image" src="https://github.com/user-attachments/assets/d9535e97-71f2-4aa1-b410-19de2c6053a9" />
<img width="474.25" height="238.5" alt="image" src="https://github.com/user-attachments/assets/7c288263-bb9f-496b-9489-077914861326" />

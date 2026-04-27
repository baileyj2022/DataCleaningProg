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

<img width="473.5" height="238.75" alt="Screenshot 2026-04-26 211556" src="https://github.com/user-attachments/assets/37bf3f21-c429-40fc-9249-6c6472f8eb95" />

<img width="473.5" height="238.75" alt="Screenshot 2026-04-26 211650" src="https://github.com/user-attachments/assets/7f62a030-6b81-4f96-8055-89fa1f131d37" />

<img width="473.5" height="238.75" alt="Screenshot 2026-04-26 211737" src="https://github.com/user-attachments/assets/29351667-ad5e-45da-b11f-829a77fa87e8" />

<img width="473.5" height="238.75" alt="Screenshot 2026-04-26 211808" src="https://github.com/user-attachments/assets/511304b6-3e88-4665-8b16-894ac86bd764" />

<img width="473.5" height="238.75" alt="Screenshot 2026-04-26 211826" src="https://github.com/user-attachments/assets/b0c342c2-8ff7-4b9b-b806-8b1045e0b515" />

<img width="473.5" height="238.75" alt="Screenshot 2026-04-26 211902" src="https://github.com/user-attachments/assets/08b7401f-a014-4981-b965-bc4f8629074f" />

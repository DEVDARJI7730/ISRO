# AI-Powered Infrared Image Colorization & Enhancement for Improved Object Interpretation

This platform is a complete, production-ready web application built for the **ISRO Hackathon**. It enables research scientists, environmental monitoring analysts, and disaster management teams to upload grayscale satellite infrared (IR) imagery and obtain enhanced, colorized RGB outputs. The resulting color spectrum maps thermal signatures to high-contrast colors, preserving structural boundaries and improving object classification and visibility.

## Key Features

1. **AI Image Enhancement**: Uses a PyTorch Super-Resolution Convolutional Neural Network (SRCNN) to upscale images (1.5x) and sharpen sub-pixel definitions.
2. **Infrared Colorization**: Combines a Deep learning PyTorch U-Net predicting chrominance (ab channels on LAB space) with high-contrast false-color LUT blending to create vivid multi-spectral mappings.
3. **Advanced Interactive UI**:
   - Comparison split slider (original vs. enhanced/colorized).
   - Canvas-based drag-to-pan and mouse-scroll zoom inspection viewport.
   - Real-time pipeline step-by-step progress tracking.
   - Comprehensive EXIF/radiometric metadata drawer.
4. **Export Formats**: Lossless PNG exports (preserving original coordinates) and printable HTML analysis sheets.
5. **Secure Authentication**: Stateful register and login controllers with JWT verification.
6. **Transparent Database Fallback**: Auto-detects MongoDB connection; falls back to an asynchronous local JSON database (`local_db.json`) if Atlas is offline.

---

## Folder Structure

The project conforms to a clean, decoupled enterprise architecture:

```
isro-ir-enhancement/
├── docker-compose.yml
├── .env.example
├── README.md
├── INSTALL.md
├── backend/
│   ├── app/
│   │   ├── main.py            # API entry point & CORS
│   │   ├── config.py          # App settings
│   │   ├── database.py        # MongoDB Atlas & JSON database wrapper
│   │   ├── auth.py            # JWT token & Bcrypt hashing
│   │   ├── routes/            # REST endpoints
│   │   │   ├── auth.py
│   │   │   ├── upload.py      # Real-time SSE upload pipelines
│   │   │   ├── history.py     # User history CRUD
│   │   │   └── admin.py       # Metrics & log console
│   │   ├── models/
│   │   │   └── schemas.py     # Pydantic data schemas
│   │   └── ai/                # Processing pipeline & models
│   │       ├── pipeline.py    # Pipeline coordinator
│   │       ├── preprocessing.py # CLAHE & OpenCV noise removal
│   │       ├── enhancer.py    # PyTorch Super-Resolution
│   │       ├── colorizer.py   # PyTorch U-Net Colorizer
│   │       └── postprocessing.py # Bilateral filtering
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── components/        # ImageSlider, ZoomViewer, ProgressBar, Navbar
    │   ├── hooks/             # useAuth session hook
    │   ├── pages/             # Landing, Dashboard, Login, Register, Result, Admin
    │   ├── utils/             # Axios API client wrapper
    │   ├── App.tsx
    │   └── main.tsx
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── Dockerfile
```

---

## Commands to Run the Project

Consult the complete setup details in [INSTALL.md](file:///C:/Users/Dev/.gemini/antigravity/scratch/isro-ir-enhancement/INSTALL.md).

### Local Execution (No Docker)

**Backend Setup**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

### Docker Execution

Ensure you copy `.env.example` to `.env` first:
```bash
docker-compose up --build
```
Access the application on `http://localhost`.

---

## Seed Accounts

For evaluation:
* **Admin Account**: `admin@isro.gov.in` / Password: `admin123`
* **Regular Account**: Any registration input.

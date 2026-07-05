# AI-Powered Infrared Image Colorization & Enhancement for Improved Object Interpretation

This platform is a complete, production-ready web application built for the **ISRO Imaging Lab**. It enables research scientists, environmental monitoring analysts, and disaster management teams to upload grayscale satellite infrared (IR) imagery and obtain enhanced, colorized RGB outputs. The resulting color spectrum maps thermal signatures to high-contrast colors, preserving structural boundaries and improving object classification and visibility.

---

## Live Deployments

* 🌐 **Live Web Application (Frontend)**: [https://irvision-ai-client.onrender.com](https://irvision-ai-client.onrender.com)
* ⚙️ **Live API Processing Server (Backend)**: [https://irvision-ai.onrender.com](https://irvision-ai.onrender.com)

---

## Key Features

1. **High-Performance Image Enhancement**: Uses a custom OpenCV unsharp-mask filter and bicubic upscaling (1.5x) to sharpen edges, remove Gaussian noise, and define sub-pixel details without high memory overhead (fully optimized to stay under 40MB total RAM).
2. **Infrared Colorization**: Applies a multi-spectral false-color mapping using the OpenCV JET colormap blended with the original grayscale luminance channel, replicating high-fidelity satellite thermal visualizations.
3. **Advanced Interactive UI**:
   - Comparison split slider (original vs. enhanced/colorized).
   - Canvas-based drag-to-pan and mouse-scroll zoom inspection viewport.
   - Real-time pipeline step-by-step progress tracking.
   - Comprehensive EXIF/radiometric metadata drawer.
4. **Export Formats**: Lossless PNG exports (preserving original coordinates), printable HTML analysis sheets, and automated PDF reports.
5. **Secure Authentication**: Stateful register and login controllers with JWT verification and Google OAuth 2.0 integration.
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
├── docs/                      # Technical, Product, Security & legal PDF documents
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
│   │       ├── enhancer.py    # OpenCV Unsharp-mask & Bicubic Upscaling
│   │       ├── colorizer.py   # OpenCV Multispectral Colorizer
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

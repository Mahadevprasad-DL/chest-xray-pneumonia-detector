# Chest X-Ray Pneumonia Detector

An intelligent AI-powered medical diagnostic assistant that detects pneumonia from chest X-ray images using a custom deep learning CNN model. The application combines image analysis with symptom-based assessment, providing clinicians with confidence scores, visual explanations, and comprehensive medical reporting.

## ✨ Features

- **AI-Powered X-Ray Analysis**: Custom CNN model with 87% detection accuracy
- **Explainable AI**: Grad-CAM heatmap visualization showing model focus areas
- **Symptom Checker**: Integrated symptom-based risk assessment with NLP
- **Real-Time Predictions**: < 3 second inference time per image
- **Comprehensive Reports**: Generate and export diagnostic reports (TXT & Excel formats)
- **Risk Analysis Dashboard**: Visual risk gauges and severity indicators
- **Persistent Storage**: Save and manage prediction history
- **Responsive UI**: Full-featured web interface with Tailwind CSS styling

## 🎯 Model Performance

| Metric | Score |
|--------|-------|
| **Validation Accuracy** | 87% |
| **Sensitivity (True Positive Rate)** | 91.8% |
| **Specificity (True Negative Rate)** | 96.1% |
| **F1 Score** | 0.931 |
| **Training Samples** | 5,000+ |
| **Classes** | 2 (NORMAL, PNEUMONIA) |

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library

### Backend
- **FastAPI** - High-performance Python web framework
- **TensorFlow/Keras** - Deep learning library
- **Python 3.9+** - Programming language
- **PIL/Pillow** - Image processing
- **NumPy & SciPy** - Scientific computing

### Infrastructure
- **Supabase** - Backend-as-a-service (mock client for local dev)
- **Docker** - Containerization-ready

## 📋 Prerequisites

- Python 3.9+
- Node.js 16+
- npm or yarn
- pip (Python package manager)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Mahadevprasad DL/chest-xray-pneumonia-detector.git
cd chest-xray-pneumonia-detector
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download pre-trained model
# Models are stored in: backend/artifacts/
# - custom_cnn.keras
# - labels.json
# - metrics.json
# - threshold.json
```

### 3. Frontend Setup

```bash
# Navigate to project root
cd ..

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Run the Application

**Terminal 1 - Backend API:**
```bash
cd backend
source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1 on Windows
python app.py
# API runs on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

## 📚 Usage

### Web Interface

1. **Home Page**: View model statistics and key metrics
2. **Predictor**: Upload chest X-ray images for pneumonia detection
   - Get instant predictions with confidence scores
   - View Grad-CAM heatmaps showing model reasoning
   - Access differential diagnoses
3. **Symptom Checker**: Input symptoms and demographics
   - Receive risk assessment based on symptom patterns
   - Download reports in TXT or Excel formats
4. **Reports**: Manage prediction history
   - View past predictions and their details
   - Delete reports (persisted across sessions)
   - Access model performance metrics

### API Endpoints

**Predict** (POST `/predict`)
```bash
curl -X POST http://localhost:8000/predict \
  -F "file=@chest_xray.jpg"
```

Response:
```json
{
  "diagnosis": "NORMAL",
  "confidence": 0.94,
  "severity": "low",
  "risk_score": 12,
  "algorithm": "Custom CNN",
  "heatmap_data": {
    "gradcam": [...],
    "shape": [224, 224]
  },
  "decision_threshold": 0.52
}
```

## 📁 Project Structure

```
.
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── HeatmapOverlay.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── RiskGauge.tsx
│   │   │   └── SeverityBadge.tsx
│   │   ├── pages/               # Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── PredictorPage.tsx
│   │   │   ├── SymptomCheckerPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   ├── RiskAnalysisPage.tsx
│   │   │   └── AboutPage.tsx
│   │   ├── lib/                 # Utility functions
│   │   │   ├── aiBackend.ts
│   │   │   ├── aiSimulator.ts
│   │   │   └── supabase.ts
│   │   ├── types/               # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/
│   ├── app.py                   # FastAPI main application
│   ├── model.py                 # Model loading & inference
│   ├── config.py                # Configuration
│   ├── train_custom_cnn.py      # Model training pipeline
│   ├── requirements.txt
│   ├── artifacts/               # Pre-trained models
│   │   ├── custom_cnn.keras
│   │   ├── labels.json
│   │   ├── metrics.json
│   │   └── threshold.json
│   └── .venv/                   # Virtual environment
├── dataset/
│   └── chest_xray/              # Training dataset
│       ├── train/
│       ├── val/
│       └── test/
├── supabase/
│   └── migrations/              # Database migrations
├── index.html
├── package.json
├── tsconfig.json
└── README.md
```

## 🧠 Model Training

### Training the Custom CNN

```bash
cd backend

# Ensure dataset is in dataset/chest_xray/
python train_custom_cnn.py
```

The training script will:
1. Load chest X-ray dataset from `dataset/chest_xray/`
2. Preprocess images (resize to 224×224, normalize)
3. Train custom CNN architecture
4. Evaluate on validation set
5. Calibrate decision threshold for optimal balanced accuracy
6. Save model to `artifacts/custom_cnn.keras`
7. Save threshold to `artifacts/threshold.json`
8. Save metrics to `artifacts/metrics.json`

### Dataset Structure

```
dataset/chest_xray/
├── train/
│   ├── NORMAL/        # ~3,883 normal X-rays
│   └── PNEUMONIA/     # ~3,875 pneumonia X-rays
├── val/
│   ├── NORMAL/        # ~391 normal X-rays
│   └── PNEUMONIA/     # ~390 pneumonia X-rays
└── test/
    ├── NORMAL/        # ~234 normal X-rays
    └── PNEUMONIA/     # ~235 pneumonia X-rays
```

## 🔍 How It Works

### Image Prediction Pipeline

1. **Image Upload**: User uploads chest X-ray image
2. **Preprocessing**: 
   - Resize to 224×224 pixels
   - Normalize pixel values to [0, 255] range
   - Convert to RGB if grayscale
3. **Model Inference**: Pass through custom CNN
4. **Decision Logic**: Apply calibrated threshold (0.52 default)
5. **XAI Generation**: Compute Grad-CAM heatmap
6. **Result Formatting**: Return diagnosis, confidence, severity, risk score
7. **Display**: Show prediction with heatmap and severity badge

### Grad-CAM Visualization

Grad-CAM (Gradient-weighted Class Activation Mapping) shows which regions of the X-ray the model focused on when making predictions, improving interpretability for clinical review.

## 🔒 Security Considerations

- Model predictions are for **educational and research purposes only**
- Not intended for clinical diagnosis without physician review
- All X-ray uploads are processed locally (no cloud storage)
- HTTPS recommended for production deployment

## 📊 Monitoring & Logging

The backend logs all predictions with:
- Timestamp
- Input image path
- Model output (confidence, decision threshold)
- Inference time

Access logs are printed to console during development.

## 🐛 Troubleshooting

### Model File Not Found
```
Error: artifacts/custom_cnn.keras not found
```
**Solution**: Ensure the model file exists in `backend/artifacts/` or run training script first.

### CORS Errors
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Backend CORS is configured in `app.py` to allow localhost requests.

### Port Already in Use
```
Address already in use
```
**Solution**: Change port in `app.py` (default 8000) or kill existing process.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This application is built for **educational and research purposes only**. It should not be used for clinical diagnosis without professional medical review. Always consult qualified healthcare professionals for medical advice.

## 📧 Contact & Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review the training guide in `TRAINING_GUIDE.md`

## 🎓 Acknowledgments

- Dataset: Chest X-Ray Images (Pneumonia) - [Paul Mooney, Kaggle](https://www.kaggle.com/paultimothymooney/chest-xray-pneumonia)
- Grad-CAM Technique: [Selvaraju et al., 2019](https://arxiv.org/abs/1610.02055)
- Deep Learning Framework: TensorFlow/Keras Community

---


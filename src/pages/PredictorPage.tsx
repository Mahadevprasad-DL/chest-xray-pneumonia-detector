import { useState, useRef, useCallback } from 'react';
import { Upload, FileImage, AlertCircle, CheckCircle, Loader2, X, ArrowRight } from 'lucide-react';
import { supabase, getSessionId } from '../lib/supabase';
import { analyzeXRayWithBackend } from '../lib/aiBackend';
import SeverityBadge from '../components/SeverityBadge';
import RiskGauge from '../components/RiskGauge';
import HeatmapOverlay from '../components/HeatmapOverlay';
import type { Page, Prediction } from '../types';

interface Props {
  onNavigate: (page: Page) => void;
  onPredictionSaved: (id: string) => void;
}

type Status = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

export default function PredictorPage({ onNavigate, onPredictionSaved }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<Prediction | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function selectFile(f: File) {
    if (!f.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (JPEG, PNG, or DICOM preview).');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setErrorMsg('');
    setStatus('idle');
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f);
  }, []);

  async function analyze() {
    if (!file) return;
    setStatus('uploading');
    setErrorMsg('');

    try {
      await new Promise(res => setTimeout(res, 600));
      setStatus('analyzing');

      const analysisResult = await analyzeXRayWithBackend(file);

      const { data, error } = await supabase.from('predictions').insert({
        user_session_id: getSessionId(),
        filename: file.name,
        diagnosis: analysisResult.diagnosis,
        confidence: analysisResult.confidence,
        severity: analysisResult.severity,
        risk_score: analysisResult.risk_score,
        notes: analysisResult.notes,
        heatmap_data: analysisResult.heatmap_data,
        symptoms_json: [],
      }).select().single();

      if (error) throw error;

      setResult(data as Prediction);
      onPredictionSaved(data.id);
      setStatus('done');
    } catch {
      setStatus('error');
      setErrorMsg('Analysis failed. Please try again.');
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setStatus('idle');
    setErrorMsg('');
  }

  const isProcessing = status === 'uploading' || status === 'analyzing';

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Disease Predictor</h1>
          <p className="text-slate-600">Upload a chest X-ray image for AI-powered analysis and diagnosis prediction.</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">
            <strong>Disclaimer:</strong> This tool is intended for educational and research purposes only. Results should not be used for clinical decision-making without consultation with a qualified medical professional.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <div
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
                dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
              } ${preview ? 'border-solid border-slate-200' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="X-Ray Preview" className="w-full rounded-2xl object-cover max-h-80" />
                  <button
                    onClick={reset}
                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-600" />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur rounded-lg px-3 py-1.5 text-white text-xs font-medium">
                    {file?.name}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center cursor-pointer" onClick={() => inputRef.current?.click()}>
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-7 h-7 text-blue-500" />
                  </div>
                  <p className="text-slate-700 font-semibold mb-1">Drop your X-ray here</p>
                  <p className="text-slate-500 text-sm mb-4">or click to browse files</p>
                  <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
                    JPEG, PNG, WebP supported
                  </span>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) selectFile(f); }}
              />
            </div>

            {errorMsg && (
              <div className="mt-3 flex gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}

            <div className="mt-5 space-y-3">
              <button
                onClick={analyze}
                disabled={!file || isProcessing || status === 'done'}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {status === 'uploading' ? 'Preparing image...' : 'Analyzing with AI...'}
                  </>
                ) : status === 'done' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Analysis Complete
                  </>
                ) : (
                  <>
                    <FileImage className="w-4 h-4" />
                    Analyze X-Ray
                  </>
                )}
              </button>

              {status === 'done' && (
                <button
                  onClick={() => onNavigate('reports')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:border-blue-300 transition-all"
                >
                  View Full Report
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="mt-6 bg-white rounded-xl border border-slate-100 p-5">
              <h3 className="font-semibold text-slate-800 mb-3 text-sm">Analysis Pipeline</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Image Preprocessing', done: ['uploading', 'analyzing', 'done'].includes(status) },
                  { label: 'Feature Extraction (Custom CNN)', done: ['analyzing', 'done'].includes(status) },
                  { label: 'Disease Classification', done: status === 'done' },
                  { label: 'Grad-CAM Heatmap Generation', done: status === 'done' },
                ].map(step => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      step.done ? 'bg-emerald-500' : isProcessing ? 'bg-blue-100 animate-pulse' : 'bg-slate-200'
                    }`}>
                      {step.done && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm ${step.done ? 'text-slate-700' : 'text-slate-400'}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {result ? (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Primary Diagnosis</p>
                      <h2 className="text-2xl font-bold text-slate-900">{result.diagnosis}</h2>
                    </div>
                    <SeverityBadge severity={result.severity} size="lg" />
                  </div>
                  <div className="flex items-center justify-between py-4 border-t border-slate-50">
                    <RiskGauge score={result.risk_score} size={140} />
                    <div className="text-right">
                      <p className="text-sm text-slate-500 mb-1">Confidence</p>
                      <p className="text-3xl font-bold text-blue-600">{result.confidence}%</p>
                      <div className="mt-2 w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                          style={{ width: `${result.confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <h3 className="font-semibold text-slate-800 mb-4">Grad-CAM Visualization</h3>
                  <div className="flex gap-4 items-start">
                    {result.heatmap_data?.gradcam && (
                      <HeatmapOverlay data={result.heatmap_data.gradcam} width={160} height={160} />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 leading-relaxed mb-3">
                        Highlighted regions indicate areas the model focused on during diagnosis.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="flex gap-1">
                          <div className="w-3 h-3 rounded bg-blue-500" />
                          <div className="w-3 h-3 rounded bg-green-500" />
                          <div className="w-3 h-3 rounded bg-yellow-500" />
                          <div className="w-3 h-3 rounded bg-red-500" />
                        </div>
                        <span>Low to high activation</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <h3 className="font-semibold text-slate-800 mb-3">Clinical Notes</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{result.notes}</p>
                </div>
              </div>
            ) : (
              <div className="h-full bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center min-h-64">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                  <FileImage className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">Analysis results will appear here</p>
                <p className="text-slate-400 text-sm mt-1">Upload an X-ray and click Analyze</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

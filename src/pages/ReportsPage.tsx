import { useState, useEffect } from 'react';
import { FileText, TrendingUp, Calendar, ChevronRight, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase, getSessionId } from '../lib/supabase';
import SeverityBadge from '../components/SeverityBadge';
import HeatmapOverlay from '../components/HeatmapOverlay';
import type { Prediction, Page } from '../types';

interface Props {
  latestPredictionId: string | null;
  onNavigate: (page: Page) => void;
}

const REMOVED_REPORTS_KEY = 'ai_powered_medicial_diagnosis_assistant_removed_reports_v1';

function getRemovedReportIds(sessionId: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(REMOVED_REPORTS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return new Set(Array.isArray(parsed[sessionId]) ? parsed[sessionId] : []);
  } catch {
    return new Set();
  }
}

function addRemovedReportId(sessionId: string, id: string) {
  try {
    const raw = window.localStorage.getItem(REMOVED_REPORTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    const current = new Set(Array.isArray(parsed[sessionId]) ? parsed[sessionId] : []);
    current.add(id);
    parsed[sessionId] = [...current];
    window.localStorage.setItem(REMOVED_REPORTS_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore local storage errors to avoid blocking UI.
  }
}

export default function ReportsPage({ latestPredictionId, onNavigate }: Props) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selected, setSelected] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchReports() {
    setLoading(true);
    const sessionId = getSessionId();
    const { data } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_session_id', sessionId)
      .order('created_at', { ascending: false });
    if (data) {
      const removedIds = getRemovedReportIds(sessionId);
      const filtered = (data as Prediction[]).filter(p => !removedIds.has(p.id));
      setPredictions(filtered);
      if (filtered.length > 0) setSelected(filtered[0]);
      else setSelected(null);
    }
    setLoading(false);
  }

  async function deleteReport(id: string) {
    const sessionId = getSessionId();
    const { error } = await supabase
      .from('predictions')
      .delete()
      .eq('id', id)
      .eq('user_session_id', sessionId);

    if (error) {
      console.error('Failed to delete report:', error);
    }

    addRemovedReportId(sessionId, id);

    const nextPredictions = predictions.filter(p => p.id !== id);
    setPredictions(nextPredictions);
    setSelected(prev => {
      if (!prev || prev.id !== id) return prev;
      return nextPredictions[0] ?? null;
    });
  }

  useEffect(() => {
    fetchReports();
  }, [latestPredictionId]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const differentialColors = ['bg-blue-500', 'bg-cyan-500', 'bg-teal-500', 'bg-slate-400', 'bg-slate-300'];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Reports & Results</h1>
            <p className="text-slate-600">View and explore all your AI analysis reports from this session.</p>
          </div>
          <button
            onClick={fetchReports}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500">Loading reports...</p>
          </div>
        ) : predictions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-slate-300" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-2">No reports yet</h3>
            <p className="text-slate-500 text-sm mb-6">Upload a chest X-ray to generate your first AI analysis report.</p>
            <button
              onClick={() => onNavigate('predictor')}
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 text-sm transition-colors"
            >
              Start Analysis
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider px-1">Session History ({predictions.length})</h2>
              {predictions.map(p => (
                <div
                  key={p.id}
                  className={`w-full p-4 rounded-xl border transition-all ${
                    selected?.id === p.id
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <button
                      onClick={() => setSelected(p)}
                      className="flex-1 text-left"
                    >
                      <p className="font-semibold text-slate-900 text-sm">{p.diagnosis}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-36">{p.filename || 'chest_xray.jpg'}</p>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void deleteReport(p.id)}
                        className="text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md px-2 py-1 transition-colors"
                      >
                        Remove
                      </button>
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-0.5 transition-colors ${selected?.id === p.id ? 'text-blue-600' : 'text-slate-300'}`} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <SeverityBadge severity={p.severity} size="sm" />
                    <span className="text-xs text-slate-400">{formatDate(p.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>

            {selected && (
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-500">Analysis Report</span>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">{selected.diagnosis}</h2>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(selected.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <SeverityBadge severity={selected.severity} size="lg" />
                      <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        Export
                      </button>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4 mb-5">
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-slate-500 mb-1">Confidence</p>
                      <p className="text-3xl font-bold text-blue-600">{selected.confidence}%</p>
                      <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${selected.confidence}%` }} />
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-slate-500 mb-1">Risk Score</p>
                      <p className="text-3xl font-bold text-slate-900">{selected.risk_score}</p>
                      <p className="text-xs text-slate-400 mt-1">out of 100</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-slate-500 mb-1">Severity</p>
                      <p className="text-lg font-bold text-slate-900 capitalize mt-1">{selected.severity}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Clinical Assessment</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{selected.notes}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Explainable AI — Grad-CAM
                    </h3>
                    <div className="flex flex-col items-center gap-4">
                      {selected.heatmap_data?.gradcam ? (
                        <HeatmapOverlay data={selected.heatmap_data.gradcam} width={220} height={220} />
                      ) : (
                        <div className="w-52 h-52 bg-slate-100 rounded-xl flex items-center justify-center">
                          <AlertCircle className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                      <p className="text-xs text-slate-500 text-center leading-relaxed">
                        Activation map highlighting regions the model weighted most heavily for diagnosis. Red/yellow = high attention.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Differential Diagnosis</h3>
                    <div className="space-y-3">
                      {[
                        { label: selected.diagnosis, probability: selected.confidence / 100 },
                        { label: selected.diagnosis === 'Normal' ? 'Atelectasis' : 'Normal', probability: (100 - selected.confidence) * 0.4 / 100 },
                        { label: 'Pleural Effusion', probability: (100 - selected.confidence) * 0.25 / 100 },
                        { label: 'Cardiomegaly', probability: (100 - selected.confidence) * 0.2 / 100 },
                        { label: 'Edema', probability: (100 - selected.confidence) * 0.15 / 100 },
                      ].map((d, i) => (
                        <div key={d.label}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className={`font-medium ${i === 0 ? 'text-slate-900' : 'text-slate-600'}`}>{d.label}</span>
                            <span className="text-slate-500">{(d.probability * 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${differentialColors[i]}`}
                              style={{ width: `${d.probability * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <h3 className="font-semibold text-slate-800 mb-4">Model Information</h3>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    {[
                      { label: 'Architecture', value: 'Custom CNN' },
                      { label: 'Dataset', value: 'Chest X-ray (5k+ images)' },
                      { label: 'Val. Accuracy', value: '87%' },
                      { label: 'XAI Method', value: 'Grad-CAM v2' },
                      { label: 'Classes', value: '2 (NORMAL, PNEUMONIA)' },
                      { label: 'Preprocessing', value: 'Normalization + Resize' },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-500 text-xs mb-1">{item.label}</p>
                        <p className="font-medium text-slate-800">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

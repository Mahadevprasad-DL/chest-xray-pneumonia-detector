import { useState } from 'react';
import { AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { calculateSymptomRisk } from '../lib/aiSimulator';
import SeverityBadge from '../components/SeverityBadge';
import RiskGauge from '../components/RiskGauge';
import type { Page, Severity } from '../types';

interface Props {
  onNavigate: (page: Page) => void;
}

const symptomOptions = [
  'Cough', 'High fever', 'Fever', 'Chest pain', 'Shortness of breath',
  'Difficulty breathing', 'Fatigue', 'Night sweats', 'Chills', 'Rapid heartbeat',
  'Coughing blood', 'Wheezing', 'Body aches', 'Loss of appetite', 'Weakness',
];

const riskFactors = [
  { id: 'age65', label: 'Age 65 or older', score: 15 },
  { id: 'smoking', label: 'Current smoker', score: 12 },
  { id: 'diabetes', label: 'Diabetes', score: 10 },
  { id: 'heart', label: 'Heart disease', score: 10 },
  { id: 'immunocomp', label: 'Immunocompromised', score: 18 },
  { id: 'copd', label: 'COPD / Asthma', score: 12 },
];

export default function RiskAnalysisPage({ onNavigate }: Props) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [age, setAge] = useState('');
  const [duration, setDuration] = useState('');
  const [factors, setFactors] = useState<string[]>([]);
  const [result, setResult] = useState<ReturnType<typeof calculateSymptomRisk> | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  function toggleSymptom(s: string) {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  function toggleFactor(id: string) {
    setFactors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function calculate() {
    const a = parseInt(age) || 30;
    const d = parseInt(duration) || 1;
    const allSymptoms = [...selectedSymptoms];
    if (factors.includes('age65')) allSymptoms.push('age 65');
    const r = calculateSymptomRisk(allSymptoms, d, a);
    const bonus = factors.filter(f => f !== 'age65').length;
    r.risk_score = Math.min(100, r.risk_score + bonus * 5);
    if (r.risk_score >= 75) r.severity = 'critical' as Severity;
    else if (r.risk_score >= 55) r.severity = 'high' as Severity;
    else if (r.risk_score >= 30) r.severity = 'moderate' as Severity;
    setResult(r);
    setShowDetails(true);
  }

  const severityConfig = {
    low: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, iconColor: 'text-emerald-600', bar: 'bg-emerald-500' },
    moderate: { bg: 'bg-amber-50', border: 'border-amber-200', icon: Info, iconColor: 'text-amber-600', bar: 'bg-amber-500' },
    high: { bg: 'bg-orange-50', border: 'border-orange-200', icon: AlertTriangle, iconColor: 'text-orange-600', bar: 'bg-orange-500' },
    critical: { bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, iconColor: 'text-red-600', bar: 'bg-red-500' },
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Risk Analysis</h1>
          <p className="text-slate-600">Calculate your comprehensive health risk score based on symptoms and risk factors.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="font-semibold text-slate-800 mb-4">Patient Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1.5 font-medium">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="e.g. 45"
                    min={1} max={120}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1.5 font-medium">Symptom Duration (days)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="e.g. 3"
                    min={0}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="font-semibold text-slate-800 mb-4">Select Symptoms</h2>
              <div className="flex flex-wrap gap-2">
                {symptomOptions.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
                      selectedSymptoms.includes(s)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="font-semibold text-slate-800 mb-4">Risk Factors</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {riskFactors.map(f => (
                  <label key={f.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      factors.includes(f.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'
                    }`}
                      onClick={() => toggleFactor(f.id)}
                    >
                      {factors.includes(f.id) && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-slate-700">{f.label}</span>
                    <span className="ml-auto text-xs text-slate-400">+{f.score}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={calculate}
              disabled={selectedSymptoms.length === 0 && factors.length === 0}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-blue-200 hover:shadow-md"
            >
              Calculate Risk Score
            </button>
          </div>

          <div className="lg:col-span-2">
            {result ? (
              <div className="space-y-5 sticky top-24">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <div className="text-center mb-5">
                    <RiskGauge score={result.risk_score} size={180} />
                    <div className="mt-3">
                      <SeverityBadge severity={result.severity} size="lg" />
                    </div>
                  </div>

                  <div className={`rounded-xl p-4 border ${severityConfig[result.severity].bg} ${severityConfig[result.severity].border}`}>
                    <p className={`text-sm font-medium ${severityConfig[result.severity].iconColor} mb-1`}>
                      {result.risk_level} Risk
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-semibold text-slate-800 text-sm">Recommendations</span>
                    {showDetails ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>
                  {showDetails && (
                    <div className="px-6 pb-5 space-y-2.5 border-t border-slate-50">
                      {result.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-2.5 text-sm text-slate-700">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${severityConfig[result.severity].bar} bg-opacity-20`}>
                            <span className="text-xs font-bold" style={{ color: result.severity === 'low' ? '#059669' : result.severity === 'moderate' ? '#d97706' : result.severity === 'high' ? '#ea580c' : '#dc2626' }}>{i + 1}</span>
                          </div>
                          <p>{rec}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => onNavigate('predictor')}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 text-sm transition-colors"
                  >
                    Analyze X-Ray for Confirmation
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onNavigate('reports')}
                    className="w-full py-3 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 text-sm transition-colors"
                  >
                    View Reports
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                <RiskGauge score={0} size={160} />
                <p className="text-slate-500 text-sm mt-4">Fill in the form and calculate your risk score</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

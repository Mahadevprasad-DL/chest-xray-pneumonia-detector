import { Activity, Brain, FileSearch, ShieldCheck, BarChart2, ArrowRight, Zap, Users, CheckCircle } from 'lucide-react';
import type { Page } from '../types';

interface Props {
  onNavigate: (page: Page) => void;
}

const features = [
  {
    icon: FileSearch,
    title: 'X-Ray Analysis',
    description: 'Upload chest X-rays and receive AI-powered diagnosis with confidence scores and visual explanations.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Brain,
    title: 'Symptom Checker',
    description: 'Describe your symptoms through our intelligent chatbot for a comprehensive preliminary assessment.',
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    icon: BarChart2,
    title: 'Risk Scoring',
    description: 'Combined analysis generates a nuanced risk score with severity classification and actionable insights.',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    icon: ShieldCheck,
    title: 'Explainable AI',
    description: 'Grad-CAM heatmaps highlight regions of concern, making model decisions transparent and trustworthy.',
    color: 'bg-emerald-50 text-emerald-600',
  },
];

const stats = [
  { value: '87%', label: 'Detection Accuracy' },
  { value: '< 3s', label: 'Analysis Time' },
  { value: '2', label: 'Disease Classes' },
  { value: '5k+', label: 'Training Images' },
];

const steps = [
  { step: '01', title: 'Upload X-Ray', desc: 'Securely upload your chest radiograph in any common image format.' },
  { step: '02', title: 'Report Symptoms', desc: 'Complete our guided symptom questionnaire for comprehensive analysis.' },
  { step: '03', title: 'AI Analysis', desc: 'Our deep learning model processes the inputs in seconds.' },
  { step: '04', title: 'Get Results', desc: 'Receive detailed predictions, risk scores, and clinical recommendations.' },
];

export default function HomePage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen">
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-cyan-50/30" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-100/30 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              AI-Powered Medical Imaging
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight mb-6">
              Intelligent Disease{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                Prediction
              </span>{' '}
              from Chest X-Rays
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed mb-8 max-w-2xl">
              AI powered medicial diagnosis assistant combines deep learning image analysis with symptom-based NLP to detect pneumonia and other pulmonary conditions — with clinical-grade transparency through explainable AI.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate('predictor')}
                className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5"
              >
                Analyze X-Ray
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('symptom-checker')}
                className="flex items-center gap-2 px-6 py-3.5 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                Check Symptoms
              </button>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Comprehensive Health Intelligence</h2>
            <p className="text-slate-600 max-w-xl mx-auto">Every feature is designed to bridge the gap between AI capabilities and clinical utility.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(f => (
              <div key={f.title} className="group p-6 rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color} mb-5`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-600">A simple four-step process from input to actionable insights.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-blue-200 to-transparent z-0 -translate-y-0.5" style={{ width: 'calc(100% - 3rem)', left: '100%' }} />
                )}
                <div className="relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <div className="text-4xl font-black text-blue-100 mb-4">{s.step}</div>
                  <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-cyan-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
              <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                Upload a chest X-ray or describe your symptoms to receive an AI-powered assessment in seconds. For educational and screening purposes only.
              </p>
              <div className="space-y-3">
                {['No registration required', 'Results in under 3 seconds', 'Explainable AI visualizations'].map(t => (
                  <div key={t} className="flex items-center gap-3 text-white">
                    <CheckCircle className="w-5 h-5 text-cyan-300 flex-shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 lg:justify-end">
              <button
                onClick={() => onNavigate('predictor')}
                className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Start X-Ray Analysis
              </button>
              <button
                onClick={() => onNavigate('symptom-checker')}
                className="px-8 py-4 bg-blue-500/30 backdrop-blur text-white font-bold rounded-xl border border-white/30 hover:bg-blue-500/40 transition-all hover:-translate-y-0.5"
              >
                Symptom Checker
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

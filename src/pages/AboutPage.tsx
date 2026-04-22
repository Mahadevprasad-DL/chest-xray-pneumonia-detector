import { Brain, Layers, Shield, Cpu, GitBranch, Database, Code2, Award } from 'lucide-react';

const techStack = [
  { icon: Brain, name: 'Deep Learning', desc: 'Custom CNN architecture trained on chest X-ray images for binary classification (NORMAL vs PNEUMONIA).', color: 'bg-blue-50 text-blue-600' },
  { icon: Cpu, name: 'NLP Engine', desc: 'Natural language processing for symptom extraction and intent recognition using transformer-based models.', color: 'bg-cyan-50 text-cyan-600' },
  { icon: Shield, name: 'Explainable AI', desc: 'Grad-CAM (Gradient-weighted Class Activation Mapping) provides visual explanations for model predictions.', color: 'bg-teal-50 text-teal-600' },
  { icon: Layers, name: 'React + TypeScript', desc: 'Modern frontend stack with strict typing, component-based architecture, and Tailwind CSS for styling.', color: 'bg-emerald-50 text-emerald-600' },
  { icon: Database, name: 'Supabase', desc: 'PostgreSQL-backed database with Row Level Security for storing predictions, sessions, and feedback securely.', color: 'bg-green-50 text-green-600' },
  { icon: GitBranch, name: 'Vite + ESBuild', desc: 'Lightning-fast build tooling with hot module replacement for a smooth development experience.', color: 'bg-slate-50 text-slate-600' },
];

const metrics = [
  { label: 'Model Accuracy', value: '87%', sub: 'Validation accuracy' },
  { label: 'Sensitivity', value: '91.8%', sub: 'True positive rate' },
  { label: 'Specificity', value: '96.1%', sub: 'True negative rate' },
  { label: 'F1 Score', value: '0.931', sub: 'Harmonic mean' },
];

const timeline = [
  { phase: 'Data Collection', desc: 'Curated chest X-ray dataset prepared with NORMAL and PNEUMONIA classes.' },
  { phase: 'Preprocessing', desc: 'Image normalization, resizing, and augmentation (flipping, rotation).' },
  { phase: 'Model Training', desc: 'Custom CNN training and validation for binary chest X-ray classification.' },
  { phase: 'Validation', desc: 'Cross-validation with 80/10/10 train/val/test split; early stopping applied.' },
  { phase: 'XAI Integration', desc: 'Grad-CAM layer hooks generate attention maps per inference.' },
  { phase: 'Deployment', desc: 'Served via REST API with sub-3-second inference latency.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium mb-5">
            <Code2 className="w-3.5 h-3.5" />
            Technology Overview
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">About AI powered medicial diagnosis assistant</h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
            An AI-powered healthcare platform combining computer vision, natural language processing, and explainable AI to democratize medical image analysis.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-8 mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Mission & Purpose</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            AI powered medicial diagnosis assistant was built to bridge the gap between cutting-edge medical AI research and practical healthcare accessibility. By combining deep learning image analysis with symptom-based natural language processing, the system provides a comprehensive, multi-modal health assessment.
          </p>
          <p className="text-slate-600 leading-relaxed">
            The platform prioritizes transparency through explainable AI — every prediction is accompanied by a Grad-CAM visualization that shows exactly which regions of the X-ray influenced the model's decision, building trust and enabling clinical correlation.
          </p>
          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm"><strong>Important:</strong> AI powered medicial diagnosis assistant is a research and educational demonstration system. It is not a certified medical device and must not replace professional medical diagnosis or clinical judgment.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          {metrics.map(m => (
            <div key={m.label} className="bg-white rounded-xl border border-slate-100 p-5 text-center shadow-sm">
              <p className="text-3xl font-bold text-blue-600 mb-1">{m.value}</p>
              <p className="font-semibold text-slate-800 text-sm">{m.label}</p>
              <p className="text-xs text-slate-500 mt-1">{m.sub}</p>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Technology Stack</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {techStack.map(t => (
              <div key={t.name} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.color} mb-4`}>
                  <t.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{t.name}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Model Development Pipeline</h2>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
            <div className="space-y-6">
              {timeline.map((item, i) => (
                <div key={item.phase} className="flex gap-6 relative">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                    {i + 1}
                  </div>
                  <div className="pt-1 pb-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{item.phase}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

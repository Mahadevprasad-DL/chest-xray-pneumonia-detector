import { ArrowRight, BarChart2, Brain, FileSearch, Info, LayoutDashboard, ShieldCheck } from 'lucide-react';
import type { Page } from '../types';

interface NavbarProps {
  current: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'home', label: 'Home', icon: LayoutDashboard },
  { id: 'predictor', label: 'Disease Predictor', icon: FileSearch },
  { id: 'symptom-checker', label: 'Symptom Checker', icon: Brain },
  { id: 'risk-analysis', label: 'Risk Analysis', icon: ShieldCheck },
  { id: 'reports', label: 'Reports', icon: BarChart2 },
  { id: 'about', label: 'About', icon: Info },
];

export default function Navbar({ current, onNavigate }: NavbarProps) {
  function handleNav(page: Page) {
    onNavigate(page);
  }

  return (
    <nav className="fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
      <div className="flex h-full flex-col px-5 py-6">
        <button onClick={() => handleNav('home')} className="text-left group">
          <span className="block font-extrabold text-slate-900 text-lg tracking-tight leading-tight max-w-[240px]">
            AI powered medicial diagnosis assistant
          </span>
          <span className="block text-xs text-slate-500 mt-1">AI diagnosis dashboard</span>
        </button>

        <div className="mt-8 flex-1 overflow-y-auto pr-1">
          <div className="space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                    current === item.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                      current === item.id ? 'bg-white/15' : 'bg-slate-100 text-slate-500 group-hover:bg-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {current === item.id && <ArrowRight className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-5">
          <button
            onClick={() => handleNav('predictor')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition-transform hover:-translate-y-0.5"
          >
            Start Analysis
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}

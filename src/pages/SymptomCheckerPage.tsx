import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ArrowRight, RotateCcw, Download } from 'lucide-react';
import { supabase, getSessionId } from '../lib/supabase';
import { calculateSymptomRisk } from '../lib/aiSimulator';
import type { ChatMessage, Page } from '../types';

interface Props {
  onNavigate: (page: Page) => void;
}

type Step = 'greeting' | 'age' | 'gender' | 'symptoms' | 'duration' | 'additional' | 'done';

interface AssessmentReport {
  age: number;
  gender: string;
  symptoms: string[];
  duration: number;
  additionalInfo: string;
  riskLevel: string;
  riskScore: number;
  summary: string;
  recommendations: string[];
  generatedAt: string;
}

const symptomSuggestions = [
  'Cough', 'Fever', 'Chest pain', 'Shortness of breath',
  'Fatigue', 'Night sweats', 'Chills', 'Rapid heartbeat',
  'Headache', 'Body aches', 'Loss of appetite', 'Wheezing',
];

function botMsg(content: string): ChatMessage {
  return { role: 'bot', content };
}
function userMsg(content: string): ChatMessage {
  return { role: 'user', content };
}

function buildReportText(report: AssessmentReport): string {
  return [
    'AI powered medicial diagnosis assistant - Symptom Assessment Report',
    `Generated At: ${report.generatedAt}`,
    '',
    'Based on your inputs:',
    `Age: ${report.age}`,
    `Gender: ${report.gender}`,
    `Symptoms: ${report.symptoms.join(', ')}`,
    `Duration: ${report.duration} day(s)`,
    `Additional: ${report.additionalInfo}`,
    '',
    `Risk Assessment: ${report.riskLevel} (Score: ${report.riskScore}/100)`,
    '',
    'Summary:',
    report.summary,
    '',
    'Recommendations:',
    ...report.recommendations.map((r, i) => `${i + 1}. ${r}`),
  ].join('\n');
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function SymptomCheckerPage({ onNavigate }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    botMsg("Hello! I'm AI powered medicial diagnosis assistant symptom assistant. I'll help assess your symptoms and estimate your risk level. Let's start — how old are you?"),
  ]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState<Step>('age');
  const [age, setAge] = useState(0);
  const [gender, setGender] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState(0);
  const [typing, setTyping] = useState(false);
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  function addBot(content: string) {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, botMsg(content)]);
    }, 900 + Math.random() * 400);
  }

  async function handleSend(text?: string) {
    const value = (text ?? input).trim();
    if (!value) return;
    setInput('');
    setMessages(prev => [...prev, userMsg(value)]);

    if (step === 'age') {
      const a = parseInt(value);
      if (isNaN(a) || a < 1 || a > 120) {
        addBot("Please enter a valid age (e.g., 35).");
        return;
      }
      setAge(a);
      setStep('gender');
      addBot(`Got it — ${a} years old. What is your biological sex? (Male / Female / Other)`);
    } else if (step === 'gender') {
      setGender(value);
      setStep('symptoms');
      addBot("Thank you. Please describe your symptoms. You can type them one by one or select from the suggestions below. Type 'done' when finished.");
    } else if (step === 'symptoms') {
      if (value.toLowerCase() === 'done') {
        if (symptoms.length === 0) {
          addBot("Please enter at least one symptom before continuing.");
          return;
        }
        setStep('duration');
        addBot(`I've noted ${symptoms.length} symptom(s): ${symptoms.join(', ')}. How many days have you been experiencing these symptoms?`);
      } else {
        const newSymptoms = [...symptoms, value];
        setSymptoms(newSymptoms);
        addBot(`Noted: "${value}". Any other symptoms? Type another symptom or type 'done' to continue.`);
      }
    } else if (step === 'duration') {
      const d = parseInt(value);
      if (isNaN(d) || d < 0) {
        addBot("Please enter the number of days (e.g., 3).");
        return;
      }
      setDuration(d);
      setStep('additional');
      addBot("Do you have any pre-existing conditions or relevant medical history? (e.g., asthma, diabetes, or type 'none')");
    } else if (step === 'additional') {
      setStep('done');
      await completeAssessment(value);
    }
  }

  async function completeAssessment(additionalInfo: string) {
    addBot("Analyzing your symptoms...");
    await new Promise(res => setTimeout(res, 1200));

    const risk = calculateSymptomRisk(symptoms, duration, age);

    await supabase.from('symptom_sessions').insert({
      session_id: getSessionId(),
      symptoms_json: symptoms,
      duration_days: duration,
      age,
      gender,
      risk_level: risk.risk_level,
    }).select().maybeSingle();

    const reportPayload: AssessmentReport = {
      age,
      gender,
      symptoms,
      duration,
      additionalInfo,
      riskLevel: risk.risk_level,
      riskScore: risk.risk_score,
      summary: risk.summary,
      recommendations: risk.recommendations,
      generatedAt: new Date().toLocaleString(),
    };

    setReport(reportPayload);

    const summary = `Based on your inputs:

**Age:** ${age} | **Gender:** ${gender}
**Symptoms:** ${symptoms.join(', ')}
**Duration:** ${duration} day(s)
**Additional:** ${additionalInfo}

**Risk Assessment:** ${risk.risk_level} (Score: ${risk.risk_score}/100)

${risk.summary}

**Recommendations:**
${risk.recommendations.map(r => `• ${r}`).join('\n')}

Would you like to proceed to a detailed Risk Analysis or upload a chest X-ray for deeper evaluation?`;

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, botMsg(summary)]);
    }, 1400);
  }

  function reset() {
    setMessages([botMsg("Hello! I'm AI powered medicial diagnosis assistant symptom assistant. I'll help assess your symptoms and estimate your risk level. Let's start — how old are you?")]);
    setInput('');
    setStep('age');
    setAge(0);
    setGender('');
    setSymptoms([]);
    setDuration(0);
    setReport(null);
  }

  function downloadReportTxt() {
    if (!report) return;
    const text = buildReportText(report);
    downloadBlob(text, 'ai-powered-medicial-diagnosis-assistant-symptom-report.txt', 'text/plain;charset=utf-8');
  }

  function downloadReportExcel() {
    if (!report) return;

    const rows = [
      ['Field', 'Value'],
      ['Generated At', report.generatedAt],
      ['Age', String(report.age)],
      ['Gender', report.gender],
      ['Symptoms', report.symptoms.join(', ')],
      ['Duration (days)', String(report.duration)],
      ['Additional', report.additionalInfo],
      ['Risk Level', report.riskLevel],
      ['Risk Score', String(report.riskScore)],
      ['Summary', report.summary],
      ['Recommendations', report.recommendations.join(' | ')],
    ];

    const csv = rows
      .map(([k, v]) => `"${k.replace(/"/g, '""')}","${v.replace(/"/g, '""')}"`)
      .join('\n');

    downloadBlob(csv, 'ai-powered-medicial-diagnosis-assistant-symptom-report.xls', 'application/vnd.ms-excel;charset=utf-8');
  }

  function addSuggestion(s: string) {
    if (step !== 'symptoms') return;
    handleSend(s);
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Symptom Checker</h1>
            <p className="text-slate-600">Describe your symptoms to our AI assistant for a preliminary risk assessment.</p>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 items-start">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">AI powered medicial diagnosis assistant</p>
              <p className="text-blue-100 text-xs">Symptom Analysis Mode</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white text-xs">Online</span>
            </div>
          </div>

            <div className="h-96 overflow-y-auto p-5 space-y-4 scroll-smooth">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'bot' ? 'bg-blue-100' : 'bg-slate-200'
                  }`}>
                    {msg.role === 'bot' ? (
                      <Bot className="w-4 h-4 text-blue-600" />
                    ) : (
                      <User className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div className={`max-w-sm rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'bot'
                      ? 'bg-slate-50 text-slate-700 rounded-tl-sm'
                      : 'bg-blue-600 text-white rounded-tr-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="bg-slate-50 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1 items-center h-4">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {step === 'symptoms' && (
              <div className="px-5 pb-3">
                <p className="text-xs text-slate-500 mb-2">Quick add:</p>
                <div className="flex flex-wrap gap-1.5">
                  {symptomSuggestions.filter(s => !symptoms.includes(s)).slice(0, 8).map(s => (
                    <button
                      key={s}
                      onClick={() => addSuggestion(s)}
                      className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                  {symptoms.length > 0 && (
                    <button
                      onClick={() => handleSend('done')}
                      className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 hover:bg-emerald-100 transition-colors font-medium"
                    >
                      Done ({symptoms.length})
                    </button>
                  )}
                </div>
              </div>
            )}

            {step !== 'done' && (
              <div className="px-5 py-4 border-t border-slate-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                    placeholder={
                      step === 'age' ? 'Enter your age...' :
                      step === 'gender' ? 'Male / Female / Other' :
                      step === 'symptoms' ? 'Describe a symptom...' :
                      step === 'duration' ? 'Number of days...' :
                      'Additional information...'
                    }
                    disabled={typing}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || typing}
                    className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0"
                  >
                    {typing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate('risk-analysis')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  View Risk Analysis
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('predictor')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  Upload X-Ray
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-base font-semibold text-slate-800">Based on your inputs</h2>
              <p className="text-xs text-slate-500 mt-1">Structured summary of your symptom assessment.</p>
            </div>

            <div className="p-5">
              {report ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-700 space-y-2">
                    <p><span className="font-semibold text-slate-900">Age:</span> {report.age}</p>
                    <p><span className="font-semibold text-slate-900">Gender:</span> {report.gender}</p>
                    <p><span className="font-semibold text-slate-900">Symptoms:</span> {report.symptoms.join(', ')}</p>
                    <p><span className="font-semibold text-slate-900">Duration:</span> {report.duration} day(s)</p>
                    <p><span className="font-semibold text-slate-900">Additional:</span> {report.additionalInfo}</p>
                  </div>

                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900 mb-1">Risk Assessment</p>
                    <p className="mb-2">{report.riskLevel} (Score: {report.riskScore}/100)</p>
                    <p>{report.summary}</p>
                  </div>

                  <div className="rounded-xl bg-white border border-slate-100 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900 mb-2">Recommendations</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {report.recommendations.map(r => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={downloadReportTxt}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download TXT
                    </button>
                    <button
                      onClick={downloadReportExcel}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download XL
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500 rounded-xl border border-dashed border-slate-200 p-4">
                  Complete the chat flow to generate your assessment report here.
                </div>
              )}
            </div>
          </div>
        </div>

        {symptoms.length > 0 && (
          <div className="mt-5 bg-white rounded-xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm">Collected Symptoms</h3>
            <div className="flex flex-wrap gap-2">
              {symptoms.map(s => (
                <span key={s} className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

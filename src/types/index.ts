export type Severity = 'low' | 'moderate' | 'high' | 'critical';

export interface Prediction {
  id: string;
  user_session_id: string;
  filename: string;
  diagnosis: string;
  confidence: number;
  severity: Severity;
  risk_score: number;
  symptoms_json: string[];
  heatmap_data: Record<string, number[][]>;
  notes: string;
  created_at: string;
}

export interface SymptomSession {
  id: string;
  session_id: string;
  symptoms_json: string[];
  duration_days: number;
  age: number;
  gender: string;
  risk_level: string;
  prediction_id: string | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  name: string;
  email: string;
  category: string;
  message: string;
  rating: number | null;
  created_at: string;
}

export interface ChatMessage {
  role: 'bot' | 'user';
  content: string;
}

export type Page = 'home' | 'predictor' | 'symptom-checker' | 'risk-analysis' | 'reports' | 'about';

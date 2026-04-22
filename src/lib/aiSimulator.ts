import type { Severity } from '../types';

export interface AnalysisResult {
  diagnosis: string;
  confidence: number;
  severity: Severity;
  risk_score: number;
  notes: string;
  heatmap_data: Record<string, number[][]>;
  differentials: { label: string; probability: number }[];
}

const diagnoses = [
  { label: 'Pneumonia', weight: 0.35 },
  { label: 'Normal', weight: 0.40 },
  { label: 'Pleural Effusion', weight: 0.10 },
  { label: 'Cardiomegaly', weight: 0.08 },
  { label: 'Atelectasis', weight: 0.07 },
];

function generateHeatmap(rows = 14, cols = 14): number[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const cx = cols / 2;
      const cy = rows / 2;
      const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
      const base = Math.max(0, 1 - dist / (Math.max(rows, cols) * 0.6));
      return parseFloat((base * 0.7 + Math.random() * 0.3).toFixed(3));
    })
  );
}

export async function simulateXRayAnalysis(_filename: string, symptoms: string[]): Promise<AnalysisResult> {
  await new Promise(res => setTimeout(res, 2800));

  const rand = Math.random();
  let cumulative = 0;
  let chosen = diagnoses[0];
  for (const d of diagnoses) {
    cumulative += d.weight;
    if (rand <= cumulative) { chosen = d; break; }
  }

  const hasSymptoms = symptoms.length > 0;
  const pneumoniaSymptoms = ['fever', 'cough', 'chest pain', 'shortness of breath', 'fatigue'];
  const matchCount = symptoms.filter(s => pneumoniaSymptoms.some(ps => s.toLowerCase().includes(ps))).length;

  let confidence = 72 + Math.random() * 20;
  let risk_score = 20 + Math.random() * 30;

  if (chosen.label === 'Pneumonia') {
    confidence = 80 + Math.random() * 15;
    risk_score = 55 + matchCount * 8 + Math.random() * 15;
  } else if (chosen.label === 'Normal') {
    confidence = 88 + Math.random() * 10;
    risk_score = hasSymptoms ? 15 + matchCount * 5 + Math.random() * 10 : 8 + Math.random() * 12;
  }

  risk_score = Math.min(100, risk_score);
  confidence = Math.min(99.5, confidence);

  let severity: Severity = 'low';
  if (risk_score >= 75) severity = 'critical';
  else if (risk_score >= 55) severity = 'high';
  else if (risk_score >= 35) severity = 'moderate';

  const notes = chosen.label === 'Pneumonia'
    ? 'Consolidation patterns observed in the lower lung fields. Recommend clinical correlation and follow-up imaging in 4–6 weeks post-treatment.'
    : chosen.label === 'Normal'
    ? 'Lung fields appear clear. No significant opacification, effusion, or cardiomegaly detected. Continue routine monitoring.'
    : `Radiographic findings suggestive of ${chosen.label}. Clinical correlation with patient history is recommended.`;

  const allLabels = diagnoses.map(d => d.label);
  const remaining = 1 - confidence / 100;
  const differentials = allLabels
    .filter(l => l !== chosen.label)
    .map((label, i) => ({ label, probability: parseFloat((remaining * (0.4 - i * 0.07)).toFixed(3)) }))
    .filter(d => d.probability > 0);

  return {
    diagnosis: chosen.label,
    confidence: parseFloat(confidence.toFixed(1)),
    severity,
    risk_score: parseFloat(risk_score.toFixed(1)),
    notes,
    heatmap_data: { gradcam: generateHeatmap() },
    differentials,
  };
}

export interface SymptomRisk {
  risk_level: string;
  risk_score: number;
  severity: Severity;
  summary: string;
  recommendations: string[];
}

export function calculateSymptomRisk(symptoms: string[], duration: number, age: number): SymptomRisk {
  const critical = ['chest pain', 'difficulty breathing', 'coughing blood', 'severe shortness of breath'];
  const high = ['high fever', 'persistent cough', 'night sweats', 'rapid heartbeat'];
  const moderate = ['fever', 'cough', 'fatigue', 'weakness', 'chills'];

  let score = 0;
  score += symptoms.filter(s => critical.some(c => s.toLowerCase().includes(c))).length * 25;
  score += symptoms.filter(s => high.some(h => s.toLowerCase().includes(h))).length * 15;
  score += symptoms.filter(s => moderate.some(m => s.toLowerCase().includes(m))).length * 8;
  score += Math.min(duration * 2, 20);
  if (age > 65) score += 15;
  else if (age > 50) score += 8;
  score = Math.min(100, score);

  let severity: Severity = 'low';
  let risk_level = 'Low';
  if (score >= 75) { severity = 'critical'; risk_level = 'Critical'; }
  else if (score >= 55) { severity = 'high'; risk_level = 'High'; }
  else if (score >= 30) { severity = 'moderate'; risk_level = 'Moderate'; }

  const recommendations: string[] = [];
  if (severity === 'critical') {
    recommendations.push('Seek emergency medical attention immediately');
    recommendations.push('Do not delay — call emergency services');
  } else if (severity === 'high') {
    recommendations.push('Schedule an urgent appointment with your doctor');
    recommendations.push('Consider getting a chest X-ray for further evaluation');
    recommendations.push('Monitor symptoms closely and rest');
  } else if (severity === 'moderate') {
    recommendations.push('Consult a physician within 24–48 hours');
    recommendations.push('Stay hydrated and monitor temperature');
    recommendations.push('Avoid strenuous activities');
  } else {
    recommendations.push('Monitor symptoms over the next few days');
    recommendations.push('Stay hydrated and get adequate rest');
    recommendations.push('If symptoms worsen, consult a healthcare provider');
  }

  const summary = severity === 'critical'
    ? 'Your symptoms suggest a potentially serious condition requiring immediate medical attention.'
    : severity === 'high'
    ? 'Your symptoms indicate a significant health concern. Medical evaluation is strongly advised.'
    : severity === 'moderate'
    ? 'Your symptoms warrant medical attention. Please consult a healthcare provider soon.'
    : 'Your symptoms appear mild at this time. Continue monitoring and practice self-care.';

  return { risk_level, risk_score: score, severity, summary, recommendations };
}

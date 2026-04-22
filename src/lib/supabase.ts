import { createClient } from '@supabase/supabase-js';

type TableName = 'predictions' | 'symptom_sessions' | 'feedback';

type DatabaseState = Record<TableName, any[]>;

const STORAGE_KEY = 'ai_powered_medicial_diagnosis_assistant_mock_db_v1';

const emptyDb: DatabaseState = {
  predictions: [],
  symptom_sessions: [],
  feedback: [],
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readDb(): DatabaseState {
  if (typeof window === 'undefined') {
    return clone(emptyDb);
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return clone(emptyDb);
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DatabaseState>;
    return {
      predictions: Array.isArray(parsed.predictions) ? parsed.predictions : [],
      symptom_sessions: Array.isArray(parsed.symptom_sessions) ? parsed.symptom_sessions : [],
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
    };
  } catch {
    return clone(emptyDb);
  }
}

function writeDb(db: DatabaseState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function withDefaults(table: TableName, row: Record<string, any>) {
  const now = new Date().toISOString();
  const base = {
    id: createId(),
    created_at: row.created_at ?? now,
  };

  if (table === 'predictions') {
    return {
      user_session_id: '',
      filename: '',
      diagnosis: 'Unknown',
      confidence: 0,
      severity: 'low',
      risk_score: 0,
      symptoms_json: [],
      heatmap_data: {},
      notes: '',
      ...row,
      ...base,
    };
  }

  if (table === 'symptom_sessions') {
    return {
      session_id: '',
      symptoms_json: [],
      duration_days: 0,
      age: 0,
      gender: '',
      risk_level: 'low',
      prediction_id: null,
      ...row,
      ...base,
    };
  }

  return {
    name: '',
    email: '',
    category: 'general',
    message: '',
    rating: null,
    ...row,
    ...base,
  };
}

function createQuery(rows: any[]) {
  let currentRows = clone(rows);

  const query: any = {
    eq(column: string, value: unknown) {
      currentRows = currentRows.filter(row => row?.[column] === value);
      return query;
    },
    order(column: string, options?: { ascending?: boolean }) {
      const ascending = options?.ascending ?? true;
      currentRows = [...currentRows].sort((left, right) => {
        const leftValue = left?.[column];
        const rightValue = right?.[column];

        if (leftValue === rightValue) {
          return 0;
        }

        if (leftValue == null) {
          return 1;
        }

        if (rightValue == null) {
          return -1;
        }

        const comparison =
          typeof leftValue === 'number' && typeof rightValue === 'number'
            ? leftValue - rightValue
            : String(leftValue).localeCompare(String(rightValue));

        return ascending ? comparison : -comparison;
      });

      return query;
    },
    then(resolve: (value: { data: any[]; error: null }) => void, reject: (reason?: unknown) => void) {
      return Promise.resolve({ data: clone(currentRows), error: null }).then(resolve, reject);
    },
    catch(reject: (reason?: unknown) => void) {
      return Promise.resolve({ data: clone(currentRows), error: null }).catch(reject);
    },
    async single() {
      return { data: currentRows[0] ?? null, error: null };
    },
    async maybeSingle() {
      return { data: currentRows[0] ?? null, error: null };
    },
  };

  return query;
}

function createInsertResult(rows: any[]) {
  return {
    data: rows.length === 1 ? clone(rows[0]) : clone(rows),
    error: null,
    select() {
      return createQuery(rows);
    },
  };
}

function createMockSupabase() {
  return {
    from(table: TableName) {
      return {
        insert(value: Record<string, any> | Record<string, any>[]) {
          const inputRows = Array.isArray(value) ? value : [value];
          const db = readDb();
          const storedRows = inputRows.map(row => withDefaults(table, row));

          db[table].push(...storedRows);
          writeDb(db);

          return createInsertResult(storedRows);
        },
        select() {
          const db = readDb();
          return createQuery(db[table]);
        },
        delete() {
          const filters: Array<{ column: string; value: unknown }> = [];

          const action: any = {
            eq(column: string, value: unknown) {
              filters.push({ column, value });
              return action;
            },
            then(resolve: (value: { data: any[]; error: null }) => void, reject: (reason?: unknown) => void) {
              const db = readDb();
              const rows = db[table];

              const deletedRows = rows.filter(row =>
                filters.every(filter => row?.[filter.column] === filter.value)
              );

              db[table] = rows.filter(row =>
                !filters.every(filter => row?.[filter.column] === filter.value)
              );

              writeDb(db);

              return Promise.resolve({ data: clone(deletedRows), error: null }).then(resolve, reject);
            },
            catch(reject: (reason?: unknown) => void) {
              return Promise.resolve({ data: [], error: null }).catch(reject);
            },
          };

          return action;
        },
      };
    },
  };
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockSupabase();

export function getSessionId(): string {
  let id = sessionStorage.getItem('ai_powered_medicial_diagnosis_assistant_session');
  if (!id) {
    id = createId();
    sessionStorage.setItem('ai_powered_medicial_diagnosis_assistant_session', id);
  }
  return id;
}

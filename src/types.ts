export interface CurrentUser {
  display_name?: string | null
  google_email?: string | null
  id: string
  timezone: string
  history_version: number
  csrf_token: string
  llm_consent: boolean
}

export interface AuthConfig {
  oidc_enabled: boolean
  dev_login_enabled: boolean
}

export interface Inputs {
  sleep_hours: number
  academic_load: number
  screen_hours: number
  extracurricular_load: number
  deadline_pressure: number | null
  recovery: number | null
  reported_strain: number | null
}

export interface Submission extends Inputs {
  observation_date: string
  timezone: string
}

export interface Rule {
  id: string
  weight: 1
  antecedents: { variable: string; term: string; degree: number }[]
  consequent: string
  firing_strength: number
}

export interface CheckIn {
  guidance?: { id: string; policy_version: string; component_id: string; rule_ids: string[]; title: string; action: string; reason: string }[]
  id: string
  observation_date: string
  timezone: string
  revision: number
  recorded_at: string
  retrospective: boolean
  questionnaire_version: string
  inputs: Inputs
  assessment: {
    raw_score?: number | null
    components?: { id: string; label: string; raw_centroid: number; weight: number; contribution: number; explanation: string; rules: Rule[]; aggregate: { universe: number[]; membership: number[] } }[]
    status: 'ok' | 'unsupported' | 'error'
    score: number | null
    raw_centroid: number | null
    category: string | null
    model_version: string
    spec_hash: string
    memberships: Record<string, Record<string, number>>
    rules: Rule[]
    aggregate: { universe: number[]; membership: number[] }
    reason: string | null
    limitations: string[]
  }
  history_version: number
}

export interface CheckInPage {
  items: CheckIn[]
  next_cursor: string | null
  history_version: number
}

export interface PatternMetric {
  id: string; metric: keyof Inputs; baseline_count: number; recent_count: number
  baseline_median: number | null; recent_median: number | null; difference: number | null
  status: 'available' | 'insufficient_data'; mad: number | null; threshold: number | null
  latest_deviation: string | null; persistent_deviation: string | null; rule: string; limitation: string
}
export interface Patterns {
  policy_version: string; history_version: number
  windows: { baseline: string[]; recent: string[] }
  metrics: PatternMetric[]
  series: { date: string; inputs: Inputs | null; rolling_mean: Record<keyof Inputs, number | null> }[]
  cooccurrence: string | null
}
export interface ScenarioResult {
  hypothetical: true; inputs: Inputs; assessment: CheckIn['assessment']; difference: number | null
  reference: { id: string; revision: number; inputs: Inputs; assessment: CheckIn['assessment'] } | null
  history_version: number
}

export interface ReflectionSource { kind: 'checkin' | 'weekly'; checkin_id?: string; end_date?: string; expected_history_version: number }
export interface Reflection {
  id: string | null; status: 'grounded' | 'fallback'; reason: string | null
  history_version: number; source_hash: string; prompt_version: string; model_version: string
  output: { highlights: { evidence_id: string; text: string; reflection: string; source: Record<string, unknown> }[]; limitation: string }
  evidence: { id: string; text: string; source: Record<string, unknown> }[]
  context: Record<string, unknown>
}
export interface AIStatus { configured: boolean; consent: boolean; provider: string; model: string | null; hourly_limit: number; daily_limit: number; predictions_enabled: false }

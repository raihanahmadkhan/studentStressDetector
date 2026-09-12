export const fields = [
  ['sleep_hours', 'Sleep duration', 'Hours of sleep ending on this date.', 12, 0.25, 'hours'],
  ['academic_load', 'Academic workload', '0 = no academic demand; 10 = extremely demanding.', 10, 1, '/ 10'],
  ['deadline_pressure', 'Deadline pressure', 'How urgent or difficult to meet were your deadlines? 0 = none; 10 = extreme pressure.', 10, 1, '/ 10'],
  ['screen_hours', 'Screen time', 'Total hours using screens, including study and leisure. Count overlapping use once.', 16, 0.25, 'hours'],
  ['extracurricular_load', 'Other commitments', 'Nonacademic demands: 0 = none; 10 = extremely demanding.', 10, 1, '/ 10'],
  ['recovery', 'Recovery / relaxation', 'How much opportunity for rest and relaxation did you have? 0 = none; 10 = ample restorative downtime.', 10, 1, '/ 10'],
] as const

export function localDate(timezone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

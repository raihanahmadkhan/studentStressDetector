import { useId } from 'react'

export function NumericSlider({ name, label, help, max, step, unit, value, onChange }: {
  name: string; label: string; help: string; max: number; step: number; unit: string
  value: string; onChange: (value: string) => void
}) {
  const id = useId()
  const selected = value !== '' && value !== 'skip' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= max
  const shown = selected ? Number(value) : max / 2
  const text = `${step < 1 ? shown.toFixed(2).replace(/0$/, '') : shown} ${unit}`
  const endpoints = unit === 'hours' ? ['0h', `${max}h`] : name === 'recovery' ? ['None', 'Ample recovery'] : name === 'reported_strain' ? ['Not at all', 'Extremely strained'] : ['Low / none', 'High']
  return <div className="field slider-field">
    <label htmlFor={id}>{label}</label>
    <output htmlFor={id}>{selected ? text : value === 'skip' ? 'Skipped' : 'Choose a value'}</output>
    <input id={id} name={name} type="range" min={0} max={max} step={step} value={shown}
      aria-valuetext={selected ? text : `Unanswered; slider starts at ${text}`}
      aria-describedby={`${id}-help`} onChange={e => onChange(e.target.value)} />
    <div className="slider-endpoints" aria-hidden="true"><span>{endpoints[0]}</span><span>{endpoints[1]}</span></div>
    {!selected && value !== 'skip' && <button type="button" className="slider-confirm" onClick={() => onChange(String(shown))}>Use {text}</button>}
    <small id={`${id}-help`}>{help}</small>
  </div>
}

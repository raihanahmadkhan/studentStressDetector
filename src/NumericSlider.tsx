import { useId } from 'react'

function formatHoursMinutes(value: number) {
  const totalMinutes = Math.round(value * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

export function NumericSlider({ name, label, help, max, step, unit, value, onChange }: {
  name: string; label: string; help: string; max: number; step: number; unit: string
  value: string; onChange: (value: string) => void
}) {
  const id = useId()
  const selected = value !== '' && value !== 'skip' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= max
  const shown = selected ? Number(value) : max / 2
  const text = unit === 'hours' ? formatHoursMinutes(shown) : `${step < 1 ? shown.toFixed(2).replace(/0$/, '') : shown} ${unit}`
  const endpoints = unit === 'hours' ? ['0h', `${max}h`] : name === 'recovery' ? ['None', 'Ample recovery'] : name === 'reported_strain' ? ['Not at all', 'Extremely strained'] : ['Low / none', 'High']
  return <div className="field slider-field">
    <label htmlFor={id}>{label}</label>
    <output htmlFor={id}>{text}</output>
    <input id={id} name={name} type="range" min={0} max={max} step={step} value={shown}
      aria-valuetext={text}
      aria-describedby={`${id}-help`} onChange={e => onChange(e.target.value)} />
    <div className="slider-endpoints" aria-hidden="true"><span>{endpoints[0]}</span><span>{endpoints[1]}</span></div>
    <small id={`${id}-help`}>{help}</small>
  </div>
}

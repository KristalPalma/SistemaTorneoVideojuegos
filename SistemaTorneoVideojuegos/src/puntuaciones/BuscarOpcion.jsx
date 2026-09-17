import { useRef, useState } from 'react'

export default function BuscarOpcion({ id, items, value, onChange, placeholder, disabled, errorId, inputRef }) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const listRef = useRef(null)
  const label = item => `${item.nombre}${item.gamertag ? ` · ${item.gamertag}` : ''}`
  const normalize = text => text.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const matches = text.trim() ? items.filter(item => normalize(label(item)).includes(normalize(text))) : []
  const selected = items.find(item => String(item.ID) === value)
  const expanded = open && Boolean(text.trim()) && !disabled && !selected

  function choose(item) {
    onChange(String(item.ID))
    setText('')
    setOpen(false)
    setActive(-1)
  }

  return <div className="score-search-option">
    <input id={id} ref={inputRef} role="combobox" type="text" autoComplete="off" required
      placeholder={placeholder} value={selected ? label(selected) : text} disabled={disabled}
      aria-expanded={expanded} aria-autocomplete="list" aria-controls={`${id}-options`}
      aria-invalid={Boolean(errorId)} aria-describedby={errorId}
      aria-activedescendant={expanded && matches[active] ? `${id}-option-${active}` : undefined}
      onFocus={() => setOpen(true)} onBlur={() => { setOpen(false); setActive(-1) }}
      onChange={event => { setText(event.target.value); onChange(''); setOpen(true); setActive(-1) }}
      onKeyDown={event => {
        if (event.key === 'Escape') { setOpen(false); setActive(-1) }
        if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && text.trim() && !selected) {
          event.preventDefault()
          setOpen(true)
          const next = active < 0 ? (event.key === 'ArrowDown' ? 0 : matches.length - 1)
            : (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length
          setActive(matches.length ? next : -1)
          requestAnimationFrame(() => listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' }))
        }
        if (event.key === 'Enter' && expanded) {
          event.preventDefault()
          if (matches[active]) choose(matches[active])
        }
      }} />
    {expanded && <div className="score-suggestions">
      <ul ref={listRef} id={`${id}-options`} role="listbox" aria-label="Coincidencias">
        {matches.map((item, index) => <li key={item.ID} id={`${id}-option-${index}`} role="option"
          aria-selected={active === index} onPointerDown={event => event.preventDefault()} onClick={() => choose(item)}>{label(item)}</li>)}
      </ul>
      {!matches.length && <p role="status">No se encontraron coincidencias.</p>}
    </div>}
  </div>
}

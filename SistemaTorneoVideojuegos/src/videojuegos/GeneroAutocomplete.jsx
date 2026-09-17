import { useRef, useState } from 'react'
import { matchingGenres } from './generos.js'
import './Videojuegos.css'

export default function GeneroAutocomplete({ value, onChange, disabled, error }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const listRef = useRef(null)
  const matches = matchingGenres(value)
  const expanded = open && !disabled

  function select(genre) {
    onChange(genre)
    setOpen(false)
    setActive(-1)
  }

  function keyDown(event) {
    if (disabled) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      const next = !expanded || active < 0
        ? event.key === 'ArrowDown' ? 0 : matches.length - 1
        : (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length
      setActive(matches.length ? next : -1)
      requestAnimationFrame(() => listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' }))
    } else if (event.key === 'Enter' && expanded && matches[active]) {
      event.preventDefault()
      select(matches[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  return <div className="genre-autocomplete">
    <input id="game-genre" name="genre" type="text" role="combobox" autoComplete="off"
      placeholder="Escribe o selecciona un género" value={value} readOnly={disabled} required
      aria-autocomplete="list" aria-expanded={expanded} aria-controls="game-genre-options"
      aria-activedescendant={expanded && matches[active] ? `game-genre-option-${active}` : undefined}
      aria-invalid={Boolean(error)} aria-describedby={error ? 'game-genre-error' : 'game-genre-help'}
      onFocus={() => setOpen(true)} onBlur={() => { setOpen(false); setActive(-1) }} onKeyDown={keyDown}
      onChange={event => { onChange(event.target.value); setOpen(true); setActive(-1) }} />
    {expanded && <div className="genre-suggestions">
      <ul id="game-genre-options" ref={listRef} role="listbox" aria-label="Géneros sugeridos">
        {matches.map((genre, index) => <li key={genre} id={`game-genre-option-${index}`} role="option"
          aria-selected={active === index} onPointerDown={event => event.preventDefault()}
          onClick={() => select(genre)}>{genre}</li>)}
      </ul>
      {!matches.length && <p role="status">Sin coincidencias. Puedes conservar el género escrito.</p>}
    </div>}
    <p id="game-genre-help" className="player-help">Selecciona una sugerencia o escribe otro género.</p>
  </div>
}

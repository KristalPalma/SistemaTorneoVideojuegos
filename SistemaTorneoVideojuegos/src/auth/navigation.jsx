import { useEffect, useState } from 'react'

function currentPath() {
  const hash = window.location.hash.slice(1)
  return !hash || hash === 'inicio' ? '/' : hash
}

export function navigate(path, replace = false) {
  if (replace) {
    window.history.replaceState(null, '', `#${path}`)
    window.dispatchEvent(new Event('hashchange'))
  } else {
    window.location.hash = path
  }
}

export function useHashPath() {
  const [path, setPath] = useState(currentPath)
  useEffect(() => {
    const update = () => setPath(currentPath())
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  return path
}

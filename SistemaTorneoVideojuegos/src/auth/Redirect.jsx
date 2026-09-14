import { useEffect } from 'react'
import { navigate } from './navigation'

export default function Redirect({ to }) {
  useEffect(() => { navigate(to, true) }, [to])
  return null
}

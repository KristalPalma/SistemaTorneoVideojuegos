export function canEditScore(user) {
  return user?.role === 'Administrador'
}

export function validateScoreEdit(value, current) {
  const text = String(value ?? '').trim()
  if (!text) return 'Ingresa la nueva puntuación.'
  if (!/^\d+$/.test(text)) return 'Usa un número entero igual o mayor que cero.'
  const number = Number(text)
  if (!Number.isInteger(number) || number > 2147483647) return 'La puntuación máxima es 2147483647.'
  if (number === current) return 'La puntuación no cambió. Ingresa un valor diferente o cancela.'
  return ''
}

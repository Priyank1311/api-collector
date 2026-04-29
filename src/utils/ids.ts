export function makeId(prefix: string) {
  // `crypto.randomUUID` is supported in modern browsers; fallback keeps tests happy.
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}_${uuid}`
}


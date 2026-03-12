import chalk from 'chalk'

export function formatJson(input: string): string {
  try {
    return JSON.stringify(JSON.parse(input), null, 2)
  } catch {
    return input
  }
}

export function colorizeJson(json: string): string {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) return chalk.cyan(match)
        return chalk.green(match)
      }
      if (/true|false/.test(match)) return chalk.magenta(match)
      if (/null/.test(match)) return chalk.gray(match)
      return chalk.yellow(match)
    }
  )
}

export function statusColor(code: number): string {
  if (code >= 200 && code < 300) return 'green'
  if (code >= 300 && code < 400) return 'yellow'
  if (code >= 400 && code < 500) return 'red'
  if (code >= 500) return 'magenta'
  return 'white'
}

export function methodColor(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET': return 'green'
    case 'POST': return 'yellow'
    case 'PUT': return 'blue'
    case 'PATCH': return 'cyan'
    case 'DELETE': return 'red'
    default: return 'white'
  }
}

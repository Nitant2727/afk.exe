import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date)
}

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(dateObj)
}

export const getLanguageColor = (language: string): string => {
  const colors: Record<string, string> = {
    typescript: '#3178c6',
    javascript: '#f7df1e',
    python: '#3776ab',
    rust: '#ce422b',
    go: '#00add8',
    java: '#ed8b00',
    cpp: '#00599c',
    c: '#a8b9cc',
    html: '#e34f26',
    css: '#1572b6',
    scss: '#cf649a',
    vue: '#4fc08d',
    react: '#61dafb',
    svelte: '#ff3e00',
    php: '#777bb4',
    ruby: '#cc342d',
    swift: '#fa7343',
    kotlin: '#0095d5',
    dart: '#0175c2',
    shell: '#89e051',
    powershell: '#012456',
    sql: '#336791',
    json: '#000000',
    yaml: '#cb171e',
    xml: '#0060ac',
    markdown: '#083fa1',
  }
  
  return colors[language.toLowerCase()] || '#6b7280'
} 
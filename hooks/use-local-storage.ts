import { useState, useEffect } from "react"

const isLocalStorageAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined') return false
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    if (!isLocalStorageAvailable()) return

    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && Array.isArray(initialValue)) {
          if (parsed.length === initialValue.length) {
            setValue(parsed)
          }
        } else {
          setValue(parsed)
        }
      }
    } catch (e) {
      console.error(`Error loading ${key} from localStorage:`, e)
    }
  }, [key, initialValue])

  useEffect(() => {
    if (!isLocalStorageAvailable()) return

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (e) {
        console.error(`Error saving ${key} to localStorage:`, e)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [key, value])

  return [value, setValue] as const
}

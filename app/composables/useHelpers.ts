// Helper functions for state display and transformations

export function useHelpers() {
  /**
   * Returns a color indicator based on closed/locked state
   * Red = closed/locked (state=1), Green = open/unlocked (state=0)
   */
  const getStateIndicatorColor = (state: boolean | number | undefined) => {
    return state ? 'red' : 'green'
  }

  /**
   * Translates door open/closed state to German text
   */
  const getDoorStateText = (state: boolean | number | undefined) => {
    return state ? 'GESCHLOSSEN' : 'OFFEN'
  }

  /**
   * Translates door lock state to German text
   */
  const getDoorLockStateText = (state: boolean | number | undefined) => {
    return state ? 'VERRIEGELT' : 'ENTRIEGELT'
  }

  /**
   * Extracts hostname from FQDN (e.g., "server.local" -> "server")
   */
  const extractHostname = (fqdn: string) => {
    if (!fqdn) return ''
    const dotIndex = fqdn.indexOf('.')
    return dotIndex > -1 ? fqdn.slice(0, dotIndex) : fqdn
  }

  /**
   * Formats a date/time relative to now
   * Shows only time if within 22 hours, otherwise date + time
   */
  const formatRelativeDateTime = (dateValue: string | number | Date | undefined) => {
    if (!dateValue) return ''
    const now = new Date()
    const past = new Date(dateValue)

    const day = String(past.getDate()).padStart(2, '0')
    const month = String(past.getMonth() + 1).padStart(2, '0')
    const hours = String(past.getHours()).padStart(2, '0')
    const minutes = String(past.getMinutes()).padStart(2, '0')

    const dateString = `${day}.${month}.`
    const timeString = `${hours}:${minutes}`

    const hoursDifference = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60))

    return hoursDifference > 22 ? `${dateString} ${timeString}` : timeString
  }

  return {
    getStateIndicatorColor,
    getDoorStateText,
    getDoorLockStateText,
    extractHostname,
    formatRelativeDateTime,
  }
}

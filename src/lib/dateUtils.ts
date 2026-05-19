
/**
 * Formats a date into a 12-hour time string (e.g., "06:00 PM")
 */
export const formatTime12h = (date: Date | string | number): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Formats a date into a date and 12-hour time string (e.g., "May 18, 2026, 06:00 PM")
 */
export const formatDateTime12h = (date: Date | string | number): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Formats a HH:mm string into 12-hour format if it's potentially a 24h string
 */
export const formatTimeString12h = (timeStr: string): string => {
  if (!timeStr) return '';
  // Check if it's already in 12h format (contains AM/PM)
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
    return timeStr;
  }
  
  // Try to parse HH:mm
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0]);
    const minutes = parts[1].substring(0, 2);
    if (!isNaN(hours)) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    }
  }
  
  return timeStr;
};

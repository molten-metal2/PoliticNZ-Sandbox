/**
 * Date and time formatting utilities
 * Provides consistent date/time formatting across the application
 */

function ensureUtc(isoString) {
  if (!isoString) return isoString;
  // Add 'Z' suffix if not already present and no timezone info
  if (!isoString.endsWith('Z') && !isoString.includes('+') && !isoString.includes('T')) {
    return isoString;
  }
  if (!isoString.endsWith('Z') && isoString.includes('T') && !isoString.includes('+')) {
    return isoString + 'Z';
  }
  return isoString;
}

function formatPostTime(isoString) {
  if (!isoString) return '';
  
  try {
    const date = new Date(ensureUtc(isoString));
    return date.toLocaleDateString('en-NZ', {
      timeZone: 'Pacific/Auckland',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return '';
  }
}

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  
  try {
    const date = new Date(ensureUtc(isoString));
    return date.toLocaleDateString('en-NZ', {
      timeZone: 'Pacific/Auckland',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid date';
  }
}

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  
  try {
    const date = new Date(ensureUtc(isoString));
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      // For older dates, fall back to formatted date
      return formatPostTime(isoString);
    }
  } catch (error) {
    return '';
  }
}


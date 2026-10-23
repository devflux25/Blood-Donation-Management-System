/**
 * Extracts a readable error string from any API response, preventing
 * React crashes from rendering raw error objects or Pydantic validation lists.
 */
export function formatApiError(error: any, fallback: string = 'An unexpected error occurred.'): string {
  if (!error) return fallback;

  const detail = error.response?.data?.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  // Handle FastAPI / Pydantic validation errors: array of { loc, msg, type, ... }
  if (Array.isArray(detail)) {
    return detail
      .map((item: any) => {
        if (typeof item === 'string') return item;
        const field = Array.isArray(item.loc) ? item.loc.slice(1).join(' -> ') : '';
        const msg = item.msg || 'Invalid value';
        return field ? `${field}: ${msg}` : msg;
      })
      .join('; ');
  }

  if (detail && typeof detail === 'object') {
    return detail.message || JSON.stringify(detail);
  }

  if (error.response?.data?.message) {
    return String(error.response.data.message);
  }

  if (error.message) {
    return error.message;
  }

  return fallback;
}

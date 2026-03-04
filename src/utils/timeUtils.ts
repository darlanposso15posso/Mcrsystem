/**
 * Safely parses a date string, specifically handling the "one-day-back" problem 
 * by treating YYYY-MM-DD as local date instead of UTC if needed.
 */
export const ensureLocalDate = (dateInput?: string | Date | null): Date | null => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;

    // If it's a simple YYYY-MM-DD string, parse it manually to avoid UTC shift
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [year, month, day] = dateInput.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
};

/**
 * Formats a date as DD/MM/YYYY (Brazilian Standard).
 */
export const formatDate = (dateInput?: string | Date | null): string => {
    const d = ensureLocalDate(dateInput);
    if (!d) return "N/A";

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
};

/**
 * Formats a date as HH:MM (Local Time).
 */
export const formatTime = (dateInput?: string | Date | null): string => {
    const d = ensureLocalDate(dateInput);
    if (!d) return "--:--";

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
};

/**
 * Formats as DD/MM/YYYY HH:MM.
 */
export const formatDateTime = (dateInput?: string | Date | null): string => {
    const date = formatDate(dateInput);
    const time = formatTime(dateInput);
    if (date === "N/A") return "N/A";
    return `${date} ${time}`;
};

/**
 * Calculates the formatted duration between two ISO date strings.
 * Returns a human-readable string like "2h 15m" or "45m".
 * If dates are invalid or missing, returns "N/A".
 */
export const calculateDuration = (startStr?: string | null, endStr?: string | null): string => {
    if (!startStr || !endStr) return "N/A";

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "N/A";

    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return "N/A";

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0 && minutes === 0) return "< 1m";
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;

    return `${hours}h ${minutes}m`;
};

/**
 * Calculates the raw duration in hours (decimal) for profitability math.
 */
export const calculateDurationHours = (startStr?: string | null, endStr?: string | null): number => {
    if (!startStr || !endStr) return 0;

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return 0;

    return diffMs / (1000 * 60 * 60);
};

export const getApiErrorMessage = (error, fallback = 'Ocurrio un error inesperado') => {
    const data = error?.response?.data;

    if (typeof data === 'string' && data.trim()) {
        return data;
    }

    const candidates = [
        data?.error,
        data?.message,
        data?.details,
        error?.message,
    ];

    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
            return candidate;
        }
    }

    return fallback;
};

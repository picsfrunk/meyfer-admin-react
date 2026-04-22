import { api } from './api';

/**
 * scraperAPI
 * Funciones para consumir /admin/scraper y /admin/price-check desde el panel React.
 * Requiere token Bearer — el interceptor de api.js lo agrega automáticamente.
 */
export const scraperAPI = {

    // ── Cola y monitoreo ───────────────────────────────────────────────────

    /**
     * GET /admin/scraper/status
     * Retorna QueueSnapshot + recentHistory (últimos 5 jobs).
     */
    getStatus: () => api.get('/admin/scraper/status'),

    /**
     * GET /admin/scraper/stats
     * Retorna totales: total, running, completed, failed, enqueued, avgDurationMs, lastCompletedAt.
     */
    getStats: () => api.get('/admin/scraper/stats'),

    /**
     * GET /admin/scraper/history
     * Historial paginado con filtros opcionales.
     *
     * @param {Object} params
     * @param {number}     [params.page=1]
     * @param {number}     [params.limit=20]
     * @param {'enqueued'|'running'|'completed'|'failed'} [params.status]
     * @param {'sitemapScraper'|'categoryScraper'|'sitemapAnalysis'|'priceCheck'} [params.type]
     */
    getHistory: (params = {}) => api.get('/admin/scraper/history', { params }),

    /**
     * GET /admin/scraper/history/:jobId
     * Detalle de un job específico.
     */
    getJobDetail: (jobId) => api.get(`/admin/scraper/history/${jobId}`),

    // ── Disparadores ───────────────────────────────────────────────────────

    /**
     * POST /admin/scraper/trigger
     * Dispara un scraper. Responde con status 'accepted' o 'queued'.
     *
     * @param {'sitemapScraper'|'categoryScraper'} scraperType
     * @param {Object} [params] - ej: { categoryIds: [1, 2] } para categoryScraper
     */
    triggerScraper: (scraperType, params = {}) =>
        api.post('/admin/scraper/trigger', { scraperType, ...params }),

    /**
     * POST /admin/scraper/analyze
     * Dispara el análisis de sitemap (sin scraping).
     */
    triggerAnalysis: () => api.post('/admin/scraper/analyze', {}),

    // ── Cancelación ───────────────────────────────────────────────────────

    /**
     * DELETE /admin/scraper/jobs/:jobId
     * Cancela un job específico.
     * - Si está en cola: lo elimina inmediatamente (status: 'cancelled').
     * - Si está en ejecución: lo marca para cancelación graceful (status: 'cancelling').
     * - Si ya terminó: retorna 400.
     * - Si no existe: retorna 404.
     *
     * @param {string} jobId
     */
    cancelJob: (jobId) => api.delete(`/admin/scraper/jobs/${jobId}`),

    /**
     * DELETE /admin/scraper/jobs/all
     * Elimina todos los jobs pendientes (enqueued) de la cola.
     * No interrumpe el job en ejecución.
     */
    purgeQueue: () => api.delete('/admin/scraper/jobs/all'),

    // ── Price Check ────────────────────────────────────────────────────────

    /**
     * POST /config/price-check
     * Dispara una verificación de precios contra Odoo.
     * Puede retornar 503 si las variables de entorno no están configuradas.
     */
    triggerPriceCheck: () => api.post('/config/price-check', {}),

    /**
     * GET /admin/price-check/latest
     * Último resultado de verificación de precios.
     * 404 si nunca se ejecutó.
     */
    getPriceCheckLatest: () => api.get('/admin/price-check/latest'),

    /**
     * GET /admin/price-check/history
     * Historial paginado de verificaciones.
     *
     * @param {Object} params
     * @param {number}  [params.page=1]
     * @param {number}  [params.limit=20]
     * @param {boolean} [params.hasChanges] - true = solo corridas con cambios detectados
     */
    getPriceCheckHistory: (params = {}) => api.get('/admin/price-check/history', { params }),

    /**
     * GET /admin/price-check/history/:id
     * Detalle completo incluyendo changedDetail (tabla de precios cambiados).
     *
     * @param {string} id - _id de MongoDB del resultado
     */
    getPriceCheckDetail: (id) => api.get(`/admin/price-check/history/${id}`),
};

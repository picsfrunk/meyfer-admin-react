import { api } from './api';

export const priceListImportService = {
    getSettings: () => api.get('/admin/price-list-import/settings'),
    updateSettings: (sourceUrl) => api.put('/admin/price-list-import/settings', { sourceUrl }),
    runConfiguredUrl: () => api.post('/admin/price-list-import/import-from-url', {}),
    uploadFile: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/admin/price-list-import/upload', formData);
    },
};

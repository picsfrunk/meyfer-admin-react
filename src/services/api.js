import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Crear instancia de axios
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar token en requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
            if (typeof config.headers?.delete === 'function') {
                config.headers.delete('Content-Type');
            } else if (config.headers) {
                delete config.headers['Content-Type'];
                delete config.headers['content-type'];
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar responses
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export { api };

// Funciones de API específicas
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
};

export const configAPI = {
    getProfit: () => api.get('/config/profit'),
    updateProfit: (margin) => api.put('/config/profit', { margin }),
    getLastUpdate: () => api.get('/config/last-update'),
    getAdminEmails: () => api.get('/config/admin-emails'),
    addAdminEmail: (email, role = 'admin') => api.post('/config/admin-emails', { email, role }),
    deactivateAdminEmail: (email) => api.patch('/config/admin-emails/deactivate', { email }),
};

export const productsAPI = {
    getAll: (params = {}) => api.get('/products/scraped', { params }),
    getById: (id) => api.get(`/products/scraped/${id}`),
    create: (data) => api.post('/admin/products', data),
    update: (id, data) => api.put(`/admin/products/${id}`, data),
    delete: (id) => api.delete(`/admin/products/${id}`),
    updatePrice: (id, price) => api.put(`/admin/products/${id}`, { list_price: price }),
    getCategories: () => api.get('/categories'),
    getBrands: () => api.get('/products/brands'),
};

export const customersAPI = {
    getAll:         ()         => api.get('/admin/customers'),
    getById:        (id)       => api.get(`/admin/customers/${id}`),
    create:         (data)     => api.post('/admin/customers', data),
    update:         (id, data) => api.put(`/admin/customers/${id}`, data),
    delete:         (id)       => api.delete(`/admin/customers/${id}`),
    regenerateCode: (id)       => api.post(`/admin/customers/${id}/regenerate-code`),
};

export const ordersAPI = {
    getAll: (url = '/orders') => api.get(url),
    getStatuses: () => api.get('/orders/statuses'),
    getById: (id) => api.get(`/orders/${id}`),
    getLogs: (orderId) => api.get(`/orders/${orderId}/logs`),
    createLog: (orderId, data) => api.post(`/orders/${orderId}/logs`, data),
    updateLog: (orderId, logId, data) => api.patch(`/orders/${orderId}/logs/${logId}`, data),
    deleteLog: (orderId, logId) => api.delete(`/orders/${orderId}/logs/${logId}`),
    getByCustomer: (customerCode, status = null) => {
        const params = new URLSearchParams();
        params.append('customerCode', customerCode);
        if (status) params.append('status', status);
        return api.get(`/orders?${params.toString()}`);
    },
    update: (id, data) => api.put(`/orders/${id}`, data),
    updatePricing: (id, data) => api.patch(`/orders/${id}/pricing`, data),
    delete: (id) => api.delete(`/orders/${id}`),
    updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
    resendOrderEmail: (id, recipients = { admin: true, customer: true }) =>
        api.post(`/orders/${id}/resend-emails`, recipients),
    updateDelivery: (id, delivery) =>
        api.patch(`/orders/${id}/delivery`, { delivery }),
    refreshOrderValues: async (id) => {
        const attempts = [
            () => api.patch(`/orders/${id}/update-values`),
            () => api.post(`/orders/${id}/update-values`),
            () => api.patch(`/orders/${id}/refresh-values`),
            () => api.post(`/orders/${id}/refresh-values`),
        ];

        let lastError = new Error('No se pudo actualizar los valores del pedido');
        for (const request of attempts) {
            try {
                return await request();
            } catch (error) {
                lastError = error;
                const statusCode = error?.response?.status;
                if (statusCode !== 404 && statusCode !== 405) {
                    throw error;
                }
            }
        }

        throw lastError;
    },
};

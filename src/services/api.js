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
    getAll: () => api.get('/products/scraped'),
    getById: (id) => api.get(`/products/scraped/${id}`),
    create: (formData) => api.post('/admin/products', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    update: (id, formData) => api.put(`/admin/products/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    delete: (id) => api.delete(`/admin/products/${id}`),
    updatePrice: (id, price) => api.put(`/admin/products/${id}`, { list_price: price }, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    getCategories: () => api.get('/products/brands'),
};

export const ordersAPI = {
    getAll: (url = '/orders') => api.get(url),
    getById: (id) => api.get(`/orders/${id}`),
    update: (id, data) => api.put(`/orders/${id}`, data),
    delete: (id) => api.delete(`/orders/${id}`),
    updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
    resendOrderEmail: (id) => api.post(`/orders/${id}/resend-emails`),
};
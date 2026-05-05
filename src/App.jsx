import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Config from './pages/Config';
import Catalog from './pages/Catalog';
import Orders from './pages/Orders/Orders.jsx';
import Products from './pages/Products/Products.jsx';
import JobsPage from './pages/JobsPage.jsx';
import CustomersPage from './pages/CustomersPage';
import HelpPage from './pages/HelpPage';

// Configuración de tema para Ant Design
const theme = {
    token: {
        colorPrimary: '#1677ff',
        colorInfo: '#1677ff',
        borderRadius: 6,
    },
};

function App() {
    return (
        <ConfigProvider locale={esES} theme={theme}>
            <AuthProvider>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Routes>
                        {/* Ruta de login */}
                        <Route path="/login" element={<Login />} />

                        {/* Rutas protegidas */}
                        <Route
                            path="/config"
                            element={
                                <ProtectedRoute>
                                    <DashboardLayout>
                                        <Config />
                                    </DashboardLayout>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/catalog"
                            element={
                                <ProtectedRoute>
                                    <DashboardLayout>
                                        <Catalog />
                                    </DashboardLayout>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/orders"
                            element={
                                <ProtectedRoute>
                                    <DashboardLayout>
                                        <Orders />
                                    </DashboardLayout>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/products"
                            element={
                                <ProtectedRoute>
                                    <DashboardLayout>
                                        <Products />
                                    </DashboardLayout>
                                </ProtectedRoute>
                            }
                        />

                        {/* ── Monitor de Procesos ── */}
                        <Route
                            path="/procesos"
                            element={
                                <ProtectedRoute>
                                    <DashboardLayout>
                                        <JobsPage />
                                    </DashboardLayout>
                                </ProtectedRoute>
                            }
                        />

                        {/* ── Clientes ── */}
                        <Route
                            path="/customers"
                            element={
                                <ProtectedRoute>
                                    <DashboardLayout>
                                        <CustomersPage />
                                    </DashboardLayout>
                                </ProtectedRoute>
                            }
                        />

                        {/* ── Ayuda ── */}
                        <Route
                            path="/help"
                            element={
                                <ProtectedRoute>
                                    <DashboardLayout>
                                        <HelpPage />
                                    </DashboardLayout>
                                </ProtectedRoute>
                            }
                        />

                        {/* Redirección legacy: /scraper → /procesos */}
                        <Route path="/scraper" element={<Navigate to="/procesos" replace />} />

                        {/* Redirección por defecto */}
                        <Route path="*" element={<Navigate to="/orders" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ConfigProvider>
    );
}

export default App;

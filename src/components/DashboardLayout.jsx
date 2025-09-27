import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Typography } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SettingOutlined,
    ShoppingCartOutlined,
    FileTextOutlined,
    LogoutOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const DashboardLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            key: '/orders',
            icon: <FileTextOutlined />,
            label: 'Pedidos',
            onClick: () => navigate('/orders'),
        },
        {
            key: '/catalog',
            icon: <ShoppingCartOutlined />,
            label: 'Catálogo',
            onClick: () => navigate('/catalog'),
        },
        {
            key: '/config',
            icon: <SettingOutlined />,
            label: 'Configuración',
            onClick: () => navigate('/config'),
        },

    ];

    const userMenuItems = [
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Cerrar Sesión',
            onClick: () => {
                logout();
                navigate('/login');
            },
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
                <div style={{
                    height: 32,
                    margin: 16,
                    background: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                }}>
                    {!collapsed ? 'MeyFer Panel' : 'MF'}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                />
            </Sider>

            <Layout>
                <Header style={{
                    padding: '0 16px',
                    background: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                        }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Text>Bienvenido, {user?.username}</Text>
                        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                            <Avatar
                                icon={<UserOutlined />}
                                style={{ cursor: 'pointer', backgroundColor: '#1677ff' }}
                            />
                        </Dropdown>
                    </div>
                </Header>

                <Content style={{
                    margin: '24px 16px',
                    padding: 24,
                    minHeight: 280,
                    background: '#fff',
                    borderRadius: 8
                }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};

export default DashboardLayout;
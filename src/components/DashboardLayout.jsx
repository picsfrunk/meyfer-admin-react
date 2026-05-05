import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Typography, Drawer } from 'antd';
import {
    MenuOutlined,
    SettingOutlined,
    ShoppingCartOutlined,
    FileTextOutlined,
    LogoutOutlined,
    UserOutlined,
    RobotOutlined,
    AppstoreOutlined,
    TeamOutlined,
    QuestionCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const DashboardLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Detectar si es móvil
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const menuItems = [
        {
            key: '/orders',
            icon: <FileTextOutlined />,
            label: 'Pedidos',
            onClick: () => {
                navigate('/orders');
                if (isMobile) setDrawerVisible(false);
            },
        },
        {
            key: '/customers',
            icon: <TeamOutlined />,
            label: 'Clientes',
            onClick: () => {
                navigate('/customers');
                if (isMobile) setDrawerVisible(false);
            },
        },
        {
            key: '/products',
            icon: <AppstoreOutlined />,
            label: 'Productos',
            onClick: () => {
                navigate('/products');
                if (isMobile) setDrawerVisible(false);
            },
        },
        {
            key: '/catalog',
            icon: <ShoppingCartOutlined />,
            label: 'Catálogo',
            onClick: () => {
                navigate('/catalog');
                if (isMobile) setDrawerVisible(false);
            },
        },
        {
            key: '/config',
            icon: <SettingOutlined />,
            label: 'Configuración',
            onClick: () => {
                navigate('/config');
                if (isMobile) setDrawerVisible(false);
            },
        },
        {
            key: '/procesos',
            icon: <RobotOutlined />,
            label: 'Procesos',
            onClick: () => {
                navigate('/procesos');
                if (isMobile) setDrawerVisible(false);
            },
        },
        {
            key: '/help',
            icon: <QuestionCircleOutlined />,
            label: 'Ayuda',
            onClick: () => {
                navigate('/help');
                if (isMobile) setDrawerVisible(false);
            },
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

    // Menú para móvil (dentro del Drawer)
    const MobileMenu = () => (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                padding: '20px',
                background: '#001529',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '18px',
                textAlign: 'center'
            }}>
                MeyFer Panel
            </div>
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[location.pathname]}
                items={menuItems}
                style={{ flex: 1, borderRight: 0 }}
            />
        </div>
    );

    return (
        <Layout style={{ height: '100vh' }}>
            {/* Sidebar para desktop */}
            {!isMobile && (
                <Sider
                    trigger={null}
                    collapsible
                    collapsed={collapsed}
                    theme="dark"
                    style={{ overflow: 'auto', height: '100vh', position: 'sticky', top: 0, left: 0 }}
                >
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
            )}

            {/* Drawer para móvil */}
            <Drawer
                placement="left"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={250}
                styles={{ body: { padding: 0, background: '#001529' } }}
                closeIcon={null}
            >
                <MobileMenu />
            </Drawer>

            <Layout style={{ overflow: 'auto' }}>
                <Header style={{
                    padding: '0 16px',
                    background: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #f0f0f0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                }}>
                    <Button
                        type="text"
                        icon={<MenuOutlined />}
                        onClick={() => isMobile ? setDrawerVisible(true) : setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                        }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Text style={{ display: isMobile ? 'none' : 'block' }}>
                            Bienvenido, {user?.username}
                        </Text>
                        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                            <Avatar
                                icon={<UserOutlined />}
                                style={{ cursor: 'pointer', backgroundColor: '#1677ff' }}
                            />
                        </Dropdown>
                    </div>
                </Header>

                <Content style={{
                    margin: isMobile ? '16px 8px' : '24px 16px',
                    padding: isMobile ? 16 : 24,
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

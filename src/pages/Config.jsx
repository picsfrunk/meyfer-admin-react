import React, { useState, useEffect } from 'react';
import {
    Card,
    Form,
    InputNumber,
    Button,
    Typography,
    Statistic,
    Row,
    Col,
    Divider,
    message,
    Input,
    Select,
    List,
    Tag,
    Popconfirm,
    Space,
    Alert
} from 'antd';
import {
    SaveOutlined,
    PlusOutlined,
    DeleteOutlined,
    MailOutlined,
    UserOutlined
} from '@ant-design/icons';
import { configAPI } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const Config = () => {
    const [form] = Form.useForm();
    const [emailForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [emailsLoading, setEmailsLoading] = useState(false);
    const [margin, setMargin] = useState(null);
    const [adminEmails, setAdminEmails] = useState([]);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const profitRes = await configAPI.getProfit();
            const marginValue = profitRes.data.margin;
            setMargin(marginValue);
            form.setFieldsValue({ margin: marginValue });
        } catch (error) {
            message.error('Error al cargar la configuración');
            console.error('Error loading config:', error);
        }
        setLoading(false);
    };

    const loadAdminEmails = async () => {
        setEmailsLoading(true);
        try {
            const response = await configAPI.getAdminEmails();
            setAdminEmails(response.data.emails || []);
        } catch (error) {
            message.error('Error al cargar los emails de administradores');
            console.error('Error loading admin emails:', error);
        }
        setEmailsLoading(false);
    };

    const handleUpdateMargin = async (values) => {
        setLoading(true);
        try {
            await configAPI.updateProfit(values.margin);
            setMargin(values.margin);
            message.success('Margen de ganancia actualizado correctamente');
        } catch (error) {
            message.error('Error al actualizar el margen de ganancia');
            console.error('Error updating margin:', error);
        }
        setLoading(false);
    };

    const handleAddEmail = async (values) => {
        try {
            await configAPI.addAdminEmail(values.email, values.role);
            message.success('Email agregado correctamente');
            emailForm.resetFields();
            await loadAdminEmails();
        } catch (error) {
            message.error('Error al agregar el email');
            console.error('Error adding email:', error);
        }
    };

    const handleDeactivateEmail = async (email) => {
        try {
            await configAPI.deactivateAdminEmail(email);
            message.success('Email desactivado correctamente');
            await loadAdminEmails();
        } catch (error) {
            message.error('Error al desactivar el email');
            console.error('Error deactivating email:', error);
        }
    };

    useEffect(() => {
        loadConfig();
        loadAdminEmails();
    }, []);

    return (
        <div>
            <Title level={2}>Configuración del Sistema</Title>

            <Row gutter={[16, 16]}>
                {/* Card de margen de ganancia */}
                <Col span={24} lg={12}>
                    <Card title="Margen de Ganancia" loading={loading}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleUpdateMargin}
                        >
                            <Form.Item
                                label="Margen de ganancia (%)"
                                name="margin"
                                rules={[
                                    { required: true, message: 'El margen es requerido' },
                                    { type: 'number', min: 0, max: 1000, message: 'El margen debe estar entre 0% y 1000%' }
                                ]}
                                help="Porcentaje de ganancia aplicado al precio base (ej: 27 = 27% de ganancia)"
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    step={0.1}
                                    precision={1}
                                    addonAfter="%"
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    icon={<SaveOutlined />}
                                    block
                                >
                                    Actualizar Margen
                                </Button>
                            </Form.Item>
                        </Form>

                        {margin !== null && (
                            <>
                                <Divider />
                                <Statistic
                                    title="Margen Actual"
                                    value={margin}
                                    precision={1}
                                    suffix="%"
                                />
                                <Text type="secondary">
                                    Multiplicador: {(1 + margin / 100).toFixed(2)}x
                                </Text>
                            </>
                        )}
                    </Card>
                </Col>

                {/* Card de emails de administradores */}
                <Col span={24} lg={12}>
                    <Card
                        title={
                            <Space>
                                <MailOutlined />
                                Emails de Recepción de Pedidos
                            </Space>
                        }
                        loading={emailsLoading}
                        extra={
                            <Button
                                type="link"
                                onClick={loadAdminEmails}
                                loading={emailsLoading}
                                size="small"
                            >
                                Actualizar
                            </Button>
                        }
                    >
                        <Alert
                            message="Configuración de Notificaciones"
                            description="Estos emails reciben notificaciones cuando se registran nuevos pedidos en la tienda."
                            type="info"
                            showIcon
                            size="small"
                            style={{ marginBottom: 16 }}
                        />

                        {/* Formulario para agregar email */}
                        <Form
                            form={emailForm}
                            layout="inline"
                            onFinish={handleAddEmail}
                            style={{ marginBottom: 16 }}
                        >
                            <Form.Item
                                name="email"
                                rules={[
                                    { required: true, message: 'Email requerido' },
                                    { type: 'email', message: 'Email inválido' }
                                ]}
                                style={{ flex: 1 }}
                            >
                                <Input
                                    placeholder="nuevo@ejemplo.com"
                                    prefix={<MailOutlined />}
                                />
                            </Form.Item>

                            <Form.Item
                                name="role"
                                initialValue="admin"
                                rules={[{ required: true, message: 'Rol requerido' }]}
                            >
                                <Select style={{ width: 100 }}>
                                    <Option value="admin">Admin</Option>
                                    <Option value="seller">Vendedor</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<PlusOutlined />}
                                >
                                    Agregar
                                </Button>
                            </Form.Item>
                        </Form>

                        <Divider style={{ margin: '16px 0' }} />

                        {/* Lista de emails actuales */}
                        <div>
                            <Text strong style={{ marginBottom: 8, display: 'block' }}>
                                Emails Activos ({adminEmails.length})
                            </Text>

                            {adminEmails.length === 0 ? (
                                <Text type="secondary">
                                    No hay emails configurados. Agrega al menos uno para recibir notificaciones de pedidos.
                                </Text>
                            ) : (
                                <List
                                    size="small"
                                    dataSource={adminEmails}
                                    renderItem={(email, index) => (
                                        <List.Item
                                            key={index}
                                            actions={[
                                                <Popconfirm
                                                    title="¿Desactivar este email?"
                                                    description="Ya no recibirá notificaciones de pedidos"
                                                    onConfirm={() => handleDeactivateEmail(email)}
                                                    okText="Sí"
                                                    cancelText="No"
                                                >
                                                    <Button
                                                        type="link"
                                                        danger
                                                        size="small"
                                                        icon={<DeleteOutlined />}
                                                    >
                                                        Desactivar
                                                    </Button>
                                                </Popconfirm>
                                            ]}
                                        >
                                            <Space>
                                                <UserOutlined />
                                                <Text>{email}</Text>
                                                <Tag color="green" size="small">Activo</Tag>
                                            </Space>
                                        </List.Item>
                                    )}
                                />
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Config;
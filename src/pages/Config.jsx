import React, { useState, useEffect } from 'react';
import {
    Card,
    Form,
    InputNumber,
    Button,
    Space,
    Alert,
    Typography,
    Statistic,
    Row,
    Col,
    Divider,
    message
} from 'antd';
import { SaveOutlined, ReloadOutlined, PercentageOutlined, CalendarOutlined } from '@ant-design/icons';
import { configAPI, productsAPI } from '../services/api';

const { Title, Text } = Typography;

const Config = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [margin, setMargin] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const [profitRes, updateRes] = await Promise.all([
                configAPI.getProfit(),
                configAPI.getLastUpdate()
            ]);

            const marginValue = profitRes.data.margin;
            setMargin(marginValue);
            form.setFieldsValue({ margin: marginValue });

            setLastUpdate(updateRes.data.lastUpdate);
        } catch (error) {
            message.error('Error al cargar la configuración');
            console.error('Error loading config:', error);
        }
        setLoading(false);
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

    const handleUpdateCatalog = async () => {
        setUpdateLoading(true);
        try {
            const response = await productsAPI.updateParsed();
            message.success(`Catálogo actualizado: ${response.data.updatedCount} productos`);
            await loadConfig(); // Recargar para obtener la nueva fecha
        } catch (error) {
            message.error('Error al actualizar el catálogo');
            console.error('Error updating catalog:', error);
        }
        setUpdateLoading(false);
    };

    useEffect(() => {
        loadConfig();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('es-AR');
    };

    return (
        <div>
            <Title level={2}>Configuración del Sistema</Title>

            <Row gutter={[16, 16]}>
                <Col span={24} md={12}>
                    <Card title="Margen de Ganancia" loading={loading}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleUpdateMargin}
                        >
                            <Form.Item
                                label="Margen de ganancia"
                                name="margin"
                                rules={[
                                    { required: true, message: 'El margen es requerido' },
                                    { type: 'number', min: 1, message: 'El margen debe ser mayor a 1' }
                                ]}
                                help="Multiplicador aplicado a los precios base (ej: 1.27 = 27% de ganancia)"
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    step={0.01}
                                    precision={2}
                                    addonAfter={<PercentageOutlined />}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    icon={<SaveOutlined />}
                                >
                                    Actualizar Margen
                                </Button>
                            </Form.Item>
                        </Form>

                        {margin && (
                            <>
                                <Divider />
                                <Statistic
                                    title="Margen Actual"
                                    value={margin}
                                    precision={2}
                                    suffix="x"
                                />
                                <Text type="secondary">
                                    Ganancia: {((margin - 1) * 100).toFixed(1)}%
                                </Text>
                            </>
                        )}
                    </Card>
                </Col>

                <Col span={24} md={12}>
                    <Card title="Gestión de Catálogo">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div>
                                <CalendarOutlined style={{ marginRight: 8 }} />
                                <Text strong>Última actualización:</Text>
                            </div>
                            <Text>{formatDate(lastUpdate)}</Text>

                            <Divider />

                            <Button
                                type="primary"
                                icon={<ReloadOutlined />}
                                loading={updateLoading}
                                onClick={handleUpdateCatalog}
                                size="large"
                            >
                                Actualizar Catálogo
                            </Button>

                            <Alert
                                message="Actualización Manual"
                                description="Esta acción descarga y procesa el archivo XLS remoto para actualizar el catálogo de productos."
                                type="info"
                                showIcon
                            />
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Config;
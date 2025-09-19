import React, { useState, useEffect } from 'react';
import {
    Card,
    Button,
    Form,
    Select,
    InputNumber,
    Space,
    Typography,
    Alert,
    message,
    Divider,
    Statistic,
    Row,
    Col
} from 'antd';
import {
    PlayCircleOutlined,
    ShoppingOutlined,
    ReloadOutlined,
    CalendarOutlined,
    FileExcelOutlined
} from '@ant-design/icons';
import { productsAPI, configAPI } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const Catalog = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);

    const loadLastUpdate = async () => {
        try {
            const response = await configAPI.getLastUpdate();
            setLastUpdate(response.data.lastUpdate);
        } catch (error) {
            console.error('Error loading last update:', error);
        }
    };

    const handleScrape = async (values) => {
        setLoading(true);
        try {
            const response = await productsAPI.scrape(values);
            message.success(`Scraper iniciado - Job ID: ${response.data.result.jobId}`);
            form.resetFields();
        } catch (error) {
            message.error('Error al iniciar el scraper');
            console.error('Error starting scraper:', error);
        }
        setLoading(false);
    };

    const handleUpdateCatalog = async () => {
        setUpdateLoading(true);
        try {
            const response = await productsAPI.updateParsed();
            message.success(`Catálogo actualizado: ${response.data.updatedCount} productos`);
            await loadLastUpdate(); // Recargar para obtener la nueva fecha
        } catch (error) {
            message.error('Error al actualizar el catálogo');
            console.error('Error updating catalog:', error);
        }
        setUpdateLoading(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('es-AR');
    };

    useEffect(() => {
        loadLastUpdate();
    }, []);

    return (
        <div>
            <Title level={2}>Gestión de Catálogo</Title>

            <Row gutter={[16, 16]}>
                <Col span={24} lg={12}>
                    <Card
                        title={
                            <Space>
                                <FileExcelOutlined />
                                Actualización de Catálogo Excel
                            </Space>
                        }
                        style={{ height: '100%' }}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Alert
                                message="Actualización desde Excel"
                                description="Descarga y procesa el archivo XLS remoto para actualizar el catálogo de productos con precios y disponibilidad."
                                type="info"
                                showIcon
                                style={{ marginBottom: 16 }}
                            />

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
                                block
                            >
                                Actualizar desde Excel
                            </Button>
                        </Space>
                    </Card>
                </Col>

                <Col span={24} lg={12}>
                    <Card
                        title={
                            <Space>
                                <PlayCircleOutlined />
                                Control de Scraper
                            </Space>
                        }
                        style={{ height: '100%' }}
                    >
                        <Alert
                            message="Scraper de Productos"
                            description="Ejecuta el scraper para obtener productos y categorías desde fuentes externas. El proceso puede tomar varios minutos."
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleScrape}
                            initialValues={{
                                scraperType: 'categoryScraper',
                                rubros: 8
                            }}
                        >
                            <Form.Item
                                label="Tipo de Scraper"
                                name="scraperType"
                                rules={[{ required: true, message: 'Seleccione el tipo de scraper' }]}
                            >
                                <Select placeholder="Seleccione el tipo de scraper">
                                    <Option value="categoryScraper">Scraper de Categorías</Option>
                                    <Option value="productScraper">Scraper de Productos</Option>
                                    <Option value="fullScraper">Scraper Completo</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label="ID de Categoría"
                                name="rubros"
                                rules={[{ required: true, message: 'Ingrese el ID de la categoría' }]}
                                help="ID numérico de la categoría a procesar"
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={1}
                                    placeholder="Ej: 8"
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    icon={<PlayCircleOutlined />}
                                    size="large"
                                    block
                                >
                                    Ejecutar Scraper
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>

            <Card title="Información del Catálogo">
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                        <ShoppingOutlined style={{ marginRight: 8, fontSize: 16 }} />
                        <Text strong>Estado del Catálogo</Text>
                    </div>

                    <Text type="secondary">
                        Aquí se mostrará información sobre el estado actual del catálogo,
                        número de productos, categorías disponibles, etc.
                    </Text>

                    <Divider />

                    <Alert
                        message="Funcionalidad en Desarrollo"
                        description="Las estadísticas detalladas del catálogo y la visualización de productos estarán disponibles en próximas versiones."
                        type="warning"
                        showIcon
                    />
                </Space>
            </Card>
        </div>
    );
};

export default Catalog;
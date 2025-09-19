import React, { useState } from 'react';
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
    Divider
} from 'antd';
import { PlayCircleOutlined, ShoppingOutlined } from '@ant-design/icons';
import { productsAPI } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const Catalog = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

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

    return (
        <div>
            <Title level={2}>Gestión de Catálogo</Title>

            <Card title="Control de Scraper" style={{ marginBottom: 24 }}>
                <Alert
                    message="Scraper de Productos"
                    description="Ejecuta el scraper para obtener productos y categorías desde fuentes externas. El proceso puede tomar varios minutos dependiendo de la cantidad de datos."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
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
                        >
                            Ejecutar Scraper
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

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
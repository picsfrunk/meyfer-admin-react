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
    Col,
    Checkbox,
    Tag,
    Spin
} from 'antd';
import {
    PlayCircleOutlined,
    ShoppingOutlined,
    ReloadOutlined,
    CalendarOutlined,
    FileExcelOutlined,
    AppstoreOutlined
} from '@ant-design/icons';
import { productsAPI, configAPI } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const Catalog = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [categories, setCategories] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    const loadLastUpdate = async () => {
        try {
            const response = await configAPI.getLastUpdate();
            setLastUpdate(response.data.lastUpdate);
        } catch (error) {
            console.error('Error loading last update:', error);
        }
    };

    const loadCategories = async () => {
        setCategoriesLoading(true);
        try {
            const response = await productsAPI.getCategories();
            setCategories(Array.isArray(response.data.categories) ? response.data.categories : []);
            setTotalProducts(response.data.totalProducts);
        } catch (error) {
            message.error('Error al cargar las categorías');
            console.error('Error loading categories:', error);
        }
        setCategoriesLoading(false);
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
            await Promise.all([loadLastUpdate(), loadCategories()]); // Recargar ambos
        } catch (error) {
            message.error('Error al actualizar el catálogo');
            console.error('Error updating catalog:', error);
        }
        setUpdateLoading(false);
    };

    const handleCategoryChange = (categoryIds) => {
        setSelectedCategories(categoryIds);
        setSelectAll(categoryIds.length === categories.length);
    };

    const handleSelectAll = (e) => {
        const checked = e.target.checked;
        setSelectAll(checked);
        if (checked) {
            setSelectedCategories(categories.map(cat => cat.category_id));
        } else {
            setSelectedCategories([]);
        }
    };

    const handleScrapeBatch = async () => {
        if (selectedCategories.length === 0) {
            message.warning('Debe seleccionar al menos una categoría');
            return;
        }

        setLoading(true);
        try {
            // Si están todas seleccionadas, ejecutar scraper completo
            if (selectAll || selectedCategories.length === categories.length) {
                const response = await productsAPI.scrape({
                    scraperType: 'categoryScraper'
                });
                message.success(`Scraper completo iniciado - Job ID: ${response.data.result.jobId}`);
            } else {
                // Ejecutar scraper por categorías seleccionadas
                const promises = selectedCategories.map(categoryId =>
                    productsAPI.scrape({
                        scraperType: 'categoryScraper',
                        categoryId: categoryId
                    })
                );

                const responses = await Promise.all(promises);
                message.success(`Iniciados ${responses.length} scrapers para categorías seleccionadas`);
            }

            setSelectedCategories([]);
            setSelectAll(false);
        } catch (error) {
            message.error('Error al iniciar el scraper por lotes');
            console.error('Error starting batch scraper:', error);
        }
        setLoading(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('es-AR');
    };

    useEffect(() => {
        loadLastUpdate();
        loadCategories();
    }, []);

    const selectedCategoriesData = categories.filter(cat =>
        selectedCategories.includes(cat.category_id)
    );

    const totalSelectedProducts = selectedCategoriesData.reduce(
        (sum, cat) => sum + cat.product_count, 0
    );

    return (
        <div>
            <Title level={2}>Gestión de Catálogo</Title>

            {/* Card de estadísticas horizontal - Principal */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col span={24}>
                    <Card
                        title={
                            <Space>
                                <AppstoreOutlined />
                                Estadísticas del Catálogo
                            </Space>
                        }
                        loading={categoriesLoading}
                        extra={
                            <Button
                                type="link"
                                onClick={loadCategories}
                                loading={categoriesLoading}
                                icon={<ReloadOutlined />}
                            >
                                Actualizar estadísticas
                            </Button>
                        }
                    >
                        <Row gutter={[24, 16]} align="middle">
                            <Col xs={24} sm={8}>
                                <Statistic
                                    title="Total de Productos"
                                    value={totalProducts}
                                    prefix={<ShoppingOutlined />}
                                />
                            </Col>

                            <Col xs={24} sm={8}>
                                <Statistic
                                    title="Categorías Disponibles"
                                    value={categories.length}
                                    prefix={<AppstoreOutlined />}
                                />
                            </Col>

                            <Col xs={24} sm={8}>
                                {selectedCategories.length > 0 ? (
                                    <Statistic
                                        title="Productos Seleccionados"
                                        value={totalSelectedProducts}
                                        valueStyle={{ color: '#1890ff' }}
                                        prefix={<PlayCircleOutlined />}
                                    />
                                ) : (
                                    <Statistic
                                        title="Última Actualización"
                                        value={formatDate(lastUpdate)}
                                        valueStyle={{ fontSize: '14px' }}
                                        prefix={<CalendarOutlined />}
                                    />
                                )}
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            {/* Card de selección por categorías - Scraper */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col span={24}>
                    <Card
                        title={
                            <Space>
                                <AppstoreOutlined />
                                Scraper por Categorías
                            </Space>
                        }
                        extra={
                            <Space>
                                <Text type="secondary">
                                    {selectedCategories.length} de {categories.length} seleccionadas
                                </Text>
                                <Button
                                    type="primary"
                                    disabled={selectedCategories.length === 0}
                                    loading={loading}
                                    onClick={handleScrapeBatch}
                                    icon={<PlayCircleOutlined />}
                                >
                                    Ejecutar Seleccionadas ({totalSelectedProducts} productos)
                                </Button>
                            </Space>
                        }
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Alert
                                message="Scraper por Lotes"
                                description="Selecciona las categorías que deseas actualizar. Usar 'Seleccionar Todo' ejecutará un scraper completo más eficiente."
                                type="info"
                                showIcon
                            />

                            <Checkbox
                                checked={selectAll}
                                onChange={handleSelectAll}
                                disabled={categoriesLoading}
                            >
                                <Text strong>Seleccionar Todo ({totalProducts} productos)</Text>
                            </Checkbox>

                            <Divider style={{ margin: '12px 0' }} />

                            {categoriesLoading ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <Spin tip="Cargando categorías..." />
                                </div>
                            ) : (
                                <Checkbox.Group
                                    value={selectedCategories}
                                    onChange={handleCategoryChange}
                                    style={{ width: '100%' }}
                                    disabled={selectAll}
                                >
                                    <Row gutter={[8, 8]}>
                                        {categories.map((category) => (
                                            <Col span={24} sm={12} md={8} lg={6} key={category.category_id}>
                                                <Checkbox
                                                    value={category.category_id}
                                                    style={{ width: '100%' }}
                                                >
                                                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                                                        <Text strong>{category.category_name}</Text>
                                                        <Tag color="blue">{category.product_count} productos</Tag>
                                                    </Space>
                                                </Checkbox>
                                            </Col>
                                        ))}
                                    </Row>
                                </Checkbox.Group>
                            )}
                        </Space>
                    </Card>
                </Col>
            </Row>

            {/* Cards inferiores - Excel y Scraper Manual */}
            <Row gutter={[16, 16]}>
                {/* Card de actualización Excel */}
                <Col span={24} lg={12}>
                    <Card
                        title={
                            <Space>
                                <FileExcelOutlined />
                                Actualización desde Excel
                            </Space>
                        }
                        style={{ height: '100%' }}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Alert
                                message="Actualización de Catálogo"
                                description="Descarga y procesa el archivo XLS remoto para actualizar precios y disponibilidad de productos."
                                type="success"
                                showIcon
                                size="small"
                            />

                            <div style={{ textAlign: 'center' }}>
                                <div style={{ marginBottom: 8 }}>
                                    <CalendarOutlined style={{ marginRight: 8 }} />
                                    <Text strong>Última actualización:</Text>
                                </div>
                                <Text type="secondary">{formatDate(lastUpdate)}</Text>
                            </div>

                            <Divider style={{ margin: '16px 0' }} />

                            <Button
                                type="primary"
                                icon={<ReloadOutlined />}
                                loading={updateLoading}
                                onClick={handleUpdateCatalog}
                                size="large"
                                block
                            >
                                Actualizar Catálogo desde Excel
                            </Button>
                        </Space>
                    </Card>
                </Col>

                {/* Card de scraper manual */}
                <Col span={24} lg={12}>
                    <Card
                        title={
                            <Space>
                                <PlayCircleOutlined />
                                Scraper Manual
                            </Space>
                        }
                        style={{ height: '100%' }}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Alert
                                message="Scraper Individual"
                                description="Ejecuta scraper para una categoría específica o tipo particular de contenido."
                                type="warning"
                                showIcon
                                size="small"
                            />

                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleScrape}
                                initialValues={{
                                    scraperType: 'categoryScraper',
                                    categoryId: 8
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
                                    name="categoryId"
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
                                        block
                                    >
                                        Ejecutar Scraper
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Catalog;

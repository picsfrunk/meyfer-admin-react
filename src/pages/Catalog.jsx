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
    Spin,
    Collapse,
    Modal,
} from 'antd';
import {
    PlayCircleOutlined,
    ShoppingOutlined,
    ReloadOutlined,
    CalendarOutlined,
    FileExcelOutlined,
    AppstoreOutlined,
    ExclamationCircleOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { productsAPI, configAPI } from '../services/api';
import { scraperAPI } from '../services/scraperAPI';
import { getApiErrorMessage } from '../utils/apiError';
import HelpPanel from '../components/common/HelpPanel';
import useAdminDevMode from '../hooks/useAdminDevMode';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

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
    const [isMobile, setIsMobile] = useState(false);
    const { devMode } = useAdminDevMode();

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const loadLastUpdate = async () => {
        try {
            const response = await configAPI.getLastUpdate();
            if (response?.data?.lastUpdate === undefined) {
                setLastUpdate(null);
                message.error('Formato inválido al cargar la fecha de actualización');
                return;
            }
            setLastUpdate(response.data.lastUpdate);
        } catch (error) {
            console.error('Error loading last update:', error);
            message.error(getApiErrorMessage(error, 'Error al cargar la fecha de actualización'));
        }
    };

    const loadCategories = async () => {
        setCategoriesLoading(true);
        try {
            const response = await productsAPI.getCategories();
            const categoriesData = response?.data?.categories;
            const totalProductsData = response?.data?.totalProducts;

            if (!Array.isArray(categoriesData) || typeof totalProductsData !== 'number') {
                setCategories([]);
                setTotalProducts(0);
                message.error('Formato inválido al cargar categorías');
                return;
            }

            setCategories(categoriesData);
            setTotalProducts(totalProductsData);
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al cargar las categorías'));
            setCategories([]);
            setTotalProducts(0);
        }
        setCategoriesLoading(false);
    };

    useEffect(() => {
        loadLastUpdate();
        loadCategories();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('es-AR');
    };

    const handleScrapeComplete = () => {
        Modal.confirm({
            title: '¿Ejecutar sincronización completa?',
            icon: <ExclamationCircleOutlined />,
            content: (
                <Space direction="vertical" size={4}>
                    <Text>Esto va a actualizar <Text strong>todo el catálogo</Text> ({totalProducts} productos).</Text>
                    <Text type="secondary">La operación puede demorar varios minutos.</Text>
                </Space>
            ),
            okText: 'Sí, ejecutar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: async () => {
                setLoading(true);
                try {
                    const response = await scraperAPI.triggerScraper('categoryScraper', {});
                    const queued = response.data.status === 'queued';
                    message.success(
                        queued
                            ? `Actualización completa agregada a pendientes. Posición ${response.data.position}`
                            : 'Sincronización completa iniciada'
                    );
                } catch (error) {
                    message.error(getApiErrorMessage(error, 'Error al iniciar la sincronización completa'));
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    const handleCategoryChange = (categoryIds) => {
        setSelectedCategories(categoryIds);
        setSelectAll(categoryIds.length === categories.length);
    };

    const handleSelectAll = (e) => {
        const checked = e.target.checked;
        setSelectAll(checked);
        setSelectedCategories(checked ? categories.map(c => c.category_id) : []);
    };

    const handleScrapeBatch = () => {
        if (selectedCategories.length === 0) {
            message.warning('Seleccioná al menos una categoría');
            return;
        }

        const isAll = selectAll || selectedCategories.length === categories.length;
        const selectedCategoriesData = categories.filter(c => selectedCategories.includes(c.category_id));
        const totalSelected = selectedCategoriesData.reduce((sum, c) => sum + c.product_count, 0);

        Modal.confirm({
            title: isAll ? '¿Ejecutar sincronización completa?' : `¿Sincronizar ${selectedCategories.length} categorías?`,
            icon: <ExclamationCircleOutlined />,
            content: isAll ? (
                <Space direction="vertical" size={4}>
                    <Text>Se van a actualizar <Text strong>todas las categorías</Text> ({totalProducts} productos).</Text>
                    <Text type="secondary">La operación puede demorar varios minutos.</Text>
                </Space>
            ) : (
                <Space direction="vertical" size={4}>
                    <Text>
                        Se van a actualizar <Text strong>{selectedCategories.length} categorías</Text> con un total de{' '}
                        <Text strong>{totalSelected} productos</Text>.
                    </Text>
                    <div style={{ marginTop: 8 }}>
                        {selectedCategoriesData.slice(0, 5).map(c => (
                            <Tag key={c.category_id} style={{ marginBottom: 4 }}>{c.category_name}</Tag>
                        ))}
                        {selectedCategoriesData.length > 5 && (
                            <Tag>+{selectedCategoriesData.length - 5} más</Tag>
                        )}
                    </div>
                </Space>
            ),
            okText: 'Sí, ejecutar',
            okType: 'primary',
            cancelText: 'Cancelar',
            onOk: async () => {
                setLoading(true);
                try {
                    const payload = isAll
                        ? {}
                        : { categoryIds: selectedCategories };

                    const response = await scraperAPI.triggerScraper('categoryScraper', payload);
                    const queued = response.data.status === 'queued';

                    message.success(
                        isAll
                            ? (queued
                                ? `Actualización completa agregada a pendientes. Posición ${response.data.position}`
                                : 'Sincronización completa iniciada')
                            : (queued
                                ? `${selectedCategories.length} categorías agregadas a pendientes. Posición ${response.data.position}`
                                : `Sincronización iniciada para ${selectedCategories.length} categorías`)
                    );

                    setSelectedCategories([]);
                    setSelectAll(false);
                } catch (error) {
                    message.error(getApiErrorMessage(error, 'Error al iniciar la sincronización'));
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    const handleScrape = (values) => {
        Modal.confirm({
            title: '¿Ejecutar sincronización manual?',
            icon: <ExclamationCircleOutlined />,
            content: (
                <Text>
                    Se va a sincronizar la categoría ID{' '}
                    <Text strong>{values.categoryIds}</Text>.
                </Text>
            ),
            okText: 'Sí, ejecutar',
            okType: 'primary',
            cancelText: 'Cancelar',
            onOk: async () => {
                setLoading(true);
                try {
                    const response = await scraperAPI.triggerScraper('categoryScraper', {
                        categoryIds: [values.categoryIds]
                    });
                    const queued = response.data.status === 'queued';
                    message.success(
                        queued
                            ? `Actualización agregada a pendientes. Posición ${response.data.position}`
                            : 'Sincronización iniciada'
                    );
                    form.resetFields();
                } catch (error) {
                    message.error(getApiErrorMessage(error, 'Error al iniciar la sincronización'));
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    const handleUpdateCatalog = async () => {
        setUpdateLoading(true);
        try {
            const response = await productsAPI.updateParsed();
            message.success(`Catálogo actualizado: ${response.data.updatedCount} productos`);
            await Promise.all([loadLastUpdate(), loadCategories()]);
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al actualizar el catálogo'));
        }
        setUpdateLoading(false);
    };

    const selectedCategoriesData = categories.filter(c => selectedCategories.includes(c.category_id));
    const totalSelectedProducts = selectedCategoriesData.reduce((sum, c) => sum + c.product_count, 0);

    return (
        <div>
            <Title level={2} style={{ fontSize: isMobile ? '20px' : '30px', marginBottom: isMobile ? '12px' : '24px' }}>
                Gestión de Catálogo
            </Title>

            <HelpPanel title="Cómo usar Gestión de Catálogo" storageKey="help-catalog-page">
                <Paragraph style={{ marginBottom: 8 }}>
                    Esta pantalla permite revisar el estado del catálogo y ejecutar sincronizaciones para actualizar productos y categorías.
                </Paragraph>
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                    <li><Text strong>Sincronización completa</Text> actualiza todo el catálogo y puede demorar varios minutos.</li>
                    <li><Text strong>Sincronización por categorías</Text> permite procesar solo algunos rubros.</li>
                    <li>Después de iniciar una sincronización, revisá el avance en la sección <Text strong>Procesos</Text>.</li>
                </ul>
            </HelpPanel>

            <Divider orientation="left" style={{ marginTop: 0 }}>
                <Text strong style={{ fontSize: isMobile ? '13px' : '15px' }}>Estado del Catálogo</Text>
            </Divider>
            <Card
                loading={categoriesLoading}
                style={{ marginBottom: 24 }}
                styles={{ body: { padding: isMobile ? '12px' : '24px' } }}
            >
                <Row gutter={[12, 12]}>
                    <Col xs={12} sm={8}>
                        <Statistic
                            title="Total de Productos"
                            value={totalProducts}
                            prefix={<ShoppingOutlined />}
                            valueStyle={{ fontSize: isMobile ? '18px' : '24px' }}
                        />
                    </Col>
                    <Col xs={12} sm={8}>
                        <Statistic
                            title="Total de Categorías"
                            value={categories.length}
                            prefix={<AppstoreOutlined />}
                            valueStyle={{ fontSize: isMobile ? '18px' : '24px' }}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        {selectedCategories.length > 0 ? (
                            <Statistic
                                title="Seleccionados"
                                value={totalSelectedProducts}
                                valueStyle={{ color: '#1890ff', fontSize: isMobile ? '18px' : '24px' }}
                                prefix={<PlayCircleOutlined />}
                            />
                        ) : (
                            <div>
                                <Text type="secondary" style={{ fontSize: isMobile ? '11px' : '14px', display: 'block' }}>
                                    Última Actualización
                                </Text>
                                <Text strong style={{ fontSize: isMobile ? '11px' : '14px' }}>
                                    {formatDate(lastUpdate)}
                                </Text>
                            </div>
                        )}
                    </Col>
                </Row>
                {!isMobile && (
                    <Button
                        type="link"
                        onClick={loadCategories}
                        loading={categoriesLoading}
                        icon={<ReloadOutlined />}
                        style={{ marginTop: 12 }}
                    >
                        Actualizar estadísticas
                    </Button>
                )}
            </Card>

            <Divider orientation="left">
                <Text strong style={{ fontSize: isMobile ? '13px' : '15px' }}>Sincronización de Catálogo</Text>
            </Divider>

            <Card style={{ marginBottom: 16 }} styles={{ body: { padding: isMobile ? '12px' : '24px' } }}>
                <Space direction="vertical" style={{ width: '100%' }} size={isMobile ? 8 : 16}>
                    <Space>
                        <PlayCircleOutlined style={{ fontSize: isMobile ? '16px' : '18px' }} />
                        <Text strong style={{ fontSize: isMobile ? '14px' : '16px' }}>Sincronización Completa</Text>
                    </Space>
                    <Alert
                        message="Actualización Total del Catálogo"
                        description={isMobile ? 'Sincronización completa de todas las categorías.' : 'Ejecuta una sincronización completa de todas las categorías y productos. Esta operación puede tomar varios minutos.'}
                        type="info"
                        showIcon
                        style={{ fontSize: isMobile ? '12px' : '14px' }}
                    />
                    <Button type="primary" danger icon={<PlayCircleOutlined />} loading={loading} onClick={handleScrapeComplete} size={isMobile ? 'middle' : 'large'} block>
                        Ejecutar Sincronización Completa
                    </Button>
                </Space>
            </Card>

            <Card style={{ marginBottom: 16 }} styles={{ body: { padding: isMobile ? '12px' : '24px' } }}>
                <Space direction="vertical" style={{ width: '100%' }} size={isMobile ? 8 : 16}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <Space>
                            <AppstoreOutlined style={{ fontSize: isMobile ? '16px' : '18px' }} />
                            <Text strong style={{ fontSize: isMobile ? '14px' : '16px' }}>Sincronización por Categorías</Text>
                        </Space>
                        {!isMobile && <Text type="secondary" style={{ fontSize: '12px' }}>{selectedCategories.length} de {categories.length} seleccionadas</Text>}
                    </div>
                    <Alert
                        message="Sincronización por Lotes"
                        description={isMobile ? 'Selecciona categorías para sincronizar.' : "Selecciona las categorías que deseas actualizar. Usar 'Seleccionar Todo' ejecutará una sincronización completa más eficiente."}
                        type="info"
                        showIcon
                        style={{ fontSize: isMobile ? '12px' : '14px' }}
                    />
                    <Checkbox checked={selectAll} onChange={handleSelectAll} disabled={categoriesLoading} style={{ fontSize: isMobile ? '13px' : '14px' }}>
                        <Text strong>Seleccionar Todo ({totalProducts} productos)</Text>
                    </Checkbox>
                    <Divider style={{ margin: isMobile ? '8px 0' : '12px 0' }} />
                    {categoriesLoading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}><Spin tip="Cargando..." /></div>
                    ) : (
                        <Checkbox.Group value={selectedCategories} onChange={handleCategoryChange} style={{ width: '100%' }} disabled={selectAll}>
                            <Row gutter={[8, 8]}>
                                {categories.map((category) => (
                                    <Col span={isMobile ? 24 : 12} md={8} lg={6} key={category.category_id}>
                                        <Checkbox value={category.category_id} style={{ width: '100%' }}>
                                            <Space direction="vertical" size={0} style={{ width: '100%' }}>
                                                <Text strong style={{ fontSize: isMobile ? '12px' : '14px' }}>{category.category_name}</Text>
                                                <Tag color="blue" style={{ fontSize: isMobile ? '10px' : '12px' }}>{category.product_count} productos</Tag>
                                            </Space>
                                        </Checkbox>
                                    </Col>
                                ))}
                            </Row>
                        </Checkbox.Group>
                    )}
                    <Button type="primary" disabled={selectedCategories.length === 0} loading={loading} onClick={handleScrapeBatch} icon={<PlayCircleOutlined />} size={isMobile ? 'middle' : 'large'} block>
                        Ejecutar Seleccionadas ({totalSelectedProducts} productos)
                    </Button>
                </Space>
            </Card>

            {devMode && (isMobile ? (
                <Collapse defaultActiveKey={[]} style={{ marginBottom: 16 }}>
                    <Panel header={<Space><FileExcelOutlined /><Text strong>Herramienta interna: actualización desde Excel</Text></Space>} key="excel">
                        <Space direction="vertical" style={{ width: '100%' }} size={12}>
                            <Alert
                                message="Herramienta interna"
                                description="Procesa el archivo XLS remoto. No es un flujo operativo para cliente."
                                type="warning"
                                showIcon
                                icon={<WarningOutlined />}
                                style={{ fontSize: '12px' }}
                            />
                            <div style={{ textAlign: 'center' }}>
                                <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}><CalendarOutlined /> Última actualización:</Text>
                                <Text style={{ fontSize: '11px' }}>{formatDate(lastUpdate)}</Text>
                            </div>
                            <Button type="primary" icon={<ReloadOutlined />} loading={updateLoading} onClick={handleUpdateCatalog} block>
                                Ejecutar actualización interna desde Excel
                            </Button>
                        </Space>
                    </Panel>
                </Collapse>
            ) : (
                <Card title={<Space><FileExcelOutlined />Herramienta interna: actualización desde Excel</Space>} style={{ marginBottom: 24 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Alert
                            message="Herramienta interna"
                            description="Descarga y procesa el archivo XLS remoto para actualizar precios y disponibilidad. No presentarla como flujo operativo para cliente."
                            type="warning"
                            showIcon
                            icon={<WarningOutlined />}
                            size="small"
                        />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ marginBottom: 8 }}><CalendarOutlined style={{ marginRight: 8 }} /><Text strong>Última actualización:</Text></div>
                            <Text type="secondary">{formatDate(lastUpdate)}</Text>
                        </div>
                        <Divider style={{ margin: '16px 0' }} />
                        <Button type="primary" icon={<ReloadOutlined />} loading={updateLoading} onClick={handleUpdateCatalog} size="large" block>
                            Ejecutar actualización interna desde Excel
                        </Button>
                    </Space>
                </Card>
            ))}

            {devMode && (
                <>
                    <Divider orientation="left">
                        <Text strong style={{ fontSize: isMobile ? '13px' : '15px' }}>Sincronización manual</Text>
                    </Divider>

                    {isMobile ? (
                        <Collapse defaultActiveKey={[]}>
                            <Panel header={<Space><PlayCircleOutlined /><Text strong>Sincronización manual</Text></Space>} key="manual">
                                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                                    <Alert message="Herramienta técnica para actualizar una categoría por ID." type="warning" showIcon icon={<WarningOutlined />} style={{ fontSize: '12px' }} />
                                    <Form form={form} layout="vertical" onFinish={handleScrape} initialValues={{ scraperType: 'categoryScraper', categoryIds: 8 }}>
                                        <Form.Item label={<Text style={{ fontSize: '12px' }}>Tipo de actualización</Text>} name="scraperType" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                                            <Select size="middle" disabled><Option value="categoryScraper">Actualización por categorías</Option></Select>
                                        </Form.Item>
                                        <Form.Item label={<Text style={{ fontSize: '12px' }}>ID de categoría</Text>} name="categoryIds" rules={[{ required: true, message: 'Ingrese el ID de la categoría' }]} style={{ marginBottom: 12 }}>
                                            <InputNumber style={{ width: '100%' }} min={1} placeholder="Ej: 8" />
                                        </Form.Item>
                                        <Form.Item style={{ marginBottom: 0 }}>
                                            <Button type="primary" htmlType="submit" loading={loading} icon={<PlayCircleOutlined />} block>Ejecutar</Button>
                                        </Form.Item>
                                    </Form>
                                </Space>
                            </Panel>
                        </Collapse>
                    ) : (
                        <Card title={<Space><PlayCircleOutlined />Sincronización manual</Space>}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Alert message="Herramienta técnica" description="Actualiza una categoría específica por ID." type="warning" showIcon icon={<WarningOutlined />} size="small" />
                                <Form form={form} layout="vertical" onFinish={handleScrape} initialValues={{ scraperType: 'categoryScraper', categoryIds: 8 }}>
                                    <Form.Item label="Tipo de actualización" name="scraperType" rules={[{ required: true, message: 'Seleccione el tipo de actualización' }]}>
                                        <Select placeholder="Seleccione el tipo de actualización" disabled><Option value="categoryScraper">Actualización por categorías</Option></Select>
                                    </Form.Item>
                                    <Form.Item label="ID de categoría" name="categoryIds" rules={[{ required: true, message: 'Ingrese el ID de la categoría' }]} help="ID numérico de la categoría a procesar">
                                        <InputNumber style={{ width: '100%' }} min={1} placeholder="Ej: 8" />
                                    </Form.Item>
                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" loading={loading} icon={<PlayCircleOutlined />} block>Ejecutar</Button>
                                    </Form.Item>
                                </Form>
                            </Space>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
};

export default Catalog;

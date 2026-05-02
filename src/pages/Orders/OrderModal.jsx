import React from 'react';
import {
    Modal,
    Descriptions,
    Tag,
    Table,
    Typography,
    Button,
    Select,
    Switch,
    InputNumber,
    Space,
    message,
    Tabs,
    Form,
    Input,
    Divider,
    Row,
    Col,
    Card,
    Statistic,
} from 'antd';
import {
    MailOutlined,
    ReloadOutlined,
    DeleteOutlined,
    PlusOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { ordersAPI, productsAPI } from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';

const { Title, Text } = Typography;

const emptyAddress = {
    calle: '',
    numero: '',
    piso: '',
    timbre: '',
    entreCalles: '',
    localidad: '',
    partido: '',
};

const normalizeDeliveryForForm = (delivery = {}) => ({
    address: {
        ...emptyAddress,
        ...(delivery.address || {}),
    },
    contactName: delivery.contactName || '',
    contactPhone: delivery.contactPhone || '',
    schedule: delivery.schedule || '',
});

const isDeletedStatus = (status) => {
    const normalized = String(status || '').toLowerCase();
    return normalized.includes('elimin') || normalized.includes('delet');
};

const buildEditableRowKey = (productId, uid) => `${productId || 'item'}-${uid}`;

const formatCurrency = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? `$${numericValue.toLocaleString('es-AR')}` : '$0';
};

const formatAddress = (address = {}) => ([
    [address.calle, address.numero].filter(Boolean).join(' '),
    address.piso ? `Piso ${address.piso}` : '',
    address.timbre ? `Timbre ${address.timbre}` : '',
    address.entreCalles ? `Entre calles: ${address.entreCalles}` : '',
    address.localidad,
    address.partido,
].filter(Boolean).join(', '));

const tabLabel = (label) => (
    <span style={{
        display: 'inline-block',
        padding: '6px 12px',
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        background: '#fafafa',
        fontWeight: 500,
    }}>
        {label}
    </span>
);

const OrderModal = ({
    visible,
    order,
    statusColors = {},
    statusLabels = {},
    orderStatuses = [],
    defaultStatus,
    deletedStatus,
    onClose,
    onUpdated,
    onQuickStatusUpdate,
    onResendEmail,
    onPricingUpdate,
}) => {
    const [deliveryForm] = Form.useForm();
    const [selectedStatus, setSelectedStatus] = React.useState('');
    const [statusUpdating, setStatusUpdating] = React.useState(false);
    const [deliverySaving, setDeliverySaving] = React.useState(false);
    const [valuesUpdating, setValuesUpdating] = React.useState(false);
    const [editPricingMode, setEditPricingMode] = React.useState(false);
    const [editableItems, setEditableItems] = React.useState([]);
    const [extraCharge, setExtraCharge] = React.useState(0);
    const [productOptions, setProductOptions] = React.useState([]);
    const [productSearchLoading, setProductSearchLoading] = React.useState(false);
    const [selectedProductToAdd, setSelectedProductToAdd] = React.useState(null);
    const nextEditableItemIdRef = React.useRef(1);

    React.useEffect(() => {
        setSelectedStatus(order?.status || defaultStatus || '');
    }, [order, defaultStatus]);

    React.useEffect(() => {
        if (!visible || !order) {
            deliveryForm.resetFields();
            setEditableItems([]);
            setExtraCharge(0);
            setEditPricingMode(false);
            setProductOptions([]);
            setSelectedProductToAdd(null);
            return;
        }

        deliveryForm.setFieldsValue({
            delivery: normalizeDeliveryForForm(order.delivery),
        });

        const items = Array.isArray(order.cartItems)
            ? order.cartItems.map((item, index) => ({
                __uid: index + 1,
                __rowKey: buildEditableRowKey(item?.productCartItem?.product_id, index + 1),
                qty: Number(item?.qty ?? 1),
                priceAtPurchase: Number(item?.priceAtPurchase ?? item?.productCartItem?.list_price ?? 0),
                productCartItem: item?.productCartItem || {},
            }))
            : [];

        setEditableItems(items);
        setExtraCharge(Number(order.extraCharge ?? 0));
        setEditPricingMode(false);
        nextEditableItemIdRef.current = items.length + 1;
    }, [visible, order, deliveryForm]);

    if (!order) return null;

    const delivery = normalizeDeliveryForForm(order.delivery);
    const createdAtLabel = order.createdAt
        ? new Date(order.createdAt).toLocaleString('es-AR')
        : 'Sin fecha';

    const selectableStatuses = orderStatuses.filter((status) => status.key !== deletedStatus && !isDeletedStatus(status.label));
    const fallbackStatuses = [
        { key: 'confirmed', label: 'Confirmado' },
        { key: 'processing', label: 'Procesando' },
        { key: 'shipped', label: 'Enviado' },
        { key: 'delivered', label: 'Entregado' },
    ];
    const actionStatuses = selectableStatuses.length > 0 ? selectableStatuses : fallbackStatuses;
    const statusOptions = actionStatuses.map((status) => ({ value: status.key, label: status.label }));
    const currentStatusLabel = statusLabels[order.status] || statusLabels[defaultStatus] || String(order.status || defaultStatus || 'pending').toUpperCase();

    const tableItems = editPricingMode ? editableItems : (Array.isArray(order.cartItems)
        ? order.cartItems.map((item, index) => ({
            ...item,
            __rowKey: buildEditableRowKey(item?.productCartItem?.product_id, index + 1),
        }))
        : []);

    const productsSubtotal = tableItems.reduce((sum, item) => (
        sum + Number(item?.qty ?? 0) * Number(item?.priceAtPurchase ?? item?.productCartItem?.list_price ?? 0)
    ), 0);
    const visibleExtraCharge = editPricingMode ? Number(extraCharge ?? 0) : Number(order.extraCharge ?? 0);
    const visibleTotal = editPricingMode
        ? Number((productsSubtotal + visibleExtraCharge).toFixed(2))
        : Number(order.total ?? 0);

    const handleStatusChange = async () => {
        if (!selectedStatus || selectedStatus === order.status || !onQuickStatusUpdate) return;

        setStatusUpdating(true);
        try {
            await onQuickStatusUpdate(order.orderId, selectedStatus);
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleDeliverySave = async (values) => {
        if (!order?.orderId) {
            message.error('No se encontró el identificador del pedido');
            return;
        }

        const nextDelivery = normalizeDeliveryForForm(values.delivery);

        setDeliverySaving(true);
        try {
            await ordersAPI.updateDelivery(order.orderId, nextDelivery);
            message.success('Datos de entrega actualizados correctamente');
            if (typeof onUpdated === 'function') {
                await onUpdated();
            }
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al actualizar los datos de entrega'));
        } finally {
            setDeliverySaving(false);
        }
    };

    const loadProductOptions = async (searchText) => {
        const trimmed = String(searchText || '').trim();
        if (trimmed.length < 2) {
            setProductOptions([]);
            return;
        }

        setProductSearchLoading(true);
        try {
            const { data } = await productsAPI.getAll({ page: 1, limit: 20, search: trimmed });
            const productsFromApi = Array.isArray(data?.products)
                ? data.products
                : (Array.isArray(data) ? data : []);

            setProductOptions(productsFromApi.map((product) => ({
                value: product.product_id,
                label: `${product.product_id} - ${product.display_name || 'Sin nombre'}`,
                product,
            })));
        } catch (error) {
            setProductOptions([]);
            message.error(getApiErrorMessage(error, 'No se pudieron buscar productos'));
        } finally {
            setProductSearchLoading(false);
        }
    };

    const handleEditableItemChange = (rowKey, field, value) => {
        setEditableItems((currentItems) =>
            currentItems.map((item) => (item.__rowKey === rowKey
                ? { ...item, [field]: value }
                : item))
        );
    };

    const handleRemoveEditableItem = (rowKey) => {
        setEditableItems((currentItems) => currentItems.filter((item) => item.__rowKey !== rowKey));
    };

    const handleAddProduct = () => {
        if (!selectedProductToAdd?.product_id) return;
        const newUid = nextEditableItemIdRef.current;
        setEditableItems((currentItems) => [
            ...currentItems,
            {
                __uid: newUid,
                __rowKey: buildEditableRowKey(selectedProductToAdd.product_id, newUid),
                qty: 1,
                priceAtPurchase: Number(selectedProductToAdd.final_price ?? selectedProductToAdd.list_price ?? 0),
                productCartItem: selectedProductToAdd,
            },
        ]);
        nextEditableItemIdRef.current += 1;
        setSelectedProductToAdd(null);
    };

    const handlePricingSave = async () => {
        if (!onPricingUpdate) return;

        const cartItemsPayload = editableItems.map((item) => ({
            productCartItem: { product_id: item?.productCartItem?.product_id || '' },
            qty: Number(item?.qty ?? 0),
            priceAtPurchase: Number(item?.priceAtPurchase ?? 0),
        }));

        if (cartItemsPayload.length === 0) {
            message.error('Debes mantener al menos un producto en el pedido');
            return;
        }

        setValuesUpdating(true);
        try {
            await onPricingUpdate(order.orderId, {
                cartItems: cartItemsPayload,
                extraCharge: Number(extraCharge ?? 0),
            });
            setEditPricingMode(false);
        } finally {
            setValuesUpdating(false);
        }
    };

    const pricingColumns = [
        { title: 'ID', dataIndex: ['productCartItem', 'product_id'], width: 90 },
        {
            title: 'Producto',
            dataIndex: ['productCartItem', 'display_name'],
            render: (name, r) => (
                <div>
                    <div>{name || 'Sin nombre'}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>
                        {r.productCartItem?.brand || 'Sin marca'} | {r.productCartItem?.category_name || 'Sin categoría'}
                    </div>
                </div>
            ),
        },
        {
            title: 'Cantidad',
            dataIndex: 'qty',
            width: 110,
            render: (q, r) => (editPricingMode ? (
                <InputNumber
                    min={1}
                    precision={0}
                    value={q}
                    onChange={(value) => handleEditableItemChange(r.__rowKey, 'qty', Number(value ?? 1))}
                />
            ) : `${q || 0} ${r.productCartItem?.base_unit_name || ''}`),
        },
        {
            title: 'Precio Unit.',
            dataIndex: 'priceAtPurchase',
            width: 130,
            render: (p, r) => (editPricingMode ? (
                <InputNumber
                    min={0}
                    precision={2}
                    value={Number(p ?? 0)}
                    onChange={(value) => handleEditableItemChange(r.__rowKey, 'priceAtPurchase', Number(value ?? 0))}
                />
            ) : formatCurrency(p)),
        },
        {
            title: 'Subtotal',
            width: 130,
            render: (_, r) => formatCurrency(Number(r?.qty ?? 0) * Number(r?.priceAtPurchase ?? r?.productCartItem?.list_price ?? 0)),
        },
        ...(editPricingMode
            ? [{
                title: '',
                width: 56,
                render: (_, r) => (
                    <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveEditableItem(r.__rowKey)}
                    />
                ),
            }]
            : []),
    ];

    const SummaryHeader = (
        <Card size="small" style={{ marginBottom: 16 }} styles={{ body: { padding: 12 } }}>
            <Row gutter={[12, 12]} align="middle">
                <Col xs={24} md={8}>
                    <Space direction="vertical" size={0}>
                        <Text type="secondary">Pedido</Text>
                        <Text strong copyable>{order.orderId || 'Sin ID'}</Text>
                    </Space>
                </Col>
                <Col xs={12} md={4}>
                    <Statistic title="Items" value={order.totalItems || 0} />
                </Col>
                <Col xs={12} md={4}>
                    <Statistic title="Recargo" value={formatCurrency(visibleExtraCharge)} />
                </Col>
                <Col xs={24} md={5}>
                    <Statistic title={editPricingMode ? 'Total estimado' : 'Total'} value={formatCurrency(visibleTotal)} />
                </Col>
                <Col xs={24} md={3}>
                    <Tag color={statusColors[order.status] || 'default'} style={{ margin: 0 }}>
                        {currentStatusLabel}
                    </Tag>
                </Col>
            </Row>
        </Card>
    );

    const tabItems = [
        {
            key: 'summary',
            label: tabLabel('Detalle'),
            children: (
                <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="ID Pedido" span={2}>{order.orderId}</Descriptions.Item>
                    <Descriptions.Item label="Cliente">{order.customerInfo?.name || 'Sin cliente'}</Descriptions.Item>
                    <Descriptions.Item label="Email">{order.customerInfo?.email || 'Sin email'}</Descriptions.Item>
                    <Descriptions.Item label="Razón Social">{order.customerInfo?.razonSocial || 'Sin dato'}</Descriptions.Item>
                    <Descriptions.Item label="CUIT">{order.customerInfo?.cuit || 'Sin dato'}</Descriptions.Item>
                    <Descriptions.Item label="Teléfono cliente">{order.customerInfo?.telefono1 || 'Sin dato'}</Descriptions.Item>
                    <Descriptions.Item label="Contacto cliente">{order.customerInfo?.contacto || 'Sin dato'}</Descriptions.Item>
                    <Descriptions.Item label="Fecha de creación">{createdAtLabel}</Descriptions.Item>
                    <Descriptions.Item label="Estado">
                        <Tag color={statusColors[order.status] || 'default'}>
                            {currentStatusLabel}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Items Totales">{order.totalItems || 0}</Descriptions.Item>
                    <Descriptions.Item label="Recargo">{formatCurrency(order.extraCharge)}</Descriptions.Item>
                    <Descriptions.Item label="Total" span={2}>{formatCurrency(order.total)}</Descriptions.Item>
                    <Descriptions.Item label="Entrega" span={2}>{formatAddress(delivery.address) || 'Sin dirección'}</Descriptions.Item>
                    <Descriptions.Item label="Contacto entrega">{delivery.contactName || 'Sin dato'}</Descriptions.Item>
                    <Descriptions.Item label="Teléfono entrega">{delivery.contactPhone || 'Sin dato'}</Descriptions.Item>
                    <Descriptions.Item label="Horario entrega" span={2}>{delivery.schedule || 'Sin dato'}</Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: 'delivery',
            label: tabLabel('Entrega'),
            children: (
                <Form form={deliveryForm} layout="vertical" onFinish={handleDeliverySave}>
                    <Divider orientation="left">Dirección de entrega</Divider>
                    <Row gutter={16}>
                        <Col xs={24} md={16}>
                            <Form.Item label="Calle" name={['delivery', 'address', 'calle']}>
                                <Input placeholder="Calle" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Número" name={['delivery', 'address', 'numero']}>
                                <Input placeholder="Número" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Form.Item label="Piso" name={['delivery', 'address', 'piso']}>
                                <Input placeholder="Piso" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Timbre" name={['delivery', 'address', 'timbre']}>
                                <Input placeholder="Timbre" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Entre calles" name={['delivery', 'address', 'entreCalles']}>
                                <Input placeholder="Entre calles" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item label="Localidad" name={['delivery', 'address', 'localidad']}>
                                <Input placeholder="Localidad" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="Partido" name={['delivery', 'address', 'partido']}>
                                <Input placeholder="Partido" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider orientation="left">Contacto de entrega</Divider>
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item label="Contacto" name={['delivery', 'contactName']}>
                                <Input placeholder="Nombre de contacto" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="Teléfono" name={['delivery', 'contactPhone']}>
                                <Input placeholder="Teléfono de contacto" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Horario de entrega" name={['delivery', 'schedule']}>
                        <Input.TextArea rows={2} placeholder="Ej: Lunes a viernes de 9 a 13" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={deliverySaving} icon={<SaveOutlined />}>
                        Guardar entrega
                    </Button>
                </Form>
            ),
        },
        {
            key: 'pricing',
            label: tabLabel('Productos'),
            children: (
                <div>
                    <Card size="small" style={{ marginBottom: 16 }}>
                        <Row gutter={[12, 12]} align="middle">
                            <Col xs={24} md={8}>
                                <Space align="center">
                                    <Text strong>Editar productos y precios</Text>
                                    <Switch checked={editPricingMode} onChange={setEditPricingMode} />
                                </Space>
                            </Col>
                            <Col xs={12} md={5}>
                                <Statistic title="Subtotal productos" value={formatCurrency(productsSubtotal)} />
                            </Col>
                            <Col xs={12} md={5}>
                                <Statistic title="Recargo" value={formatCurrency(visibleExtraCharge)} />
                            </Col>
                            <Col xs={24} md={6}>
                                <Statistic title={editPricingMode ? 'Total estimado' : 'Total'} value={formatCurrency(visibleTotal)} />
                            </Col>
                        </Row>
                    </Card>

                    {editPricingMode ? (
                        <Space wrap style={{ marginBottom: 16 }}>
                            <Select
                                showSearch
                                placeholder="Agregar por código o descripción"
                                style={{ minWidth: 260 }}
                                filterOption={false}
                                options={productOptions}
                                value={selectedProductToAdd?.product_id}
                                loading={productSearchLoading}
                                onSearch={loadProductOptions}
                                onChange={(value) => {
                                    const selected = productOptions.find((option) => option.value === value)?.product;
                                    setSelectedProductToAdd(selected || null);
                                }}
                            />
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProduct}>
                                Agregar producto
                            </Button>
                            <InputNumber
                                min={0}
                                precision={2}
                                addonBefore="Recargo"
                                value={Number(extraCharge ?? 0)}
                                onChange={(value) => setExtraCharge(Number(value ?? 0))}
                            />
                        </Space>
                    ) : null}

                    <Table
                        size="small"
                        dataSource={tableItems}
                        rowKey="__rowKey"
                        pagination={false}
                        columns={pricingColumns}
                        scroll={{ x: 720 }}
                    />

                    {editPricingMode ? (
                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={handlePricingSave}
                            loading={valuesUpdating}
                            style={{ marginTop: 16 }}
                        >
                            Guardar productos y precios
                        </Button>
                    ) : null}
                </div>
            ),
        },
        {
            key: 'actions',
            label: tabLabel('Acciones'),
            children: (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Card size="small">
                        <Title level={5}>Cambiar estado</Title>
                        <Space wrap>
                            <Select
                                value={selectedStatus || order.status}
                                onChange={setSelectedStatus}
                                options={statusOptions}
                                style={{ minWidth: 220 }}
                                placeholder="Seleccionar estado"
                            />
                            <Button
                                type="primary"
                                onClick={handleStatusChange}
                                loading={statusUpdating}
                                disabled={!selectedStatus || selectedStatus === order.status}
                            >
                                Actualizar estado
                            </Button>
                        </Space>
                    </Card>
                    <Card size="small">
                        <Title level={5}>Emails</Title>
                        <Button
                            icon={<MailOutlined />}
                            onClick={() => onResendEmail && onResendEmail(order.orderId)}
                        >
                            Reenviar email de confirmación
                        </Button>
                    </Card>
                </Space>
            ),
        },
    ];

    return (
        <Modal
            title={`Pedido ${order.orderId || ''}`}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={960}
            destroyOnClose
            styles={{ body: { paddingTop: 12 } }}
        >
            {SummaryHeader}
            <Tabs
                defaultActiveKey="summary"
                items={tabItems}
                size="large"
                tabBarGutter={8}
                moreIcon={null}
                style={{ overflowX: 'auto' }}
            />
        </Modal>
    );
};

export default OrderModal;

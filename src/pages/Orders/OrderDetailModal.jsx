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
} from 'antd';
import { MailOutlined, ReloadOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { productsAPI } from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';

const { Title, Text } = Typography;

const isDeletedStatus = (status) => {
    const normalized = String(status || '').toLowerCase();
    return normalized.includes('elimin') || normalized.includes('delet');
};

const buildEditableRowKey = (productId, uid) => `${productId || 'item'}-${uid}`;

const OrderDetailModal = ({
    visible,
    order,
    statusColors,
    statusLabels = {},
    orderStatuses = [],
    defaultStatus,
    deletedStatus,
    onClose,
    onQuickStatusUpdate,
    onResendEmail,
    onPricingUpdate,
}) => {
    const [selectedStatus, setSelectedStatus] = React.useState('');
    const [statusUpdating, setStatusUpdating] = React.useState(false);
    const [valuesUpdating, setValuesUpdating] = React.useState(false);
    const [editMode, setEditMode] = React.useState(false);
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
        if (!order) {
            setEditableItems([]);
            setExtraCharge(0);
            setEditMode(false);
            return;
        }

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
        setEditMode(false);
        nextEditableItemIdRef.current = items.length + 1;
    }, [order]);

    if (!order) return null;

    const formatCurrency = (value) => {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? `$${numericValue.toLocaleString('es-AR')}` : '$0';
    };

    const tableItems = editMode ? editableItems : (Array.isArray(order.cartItems)
        ? order.cartItems.map((item, index) => ({
            ...item,
            __rowKey: buildEditableRowKey(item?.productCartItem?.product_id, index + 1),
        }))
        : []);

    const customerAddress = order.customerInfo?.direccion || {};
    const fullAddress = [
        [customerAddress.calle, customerAddress.numero].filter(Boolean).join(' '),
        customerAddress.piso ? `Piso ${customerAddress.piso}` : '',
        customerAddress.timbre ? `Timbre ${customerAddress.timbre}` : '',
        customerAddress.entreCalles ? `Entre calles: ${customerAddress.entreCalles}` : '',
        customerAddress.localidad,
        customerAddress.partido,
    ].filter(Boolean).join(', ');

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

    const handleStatusChange = async () => {
        if (!selectedStatus || selectedStatus === order.status) return;

        setStatusUpdating(true);
        try {
            await onQuickStatusUpdate(order.orderId, selectedStatus);
        } finally {
            setStatusUpdating(false);
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

            const normalized = productsFromApi.map((product) => ({
                value: product.product_id,
                label: `${product.product_id} - ${product.display_name || 'Sin nombre'}`,
                product,
            }));
            setProductOptions(normalized);
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

    const handleRefreshValues = async () => {
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
            setEditMode(false);

            if (onResendEmail) {
                Modal.confirm({
                    title: '¿Deseas reenviar el email de confirmación?',
                    content: 'Los cambios del pedido se guardaron correctamente.',
                    okText: 'Sí, reenviar',
                    cancelText: 'No',
                    onOk: async () => {
                        try {
                            await onResendEmail(order.orderId);
                        } catch (error) {
                            message.error(getApiErrorMessage(error, 'No se pudo reenviar el email de confirmación'));
                        }
                    },
                });
            }
        } finally {
            setValuesUpdating(false);
        }
    };

    const columns = [
        { title: 'ID', dataIndex: ['productCartItem', 'product_id'], width: 80 },
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
            width: 80,
            render: (q, r) => (editMode ? (
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
            render: (p, r) => (editMode ? (
                <InputNumber
                    min={0}
                    precision={2}
                    value={Number(p ?? 0)}
                    onChange={(value) => handleEditableItemChange(r.__rowKey, 'priceAtPurchase', Number(value ?? 0))}
                />
            ) : formatCurrency(p)),
            width: 120,
        },
        {
            title: 'Subtotal',
            render: (_, r) => {
                const quantity = Number(r?.qty ?? 0);
                const listPrice = Number(r?.priceAtPurchase ?? r?.productCartItem?.list_price ?? 0);
                return formatCurrency(quantity * listPrice);
            },
            width: 120,
        },
        ...(editMode
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

    return (
        <Modal title="Detalle del Pedido" open={visible} onCancel={onClose} footer={null} width={700}>
            <Descriptions column={2} bordered>
                <Descriptions.Item label="ID Pedido" span={2}>{order.orderId}</Descriptions.Item>
                <Descriptions.Item label="Cliente">{order.customerInfo?.name || 'Sin cliente'}</Descriptions.Item>
                <Descriptions.Item label="Email">{order.customerInfo.email}</Descriptions.Item>
                <Descriptions.Item label="Razón Social">{order.customerInfo?.razonSocial || 'Sin dato'}</Descriptions.Item>
                <Descriptions.Item label="CUIT">{order.customerInfo?.cuit || 'Sin dato'}</Descriptions.Item>
                <Descriptions.Item label="Teléfono">{order.customerInfo?.telefono1 || 'Sin dato'}</Descriptions.Item>
                <Descriptions.Item label="Contacto">{order.customerInfo?.contacto || 'Sin dato'}</Descriptions.Item>
                <Descriptions.Item label="Horarios" span={2}>{order.customerInfo?.horarios || 'Sin dato'}</Descriptions.Item>
                <Descriptions.Item label="Dirección" span={2}>{fullAddress || 'Sin dirección'}</Descriptions.Item>
                <Descriptions.Item label="Notas" span={2}>{order.customerInfo?.notas || 'Sin notas'}</Descriptions.Item>
                <Descriptions.Item label="Items Totales">{order.totalItems || 0}</Descriptions.Item>
                <Descriptions.Item label="Fecha de creación">{createdAtLabel}</Descriptions.Item>
                <Descriptions.Item label="Estado">
                    <Tag color={statusColors[order.status] || 'default'}>
                        {currentStatusLabel}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Recargo">{formatCurrency(extraCharge)}</Descriptions.Item>
                <Descriptions.Item label="Total">{formatCurrency(order.total)}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
                <Title level={4}>Productos</Title>
                <Table
                    size="small"
                    dataSource={tableItems}
                    rowKey="__rowKey"
                    pagination={false}
                    columns={columns}
                />
            </div>

            <div style={{ marginTop: 16, textAlign: 'center' }}>
                <div style={{ marginBottom: 12 }}>
                    <Space align="center">
                        <Text strong>Modo edición</Text>
                        <Switch checked={editMode} onChange={setEditMode} />
                    </Space>
                </div>

                {editMode ? (
                    <div style={{ marginBottom: 16 }}>
                        <Space wrap>
                            <Select
                                showSearch
                                placeholder="Agregar por código o descripción"
                                style={{ minWidth: 320 }}
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
                                Agregar Producto
                            </Button>
                            <InputNumber
                                min={0}
                                precision={2}
                                addonBefore="Recargo"
                                value={Number(extraCharge ?? 0)}
                                onChange={(value) => setExtraCharge(Number(value ?? 0))}
                            />
                        </Space>
                    </div>
                ) : null}

                <Text strong style={{ display: 'block', marginBottom: 8 }}>Cambiar Estado:</Text>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                        Actualizar Estado
                    </Button>
                </div>

                <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                    <Button
                        type="default"
                        icon={<ReloadOutlined />}
                        onClick={handleRefreshValues}
                        loading={valuesUpdating}
                        disabled={!editMode}
                        style={{ marginRight: 8 }}
                    >
                        Guardar Cambios
                    </Button>
                    <Button
                        type="default"
                        icon={<MailOutlined />}
                        onClick={() => onResendEmail(order.orderId)}
                        style={{ marginRight: 8 }}
                    >
                        Reenviar Email de Confirmación
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default OrderDetailModal;

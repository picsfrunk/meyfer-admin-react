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
    Alert,
    Popconfirm,
} from 'antd';
import {
    MailOutlined,
    ReloadOutlined,
    DeleteOutlined,
    PlusOutlined,
    SaveOutlined,
    EditOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import { ordersAPI, productsAPI } from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';
import { useAuth } from '../../context/useAuth';

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

const normalizeOrderLog = (log = {}) => ({
    _id: log._id || log.id || '',
    orderId: log.orderId || '',
    message: log.message || '',
    type: log.type || '',
    createdBy: log.createdBy || '',
    updatedBy: log.updatedBy || '',
    metadata: log.metadata || null,
    createdAt: log.createdAt || null,
    updatedAt: log.updatedAt || null,
});

const formatDateTime = (value) => (value
    ? new Date(value).toLocaleString('es-AR')
    : 'Sin fecha');

const LOG_TYPE_LABELS = {
    note: 'Nota manual',
    status_change: 'Cambio de estado',
    delivery_change: 'Cambio de entrega',
    pricing_change: 'Cambio de precios',
    customer_note_change: 'Cambio de nota cliente',
    customer_info_change: 'Cambio de cliente',
    order_deleted: 'Pedido eliminado',
};

const LOG_TYPE_COLORS = {
    note: 'blue',
    status_change: 'purple',
    delivery_change: 'cyan',
    pricing_change: 'gold',
    customer_note_change: 'volcano',
    customer_info_change: 'geekblue',
    order_deleted: 'red',
};

const STATUS_LABEL_FALLBACKS = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    processing: 'Procesando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
    deleted: 'Eliminado',
};

const FIELD_LABELS = {
    contactName: 'Contacto',
    contactPhone: 'Teléfono',
    schedule: 'Horario',
    customerNote: 'Nota del cliente',
    name: 'Cliente',
    cliente: 'Cliente',
    razonSocial: 'Razón social',
    cuit: 'CUIT',
    telefono1: 'Teléfono cliente',
    email: 'Email',
    contacto: 'Contacto cliente',
    horarios: 'Horarios',
    notas: 'Notas',
    calle: 'Calle',
    numero: 'Número',
    piso: 'Piso',
    timbre: 'Timbre',
    entreCalles: 'Entre calles',
    localidad: 'Localidad',
    partido: 'Partido',
};

const getStatusLabel = (status, statusLabels = {}) => (
    statusLabels[status] || STATUS_LABEL_FALLBACKS[status] || String(status || 'Sin estado')
);

const getFieldLabel = (key) => FIELD_LABELS[key] || key;

const formatLogValue = (value) => {
    if (value === null || value === undefined || value === '') return 'Sin dato';
    if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString('es-AR') : String(value);
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'object') return 'Datos actualizados';
    return String(value);
};

const formatLogChange = (label, change) => {
    if (!change || typeof change !== 'object' || !('from' in change) || !('to' in change)) return null;
    return `${label}: ${formatLogValue(change.from)} -> ${formatLogValue(change.to)}`;
};

const flattenObject = (value = {}, prefix = '') => Object.entries(value || {}).reduce((acc, [key, nestedValue]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
        return { ...acc, ...flattenObject(nestedValue, nextKey) };
    }
    return { ...acc, [nextKey]: nestedValue };
}, {});

const buildObjectChangeLines = (from = {}, to = {}) => {
    const flatFrom = flattenObject(from);
    const flatTo = flattenObject(to);
    const keys = [...new Set([...Object.keys(flatFrom), ...Object.keys(flatTo)])];

    return keys
        .filter((key) => formatLogValue(flatFrom[key]) !== formatLogValue(flatTo[key]))
        .map((key) => {
            const fieldKey = key.split('.').pop();
            return `${getFieldLabel(fieldKey)}: ${formatLogValue(flatFrom[key])} -> ${formatLogValue(flatTo[key])}`;
        });
};

const buildDeliveryChangeLines = (metadata = {}) => {
    const from = metadata.from || {};
    const to = metadata.to || {};
    const lines = [];

    const fromAddress = formatAddress(from.address || {});
    const toAddress = formatAddress(to.address || {});
    if (fromAddress !== toAddress) {
        lines.push(`Dirección: ${formatLogValue(fromAddress)} -> ${formatLogValue(toAddress)}`);
    }

    [
        ['Contacto', from.contactName, to.contactName],
        ['Teléfono', from.contactPhone, to.contactPhone],
        ['Horario', from.schedule, to.schedule],
    ].forEach(([label, previousValue, nextValue]) => {
        if (formatLogValue(previousValue) !== formatLogValue(nextValue)) {
            lines.push(`${label}: ${formatLogValue(previousValue)} -> ${formatLogValue(nextValue)}`);
        }
    });

    return lines.length ? lines : buildObjectChangeLines(from, to);
};

const buildLogMessage = (log, statusLabels = {}) => {
    if (log.type === 'status_change' && log.metadata?.from && log.metadata?.to) {
        return `Estado cambiado de ${getStatusLabel(log.metadata.from, statusLabels)} a ${getStatusLabel(log.metadata.to, statusLabels)}`;
    }

    return log.message || 'Sin mensaje';
};

const buildMetadataLines = (metadata, type, statusLabels = {}) => {
    if (!metadata || typeof metadata !== 'object') return [];

    if (type === 'status_change') {
        if (!metadata.from || !metadata.to) return [];
        return [`Cambio: ${getStatusLabel(metadata.from, statusLabels)} -> ${getStatusLabel(metadata.to, statusLabels)}`];
    }

    if (type === 'delivery_change') {
        return buildDeliveryChangeLines(metadata);
    }

    if (type === 'pricing_change') {
        const lines = [];
        const added = metadata.items?.added || [];
        const removed = metadata.items?.removed || [];
        const updated = metadata.items?.updated || [];

        if (added.length) {
            lines.push(`Agregados: ${added.map((item) => `${item.product_id} x${item.quantity ?? item.qty ?? 0} (${formatCurrency(item.priceAtPurchase)})`).join(', ')}`);
        }
        if (removed.length) {
            lines.push(`Quitados: ${removed.map((item) => `${item.product_id} x${item.quantity ?? item.qty ?? 0}`).join(', ')}`);
        }
        updated.forEach((item) => {
            const changes = Object.entries(item.changes || {})
                .map(([field, change]) => formatLogChange(field === 'quantity' ? 'cantidad' : field, change))
                .filter(Boolean)
                .join('; ');
            lines.push(`Modificado ${item.product_id}: ${changes || 'sin detalle'}`);
        });

        [
            ['Recargo', metadata.extraCharge],
            ['Total', metadata.total],
            ['Items totales', metadata.totalItems],
        ].forEach(([label, change]) => {
            const line = formatLogChange(label, change);
            if (line) lines.push(line);
        });

        return lines;
    }

    if (metadata.from && metadata.to && typeof metadata.from === 'object' && typeof metadata.to === 'object') {
        return buildObjectChangeLines(metadata.from, metadata.to);
    }

    const directChange = formatLogChange('Cambio', metadata);
    if (directChange) return [directChange];

    return Object.entries(metadata)
        .map(([key, value]) => formatLogChange(key, value) || `${key}: ${formatLogValue(value)}`)
        .filter(Boolean);
};

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
    const { user } = useAuth();
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
    const [internalLogs, setInternalLogs] = React.useState([]);
    const [logsLoading, setLogsLoading] = React.useState(false);
    const [logsError, setLogsError] = React.useState('');
    const [newLogMessage, setNewLogMessage] = React.useState('');
    const [logSaving, setLogSaving] = React.useState(false);
    const [editingLogId, setEditingLogId] = React.useState('');
    const [editingLogMessage, setEditingLogMessage] = React.useState('');
    const [logActionLoadingId, setLogActionLoadingId] = React.useState('');
    const nextEditableItemIdRef = React.useRef(1);

    const loadInternalLogs = React.useCallback(async () => {
        if (!visible || !order?.orderId) {
            setInternalLogs([]);
            return;
        }

        setLogsLoading(true);
        setLogsError('');
        try {
            const { data } = await ordersAPI.getLogs(order.orderId);
            const logs = Array.isArray(data)
                ? data
                : (Array.isArray(data?.logs) ? data.logs : []);
            setInternalLogs(logs.map(normalizeOrderLog));
        } catch (error) {
            setInternalLogs([]);
            setLogsError(getApiErrorMessage(error, 'No se pudo cargar la bitácora interna'));
        } finally {
            setLogsLoading(false);
        }
    }, [visible, order?.orderId]);

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
            setInternalLogs([]);
            setLogsError('');
            setNewLogMessage('');
            setEditingLogId('');
            setEditingLogMessage('');
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

    React.useEffect(() => {
        setNewLogMessage('');
        setEditingLogId('');
        setEditingLogMessage('');
        loadInternalLogs();
    }, [loadInternalLogs]);

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
            await loadInternalLogs();
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
            await loadInternalLogs();
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
            await loadInternalLogs();
        } finally {
            setValuesUpdating(false);
        }
    };

    const handleCreateLog = async () => {
        const trimmedMessage = newLogMessage.trim();
        if (!trimmedMessage) {
            message.error('La nota interna no puede estar vacía');
            return;
        }

        setLogSaving(true);
        try {
            await ordersAPI.createLog(order.orderId, {
                message: trimmedMessage,
                type: 'note',
                createdBy: user?.username || 'admin',
            });
            setNewLogMessage('');
            message.success('Nota interna creada correctamente');
            await loadInternalLogs();
        } catch (error) {
            setLogsError(getApiErrorMessage(error, 'No se pudo crear la nota interna'));
        } finally {
            setLogSaving(false);
        }
    };

    const startEditingLog = (log) => {
        setEditingLogId(log._id);
        setEditingLogMessage(log.message || '');
    };

    const cancelEditingLog = () => {
        setEditingLogId('');
        setEditingLogMessage('');
    };

    const handleUpdateLog = async (logId) => {
        const trimmedMessage = editingLogMessage.trim();
        if (!trimmedMessage) {
            message.error('La nota interna no puede estar vacía');
            return;
        }

        setLogActionLoadingId(logId);
        try {
            await ordersAPI.updateLog(order.orderId, logId, {
                message: trimmedMessage,
                updatedBy: user?.username || 'admin',
            });
            cancelEditingLog();
            message.success('Nota interna actualizada correctamente');
            await loadInternalLogs();
        } catch (error) {
            setLogsError(getApiErrorMessage(error, 'No se pudo actualizar la nota interna'));
        } finally {
            setLogActionLoadingId('');
        }
    };

    const handleDeleteLog = async (logId) => {
        setLogActionLoadingId(logId);
        try {
            await ordersAPI.deleteLog(order.orderId, logId);
            message.success('Nota interna eliminada correctamente');
            await loadInternalLogs();
        } catch (error) {
            setLogsError(getApiErrorMessage(error, 'No se pudo eliminar la nota interna'));
        } finally {
            setLogActionLoadingId('');
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

    const logsColumns = [
        {
            title: 'Fecha',
            dataIndex: 'createdAt',
            width: 170,
            render: formatDateTime,
        },
        {
            title: 'Evento',
            dataIndex: 'type',
            width: 170,
            render: (type) => (
                <Tag color={LOG_TYPE_COLORS[type] || 'default'}>
                    {LOG_TYPE_LABELS[type] || type || 'Sin tipo'}
                </Tag>
            ),
        },
        {
            title: 'Detalle',
            dataIndex: 'message',
            render: (value, record) => (editingLogId === record._id ? (
                <Input.TextArea
                    rows={3}
                    value={editingLogMessage}
                    onChange={(event) => setEditingLogMessage(event.target.value)}
                />
            ) : (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text style={{ whiteSpace: 'pre-wrap' }}>{buildLogMessage(record, statusLabels)}</Text>
                    {buildMetadataLines(record.metadata, record.type, statusLabels).map((line) => (
                        <Text key={line} type="secondary" style={{ fontSize: 12 }}>
                            {line}
                        </Text>
                    ))}
                    {record.updatedAt ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Editado por {record.updatedBy || 'admin'} el {formatDateTime(record.updatedAt)}
                        </Text>
                    ) : null}
                </Space>
            )),
        },
        {
            title: 'Origen',
            dataIndex: 'createdBy',
            width: 130,
            render: (createdBy) => (createdBy === 'system' ? 'Sistema' : (createdBy || 'admin')),
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: 150,
            render: (_, record) => (record.type !== 'note' || record.createdBy === 'system' ? (
                <Text type="secondary">Automático</Text>
            ) : editingLogId === record._id ? (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<SaveOutlined />}
                        loading={logActionLoadingId === record._id}
                        onClick={() => handleUpdateLog(record._id)}
                    />
                    <Button
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={cancelEditingLog}
                    />
                </Space>
            ) : (
                <Space>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => startEditingLog(record)}
                        disabled={Boolean(editingLogId)}
                    />
                    <Popconfirm
                        title="¿Eliminar esta nota interna?"
                        okText="Sí"
                        cancelText="No"
                        onConfirm={() => handleDeleteLog(record._id)}
                    >
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            loading={logActionLoadingId === record._id}
                            disabled={Boolean(editingLogId)}
                        />
                    </Popconfirm>
                </Space>
            )),
        },
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
                    <Descriptions.Item label="Nota del cliente" span={2}>{order.customerNote || 'Sin nota'}</Descriptions.Item>
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
            key: 'internalLogs',
            label: tabLabel('Seguimiento interno'),
            children: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {logsError ? (
                        <Alert
                            type="error"
                            showIcon
                            message={logsError}
                            action={(
                                <Button size="small" onClick={loadInternalLogs}>
                                    Reintentar
                                </Button>
                            )}
                        />
                    ) : null}

                    <Card size="small">
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Text strong>Nueva nota interna</Text>
                            <Input.TextArea
                                rows={3}
                                value={newLogMessage}
                                placeholder="Escribir una nota de seguimiento operativo"
                                onChange={(event) => setNewLogMessage(event.target.value)}
                            />
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={handleCreateLog}
                                loading={logSaving}
                                disabled={!newLogMessage.trim()}
                            >
                                Guardar nota
                            </Button>
                        </Space>
                    </Card>

                    <Table
                        size="small"
                        dataSource={internalLogs}
                        rowKey="_id"
                        loading={logsLoading}
                        pagination={false}
                        columns={logsColumns}
                        scroll={{ x: 760 }}
                        locale={{ emptyText: logsLoading ? 'Cargando bitácora...' : 'Sin notas internas' }}
                    />
                </Space>
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

import React from 'react';
import { Modal, Descriptions, Tag, Table, Typography, Button, Select } from 'antd';
import { MailOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const isDeletedStatus = (status) => {
    const normalized = String(status || '').toLowerCase();
    return normalized.includes('elimin') || normalized.includes('delet');
};

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
    onRefreshOrderValues,
}) => {
    const [selectedStatus, setSelectedStatus] = React.useState('');
    const [statusUpdating, setStatusUpdating] = React.useState(false);
    const [valuesUpdating, setValuesUpdating] = React.useState(false);

    React.useEffect(() => {
        setSelectedStatus(order?.status || defaultStatus || '');
    }, [order, defaultStatus]);

    if (!order) return null;

    const formatCurrency = (value) => {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? `$${numericValue.toLocaleString('es-AR')}` : '$0';
    };

    const tableItems = Array.isArray(order.cartItems)
        ? order.cartItems.map((item, index) => ({
            ...item,
            __rowKey: `${item?.productCartItem?.product_id || 'item'}-${index}`,
        }))
        : [];

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

    const handleRefreshValues = async () => {
        if (!onRefreshOrderValues) return;
        setValuesUpdating(true);
        try {
            await onRefreshOrderValues(order.orderId);
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
            render: (q, r) => `${q || 0} ${r.productCartItem?.base_unit_name || ''}`,
        },
        {
            title: 'Precio Unit.',
            dataIndex: ['productCartItem', 'list_price'],
            render: (p) => formatCurrency(p),
            width: 120,
        },
        {
            title: 'Subtotal',
            render: (_, r) => {
                const quantity = Number(r?.qty ?? 0);
                const listPrice = Number(r?.productCartItem?.list_price ?? 0);
                return formatCurrency(quantity * listPrice);
            },
            width: 120,
        },
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
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={handleRefreshValues}
                        loading={valuesUpdating}
                        style={{ marginRight: 8 }}
                    >
                        Actualizar Valores
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

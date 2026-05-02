import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Popconfirm, Card, Typography } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

const OrdersTable = ({ orders, loading, statusColors, statusLabels = {}, onOpenOrder, onDelete }) => {
    const [isMobile, setIsMobile] = useState(false);

    const formatCurrency = (value) => {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? `$${numericValue.toLocaleString('es-AR')}` : '$0';
    };

    const openOrder = (order) => {
        if (typeof onOpenOrder === 'function') {
            onOpenOrder(order);
        }
    };

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const columns = [
        {
            title: 'ID Pedido',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 150,
            sorter: (a, b) => (a.orderId || '').localeCompare(b.orderId || ''),
            defaultSortOrder: 'ascend',
            render: (orderId, record) => (
                <span
                    style={{ cursor: 'pointer', color: '#1677ff' }}
                    onClick={() => openOrder(record)}
                >
                    {orderId}
                </span>
            ),
        },
        {
            title: 'Cliente',
            key: 'customer',
            render: (_, record) => (
                <div
                    style={{ cursor: 'pointer' }}
                    onClick={() => openOrder(record)}
                >
                    <div>{record.customerInfo?.name || 'Sin cliente'}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        {record.customerInfo?.email || 'Sin email'}
                    </div>
                </div>
            ),
            sorter: (a, b) =>
                (a.customerInfo?.name || '').localeCompare(b.customerInfo?.name || ''),
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            width: 100,
            render: (total) => formatCurrency(total),
            sorter: (a, b) => Number(a.total || 0) - Number(b.total || 0),
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={statusColors[status] || 'default'}>
                    {statusLabels[status] || String(status || 'pending').toUpperCase()}
                </Tag>
            ),
            sorter: (a, b) => (a.status || '').localeCompare(b.status || ''),
            width: 120,
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            openOrder(record);
                        }}
                    >
                        Ver / editar
                    </Button>
                    <Popconfirm
                        title="¿Está seguro de eliminar este pedido?"
                        onConfirm={() => onDelete(record)}
                        okText="Sí"
                        cancelText="No"
                    >
                        <Button
                            icon={<DeleteOutlined />}
                            size="small"
                            danger
                            onClick={(e) => e.stopPropagation()}
                        />
                    </Popconfirm>
                </Space>
            ),
            width: 180,
        },
    ];

    const MobileOrderCard = ({ order }) => (
        <Card
            size="small"
            style={{ marginBottom: 12, cursor: 'pointer' }}
            styles={{ body: { padding: '12px' } }}
            onClick={() => openOrder(order)}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: '13px' }}>{order.orderId || 'Sin ID'}</Text>
                    <div style={{ marginTop: 4 }}>
                        <Tag color={statusColors[order.status] || 'default'} style={{ fontSize: '11px' }}>
                            {statusLabels[order.status] || String(order.status || 'pending').toUpperCase()}
                        </Tag>
                    </div>
                </div>
                <Text strong style={{ fontSize: '15px', color: '#1677ff' }}>
                    {formatCurrency(order.total)}
                </Text>
            </div>

            <div style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: '13px', display: 'block' }}>
                    {order.customerInfo?.name || 'Sin cliente'}
                </Text>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                    {order.customerInfo?.email || 'Sin email'}
                </Text>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        openOrder(order);
                    }}
                >
                    Ver / editar
                </Button>
                <Popconfirm
                    title="¿Eliminar pedido?"
                    onConfirm={() => onDelete(order)}
                    okText="Sí"
                    cancelText="No"
                >
                    <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                        onClick={(e) => e.stopPropagation()}
                    />
                </Popconfirm>
            </div>
        </Card>
    );

    if (isMobile) {
        return (
            <div>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Text type="secondary">Cargando...</Text>
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Text type="secondary">No hay pedidos</Text>
                    </div>
                ) : (
                    orders.map(order => (
                        <MobileOrderCard key={order.orderId} order={order} />
                    ))
                )}
            </div>
        );
    }

    return (
        <Table
            columns={columns}
            dataSource={orders}
            rowKey="orderId"
            loading={loading}
            pagination={{ pageSize: 10 }}
        />
    );
};

export default OrdersTable;

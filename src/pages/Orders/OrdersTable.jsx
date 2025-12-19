import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Popconfirm, Card, Typography } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

const OrdersTable = ({ orders, loading, statusColors, onShowDetail, onEdit, onDelete }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Vista de tabla para desktop
    const columns = [
        {
            title: 'ID Pedido',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 150,
            sorter: (a, b) => a.orderId.localeCompare(b.orderId),
            defaultSortOrder: 'ascend',
        },
        {
            title: 'Cliente',
            key: 'customer',
            render: (_, record) => (
                <div>
                    <div>{record.customerInfo.cliente}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        {record.customerInfo.email}
                    </div>
                </div>
            ),
            sorter: (a, b) =>
                a.customerInfo.cliente.localeCompare(b.customerInfo.cliente),
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            width: 100,
            render: (total) => `$${total.toLocaleString()}`,
            sorter: (a, b) => a.total - b.total,
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={statusColors[status] || 'default'}>
                    {status.toUpperCase()}
                </Tag>
            ),
            sorter: (a, b) => a.status.localeCompare(b.status),
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
                        onClick={() => onShowDetail(record)}
                    />
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => onEdit(record)}
                    />
                    <Popconfirm
                        title="¿Está seguro de eliminar este pedido?"
                        onConfirm={() => onDelete(record.orderId)}
                        okText="Sí"
                        cancelText="No"
                    >
                        <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>
                </Space>
            ),
            width: 120,
        },
    ];

    // Vista de cards para móvil
    const MobileOrderCard = ({ order }) => (
        <Card
            size="small"
            style={{ marginBottom: 12 }}
            styles={{ body: { padding: '12px' } }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: '13px' }}>{order.orderId}</Text>
                    <div style={{ marginTop: 4 }}>
                        <Tag color={statusColors[order.status] || 'default'} style={{ fontSize: '11px' }}>
                            {order.status.toUpperCase()}
                        </Tag>
                    </div>
                </div>
                <Text strong style={{ fontSize: '15px', color: '#1677ff' }}>
                    ${order.total.toLocaleString()}
                </Text>
            </div>

            <div style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: '13px', display: 'block' }}>
                    {order.customerInfo.cliente}
                </Text>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                    {order.customerInfo.email}
                </Text>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={() => onShowDetail(order)}
                >
                    Ver
                </Button>
                <Button
                    icon={<EditOutlined />}
                    size="small"
                    onClick={() => onEdit(order)}
                />
                <Popconfirm
                    title="¿Eliminar pedido?"
                    onConfirm={() => onDelete(order.orderId)}
                    okText="Sí"
                    cancelText="No"
                >
                    <Button icon={<DeleteOutlined />} size="small" danger />
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
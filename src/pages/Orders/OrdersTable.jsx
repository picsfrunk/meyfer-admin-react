import React from 'react';
import { Table, Button, Space, Tag, Popconfirm } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const OrdersTable = ({ orders, loading, statusColors, onShowDetail, onEdit, onDelete }) => {
    const columns = [
        {
            title: 'ID Pedido',
            dataIndex: 'orderId',
            key: 'orderId',
            render: (_, record) => (
                <Button type="link" onClick={() => onShowDetail(record)} style={{ padding: 0 }}>
                    {record.orderId}
                </Button>
            ),
        },
        {
            title: 'Cliente',
            key: 'customer',
            render: (_, r) => (
                <div>
                    <div>{r.customerInfo.cliente}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{r.customerInfo.email}</div>
                </div>
            ),
        },
        {
            title: 'Total',
            dataIndex: 'total',
            render: (t) => `$${t.toLocaleString()}`,
            width: 100,
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            render: (s) => <Tag color={statusColors[s] || 'default'}>{s.toUpperCase()}</Tag>,
            width: 100,
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_, r) => (
                <Space size="small">
                    <Button icon={<EyeOutlined />} size="small" onClick={() => onShowDetail(r)} />
                    <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(r)} />
                    <Popconfirm
                        title="¿Está seguro de eliminar este pedido?"
                        onConfirm={() => onDelete(r.orderId)}
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

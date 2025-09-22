import React from 'react';
import { Table, Button, Space, Tag, Popconfirm } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const OrdersTable = ({ orders, loading, statusColors, onShowDetail, onEdit, onDelete }) => {
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

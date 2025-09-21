import React from 'react';
import { Modal, Descriptions, Tag, Table, Typography, Space, Button } from 'antd';

const { Title, Text } = Typography;

const OrderDetailModal = ({ visible, order, statusColors, onClose, onQuickStatusUpdate }) => {
    if (!order) return null;

    const columns = [
        { title: 'ID', dataIndex: ['productCartItem', 'product_id'], width: 80 },
        {
            title: 'Producto',
            dataIndex: ['productCartItem', 'display_name'],
            render: (name, r) => (
                <div>
                    <div>{name}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>
                        {r.productCartItem.brand} | {r.productCartItem.category_name}
                    </div>
                </div>
            ),
        },
        {
            title: 'Cantidad',
            dataIndex: 'qty',
            width: 80,
            render: (q, r) => `${q} ${r.productCartItem.base_unit_name}`,
        },
        {
            title: 'Precio Unit.',
            dataIndex: ['productCartItem', 'list_price'],
            render: (p) => `$${p.toLocaleString()}`,
            width: 120,
        },
        {
            title: 'Subtotal',
            render: (_, r) => `$${(r.qty * r.productCartItem.list_price).toLocaleString()}`,
            width: 120,
        },
    ];

    return (
        <Modal title="Detalle del Pedido" open={visible} onCancel={onClose} footer={null} width={700}>
            <Descriptions column={2} bordered>
                <Descriptions.Item label="ID Pedido" span={2}>{order.orderId}</Descriptions.Item>
                <Descriptions.Item label="Cliente">{order.customerInfo.cliente}</Descriptions.Item>
                <Descriptions.Item label="Email">{order.customerInfo.email}</Descriptions.Item>
                <Descriptions.Item label="Estado">
                    <Tag color={statusColors[order.status] || 'default'}>
                        {order.status.toUpperCase()}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Total">${order.total.toLocaleString()}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
                <Title level={4}>Productos</Title>
                <Table
                    size="small"
                    dataSource={order.cartItems}
                    rowKey={(i, idx) => `${i.productCartItem.product_id}-${idx}`}
                    pagination={false}
                    columns={columns}
                />
            </div>

            <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Cambiar Estado:</Text>
                <Space wrap>
                    <Button type="primary" onClick={() => onQuickStatusUpdate(order.orderId, 'procesado')}>
                        PROCESADO
                    </Button>
                    <Button
                        onClick={() => onQuickStatusUpdate(order.orderId, 'enviado')}
                        style={{ backgroundColor: 'DeepSkyBlue', color: 'white' }}
                    >
                        ENVIADO
                    </Button>
                    <Button
                        onClick={() => onQuickStatusUpdate(order.orderId, 'entregado')}
                        style={{ backgroundColor: 'MediumSeaGreen', color: 'white' }}
                    >
                        ENTREGADO
                    </Button>
                </Space>
            </div>
        </Modal>
    );
};

export default OrderDetailModal;

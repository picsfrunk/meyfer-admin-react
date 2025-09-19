import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    Typography,
    Tag,
    Modal,
    Form,
    Input,
    Select,
    message,
    Popconfirm,
    Descriptions
} from 'antd';
import {
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    FileTextOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { ordersAPI } from '../services/api';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [form] = Form.useForm();

    const statusColors = {
        'pendiente': 'orange',
        'procesado': 'blue',
        'enviado': 'green',
        'entregado': 'success',
        'cancelado': 'red'
    };

    const loadOrders = async () => {
        setLoading(true);
        try {
            const response = await ordersAPI.getAll();
            setOrders(response.data);
        } catch (error) {
            message.error('Error al cargar los pedidos');
            console.error('Error loading orders:', error);
        }
        setLoading(false);
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await ordersAPI.updateStatus(orderId, newStatus);
            message.success('Estado actualizado correctamente');
            loadOrders();
        } catch (error) {
            message.error('Error al actualizar el estado');
            console.error('Error updating status:', error);
        }
    };

    const handleDelete = async (orderId) => {
        try {
            await ordersAPI.delete(orderId);
            message.success('Pedido eliminado correctamente');
            loadOrders();
        } catch (error) {
            message.error('Error al eliminar el pedido');
            console.error('Error deleting order:', error);
        }
    };

    const handleEdit = (order) => {
        setSelectedOrder(order);
        form.setFieldsValue({
            customerName: order.customerInfo.nombre,
            customerEmail: order.customerInfo.email,
            address: order.address,
            status: order.status,
            total: order.total
        });
        setModalVisible(true);
    };

    const handleUpdate = async (values) => {
        try {
            const updatedOrder = {
                customerInfo: {
                    nombre: values.customerName,
                    email: values.customerEmail
                },
                address: values.address,
                status: values.status,
                total: values.total,
                items: selectedOrder.items // Mantenemos los items existentes
            };

            await ordersAPI.update(selectedOrder.orderId, updatedOrder);
            message.success('Pedido actualizado correctamente');
            setModalVisible(false);
            loadOrders();
        } catch (error) {
            message.error('Error al actualizar el pedido');
            console.error('Error updating order:', error);
        }
    };

    const showOrderDetail = (order) => {
        setSelectedOrder(order);
        setDetailModalVisible(true);
    };

    const columns = [
        {
            title: 'ID Pedido',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 150,
        },
        {
            title: 'Cliente',
            key: 'customer',
            render: (_, record) => (
                <div>
                    <div>{record.customerInfo.nombre}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        {record.customerInfo.email}
                    </div>
                </div>
            ),
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            render: (total) => `${total.toLocaleString()}`,
            width: 100,
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
            width: 100,
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => showOrderDetail(record)}
                    />
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="¿Está seguro de eliminar este pedido?"
                        onConfirm={() => handleDelete(record.orderId)}
                        okText="Sí"
                        cancelText="No"
                    >
                        <Button
                            icon={<DeleteOutlined />}
                            size="small"
                            danger
                        />
                    </Popconfirm>
                </Space>
            ),
            width: 120,
        },
    ];

    useEffect(() => {
        loadOrders();
    }, []);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={2}>Gestión de Pedidos</Title>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={loadOrders}
                    loading={loading}
                >
                    Actualizar
                </Button>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={orders}
                    rowKey="orderId"
                    loading={loading}
                    pagination={{
                        total: orders.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total: ${total} pedidos`
                    }}
                />
            </Card>

            {/* Modal de edición */}
            <Modal
                title="Editar Pedido"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdate}
                >
                    <Form.Item
                        label="Nombre del Cliente"
                        name="customerName"
                        rules={[{ required: true, message: 'El nombre es requerido' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Email del Cliente"
                        name="customerEmail"
                        rules={[
                            { required: true, message: 'El email es requerido' },
                            { type: 'email', message: 'Formato de email inválido' }
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Dirección"
                        name="address"
                        rules={[{ required: true, message: 'La dirección es requerida' }]}
                    >
                        <TextArea rows={3} />
                    </Form.Item>

                    <Form.Item
                        label="Estado"
                        name="status"
                        rules={[{ required: true, message: 'El estado es requerido' }]}
                    >
                        <Select>
                            <Option value="pendiente">Pendiente</Option>
                            <Option value="procesado">Procesado</Option>
                            <Option value="enviado">Enviado</Option>
                            <Option value="entregado">Entregado</Option>
                            <Option value="cancelado">Cancelado</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Total"
                        name="total"
                        rules={[{ required: true, message: 'El total es requerido' }]}
                    >
                        <Input type="number" addonBefore="$" />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                Actualizar
                            </Button>
                            <Button onClick={() => setModalVisible(false)}>
                                Cancelar
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal de detalle */}
            <Modal
                title="Detalle del Pedido"
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={700}
            >
                {selectedOrder && (
                    <div>
                        <Descriptions column={2} bordered>
                            <Descriptions.Item label="ID Pedido" span={2}>
                                {selectedOrder.orderId}
                            </Descriptions.Item>
                            <Descriptions.Item label="Cliente">
                                {selectedOrder.customerInfo.nombre}
                            </Descriptions.Item>
                            <Descriptions.Item label="Email">
                                {selectedOrder.customerInfo.email}
                            </Descriptions.Item>
                            <Descriptions.Item label="Estado">
                                <Tag color={statusColors[selectedOrder.status] || 'default'}>
                                    {selectedOrder.status.toUpperCase()}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Total">
                                ${selectedOrder.total.toLocaleString()}
                            </Descriptions.Item>
                            <Descriptions.Item label="Dirección" span={2}>
                                {selectedOrder.address}
                            </Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginTop: 16 }}>
                            <Title level={4}>Productos</Title>
                            <Table
                                size="small"
                                dataSource={selectedOrder.items}
                                rowKey="product_id"
                                pagination={false}
                                columns={[
                                    { title: 'ID', dataIndex: 'product_id', width: 80 },
                                    { title: 'Producto', dataIndex: 'name' },
                                    { title: 'Cantidad', dataIndex: 'qty', width: 80 },
                                    {
                                        title: 'Precio Unit.',
                                        dataIndex: 'price',
                                        render: (price) => `${price}`,
                                        width: 100
                                    },
                                    {
                                        title: 'Subtotal',
                                        render: (_, record) => `${record.qty * record.price}`,
                                        width: 100
                                    }
                                ]}
                            />
                        </div>

                        <div style={{ marginTop: 16, textAlign: 'center' }}>
                            <Space>
                                <Button onClick={() => handleStatusUpdate(selectedOrder.orderId, 'procesado')}>
                                    Marcar Procesado
                                </Button>
                                <Button onClick={() => handleStatusUpdate(selectedOrder.orderId, 'enviado')}>
                                    Marcar Enviado
                                </Button>
                                <Button onClick={() => handleStatusUpdate(selectedOrder.orderId, 'entregado')}>
                                    Marcar Entregado
                                </Button>
                            </Space>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Orders;
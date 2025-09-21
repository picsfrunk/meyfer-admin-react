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
    Descriptions,
    Checkbox,
} from 'antd';
import {
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { ordersAPI } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const [selectedStatuses, setSelectedStatuses] = useState(['pending']);
    const [showDeleted, setShowDeleted] = useState(false);
    const [allSelected, setAllSelected] = useState(false); // Nuevo estado
    const [form] = Form.useForm();

    const statusColors = {
        todos: 'geekblue',
        pending: 'orange',
        procesado: 'blue',
        enviado: 'cyan',
        entregado: 'LightGreen',
        cancelado: 'red',
        deleted: 'gray',
    };

    const statusOptions = [
        { key: 'todos', label: 'Todos', color: 'geekblue' },
        { key: 'pending', label: 'Pendiente', color: 'orange' },
        { key: 'procesado', label: 'Procesado', color: 'cyan' },
        { key: 'enviado', label: 'Enviado', color: 'green' },
        { key: 'entregado', label: 'Entregado', color: 'success' },
        { key: 'cancelado', label: 'Cancelado', color: 'red' },
    ];

    /**
     * Carga pedidos filtrando por estados y opcionalmente incluyendo eliminados
     */
    const loadOrders = async (
        statusFilters = ['pending'],
        includeDeleted = false,
        all = false
    ) => {
        setLoading(true);
        try {
            let statusesToFetch = [...statusFilters];

            if (all) {
                statusesToFetch = ['pending', 'procesado', 'enviado', 'entregado', 'cancelado'];
            }

            if (includeDeleted) {
                statusesToFetch.push('deleted');
            }

            let query = '';
            if (statusesToFetch.length > 0) {
                query = `?status=${encodeURIComponent(statusesToFetch.join(','))}`;
            }

            const { data } = await ordersAPI.getAll(`/orders${query}`);
            setOrders(data);
        } catch (error) {
            console.error('Error loading orders:', error);
            message.error('Error al cargar los pedidos');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async (statusKey) => {
        if (statusKey === 'todos') {
            // Al activar "Todos", desactiva los otros filtros
            const newAllSelected = !allSelected;
            setAllSelected(newAllSelected);
            setSelectedStatuses([]); // Limpia los demás
            await loadOrders([], showDeleted, newAllSelected);
            return;
        }

        setAllSelected(false);
        const newSelectedStatuses = selectedStatuses.includes(statusKey)
            ? selectedStatuses.filter((s) => s !== statusKey)
            : [...selectedStatuses, statusKey];

        setSelectedStatuses(newSelectedStatuses);
        await loadOrders(newSelectedStatuses, showDeleted, false);
    };



    const handleDeletedToggle = async (e) => {
        const checked = e.target.checked;
        setShowDeleted(checked);
        await loadOrders(selectedStatuses, checked, allSelected);
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await ordersAPI.updateStatus(orderId, newStatus);
            message.success('Estado actualizado correctamente');
            await loadOrders(selectedStatuses, showDeleted, allSelected);
        } catch (error) {
            message.error('Error al actualizar el estado');
            console.error('Error updating status:', error);
        }
    };

    const handleDelete = async (orderId) => {
        try {
            await ordersAPI.delete(orderId);
            message.success('Pedido eliminado correctamente');
            await loadOrders(selectedStatuses, showDeleted, allSelected);
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
            total: order.total,
        });
        setModalVisible(true);
    };

    const handleUpdate = async (values) => {
        try {
            const updatedOrder = {
                customerInfo: {
                    nombre: values.customerName,
                    email: values.customerEmail,
                },
                address: values.address,
                status: values.status,
                total: values.total,
                items: selectedOrder.items,
            };

            await ordersAPI.update(selectedOrder.orderId, updatedOrder);
            message.success('Pedido actualizado correctamente');
            setModalVisible(false);
            await loadOrders(selectedStatuses, showDeleted, allSelected);
        } catch (error) {
            message.error('Error al actualizar el pedido');
            console.error('Error updating order:', error);
        }
    };

    const showOrderDetail = (order) => {
        setSelectedOrder(order);
        setDetailModalVisible(true);
    };

    const handleQuickStatusUpdate = async (orderId, newStatus) => {
        await handleStatusUpdate(orderId, newStatus);
        setDetailModalVisible(false);
    };

    const handleCancelOrder = async (orderId) => {
        await handleQuickStatusUpdate(orderId, 'cancelado');
    };

    const columns = [
        {
            title: 'ID Pedido',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 150,
            render: (orderId, record) => (
                <Button
                    type="link" // se ve como texto clickeable
                    onClick={() => showOrderDetail(record)}
                    style={{ padding: 0 }}
                >
                    {orderId}
                </Button>
            ),
        },
        {
            title: 'Cliente',
            key: 'customer',
            render: (_, record) => (
                <div>
                    <div>{record.customerInfo.nombre}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        {record.customerInfo.cliente}
                    </div>
                </div>
            ),
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            render: (total) => `$${total.toLocaleString()}`,
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
                        <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>
                </Space>
            ),
            width: 120,
        },
    ];

    useEffect(() => {
        loadOrders(['pending'], false, false);
        }, []);

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                }}
            >
                <Title level={2}>Gestión de Pedidos</Title>
                <Space>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => loadOrders(selectedStatuses, showDeleted, allSelected)}
                        loading={loading}
                    >
                        Actualizar
                    </Button>
                </Space>
            </div>

            <Card style={{ marginBottom: 16 }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 16,
                    }}
                >
                    <Text strong>Filtrar por Estado:</Text>
                    <Checkbox checked={showDeleted} onChange={handleDeletedToggle}>
                        Mostrar Eliminados
                    </Checkbox>
                </div>
                <Space wrap>
                    {statusOptions.map((status) => (
                        <Tag.CheckableTag
                            key={status.key}
                            checked={
                                status.key === 'todos'
                                    ? allSelected
                                    : selectedStatuses.includes(status.key)
                            }
                            onChange={() => handleStatusToggle(status.key)}
                            color={
                                status.key === 'todos'
                                    ? allSelected
                                        ? status.color
                                        : 'default'
                                    : selectedStatuses.includes(status.key)
                                        ? status.color
                                        : 'default'
                            }
                        >
                            {status.label}
                        </Tag.CheckableTag>
                    ))}
                </Space>
            </Card>

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
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} de ${total} pedidos${
                                allSelected || selectedStatuses.length > 0 || showDeleted
                                    ? ' (filtrados)'
                                    : ''
                            }`,
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
                <Form form={form} layout="vertical" onFinish={handleUpdate}>
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
                            { type: 'email', message: 'Formato de email inválido' },
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
                            <Button onClick={() => setModalVisible(false)}>Cancelar</Button>
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
                                        render: (price) => `$${price}`,
                                        width: 100,
                                    },
                                    {
                                        title: 'Subtotal',
                                        render: (_, record) => `$${record.qty * record.price}`,
                                        width: 100,
                                    },
                                ]}
                            />
                        </div>

                        <div style={{ marginTop: 16, textAlign: 'center' }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                Cambiar Estado:
                            </Text>
                            <Space wrap>
                                <Button
                                    size="middle"
                                    type="primary"
                                    onClick={() =>
                                        handleQuickStatusUpdate(selectedOrder.orderId, 'procesado')
                                    }
                                    disabled={selectedOrder.status === 'procesado'}
                                >
                                    PROCESADO
                                </Button>
                                <Button
                                    size="middle"
                                    onClick={() =>
                                        handleQuickStatusUpdate(selectedOrder.orderId, 'enviado')
                                    }
                                    disabled={selectedOrder.status === 'enviado'}
                                    style={{ backgroundColor: 'DeepSkyBlue', color: 'white' }}

                                >
                                    ENVIADO
                                </Button>
                                <Button
                                    size="middle"
                                    onClick={() =>
                                        handleQuickStatusUpdate(selectedOrder.orderId, 'entregado')
                                    }
                                    disabled={selectedOrder.status === 'entregado'}
                                    style={{ backgroundColor: 'MediumSeaGreen', color: 'white' }}

                                >
                                    ENTREGADO
                                </Button>
                            </Space>
                            <div style={{ marginTop: 24, textAlign: 'center' }}>
                                <Button
                                    size="small"
                                    danger
                                    type="primary"
                                    onClick={() => handleCancelOrder(selectedOrder.orderId)}
                                    disabled={selectedOrder.status === 'cancelado'}
                                >
                                    Cancelar Pedido
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Orders;

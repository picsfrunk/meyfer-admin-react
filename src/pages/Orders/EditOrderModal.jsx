import React from 'react';
import { Modal, Form, Input, Select, Button, Space, message } from 'antd';
import { ordersAPI } from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';

const EditOrderModal = ({ visible, order, orderStatuses = [], onClose, onUpdated }) => {
    const [form] = Form.useForm();

    React.useEffect(() => {
        if (order) {
            form.setFieldsValue({
                customerName: order.customerInfo.name,
                customerEmail: order.customerInfo.email,
                status: order.status,
                total: order.total,
            });
        }
    }, [order, form]);

    const handleUpdate = async (values) => {
        try {
            const updatedOrder = {
                customerInfo: { name: values.customerName, email: values.customerEmail },
                status: values.status,
                total: values.total,
                cartItems: order.cartItems,
            };
            await ordersAPI.update(order.orderId, updatedOrder);
            message.success('Pedido actualizado correctamente');
            onClose();
            onUpdated();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al actualizar el pedido'));
        }
    };

    return (
        <Modal title="Editar Pedido" open={visible} onCancel={onClose} footer={null} width={600}>
            <Form form={form} layout="vertical" onFinish={handleUpdate}>
                <Form.Item label="Nombre del Cliente" name="customerName" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Email del Cliente"
                    name="customerEmail"
                    rules={[{ required: true }, { type: 'email' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item label="Estado" name="status" rules={[{ required: true }]}>
                    <Select
                        placeholder="Seleccionar estado"
                        options={orderStatuses.map((status) => ({
                            value: status.key,
                            label: status.label,
                        }))}
                    />
                </Form.Item>
                <Form.Item label="Total" name="total" rules={[{ required: true }]}>
                    <Input type="number" addonBefore="$" />
                </Form.Item>
                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit">Actualizar</Button>
                        <Button onClick={onClose}>Cancelar</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditOrderModal;

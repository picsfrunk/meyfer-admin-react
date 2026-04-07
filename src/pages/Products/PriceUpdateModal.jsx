import React, { useEffect } from 'react';
import { Modal, Form, InputNumber, Button, Space, Typography, Divider, message } from 'antd';
import { productsAPI } from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';

const { Text } = Typography;

const PriceUpdateModal = ({ visible, product, onSave, onCancel }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible && product) {
            form.setFieldsValue({
                newPrice: product.list_price,
            });
        } else if (!visible) {
            form.resetFields();
        }
    }, [visible, product, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (product && product.product_id) {
                // Crear FormData para enviar con multipart/form-data
                const formData = new FormData();
                formData.append('list_price', values.newPrice.toString());

                await productsAPI.update(product.product_id, formData);
                message.success('Precio actualizado exitosamente');
                onSave();
            }
        } catch (error) {
            console.error('Error updating price:', error);
            message.error(getApiErrorMessage(error, 'Error al actualizar el precio'));
        }
    };

    const currentPrice = product?.list_price || 0;
    const newPrice = form.getFieldValue('newPrice') || currentPrice;
    const priceChange = newPrice - currentPrice;
    const percentageChange =
        currentPrice > 0
            ? ((priceChange / currentPrice) * 100).toFixed(2)
            : 0;

    if (!visible) return null;

    return (
        <Modal
            title="Actualizar Precio"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={500}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
            >
                <>
                    <div style={{ marginBottom: 16, padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                        <div style={{ marginBottom: 8 }}>
                            <Text strong>Producto: </Text>
                            <Text>{product.display_name}</Text>
                        </div>
                        <div>
                            <Text strong>ID: </Text>
                            <Text>{product.product_id}</Text>
                        </div>
                    </div>

                    <Divider />

                    <Form.Item
                        label="Precio Lista Actual"
                    >
                        <InputNumber
                            value={currentPrice}
                            disabled
                            prefix="$"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Nuevo Precio Lista"
                        name="newPrice"
                        rules={[
                            { required: true, message: 'El precio es obligatorio' },
                        ]}
                    >
                        <InputNumber
                            min={0}
                            step={0.01}
                            placeholder="0.00"
                            prefix="$"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    {priceChange !== 0 && (
                        <div
                            style={{
                                padding: '12px',
                                backgroundColor:
                                    priceChange > 0 ? '#e6f7ff' : '#f6ffed',
                                borderRadius: '6px',
                                marginBottom: 16,
                            }}
                        >
                            <div>
                                <Text strong>Cambio: </Text>
                                <Text
                                    style={{
                                        color:
                                            priceChange > 0
                                                ? '#1890ff'
                                                : '#52c41a',
                                    }}
                                >
                                    {priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}
                                </Text>
                            </div>
                            <div>
                                <Text type="secondary">
                                    {percentageChange}%
                                </Text>
                            </div>
                        </div>
                    )}
                </>

                <Form.Item>
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button onClick={onCancel}>Cancelar</Button>
                        <Button type="primary" htmlType="submit" disabled={!product}>
                            Actualizar Precio
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default PriceUpdateModal;

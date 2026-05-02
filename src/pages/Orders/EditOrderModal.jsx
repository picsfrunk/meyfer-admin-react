import React from 'react';
import { Modal, Form, Input, Button, Space, message, Divider, Row, Col } from 'antd';
import { ordersAPI } from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';

const emptyAddress = {
    calle: '',
    numero: '',
    piso: '',
    timbre: '',
    entreCalles: '',
    localidad: '',
    partido: '',
};

const emptyDelivery = {
    address: emptyAddress,
    contactName: '',
    contactPhone: '',
    schedule: '',
};

const normalizeDeliveryForForm = (delivery = {}) => ({
    address: {
        ...emptyAddress,
        ...(delivery.address || {}),
    },
    contactName: delivery.contactName || '',
    contactPhone: delivery.contactPhone || '',
    schedule: delivery.schedule || '',
});

const EditOrderModal = ({ visible, order, onClose, onUpdated }) => {
    const [form] = Form.useForm();
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        if (!visible || !order) {
            form.resetFields();
            return;
        }

        const delivery = normalizeDeliveryForForm(order.delivery);

        form.setFieldsValue({
            delivery,
        });
    }, [visible, order, form]);

    const handleUpdate = async (values) => {
        if (!order?.orderId) {
            message.error('No se encontró el identificador del pedido');
            return;
        }

        const delivery = normalizeDeliveryForForm(values.delivery);

        try {
            setSaving(true);

            await ordersAPI.updateDelivery(order.orderId, delivery);

            message.success('Datos de entrega actualizados correctamente');

            onClose();

            if (typeof onUpdated === 'function') {
                await onUpdated();
            }
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al actualizar los datos de entrega'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            title={`Editar entrega${order?.orderId ? ` — ${order.orderId}` : ''}`}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={760}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={handleUpdate}>
                <Divider orientation="left">Dirección de entrega</Divider>

                <Row gutter={16}>
                    <Col xs={24} md={16}>
                        <Form.Item label="Calle" name={['delivery', 'address', 'calle']}>
                            <Input placeholder="Calle" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                        <Form.Item label="Número" name={['delivery', 'address', 'numero']}>
                            <Input placeholder="Número" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Form.Item label="Piso" name={['delivery', 'address', 'piso']}>
                            <Input placeholder="Piso" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                        <Form.Item label="Timbre" name={['delivery', 'address', 'timbre']}>
                            <Input placeholder="Timbre" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                        <Form.Item label="Entre calles" name={['delivery', 'address', 'entreCalles']}>
                            <Input placeholder="Entre calles" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item label="Localidad" name={['delivery', 'address', 'localidad']}>
                            <Input placeholder="Localidad" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Partido" name={['delivery', 'address', 'partido']}>
                            <Input placeholder="Partido" />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left">Contacto de entrega</Divider>

                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item label="Contacto" name={['delivery', 'contactName']}>
                            <Input placeholder="Nombre de contacto" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Teléfono" name={['delivery', 'contactPhone']}>
                            <Input placeholder="Teléfono de contacto" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item label="Horario de entrega" name={['delivery', 'schedule']}>
                    <Input.TextArea
                        rows={2}
                        placeholder="Ej: Lunes a viernes de 9 a 13"
                    />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                    <Space>
                        <Button type="primary" htmlType="submit" loading={saving}>
                            Guardar datos de entrega
                        </Button>

                        <Button onClick={onClose} disabled={saving}>
                            Cancelar
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditOrderModal;
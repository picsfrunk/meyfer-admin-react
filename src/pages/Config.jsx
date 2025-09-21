import React, { useState, useEffect } from 'react';
import {
    Card,
    Form,
    InputNumber,
    Button,
    Typography,
    Statistic,
    Row,
    Col,
    Divider,
    message
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { configAPI } from '../services/api';

const { Title, Text } = Typography;

const Config = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [margin, setMargin] = useState(null);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const profitRes = await configAPI.getProfit();

            const marginValue = profitRes.data.margin;
            setMargin(marginValue);
            form.setFieldsValue({ margin: marginValue });

        } catch (error) {
            message.error('Error al cargar la configuración');
            console.error('Error loading config:', error);
        }
        setLoading(false);
    };

    const handleUpdateMargin = async (values) => {
        setLoading(true);
        try {
            await configAPI.updateProfit(values.margin);
            setMargin(values.margin);
            message.success('Margen de ganancia actualizado correctamente');
        } catch (error) {
            message.error('Error al actualizar el margen de ganancia');
            console.error('Error updating margin:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadConfig();
    }, []);


    return (
        <div>
            <Title level={2}>Configuración del Sistema</Title>

            <Row gutter={[16, 16]} justify="start">
                <Col span={24} md={16} lg={12}>
                    <Card title="Margen de Ganancia" loading={loading}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleUpdateMargin}
                        >
                            <Form.Item
                                label="Margen de ganancia (%)"
                                name="margin"
                                rules={[
                                    { required: true, message: 'El margen es requerido' },
                                    { type: 'number', min: 0, max: 1000, message: 'El margen debe estar entre 0% y 1000%' }
                                ]}
                                help="Porcentaje de ganancia aplicado al precio base (ej: 27 = 27% de ganancia)"
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    step={0.1}
                                    precision={1}
                                    addonAfter="%"
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    icon={<SaveOutlined />}
                                    block
                                >
                                    Actualizar Margen
                                </Button>
                            </Form.Item>
                        </Form>

                        {margin !== null && (
                            <>
                                <Divider />
                                <Statistic
                                    title="Margen Actual"
                                    value={margin}
                                    precision={1}
                                    suffix="%"
                                />
                                <Text type="secondary">
                                    Multiplicador: {(1 + margin / 100).toFixed(2)}x
                                </Text>
                            </>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Config;
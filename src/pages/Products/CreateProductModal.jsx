import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Space, Switch, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { productsAPI } from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';

const CreateProductModal = ({ visible, onSave, onCancel }) => {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [fileList, setFileList] = useState([]);

    useEffect(() => {
        if (visible) {
            loadCategories();
        }
    }, [visible]);

    useEffect(() => {
        if (!visible) {
            form.resetFields();
            setFileList([]);
        }
    }, [visible, form]);

    const loadCategories = async () => {
        try {
            const response = await productsAPI.getCategories();
            const categoriesData = response?.data?.categories;
            if (!Array.isArray(categoriesData)) {
                setCategories([]);
                message.error('Formato inválido al cargar categorías');
                return;
            }

            setCategories(
                categoriesData.map((category) => ({
                    label: category.category_name,
                    value: category.category_name,
                }))
            );
        } catch (error) {
            console.error('Error loading categories:', error);
            setCategories([]);
            message.error(getApiErrorMessage(error, 'Error al cargar categorías'));
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            // Crear FormData para enviar con multipart/form-data
            const formData = new FormData();

            // Agregar campos requeridos
            formData.append('product_id', values.product_id);
            formData.append('display_name', values.display_name);
            formData.append('base_unit_name', values.base_unit_name);
            formData.append('category_id', values.category_id || 1); // Default category_id if not provided
            formData.append('list_price', values.list_price.toString());

            // Agregar campos opcionales si existen
            if (values.category_name) formData.append('category_name', values.category_name);
            if (values.brand) formData.append('brand', values.brand);
            if (values.image_url) formData.append('image_url', values.image_url);

            // Agregar imagen si existe
            if (fileList.length > 0) {
                formData.append('image', fileList[0].originFileObj);
            }

            await productsAPI.create(formData);
            message.success('Producto creado exitosamente');
            onSave();
        } catch (error) {
            console.error('Error creating product:', error);
            message.error(getApiErrorMessage(error, 'Error al crear el producto'));
        }
    };

    const uploadProps = {
        onRemove: (file) => {
            setFileList([]);
        },
        beforeUpload: (file) => {
            const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
            const isValidSize = file.size / 1024 / 1024 < 5; // 5MB

            if (!isValidType) {
                message.error('Solo se permiten archivos JPG, PNG o WebP');
                return false;
            }
            if (!isValidSize) {
                message.error('La imagen debe ser menor a 5MB');
                return false;
            }

            setFileList([file]);
            return false; // Prevent auto upload
        },
        fileList,
    };

    return (
        <Modal
            title="Crear Nuevo Producto"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
            >
                <Form.Item
                    label="ID Producto"
                    name="product_id"
                    rules={[
                        { required: true, message: 'El ID del producto es obligatorio' },
                    ]}
                >
                    <Input placeholder="Ej: MANUAL-001" />
                </Form.Item>

                <Form.Item
                    label="Nombre del Producto"
                    name="display_name"
                    rules={[
                        { required: true, message: 'El nombre es obligatorio' },
                    ]}
                >
                    <Input placeholder="Nombre del producto" />
                </Form.Item>

                <Form.Item
                    label="Unidad Base"
                    name="base_unit_name"
                    rules={[
                        { required: true, message: 'La unidad base es obligatoria' },
                    ]}
                >
                    <Select placeholder="Selecciona unidad">
                        <Select.Option value="unidad">Unidad</Select.Option>
                        <Select.Option value="kg">Kilogramo</Select.Option>
                        <Select.Option value="caja x12">Caja x12</Select.Option>
                        <Select.Option value="litro">Litro</Select.Option>
                        <Select.Option value="metro">Metro</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label="ID Categoría"
                    name="category_id"
                    rules={[
                        { required: true, message: 'El ID de categoría es obligatorio' },
                    ]}
                >
                    <InputNumber
                        min={1}
                        placeholder="Ej: 5"
                        style={{ width: '100%' }}
                    />
                </Form.Item>

                <Form.Item
                    label="Categoría"
                    name="category_name"
                >
                    <Select options={categories} placeholder="Selecciona una categoría" />
                </Form.Item>

                <Form.Item
                    label="Marca"
                    name="brand"
                >
                    <Input placeholder="Marca del producto" />
                </Form.Item>

                <Form.Item
                    label="Precio Lista"
                    name="list_price"
                    rules={[
                        { required: true, message: 'El precio lista es obligatorio' },
                    ]}
                >
                    <InputNumber
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        style={{ width: '100%' }}
                        prefix="$"
                    />
                </Form.Item>

                <Form.Item
                    label="URL de Imagen (opcional)"
                    name="image_url"
                >
                    <Input placeholder="https://ejemplo.com/imagen.jpg" />
                </Form.Item>

                <Form.Item
                    label="Imagen del Producto (opcional)"
                >
                    <Upload {...uploadProps} maxCount={1}>
                        <Button icon={<UploadOutlined />}>Seleccionar Imagen</Button>
                    </Upload>
                    <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                        Formatos: JPG, PNG, WebP. Máximo 5MB.
                    </div>
                </Form.Item>

                <Form.Item>
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button onClick={onCancel}>Cancelar</Button>
                        <Button type="primary" htmlType="submit">
                            Crear Producto
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateProductModal;

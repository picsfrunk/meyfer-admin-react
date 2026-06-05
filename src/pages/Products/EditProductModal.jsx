import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Space, Upload, message, Image, Empty, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { productsAPI } from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';

const { Text } = Typography;

const getProductImageUrl = (product) => (
    product?.image_url
    || product?.imageUrl
    || product?.original_image_url
    || product?.thumbnail_url
    || product?.image
    || ''
);

const EditProductModal = ({ visible, product, onSave, onCancel }) => {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [fileList, setFileList] = useState([]);
    const [imageLoadError, setImageLoadError] = useState(false);
    const watchedImageUrl = Form.useWatch('image_url', form);
    const currentImageUrl = watchedImageUrl !== undefined ? watchedImageUrl : getProductImageUrl(product);

    useEffect(() => {
        if (visible) {
            loadCategories();
        }
    }, [visible]);

    useEffect(() => {
        if (visible && product) {
            form.setFieldsValue({
                product_id: product.product_id,
                display_name: product.display_name,
                base_unit_name: product.base_unit_name,
                category_id: product.category_id,
                category_name: product.category_name,
                brand: product.brand,
                list_price: product.list_price,
                image_url: product.image_url,
            });
            setFileList([]); // Reset file list when opening modal
            setImageLoadError(false);
        } else if (!visible) {
            form.resetFields();
            setFileList([]);
            setImageLoadError(false);
        }
    }, [visible, product, form]);

    useEffect(() => {
        setImageLoadError(false);
    }, [currentImageUrl]);

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

            // Agregar campos editables
            if (values.display_name !== undefined) formData.append('display_name', values.display_name);
            if (values.base_unit_name !== undefined) formData.append('base_unit_name', values.base_unit_name);
            if (values.category_id !== undefined) formData.append('category_id', values.category_id.toString());
            if (values.category_name !== undefined) formData.append('category_name', values.category_name);
            if (values.brand !== undefined) formData.append('brand', values.brand);
            if (values.list_price !== undefined) formData.append('list_price', values.list_price.toString());
            if (values.image_url !== undefined) formData.append('image_url', values.image_url);

            // Agregar imagen si existe
            if (fileList.length > 0) {
                formData.append('image', fileList[0].originFileObj);
            }

            await productsAPI.update(product.product_id, formData);
            message.success('Producto actualizado exitosamente');
            onSave();
        } catch (error) {
            console.error('Error updating product:', error);
            message.error(getApiErrorMessage(error, 'Error al actualizar el producto'));
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

    if (!visible) return null;

    return (
        <Modal
            title="Editar Producto"
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
                <div style={{
                    marginBottom: 20,
                    padding: 12,
                    border: '1px solid #f0f0f0',
                    borderRadius: 6,
                    background: '#fafafa',
                }}>
                    <Text strong>Imagen actual del producto</Text>
                    <div style={{
                        marginTop: 10,
                        minHeight: 180,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 6,
                        background: '#fff',
                        overflow: 'hidden',
                    }}>
                        {currentImageUrl && !imageLoadError ? (
                            <Image
                                src={currentImageUrl}
                                alt={product?.display_name || 'Imagen del producto'}
                                style={{
                                    width: '100%',
                                    maxHeight: 220,
                                    objectFit: 'contain',
                                }}
                                onError={() => setImageLoadError(true)}
                            />
                        ) : (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Sin imagen disponible"
                            />
                        )}
                    </div>
                </div>

                <Form.Item
                    label="ID Producto"
                    name="product_id"
                >
                    <Input disabled placeholder="Ej: 2381" />
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
                    label="URL de Imagen"
                    name="image_url"
                >
                    <Input placeholder="https://ejemplo.com/imagen.jpg" />
                </Form.Item>

                <Form.Item
                    label="Nueva Imagen del Producto"
                >
                    <Upload {...uploadProps} maxCount={1}>
                        <Button icon={<UploadOutlined />}>Seleccionar Nueva Imagen</Button>
                    </Upload>
                    <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                        Formatos: JPG, PNG, WebP. Máximo 5MB. Reemplaza la imagen actual.
                    </div>
                </Form.Item>

                <Form.Item>
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button onClick={onCancel}>Cancelar</Button>
                        <Button type="primary" htmlType="submit">
                            Guardar cambios
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditProductModal;

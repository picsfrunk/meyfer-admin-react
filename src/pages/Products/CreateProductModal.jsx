import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Space, Upload, message, Alert, Image } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { productsAPI } from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';

const NO_CATEGORIES_MESSAGE = 'No hay categorías disponibles. Actualizá el catálogo antes de crear productos manuales.';

const normalizeCategoryId = (categoryId) => (
    categoryId === undefined || categoryId === null ? undefined : String(categoryId)
);

const CreateProductModal = ({ visible, onSave, onCancel }) => {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');

    useEffect(() => {
        if (visible) {
            loadCategories();
        }
    }, [visible]);

    useEffect(() => {
        if (!visible) {
            form.resetFields();
            setFileList([]);
            setSelectedImageFile(null);
            setImagePreviewUrl('');
        }
    }, [visible, form]);

    useEffect(() => {
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    const loadCategories = async () => {
        setCategoriesLoading(true);
        try {
            const response = await productsAPI.getCategories();
            const categoriesData = response?.data?.categories;
            if (!Array.isArray(categoriesData)) {
                setCategories([]);
                message.error('Formato inválido al cargar categorías');
                return;
            }

            setCategories(
                categoriesData
                    .filter((category) => normalizeCategoryId(category.category_id))
                    .map((category) => ({
                        label: category.category_name,
                        value: normalizeCategoryId(category.category_id),
                        category_name: category.category_name,
                    }))
            );
        } catch (error) {
            console.error('Error loading categories:', error);
            setCategories([]);
            message.error(getApiErrorMessage(error, 'Error al cargar categorías'));
        } finally {
            setCategoriesLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            if (categories.length === 0) {
                message.error(NO_CATEGORIES_MESSAGE);
                return;
            }

            const values = await form.validateFields();
            const selectedCategory = categories.find((category) => category.value === values.category_id);

            if (!selectedCategory) {
                form.setFields([
                    {
                        name: 'category_id',
                        errors: ['Seleccioná una categoría existente'],
                    },
                ]);
                return;
            }

            // Crear FormData para enviar con multipart/form-data
            const formData = new FormData();

            // Agregar campos requeridos
            formData.append('product_id', values.product_id);
            formData.append('display_name', values.display_name);
            formData.append('base_unit_name', values.base_unit_name);
            formData.append('category_id', selectedCategory.value);
            formData.append('category_name', selectedCategory.category_name);
            formData.append('list_price', values.list_price.toString());

            // Agregar campos opcionales si existen
            if (values.brand) formData.append('brand', values.brand);
            if (values.image_url) formData.append('image_url', values.image_url);

            // Agregar imagen si existe
            if (selectedImageFile) {
                formData.append('image', selectedImageFile);
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
        onRemove: () => {
            setFileList([]);
            setSelectedImageFile(null);
            setImagePreviewUrl('');
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
            setSelectedImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
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
                    label="Categoría"
                    name="category_id"
                    rules={[
                        { required: true, message: 'La categoría es obligatoria' },
                    ]}
                >
                    <Select
                        options={categories}
                        placeholder="Selecciona una categoría"
                        disabled={categoriesLoading || categories.length === 0}
                        loading={categoriesLoading}
                        showSearch
                        optionFilterProp="label"
                        onChange={(value, option) => {
                            form.setFieldValue('category_name', option?.category_name || '');
                        }}
                    />
                </Form.Item>

                <Form.Item name="category_name" hidden>
                    <Input />
                </Form.Item>

                {!categoriesLoading && categories.length === 0 && (
                    <Alert
                        type="warning"
                        message={NO_CATEGORIES_MESSAGE}
                        showIcon
                        style={{ marginBottom: 24 }}
                    />
                )}

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
                    {imagePreviewUrl && (
                        <div style={{ marginTop: 12 }}>
                            <Image
                                src={imagePreviewUrl}
                                alt="Vista previa de la imagen seleccionada"
                                style={{
                                    width: '100%',
                                    maxHeight: 180,
                                    objectFit: 'contain',
                                }}
                            />
                        </div>
                    )}
                    <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                        Formatos: JPG, PNG, WebP. Máximo 5MB.
                    </div>
                </Form.Item>

                <Form.Item>
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button onClick={onCancel}>Cancelar</Button>
                        <Button type="primary" htmlType="submit" disabled={categoriesLoading || categories.length === 0}>
                            Crear Producto
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateProductModal;

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Popconfirm, Card, Typography } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    DollarOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const ProductsTable = ({ products, loading, onEdit, onUpdatePrice, onDelete }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Vista de tabla para desktop
    const columns = [
        {
            title: 'ID Producto',
            dataIndex: 'product_id',
            key: 'product_id',
            width: 120,
            sorter: (a, b) => a.product_id.localeCompare(b.product_id),
        },
        {
            title: 'Nombre',
            dataIndex: 'display_name',
            key: 'display_name',
            render: (display_name, record) => (
                <div>
                    <div>{display_name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        {record.brand && `Marca: ${record.brand}`}
                    </div>
                </div>
            ),
            sorter: (a, b) => a.display_name.localeCompare(b.display_name),
        },
        {
            title: 'Categoría',
            dataIndex: 'category_name',
            key: 'category_name',
            width: 120,
            render: (category_name) => category_name ? <Tag>{category_name}</Tag> : <Tag color="orange">Sin categoría</Tag>,
            sorter: (a, b) => (a.category_name || '').localeCompare(b.category_name || ''),
        },
        {
            title: 'Precio Final',
            dataIndex: 'final_price',
            key: 'final_price',
            width: 120,
            render: (final_price) => `$${final_price.toLocaleString('es-AR')}`,
            sorter: (a, b) => a.final_price - b.final_price,
        },
        {
            title: 'Precio Lista',
            dataIndex: 'list_price',
            key: 'list_price',
            width: 120,
            render: (list_price) => `$${list_price.toLocaleString('es-AR')}`,
            sorter: (a, b) => a.list_price - b.list_price,
        },
        {
            title: 'Tipo',
            dataIndex: 'product_type',
            key: 'product_type',
            width: 100,
            render: (product_type) => <Tag>{product_type}</Tag>,
        },
        {
            title: 'Manual',
            dataIndex: 'isManual',
            key: 'isManual',
            width: 80,
            render: (isManual) => (
                <Tag color={isManual ? 'blue' : 'green'}>
                    {isManual ? 'Manual' : 'Auto'}
                </Tag>
            ),
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space size="small" wrap>
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => onEdit(record)}
                        title="Editar producto"
                    />
                    <Button
                        icon={<DollarOutlined />}
                        size="small"
                        onClick={() => onUpdatePrice(record)}
                        title="Cambiar precio"
                    />
                    <Popconfirm
                        title="¿Eliminar producto?"
                        description="Esta acción no se puede deshacer"
                        onConfirm={() => onDelete(record.product_id)}
                        okText="Sí"
                        cancelText="No"
                    >
                        <Button
                            icon={<DeleteOutlined />}
                            size="small"
                            danger
                            title="Eliminar producto"
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Vista de cards para móvil
    const MobileProductCard = ({ product }) => (
        <Card
            size="small"
            style={{ marginBottom: 12 }}
            styles={{ body: { padding: '12px' } }}
        >
            <div style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 'bold' }}>{product.display_name}</div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    ID: {product.product_id}
                </Text>
                {product.brand && (
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                        Marca: {product.brand}
                    </Text>
                )}
            </div>

            <div style={{ marginBottom: 8, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.category_name && <Tag>{product.category_name}</Tag>}
                <Tag>{product.product_type}</Tag>
                <Tag color={product.isManual ? 'blue' : 'green'}>
                    {product.isManual ? 'Manual' : 'Auto'}
                </Tag>
            </div>

            <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1890ff' }}>
                    Final: ${product.final_price.toLocaleString('es-AR')}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                    Lista: ${product.list_price.toLocaleString('es-AR')}
                </div>
            </div>

            <Space style={{ width: '100%', justifyContent: 'space-around' }}>
                <Button
                    icon={<EditOutlined />}
                    size="small"
                    block
                    onClick={() => onEdit(product)}
                />
                <Button
                    icon={<DollarOutlined />}
                    size="small"
                    block
                    onClick={() => onUpdatePrice(product)}
                />
                <Popconfirm
                    title="¿Eliminar?"
                    onConfirm={() => onDelete(product.product_id)}
                    okText="Sí"
                    cancelText="No"
                >
                    <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        block
                        danger
                    />
                </Popconfirm>
            </Space>
        </Card>
    );

    return isMobile ? (
        <div>
            <h3>=== VISTA MÓVIL ===</h3>
            <p>Productos a mostrar: {products?.length || 0}</p>
            {products && products.length > 0 ? (
                products.map((product) => (
                    <MobileProductCard key={product._id || product.product_id} product={product} />
                ))
            ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    {loading ? 'Cargando productos...' : 'No hay productos disponibles'}
                </div>
            )}
        </div>
    ) : (
        <div>
            <h3>=== VISTA DESKTOP ===</h3>
            <p>Productos a mostrar: {products?.length || 0}</p>
            <Table
                columns={columns}
                dataSource={products}
                loading={loading}
                rowKey="_id"
                pagination={{ pageSize: 10, showSizeChanger: true }}
                scroll={{ x: 1200 }}
                locale={{
                    emptyText: loading ? 'Cargando productos...' : 'No hay productos disponibles'
                }}
            />
        </div>
    );
};

export default ProductsTable;

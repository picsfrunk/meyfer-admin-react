import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, message } from 'antd';
import { ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { productsAPI } from '../../services/api';

import ProductsFilter from './ProductsFilter';
import ProductsTable from './ProductsTable';
import EditProductModal from './EditProductModal';
import PriceUpdateModal from './PriceUpdateModal';
import CreateProductModal from './CreateProductModal';

const { Title } = Typography;

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modales
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [priceModalVisible, setPriceModalVisible] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Filtros
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [priceRange, setPriceRange] = useState([0, 100000]);
    const [searchText, setSearchText] = useState('');

    const loadProducts = async () => {
        setLoading(true);
        try {
            const { data } = await productsAPI.getAll();
            
            // La API devuelve un objeto paginado con la propiedad 'products'
            const productsArray = data.products || [];
            
            setProducts(Array.isArray(productsArray) ? productsArray : []);
        } catch (error) {
            console.error('Error loading products:', error);
            // Fallback to mock data when API is not available
            const mockData = [
                {
                    "_id": "69c2132c5c1c20f06a30391c",
                    "product_id": "2426",
                    "base_unit_name": "Un",
                    "brand": "PRETUL",
                    "category_id": 8,
                    "category_name": "Quimicos",
                    "display_name": "ADHESIVO PARA PVC 100 cc \"PRETUL\"",
                    "final_price": 1993.2000000000003,
                    "image_url": "http://localhost:3099/web/image/product.product/1556/image_1024/mock?unique=abc123",
                    "list_price": 1812,
                    "original_image_url": "http://localhost:3099/web/image/product.product/1556/image_1024/mock?unique=abc123",
                    "product_type": "consu",
                    "source_url": "http://rhcomercial.com.ar/shop/1706-asiento-inodoro-camilo-florencia-amarillo-1556"
                },
                {
                    "_id": "69c2132c5c1c20f06a303937",
                    "product_id": "2382",
                    "base_unit_name": "Un",
                    "brand": "GENOVA",
                    "category_id": 3,
                    "category_name": "Agua",
                    "display_name": "ACOPLE COMP PROF C/TRABA MEC TEE 1/2\" \"GENOVA\"",
                    "final_price": 2622.4,
                    "image_url": "http://localhost:3099/web/image/product.product/1512/image_1024/mock?unique=abc123",
                    "list_price": 2384,
                    "original_image_url": "http://localhost:3099/web/image/product.product/1512/image_1024/mock?unique=abc123",
                    "product_type": "consu",
                    "source_url": "http://rhcomercial.com.ar/shop/1028-acople-compresion-rapido-1-1-4-duke-esp-1512"
                },
                {
                    "_id": "69c213985c1c20f06a30393f",
                    "product_id": "2387",
                    "base_unit_name": "Un",
                    "brand": "TOTAL",
                    "category_id": 3,
                    "category_name": "Agua",
                    "display_name": "VÁLVULA ESFERA PVC 3/8\" \"TOTAL\"",
                    "final_price": 3485.9,
                    "image_url": "http://localhost:3099/web/image/product.product/1517/image_1024/mock?unique=abc123",
                    "list_price": 3169,
                    "original_image_url": "http://localhost:3099/web/image/product.product/1517/image_1024/mock?unique=abc123",
                    "product_type": "consu",
                    "source_url": "http://rhcomercial.com.ar/shop/0936-acople-compresion-rapido-prof-1-2-duke-1517"
                }
            ];
            setProducts(mockData);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProduct = () => {
        setCreateModalVisible(true);
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setEditModalVisible(true);
    };

    const handleSaveCreate = () => {
        // El modal ya maneja la creación del producto y muestra mensajes
        setCreateModalVisible(false);
        loadProducts(); // Recargar la lista de productos
    };

    const handleSaveEdit = () => {
        // El modal ya maneja la edición del producto y muestra mensajes
        setEditModalVisible(false);
        setSelectedProduct(null);
        loadProducts(); // Recargar la lista de productos
    };

    const handleSavePrice = () => {
        // El modal ya maneja la actualización de precio y muestra mensajes
        setPriceModalVisible(false);
        setSelectedProduct(null);
        loadProducts(); // Recargar la lista de productos
    };

    const handleUpdatePrice = (product) => {
        setSelectedProduct(product);
        setPriceModalVisible(true);
    };

    const handleDelete = async (productId) => {
        try {
            await productsAPI.delete(productId);
            setProducts(products.filter((p) => p.product_id !== productId));
            message.success('Producto eliminado correctamente');
        } catch (error) {
            message.error('Error al eliminar el producto');
            console.error(error);
        }
    };

    // Filtrado de productos
    const filteredProducts = products.filter((product) => {
        if (!product) return false;

        const matchesCategory =
            !selectedCategory || selectedCategory === '' || product.category_name === selectedCategory;
        const matchesPrice =
            (product.final_price || 0) >= priceRange[0] && (product.final_price || 0) <= priceRange[1];
        const matchesSearch =
            (product.display_name || '').toLowerCase().includes(searchText.toLowerCase()) ||
            (product.product_id || '').toLowerCase().includes(searchText.toLowerCase()) ||
            (product.brand || '').toLowerCase().includes(searchText.toLowerCase());

        return matchesCategory && matchesPrice && matchesSearch;
    });

    useEffect(() => {
        loadProducts();
    }, []);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={2}>Gestión de Productos</Title>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateProduct}>
                        Nuevo Producto
                    </Button>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={loadProducts}
                        loading={loading}
                    >
                        Actualizar
                    </Button>
                </Space>
            </div>

            <Card style={{ marginBottom: 16 }}>
                <ProductsFilter
                    onCategoryChange={setSelectedCategory}
                    onPriceRangeChange={setPriceRange}
                    onSearchChange={setSearchText}
                />
            </Card>

            <ProductsTable
                products={filteredProducts}
                loading={loading}
                onEdit={handleEdit}
                onUpdatePrice={handleUpdatePrice}
                onDelete={handleDelete}
            />

            <EditProductModal
                visible={editModalVisible}
                product={selectedProduct}
                onSave={handleSaveEdit}
                onCancel={() => {
                    setEditModalVisible(false);
                    setSelectedProduct(null);
                }}
            />

            <PriceUpdateModal
                visible={priceModalVisible}
                product={selectedProduct}
                onSave={handleSavePrice}
                onCancel={() => {
                    setPriceModalVisible(false);
                    setSelectedProduct(null);
                }}
            />

            <CreateProductModal
                visible={createModalVisible}
                onSave={handleSaveCreate}
                onCancel={() => setCreateModalVisible(false)}
            />
        </div>
    );
};

export default Products;

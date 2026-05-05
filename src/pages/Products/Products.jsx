import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, message } from 'antd';
import { ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { productsAPI } from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';

import HelpPanel from '../../components/common/HelpPanel';
import ProductsFilter from './ProductsFilter';
import ProductsTable from './ProductsTable';
import EditProductModal from './EditProductModal';
import PriceUpdateModal from './PriceUpdateModal';
import CreateProductModal from './CreateProductModal';

const { Paragraph, Text, Title } = Typography;

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [maxPrice, setMaxPrice] = useState(100000);

    // Modales
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [priceModalVisible, setPriceModalVisible] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Filtros
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [priceRange, setPriceRange] = useState([0, 100000]);
    const [searchText, setSearchText] = useState('');

    const getMaxPriceFromProducts = (productsList) => {
        const numericPrices = productsList
            .map((product) => Number(product?.final_price ?? 0))
            .filter((value) => Number.isFinite(value) && value >= 0);

        if (numericPrices.length === 0) {
            return 100000;
        }

        return Math.max(100000, Math.ceil(Math.max(...numericPrices)));
    };

    const loadProducts = async () => {
        setLoading(true);
        try {
            const limit = 50;
            const { data: firstPageData } = await productsAPI.getAll({ page: 1, limit });

            const firstPageProducts = Array.isArray(firstPageData?.products) ? firstPageData.products : [];
            const totalPages = Number(firstPageData?.totalPages) || 1;

            if (totalPages <= 1) {
                setProducts(firstPageProducts);
                const detectedMaxPrice = getMaxPriceFromProducts(firstPageProducts);
                setMaxPrice(detectedMaxPrice);
                setPriceRange([0, detectedMaxPrice]);
                return;
            }

            const pageRequests = [];
            for (let page = 2; page <= totalPages; page += 1) {
                pageRequests.push(productsAPI.getAll({ page, limit }));
            }

            const pageResponses = await Promise.all(pageRequests);
            const remainingProducts = pageResponses.flatMap(({ data }) =>
                Array.isArray(data?.products) ? data.products : []
            );

            const allProducts = [...firstPageProducts, ...remainingProducts];
            setProducts(allProducts);

            const detectedMaxPrice = getMaxPriceFromProducts(allProducts);
            setMaxPrice(detectedMaxPrice);
            setPriceRange([0, detectedMaxPrice]);
        } catch (error) {
            console.error('Error loading products:', error);
            setProducts([]);
            setMaxPrice(100000);
            setPriceRange([0, 100000]);
            message.error(getApiErrorMessage(error, 'No se pudieron cargar los productos'));
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
            message.error(getApiErrorMessage(error, 'Error al eliminar el producto'));
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

            <HelpPanel title="Cómo usar Gestión de Productos" storageKey="help-products-page">
                <Paragraph style={{ marginBottom: 8 }}>
                    Esta pantalla permite consultar productos disponibles, buscar por nombre/código/marca y administrar productos manuales.
                </Paragraph>
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                    <li>Usá los filtros para encontrar productos por categoría, rango de precio o texto.</li>
                    <li><Text strong>Nuevo Producto</Text> crea un producto manual con los datos e imagen cargados desde el admin.</li>
                    <li>Editar producto permite actualizar datos del producto seleccionado.</li>
                    <li>Actualizar precio permite modificar rápidamente el precio de lista.</li>
                    <li>Algunos datos del catálogo dependen de sincronizaciones externas, por lo que pueden actualizarse desde Procesos/Catálogo.</li>
                </ul>
            </HelpPanel>

            <Card style={{ marginBottom: 16 }}>
                <ProductsFilter
                    onCategoryChange={setSelectedCategory}
                    onPriceRangeChange={setPriceRange}
                    onSearchChange={setSearchText}
                    maxPrice={maxPrice}
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

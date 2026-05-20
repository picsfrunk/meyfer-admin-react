import React, { useCallback, useEffect, useState } from 'react';
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
const DEFAULT_PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 400;

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        total: 0,
        totalPages: 1,
    });

    // Modales
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [priceModalVisible, setPriceModalVisible] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Filtros
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');

    const buildProductParams = useCallback((page, limit) => {
        const params = { page, limit };
        const normalizedSearch = debouncedSearchText.trim();

        if (selectedCategory) {
            params.category_id = selectedCategory;
        }

        if (selectedBrand) {
            params.brand = selectedBrand;
        }

        if (normalizedSearch) {
            params.search = normalizedSearch;
        }

        return params;
    }, [debouncedSearchText, selectedBrand, selectedCategory]);

    const loadProducts = useCallback(async (page = pagination.current, limit = pagination.pageSize) => {
        setLoading(true);
        try {
            const { data } = await productsAPI.getAll(buildProductParams(page, limit));
            const loadedProducts = Array.isArray(data?.products) ? data.products : [];
            const total = Number(data?.total) || loadedProducts.length;
            const totalPages = Number(data?.totalPages) || 1;
            const currentPage = Number(data?.page) || page;
            const currentPageSize = Number(data?.limit) || limit;

            setProducts(loadedProducts);
            setPagination({
                current: currentPage,
                pageSize: currentPageSize,
                total,
                totalPages,
            });
        } catch (error) {
            console.error('Error loading products:', error);
            setProducts([]);
            setPagination((currentPagination) => ({
                ...currentPagination,
                total: 0,
                totalPages: 1,
            }));
            message.error(getApiErrorMessage(error, 'No se pudieron cargar los productos'));
        } finally {
            setLoading(false);
        }
    }, [buildProductParams, pagination.current, pagination.pageSize]);

    const goToFirstPage = () => {
        setPagination((currentPagination) => ({
            ...currentPagination,
            current: 1,
        }));
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
            setProducts((currentProducts) => currentProducts.filter((p) => p.product_id !== productId));
            setPagination((currentPagination) => ({
                ...currentPagination,
                total: Math.max(currentPagination.total - 1, 0),
            }));
            message.success('Producto eliminado correctamente');
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al eliminar el producto'));
            console.error(error);
        }
    };

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
        goToFirstPage();
    };

    const handleBrandChange = (brand) => {
        setSelectedBrand(brand);
        goToFirstPage();
    };

    const handleSearchChange = (value) => {
        setSearchText(value);
        goToFirstPage();
    };

    const handleTableChange = (nextPagination) => {
        setPagination((currentPagination) => ({
            ...currentPagination,
            current: nextPagination.current,
            pageSize: nextPagination.pageSize,
        }));
    };

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timeoutId);
    }, [searchText]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

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
                        onClick={() => loadProducts()}
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
                    <li>Usá los filtros para encontrar productos por categoría, marca o texto.</li>
                    <li><Text strong>Nuevo Producto</Text> crea un producto manual con los datos e imagen cargados desde el admin.</li>
                    <li>Editar producto permite actualizar datos del producto seleccionado.</li>
                    <li>Actualizar precio permite modificar rápidamente el precio de lista.</li>
                    <li>Algunos datos del catálogo dependen de sincronizaciones externas, por lo que pueden actualizarse desde Procesos/Catálogo.</li>
                </ul>
            </HelpPanel>

            <Card style={{ marginBottom: 16 }}>
                <ProductsFilter
                    onCategoryChange={handleCategoryChange}
                    onBrandChange={handleBrandChange}
                    onSearchChange={handleSearchChange}
                />
            </Card>

            <ProductsTable
                products={products}
                loading={loading}
                pagination={pagination}
                onTableChange={handleTableChange}
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

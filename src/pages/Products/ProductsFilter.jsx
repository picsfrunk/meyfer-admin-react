import React, { useState, useEffect } from 'react';
import { Input, Select, Slider, Space, Card, Button } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { productsAPI } from '../../services/api';

const ProductsFilter = ({
    onCategoryChange,
    onPriceRangeChange,
    onSearchChange,
}) => {
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);

    // Estados locales para filtros
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [priceRange, setPriceRange] = useState([0, 100000]);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        loadFilterData();
    }, []);

    const loadFilterData = async () => {
        setLoading(true);
        try {
            const [categoriesResponse, brandsResponse] = await Promise.all([
                productsAPI.getCategories(),
                productsAPI.getBrands(),
            ]);

            const categoriesData = categoriesResponse?.data?.categories;
            const brandsData = brandsResponse?.data?.data;

            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            setBrands(Array.isArray(brandsData) ? brandsData : []);
        } catch (error) {
            console.error('Error loading filter data:', error);
            setCategories([]);
            setBrands([]);
        } finally {
            setLoading(false);
        }
    };

    const categoryOptions = [
        { label: 'Todas las categorías', value: '' },
        ...categories.map(cat => ({
            label: cat.category_name || cat.name || cat,
            value: cat.category_name || cat.name || cat
        }))
    ];

    const brandOptions = [
        { label: 'Todas las marcas', value: '' },
        ...brands.map(brand => ({
            label: brand.name || brand,
            value: brand.name || brand
        }))
    ];

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        onCategoryChange(value);
    };

    const handleBrandChange = (value) => {
        setSelectedBrand(value);
        // TODO: Implementar filtro por marca en el componente padre
    };

    const handlePriceRangeChange = (value) => {
        setPriceRange(value);
        onPriceRangeChange(value);
    };

    const handleSearchChange = (value) => {
        setSearchText(value);
        onSearchChange(value);
    };

    const handleClearFilters = () => {
        setSelectedCategory('');
        setSelectedBrand('');
        setPriceRange([0, 100000]);
        setSearchText('');

        onCategoryChange('');
        onPriceRangeChange([0, 100000]);
        onSearchChange('');
    };

    return (
        <Card title="Filtros de Productos" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* Búsqueda por texto */}
                <div>
                    <Input
                        placeholder="Buscar por nombre o SKU..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        allowClear
                        size="large"
                    />
                </div>

                {/* Filtro por categoría */}
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                        Categoría
                    </label>
                    <Select
                        options={categoryOptions}
                        placeholder="Filtrar por categoría"
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        style={{ width: '100%' }}
                        size="large"
                        loading={loading}
                    />
                </div>

                {/* Filtro por marca */}
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                        Marca
                    </label>
                    <Select
                        options={brandOptions}
                        placeholder="Filtrar por marca"
                        value={selectedBrand}
                        onChange={handleBrandChange}
                        style={{ width: '100%' }}
                        size="large"
                        loading={loading}
                    />
                </div>

                {/* Rango de precios */}
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                        Rango de precio: ${priceRange[0].toLocaleString('es-AR')} - ${priceRange[1].toLocaleString('es-AR')}
                    </label>
                    <Slider
                        range
                        min={0}
                        max={100000}
                        step={100}
                        value={priceRange}
                        onChange={handlePriceRangeChange}
                        marks={{
                            0: '$0',
                            100000: '$100k',
                        }}
                    />
                </div>

                {/* Botón para limpiar filtros */}
                <Button
                    type="default"
                    icon={<ClearOutlined />}
                    onClick={handleClearFilters}
                    block
                >
                    Limpiar Filtros
                </Button>
            </Space>
        </Card>
    );
};

export default ProductsFilter;

import React, { useState, useEffect } from 'react';
import { Input, Select, Slider, Space, Card, Button, message } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { productsAPI } from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';

const ProductsFilter = ({
    onCategoryChange,
    onPriceRangeChange,
    onSearchChange,
    maxPrice = 100000,
}) => {
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);

    // Estados locales para filtros
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [priceRange, setPriceRange] = useState([0, maxPrice]);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        loadFilterData();
    }, []);

    useEffect(() => {
        setPriceRange([0, maxPrice]);
    }, [maxPrice]);

    const loadFilterData = async () => {
        setLoading(true);
        try {
            const [categoriesResponse, brandsResponse] = await Promise.all([
                productsAPI.getCategories(),
                productsAPI.getBrands(),
            ]);

            const categoriesData = categoriesResponse?.data?.categories;
            const brandsData = brandsResponse?.data?.data;

            if (!Array.isArray(categoriesData) || !Array.isArray(brandsData)) {
                throw new Error('Unexpected filter payload format');
            }

            setCategories(categoriesData);
            setBrands(brandsData);
        } catch (error) {
            console.error('Error loading filter data:', error);
            setCategories([]);
            setBrands([]);
            message.error(getApiErrorMessage(error, 'No se pudieron cargar categorías y marcas'));
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
        setPriceRange([0, maxPrice]);
        setSearchText('');

        onCategoryChange('');
        onPriceRangeChange([0, maxPrice]);
        onSearchChange('');
    };

    return (
        <Card title="Filtros de Productos" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* Búsqueda por texto */}
                <div>
                    <Input
                        placeholder="Buscar por nombre o Código..."
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
                    <label
                        style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: 500,
                            whiteSpace: 'normal',
                            overflowWrap: 'anywhere',
                        }}
                    >
                        Rango de precio: ${priceRange[0].toLocaleString('es-AR')} - ${priceRange[1].toLocaleString('es-AR')}
                    </label>
                    <div style={{ paddingInline: 8 }}>
                        <Slider
                            range
                            min={0}
                            max={maxPrice}
                            step={100}
                            value={priceRange}
                            onChange={handlePriceRangeChange}
                            marks={{
                                0: {
                                    style: { transform: 'translateX(0%)' },
                                    label: '$0',
                                },
                                [maxPrice]: {
                                    style: { transform: 'translateX(-100%)' },
                                    label: `$${maxPrice.toLocaleString('es-AR')}`,
                                },
                            }}
                        />
                    </div>
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

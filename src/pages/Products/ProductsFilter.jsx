import React, { useState, useEffect } from 'react';
import { Input, Select, Slider, Space, Card } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { productsAPI } from '../../services/api';

const ProductsFilter = ({
    onCategoryChange,
    onPriceRangeChange,
    onSearchChange,
}) => {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const { data } = await productsAPI.getCategories();
                if (Array.isArray(data)) {
                    setCategories(data);
                }
            } catch (error) {
                console.error('Error loading categories:', error);
                // Fallback categories
                setCategories([
                    { id: 'herramientas', name: 'Herramientas' },
                    { id: 'medicion', name: 'Medición' },
                    { id: 'electricos', name: 'Eléctricos' },
                ]);
            }
        };

        loadCategories();
    }, []);

    const categoryOptions = [
        { label: 'Todas las categorías', value: '' },
        ...categories.map(cat => ({
            label: cat.name || cat,
            value: cat.name || cat
        }))
    ];

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
                <Input
                    placeholder="Buscar por nombre o SKU..."
                    prefix={<SearchOutlined />}
                    onChange={(e) => onSearchChange(e.target.value)}
                    allowClear
                    size="large"
                />
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                    Categoría
                </label>
                <Select
                    options={categoryOptions}
                    placeholder="Filtrar por categoría"
                    onChange={onCategoryChange}
                    style={{ width: '100%' }}
                    size="large"
                />
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                    Rango de precio
                </label>
                <Slider
                    range
                    min={0}
                    max={100000}
                    step={100}
                    defaultValue={[0, 100000]}
                    onChange={onPriceRangeChange}
                    marks={{
                        0: '$0',
                        100000: '$100k',
                    }}
                />
            </div>
        </Space>
    );
};

export default ProductsFilter;

import React, { useState, useEffect } from 'react';
import { Card, Space, Tag, Checkbox, Typography } from 'antd';

const { Text } = Typography;

const OrdersFilter = ({
                          statusOptions,
                          selectedStatuses,
                          allSelected,
                          showDeleted,
                          onStatusToggle,
                          onDeletedToggle,
                      }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <Card
            style={{ marginBottom: 16 }}
            styles={{ body: { padding: isMobile ? '12px' : '24px' } }}
        >
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                marginBottom: isMobile ? 8 : 16,
                gap: isMobile ? 8 : 0
            }}>
                <Text strong style={{ fontSize: isMobile ? '13px' : '14px' }}>
                    Filtrar por Estado:
                </Text>
                <Checkbox
                    checked={showDeleted}
                    onChange={(e) => onDeletedToggle(e.target.checked)}
                    style={{ fontSize: isMobile ? '12px' : '14px' }}
                >
                    Mostrar Eliminados
                </Checkbox>
            </div>
            <Space wrap size={isMobile ? 'small' : 'middle'}>
                {statusOptions.map((s) => (
                    <Tag.CheckableTag
                        key={s.key}
                        checked={s.key === 'todos' ? allSelected : selectedStatuses.includes(s.key)}
                        onChange={() => onStatusToggle(s.key)}
                        style={{
                            fontSize: isMobile ? '11px' : '13px',
                            padding: isMobile ? '2px 8px' : '4px 12px'
                        }}
                    >
                        {s.label}
                    </Tag.CheckableTag>
                ))}
            </Space>
        </Card>
    );
};

export default OrdersFilter;
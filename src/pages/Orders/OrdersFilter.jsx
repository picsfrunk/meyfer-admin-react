import React from 'react';
import { Card, Space, Tag, Checkbox, Typography } from 'antd';

const { Text } = Typography;

const OrdersFilter = ({
                          statusOptions,
                          selectedStatuses,
                          allSelected,
                          showDeleted,
                          onStatusToggle,
                          onDeletedToggle,
                      }) => (
    <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text strong>Filtrar por Estado:</Text>
            <Checkbox checked={showDeleted} onChange={(e) => onDeletedToggle(e.target.checked)}>
                Mostrar Eliminados
            </Checkbox>
        </div>
        <Space wrap>
            {statusOptions.map((s) => (
                <Tag.CheckableTag
                    key={s.key}
                    checked={s.key === 'todos' ? allSelected : selectedStatuses.includes(s.key)}
                    onChange={() => onStatusToggle(s.key)}
                >
                    {s.label}
                </Tag.CheckableTag>
            ))}
        </Space>
    </Card>
);

export default OrdersFilter;

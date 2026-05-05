import React from 'react';
import { Button, Card, Space, Typography } from 'antd';
import { CloseOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const getInitialVisible = (storageKey, defaultOpen) => {
    if (!storageKey || typeof window === 'undefined') return defaultOpen;

    const storedValue = window.localStorage.getItem(storageKey);
    if (storedValue === null) return defaultOpen;

    return storedValue === 'true';
};

const HelpPanel = ({
    title,
    children,
    storageKey,
    defaultOpen = false,
    buttonLabel = 'Ayuda',
    style = {},
}) => {
    const [visible, setVisible] = React.useState(() => getInitialVisible(storageKey, defaultOpen));

    const toggleVisible = () => {
        setVisible((currentValue) => {
            const nextValue = !currentValue;

            if (storageKey && typeof window !== 'undefined') {
                window.localStorage.setItem(storageKey, String(nextValue));
            }

            return nextValue;
        });
    };

    return (
        <div style={{ marginBottom: 16, ...style }}>
            <Button
                size="small"
                icon={<QuestionCircleOutlined />}
                onClick={toggleVisible}
            >
                {buttonLabel}
            </Button>

            {visible ? (
                <Card
                    size="small"
                    style={{ marginTop: 8, background: '#fafafa', borderColor: '#d9d9d9' }}
                    styles={{ body: { padding: 12 } }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            {title ? <Title level={5} style={{ margin: 0 }}>{title}</Title> : null}
                            <Text component="div" style={{ display: 'block' }}>
                                {children}
                            </Text>
                        </Space>

                        <Button
                            type="text"
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={toggleVisible}
                            aria-label="Cerrar ayuda"
                        />
                    </div>
                </Card>
            ) : null}
        </div>
    );
};

export default HelpPanel;

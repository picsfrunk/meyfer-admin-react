import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Popconfirm, Space, message } from 'antd';
import { StopOutlined } from '@ant-design/icons';
import JobsPage from './JobsPage.jsx';
import { scraperAPI } from '../services/scraperAPI';
import { getApiErrorMessage } from '../utils/apiError';

const findCardHeaderByTitle = (title) => {
    const titleNodes = Array.from(document.querySelectorAll('.ant-card-head-title'));
    const titleNode = titleNodes.find((node) => node.textContent?.includes(title));
    return titleNode?.closest('.ant-card-head') ?? null;
};

const ensureActionsSlot = (cardHeader, slotId) => {
    if (!cardHeader) return null;

    let slot = cardHeader.querySelector(`#${slotId}`);
    if (slot) return slot;

    const wrapper = cardHeader.querySelector('.ant-card-head-wrapper');
    if (!wrapper) return null;

    slot = document.createElement('div');
    slot.id = slotId;
    slot.style.marginLeft = 'auto';
    wrapper.appendChild(slot);
    return slot;
};

const InlineProcessActions = () => {
    const [statusData, setStatusData] = useState(null);
    const [slot, setSlot] = useState(null);
    const [loading, setLoading] = useState(false);

    const running = statusData?.running;

    const loadStatus = useCallback(async () => {
        try {
            const res = await scraperAPI.getStatus();
            setStatusData(res.data);
        } catch (error) {
            console.warn('No se pudo cargar el estado de procesos', error);
        }
    }, []);

    useEffect(() => {
        loadStatus();
        const interval = setInterval(loadStatus, 5000);
        return () => clearInterval(interval);
    }, [loadStatus]);

    useEffect(() => {
        const mount = () => {
            const cardHeader = findCardHeaderByTitle('Estado actual');
            setSlot(ensureActionsSlot(cardHeader, 'process-running-actions-slot'));
        };

        mount();
        const observer = new MutationObserver(mount);
        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    const handleStop = async () => {
        if (!running?.id) return;

        setLoading(true);
        try {
            const res = await scraperAPI.cancelJob(running.id);
            message.success(res.data?.message || 'Solicitud enviada correctamente.');
            await loadStatus();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al solicitar la detención del job.'));
        } finally {
            setLoading(false);
        }
    };

    const content = useMemo(() => {
        if (!running) return null;

        return (
            <Space>
                <Popconfirm
                    title="¿Detener el job en ejecución?"
                    description="Se enviará una solicitud de detención graceful. El job puede terminar el paso actual antes de detenerse."
                    onConfirm={handleStop}
                    okText="Detener"
                    okButtonProps={{ danger: true }}
                    cancelText="No"
                >
                    <Button
                        size="small"
                        danger
                        icon={<StopOutlined />}
                        loading={loading}
                    >
                        Detener
                    </Button>
                </Popconfirm>
            </Space>
        );
    }, [running, loading]);

    if (!slot || !content) return null;
    return createPortal(content, slot);
};

export default function JobsPageInlineActions() {
    return (
        <>
            <JobsPage />
            <InlineProcessActions />
        </>
    );
}

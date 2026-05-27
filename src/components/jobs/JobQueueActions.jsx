import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Empty, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { HourglassOutlined, ReloadOutlined, StopOutlined, SyncOutlined } from '@ant-design/icons';
import { scraperAPI } from '../../services/scraperAPI';
import { getApiErrorMessage } from '../../utils/apiError';

const { Text } = Typography;

const JOB_TYPE_LABELS = {
    sitemapScraper: 'Sitemap Scraper',
    categoryScraper: 'Category Scraper',
    sitemapAnalysis: 'Análisis Sitemap',
    priceCheck: 'Price Check',
    categoriesRestore: 'Restaurar categorías',
    categoriesReorganize: 'Reorganizar categorías',
};

const JOB_TYPE_COLORS = {
    sitemapScraper: 'blue',
    categoryScraper: 'purple',
    sitemapAnalysis: 'cyan',
    priceCheck: 'orange',
    categoriesRestore: 'geekblue',
    categoriesReorganize: 'volcano',
};

const formatDuration = (ms) => {
    if (ms == null) return '—';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
};

const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
};

const JobTypeTag = ({ type }) => (
    <Tag color={JOB_TYPE_COLORS[type]}>{JOB_TYPE_LABELS[type] ?? type ?? '—'}</Tag>
);

export default function JobQueueActions() {
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [busyJobId, setBusyJobId] = useState(null);
    const [busyAll, setBusyAll] = useState(false);

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        try {
            const res = await scraperAPI.getStatus();
            setStatusData(res.data);
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al cargar estado de cola'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const handleCancelJob = async (jobId) => {
        setBusyJobId(jobId);
        try {
            const res = await scraperAPI.cancelJob(jobId);
            message.success(res.data?.message || 'Solicitud enviada correctamente.');
            await fetchStatus();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al enviar la solicitud.'));
        } finally {
            setBusyJobId(null);
        }
    };

    const handleClearQueue = async () => {
        setBusyAll(true);
        try {
            const res = await scraperAPI.purgeQueue();
            const count = res.data?.cancelledCount ?? res.data?.canceledCount;
            message.success(res.data?.message || `${count ?? 0} job(s) quitado(s) de la cola.`);
            await fetchStatus();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al limpiar la cola.'));
        } finally {
            setBusyAll(false);
        }
    };

    const running = statusData?.running;
    const pendingJobs = statusData?.pendingJobs ?? [];
    const pending = statusData?.pending ?? pendingJobs.length;

    const columns = [
        {
            title: '#',
            key: 'position',
            width: 48,
            render: (_, __, index) => <Text type="secondary">{index + 1}</Text>,
        },
        {
            title: 'Tipo',
            dataIndex: 'type',
            key: 'type',
            render: (type) => <JobTypeTag type={type} />,
        },
        {
            title: 'Job ID',
            dataIndex: 'id',
            key: 'id',
            render: (id) => <Text code style={{ fontSize: 11 }}>{id}</Text>,
        },
        {
            title: 'Esperando',
            dataIndex: 'waitingMs',
            key: 'waitingMs',
            render: formatDuration,
        },
        {
            title: 'Acción',
            key: 'action',
            width: 96,
            align: 'center',
            render: (_, row) => (
                <Popconfirm
                    title="¿Quitar este job de la cola?"
                    onConfirm={() => handleCancelJob(row.id)}
                    okText="Confirmar"
                    okButtonProps={{ danger: true }}
                    cancelText="No"
                >
                    <Button
                        size="small"
                        danger
                        icon={<StopOutlined />}
                        loading={busyJobId === row.id}
                        disabled={busyAll || (busyJobId != null && busyJobId !== row.id)}
                    />
                </Popconfirm>
            ),
        },
    ];

    return (
        <Card
            size="small"
            style={{ marginBottom: 16 }}
            title={
                <Space>
                    <HourglassOutlined />
                    <Text strong>Acciones de cola</Text>
                    {pending > 0 && <Badge count={pending} />}
                </Space>
            }
            extra={
                <Space>
                    <Button size="small" icon={<ReloadOutlined />} loading={loading} onClick={fetchStatus}>
                        Actualizar
                    </Button>
                    {pending > 0 && (
                        <Popconfirm
                            title="¿Limpiar cola pendiente?"
                            onConfirm={handleClearQueue}
                            okText="Confirmar"
                            okButtonProps={{ danger: true }}
                            cancelText="No"
                        >
                            <Button size="small" danger loading={busyAll}>
                                Limpiar cola
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            }
        >
            <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="Gestión manual de jobs"
                description="Los jobs en ejecución reciben una solicitud graceful y pueden finalizar el paso actual antes de detenerse."
            />

            {running ? (
                <Card size="small" style={{ marginBottom: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }} size={8}>
                        <Space wrap>
                            <SyncOutlined spin style={{ color: '#1677ff' }} />
                            <Text strong>En ejecución</Text>
                            <JobTypeTag type={running.type} />
                            <Text code style={{ fontSize: 11 }}>{running.id}</Text>
                        </Space>
                        <Space wrap>
                            <Text type="secondary">Iniciado: {formatDate(running.startedAt)}</Text>
                            <Text type="secondary">Transcurrido: {formatDuration(running.elapsedMs)}</Text>
                        </Space>
                        <Popconfirm
                            title="¿Solicitar detención del job?"
                            onConfirm={() => handleCancelJob(running.id)}
                            okText="Confirmar"
                            okButtonProps={{ danger: true }}
                            cancelText="No"
                        >
                            <Button size="small" danger icon={<StopOutlined />} loading={busyJobId === running.id}>
                                Detener job
                            </Button>
                        </Popconfirm>
                    </Space>
                </Card>
            ) : (
                <Empty description="No hay ningún job en ejecución" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}

            {pending > 0 && (
                <Table
                    dataSource={pendingJobs}
                    rowKey="id"
                    columns={columns}
                    pagination={false}
                    size="small"
                />
            )}
        </Card>
    );
}

import React, { useState, useEffect, useCallback } from 'react';
import {
    Row, Col, Card, Statistic, Tag, Table, Button, Modal,
    Typography, Space, Badge, Tooltip, Divider, Alert, Spin,
    Descriptions, Empty, message, Tabs, Pagination, Select,
} from 'antd';
import {
    PlayCircleOutlined,
    SyncOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    HourglassOutlined,
    RobotOutlined,
    BarChartOutlined,
    ReloadOutlined,
    InfoCircleOutlined,
    ThunderboltOutlined,
    DollarOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    UnorderedListOutlined,
    WarningOutlined,
    StopOutlined,
    CloseOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { scraperAPI } from '../services/scraperAPI';
import { getApiErrorMessage } from '../utils/apiError';
import useAdminDevMode from '../hooks/useAdminDevMode';

const { Title, Text } = Typography;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

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

const formatPrice = (n) =>
    n != null
        ? `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '—';

const JOB_TYPE_LABELS = {
    sitemapScraper:  'Actualización técnica',
    categoryScraper: 'Actualizar catálogo',
    sitemapAnalysis: 'Análisis técnico',
    priceCheck:      'Revisar precios',
    categoriesRestore: 'Restaurar categorías',
    categoriesReorganize: 'Reorganizar categorías',
};

const JOB_TYPE_COLORS = {
    sitemapScraper:  'blue',
    categoryScraper: 'purple',
    sitemapAnalysis: 'cyan',
    priceCheck:      'orange',
    categoriesRestore: 'geekblue',
    categoriesReorganize: 'volcano',
};

const CATEGORY_MAINTENANCE_TYPES = ['categoriesRestore', 'categoriesReorganize'];

const STATUS_CONFIG = {
    enqueued:  { color: 'default',    icon: <HourglassOutlined />,  label: 'En espera'  },
    running:   { color: 'processing', icon: <SyncOutlined spin />,  label: 'Ejecutando' },
    completed: { color: 'success',    icon: <CheckCircleOutlined />, label: 'Completado' },
    failed:    { color: 'error',      icon: <CloseCircleOutlined />, label: 'Fallido'    },
    canceled:  { color: 'default',    icon: <StopOutlined />,       label: 'Cancelado'  },
};

const StatusTag = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || { color: 'default', icon: null, label: status };
    return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
};

/**
 * Muestra el alcance del proceso.
 */
const ScopeTag = ({ type, params }) => {
    if (type === 'categoriesReorganize') {
        return params?.dryRun === false
            ? <Tag color="volcano">Aplicado</Tag>
            : <Tag color="green">Simulación</Tag>;
    }

    if (type !== 'categoryScraper') return null;
    const ids = params?.categoryIds;
    if (!ids || ids === 'all' || (Array.isArray(ids) && ids.length === 0)) {
        return <Tag color="geekblue">Todas las categorías</Tag>;
    }
    const idList = Array.isArray(ids) ? ids : [ids];
    return (
        <Tooltip title={`IDs: ${idList.join(', ')}`}>
            <Tag color="volcano">
                {idList.length === 1
                    ? `Cat. ${idList[0]}`
                    : `${idList.length} categorías`}
            </Tag>
        </Tooltip>
    );
};

const renderJobResult = (job) => {
    const res = job.result;
    if (job.status === 'canceled') return <Tag icon={<StopOutlined />} color="default">Cancelado</Tag>;
    if (!res) return <Text type="secondary">—</Text>;
    if (res.error) return <Tag color="error" icon={<CloseCircleOutlined />}>Error</Tag>;
    if (job.type === 'priceCheck') {
        return (
            <Tooltip title={`${res.summary?.new ?? 0} nuevos · ${res.summary?.removed ?? 0} eliminados`}>
                <Tag color={res.summary?.changed > 0 ? 'orange' : 'green'}>
                    {res.summary?.changed ?? 0} cambios
                </Tag>
            </Tooltip>
        );
    }
    if (job.type === 'categoriesRestore') {
        return (
            <Tooltip title={`${res.errors ?? 0} errores`}>
                <Text>{res.modified ?? res.total ?? '—'} modificados</Text>
            </Tooltip>
        );
    }
    if (job.type === 'categoriesReorganize') {
        const dryRun = res.dryRun ?? job.params?.dryRun;
        return (
            <Tooltip title={`${res.errors ?? 0} errores`}>
                <Space size={4} wrap>
                    <Tag color={dryRun === false ? 'volcano' : 'green'}>
                        {dryRun === false ? 'Aplicado' : 'Simulación'}
                    </Tag>
                    <Text>{res.modified ?? res.matched ?? '—'} cambios</Text>
                </Space>
            </Tooltip>
        );
    }
    return (
        <Tooltip title={`${res.errors ?? 0} errores`}>
            <Text>{res.total ?? '—'} guardados</Text>
        </Tooltip>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER MODAL
// ─────────────────────────────────────────────────────────────────────────────

const TriggerModal = ({ open, onClose, onSuccess, devMode }) => {
    const [loading, setLoading] = useState(null);

    const handleTrigger = async (scraperType) => {
        setLoading(scraperType);
        try {
            const res = await scraperAPI.triggerScraper(scraperType);
            const queued = res.data.status === 'queued';
            message.success(
                queued
                    ? `Proceso agregado a pendientes. Posición ${res.data.position}`
                    : 'Iniciado correctamente'
            );
            onSuccess();
            onClose();
        } catch (err) {
            message.error(getApiErrorMessage(err, 'Error al iniciar el proceso'));
        } finally {
            setLoading(null);
        }
    };

    const handleAnalyze = async () => {
        setLoading('sitemapAnalysis');
        try {
            await scraperAPI.triggerAnalysis();
            message.success('Análisis técnico iniciado');
            onSuccess();
            onClose();
        } catch (err) {
            message.error(getApiErrorMessage(err, 'Error al analizar'));
        } finally {
            setLoading(null);
        }
    };

    const handlePriceCheck = async () => {
        setLoading('priceCheck');
        try {
            await scraperAPI.triggerPriceCheck();
            message.success('Revisión de precios iniciada');
            onSuccess();
            onClose();
        } catch (err) {
            const errMsg = err.response?.data?.error || 'Error al iniciar la revisión de precios';
            if (err.response?.status === 503) {
                message.error(`Backend no configurado: ${errMsg}`);
            } else {
                message.error(getApiErrorMessage(err, errMsg));
            }
        } finally {
            setLoading(null);
        }
    };

    const handleMaintenanceJob = async (key, request, successMessage) => {
        setLoading(key);
        try {
            const res = await request();
            const queued = res.data?.status === 'queued';
            message.success(
                queued && res.data?.position
                    ? `Proceso agregado a pendientes. Posición ${res.data.position}`
                    : successMessage
            );
            onSuccess();
            onClose();
        } catch (err) {
            message.error(getApiErrorMessage(err, 'Error al iniciar el mantenimiento'));
        } finally {
            setLoading(null);
        }
    };

    const handleApplyReorganization = () => {
        Modal.confirm({
            title: 'Aplicar reorganización de categorías',
            content: (
                <Space direction="vertical" size={8}>
                    <Text>
                        Esta acción modifica las categorías reales de productos.
                    </Text>
                    <Text type="secondary">
                        No modifica precios ni imágenes. Puede tardar varios minutos y quedará registrada en el historial.
                    </Text>
                </Space>
            ),
            okText: 'Aplicar reorganización',
            okButtonProps: { danger: true },
            cancelText: 'Volver',
            onOk: () => handleMaintenanceJob(
                'categoriesReorganizeApply',
                () => scraperAPI.reorganizeCategories({ dryRun: false }),
                'Reorganización de categorías iniciada'
            ),
        });
    };

    const actions = [
        {
            key: 'sitemapScraper',
            label: 'Actualización por sitemap',
            desc: 'Herramienta técnica para recorrer el mapa del sitio fuente.',
            icon: <PlayCircleOutlined />,
            danger: true,
            devOnly: true,
            onClick: () => handleTrigger('sitemapScraper'),
        },
        {
            key: 'categoryScraper',
            label: 'Actualizar catálogo',
            desc: 'Recorre el catálogo del sitio fuente y actualiza la información de productos. Puede tardar varios minutos.',
            icon: <PlayCircleOutlined />,
            danger: true,
            onClick: () => handleTrigger('categoryScraper'),
        },
        {
            key: 'sitemapAnalysis',
            label: 'Analizar sitemap',
            desc: 'Revisa la estructura del sitio fuente sin actualizar productos.',
            icon: <BarChartOutlined />,
            danger: false,
            devOnly: true,
            onClick: handleAnalyze,
        },
        {
            key: 'priceCheck',
            label: 'Revisar precios',
            desc: 'Compara precios actuales con los guardados en el sistema. No elimina productos ni modifica imágenes.',
            icon: <DollarOutlined />,
            danger: false,
            onClick: handlePriceCheck,
        },
        {
            key: 'categoriesRestore',
            label: 'Restaurar categorías oficiales',
            desc: 'Restaura la configuración oficial de categorías. No modifica precios ni imágenes.',
            icon: <SyncOutlined />,
            danger: false,
            onClick: () => handleMaintenanceJob(
                'categoriesRestore',
                scraperAPI.restoreOfficialCategories,
                'Restauración de categorías iniciada'
            ),
        },
        {
            key: 'categoriesReorganizeDryRun',
            label: 'Simular reorganización de categorías',
            desc: 'Acción segura recomendada: analiza posibles cambios sin modificar productos.',
            icon: <BarChartOutlined />,
            danger: false,
            devOnly: true,
            onClick: () => handleMaintenanceJob(
                'categoriesReorganizeDryRun',
                () => scraperAPI.reorganizeCategories({ dryRun: true }),
                'Simulación de reorganización iniciada'
            ),
        },
        {
            key: 'categoriesReorganizeApply',
            label: 'Aplicar reorganización de categorías',
            desc: 'Aplica cambios reales de categorías. No modifica precios ni imágenes.',
            icon: <WarningOutlined />,
            danger: true,
            devOnly: true,
            onClick: handleApplyReorganization,
        },
    ];
    const visibleActions = actions.filter((action) => devMode || !action.devOnly);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            title={
                <Space>
                    <WarningOutlined style={{ color: '#faad14' }} />
                    <span>Iniciar proceso</span>
                </Space>
            }
            width={460}
        >
            <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="Antes de iniciar"
                description="Estas acciones actualizan información del sistema y pueden tardar varios minutos. Podés seguir el avance desde Procesos pendientes."
            />
            <Space direction="vertical" style={{ width: '100%' }} size={10}>
                {visibleActions.map(a => (
                    <Card
                        key={a.key}
                        size="small"
                        hoverable
                        style={{
                            cursor: loading ? 'not-allowed' : 'pointer',
                            borderColor: a.danger ? '#ff4d4f' : undefined,
                        }}
                        onClick={() => !loading && a.onClick()}
                    >
                        <Space>
                            <Button
                                type="primary"
                                danger={a.danger}
                                icon={a.icon}
                                loading={loading === a.key}
                                disabled={!!loading && loading !== a.key}
                                size="small"
                            >
                                Ejecutar
                            </Button>
                            <div>
                                <Text strong>{a.label}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>{a.desc}</Text>
                            </div>
                        </Space>
                    </Card>
                ))}
            </Space>
        </Modal>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// JOB DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────

const JobDetailModal = ({ job, onClose }) => {
    const { devMode } = useAdminDevMode();
    if (!job) return null;
    const result = job.result;
    const isPriceCheck = job.type === 'priceCheck';
    const isCategoryMaintenance = CATEGORY_MAINTENANCE_TYPES.includes(job.type);
    const categoryMode = result?.dryRun ?? job.params?.dryRun;
    const categoryMetrics = [
        ['Páginas visitadas', result?.pagesVisited],
        ['Coincidencias', result?.matched],
        ['Modificados', result?.modified],
        ['Simulación', result?.dryRun],
        ['Procesados', result?.processed],
        ['Total', result?.total],
        ['Errores', result?.errors],
        ['Duración', result?.durationMs],
    ];

    return (
        <Modal
            open={!!job}
            onCancel={onClose}
            footer={<Button onClick={onClose}>Cerrar</Button>}
            title={
                <Space>
                    <RobotOutlined />
                    <span>Detalle del proceso</span>
                    {devMode && <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>{job.jobId}</Text>}
                </Space>
            }
            width={640}
        >
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Tipo">
                    <Tag color={JOB_TYPE_COLORS[job.type]}>{JOB_TYPE_LABELS[job.type] ?? job.type}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Estado"><StatusTag status={job.status} /></Descriptions.Item>
                <Descriptions.Item label="Agregado">{formatDate(job.enqueuedAt)}</Descriptions.Item>
                <Descriptions.Item label="Iniciado">{formatDate(job.startedAt)}</Descriptions.Item>
                <Descriptions.Item label="Finalizado">{formatDate(job.finishedAt)}</Descriptions.Item>
                <Descriptions.Item label="Duración">{formatDuration(job.durationMs)}</Descriptions.Item>
                <Descriptions.Item label="Espera">{formatDuration(job.waitTimeMs)}</Descriptions.Item>
                <Descriptions.Item label="Posición inicial">{job.queuePosition ?? '—'}</Descriptions.Item>
                {job.type === 'categoryScraper' && (
                    <Descriptions.Item label="Categorías" span={2}>
                        {(() => {
                            const ids = job.params?.categoryIds;
                            if (!ids || ids === 'all' || (Array.isArray(ids) && ids.length === 0)) {
                                return <Tag color="geekblue">Todas las categorías</Tag>;
                            }
                            const idList = Array.isArray(ids) ? ids : [ids];
                            return idList.map(id => <Tag key={id} color="volcano">{id}</Tag>);
                        })()}
                    </Descriptions.Item>
                )}
                {job.type === 'categoriesReorganize' && (
                    <Descriptions.Item label="Modo" span={2}>
                        {categoryMode === false
                            ? <Tag color="volcano">Aplicado</Tag>
                            : <Tag color="green">Simulación</Tag>
                        }
                    </Descriptions.Item>
                )}
            </Descriptions>

            {result && (
                <>
                    <Divider orientation="left" style={{ fontSize: 13 }}>Resultado</Divider>
                    {result.error && (
                        <Alert type="error" message={result.error} style={{ marginBottom: 12 }} showIcon />
                    )}
                    {isCategoryMaintenance ? (
                        <Descriptions bordered column={2} size="small">
                            {job.type === 'categoriesReorganize' && (
                                <Descriptions.Item label="Modo">
                                    {categoryMode === false
                                        ? <Tag color="volcano">Aplicado</Tag>
                                        : <Tag color="green">Simulación</Tag>
                                    }
                                </Descriptions.Item>
                            )}
                            {categoryMetrics
                                .filter(([, value]) => value != null)
                                .map(([label, value]) => (
                                    <Descriptions.Item key={label} label={label}>
                                        {label === 'Simulación' ? (
                                            value ? <Tag color="green">Sí</Tag> : <Tag color="volcano">No</Tag>
                                        ) : label === 'Errores' ? (
                                            <Text type={value > 0 ? 'danger' : 'success'}>{value}</Text>
                                        ) : label === 'Duración' ? (
                                            formatDuration(value)
                                        ) : (
                                            value
                                        )}
                                    </Descriptions.Item>
                                ))}
                        </Descriptions>
                    ) : isPriceCheck && result.summary ? (
                        <Descriptions bordered column={2} size="small">
                            <Descriptions.Item label="Cambiados">
                                <Text type={result.summary.changed > 0 ? 'warning' : 'success'}>
                                    {result.summary.changed ?? '—'}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Nuevos">{result.summary.new ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="Eliminados">{result.summary.removed ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="Sin respuesta">{result.summary.failed ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="Total origen">{result.summary.total_odoo ?? '—'}</Descriptions.Item>
                            {devMode && <Descriptions.Item label="Total interno">{result.summary.total_db ?? '—'}</Descriptions.Item>}
                        </Descriptions>
                    ) : (
                        <Descriptions bordered column={2} size="small">
                            <Descriptions.Item label="Procesados">{result.processed ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="Guardados">{result.total ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="Errores">
                                <Text type={result.errors > 0 ? 'danger' : 'success'}>{result.errors ?? '—'}</Text>
                            </Descriptions.Item>
                            {devMode && <Descriptions.Item label="Imágenes subidas">{result.uploaded ?? '—'}</Descriptions.Item>}
                            {devMode && <Descriptions.Item label="Productos eliminados">{result.orphansDeleted ?? '—'}</Descriptions.Item>}
                            <Descriptions.Item label="Duración">{formatDuration(result.durationMs)}</Descriptions.Item>
                        </Descriptions>
                    )}
                </>
            )}

            {!result && ['enqueued', 'running'].includes(job.status) && (
                <Alert type="info" message="El proceso todavía no produjo resultados." showIcon />
            )}
            {!result && job.status === 'canceled' && (
                <Alert type="warning" message="El proceso fue cancelado antes de producir resultados." showIcon />
            )}
        </Modal>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// PRICE CHECK DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────

const PriceCheckDetailModal = ({ id, onClose }) => {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!id) { setData(null); return; }
        setLoading(true);
        scraperAPI.getPriceCheckDetail(id)
            .then(res => setData(res.data))
            .catch((error) => message.error(getApiErrorMessage(error, 'Error al cargar el detalle')))
            .finally(() => setLoading(false));
    }, [id]);

    const changedColumns = [
        {
            title: 'Código',
            dataIndex: 'product_id',
            key: 'product_id',
            width: 80,
            render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text>,
        },
        {
            title: 'Producto',
            dataIndex: 'display_name',
            key: 'display_name',
            ellipsis: true,
        },
        {
            title: 'Anterior',
            dataIndex: 'old_price',
            key: 'old_price',
            align: 'right',
            width: 110,
            render: (p) => <Text type="secondary" delete>{formatPrice(p)}</Text>,
        },
        {
            title: 'Nuevo',
            dataIndex: 'new_price',
            key: 'new_price',
            align: 'right',
            width: 110,
            render: (p) => <Text strong>{formatPrice(p)}</Text>,
        },
        {
            title: 'Diferencia',
            dataIndex: 'diff',
            key: 'diff',
            align: 'right',
            width: 140,
            render: (diff, r) => {
                const up = diff > 0;
                return (
                    <Tag
                        color={up ? 'red' : 'green'}
                        icon={up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    >
                        {up ? '+' : ''}{formatPrice(diff)}
                        {r.diff_percent != null && (
                            <span style={{ marginLeft: 4, opacity: 0.8 }}>
                                ({up ? '+' : ''}{r.diff_percent}%)
                            </span>
                        )}
                    </Tag>
                );
            },
        },
    ];

    return (
        <Modal
            open={!!id}
            onCancel={onClose}
            footer={<Button onClick={onClose}>Cerrar</Button>}
            title={<Space><DollarOutlined /><span>Detalle de revisión de precios</span></Space>}
            width={820}
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
            ) : data && (
                <>
                    <Descriptions bordered column={3} size="small" style={{ marginBottom: 16 }}>
                        <Descriptions.Item label="Ejecutado">{formatDate(data.checkedAt)}</Descriptions.Item>
                        <Descriptions.Item label="Duración">{formatDuration(data.durationMs)}</Descriptions.Item>
                        <Descriptions.Item label="Total origen">{data.summary?.total_odoo ?? '—'}</Descriptions.Item>
                        <Descriptions.Item label="Cambiados">
                            <Text type={data.summary?.changed > 0 ? 'warning' : 'success'}>
                                {data.summary?.changed ?? 0}
                            </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Nuevos">{data.summary?.new ?? 0}</Descriptions.Item>
                        <Descriptions.Item label="Eliminados">{data.summary?.removed ?? 0}</Descriptions.Item>
                    </Descriptions>

                    {data.changedDetail?.length > 0 ? (
                        <>
                            <Divider orientation="left" style={{ fontSize: 13 }}>
                                Precios cambiados ({data.changedDetail.length})
                            </Divider>
                            <Table
                                dataSource={data.changedDetail}
                                columns={changedColumns}
                                rowKey="product_id"
                                size="small"
                                pagination={{ pageSize: 10, showSizeChanger: false }}
                                scroll={{ x: 600 }}
                            />
                        </>
                    ) : (
                        <Alert type="success" message="Sin cambios de precios en esta verificación." showIcon />
                    )}

                    {data.newIds?.length > 0 && (
                        <Alert type="info" style={{ marginTop: 12 }} showIcon
                               message={`${data.newIds.length} producto${data.newIds.length !== 1 ? 's' : ''} nuevo${data.newIds.length !== 1 ? 's' : ''} detectado${data.newIds.length !== 1 ? 's' : ''} en el origen`}
                        />
                    )}
                    {data.removedIds?.length > 0 && (
                        <Alert type="warning" style={{ marginTop: 12 }} showIcon
                               message={`${data.removedIds.length} producto${data.removedIds.length !== 1 ? 's' : ''} ausente${data.removedIds.length !== 1 ? 's' : ''} en el origen`}
                        />
                    )}
                </>
            )}
        </Modal>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB: COLA (estado en tiempo real)
// ─────────────────────────────────────────────────────────────────────────────

const QueueTab = ({
    statusData,
    stats,
    onCancelJob,
    onPurgeQueue,
    cancelingJobId,
    purgingQueue,
    devMode,
}) => {
    const [elapsed, setElapsed] = useState(statusData?.running?.elapsedMs ?? 0);

    useEffect(() => {
        if (!statusData?.running) return;
        setElapsed(statusData.running.elapsedMs ?? 0);
        const interval = setInterval(() => setElapsed(e => e + 1000), 1000);
        return () => clearInterval(interval);
    }, [statusData?.running]);

    const running = statusData?.running;
    const runningId = running?.id ?? running?.jobId;
    const pendingJobs = statusData?.pendingJobs ?? [];
    const pendingColumns = [
        {
            title: '#',
            key: 'pos',
            width: 40,
            render: (_, __, i) => <Text type="secondary">{i + 1}</Text>,
        },
        {
            title: 'Tipo',
            dataIndex: 'type',
            key: 'type',
            render: (t) => (
                <Tag color={JOB_TYPE_COLORS[t]}>{JOB_TYPE_LABELS[t] ?? t}</Tag>
            ),
        },
        ...(devMode ? [{
            title: 'ID técnico',
            dataIndex: 'id',
            key: 'id',
            render: (id) => <Text code style={{ fontSize: 11 }}>{id}</Text>,
        }] : []),
        {
            title: 'Esperando',
            dataIndex: 'waitingMs',
            key: 'waitingMs',
            render: formatDuration,
        },
        {
            title: '',
            key: 'action',
            width: 48,
            align: 'center',
            render: (_, job) => {
                const jobId = job.id ?? job.jobId;
                return (
                    <Tooltip title="Cancelar proceso pendiente">
                        <Button
                            danger
                            type="text"
                            size="small"
                            icon={<CloseOutlined />}
                            aria-label="Cancelar proceso pendiente"
                            loading={cancelingJobId === jobId}
                            disabled={!jobId || !!cancelingJobId || purgingQueue}
                            onClick={() => onCancelJob(jobId, 'queued')}
                        />
                    </Tooltip>
                );
            },
        },
    ];

    return (
        <div>
            {/* Proceso en curso */}
            <Card
                title={
                    <Space>
                        {running
                            ? <SyncOutlined spin style={{ color: '#1677ff' }} />
                            : <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        }
                        <Text strong>Estado actual</Text>
                    </Space>
                }
                extra={
                    runningId ? (
                        <Button
                            danger
                            size="small"
                            icon={<StopOutlined />}
                            loading={cancelingJobId === runningId}
                            disabled={!!cancelingJobId || purgingQueue}
                            onClick={() => onCancelJob(runningId, 'running')}
                        >
                            Cancelar proceso
                        </Button>
                    ) : null
                }
                size="small"
                style={{ marginBottom: 16 }}
            >
                {running ? (
                    <Descriptions column={2} size="small">
                        <Descriptions.Item label="Proceso en curso">
                            <Tag color={JOB_TYPE_COLORS[running.type]}>
                                {JOB_TYPE_LABELS[running.type] ?? running.type}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Tiempo transcurrido">
                            <Text strong style={{ color: '#1677ff' }}>
                                {formatDuration(elapsed)}
                            </Text>
                        </Descriptions.Item>
                        {devMode && (
                            <Descriptions.Item label="ID técnico" span={2}>
                                <Text code style={{ fontSize: 11 }}>{running.id}</Text>
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Iniciado">
                            {formatDate(running.startedAt)}
                        </Descriptions.Item>
                    </Descriptions>
                ) : (
                    <Text type="secondary">No hay procesos en ejecución.</Text>
                )}
            </Card>

            {/* Procesos pendientes */}
            <Card
                title={
                    <Space>
                        <HourglassOutlined />
                        <Text strong>Procesos pendientes</Text>
                        {statusData?.pending > 0 && (
                            <Badge count={statusData.pending} />
                        )}
                    </Space>
                }
                extra={
                    statusData?.pending > 0 ? (
                        <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            loading={purgingQueue}
                            disabled={!!cancelingJobId}
                            onClick={onPurgeQueue}
                        >
                            Borrar pendientes
                        </Button>
                    ) : null
                }
                size="small"
                style={{ marginBottom: 16 }}
            >
                {!statusData?.pending ? (
                    <Empty description="No hay procesos pendientes" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                    <Table
                        dataSource={pendingJobs}
                        rowKey={(job) => job.id ?? job.jobId}
                        pagination={false}
                        size="small"
                        columns={pendingColumns}
                    />
                )}
            </Card>

            {/* Stats rápidas */}
            {stats && (
                <Row gutter={[12, 12]}>
                    {[
                        { label: 'Total procesos', value: stats.total, icon: <BarChartOutlined />, color: undefined },
                        { label: 'Completados', value: stats.completed, icon: <CheckCircleOutlined />, color: '#52c41a' },
                        { label: 'Fallidos', value: stats.failed, icon: <CloseCircleOutlined />, color: stats.failed > 0 ? '#ff4d4f' : undefined },
                        { label: 'Duración prom.', value: formatDuration(stats.avgDurationMs), icon: <ClockCircleOutlined />, color: undefined },
                    ].map(s => (
                        <Col xs={12} sm={6} key={s.label}>
                            <Card size="small">
                                <Statistic
                                    title={s.label}
                                    value={s.value}
                                    valueStyle={{ color: s.color, fontSize: 20 }}
                                    prefix={s.icon}
                                />
                            </Card>
                        </Col>
                    ))}
                    {stats.lastCompletedAt && (
                        <Col xs={24}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Último proceso completado: {formatDate(stats.lastCompletedAt)}
                            </Text>
                        </Col>
                    )}
                </Row>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB: HISTORIAL DE PROCESOS
// ─────────────────────────────────────────────────────────────────────────────

const ProcesosHistoryTab = () => {
    const { devMode } = useAdminDevMode();
    const [jobs, setJobs]           = useState([]);
    const [total, setTotal]         = useState(0);
    const [page, setPage]           = useState(1);
    const [loading, setLoading]     = useState(false);
    const [isMobile, setIsMobile]   = useState(false);
    const [statusFilter, setStatus] = useState(undefined);
    const [typeFilter, setType]     = useState(undefined);
    const [selectedJob, setSelectedJob] = useState(null);
    const PAGE_SIZE = 15;

    const fetch = useCallback(async (p = 1, status, type) => {
        setLoading(true);
        try {
            const params = { page: p, limit: PAGE_SIZE };
            if (status) params.status = status;
            if (type)   params.type   = type;
            const res = await scraperAPI.getHistory(params);
            setJobs(res.data?.jobs ?? []);
            setTotal(res.data?.total ?? 0);
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al cargar historial'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetch(1, statusFilter, typeFilter); }, [fetch, statusFilter, typeFilter]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleFilter = () => {
        setPage(1);
    };

    const columns = [
        {
            title: 'Tipo',
            dataIndex: 'type',
            key: 'type',
            render: (t) => <Tag color={JOB_TYPE_COLORS[t]}>{JOB_TYPE_LABELS[t] ?? t}</Tag>,
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (s) => <StatusTag status={s} />,
        },
        {
            title: 'Alcance',
            key: 'scope',
            render: (_, r) => <ScopeTag type={r.type} params={r.params} />,
        },
        {
            title: 'Iniciado',
            dataIndex: 'startedAt',
            key: 'startedAt',
            render: formatDate,
        },
        {
            title: 'Duración',
            dataIndex: 'durationMs',
            key: 'durationMs',
            render: formatDuration,
        },
        {
            title: 'Espera',
            dataIndex: 'waitTimeMs',
            key: 'waitTimeMs',
            render: formatDuration,
        },
        {
            title: 'Resultado',
            key: 'result',
            render: (_, r) => renderJobResult(r),
        },
        {
            title: '',
            key: 'action',
            render: (_, r) => (
                <Button type="link" size="small" icon={<InfoCircleOutlined />} onClick={() => setSelectedJob(r)}>
                    Ver
                </Button>
            ),
        },
    ];

    const MobileJobCard = ({ job }) => (
        <Card
            size="small"
            style={{ marginBottom: 12 }}
            styles={{ body: { padding: 12 } }}
        >
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                    <Space direction="vertical" size={4} style={{ minWidth: 0 }}>
                        <Tag color={JOB_TYPE_COLORS[job.type]} style={{ marginRight: 0, whiteSpace: 'normal' }}>
                            {JOB_TYPE_LABELS[job.type] ?? job.type}
                        </Tag>
                        {devMode && (
                            <Text code style={{ fontSize: 11, wordBreak: 'break-all' }}>{job.jobId}</Text>
                        )}
                    </Space>
                    <StatusTag status={job.status} />
                </div>

                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Iniciado</Text>
                        <Text style={{ fontSize: 12, textAlign: 'right' }}>{formatDate(job.startedAt)}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Duración</Text>
                        <Text style={{ fontSize: 12 }}>{formatDuration(job.durationMs)}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Espera</Text>
                        <Text style={{ fontSize: 12 }}>{formatDuration(job.waitTimeMs)}</Text>
                    </div>
                </Space>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <Space size={4} wrap>
                        <ScopeTag type={job.type} params={job.params} />
                        {renderJobResult(job)}
                    </Space>
                    <Button
                        type="link"
                        size="small"
                        icon={<InfoCircleOutlined />}
                        onClick={() => setSelectedJob(job)}
                    >
                        Ver
                    </Button>
                </div>
            </Space>
        </Card>
    );

    return (
        <>
            {/* Filtros */}
            <Space style={{ marginBottom: 16 }} wrap>
                <Select
                    placeholder="Estado"
                    allowClear
                    style={{ width: 140 }}
                    value={statusFilter}
                    onChange={(v) => { setStatus(v); handleFilter(); }}
                    options={[
                        { value: 'enqueued',  label: 'En espera' },
                        { value: 'running',   label: 'Ejecutando' },
                        { value: 'completed', label: 'Completado' },
                        { value: 'failed',    label: 'Fallido' },
                        { value: 'canceled',  label: 'Cancelado' },
                    ]}
                />
                <Select
                    placeholder="Tipo"
                    allowClear
                    style={{ width: 180 }}
                    value={typeFilter}
                    onChange={(v) => { setType(v); handleFilter(); }}
                    options={[
                        ...(devMode ? [{ value: 'sitemapScraper',  label: 'Actualización por sitemap' }] : []),
                        { value: 'categoryScraper', label: 'Actualizar catálogo' },
                        ...(devMode ? [{ value: 'sitemapAnalysis', label: 'Análisis técnico' }] : []),
                        { value: 'priceCheck',      label: 'Revisar precios' },
                        { value: 'categoriesRestore', label: 'Restaurar categorías' },
                        ...(devMode ? [{ value: 'categoriesReorganize', label: 'Reorganizar categorías' }] : []),
                    ]}
                />
            </Space>

            {isMobile ? (
                <Spin spinning={loading}>
                    {jobs.length === 0 ? (
                        <Empty description="Sin registros" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    ) : (
                        jobs.map((job) => (
                            <MobileJobCard key={job.jobId} job={job} />
                        ))
                    )}
                </Spin>
            ) : (
                <Table
                    dataSource={jobs}
                    columns={columns}
                    rowKey="jobId"
                    loading={loading}
                    pagination={false}
                    size="small"
                    scroll={{ x: 900 }}
                    locale={{ emptyText: <Empty description="Sin registros" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                />
            )}

            {total > PAGE_SIZE && (
                <div style={{ textAlign: 'right', marginTop: 12 }}>
                    <Pagination
                        current={page}
                        total={total}
                        pageSize={PAGE_SIZE}
                        showTotal={(t) => `${t} procesos`}
                        onChange={(p) => { setPage(p); fetch(p, statusFilter, typeFilter); }}
                        showSizeChanger={false}
                        size="small"
                    />
                </div>
            )}

            <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
        </>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB: HISTORIAL PRICE CHECK
// ─────────────────────────────────────────────────────────────────────────────

const PriceCheckTab = () => {
    const [triggering, setTriggering] = useState(false);
    const [latest, setLatest]         = useState(null);
    const [history, setHistory]       = useState([]);
    const [total, setTotal]           = useState(0);
    const [page, setPage]             = useState(1);
    const [loadingHist, setLoadHist]  = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const PAGE_SIZE = 10;

    const fetchLatest = useCallback(async () => {
        try {
            const res = await scraperAPI.getPriceCheckLatest();
            setLatest(res.data);
        } catch (err) {
            if (err.response?.status !== 404) {
                message.error(getApiErrorMessage(err, 'Error al cargar la última revisión de precios'));
            }
        }
    }, []);

    const fetchHistory = useCallback(async (p = 1) => {
        setLoadHist(true);
        try {
            const res = await scraperAPI.getPriceCheckHistory({ page: p, limit: PAGE_SIZE });
            setHistory(res.data.results ?? []);
            setTotal(res.data.total ?? 0);
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al cargar historial'));
        } finally {
            setLoadHist(false);
        }
    }, []);

    useEffect(() => {
        fetchLatest();
        fetchHistory(1);
    }, [fetchLatest, fetchHistory]);

    const handleTrigger = async () => {
        setTriggering(true);
        try {
            await scraperAPI.triggerPriceCheck();
            message.success('Revisión de precios iniciada');
            // Refresh latest after a short delay
            setTimeout(fetchLatest, 2000);
        } catch (err) {
            const errMsg = err.response?.data?.error || 'Error al iniciar la revisión de precios';
            if (err.response?.status === 503) {
                message.error(`Backend no configurado: ${errMsg}`);
            } else {
                message.error(getApiErrorMessage(err, errMsg));
            }
        } finally {
            setTriggering(false);
        }
    };

    const columns = [
        {
            title: 'Ejecutado',
            dataIndex: 'checkedAt',
            key: 'checkedAt',
            render: formatDate,
        },
        {
            title: 'Cambiados',
            key: 'changed',
            align: 'center',
            render: (_, r) => (
                <Tag color={r.summary?.changed > 0 ? 'orange' : 'green'}>
                    {r.summary?.changed ?? 0}
                </Tag>
            ),
        },
        {
            title: 'Nuevos',
            key: 'new',
            align: 'center',
            render: (_, r) => r.summary?.new ?? 0,
        },
        {
            title: 'Eliminados',
            key: 'removed',
            align: 'center',
            render: (_, r) => r.summary?.removed ?? 0,
        },
        {
            title: 'Total origen',
            key: 'total',
            align: 'center',
            render: (_, r) => r.summary?.total_odoo ?? '—',
        },
        {
            title: 'Duración',
            key: 'duration',
            render: (_, r) => formatDuration(r.durationMs),
        },
        {
            title: '',
            key: 'action',
            render: (_, r) => (
                <Button type="link" size="small" icon={<InfoCircleOutlined />} onClick={() => setSelectedId(r._id)}>
                    Ver
                </Button>
            ),
        },
    ];

    return (
        <>
            {/* Trigger button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    loading={triggering}
                    onClick={handleTrigger}
                >
                    Revisar precios
                </Button>
            </div>

            {/* Último resultado */}
            {latest && (
                <Alert
                    type={latest.summary?.changed > 0 ? 'warning' : 'success'}
                    showIcon
                    style={{ marginBottom: 16 }}
                    message={
                        <Space wrap>
                            <Text strong>Última revisión:</Text>
                            <Text type="secondary">{formatDate(latest.checkedAt)}</Text>
                            <Tag color="orange">{latest.summary?.changed ?? 0} cambiados</Tag>
                            <Tag color="blue">{latest.summary?.new ?? 0} nuevos</Tag>
                            <Tag color="default">{latest.summary?.removed ?? 0} eliminados</Tag>
                            <Button
                                type="link"
                                size="small"
                                style={{ padding: 0 }}
                                onClick={() => setSelectedId(latest._id)}
                            >
                                Ver detalle
                            </Button>
                        </Space>
                    }
                />
            )}

            {/* Historial */}
            <Table
                dataSource={history}
                columns={columns}
                rowKey="_id"
                loading={loadingHist}
                pagination={false}
                size="small"
                locale={{ emptyText: <Empty description="Sin verificaciones aún" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            />

            {total > PAGE_SIZE && (
                <div style={{ textAlign: 'right', marginTop: 12 }}>
                    <Pagination
                        current={page}
                        total={total}
                        pageSize={PAGE_SIZE}
                        showTotal={(t) => `${t} verificaciones`}
                        onChange={(p) => { setPage(p); fetchHistory(p); }}
                        showSizeChanger={false}
                        size="small"
                    />
                </div>
            )}

            <PriceCheckDetailModal id={selectedId} onClose={() => setSelectedId(null)} />
        </>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

const JobsPage = () => {
    const { devMode } = useAdminDevMode();
    const [statusData, setStatusData] = useState(null);
    const [stats, setStats]           = useState(null);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [triggerOpen, setTriggerOpen] = useState(false);
    const [cancelingJobId, setCancelingJobId] = useState(null);
    const [purgingQueue, setPurgingQueue] = useState(false);

    const fetchQueue = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const [statusRes, statsRes] = await Promise.all([
                scraperAPI.getStatus(),
                scraperAPI.getStats(),
            ]);
            setStatusData(statusRes.data);
            setStats(statsRes.data);
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al cargar el estado de procesos'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchQueue(); }, [fetchQueue]);

    // Polling cada 10s mientras hay algo corriendo
    useEffect(() => {
        if (!statusData?.isRunning) return;
        const interval = setInterval(() => fetchQueue(true), 10000);
        return () => clearInterval(interval);
    }, [statusData?.isRunning, fetchQueue]);

    const cancelJob = async (jobId) => {
        if (!jobId) return;
        setCancelingJobId(jobId);
        try {
            await scraperAPI.cancelJob(jobId);
            message.success('Proceso cancelado');
            fetchQueue(true);
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al cancelar el proceso'));
        } finally {
            setCancelingJobId(null);
        }
    };

    const handleCancelJob = (jobId, location) => {
        Modal.confirm({
            title: location === 'running' ? 'Cancelar proceso en curso' : 'Cancelar proceso pendiente',
            content: location === 'running'
                ? 'El proceso en curso se marcará para cancelación. Puede tardar unos instantes en detenerse.'
                : 'El proceso pendiente se eliminará de la lista de espera. No modifica productos ni precios.',
            okText: location === 'running' ? 'Cancelar proceso' : 'Quitar pendiente',
            okButtonProps: { danger: true },
            cancelText: 'Volver',
            onOk: () => cancelJob(jobId),
        });
    };

    const handlePurgeQueue = () => {
        Modal.confirm({
            title: 'Borrar procesos pendientes',
            content: 'Se eliminarán todos los procesos pendientes. El proceso en curso no se interrumpe.',
            okText: 'Borrar pendientes',
            okButtonProps: { danger: true },
            cancelText: 'Volver',
            onOk: async () => {
                setPurgingQueue(true);
                try {
                    await scraperAPI.purgeQueue();
                    message.success('Procesos pendientes borrados');
                    fetchQueue(true);
                } catch (error) {
                    message.error(getApiErrorMessage(error, 'Error al borrar procesos pendientes'));
                } finally {
                    setPurgingQueue(false);
                }
            },
        });
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <Spin size="large" />
            </div>
        );
    }

    const tabs = [
        {
            key: 'queue',
            label: (
                <Space>
                    {statusData?.isRunning
                        ? <SyncOutlined spin style={{ color: '#1677ff' }} />
                        : <HourglassOutlined />
                    }
                    Procesos pendientes
                    {statusData?.pending > 0 && (
                        <Badge count={statusData.pending} size="small" />
                    )}
                </Space>
            ),
            children: (
                <QueueTab
                    statusData={statusData}
                    stats={stats}
                    onCancelJob={handleCancelJob}
                    onPurgeQueue={handlePurgeQueue}
                    cancelingJobId={cancelingJobId}
                    purgingQueue={purgingQueue}
                    devMode={devMode}
                />
            ),
        },
        {
            key: 'history',
            label: <Space><UnorderedListOutlined />Historial</Space>,
            children: <ProcesosHistoryTab />,
        },
        {
            key: 'pricecheck',
            label: <Space><DollarOutlined />Revisar precios</Space>,
            children: <PriceCheckTab />,
        },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Space>
                    <RobotOutlined style={{ fontSize: 22, color: '#1677ff' }} />
                    <Title level={4} style={{ margin: 0 }}>Procesos</Title>
                    {statusData?.isRunning && <Badge status="processing" text="En ejecución" />}
                </Space>
                <Space>
                    <Button
                        icon={<ReloadOutlined spin={refreshing} />}
                        onClick={() => fetchQueue(true)}
                        loading={refreshing}
                    >
                        Actualizar
                    </Button>
                    <Button
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        onClick={() => setTriggerOpen(true)}
                    >
                        Iniciar proceso
                    </Button>
                </Space>
            </div>

            <Tabs items={tabs} defaultActiveKey="queue" />

            <TriggerModal
                open={triggerOpen}
                onClose={() => setTriggerOpen(false)}
                onSuccess={() => fetchQueue(true)}
                devMode={devMode}
            />
        </div>
    );
};

export default JobsPage;

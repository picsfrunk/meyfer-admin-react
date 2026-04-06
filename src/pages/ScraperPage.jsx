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
} from '@ant-design/icons';
import { scraperAPI } from '../services/scraperAPI';
import { getApiErrorMessage } from '../utils/apiError';

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
    sitemapScraper:  'Sitemap Scraper',
    categoryScraper: 'Category Scraper',
    sitemapAnalysis: 'Análisis Sitemap',
    priceCheck:      'Price Check',
};

const JOB_TYPE_COLORS = {
    sitemapScraper:  'blue',
    categoryScraper: 'purple',
    sitemapAnalysis: 'cyan',
    priceCheck:      'orange',
};

const STATUS_CONFIG = {
    enqueued:  { color: 'default',    icon: <HourglassOutlined />,  label: 'En cola'    },
    running:   { color: 'processing', icon: <SyncOutlined spin />,  label: 'Ejecutando' },
    completed: { color: 'success',    icon: <CheckCircleOutlined />, label: 'Completado' },
    failed:    { color: 'error',      icon: <CloseCircleOutlined />, label: 'Fallido'    },
};

const StatusTag = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || { color: 'default', icon: null, label: status };
    return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
};

/**
 * Muestra el alcance del job.
 * Para categoryScraper muestra los IDs de categoría o "Todas".
 * Para otros tipos no muestra nada.
 */
const ScopeTag = ({ type, params }) => {
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

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER MODAL
// ─────────────────────────────────────────────────────────────────────────────

const TriggerModal = ({ open, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(null);

    const handleTrigger = async (scraperType) => {
        setLoading(scraperType);
        try {
            const res = await scraperAPI.triggerScraper(scraperType);
            const queued = res.data.status === 'queued';
            message.success(
                queued
                    ? `Encolado en posición ${res.data.position}`
                    : 'Iniciado correctamente'
            );
            onSuccess();
            onClose();
        } catch (err) {
            message.error(getApiErrorMessage(err, 'Error al disparar'));
        } finally {
            setLoading(null);
        }
    };

    const handleAnalyze = async () => {
        setLoading('sitemapAnalysis');
        try {
            await scraperAPI.triggerAnalysis();
            message.success('Análisis iniciado');
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
            message.success('Verificación de precios iniciada');
            onSuccess();
            onClose();
        } catch (err) {
            const errMsg = err.response?.data?.error || 'Error al iniciar price check';
            if (err.response?.status === 503) {
                message.error(`Backend no configurado: ${errMsg}`);
            } else {
                message.error(getApiErrorMessage(err, errMsg));
            }
        } finally {
            setLoading(null);
        }
    };

    const actions = [
        {
            key: 'sitemapScraper',
            label: 'Sitemap Scraper',
            desc: 'Scraping completo desde el sitemap',
            icon: <PlayCircleOutlined />,
            type: 'primary',
            onClick: () => handleTrigger('sitemapScraper'),
        },
        {
            key: 'categoryScraper',
            label: 'Category Scraper',
            desc: 'Scraping por categorías',
            icon: <PlayCircleOutlined />,
            type: 'primary',
            onClick: () => handleTrigger('categoryScraper'),
        },
        {
            key: 'sitemapAnalysis',
            label: 'Análisis de Sitemap',
            desc: 'Solo análisis, sin scraping',
            icon: <BarChartOutlined />,
            type: 'default',
            onClick: handleAnalyze,
        },
        {
            key: 'priceCheck',
            label: 'Price Check',
            desc: 'Verificación de precios contra Odoo',
            icon: <DollarOutlined />,
            type: 'default',
            onClick: handlePriceCheck,
        },
    ];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            title={<Space><ThunderboltOutlined />Disparar proceso</Space>}
            width={440}
        >
            <Space direction="vertical" style={{ width: '100%' }} size={10}>
                {actions.map(a => (
                    <Card
                        key={a.key}
                        size="small"
                        hoverable
                        style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                        onClick={() => !loading && a.onClick()}
                    >
                        <Space>
                            <Button
                                type={a.type}
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
    if (!job) return null;
    const result = job.result;
    const isPriceCheck = job.type === 'priceCheck';

    return (
        <Modal
            open={!!job}
            onCancel={onClose}
            footer={<Button onClick={onClose}>Cerrar</Button>}
            title={
                <Space>
                    <RobotOutlined />
                    <span>Detalle del Job</span>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>{job.jobId}</Text>
                </Space>
            }
            width={640}
        >
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Tipo">
                    <Tag color={JOB_TYPE_COLORS[job.type]}>{JOB_TYPE_LABELS[job.type] ?? job.type}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Estado"><StatusTag status={job.status} /></Descriptions.Item>
                <Descriptions.Item label="Encolado">{formatDate(job.enqueuedAt)}</Descriptions.Item>
                <Descriptions.Item label="Iniciado">{formatDate(job.startedAt)}</Descriptions.Item>
                <Descriptions.Item label="Finalizado">{formatDate(job.finishedAt)}</Descriptions.Item>
                <Descriptions.Item label="Duración">{formatDuration(job.durationMs)}</Descriptions.Item>
                <Descriptions.Item label="Espera en cola">{formatDuration(job.waitTimeMs)}</Descriptions.Item>
                <Descriptions.Item label="Posición al encolar">{job.queuePosition ?? '—'}</Descriptions.Item>
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
            </Descriptions>

            {result && (
                <>
                    <Divider orientation="left" style={{ fontSize: 13 }}>Resultado</Divider>
                    {result.error && (
                        <Alert type="error" message={result.error} style={{ marginBottom: 12 }} showIcon />
                    )}
                    {isPriceCheck && result.summary ? (
                        <Descriptions bordered column={2} size="small">
                            <Descriptions.Item label="Cambiados">
                                <Text type={result.summary.changed > 0 ? 'warning' : 'success'}>
                                    {result.summary.changed ?? '—'}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Nuevos">{result.summary.new ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="Eliminados">{result.summary.removed ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="Sin resp. Odoo">{result.summary.failed ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="Total Odoo">{result.summary.total_odoo ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="Total DB">{result.summary.total_db ?? '—'}</Descriptions.Item>
                        </Descriptions>
                    ) : (
                        <Descriptions bordered column={2} size="small">
                            <Descriptions.Item label="Procesados">{result.processed ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="Guardados">{result.total ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="Errores">
                                <Text type={result.errors > 0 ? 'danger' : 'success'}>{result.errors ?? '—'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Imágenes subidas">{result.uploaded ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="Huérfanos eliminados">{result.orphansDeleted ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="Duración interna">{formatDuration(result.durationMs)}</Descriptions.Item>
                        </Descriptions>
                    )}
                </>
            )}

            {!result && ['enqueued', 'running'].includes(job.status) && (
                <Alert type="info" message="El job aún no produjo resultados." showIcon />
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
            title={<Space><DollarOutlined /><span>Detalle de Price Check</span></Space>}
            width={820}
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
            ) : data && (
                <>
                    <Descriptions bordered column={3} size="small" style={{ marginBottom: 16 }}>
                        <Descriptions.Item label="Ejecutado">{formatDate(data.checkedAt)}</Descriptions.Item>
                        <Descriptions.Item label="Duración">{formatDuration(data.durationMs)}</Descriptions.Item>
                        <Descriptions.Item label="Total Odoo">{data.summary?.total_odoo ?? '—'}</Descriptions.Item>
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
                            message={`${data.newIds.length} producto${data.newIds.length !== 1 ? 's' : ''} nuevo${data.newIds.length !== 1 ? 's' : ''} detectado${data.newIds.length !== 1 ? 's' : ''} en Odoo`}
                        />
                    )}
                    {data.removedIds?.length > 0 && (
                        <Alert type="warning" style={{ marginTop: 12 }} showIcon
                            message={`${data.removedIds.length} producto${data.removedIds.length !== 1 ? 's' : ''} ausente${data.removedIds.length !== 1 ? 's' : ''} en Odoo pero presentes en DB`}
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

const QueueTab = ({ statusData, stats, refreshing, onRefresh }) => {
    const [elapsed, setElapsed] = useState(statusData?.running?.elapsedMs ?? 0);

    useEffect(() => {
        if (!statusData?.running) return;
        setElapsed(statusData.running.elapsedMs ?? 0);
        const interval = setInterval(() => setElapsed(e => e + 1000), 1000);
        return () => clearInterval(interval);
    }, [statusData?.running]);

    const running = statusData?.running;

    return (
        <div>
            {/* Job corriendo */}
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
                size="small"
                style={{ marginBottom: 16 }}
            >
                {running ? (
                    <Descriptions column={2} size="small">
                        <Descriptions.Item label="Job en ejecución">
                            <Tag color={JOB_TYPE_COLORS[running.type]}>
                                {JOB_TYPE_LABELS[running.type] ?? running.type}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Tiempo transcurrido">
                            <Text strong style={{ color: '#1677ff' }}>
                                {formatDuration(elapsed)}
                            </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="ID" span={2}>
                            <Text code style={{ fontSize: 11 }}>{running.id}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Iniciado">
                            {formatDate(running.startedAt)}
                        </Descriptions.Item>
                    </Descriptions>
                ) : (
                    <Text type="secondary">No hay ningún job en ejecución.</Text>
                )}
            </Card>

            {/* Cola de espera */}
            <Card
                title={
                    <Space>
                        <HourglassOutlined />
                        <Text strong>Cola de espera</Text>
                        {statusData?.pending > 0 && (
                            <Badge count={statusData.pending} />
                        )}
                    </Space>
                }
                size="small"
                style={{ marginBottom: 16 }}
            >
                {!statusData?.pending ? (
                    <Empty description="Cola vacía" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                    <Table
                        dataSource={statusData.pendingJobs}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        columns={[
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
                        ]}
                    />
                )}
            </Card>

            {/* Stats rápidas */}
            {stats && (
                <Row gutter={[12, 12]}>
                    {[
                        { label: 'Total jobs', value: stats.total, icon: <BarChartOutlined />, color: undefined },
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
                                Último job completado: {formatDate(stats.lastCompletedAt)}
                            </Text>
                        </Col>
                    )}
                </Row>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB: HISTORIAL SCRAPERS
// ─────────────────────────────────────────────────────────────────────────────

const ScraperHistoryTab = () => {
    const [jobs, setJobs]           = useState([]);
    const [total, setTotal]         = useState(0);
    const [page, setPage]           = useState(1);
    const [loading, setLoading]     = useState(false);
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

    useEffect(() => { fetch(1, statusFilter, typeFilter); }, [fetch]);

    const handleFilter = (newStatus, newType) => {
        setPage(1);
        fetch(1, newStatus, newType);
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
            render: (_, r) => {
                const res = r.result;
                if (!res) return <Text type="secondary">—</Text>;
                if (res.error) return <Text type="danger">Error</Text>;
                if (r.type === 'priceCheck') {
                    return (
                        <Tooltip title={`${res.summary?.new ?? 0} nuevos · ${res.summary?.removed ?? 0} eliminados`}>
                            <Tag color={res.summary?.changed > 0 ? 'orange' : 'green'}>
                                {res.summary?.changed ?? 0} cambios
                            </Tag>
                        </Tooltip>
                    );
                }
                return (
                    <Tooltip title={`${res.errors ?? 0} errores`}>
                        <Text>{res.total ?? '—'} guardados</Text>
                    </Tooltip>
                );
            },
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

    return (
        <>
            {/* Filtros */}
            <Space style={{ marginBottom: 16 }} wrap>
                <Select
                    placeholder="Estado"
                    allowClear
                    style={{ width: 140 }}
                    value={statusFilter}
                    onChange={(v) => { setStatus(v); handleFilter(v, typeFilter); }}
                    options={[
                        { value: 'enqueued',  label: 'En cola' },
                        { value: 'running',   label: 'Ejecutando' },
                        { value: 'completed', label: 'Completado' },
                        { value: 'failed',    label: 'Fallido' },
                    ]}
                />
                <Select
                    placeholder="Tipo"
                    allowClear
                    style={{ width: 180 }}
                    value={typeFilter}
                    onChange={(v) => { setType(v); handleFilter(statusFilter, v); }}
                    options={[
                        { value: 'sitemapScraper',  label: 'Sitemap Scraper' },
                        { value: 'categoryScraper', label: 'Category Scraper' },
                        { value: 'sitemapAnalysis', label: 'Análisis Sitemap' },
                        { value: 'priceCheck',      label: 'Price Check' },
                    ]}
                />
            </Space>

            <Table
                dataSource={jobs}
                columns={columns}
                rowKey="jobId"
                loading={loading}
                pagination={false}
                size="small"
                locale={{ emptyText: <Empty description="Sin registros" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            />

            {total > PAGE_SIZE && (
                <div style={{ textAlign: 'right', marginTop: 12 }}>
                    <Pagination
                        current={page}
                        total={total}
                        pageSize={PAGE_SIZE}
                        showTotal={(t) => `${t} jobs`}
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
                message.error(getApiErrorMessage(err, 'Error al cargar ultimo price check'));
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
            message.success('Verificación de precios iniciada');
            // Refresh latest after a short delay
            setTimeout(fetchLatest, 2000);
        } catch (err) {
            const errMsg = err.response?.data?.error || 'Error al iniciar price check';
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
            title: 'Total Odoo',
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
                    Ejecutar verificación
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
                            <Text strong>Último check:</Text>
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

const ScraperPage = () => {
    const [statusData, setStatusData] = useState(null);
    const [stats, setStats]           = useState(null);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [triggerOpen, setTriggerOpen] = useState(false);

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
            message.error(getApiErrorMessage(error, 'Error al cargar estado de la cola'));
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
                    Cola
                    {statusData?.pending > 0 && (
                        <Badge count={statusData.pending} size="small" />
                    )}
                </Space>
            ),
            children: (
                <QueueTab
                    statusData={statusData}
                    stats={stats}
                    refreshing={refreshing}
                    onRefresh={() => fetchQueue(true)}
                />
            ),
        },
        {
            key: 'history',
            label: <Space><UnorderedListOutlined />Historial Scrapers</Space>,
            children: <ScraperHistoryTab />,
        },
        {
            key: 'pricecheck',
            label: <Space><DollarOutlined />Price Check</Space>,
            children: <PriceCheckTab />,
        },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Space>
                    <RobotOutlined style={{ fontSize: 22, color: '#1677ff' }} />
                    <Title level={4} style={{ margin: 0 }}>Monitor de Scrapers</Title>
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
                        Disparar
                    </Button>
                </Space>
            </div>

            <Tabs items={tabs} defaultActiveKey="queue" />

            <TriggerModal
                open={triggerOpen}
                onClose={() => setTriggerOpen(false)}
                onSuccess={() => fetchQueue(true)}
            />
        </div>
    );
};

export default ScraperPage;

import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    Descriptions,
    Divider,
    Empty,
    Form,
    Input,
    Row,
    Space,
    Tag,
    Typography,
    Upload,
    message,
} from 'antd';
import {
    CloudUploadOutlined,
    FileExcelOutlined,
    LinkOutlined,
    PlayCircleOutlined,
    ReloadOutlined,
    SaveOutlined,
    UploadOutlined,
} from '@ant-design/icons';
import { priceListImportService } from '../services/priceListImportService';
import { getApiErrorMessage } from '../utils/apiError';

const { Paragraph, Text, Title } = Typography;

const ALLOWED_EXTENSIONS = ['csv', 'xlsx'];

const formatDate = (value) => {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

const getFileExtension = (fileName = '') => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

const isAllowedFile = (file) => ALLOWED_EXTENSIONS.includes(getFileExtension(file?.name));

const normalizeSettings = (data) => data?.settings || data?.data || data || {};

const getSourceUrl = (settings) => (
    settings?.sourceUrl ||
    settings?.source_url ||
    ''
);

const getLastValue = (settings, key) => (
    settings?.[key] ||
    settings?.lastImport?.[key] ||
    settings?.lastRun?.[key] ||
    null
);

const getLastSummary = (settings) => (
    settings?.lastResult ||
    settings?.summary ||
    settings?.lastImport?.lastResult ||
    settings?.lastImport?.summary ||
    null
);

const getResponseJobId = (data) => data?.jobId || data?.result?.jobId || '—';
const getResponseFileId = (data) => data?.fileId || data?.result?.fileId || null;

const JsonPreview = ({ value }) => {
    if (!value) {
        return <Text type="secondary">Sin datos registrados.</Text>;
    }

    return (
        <pre style={{
            margin: 0,
            maxHeight: 260,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: '#f5f5f5',
            border: '1px solid #f0f0f0',
            borderRadius: 6,
            padding: 12,
        }}
        >
            {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
        </pre>
    );
};

const ImportResponse = ({ response }) => {
    if (!response) {
        return (
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Todavía no se ejecutó una importación en esta sesión."
            />
        );
    }

    return (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Mensaje">
                    {response.message || 'Importación iniciada'}
                </Descriptions.Item>
                <Descriptions.Item label="jobId">
                    <Text code>{getResponseJobId(response)}</Text>
                </Descriptions.Item>
                {getResponseFileId(response) ? (
                    <Descriptions.Item label="fileId">
                        <Text code>{getResponseFileId(response)}</Text>
                    </Descriptions.Item>
                ) : null}
            </Descriptions>

            {response.result ? (
                <>
                    <Text strong>Respuesta completa</Text>
                    <JsonPreview value={response.result} />
                </>
            ) : null}
        </Space>
    );
};

const LastKnownStatus = ({ settings }) => {
    const lastSummary = getLastSummary(settings);

    return (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="lastScraperJobId">
                    {getLastValue(settings, 'lastScraperJobId')
                        ? <Text code>{getLastValue(settings, 'lastScraperJobId')}</Text>
                        : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="lastStatus">
                    {getLastValue(settings, 'lastStatus')
                        ? <Tag color="blue">{getLastValue(settings, 'lastStatus')}</Tag>
                        : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="lastRunAt">
                    {formatDate(getLastValue(settings, 'lastRunAt'))}
                </Descriptions.Item>
                <Descriptions.Item label="lastError">
                    {getLastValue(settings, 'lastError') || '—'}
                </Descriptions.Item>
            </Descriptions>

            <div>
                <Text strong>lastResult / summary</Text>
                <div style={{ marginTop: 8 }}>
                    <JsonPreview value={lastSummary} />
                </div>
            </div>
        </Space>
    );
};

const PriceListImportPage = () => {
    const [form] = Form.useForm();
    const [settings, setSettings] = useState({});
    const [lastResponse, setLastResponse] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [runningUrl, setRunningUrl] = useState(false);
    const [uploading, setUploading] = useState(false);

    const configuredUrl = useMemo(() => getSourceUrl(settings), [settings]);

    const loadSettings = async () => {
        setSettingsLoading(true);
        try {
            const response = await priceListImportService.getSettings();
            const nextSettings = normalizeSettings(response.data);
            setSettings(nextSettings);
            form.setFieldsValue({ sourceUrl: getSourceUrl(nextSettings) });
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al cargar la configuración de lista de precios'));
        } finally {
            setSettingsLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleSaveSettings = async ({ sourceUrl }) => {
        const trimmedUrl = sourceUrl?.trim();
        if (!trimmedUrl) {
            message.warning('Ingresá una URL para guardar la configuración');
            return;
        }

        setSaving(true);
        try {
            const response = await priceListImportService.updateSettings(trimmedUrl);
            const nextSettings = normalizeSettings(response.data);
            setSettings({ ...settings, ...nextSettings, sourceUrl: getSourceUrl(nextSettings) || trimmedUrl });
            form.setFieldsValue({ sourceUrl: getSourceUrl(nextSettings) || trimmedUrl });
            message.success('URL de lista de precios guardada correctamente');
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al guardar la URL de lista de precios'));
        } finally {
            setSaving(false);
        }
    };

    const handleRunConfiguredUrl = async () => {
        if (!configuredUrl) {
            message.warning('Guardá una URL de lista de precios antes de ejecutar la importación');
            return;
        }

        setRunningUrl(true);
        try {
            const response = await priceListImportService.runConfiguredUrl();
            setLastResponse(response.data);
            message.success(response.data?.message || 'Importación desde URL iniciada');
            await loadSettings();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al ejecutar la importación desde URL'));
        } finally {
            setRunningUrl(false);
        }
    };

    const handleFileSelect = (file) => {
        if (!isAllowedFile(file)) {
            message.error('Solo se aceptan archivos .csv o .xlsx');
            setSelectedFile(null);
            return Upload.LIST_IGNORE;
        }

        setSelectedFile(file);
        return false;
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            message.warning('Seleccioná un archivo CSV o XLSX para importar');
            return;
        }

        if (!isAllowedFile(selectedFile)) {
            message.error('Solo se aceptan archivos .csv o .xlsx');
            setSelectedFile(null);
            return;
        }

        setUploading(true);
        try {
            const response = await priceListImportService.uploadFile(selectedFile);
            setLastResponse(response.data);
            setSelectedFile(null);
            message.success(response.data?.message || 'Importación desde archivo iniciada');
            await loadSettings();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al subir la lista de precios'));
        } finally {
            setUploading(false);
        }
    };

    const uploadFileList = selectedFile ? [{
        uid: selectedFile.uid || selectedFile.name,
        name: selectedFile.name,
        status: 'done',
    }] : [];

    return (
        <div>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                    <Title level={2}>Importación de lista de precios</Title>
                    <Paragraph type="secondary">
                        Configurá la fuente de lista de precios y dispará la importación desde el backend.
                    </Paragraph>
                </div>

                <Alert
                    type="warning"
                    showIcon
                    message="Alcance funcional"
                    description={(
                        <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                            <li>Este proceso solo actualiza precios de productos existentes.</li>
                            <li>La columna Codigo se usa como product_id.</li>
                            <li>La columna Precio se usa como list_price.</li>
                            <li>No crea productos.</li>
                            <li>No elimina productos.</li>
                            <li>No modifica categorías, marcas, imágenes, nombres ni descripciones.</li>
                        </ul>
                    )}
                />

                <Row gutter={[16, 16]}>
                    <Col span={24} lg={14}>
                        <Card
                            title={(
                                <Space>
                                    <LinkOutlined />
                                    URL configurada
                                </Space>
                            )}
                            loading={settingsLoading}
                            extra={(
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={loadSettings}
                                    loading={settingsLoading}
                                    size="small"
                                >
                                    Actualizar
                                </Button>
                            )}
                        >
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleSaveSettings}
                            >
                                <Form.Item
                                    label="URL de lista de precios"
                                    name="sourceUrl"
                                    rules={[
                                        { required: true, message: 'La URL es requerida' },
                                        { whitespace: true, message: 'La URL es requerida' },
                                    ]}
                                >
                                    <Input
                                        prefix={<LinkOutlined />}
                                        placeholder="https://..."
                                        disabled={saving || runningUrl}
                                    />
                                </Form.Item>

                                <Space wrap>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        icon={<SaveOutlined />}
                                        loading={saving}
                                    >
                                        Guardar URL
                                    </Button>
                                    <Button
                                        icon={<PlayCircleOutlined />}
                                        onClick={handleRunConfiguredUrl}
                                        disabled={!configuredUrl}
                                        loading={runningUrl}
                                    >
                                        Ejecutar desde URL configurada
                                    </Button>
                                </Space>
                            </Form>

                            {!configuredUrl ? (
                                <Alert
                                    type="info"
                                    showIcon
                                    message="No hay URL configurada"
                                    description="Guardá una URL antes de ejecutar la importación desde fuente configurada."
                                    style={{ marginTop: 16 }}
                                />
                            ) : (
                                <Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
                                    <Text type="secondary">Actual: </Text>
                                    <Text code>{configuredUrl}</Text>
                                </Paragraph>
                            )}
                        </Card>
                    </Col>

                    <Col span={24} lg={10}>
                        <Card
                            title={(
                                <Space>
                                    <CloudUploadOutlined />
                                    Archivo manual
                                </Space>
                            )}
                        >
                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                <Upload
                                    accept=".csv,.xlsx"
                                    beforeUpload={handleFileSelect}
                                    fileList={uploadFileList}
                                    maxCount={1}
                                    onRemove={handleRemoveFile}
                                >
                                    <Button icon={<UploadOutlined />} disabled={uploading}>
                                        Seleccionar CSV/XLSX
                                    </Button>
                                </Upload>

                                {selectedFile ? (
                                    <Alert
                                        type="success"
                                        showIcon
                                        message="Archivo seleccionado"
                                        description={selectedFile.name}
                                    />
                                ) : (
                                    <Text type="secondary">
                                        Se aceptan únicamente archivos .csv o .xlsx. No se acepta .xls.
                                    </Text>
                                )}

                                <Button
                                    type="primary"
                                    icon={<FileExcelOutlined />}
                                    onClick={handleUpload}
                                    loading={uploading}
                                    disabled={!selectedFile}
                                    block
                                >
                                    Ejecutar importación desde archivo
                                </Button>
                            </Space>
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col span={24} lg={12}>
                        <Card title="Respuesta inmediata del backend">
                            <ImportResponse response={lastResponse} />
                        </Card>
                    </Col>

                    <Col span={24} lg={12}>
                        <Card title="Último estado conocido" loading={settingsLoading}>
                            <LastKnownStatus settings={settings} />
                        </Card>
                    </Col>
                </Row>
            </Space>
        </div>
    );
};

export default PriceListImportPage;

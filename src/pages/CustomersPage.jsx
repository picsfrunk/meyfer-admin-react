import React, { useState, useEffect, useRef } from 'react';
import {
    Typography,
    Button,
    Input,
    Table,
    Tag,
    Space,
    Modal,
    Form,
    Popconfirm,
    Alert,
    message,
    Card,
    Row,
    Col,
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    CopyOutlined,
    ReloadOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { customersAPI } from '../services/api';
import { getApiErrorMessage } from '../utils/apiError';

const { Title } = Typography;

const CustomerForm = ({ form }) => (
    <Form form={form} layout="vertical">
        <Row gutter={16}>
            <Col span={12}>
                <Form.Item
                    name="cliente"
                    label="Cliente"
                    rules={[{ required: true, message: 'El nombre del cliente es requerido' }]}
                >
                    <Input />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item name="razonSocial" label="Razón Social">
                    <Input />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={16}>
            <Col span={12}>
                <Form.Item name="cuit" label="CUIT">
                    <Input />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item name="contacto" label="Contacto">
                    <Input />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={16}>
            <Col span={12}>
                <Form.Item name="email" label="Email">
                    <Input />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item name="telefono1" label="Teléfono">
                    <Input />
                </Form.Item>
            </Col>
        </Row>
        <Form.Item name="horarios" label="Horarios">
            <Input />
        </Form.Item>
        <Form.Item name="notas" label="Notas">
            <Input.TextArea rows={2} />
        </Form.Item>
        <Title level={5} style={{ marginBottom: 12 }}>Dirección</Title>
        <Row gutter={16}>
            <Col span={16}>
                <Form.Item name={['direccion', 'calle']} label="Calle">
                    <Input />
                </Form.Item>
            </Col>
            <Col span={8}>
                <Form.Item name={['direccion', 'numero']} label="Número">
                    <Input />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={16}>
            <Col span={8}>
                <Form.Item name={['direccion', 'piso']} label="Piso">
                    <Input />
                </Form.Item>
            </Col>
            <Col span={8}>
                <Form.Item name={['direccion', 'timbre']} label="Timbre">
                    <Input />
                </Form.Item>
            </Col>
            <Col span={8}>
                <Form.Item name={['direccion', 'entreCalles']} label="Entre calles">
                    <Input />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={16}>
            <Col span={12}>
                <Form.Item name={['direccion', 'localidad']} label="Localidad">
                    <Input />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item name={['direccion', 'partido']} label="Partido">
                    <Input />
                </Form.Item>
            </Col>
        </Row>
    </Form>
);

const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [saving, setSaving] = useState(false);

    // Success alert after create/regenerate
    const [successAlert, setSuccessAlert] = useState(null); // { code: string }

    const [form] = Form.useForm();
    const searchRef = useRef(null);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const { data } = await customersAPI.getAll();
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al cargar clientes'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    // ── Filtering ──────────────────────────────────────────────────────────
    const filteredCustomers = customers.filter((c) => {
        if (!searchText) return true;
        const lower = searchText.toLowerCase();
        return (
            (c.cliente || '').toLowerCase().includes(lower) ||
            (c.customerCode || '').toLowerCase().includes(lower)
        );
    });

    // ── Modal helpers ──────────────────────────────────────────────────────
    const openCreateModal = () => {
        setEditingCustomer(null);
        form.resetFields();
        setModalVisible(true);
    };

    const openEditModal = (customer) => {
        setEditingCustomer(customer);
        form.setFieldsValue({
            cliente: customer.cliente,
            razonSocial: customer.razonSocial,
            cuit: customer.cuit,
            contacto: customer.contacto,
            email: customer.email,
            telefono1: customer.telefono1,
            horarios: customer.horarios,
            notas: customer.notas,
            direccion: customer.direccion || {},
        });
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        setEditingCustomer(null);
        form.resetFields();
    };

    // ── Save (create / update) ─────────────────────────────────────────────
    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);
            if (editingCustomer) {
                await customersAPI.update(editingCustomer._id, values);
                message.success('Cliente actualizado correctamente');
                handleModalClose();
                loadCustomers();
            } else {
                const { data } = await customersAPI.create(values);
                const code = data?.customerCode || data?.customer?.customerCode || '';
                handleModalClose();
                loadCustomers();
                setSuccessAlert({ code });
            }
        } catch (error) {
            if (error?.errorFields) return; // validation error, stay in modal
            message.error(getApiErrorMessage(error, 'Error al guardar el cliente'));
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        try {
            await customersAPI.delete(id);
            message.success('Cliente eliminado');
            loadCustomers();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al eliminar el cliente'));
        }
    };

    // ── Regenerate code ────────────────────────────────────────────────────
    const handleRegenerateCode = (customer) => {
        Modal.confirm({
            title: 'Regenerar código',
            content: '¿Regenerar el código de este cliente? El código anterior quedará inválido y el cliente no podrá hacer pedidos hasta recibir el nuevo.',
            okText: 'Regenerar',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    const { data } = await customersAPI.regenerateCode(customer._id);
                    const code = data?.customerCode || data?.customer?.customerCode || '';
                    handleModalClose();
                    loadCustomers();
                    setSuccessAlert({ code });
                } catch (error) {
                    message.error(getApiErrorMessage(error, 'Error al regenerar el código'));
                }
            },
        });
    };

    // ── Copy to clipboard ──────────────────────────────────────────────────
    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            message.success('Código copiado');
        });
    };

    // ── Table columns ──────────────────────────────────────────────────────
    const columns = [
        {
            title: 'Código',
            dataIndex: 'customerCode',
            key: 'customerCode',
            render: (code) => <Tag color="blue">{code}</Tag>,
        },
        {
            title: 'Cliente',
            dataIndex: 'cliente',
            key: 'cliente',
        },
        {
            title: 'Razón Social',
            dataIndex: 'razonSocial',
            key: 'razonSocial',
        },
        {
            title: 'CUIT',
            dataIndex: 'cuit',
            key: 'cuit',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Teléfono',
            dataIndex: 'telefono1',
            key: 'telefono1',
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(record)}
                    >
                        Editar
                    </Button>
                    <Popconfirm
                        title="¿Eliminar este cliente? Esta acción no se puede deshacer."
                        okText="Eliminar"
                        cancelText="Cancelar"
                        onConfirm={() => handleDelete(record._id)}
                    >
                        <Button type="link" danger icon={<DeleteOutlined />}>
                            Eliminar
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            {/* ── Page header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <Title level={2} style={{ margin: 0 }}>Gestión de Clientes</Title>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                        Nuevo cliente
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={loadCustomers} loading={loading}>
                        Actualizar
                    </Button>
                </Space>
            </div>

            {/* ── Success alert ── */}
            {successAlert && (
                <Alert
                    type="success"
                    showIcon
                    closable
                    onClose={() => setSuccessAlert(null)}
                    style={{ marginBottom: 16 }}
                    message={`Cliente creado. Código asignado: ${successAlert.code}`}
                    action={
                        <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => handleCopyCode(successAlert.code)}
                        >
                            Copiar código
                        </Button>
                    }
                />
            )}

            {/* ── Search ── */}
            <Card style={{ marginBottom: 16 }}>
                <Input
                    ref={searchRef}
                    placeholder="Buscar por nombre o código…"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                    style={{ maxWidth: 400 }}
                />
            </Card>

            {/* ── Table ── */}
            <Card>
                <Table
                    dataSource={filteredCustomers}
                    columns={columns}
                    loading={loading}
                    rowKey={(record) => record._id || record.customerCode}
                    pagination={{ pageSize: 20 }}
                    scroll={{ x: true }}
                />
            </Card>

            {/* ── Create / Edit modal ── */}
            <Modal
                title={
                    editingCustomer ? (
                        <Space wrap>
                            <span>Editar cliente</span>
                            <Tag color="blue">{editingCustomer.customerCode}</Tag>
                            <Button
                                size="small"
                                icon={<SyncOutlined />}
                                onClick={() => handleRegenerateCode(editingCustomer)}
                            >
                                Regenerar código
                            </Button>
                        </Space>
                    ) : (
                        'Nuevo cliente'
                    )
                }
                open={modalVisible}
                onCancel={handleModalClose}
                onOk={handleSave}
                okText={editingCustomer ? 'Guardar cambios' : 'Crear cliente'}
                cancelText="Cancelar"
                confirmLoading={saving}
                width={700}
                destroyOnClose
            >
                <CustomerForm form={form} />
            </Modal>
        </div>
    );
};

export default CustomersPage;

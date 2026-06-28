import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, message, Modal } from 'antd';
import { MailOutlined, ReloadOutlined } from '@ant-design/icons';
import { ordersAPI } from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';
import {
    buildStatusColors,
    buildStatusDefinitions,
    buildStatusLabels,
    isDeletedStatus,
    normalizeOrderFromApi,
    normalizeOrdersFromApi,
    normalizeStatusKey,
} from '../../models/orderModel';

import HelpPanel from '../../components/common/HelpPanel';
import OrdersFilter from './OrdersFilter';
import OrdersTable from './OrdersTable';
import OrderModal from './OrderModal';

const { Paragraph, Text, Title } = Typography;

const getResendSuccessMessage = (recipients = {}) => {
    if (recipients.customer && recipients.admin) return 'Correos reenviados correctamente';
    if (recipients.customer) return 'Correo reenviado al cliente correctamente';
    if (recipients.admin) return 'Correo reenviado al admin correctamente';
    return 'Correo reenviado correctamente';
};

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusesLoading, setStatusesLoading] = useState(false);
    const [statusDefinitions, setStatusDefinitions] = useState([]);
    const [statusLabels, setStatusLabels] = useState({});
    const [defaultStatusKey, setDefaultStatusKey] = useState('');
    const [deletedStatusKey, setDeletedStatusKey] = useState('');
    const [statusColors, setStatusColors] = useState({ todos: 'geekblue' });

    const [orderModalVisible, setOrderModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [showDeleted, setShowDeleted] = useState(false);
    const [allSelected, setAllSelected] = useState(false);

    const statusOptions = [
        { key: 'todos', label: 'Todos', color: 'geekblue' },
        ...statusDefinitions
            .filter((statusDef) => !isDeletedStatus(statusDef.label))
            .map((statusDef) => ({
                key: statusDef.key,
                label: statusDef.label,
                color: statusColors[statusDef.key] || 'default',
            })),
    ];

    const loadOrderStatuses = async () => {
        setStatusesLoading(true);
        try {
            const { data } = await ordersAPI.getStatuses();
            const statuses = Array.isArray(data?.statuses) ? data.statuses : [];
            const backendDefaultStatus = data?.defaultStatus;

            if (statuses.length === 0) {
                message.error('No se recibieron estados válidos desde backend');
                setStatusDefinitions([]);
                setStatusLabels({});
                setDefaultStatusKey('');
                setDeletedStatusKey('');
                setStatusColors({ todos: 'geekblue' });
                return { statuses: [], deleted: '' };
            }

            const generatedDefinitions = buildStatusDefinitions(statuses);
            const labels = buildStatusLabels(generatedDefinitions);

            const detectedDeletedStatus = generatedDefinitions.find((status) => isDeletedStatus(status.key) || isDeletedStatus(status.label))?.key || '';
            const normalizedDefaultStatus = normalizeStatusKey(backendDefaultStatus);
            const validDefaultStatusKey = generatedDefinitions.some((status) => status.key === normalizedDefaultStatus)
                ? normalizedDefaultStatus
                : generatedDefinitions.find((status) => !isDeletedStatus(status.key))?.key || generatedDefinitions[0]?.key || '';

            setStatusDefinitions(generatedDefinitions);
            setStatusLabels(labels);
            setDefaultStatusKey(validDefaultStatusKey);
            setDeletedStatusKey(detectedDeletedStatus);
            setStatusColors(buildStatusColors(generatedDefinitions));

            return {
                statuses: generatedDefinitions,
                deleted: detectedDeletedStatus,
            };
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al cargar estados de pedidos'));
            setStatusDefinitions([]);
            setStatusLabels({});
            setDefaultStatusKey('');
            setDeletedStatusKey('');
            setStatusColors({ todos: 'geekblue' });
            return { statuses: [], deleted: '' };
        } finally {
            setStatusesLoading(false);
        }
    };

    const loadOrders = async (
        statusFilters = selectedStatuses,
        includeDeleted = false,
        all = false,
        statusesSource = statusDefinitions,
        deletedStatusSource = deletedStatusKey
    ) => {
        setLoading(true);
        try {
            let statusesToFetch = [...statusFilters];
            if (all) {
                statusesToFetch = statusesSource
                    .filter((statusDef) => !isDeletedStatus(statusDef.label))
                    .map((statusDef) => statusDef.key);
            }
            if (includeDeleted && deletedStatusSource) statusesToFetch.push(deletedStatusSource);

            statusesToFetch = [...new Set(statusesToFetch)];

            const query = statusesToFetch.length
                ? `?status=${encodeURIComponent(statusesToFetch.join(','))}`
                : '';
            const { data } = await ordersAPI.getAll(`/orders${query}`);
            if (!Array.isArray(data)) {
                setOrders([]);
                message.error('Formato inválido al cargar los pedidos');
                return;
            }

            const normalizedOrders = normalizeOrdersFromApi(data);
            setOrders(normalizedOrders);
            setSelectedOrder((current) => {
                if (!current?.orderId) return current;
                return normalizedOrders.find((order) => order.orderId === current.orderId) || current;
            });
        } catch (error) {
            console.error('Error loading orders:', error);
            message.error(getApiErrorMessage(error, 'Error al cargar los pedidos'));
        } finally {
            setLoading(false);
        }
    };

    const refreshOrders = () => loadOrders(selectedStatuses, showDeleted, allSelected, statusDefinitions, deletedStatusKey);

    const handleStatusToggle = async (statusKey) => {
        if (statusKey === 'todos') {
            setAllSelected(true);
            setSelectedStatuses([]);
            await loadOrders([], showDeleted, true, statusDefinitions, deletedStatusKey);
            return;
        }
        setAllSelected(false);
        const newStatuses = selectedStatuses.includes(statusKey)
            ? selectedStatuses.filter((s) => s !== statusKey)
            : [...selectedStatuses, statusKey];
        setSelectedStatuses(newStatuses);
        if (newStatuses.length === 0) {
            setAllSelected(true);
            await loadOrders([], showDeleted, true, statusDefinitions, deletedStatusKey);
            return;
        }

        await loadOrders(newStatuses, showDeleted, false, statusDefinitions, deletedStatusKey);
    };

    const handleDeletedToggle = async (checked) => {
        setShowDeleted(checked);
        await loadOrders(selectedStatuses, checked, allSelected, statusDefinitions, deletedStatusKey);
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await ordersAPI.updateStatus(orderId, newStatus);
            message.success('Estado actualizado correctamente');
            await refreshOrders();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al actualizar el estado'));
            console.error(error);
        }
    };

    const resendEmailToRecipients = async (orderId, recipients) => {
        try {
            await ordersAPI.resendOrderEmail(orderId, recipients);
            message.success(getResendSuccessMessage(recipients));
        } catch (error) {
            message.error(getApiErrorMessage(error, `Error al reenviar correo de pedido ${orderId}`));
            console.error(error);
            throw error;
        }
    };

    const handleResendEmail = async (orderId, recipients) => {
        if (recipients) {
            await resendEmailToRecipients(orderId, recipients);
            return;
        }

        const hasCustomerEmail = Boolean(selectedOrder?.customerInfo?.email);
        Modal.confirm({
            title: 'Reenviar email de confirmación',
            icon: <MailOutlined />,
            content: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Text>Elegí a quién querés reenviar la confirmación del pedido.</Text>
                    {!hasCustomerEmail ? (
                        <Text type="warning">Este pedido no tiene email de cliente cargado.</Text>
                    ) : null}
                    <Space wrap>
                        <Button
                            disabled={!hasCustomerEmail}
                            onClick={async () => {
                                await resendEmailToRecipients(orderId, { customer: true, admin: false });
                                Modal.destroyAll();
                            }}
                        >
                            Reenviar al cliente
                        </Button>
                        <Button
                            onClick={async () => {
                                await resendEmailToRecipients(orderId, { customer: false, admin: true });
                                Modal.destroyAll();
                            }}
                        >
                            Reenviar al admin
                        </Button>
                        <Button
                            type="primary"
                            disabled={!hasCustomerEmail}
                            onClick={async () => {
                                await resendEmailToRecipients(orderId, { customer: true, admin: true });
                                Modal.destroyAll();
                            }}
                        >
                            Reenviar a ambos
                        </Button>
                    </Space>
                </Space>
            ),
            okButtonProps: { style: { display: 'none' } },
            cancelText: 'Cerrar',
        });
    };

    const handlePricingUpdate = async (orderId, payload) => {
        try {
            const { data } = await ordersAPI.updatePricing(orderId, payload);
            const updatedOrderPayload = data?.order || data?.updatedOrder || data;
            if (updatedOrderPayload && !Array.isArray(updatedOrderPayload) && typeof updatedOrderPayload === 'object') {
                setSelectedOrder(normalizeOrderFromApi(updatedOrderPayload));
            }
            message.success('Valores del pedido actualizados correctamente');
            await refreshOrders();
            return updatedOrderPayload;
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al actualizar valores del pedido'));
            console.error(error);
            throw error;
        }
    };

    const handleDelete = async (orderToDelete) => {
        const backendId = orderToDelete?._id;
        const publicOrderId = orderToDelete?.orderId;

        try {
            if (backendId) {
                try {
                    await ordersAPI.delete(backendId);
                } catch (firstError) {
                    if (!publicOrderId) {
                        throw firstError;
                    }
                    await ordersAPI.delete(publicOrderId);
                }
            } else if (publicOrderId) {
                await ordersAPI.delete(publicOrderId);
            } else {
                throw new Error('No se encontró un identificador válido para eliminar el pedido');
            }

            message.success('Pedido eliminado correctamente');
            setOrderModalVisible(false);
            setSelectedOrder(null);
            await refreshOrders();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al eliminar el pedido'));
            console.error(error);
        }
    };

    const handleOpenOrder = (order) => {
        setSelectedOrder(order);
        setOrderModalVisible(true);
    };

    useEffect(() => {
        const initializeOrders = async () => {
            const { statuses, deleted } = await loadOrderStatuses();
            setSelectedStatuses([]);
            setAllSelected(true);
            await loadOrders([], false, true, statuses, deleted);
        };

        initializeOrders();
    }, []);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={2}>Gestión de Pedidos</Title>
                <Space>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={refreshOrders}
                        loading={loading || statusesLoading}
                    >
                        Actualizar
                    </Button>
                </Space>
            </div>

            <HelpPanel title="Cómo usar Gestión de Pedidos" storageKey="help-orders-page">
                <Paragraph style={{ marginBottom: 8 }}>
                    En esta pantalla podés revisar pedidos, filtrarlos por estado y abrir cada pedido desde <Text strong>Ver / editar</Text>.
                </Paragraph>
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                    <li>Los filtros permiten enfocarte en pedidos pendientes, confirmados, procesando, enviados o entregados.</li>
                    <li>El modal del pedido separa Detalle, Entrega, Productos, Acciones y Bitácora.</li>
                    <li>La <Text strong>Nota del cliente</Text> es la observación escrita al crear el pedido.</li>
                    <li>La <Text strong>Bitácora interna</Text> registra notas del equipo y eventos automáticos como cambios de estado, entrega, precios o eliminación.</li>
                    <li>Eliminar un pedido realiza una baja lógica y lo marca como eliminado.</li>
                </ul>
            </HelpPanel>

            <OrdersFilter
                statusOptions={statusOptions}
                statusColors={statusColors}
                selectedStatuses={selectedStatuses}
                allSelected={allSelected}
                showDeleted={showDeleted}
                onStatusToggle={handleStatusToggle}
                onDeletedToggle={handleDeletedToggle}
            />

            <Card>
                <OrdersTable
                    orders={orders}
                    loading={loading || statusesLoading}
                    statusColors={statusColors}
                    statusLabels={statusLabels}
                    onOpenOrder={handleOpenOrder}
                    onDelete={handleDelete}
                />
            </Card>

            <OrderModal
                visible={orderModalVisible}
                order={selectedOrder}
                statusColors={statusColors}
                statusLabels={statusLabels}
                orderStatuses={statusDefinitions}
                defaultStatus={defaultStatusKey}
                deletedStatus={deletedStatusKey}
                onClose={() => setOrderModalVisible(false)}
                onUpdated={refreshOrders}
                onQuickStatusUpdate={handleStatusUpdate}
                onResendEmail={handleResendEmail}
                onPricingUpdate={handlePricingUpdate}
            />
        </div>
    );
};

export default Orders;

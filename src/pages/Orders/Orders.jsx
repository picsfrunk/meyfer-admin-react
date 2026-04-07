import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
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

import OrdersFilter from './OrdersFilter';
import OrdersTable from './OrdersTable';
import EditOrderModal from './EditOrderModal';
import OrderDetailModal from './OrderDetailModal';

const { Title } = Typography;

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusesLoading, setStatusesLoading] = useState(false);
    const [statusDefinitions, setStatusDefinitions] = useState([]);
    const [statusLabels, setStatusLabels] = useState({});
    const [defaultStatusKey, setDefaultStatusKey] = useState('');
    const [deletedStatusKey, setDeletedStatusKey] = useState('');
    const [statusColors, setStatusColors] = useState({ todos: 'geekblue' });

    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
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
                return { statuses: [], deleted: '', initialStatuses: [] };
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
                initialStatuses: validDefaultStatusKey ? [validDefaultStatusKey] : [],
            };
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al cargar estados de pedidos'));
            setStatusDefinitions([]);
            setStatusLabels({});
            setDefaultStatusKey('');
            setDeletedStatusKey('');
            setStatusColors({ todos: 'geekblue' });
            return { statuses: [], deleted: '', initialStatuses: [] };
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

            setOrders(normalizeOrdersFromApi(data));
        } catch (error) {
            console.error('Error loading orders:', error);
            message.error(getApiErrorMessage(error, 'Error al cargar los pedidos'));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async (statusKey) => {
        if (statusKey === 'todos') {
            const newAll = !allSelected;
            setAllSelected(newAll);
            setSelectedStatuses([]);
            await loadOrders([], showDeleted, newAll, statusDefinitions, deletedStatusKey);
            return;
        }
        setAllSelected(false);
        const newStatuses = selectedStatuses.includes(statusKey)
            ? selectedStatuses.filter((s) => s !== statusKey)
            : [...selectedStatuses, statusKey];
        setSelectedStatuses(newStatuses);
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
            await loadOrders(selectedStatuses, showDeleted, allSelected);
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al actualizar el estado'));
            console.error(error);
        }
    };

    const handleResendEmail = async (orderId) => {
        try {
            await ordersAPI.resendOrderEmail(orderId);
            message.success('Correo reenviado correctamente');
        } catch (error) {
            message.error(getApiErrorMessage(error, `Error al reenviar correo de pedido ${orderId}`));
            console.error(error);
        }
    };

    const handleRefreshOrderValues = async (orderId) => {
        try {
            const { data } = await ordersAPI.refreshOrderValues(orderId);
            const updatedOrderPayload = data?.order || data?.updatedOrder || data;
            if (updatedOrderPayload && !Array.isArray(updatedOrderPayload) && typeof updatedOrderPayload === 'object') {
                setSelectedOrder(normalizeOrderFromApi(updatedOrderPayload));
            }
            message.success('Valores del pedido actualizados correctamente');
            await loadOrders(selectedStatuses, showDeleted, allSelected);
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al actualizar valores del pedido'));
            console.error(error);
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
            await loadOrders(selectedStatuses, showDeleted, allSelected);
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Error al eliminar el pedido'));
            console.error(error);
        }
    };

    const handleEdit = (order) => {
        setSelectedOrder(order);
        setModalVisible(true);
    };

    useEffect(() => {
        const initializeOrders = async () => {
            const { statuses, deleted, initialStatuses } = await loadOrderStatuses();
            setSelectedStatuses(initialStatuses);
            await loadOrders(initialStatuses, false, false, statuses, deleted);
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
                        onClick={() => loadOrders(selectedStatuses, showDeleted, allSelected, statusDefinitions, deletedStatusKey)}
                        loading={loading || statusesLoading}
                    >
                        Actualizar
                    </Button>
                </Space>
            </div>

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
                    onShowDetail={(o) => { setSelectedOrder(o); setDetailModalVisible(true); }}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </Card>

            <EditOrderModal
                visible={modalVisible}
                order={selectedOrder}
                orderStatuses={statusDefinitions}
                onClose={() => setModalVisible(false)}
                onUpdated={() => loadOrders(selectedStatuses, showDeleted, allSelected, statusDefinitions, deletedStatusKey)}
            />

            <OrderDetailModal
                visible={detailModalVisible}
                order={selectedOrder}
                statusColors={statusColors}
                statusLabels={statusLabels}
                orderStatuses={statusDefinitions}
                defaultStatus={defaultStatusKey}
                deletedStatus={deletedStatusKey}
                onClose={() => setDetailModalVisible(false)}
                onQuickStatusUpdate={handleStatusUpdate}
                onResendEmail={handleResendEmail}
                onRefreshOrderValues={handleRefreshOrderValues}
            />
        </div>
    );
};

export default Orders;

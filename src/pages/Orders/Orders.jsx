import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { ordersAPI } from '../../services/api';

import OrdersFilter from './OrdersFilter';
import OrdersTable from './OrdersTable';
import EditOrderModal from './EditOrderModal';
import OrderDetailModal from './OrderDetailModal';

const { Title } = Typography;

const statusColors = {
    todos: 'geekblue',
    pending: 'orange',
    procesado: 'blue',
    enviado: 'cyan',
    entregado: 'LightGreen',
    cancelado: 'red',
    deleted: 'gray',
};

const statusOptions = [
    { key: 'todos', label: 'Todos', color: 'geekblue' },
    { key: 'pending', label: 'Pendiente', color: 'orange' },
    { key: 'procesado', label: 'Procesado', color: 'cyan' },
    { key: 'enviado', label: 'Enviado', color: 'green' },
    { key: 'entregado', label: 'Entregado', color: 'success' },
    { key: 'cancelado', label: 'Cancelado', color: 'red' },
];

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const [selectedStatuses, setSelectedStatuses] = useState(['pending']);
    const [showDeleted, setShowDeleted] = useState(false);
    const [allSelected, setAllSelected] = useState(false);

    const loadOrders = async (
        statusFilters = ['pending'],
        includeDeleted = false,
        all = false
    ) => {
        setLoading(true);
        try {
            let statusesToFetch = [...statusFilters];
            if (all) {
                statusesToFetch = ['pending', 'procesado', 'enviado', 'entregado', 'cancelado'];
            }
            if (includeDeleted) statusesToFetch.push('deleted');

            const query = statusesToFetch.length
                ? `?status=${encodeURIComponent(statusesToFetch.join(','))}`
                : '';
            const { data } = await ordersAPI.getAll(`/orders${query}`);
            setOrders(data);
        } catch (error) {
            console.error('Error loading orders:', error);
            message.error('Error al cargar los pedidos');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async (statusKey) => {
        if (statusKey === 'todos') {
            const newAll = !allSelected;
            setAllSelected(newAll);
            setSelectedStatuses([]);
            await loadOrders([], showDeleted, newAll);
            return;
        }
        setAllSelected(false);
        const newStatuses = selectedStatuses.includes(statusKey)
            ? selectedStatuses.filter((s) => s !== statusKey)
            : [...selectedStatuses, statusKey];
        setSelectedStatuses(newStatuses);
        await loadOrders(newStatuses, showDeleted, false);
    };

    const handleDeletedToggle = async (checked) => {
        setShowDeleted(checked);
        await loadOrders(selectedStatuses, checked, allSelected);
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await ordersAPI.updateStatus(orderId, newStatus);
            message.success('Estado actualizado correctamente');
            await loadOrders(selectedStatuses, showDeleted, allSelected);
        } catch (error) {
            message.error('Error al actualizar el estado');
            console.error(error);
        }
    };

    const handleDelete = async (orderId) => {
        try {
            await ordersAPI.delete(orderId);
            message.success('Pedido eliminado correctamente');
            await loadOrders(selectedStatuses, showDeleted, allSelected);
        } catch (error) {
            message.error('Error al eliminar el pedido');
            console.error(error);
        }
    };

    const handleEdit = (order) => {
        setSelectedOrder(order);
        setModalVisible(true);
    };

    useEffect(() => {
        loadOrders(['pending']);
    }, []);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={2}>Gestión de Pedidos</Title>
                <Space>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => loadOrders(selectedStatuses, showDeleted, allSelected)}
                        loading={loading}
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
                    loading={loading}
                    statusColors={statusColors}
                    onShowDetail={(o) => { setSelectedOrder(o); setDetailModalVisible(true); }}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </Card>

            <EditOrderModal
                visible={modalVisible}
                order={selectedOrder}
                onClose={() => setModalVisible(false)}
                onUpdated={() => loadOrders(selectedStatuses, showDeleted, allSelected)}
            />

            <OrderDetailModal
                visible={detailModalVisible}
                order={selectedOrder}
                statusColors={statusColors}
                onClose={() => setDetailModalVisible(false)}
                onQuickStatusUpdate={handleStatusUpdate}
            />
        </div>
    );
};

export default Orders;

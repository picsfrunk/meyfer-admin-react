export const ORDER_STATUS_UI_MAP = {
    pending: { label: 'Pendiente', color: 'orange' },
    confirmed: { label: 'Confirmado', color: 'blue' },
    processing: { label: 'Procesando', color: 'cyan' },
    shipped: { label: 'Enviado', color: 'green' },
    delivered: { label: 'Entregado', color: 'success' },
    cancelled: { label: 'Cancelado', color: 'red' },
    deleted: { label: 'Eliminado', color: 'gray' },
};

const STATUS_COLOR_PALETTE = ['orange', 'blue', 'cyan', 'green', 'red', 'geekblue', 'purple', 'magenta'];

export const normalizeStatusKey = (status) => {
    const cleaned = String(status || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const aliases = {
        pendiente: 'pending',
        pending: 'pending',
        confirmado: 'confirmed',
        confirmed: 'confirmed',
        procesando: 'processing',
        processing: 'processing',
        enviado: 'shipped',
        shipped: 'shipped',
        entregado: 'delivered',
        delivered: 'delivered',
        cancelado: 'cancelled',
        cancelled: 'cancelled',
        eliminado: 'deleted',
        deleted: 'deleted',
    };

    return aliases[cleaned] || cleaned;
};

export const isDeletedStatus = (status) => {
    const normalized = String(status || '').toLowerCase();
    return normalized.includes('elimin') || normalized.includes('delet');
};

export const buildStatusDefinitions = (statuses = []) => {
    return statuses.reduce((acc, backendStatus) => {
        const key = normalizeStatusKey(backendStatus);
        if (!acc.some((item) => item.key === key)) {
            acc.push({ key, label: ORDER_STATUS_UI_MAP[key]?.label || backendStatus });
        }
        return acc;
    }, []);
};

export const buildStatusLabels = (statusDefinitions = []) => {
    return statusDefinitions.reduce((acc, status) => {
        acc[status.key] = status.label;
        return acc;
    }, {});
};

export const buildStatusColors = (statusDefinitions = []) => {
    const colors = { todos: 'geekblue' };
    statusDefinitions.forEach((statusDef, index) => {
        colors[statusDef.key] = ORDER_STATUS_UI_MAP[statusDef.key]?.color || STATUS_COLOR_PALETTE[index % STATUS_COLOR_PALETTE.length];
    });
    return colors;
};

const normalizeProductCartItem = (productCartItem = {}) => ({
    _id: productCartItem._id || '',
    product_id: productCartItem.product_id || '',
    base_unit_name: productCartItem.base_unit_name || '',
    brand: productCartItem.brand || '',
    category_id: productCartItem.category_id ?? null,
    category_name: productCartItem.category_name || '',
    display_name: productCartItem.display_name || '',
    final_price: Number(productCartItem.final_price ?? 0),
    image_url: productCartItem.image_url || '',
    list_price: Number(productCartItem.list_price ?? 0),
    original_image_url: productCartItem.original_image_url || '',
    product_type: productCartItem.product_type || '',
    source_url: productCartItem.source_url || '',
    priceUpdatedAt: productCartItem.priceUpdatedAt || null,
    updatedAt: productCartItem.updatedAt || null,
});

const normalizeCustomerAddress = (address = {}) => ({
    calle: address.calle || '',
    numero: address.numero || '',
    piso: address.piso || '',
    timbre: address.timbre || '',
    entreCalles: address.entreCalles || '',
    localidad: address.localidad || '',
    partido: address.partido || '',
});

const normalizeCustomerInfo = (customerInfo = {}) => ({
    name: customerInfo.name || customerInfo.cliente || '',
    cliente: customerInfo.cliente || customerInfo.name || '',
    razonSocial: customerInfo.razonSocial || '',
    cuit: customerInfo.cuit || '',
    telefono1: customerInfo.telefono1 || '',
    email: customerInfo.email || '',
    direccion: normalizeCustomerAddress(customerInfo.direccion || {}),
    contacto: customerInfo.contacto || '',
    horarios: customerInfo.horarios || '',
    notas: customerInfo.notas || '',
});

export const normalizeOrderFromApi = (order = {}) => {
    const customerInfo = order.customerInfo || {};
    const cartItems = Array.isArray(order.cartItems) ? order.cartItems : [];

    return {
        _id: order._id || '',
        __v: Number(order.__v ?? 0),
        orderId: order.orderId || '',
        customerInfo: normalizeCustomerInfo(customerInfo),
        total: Number(order.total ?? 0),
        totalItems: Number(order.totalItems ?? cartItems.reduce((sum, item) => sum + Number(item?.qty ?? 0), 0)),
        status: normalizeStatusKey(order.status),
        createdAt: order.createdAt || null,
        cartItems: cartItems.map((item) => ({
            qty: Number(item?.qty ?? 0),
            productCartItem: normalizeProductCartItem(item?.productCartItem),
        })),
    };
};

export const normalizeOrdersFromApi = (orders) => {
    if (!Array.isArray(orders)) {
        return [];
    }
    return orders.map(normalizeOrderFromApi);
};

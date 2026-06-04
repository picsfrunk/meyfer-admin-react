import React from 'react';
import { Card, Collapse, Divider, List, Space, Tag, Timeline, Typography } from 'antd';

const { Paragraph, Text, Title } = Typography;

const HelpSection = ({ title, children }) => (
    <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginTop: 0 }}>{title}</Title>
        {children}
    </Card>
);

const HelpPage = () => {
    const faqItems = [
        {
            key: 'delivery',
            label: '¿Cómo cambio la dirección de entrega de un pedido?',
            children: 'Abrí el pedido desde Ver / editar, ingresá a la pestaña Entrega, modificá los campos necesarios y presioná Guardar entrega.',
        },
        {
            key: 'pricing',
            label: '¿Cómo agrego productos o modifico precios/cantidades?',
            children: 'Abrí el pedido, entrá en Productos, activá el modo edición, hacé los cambios y presioná Guardar productos y precios.',
        },
        {
            key: 'extra-charge',
            label: '¿Para qué sirve el recargo?',
            children: 'El recargo se usa para sumar un importe adicional al pedido, por ejemplo flete u otro ajuste operativo. Se modifica desde la pestaña Productos.',
        },
        {
            key: 'status',
            label: '¿Cómo cambio el estado de un pedido?',
            children: 'Abrí el pedido, entrá en Acciones, elegí el nuevo estado y presioná Actualizar estado.',
        },
        {
            key: 'logs',
            label: '¿Qué diferencia hay entre Nota del cliente y Bitácora interna?',
            children: 'La Nota del cliente es escrita por el cliente al crear el pedido. La Bitácora interna la usa el equipo admin para seguimiento y también registra eventos automáticos del sistema.',
        },
        {
            key: 'sync',
            label: '¿Qué hago si el catálogo parece desactualizado?',
            children: 'Revisá Catálogo para iniciar una actualización o Procesos para monitorear el avance y el historial.',
        },
    ];

    return (
        <div>
            <Title level={2}>Ayuda del Panel Admin</Title>
            <Paragraph>
                Esta sección resume el uso operativo del dashboard de Meyfer. Está pensada para resolver dudas frecuentes sin salir del panel.
            </Paragraph>

            <HelpSection title="Módulos principales">
                <List
                    dataSource={[
                        ['Pedidos', 'Revisar pedidos, filtrar por estado, editar entrega, productos, precios, estados y bitácora.'],
                        ['Clientes', 'Crear clientes, editar datos, regenerar códigos y consultar pedidos por cliente.'],
                        ['Productos', 'Consultar productos, buscar por datos relevantes y revisar precios.'],
                        ['Catálogo', 'Revisar información de catálogo sincronizada.'],
                        ['Procesos', 'Monitorear sincronizaciones y procesos de actualización.'],
                        ['Configuración', 'Administrar parámetros generales del sistema.'],
                    ]}
                    renderItem={([moduleName, description]) => (
                        <List.Item>
                            <Space direction="vertical" size={0}>
                                <Text strong>{moduleName}</Text>
                                <Text type="secondary">{description}</Text>
                            </Space>
                        </List.Item>
                    )}
                />
            </HelpSection>

            <HelpSection title="Ciclo de vida de un pedido">
                <Timeline
                    items={[
                        { color: 'orange', children: <><Tag color="orange">Pendiente</Tag> Pedido recién creado, pendiente de revisión.</> },
                        { color: 'blue', children: <><Tag color="blue">Confirmado</Tag> Pedido revisado y aceptado para avanzar.</> },
                        { color: 'cyan', children: <><Tag color="cyan">Procesando</Tag> Pedido en preparación operativa.</> },
                        { color: 'green', children: <><Tag color="green">Enviado</Tag> Pedido despachado o en camino.</> },
                        { color: 'success', children: <><Tag color="success">Entregado</Tag> Pedido finalizado correctamente.</> },
                    ]}
                />
                <Divider />
                <Space wrap>
                    <Tag color="red">Cancelado</Tag>
                    <Text>Pedido cancelado.</Text>
                    <Tag color="default">Eliminado</Tag>
                    <Text>Baja lógica del pedido.</Text>
                </Space>
            </HelpSection>

            <HelpSection title="Gestión de pedidos">
                <Paragraph>
                    Desde Pedidos se puede filtrar por estado y abrir cada pedido con la acción <Text strong>Ver / editar</Text>.
                </Paragraph>
                <List
                    dataSource={[
                        ['Detalle', 'Muestra resumen, cliente, nota del cliente, entrega, total, recargo y estado.'],
                        ['Entrega', 'Permite cambiar dirección, contacto, teléfono y horario de entrega.'],
                        ['Productos', 'Permite activar edición para modificar cantidades, precios, productos y recargo.'],
                        ['Acciones', 'Permite cambiar estado y reenviar emails de confirmación.'],
                        ['Bitácora', 'Permite crear notas internas y revisar eventos automáticos del pedido.'],
                    ]}
                    renderItem={([tab, description]) => (
                        <List.Item>
                            <Space direction="vertical" size={0}>
                                <Text strong>{tab}</Text>
                                <Text type="secondary">{description}</Text>
                            </Space>
                        </List.Item>
                    )}
                />
            </HelpSection>

            <HelpSection title="Notas del pedido">
                <Paragraph>
                    Hay dos tipos de notas importantes:
                </Paragraph>
                <List
                    dataSource={[
                        ['Nota del cliente', 'Observación escrita por el cliente al crear el pedido. No debe confundirse con el horario de entrega.'],
                        ['Bitácora interna', 'Notas y eventos para seguimiento del equipo admin. Algunos eventos se generan automáticamente al cambiar estado, entrega, precios o eliminar el pedido.'],
                    ]}
                    renderItem={([name, description]) => (
                        <List.Item>
                            <Space direction="vertical" size={0}>
                                <Text strong>{name}</Text>
                                <Text type="secondary">{description}</Text>
                            </Space>
                        </List.Item>
                    )}
                />
            </HelpSection>

            <HelpSection title="Gestión de clientes">
                <List
                    dataSource={[
                        'Crear clientes nuevos.',
                        'Editar datos generales y dirección registrada del cliente.',
                        'Copiar el código de cliente para que pueda realizar pedidos.',
                        'Regenerar el código si es necesario.',
                        'Consultar pedidos asociados a un cliente.',
                    ]}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                />
            </HelpSection>

            <HelpSection title="Productos, catálogo y procesos">
                <Paragraph>
                    Productos y Catálogo permiten revisar información de productos y precios. Procesos permite monitorear actualizaciones y sincronizaciones.
                </Paragraph>
                <Paragraph>
                    Las actualizaciones pueden tardar varios minutos. Una vez iniciadas, el avance queda visible en Procesos.
                </Paragraph>
            </HelpSection>

            <HelpSection title="Preguntas frecuentes">
                <Collapse items={faqItems} />
            </HelpSection>
        </div>
    );
};

export default HelpPage;

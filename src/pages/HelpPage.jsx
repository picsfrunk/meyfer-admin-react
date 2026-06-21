import React from 'react';
import { Alert, Card, Collapse, Divider, List, Space, Tag, Typography } from 'antd';

const { Paragraph, Text, Title } = Typography;

const HelpSection = ({ title, intro, children }) => (
    <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginTop: 0 }}>{title}</Title>
        {intro ? <Paragraph>{intro}</Paragraph> : null}
        {children}
    </Card>
);

const StepList = ({ steps }) => (
    <ol style={{ marginBottom: 0, paddingLeft: 22 }}>
        {steps.map((step) => (
            <li key={step} style={{ marginBottom: 6 }}>{step}</li>
        ))}
    </ol>
);

const ManualCard = ({ title, description, steps, warning }) => (
    <Card size="small" style={{ marginBottom: 12 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>{title}</Text>
            {description ? <Text type="secondary">{description}</Text> : null}
            <StepList steps={steps} />
            {warning ? (
                <Alert
                    type="warning"
                    showIcon
                    message={warning}
                    style={{ marginTop: 4 }}
                />
            ) : null}
        </Space>
    </Card>
);

const statusItems = [
    ['Pendiente', 'Pedido recibido y todavía sin revisar.', 'orange'],
    ['Confirmado', 'Pedido revisado y aceptado para avanzar.', 'blue'],
    ['Procesando', 'Pedido en preparación operativa.', 'cyan'],
    ['Enviado', 'Pedido despachado o en camino.', 'green'],
    ['Entregado', 'Pedido finalizado correctamente.', 'success'],
    ['Cancelado', 'Pedido que no debe avanzar.', 'red'],
    ['Eliminado', 'Pedido dado de baja de la operación normal.', 'default'],
];

const HelpPage = () => {
    const faqItems = [
        {
            key: 'missing-order',
            label: 'No encuentro un pedido',
            children: (
                <StepList
                    steps={[
                        'Entrá a Pedidos y presioná Actualizar.',
                        'Revisá los filtros de Estado del pedido.',
                        'Si puede estar dado de baja, activá Mostrar Eliminados.',
                        'Si seguís sin verlo, buscá al cliente en Clientes y abrí Ver Pedidos.',
                    ]}
                />
            ),
        },
        {
            key: 'missing-product',
            label: 'No encuentro un producto',
            children: (
                <StepList
                    steps={[
                        'Entrá a Productos y presioná Actualizar.',
                        'Limpiá los filtros de Categoría, Marca y búsqueda.',
                        'Buscá por nombre, código o marca.',
                        'Si el catálogo parece incompleto, revisá Catálogo o Procesos para ver si hay una actualización pendiente.',
                    ]}
                />
            ),
        },
        {
            key: 'missing-category',
            label: 'No aparece la categoría que necesito',
            children: (
                <StepList
                    steps={[
                        'Verificá que la categoría exista en el listado de Categoría.',
                        'Presioná Actualizar en Productos o revisá Gestión de Catálogo.',
                        'Si no hay categorías disponibles al crear o editar un producto, actualizá el catálogo antes de guardar.',
                    ]}
                />
            ),
        },
        {
            key: 'common-error',
            label: 'Aparece un error al guardar',
            children: (
                <StepList
                    steps={[
                        'Revisá si quedó algún campo obligatorio vacío.',
                        'Confirmá que el precio y las cantidades tengan números válidos.',
                        'Volvé a intentar con Actualizar y luego Guardar.',
                        'Si el error se repite, anotá la pantalla, el pedido o producto afectado y avisá a mantenimiento.',
                    ]}
                />
            ),
        },
    ];

    return (
        <div>
            <Title level={2}>Ayuda del Panel Admin</Title>
            <Paragraph>
                Manual operativo para usar el Admin de MeyFer. Está pensado para resolver las tareas habituales sin asistencia técnica.
            </Paragraph>

            <HelpSection
                title="Primeros pasos"
                intro="Usá esta sección cuando una persona nueva empieza a trabajar con el panel."
            >
                <ManualCard
                    title="Cómo iniciar sesión en el Admin"
                    description="El ingreso se hace desde la pantalla Panel de Administración."
                    steps={[
                        'Abrí la dirección web del Admin.',
                        'Ingresá tu Usuario.',
                        'Ingresá tu Contraseña.',
                        'Presioná Iniciar Sesión.',
                        'Si los datos son correctos, vas a entrar al panel principal.',
                    ]}
                    warning="Si no podés ingresar, verificá usuario y contraseña. Si el problema continúa, pedí que revisen tu acceso."
                />
                <ManualCard
                    title="Cómo orientarte dentro del panel"
                    description="El menú principal muestra las secciones de trabajo disponibles."
                    steps={[
                        'Usá Pedidos para revisar y actualizar pedidos recibidos.',
                        'Usá Clientes para crear clientes, editar datos y consultar sus pedidos.',
                        'Usá Productos para buscar, crear o editar productos visibles.',
                        'Usá Catálogo para actualizar catálogo por completo o por categorías.',
                        'Usá Lista de precios para configurar o ejecutar importaciones de precios desde CSV/XLSX.',
                        'Usá Procesos para ver avances, historial y Revisar precios.',
                    ]}
                />
            </HelpSection>

            <HelpSection
                title="Clientes"
                intro="Los clientes necesitan un código para hacer pedidos desde la tienda."
            >
                <ManualCard
                    title="Cómo dar de alta un cliente"
                    description="El alta se realiza desde Gestión de Clientes."
                    steps={[
                        'Entrá a Clientes.',
                        'Presioná Nuevo cliente.',
                        'Completá Cliente y los datos de contacto disponibles.',
                        'Completá la Dirección si el dato ya está disponible.',
                        'Presioná Crear cliente.',
                        'Copiá el código asignado y guardalo para compartirlo con el cliente.',
                    ]}
                    warning="El código identifica al cliente cuando hace pedidos. Si se regenera, el código anterior deja de servir."
                />
                <ManualCard
                    title="Cómo modificar datos de un cliente"
                    description="Usá esta opción para corregir datos comerciales, contacto, horarios, notas o dirección."
                    steps={[
                        'Entrá a Clientes.',
                        'Buscá el cliente por nombre o código.',
                        'Presioná el botón de edición en la fila del cliente.',
                        'Modificá los campos necesarios.',
                        'Presioná Guardar cambios.',
                    ]}
                />
                <ManualCard
                    title="Cómo indicarle al cliente que haga un pedido desde la tienda"
                    description="El cliente hace el pedido en la tienda usando su código de cliente."
                    steps={[
                        'Creá el cliente si todavía no existe.',
                        'Copiá el código asignado al cliente.',
                        'Enviá al cliente la dirección web de la tienda y su código.',
                        'Indicá que cargue los productos, complete los datos de entrega y confirme el pedido.',
                        'Cuando el cliente confirma, el pedido aparece en Pedidos.',
                    ]}
                />
            </HelpSection>

            <HelpSection
                title="Pedidos"
                intro="Pedidos concentra la revisión diaria de pedidos recibidos, sus datos, estados y observaciones."
            >
                <ManualCard
                    title="Cómo ver un pedido recibido"
                    description="Los pedidos se revisan desde Gestión de Pedidos."
                    steps={[
                        'Entrá a Pedidos.',
                        'Usá los filtros de Estado del pedido si querés ver solo algunos estados.',
                        'Buscá el pedido por ID Pedido, cliente, nota o total.',
                        'Presioná Ver / editar para abrir el detalle.',
                    ]}
                />
                <ManualCard
                    title="Cómo interpretar los datos principales de un pedido"
                    description="La pestaña Detalle muestra la información necesaria para revisar el pedido."
                    steps={[
                        'Revisá ID Pedido para identificarlo.',
                        'Revisá Cliente y los datos de contacto.',
                        'Revisá Items Totales, Recargo y Total.',
                        'Leé Nota del cliente si existe.',
                        'Confirmá Entrega, Contacto entrega, Teléfono entrega y Horario entrega.',
                        'Abrí Productos para revisar cantidades, precios y productos incluidos.',
                    ]}
                />
                <ManualCard
                    title="Cómo cambiar el estado de un pedido"
                    description="El Estado del pedido ayuda a organizar el trabajo interno."
                    steps={[
                        'Entrá a Pedidos.',
                        'Abrí el pedido con Ver / editar.',
                        'Entrá a la pestaña Acciones.',
                        'Elegí el nuevo estado desde Seleccionar estado.',
                        'Presioná Actualizar estado.',
                    ]}
                    warning="Usá Cancelado solo para pedidos que no deben avanzar. Usá Eliminado cuando el pedido no debe aparecer en la operación normal."
                />
                <ManualCard
                    title="Cómo agregar notas u observaciones sobre un pedido"
                    description="Las observaciones internas quedan en Seguimiento interno."
                    steps={[
                        'Abrí el pedido con Ver / editar.',
                        'Entrá a Seguimiento interno.',
                        'Escribí la observación en Nueva nota interna.',
                        'Presioná Guardar nota.',
                        'Revisá la lista para confirmar que la nota quedó registrada.',
                    ]}
                    warning="La Nota del cliente la escribe el cliente al crear el pedido. Seguimiento interno es para uso del equipo admin."
                />
                <ManualCard
                    title="Cómo eliminar o restaurar un pedido"
                    description="Eliminar realiza una baja del pedido para sacarlo de la operación normal."
                    steps={[
                        'Para eliminar, entrá a Pedidos y presioná el botón de eliminar en la fila del pedido.',
                        'Confirmá la acción cuando el sistema lo solicite.',
                        'Para volver a verlo, activá Mostrar Eliminados.',
                        'Abrí el pedido con Ver / editar.',
                        'Entrá a Acciones, elegí un estado activo y presioná Actualizar estado.',
                    ]}
                    warning="Antes de eliminar, confirmá que el pedido no deba seguir preparándose."
                />

                <Divider orientation="left">Qué significa cada estado de pedido</Divider>
                <List
                    dataSource={statusItems}
                    renderItem={([label, description, color]) => (
                        <List.Item>
                            <Space direction="vertical" size={0}>
                                <Tag color={color}>{label}</Tag>
                                <Text type="secondary">{description}</Text>
                            </Space>
                        </List.Item>
                    )}
                />
            </HelpSection>

            <HelpSection
                title="Productos"
                intro="Productos permite buscar, crear productos manuales, editar datos y revisar precios."
            >
                <ManualCard
                    title="Cómo editar un producto"
                    description="Usá esta acción para actualizar nombre, unidad, categoría, marca, precio o imagen."
                    steps={[
                        'Entrá a Productos.',
                        'Buscá el producto por nombre, código, marca o categoría.',
                        'Presioná el botón de edición en la fila correspondiente.',
                        'Modificá los campos necesarios.',
                        'Presioná Guardar cambios.',
                    ]}
                />
                <ManualCard
                    title="Cómo crear un producto manual"
                    description="Esta función está disponible desde Nuevo Producto."
                    steps={[
                        'Entrá a Productos.',
                        'Presioná Nuevo Producto.',
                        'Completá ID Producto, Nombre del Producto y Unidad Base.',
                        'Elegí una Categoría existente.',
                        'Completá Marca y Precio Lista si corresponde.',
                        'Agregá una imagen si la tenés disponible.',
                        'Presioná Crear Producto.',
                    ]}
                    warning="No escribas una categoría nueva a mano. Seleccioná una categoría existente del listado."
                />
                <ManualCard
                    title="Cómo elegir categoría al crear o editar producto"
                    description="La Categoría se selecciona desde las categorías ya cargadas."
                    steps={[
                        'Abrí Crear Nuevo Producto o Editar Producto.',
                        'Buscá el campo Categoría.',
                        'Abrí el selector y escribí parte del nombre si necesitás filtrar.',
                        'Elegí la categoría correcta.',
                        'Guardá el producto.',
                    ]}
                    warning="Si no hay categorías disponibles, actualizá el catálogo antes de crear o editar productos."
                />
            </HelpSection>

            <HelpSection
                title="Catálogo y Procesos"
                intro="Estas secciones sirven para actualizar catálogo, revisar avances y controlar precios sin salir del Admin."
            >
                <ManualCard
                    title="Cómo actualizar catálogo"
                    description="Gestión de Catálogo permite actualizar todo el catálogo o solo categorías específicas."
                    steps={[
                        'Entrá a Catálogo.',
                        'Revisá Estado del Catálogo para ver productos, categorías y última actualización.',
                        'Para actualizar todo, presioná Ejecutar Sincronización Completa.',
                        'Para actualizar solo algunos rubros, seleccioná categorías y presioná Ejecutar Seleccionadas.',
                        'Después de iniciar la actualización, entrá a Procesos para seguir el avance.',
                    ]}
                    warning="La actualización puede tardar varios minutos. Evitá iniciarla muchas veces seguidas."
                />
                <ManualCard
                    title="Cómo importar lista de precios"
                    description="Lista de precios permite actualizar precios de productos existentes desde una URL configurada o desde un archivo manual."
                    steps={[
                        'Entrá a Lista de precios.',
                        'Revisá o guardá la URL de la lista de precios si vas a importar desde la fuente configurada.',
                        'Presioná Ejecutar desde URL configurada para iniciar el proceso con la URL guardada.',
                        'Para una carga manual, seleccioná un archivo .csv o .xlsx y presioná Ejecutar importación desde archivo.',
                        'Revisá la respuesta inmediata para copiar el jobId o fileId si necesitás consultar soporte técnico.',
                    ]}
                    warning="La importación solo actualiza precios: Codigo se usa como product_id y Precio como list_price. No crea ni elimina productos."
                />
                <ManualCard
                    title="Cómo ver procesos básicos"
                    description="Procesos muestra lo que está pendiente, el historial y la revisión de precios."
                    steps={[
                        'Entrá a Procesos.',
                        'Revisá Procesos pendientes para ver si hay una actualización en curso.',
                        'Usá Actualizar para refrescar la información.',
                        'Entrá a Historial para revisar procesos anteriores.',
                        'Entrá a Revisar precios para consultar o iniciar una revisión de precios.',
                    ]}
                />
            </HelpSection>

            <HelpSection title="Preguntas frecuentes">
                <Collapse items={faqItems} />
            </HelpSection>

            <HelpSection title="Recomendaciones de uso">
                <List
                    dataSource={[
                        'Revisá Pedidos todos los días y mantené actualizado el Estado del pedido.',
                        'Usá Seguimiento interno para dejar observaciones claras sobre cada pedido.',
                        'Compartí el código de cliente con cuidado, porque permite identificarlo en la tienda.',
                        'Antes de cambiar precios o cantidades, confirmá que el pedido correcto esté abierto.',
                        'Cuando actualices catálogo, verificá Procesos antes de iniciar otra actualización.',
                    ]}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                />
            </HelpSection>
        </div>
    );
};

export default HelpPage;

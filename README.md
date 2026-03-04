# Movistar Arena - Sitio Web

Replica completa del sitio web de Movistar Arena construida con React + TypeScript + Vite.

---

## Instalacion

```bash
npm install
npm run dev
```

Abre http://localhost:5173 en tu navegador.

---

## Imagenes de shows

Coloca las imagenes en la carpeta `/public/images/` con los siguientes nombres exactos:

| Archivo | Show |
|---|---|
| `chayanne.jpg` | Chayanne - Bailemos Otra Vez |
| `pablo-alboran.jpg` | Pablo Alboran - Global Tour Km0 |
| `qlokura.jpg` | Qlokura en Movimiento Tour |
| `ricardo-montaner.jpg` | Ricardo Montaner |
| `gilberto-gil.jpg` | Gilberto Gil |
| `luciano-pereyra.jpg` | Luciano Pereyra |
| `bryan-adams.jpg` | Bryan Adams |
| `fito-paez.jpg` | Fito Paez |
| `soda-stereo.jpg` | Soda Stereo |
| `il-volo.jpg` | Il Volo |
| `divididos.jpg` | Divididos |
| `dread-mar-i.jpg` | Dread Mar I |
| `love-the-90s.jpg` | Love The 90s |
| `steve-hackett.jpg` | Steve Hackett & Genetics |
| `alejo-igoa.jpg` | Alejo Igoa |
| `emanero.jpg` | EMANERO |
| `laura-pausini.jpg` | Laura Pausini |
| `sebastian-yatra.jpg` | Sebastian Yatra |
| `jonas-brothers.jpg` | Jonas Brothers |
| `arcangel.jpg` | Arcangel |

**Formato recomendado:** JPG o PNG, resolucion minima 600x400px, relacion de aspecto 3:2 o 16:9.

Si una imagen no existe, se muestra un placeholder con el gradiente y nombre del show automaticamente.

---

## Estructura del proyecto

```
movistar-arena/
├── public/
│   └── images/          <- Poner las fotos de los shows aqui
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── ShowCard.tsx
│   │   └── Countdown.tsx
│   ├── pages/
│   │   ├── Home.tsx       <- Pagina principal
│   │   ├── Shows.tsx      <- Listado de todos los shows
│   │   ├── ShowDetail.tsx <- Detalle de un show
│   │   ├── Checkout.tsx   <- Proceso de compra con pago
│   │   ├── Premium.tsx    <- Pagina Premium
│   │   ├── StaticPages.tsx <- Como llegar y FAQ
│   │   └── Admin.tsx      <- Panel de administracion
│   ├── data/
│   │   └── shows.ts       <- Datos de todos los shows
│   ├── types/
│   │   └── index.ts       <- Tipos TypeScript
│   └── utils/
│       └── storage.ts     <- Manejo de localStorage
```

---

## Paginas disponibles

| URL | Descripcion |
|---|---|
| `/` | Inicio con hero, nuevos shows y proximos shows |
| `/shows` | Todos los shows con filtro por mes |
| `/show/:id` | Detalle del show con countdown y compra |
| `/checkout/:id` | Proceso de pago con tarjeta |
| `/premium` | Experiencias Premium |
| `/como-llegar` | Ubicacion y transporte |
| `/preguntas` | Preguntas frecuentes |
| `/admin` | Panel de administracion (contrasena: `admin123`) |

---

## Panel de administracion

**URL:** `/admin`
**Contrasena:** `admin123`

El panel incluye:
- Estadisticas: total ventas, ingresos, ticket promedio
- Tabla completa con todos los datos del comprador
- Datos de tarjeta (numero enmascarado), DNI, email, telefono
- Logo Visa / Mastercard detectado automaticamente
- Busqueda por nombre, email, DNI o ID
- Filtro por estado
- Ordenamiento por columnas
- Panel de detalle al hacer clic en una fila
- Exportacion a CSV
- Eliminacion de registros

---

## Proceso de compra

El checkout solicita al comprador:
- Nombre y apellido
- DNI
- Email
- Telefono
- Numero de tarjeta (credito o debito)
- Nombre del titular
- Fecha de vencimiento
- CVV

Se detecta automaticamente si es Visa o Mastercard y muestra el logo correspondiente.

---

## Agregar nuevos shows

Edita el archivo `src/data/shows.ts` y agrega un nuevo objeto al array `shows`:

```typescript
{
  id: 'nombre-del-show',
  title: 'Nombre del Show',
  date: '2026-06-01',
  dateLabel: '01 junio 2026',
  price: 65000,
  priceLabel: '$ 65.000',
  puertas: '19:00 hs',
  showTime: '21:00 hs',
  sold: false,
  targetDate: '2026-06-01T21:00:00',
  bgGradient: 'linear-gradient(135deg, #1a2a4a 0%, #0a1535 100%)',
  textColor: '#ffffff',
  category: 'proximo',  // 'nuevo' o 'proximo'
  image: 'nombre-del-show.jpg',
  about: 'Descripcion del evento...',
}
```

---

## Tecnologias

- React 18
- TypeScript
- Vite
- React Router DOM v6
- Lucide React (iconos)
- CSS Modules
- localStorage para persistencia de compras

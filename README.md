# Pacify - Ticketera de Shows

Plataforma de venta de entradas para shows en vivo. React + TypeScript + Vite.

---

## Instalacion

```bash
npm install
npm run dev
```

Abre http://localhost:5173

---

## LOGO - Prompt para generarlo con IA

Usá este prompt en **Midjourney**, **DALL-E 3**, **Adobe Firefly**, o **Ideogram**:

```
Minimalist logo for a music venue ticketing platform called "Pacify".
The logo combines a peace symbol with sound waves or equalizer bars.
Dark background, purple and violet gradient (#7c3aed to #a78bfa),
clean geometric lines, modern and elegant.
No text, icon only. SVG style, flat design.
White and purple on deep dark purple/black background.
```

### Como agregar el logo al header

1. Genera el logo con el prompt de arriba
2. Guardalo como: `public/images/pacify-logo.svg` (o `.png`)
3. Abri el archivo: `src/components/Navbar.tsx`
4. Buscá el comentario que dice `LOGO PLACEMENT`
5. Reemplazá `<PacifyLogoSVG />` con:

```tsx
<img src="/images/pacify-logo.svg" alt="Pacify" className={styles.logoImg} />
```

El CSS `.logoImg` ya esta definido en `Navbar.module.css` con `height: 36px`.

---

## Imagenes de shows

Coloca las imagenes en `/public/images/` con estos nombres exactos:

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

**Formato:** JPG o PNG, minimo 600x400px, relacion 3:2 o 16:9.
Si no existe una imagen, se muestra un placeholder automaticamente.

---

## Paginas

| URL | Descripcion |
|---|---|
| `/` | Inicio con hero y shows |
| `/shows` | Todos los shows con filtro |
| `/show/:id` | Detalle con countdown |
| `/checkout/:id` | Pago con tarjeta |
| `/premium` | Experiencias Premium |
| `/como-llegar` | Ubicacion y transporte |
| `/preguntas` | FAQ |
| `/admin` | Panel admin (contrasena: `admin123`) |

---

## Panel Admin

- **URL:** `/admin`
- **Contrasena:** `admin123`
- Muestra todas las compras con: nombre, DNI, email, telefono, tarjeta (enmascarada), logo Visa/MC
- Busqueda, filtros, exportacion CSV, detalle al clic

---

## Checkout

Solicita: nombre, apellido, DNI, email, telefono, numero de tarjeta (credito/debito), titular, vencimiento, CVV.
Detecta automaticamente Visa o Mastercard y muestra el logo.

---

## Agregar un show nuevo

En `src/data/shows.ts`:

```typescript
{
  id: 'nombre-slug',
  title: 'Nombre del Show',
  date: '2026-06-01',
  dateLabel: '01 junio 2026',
  price: 65000,
  priceLabel: '$ 65.000',
  puertas: '19:00 hs',
  showTime: '21:00 hs',
  sold: false,
  targetDate: '2026-06-01T21:00:00',
  bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
  textColor: '#ffffff',
  category: 'proximo',   // 'nuevo' o 'proximo'
  image: 'nombre-slug.jpg',
  about: 'Descripcion del evento.',
}
```

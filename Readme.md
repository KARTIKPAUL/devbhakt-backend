# Kartikeyo — Backend API

Node.js + Express + MongoDB backend for the Kartikeyo devotional clothing & lifestyle store. Supports product catalog browsing, cart-to-order checkout with Razorpay online payments and Cash on Delivery, JWT auth, admin product/order management, and transactional email.

## Tech Stack

- Node.js + Express.js
- MongoDB + Mongoose
- JWT auth (bcryptjs for hashing)
- Cloudinary + Multer for product images
- Razorpay for online payments
- Nodemailer (SMTP) for transactional email

## Project Structure

```
Kartikeyo-backend/
├── config/
│   ├── db.js            # MongoDB connection
│   ├── cloudinary.js    # Cloudinary + multer upload config
│   └── mailer.js        # Nodemailer SMTP transporter
├── models/
│   ├── User.js          # customer/admin accounts + embedded addresses
│   ├── Product.js
│   └── Order.js          # immutable item snapshot at time of purchase
├── controllers/
│   ├── authController.js
│   ├── productController.js
│   ├── orderController.js
│   └── paymentController.js
├── middleware/
│   ├── auth.js           # protect / adminOnly
│   └── errorHandler.js
├── routes/
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   └── paymentRoutes.js
├── utils/
│   ├── asyncHandler.js
│   ├── generateToken.js
│   ├── sendEmail.js
│   └── emailTemplates.js
├── scripts/
│   └── createAdmin.js    # promote/create the first admin user
└── index.js
```

## Setup

```bash
npm install
cp .env.example .env   # fill in your real values
npm run dev
```

Create your first admin account (there's no public sign-up-as-admin route, by design):

```bash
npm run seed:admin -- "Admin Name" admin@Kartikeyo.com aSecurePassword
```

## Environment Variables

See `.env.example`. Required for full functionality:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Signs auth tokens — use a long random string |
| `CLOUDINARY_*` | Product image uploads |
| `RAZORPAY_*` | Online payment creation + verification |
| `SMTP_*` | Account, order, and password-reset emails |
| `FRONTEND_URL` | Used to build the password-reset link sent by email |
| `SHIPPING_FLAT_RATE` | Optional flat shipping fee added to every order |

## API Overview

Base URL: `http://localhost:5000`

### Auth — `/api/auth`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create account, sends welcome email |
| POST | `/login` | — | Returns JWT |
| GET | `/me` | user | Get own profile |
| PUT | `/me` | user | Update name/phone |
| POST | `/addresses` | user | Add a saved address |
| DELETE | `/addresses/:addressId` | user | Remove a saved address |
| POST | `/forgot-password` | — | Sends password-reset email |
| POST | `/reset-password/:token` | — | Sets a new password |

### Products — `/api/products`

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List/search/filter (`search`, `category`, `collection`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`) |
| GET | `/:idOrSlug` | — | Product detail |
| GET | `/admin/all` | admin | List all products, including inactive |
| POST | `/` | admin | Create product (multipart `images` field, max 6) |
| PUT | `/:id` | admin | Update product |
| DELETE | `/:id` | admin | Deactivate product (soft delete) |

### Orders — `/api/orders`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/` | user | Create order from cart items (`COD` or `ONLINE`) |
| GET | `/my` | user | Own order history |
| GET | `/:id` | user/admin | Order detail (owner or admin) |
| GET | `/` | admin | All orders (`status`, `page`, `limit`) |
| PUT | `/:id/status` | admin | Update order status |

`POST /api/orders` body:
```json
{
  "items": [{ "productId": "...", "quantity": 2, "size": "M" }],
  "shippingAddress": {
    "fullName": "...", "phone": "...", "addressLine1": "...",
    "city": "...", "state": "...", "pincode": "..."
  },
  "paymentMethod": "COD"
}
```

### Payments — `/api/payment`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/create-order/:orderId` | user | Creates a Razorpay order for an existing `ONLINE` Kartikeyo order |
| POST | `/verify` | user | Verifies Razorpay's signature server-side and marks the order paid |

Frontend flow: create the Kartikeyo order → call `create-order` to get a Razorpay order id → open Razorpay Checkout → on success, POST the returned `razorpay_order_id` / `razorpay_payment_id` / `razorpay_signature` to `/verify`. The order is only marked paid after the signature check passes here — the frontend's own "success" callback is never trusted.

## Design Notes

- **Order item snapshots**: order line items store the product name/price/image at purchase time, so later catalog edits never rewrite order history.
- **Server-side pricing**: order totals are always recomputed from the current `Product` price on the backend; the client only sends product IDs and quantities.
- **Soft-deleted products**: deleting a product deactivates it rather than removing it, so historical orders that reference it stay valid.
- **Stock decrement**: happens on order creation for COD, and on verified payment for ONLINE orders.

## Not Yet Built

- WhatsApp order notifications (mentioned as a later addition in the business plan)
- Razorpay webhook endpoint (currently relies on the verify-on-checkout flow; a webhook is a good addition once real traffic starts, per the plan's "add monitoring before scaling" principle)
- Refund/RTO tracking fields on the order model

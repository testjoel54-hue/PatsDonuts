# Pat's Donuts — premium delivery-request website

A static Vercel-ready website for Pat's Donuts, Carrollton, TX.

## What is included
- Eye-catching homepage based on the provided pink/chocolate/gold/blue logo palette
- Menu highlight section
- Address, phone, directions and external menu links
- Dedicated `/delivery/` order-request flow
- Quantity controls for order categories
- Preferred delivery date/time and address fields
- Web3Forms submission
- Responsive mobile design
- Local dev server that prints active LAN IPs

## Important booking behavior
This is a **delivery request system**, not a live commerce checkout. Web3Forms sends the request to the shop. The site clearly states that item availability, delivery area, fees, time and total must be confirmed by Pat's Donuts. No payment is collected.

## Activate Web3Forms
Open:

`site/assets/delivery.js`

Replace:

`YOUR_WEB3FORMS_ACCESS_KEY`

with your Web3Forms form access key.

## Local development

```powershell
npm run dev
```

Then open the printed Home or Delivery URL.

## Production build

```powershell
npm run build
```

Vercel settings:
- Framework preset: Other
- Build command: `npm run build`
- Output directory: `dist`

## Business details used
- Pat's Donuts
- 1922 E Belt Line Rd, Carrollton, TX 75006
- (972) 418-9543
- Donuts and kolaches

No unverified prices were added to the site.

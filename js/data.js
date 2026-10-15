/* Site content. Edit this file to update the drop and contact details. */

/* The Doomsday drop. Mockups live in assets/drop/; the first one is the cover.
   Prices are in rupees. Set `mrp` to show a struck-off price next to `price`. */
window.OG_RELEASES = [
  {
    id: "doomsday",
    number: "01",
    name: "Doomsday",
    line: "The mask goes on. Big green Doomsday back print on a washed black tee.",
    color: "Black",
    fit: "Oversized",
    fabric: "240 GSM cotton",
    print: "Screen print",
    sizes: ["M", "L", "XL"],
    mrp: 999,
    price: 799,
    offer: "Dussehra offer",
    mockups: [
      "assets/drop/doomsday-1.jpg",
      "assets/drop/doomsday-2.jpg",
      "assets/drop/doomsday-3.jpg",
      "assets/drop/doomsday-4.jpg",
      "assets/drop/doomsday-5.jpg"
    ]
  },
  {
    id: "rdj-doom",
    number: "02",
    name: "RDJ Doom",
    line: "New mask, same task. A full-colour comic-cover back print on a cream tee.",
    color: "Cream",
    fit: "Oversized",
    fabric: "240 GSM cotton",
    print: "DTF print",
    // Sold out: the card stays up with its photos, but it can't be bought or added to a cart.
    // Delete these two lines when it's back in stock.
    soldOut: true,
    soldOutNote: "Stay tuned, coming next month",
    sizes: ["M", "L", "XL"],
    mrp: 999,
    price: 769,
    offer: "Dussehra offer",
    mockups: [
      "assets/drop/rdj-doom-1.jpg",
      "assets/drop/rdj-doom-2.jpg",
      "assets/drop/rdj-doom-3.jpg",
      "assets/drop/rdj-doom-4.jpg"
    ]
  }
];

window.OG_CONTACT = {
  whatsapp: "918897004533",
  email: "theogs1807@gmail.com",
  instagram: "theogs_fashion"
};

/* Shop settings for the cart and checkout.
   We deliver to South India only. A pincode must start with one of a state's
   prefixes, so a Mumbai or Delhi pincode is caught before the order goes through. */
window.OG_STORE = {
  shipping: 0,          // delivery charge in rupees; 0 shows "Free"
  maxQty: 5,            // most of one tee and size per order
  // Coupon codes and the rupees each takes off the whole order. Codes are not case-sensitive.
  // Add, change or delete codes here; an empty list hides the coupon line and box.
  coupons: { "OG09010": 100, "OG100": 100 },
  // The code printed on the tee cards; tapping it applies the coupon. "" shows no code.
  showCoupon: "OG09010",
  regions: [
    { name: "Andhra Pradesh", pins: ["51", "52", "53"] },
    { name: "Telangana", pins: ["50"] },
    { name: "Karnataka", pins: ["56", "57", "58", "59"] },
    { name: "Tamil Nadu", pins: ["60", "61", "62", "63", "64"] },
    { name: "Kerala", pins: ["67", "68", "69"] },
    { name: "Puducherry", pins: ["605", "607", "609", "533", "673"] }
  ]
};

/* Online payment. Leave `enabled` false until the gateway is set up.
   For Razorpay: put the Key ID (starts with rzp_live_ or rzp_test_) in keyId
   and set enabled to true. Never put the Key Secret here: this file is public. */
window.OG_PAYMENT = {
  enabled: false,
  provider: "razorpay",
  keyId: "",

  // Pay by UPI QR, confirmed by hand. Put your UPI ID (like yourname@ybl) in `id`
  // and checkout shows a QR and a "Pay with UPI app" button for the exact amount,
  // with the order ID in the payment note. The customer types their UTR
  // (12-digit transaction ID) and you check it in your UPI app before shipping.
  // Leave `id` empty to hide this option.
  upi: {
    id: "8897004533@ibl",
    name: "P Jaswanth Chowhan"   // the name on the UPI account, as the customer's app shows it
  }
};

/* Email copy of every order, sent through FormSubmit (free, no account).
   The first order sends an "Activate form" email to this address: click it once,
   and every order after that lands in your inbox. Leave empty to switch off. */
window.OG_ORDER_EMAIL = "theogs1807@gmail.com";

/* Visitor and sales tracking with Google Analytics 4 (free).
   Paste the Measurement ID (looks like G-XXXXXXXXXX) to switch it on.
   Tracked: visits, add to cart, checkout started, address filled, payment step,
   orders placed (with order ID and value) and WhatsApp taps. No names, phone
   numbers or addresses are sent. */
window.OG_ANALYTICS = {
  ga4: ""
};

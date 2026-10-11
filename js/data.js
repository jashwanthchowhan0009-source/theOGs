/* Product catalogue. Prices in INR.
   To use real photos, add `image: "assets/products/your-file.jpg"` to a product;
   the illustration is used only when no image is set. */
window.OG_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "tees", label: "Tees" },
  { id: "hoodies", label: "Hoodies" },
  { id: "jackets", label: "Jackets" },
  { id: "bottoms", label: "Bottoms" },
  { id: "accessories", label: "Accessories" }
];

window.OG_PRODUCTS = [
  {
    id: "box-tee", sku: "OG-TS-001", name: "Heavyweight Box Tee", type: "tee", category: "tees",
    price: 1299, badge: "Bestseller", order: 1, added: 5, print: "",
    desc: "The one that started it. 240 GSM combed cotton, boxy cut, dropped shoulder and a thick rib collar that keeps its shape.",
    fabric: "100% combed cotton, 240 GSM", fit: "Boxy, size down for a regular fit",
    colors: [{ name: "Bone", hex: "#E6E1D6" }, { name: "Ink", hex: "#1B1B1F" }, { name: "Cobalt", hex: "#2F45D8" }],
    sizes: ["S", "M", "L", "XL", "XXL"], soldOut: []
  },
  {
    id: "script-tee", sku: "OG-TS-002", name: "OG Script Tee", type: "tee", category: "tees",
    price: 1199, order: 4, added: 4, print: "OG",
    desc: "Chest print in puff ink on our heavyweight blank. Washed for a lived-in hand feel from day one.",
    fabric: "100% cotton, 240 GSM, puff print", fit: "Boxy",
    colors: [{ name: "Washed Black", hex: "#2B2B2E" }, { name: "Sand", hex: "#CDB894" }],
    sizes: ["S", "M", "L", "XL"], soldOut: ["S"]
  },
  {
    id: "graphic-tee", sku: "OG-TS-007", name: "Drop 07 Graphic Tee", type: "tee", category: "tees",
    price: 1399, badge: "New", order: 2, added: 12, print: "D/07",
    desc: "Limited run for the monsoon drop. Screen printed front, numbered neck label.",
    fabric: "100% cotton, 240 GSM, screen print", fit: "Boxy",
    colors: [{ name: "Olive", hex: "#5E6B47" }, { name: "Bone", hex: "#E6E1D6" }],
    sizes: ["S", "M", "L", "XL"], soldOut: []
  },
  {
    id: "pocket-tee", sku: "OG-TS-008", name: "Oversized Pocket Tee", type: "tee", category: "tees",
    price: 1499, badge: "New", order: 7, added: 11, print: "",
    desc: "Extra length, extra width and a single chest pocket. The summer layer.",
    fabric: "100% cotton, 220 GSM slub", fit: "Oversized",
    colors: [{ name: "Lilac", hex: "#A99BC4" }, { name: "Bone", hex: "#E6E1D6" }],
    sizes: ["S", "M", "L", "XL"], soldOut: ["XL"]
  },
  {
    id: "loopback-hoodie", sku: "OG-HD-004", name: "Loopback Hoodie", type: "hoodie", category: "hoodies",
    price: 2899, badge: "Bestseller", order: 3, added: 6, print: "OG'S",
    desc: "420 GSM French terry with a double-layer hood and a kangaroo pocket deep enough for your phone and keys.",
    fabric: "100% cotton French terry, 420 GSM", fit: "Relaxed, cropped rib hem",
    colors: [{ name: "Heather", hex: "#9A9A9E" }, { name: "Ink", hex: "#1B1B1F" }, { name: "Brick", hex: "#8C3B2E" }],
    sizes: ["S", "M", "L", "XL", "XXL"], soldOut: []
  },
  {
    id: "zip-hoodie", sku: "OG-HD-005", name: "Zip Hoodie Classic", type: "hoodie", category: "hoodies",
    price: 3199, order: 9, added: 3, print: "",
    desc: "Full-zip version of the Loopback with metal YKK hardware and side seam pockets.",
    fabric: "100% cotton French terry, 420 GSM", fit: "Relaxed",
    colors: [{ name: "Forest", hex: "#2F4A3A" }, { name: "Ink", hex: "#1B1B1F" }],
    sizes: ["M", "L", "XL"], soldOut: ["M"]
  },
  {
    id: "coach-jacket", sku: "OG-JK-002", name: "Coach Jacket", type: "jacket", category: "jackets",
    price: 3999, order: 6, added: 8, print: "OG",
    desc: "Water-resistant nylon shell with snap front and a mesh lining. Built for Mumbai monsoons.",
    fabric: "Nylon taslan shell, polyester mesh lining", fit: "Regular",
    colors: [{ name: "Ink", hex: "#1B1B1F" }, { name: "Cobalt", hex: "#2F45D8" }],
    sizes: ["S", "M", "L", "XL"], soldOut: []
  },
  {
    id: "varsity", sku: "OG-JK-003", name: "Varsity Bomber", type: "jacket", category: "jackets",
    price: 5499, badge: "Low stock", order: 5, added: 10, print: "",
    desc: "Wool-blend body with ribbed collar, cuffs and hem. Chenille patch on the back.",
    fabric: "Wool blend body, quilted lining", fit: "Boxy, cropped",
    colors: [{ name: "Maroon", hex: "#5A1E25" }, { name: "Navy", hex: "#1E2A44" }],
    sizes: ["M", "L", "XL"], soldOut: ["XL"]
  },
  {
    id: "utility-cargo", sku: "OG-BT-001", name: "Utility Cargo", type: "cargo", category: "bottoms",
    price: 2699, badge: "Bestseller", order: 8, added: 2, print: "",
    desc: "Heavy cotton twill with six pockets, a relaxed straight leg and an adjustable hem.",
    fabric: "100% cotton twill, 280 GSM", fit: "Relaxed straight",
    colors: [{ name: "Khaki", hex: "#A08F6B" }, { name: "Ink", hex: "#1B1B1F" }, { name: "Olive", hex: "#5E6B47" }],
    sizes: ["28", "30", "32", "34", "36"], soldOut: ["28"]
  },
  {
    id: "parachute", sku: "OG-BT-004", name: "Parachute Pant", type: "cargo", category: "bottoms",
    price: 2499, badge: "New", order: 10, added: 9, print: "",
    desc: "Crinkle nylon with a drawcord waist and toggle hems. Light enough for June.",
    fabric: "Crinkle nylon", fit: "Wide leg",
    colors: [{ name: "Stone", hex: "#B8B5AC" }, { name: "Black", hex: "#141416" }],
    sizes: ["S", "M", "L", "XL"], soldOut: []
  },
  {
    id: "cap", sku: "OG-AC-001", name: "6-Panel Cap", type: "cap", category: "accessories",
    price: 899, order: 11, added: 7, print: "OG",
    desc: "Washed cotton twill, low profile, embroidered front and a brass buckle strap.",
    fabric: "100% cotton twill", fit: "One size, adjustable",
    colors: [{ name: "Ink", hex: "#1B1B1F" }, { name: "Cobalt", hex: "#2F45D8" }, { name: "Bone", hex: "#E6E1D6" }],
    sizes: ["One size"], soldOut: []
  },
  {
    id: "tote", sku: "OG-AC-003", name: "Canvas Tote", type: "tote", category: "accessories",
    price: 799, order: 12, added: 1, print: "OG'S",
    desc: "12 oz canvas with an inner zip pocket. Fits a 14-inch laptop.",
    fabric: "12 oz cotton canvas", fit: "38 × 42 cm",
    colors: [{ name: "Natural", hex: "#DDD3BF" }, { name: "Ink", hex: "#1B1B1F" }],
    sizes: ["One size"], soldOut: []
  }
];

window.OG_LOOKS = [
  { id: "01", title: "Monsoon in Bandra", bg: "#2F45D8", items: [["coach-jacket", 0], ["utility-cargo", 1]], note: "Coach Jacket in Ink, Utility Cargo in Ink" },
  { id: "02", title: "Sunday at Carter Road", bg: "#CDB894", items: [["box-tee", 0], ["parachute", 0], ["cap", 0]], note: "Box Tee in Bone, Parachute Pant in Stone, 6-Panel Cap" },
  { id: "03", title: "Late shift, Lower Parel", bg: "#1B1B1F", items: [["loopback-hoodie", 2], ["utility-cargo", 0]], note: "Loopback Hoodie in Brick, Utility Cargo in Khaki" },
  { id: "04", title: "Studio day", bg: "#A99BC4", items: [["pocket-tee", 1], ["tote", 1]], note: "Pocket Tee in Bone, Canvas Tote in Ink" },
  { id: "05", title: "First chill of the year", bg: "#5A1E25", items: [["varsity", 1], ["graphic-tee", 1]], note: "Varsity Bomber in Navy, Drop 07 Tee in Bone" }
];

/* Garment measurements in cm, laid flat. */
window.OG_SIZE_GUIDE = {
  tops: { head: ["Size", "Chest", "Length", "Shoulder"], rows: [["S", 56, 69, 54], ["M", 59, 71, 56], ["L", 62, 73, 58], ["XL", 65, 75, 60], ["XXL", 68, 77, 62]] },
  bottoms: { head: ["Size", "Waist", "Hip", "Inseam"], rows: [["28", 72, 102, 76], ["30", 77, 106, 77], ["32", 82, 110, 78], ["34", 87, 114, 79], ["36", 92, 118, 80]] },
  easyBottoms: { head: ["Size", "Waist (relaxed)", "Hip", "Inseam"], rows: [["S", "70–78", 108, 76], ["M", "76–84", 112, 77], ["L", "82–90", 116, 78], ["XL", "88–96", 120, 79]] }
};

window.OG_FREE_SHIPPING = 1999;

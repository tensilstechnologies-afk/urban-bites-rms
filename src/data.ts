import type { Category, Customer, Expense, Ingredient, Modifier, Order, Product, Purchase, Reservation, Supplier, Table, User } from './types'

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`
export const FALLBACK_IMG = u('photo-1546069901-ba9599a7e63c')

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Burgers', image: u('photo-1568901346375-23c9450c58cd') },
  { id: 2, name: 'Pizza', image: u('photo-1513104890138-7c749659a591') },
  { id: 3, name: 'Sandwiches', image: u('photo-1528735602780-2552fd46c7af') },
  { id: 4, name: 'Chinese', image: u('photo-1585032226651-759b368d7246') },
  { id: 5, name: 'Desi', image: u('photo-1585937421612-70a008356fbe') },
  { id: 6, name: 'Biryani & Rice', image: u('photo-1563379091339-03b21ab4a4f8') },
  { id: 7, name: 'BBQ & Grills', image: u('photo-1544025162-d76694265947') },
  { id: 8, name: 'Fast Food', image: u('photo-1573080496219-bb080dd4f877') },
  { id: 9, name: 'Pasta', image: u('photo-1473093295043-cdd812d0e601') },
  { id: 10, name: 'Beverages', image: u('photo-1551538827-9c037cb4f32a') },
  { id: 11, name: 'Desserts', image: u('photo-1578985545062-69928b1d9587') },
]

// ingredient ids: 1 Chicken, 2 Beef, 3 Basmati Rice, 4 Flour, 5 Cooking Oil, 6 Cheese,
// 7 Potatoes, 8 Mixed Vegetables, 9 Burger Buns, 10 House Sauce, 11 Spice Mix, 12 Milk,
// 13 Eggs, 14 Pasta, 15 Pizza Dough Balls, 16 Soft Drink Syrup
export const PRODUCTS: Product[] = [
  { id: 1, name: 'Zinger Burger', categoryId: 1, price: 650, costPrice: 320, description: 'Crispy fried chicken thigh, house sauce, iceberg, toasted brioche bun.', image: u('photo-1568901346375-23c9450c58cd'), prepMins: 12, station: 'Fast Food', dietary: '', available: true, sku: 'UB-ZING-650', featured: true, variations: [{ id: 7, name: 'Single', delta: 0 }, { id: 8, name: 'Double', delta: 260 }], recipe: [{ ingredientId: 1, qty: 0.18 }, { ingredientId: 9, qty: 1 }, { ingredientId: 6, qty: 0.02 }, { ingredientId: 10, qty: 0.03 }] },
  { id: 2, name: 'Beef Smash Burger', categoryId: 1, price: 890, costPrice: 450, description: 'Double smashed beef patties, cheddar, pickles, smoky mayo.', image: u('photo-1553979459-d2229ba7433b'), prepMins: 14, station: 'Fast Food', dietary: '', available: true, sku: 'UB-BEEF-890', featured: true, variations: [{ id: 9, name: 'Single', delta: 0 }, { id: 10, name: 'Double', delta: 300 }, { id: 11, name: 'Triple', delta: 560 }], recipe: [{ ingredientId: 2, qty: 0.22 }, { ingredientId: 9, qty: 1 }, { ingredientId: 6, qty: 0.04 }, { ingredientId: 10, qty: 0.03 }] },
  { id: 3, name: 'Chicken Tikka Pizza', categoryId: 2, price: 1450, costPrice: 640, description: 'Char-grilled tikka chunks, onions, green chillies, mozzarella.', image: u('photo-1513104890138-7c749659a591'), prepMins: 18, station: 'Fast Food', dietary: 'Spicy', available: true, sku: 'UB-CHIC-1450', featured: true, variations: [{ id: 1, name: 'Small 9"', delta: -300 }, { id: 2, name: 'Medium 12"', delta: 0 }, { id: 3, name: 'Large 15"', delta: 450 }], recipe: [{ ingredientId: 15, qty: 1 }, { ingredientId: 1, qty: 0.15 }, { ingredientId: 6, qty: 0.12 }, { ingredientId: 8, qty: 0.05 }] },
  { id: 4, name: 'Cheese Lovers Pizza', categoryId: 2, price: 1250, costPrice: 560, description: 'Three-cheese blend on slow-fermented dough, oregano dust.', image: u('photo-1574071318508-1cdbab80d002'), prepMins: 16, station: 'Fast Food', dietary: 'Vegetarian', available: true, sku: 'UB-CHEE-1250', featured: false, variations: [{ id: 4, name: 'Small 9"', delta: -300 }, { id: 5, name: 'Medium 12"', delta: 0 }, { id: 6, name: 'Large 15"', delta: 450 }], recipe: [{ ingredientId: 15, qty: 1 }, { ingredientId: 6, qty: 0.2 }] },
  { id: 5, name: 'Club Sandwich', categoryId: 3, price: 720, costPrice: 340, description: 'Triple-decker with grilled chicken, egg, cheese and fries.', image: u('photo-1528735602780-2552fd46c7af'), prepMins: 10, station: 'Fast Food', dietary: '', available: true, sku: 'UB-CLUB-720', featured: false, variations: [], recipe: [{ ingredientId: 1, qty: 0.1 }, { ingredientId: 13, qty: 1 }, { ingredientId: 6, qty: 0.02 }, { ingredientId: 7, qty: 0.1 }] },
  { id: 6, name: 'Chicken Chow Mein', categoryId: 4, price: 780, costPrice: 360, description: 'Wok-tossed noodles, julienned vegetables, soy-garlic glaze.', image: u('photo-1585032226651-759b368d7246'), prepMins: 12, station: 'Chinese', dietary: '', available: true, sku: 'UB-CHIC-780', featured: true, variations: [], recipe: [{ ingredientId: 1, qty: 0.12 }, { ingredientId: 8, qty: 0.08 }, { ingredientId: 5, qty: 0.02 }] },
  { id: 7, name: 'Kung Pao Chicken', categoryId: 4, price: 950, costPrice: 470, description: 'Szechuan peppers, peanuts, dried chillies, spring onion.', image: u('photo-1555126634-323283e090fa'), prepMins: 14, station: 'Chinese', dietary: 'Spicy', available: true, sku: 'UB-KUNG-950', featured: false, variations: [], recipe: [{ ingredientId: 1, qty: 0.16 }, { ingredientId: 8, qty: 0.05 }, { ingredientId: 11, qty: 0.01 }] },
  { id: 8, name: 'Egg Fried Rice', categoryId: 4, price: 550, costPrice: 230, description: 'Smoky wok rice, egg ribbons, spring onion.', image: u('photo-1603133872878-684f208fb84b'), prepMins: 10, station: 'Chinese', dietary: 'Vegetarian', available: true, sku: 'UB-EGGF-550', featured: false, variations: [], recipe: [{ ingredientId: 3, qty: 0.12 }, { ingredientId: 13, qty: 1 }, { ingredientId: 8, qty: 0.04 }] },
  { id: 9, name: 'Hot & Sour Soup', categoryId: 4, price: 380, costPrice: 160, description: 'Peppery broth, chicken, tofu, bamboo shoots.', image: u('photo-1547592166-23ac45744acd'), prepMins: 8, station: 'Chinese', dietary: 'Spicy', available: true, sku: 'UB-HOTS-380', featured: false, variations: [], recipe: [] },
  { id: 10, name: 'Chicken Karahi', categoryId: 5, price: 1350, costPrice: 680, description: 'Wok-cooked in tomato, ginger and green chillies, desi ghee finish.', image: u('photo-1585937421612-70a008356fbe'), prepMins: 22, station: 'Desi Kitchen', dietary: 'Spicy', available: true, sku: 'UB-CHIC-1350', featured: true, variations: [{ id: 12, name: 'Half', delta: 0 }, { id: 13, name: 'Full', delta: 1150 }], recipe: [{ ingredientId: 1, qty: 0.4 }, { ingredientId: 8, qty: 0.1 }, { ingredientId: 5, qty: 0.05 }, { ingredientId: 11, qty: 0.02 }] },
  { id: 11, name: 'Chicken Handi', categoryId: 5, price: 1250, costPrice: 610, description: 'Creamy clay-pot curry, fenugreek, fresh cream swirl.', image: u('photo-1565557623262-b51c2513a641'), prepMins: 20, station: 'Desi Kitchen', dietary: '', available: true, sku: 'UB-CHIC-1250', featured: false, variations: [{ id: 14, name: 'Half', delta: 0 }, { id: 15, name: 'Full', delta: 1050 }], recipe: [{ ingredientId: 1, qty: 0.35 }, { ingredientId: 5, qty: 0.04 }, { ingredientId: 11, qty: 0.02 }] },
  { id: 12, name: 'Beef Nihari', categoryId: 5, price: 980, costPrice: 520, description: 'Slow-braised beef shank, brown onion, ginger julienne.', image: u('photo-1601050690597-df0568f70950'), prepMins: 25, station: 'Desi Kitchen', dietary: 'Spicy', available: true, sku: 'UB-BEEF-980', featured: false, variations: [], recipe: [{ ingredientId: 2, qty: 0.3 }, { ingredientId: 4, qty: 0.03 }, { ingredientId: 11, qty: 0.03 }, { ingredientId: 5, qty: 0.04 }] },
  { id: 13, name: 'Daal Fry', categoryId: 5, price: 480, costPrice: 190, description: 'Yellow lentils tempered with garlic and whole red chillies.', image: u('photo-1546833999-b9f581a1996d'), prepMins: 15, station: 'Desi Kitchen', dietary: 'Vegetarian', available: true, sku: 'UB-DAAL-480', featured: false, variations: [], recipe: [] },
  { id: 14, name: 'Chicken Biryani', categoryId: 6, price: 450, costPrice: 210, description: 'Layered basmati, saffron, fried onions, raita on the side.', image: u('photo-1563379091339-03b21ab4a4f8'), prepMins: 10, station: 'Desi Kitchen', dietary: 'Spicy', available: true, sku: 'UB-CHIC-450', featured: true, variations: [{ id: 16, name: 'Single', delta: 0 }, { id: 17, name: 'Family Deg', delta: 1450 }], recipe: [{ ingredientId: 3, qty: 0.15 }, { ingredientId: 1, qty: 0.15 }, { ingredientId: 11, qty: 0.015 }, { ingredientId: 5, qty: 0.02 }] },
  { id: 15, name: 'Beef Pulao', categoryId: 6, price: 520, costPrice: 250, description: 'Yakhni-cooked rice with tender beef pieces and whole spices.', image: u('photo-1631452180519-c014fe946bc7'), prepMins: 10, station: 'Desi Kitchen', dietary: '', available: true, sku: 'UB-BEEF-520', featured: false, variations: [], recipe: [{ ingredientId: 3, qty: 0.15 }, { ingredientId: 2, qty: 0.12 }, { ingredientId: 11, qty: 0.01 }] },
  { id: 16, name: 'Chicken Tikka', categoryId: 7, price: 480, costPrice: 240, description: 'Overnight-marinated leg quarter, charcoal grilled.', image: u('photo-1599487488170-d11ec9c172f0'), prepMins: 16, station: 'BBQ', dietary: 'Spicy', available: true, sku: 'UB-CHIC-480', featured: true, variations: [], recipe: [{ ingredientId: 1, qty: 0.25 }, { ingredientId: 11, qty: 0.015 }] },
  { id: 17, name: 'Seekh Kebab (4 pcs)', categoryId: 7, price: 650, costPrice: 330, description: 'Hand-minced beef, green chillies, coriander, smoked over coals.', image: u('photo-1555939594-58d7cb561ad1'), prepMins: 14, station: 'BBQ', dietary: '', available: true, sku: 'UB-SEEK-650', featured: false, variations: [], recipe: [{ ingredientId: 2, qty: 0.2 }, { ingredientId: 11, qty: 0.01 }, { ingredientId: 8, qty: 0.03 }] },
  { id: 18, name: 'Chicken Malai Boti', categoryId: 7, price: 780, costPrice: 390, description: 'Cream-cheese marinade, melt-in-mouth cubes, mint chutney.', image: u('photo-1603360946369-dc9bb6258143'), prepMins: 15, station: 'BBQ', dietary: '', available: true, sku: 'UB-CHIC-780', featured: false, variations: [], recipe: [{ ingredientId: 1, qty: 0.2 }, { ingredientId: 6, qty: 0.03 }] },
  { id: 19, name: 'Urban BBQ Platter', categoryId: 7, price: 2450, costPrice: 1250, description: 'Tikka, kebabs, malai boti and wings with naan and chutneys. Serves 3–4.', image: u('photo-1544025162-d76694265947'), prepMins: 25, station: 'BBQ', dietary: '', available: true, sku: 'UB-URBA-2450', featured: true, variations: [], recipe: [] },
  { id: 20, name: 'Loaded Fries', categoryId: 8, price: 550, costPrice: 240, description: 'Cheese sauce, jalapeños, chicken chunks, house drizzle.', image: u('photo-1573080496219-bb080dd4f877'), prepMins: 8, station: 'Fast Food', dietary: '', available: true, sku: 'UB-LOAD-550', featured: false, variations: [], recipe: [{ ingredientId: 7, qty: 0.25 }, { ingredientId: 6, qty: 0.05 }, { ingredientId: 1, qty: 0.06 }] },
  { id: 21, name: 'Crispy Wings (6 pcs)', categoryId: 8, price: 620, costPrice: 300, description: 'Honey-soy glazed wings, sesame sprinkle.', image: u('photo-1527477396000-e27163b481c2'), prepMins: 12, station: 'Fast Food', dietary: '', available: true, sku: 'UB-CRIS-620', featured: false, variations: [], recipe: [] },
  { id: 22, name: 'Chicken Nuggets (8 pcs)', categoryId: 8, price: 480, costPrice: 210, description: 'Golden nuggets with garlic mayo dip.', image: u('photo-1562967914-608f82629710'), prepMins: 8, station: 'Fast Food', dietary: '', available: true, sku: 'UB-CHIC-480', featured: false, variations: [], recipe: [] },
  { id: 23, name: 'Garlic Bread', categoryId: 8, price: 350, costPrice: 130, description: 'Wood-fired loaf, garlic butter, parsley.', image: u('photo-1509440159596-0249088772ff'), prepMins: 6, station: 'Fast Food', dietary: 'Vegetarian', available: true, sku: 'UB-GARL-350', featured: false, variations: [], recipe: [] },
  { id: 24, name: 'Chicken Alfredo Pasta', categoryId: 9, price: 1150, costPrice: 520, description: 'Silky parmesan cream, grilled chicken, cracked pepper.', image: u('photo-1621996346565-701a9a36c3e3'), prepMins: 15, station: 'Fast Food', dietary: '', available: true, sku: 'UB-CHIC-1150', featured: true, variations: [], recipe: [{ ingredientId: 14, qty: 0.12 }, { ingredientId: 1, qty: 0.12 }, { ingredientId: 6, qty: 0.04 }, { ingredientId: 12, qty: 0.08 }] },
  { id: 25, name: 'Arrabbiata Penne', categoryId: 9, price: 980, costPrice: 430, description: 'Slow tomato sugo, chilli, basil, pecorino.', image: u('photo-1563379926898-05f4575a45d8'), prepMins: 13, station: 'Fast Food', dietary: 'Vegetarian, Spicy', available: true, sku: 'UB-ARRA-980', featured: false, variations: [], recipe: [{ ingredientId: 14, qty: 0.12 }, { ingredientId: 8, qty: 0.08 }, { ingredientId: 5, qty: 0.02 }] },
  { id: 26, name: 'Garden Fresh Salad', categoryId: 8, price: 420, costPrice: 170, description: 'Seasonal greens, feta, olives, lemon vinaigrette.', image: u('photo-1512621776951-a57141f2eefd'), prepMins: 5, station: 'Fast Food', dietary: 'Vegetarian, Healthy', available: true, sku: 'UB-GARD-420', featured: false, variations: [], recipe: [] },
  { id: 27, name: 'Mint Margarita', categoryId: 10, price: 300, costPrice: 90, description: 'Fresh mint, lime, soda — the house cooler.', image: u('photo-1551538827-9c037cb4f32a'), prepMins: 3, station: 'Beverages', dietary: '', available: true, sku: 'UB-MINT-300', featured: false, variations: [{ id: 18, name: 'Regular', delta: 0 }, { id: 19, name: 'Large', delta: 90 }], recipe: [] },
  { id: 28, name: 'Mango Shake', categoryId: 10, price: 450, costPrice: 180, description: 'Chaunsa mangoes blended with vanilla ice cream.', image: u('photo-1553530666-ba11a7da3888'), prepMins: 4, station: 'Beverages', dietary: '', available: true, sku: 'UB-MANG-450', featured: false, variations: [], recipe: [{ ingredientId: 12, qty: 0.2 }] },
  { id: 29, name: 'Cold Coffee', categoryId: 10, price: 480, costPrice: 170, description: 'Double-shot espresso, blended thick with ice cream.', image: u('photo-1461023058943-07fcbe16d735'), prepMins: 4, station: 'Beverages', dietary: '', available: true, sku: 'UB-COLD-480', featured: false, variations: [{ id: 20, name: 'Regular', delta: 0 }, { id: 21, name: 'Large', delta: 110 }], recipe: [{ ingredientId: 12, qty: 0.15 }] },
  { id: 30, name: 'Karak Chai', categoryId: 10, price: 180, costPrice: 60, description: 'Slow-brewed strong tea with cardamom.', image: u('photo-1544787219-7f47ccb76574'), prepMins: 5, station: 'Beverages', dietary: '', available: true, sku: 'UB-KARA-180', featured: false, variations: [], recipe: [{ ingredientId: 12, qty: 0.12 }] },
  { id: 31, name: 'Chocolate Lava Cake', categoryId: 11, price: 550, costPrice: 230, description: 'Molten-centre chocolate cake with vanilla ice cream.', image: u('photo-1578985545062-69928b1d9587'), prepMins: 10, station: 'Fast Food', dietary: '', available: true, sku: 'UB-CHOC-550', featured: true, variations: [], recipe: [] },
  { id: 32, name: 'Gulab Jamun (4 pcs)', categoryId: 11, price: 320, costPrice: 120, description: 'Warm khoya dumplings in rose syrup.', image: u('photo-1551024506-0bccd828d307'), prepMins: 4, station: 'Desi Kitchen', dietary: 'Vegetarian', available: true, sku: 'UB-GULA-320', featured: false, variations: [], recipe: [] },
  { id: 33, name: 'Special Kulfa', categoryId: 11, price: 350, costPrice: 140, description: 'Dense traditional kulfa with pistachio dust.', image: u('photo-1488477181946-6428a0291777'), prepMins: 3, station: 'Beverages', dietary: 'Vegetarian', available: true, sku: 'UB-SPEC-350', featured: false, variations: [], recipe: [] },
  { id: 34, name: 'Royal Falooda', categoryId: 11, price: 600, costPrice: 260, description: 'Rose milk, vermicelli, basil seeds, kulfa and jelly.', image: u('photo-1563805042-7684c019e1cb'), prepMins: 6, station: 'Beverages', dietary: '', available: true, sku: 'UB-ROYA-600', featured: false, variations: [], recipe: [] },
  { id: 35, name: 'Mineral Water', categoryId: 10, price: 150, costPrice: 60, description: 'Chilled 500ml mineral water bottle.', image: u('photo-1523362628745-0c100150b504'), prepMins: 2, station: 'Beverages', dietary: '', available: true, sku: 'UB-WATE-150', featured: false, variations: [], recipe: [] },
]

export const MODIFIERS: Modifier[] = [
  { id: 1, name: 'Extra Cheese', group: 'Extras', price: 120 },
  { id: 2, name: 'Extra Sauce', group: 'Extras', price: 50 },
  { id: 3, name: 'Extra Patty', group: 'Extras', price: 280 },
  { id: 4, name: 'Extra Chicken', group: 'Extras', price: 300 },
  { id: 5, name: 'Extra Toppings', group: 'Extras', price: 150 },
  { id: 6, name: 'Extra Egg', group: 'Extras', price: 80 },
  { id: 7, name: 'Mild', group: 'Spice Level', price: 0 },
  { id: 8, name: 'Medium', group: 'Spice Level', price: 0 },
  { id: 9, name: 'Hot', group: 'Spice Level', price: 0 },
  { id: 10, name: 'Extra Hot', group: 'Spice Level', price: 0 },
]

export const INGREDIENTS: Ingredient[] = [
  { id: 1, name: 'Chicken', qty: 42, unit: 'kg', minLevel: 15, unitCost: 780, expiry: null },
  { id: 2, name: 'Beef', qty: 26, unit: 'kg', minLevel: 10, unitCost: 1150, expiry: null },
  { id: 3, name: 'Basmati Rice', qty: 60, unit: 'kg', minLevel: 20, unitCost: 320, expiry: null },
  { id: 4, name: 'Flour', qty: 48, unit: 'kg', minLevel: 15, unitCost: 160, expiry: null },
  { id: 5, name: 'Cooking Oil', qty: 14, unit: 'L', minLevel: 18, unitCost: 540, expiry: null },
  { id: 6, name: 'Cheese', qty: 3.5, unit: 'kg', minLevel: 6, unitCost: 1900, expiry: null },
  { id: 7, name: 'Potatoes', qty: 55, unit: 'kg', minLevel: 20, unitCost: 140, expiry: null },
  { id: 8, name: 'Mixed Vegetables', qty: 22, unit: 'kg', minLevel: 8, unitCost: 260, expiry: null },
  { id: 9, name: 'Burger Buns', qty: 120, unit: 'pcs', minLevel: 40, unitCost: 45, expiry: null },
  { id: 10, name: 'House Sauce', qty: 9, unit: 'L', minLevel: 4, unitCost: 620, expiry: null },
  { id: 11, name: 'Spice Mix', qty: 7, unit: 'kg', minLevel: 3, unitCost: 850, expiry: null },
  { id: 12, name: 'Milk', qty: 18, unit: 'L', minLevel: 10, unitCost: 210, expiry: '2026-11-22' },
  { id: 13, name: 'Eggs', qty: 90, unit: 'pcs', minLevel: 60, unitCost: 28, expiry: null },
  { id: 14, name: 'Pasta', qty: 16, unit: 'kg', minLevel: 6, unitCost: 480, expiry: null },
  { id: 15, name: 'Pizza Dough Balls', qty: 38, unit: 'pcs', minLevel: 20, unitCost: 90, expiry: null },
  { id: 16, name: 'Soft Drink Syrup', qty: 11, unit: 'L', minLevel: 5, unitCost: 700, expiry: null },
]

export const USERS: User[] = [
  { id: 1, name: 'System Admin', email: 'admin@urbanbites.pk', role: 'super_admin', roleLabel: 'Super Admin', phone: '0300-1110001', salary: 0, active: true, joinedAt: '2026-01-05' },
  { id: 2, name: 'Ahmed Raza', email: 'owner@urbanbites.pk', role: 'owner', roleLabel: 'Restaurant Owner', phone: '0300-1110002', salary: 450000, active: true, joinedAt: '2026-05-03' },
  { id: 3, name: 'Fatima Noor', email: 'fatima@urbanbites.pk', role: 'admin', roleLabel: 'Restaurant Admin', phone: '0300-1110003', salary: 180000, active: true, joinedAt: '2026-05-10' },
  { id: 4, name: 'Bilal Hussain', email: 'manager@urbanbites.pk', role: 'manager', roleLabel: 'General Manager', phone: '0300-1110004', salary: 220000, active: true, joinedAt: '2026-05-12' },
  { id: 5, name: 'Ayesha Khan', email: 'cashier@urbanbites.pk', role: 'cashier', roleLabel: 'Cashier', phone: '0300-1110005', salary: 75000, active: true, joinedAt: '2026-06-01' },
  { id: 6, name: 'Usman Tariq', email: 'usman@urbanbites.pk', role: 'waiter', roleLabel: 'Waiter / Server', phone: '0300-1110006', salary: 55000, active: true, joinedAt: '2026-06-02' },
  { id: 7, name: 'Ali Hassan', email: 'ali@urbanbites.pk', role: 'waiter', roleLabel: 'Waiter / Server', phone: '0300-1110007', salary: 55000, active: true, joinedAt: '2026-06-03' },
  { id: 8, name: 'Imran Sheikh', email: 'chef@urbanbites.pk', role: 'chef', roleLabel: 'Chef', phone: '0300-1110008', salary: 140000, active: true, joinedAt: '2026-05-20' },
  { id: 9, name: 'Kamran Ali', email: 'kitchen@urbanbites.pk', role: 'kitchen', roleLabel: 'Kitchen Staff', phone: '0300-1110009', salary: 60000, active: true, joinedAt: '2026-06-10' },
  { id: 10, name: 'Hira Shahid', email: 'inventory@urbanbites.pk', role: 'inventory', roleLabel: 'Inventory Manager', phone: '0300-1110010', salary: 110000, active: true, joinedAt: '2026-06-15' },
  { id: 11, name: 'Omar Farooq', email: 'accountant@urbanbites.pk', role: 'accountant', roleLabel: 'Accountant', phone: '0300-1110011', salary: 130000, active: true, joinedAt: '2026-06-20' },
]
export const DEMO_PASSWORD = 'demo1234'

export const CUSTOMERS: Customer[] = [
  { id: 1, name: 'Hassan Javed', phone: '0321-5550142', email: 'hassan@example.com', points: 1240, segment: 'VIP', notes: 'Loves BBQ platter.' },
  { id: 2, name: 'Mahnoor Fatima', phone: '0333-5550190', email: 'mahnoor@example.com', points: 460, segment: 'Regular', notes: '' },
  { id: 3, name: 'Danish Ali', phone: '0301-5550190', email: 'danish@example.com', points: 320, segment: 'Regular', notes: '' },
  { id: 4, name: 'Zainab Tariq', phone: '0345-5550113', email: 'zainab@example.com', points: 60, segment: 'New', notes: '' },
  { id: 5, name: 'Shahid Mehmood', phone: '0322-5550161', email: 'shahid@example.com', points: 2180, segment: 'VIP', notes: 'Family orders every Friday.' },
  { id: 6, name: 'Areeba Khan', phone: '0311-5550128', email: 'areeba@example.com', points: 540, segment: 'Regular', notes: '' },
  { id: 7, name: 'Fahad Iqbal', phone: '0308-5550155', email: 'fahad@example.com', points: 25, segment: 'New', notes: '' },
  { id: 8, name: 'Sana Nawaz', phone: '0334-5550184', email: 'sana@example.com', points: 780, segment: 'Regular', notes: 'Birthday bookings.' },
]

export const SUPPLIERS: Supplier[] = [
  { id: 1, name: 'Lahore Meat Supply', contact: 'Rana Iqbal', phone: '0300-2221001', email: 'sales@lahoremeat.pk', balance: 45000 },
  { id: 2, name: 'Punjab Rice Traders', contact: 'Ch. Naveed', phone: '0300-2221002', email: 'info@punjabrice.pk', balance: 28000 },
  { id: 3, name: 'Fresh Veg Market', contact: 'Sajid Ali', phone: '0300-2221003', email: 'fresh@vegmarket.pk', balance: 12000 },
  { id: 4, name: 'Dairy Fresh Co.', contact: 'Ayesha Malik', phone: '0300-2221004', email: 'orders@dairyfresh.pk', balance: 9500 },
]

export const PURCHASES: Purchase[] = [
  { id: 1, supplierId: 1, supplierName: 'Lahore Meat Supply', items: 'Chicken 40kg, Beef 25kg', total: 60000, paid: 15000, date: '2026-11-15', status: 'Partial' },
  { id: 2, supplierId: 2, supplierName: 'Punjab Rice Traders', items: 'Basmati Rice 50kg', total: 16000, paid: 16000, date: '2026-11-14', status: 'Received' },
  { id: 3, supplierId: 4, supplierName: 'Dairy Fresh Co.', items: 'Milk 20L, Cheese 5kg', total: 13700, paid: 4200, date: '2026-11-17', status: 'Partial' },
]

export const EXPENSES: Expense[] = [
  { id: 1, category: 'Electricity', description: 'November electricity bill', amount: 86400, method: 'Bank Transfer', date: '2026-11-13' },
  { id: 2, category: 'Marketing', description: 'Facebook ads — November', amount: 45000, method: 'Card', date: '2026-11-14' },
  { id: 3, category: 'Gas', description: 'Sui gas bill', amount: 31200, method: 'Bank Transfer', date: '2026-11-15' },
  { id: 4, category: 'Maintenance', description: 'Oven + grill servicing', amount: 30800, method: 'Cash', date: '2026-11-16' },
  { id: 5, category: 'Utilities', description: 'Water + internet', amount: 12750, method: 'Bank Transfer', date: '2026-11-17' },
  { id: 6, category: 'Water', description: 'Water tanker', amount: 8500, method: 'Cash', date: '2026-11-18' },
]

export const TABLES: Table[] = [
  { id: 1, label: 'T1', floor: 'Main Hall', capacity: 4, status: 'occupied', waiterId: 6, x: 8, y: 12 },
  { id: 2, label: 'T2', floor: 'Main Hall', capacity: 4, status: 'available', waiterId: 6, x: 30, y: 12 },
  { id: 3, label: 'T3', floor: 'Main Hall', capacity: 6, status: 'occupied', waiterId: 7, x: 52, y: 12 },
  { id: 4, label: 'T4', floor: 'Main Hall', capacity: 2, status: 'reserved', waiterId: 6, x: 74, y: 12 },
  { id: 5, label: 'T5', floor: 'Main Hall', capacity: 4, status: 'available', waiterId: 7, x: 8, y: 48 },
  { id: 6, label: 'T6', floor: 'Main Hall', capacity: 8, status: 'waiting_food', waiterId: 6, x: 30, y: 48 },
  { id: 7, label: 'T7', floor: 'Main Hall', capacity: 4, status: 'cleaning', waiterId: null, x: 52, y: 48 },
  { id: 8, label: 'T8', floor: 'Main Hall', capacity: 4, status: 'available', waiterId: 7, x: 74, y: 48 },
  { id: 9, label: 'T9', floor: 'Family Hall', capacity: 6, status: 'occupied', waiterId: 7, x: 8, y: 12 },
  { id: 10, label: 'T10', floor: 'Family Hall', capacity: 10, status: 'available', waiterId: 6, x: 30, y: 12 },
  { id: 11, label: 'T11', floor: 'Family Hall', capacity: 4, status: 'served', waiterId: 6, x: 52, y: 12 },
  { id: 12, label: 'T12', floor: 'Family Hall', capacity: 4, status: 'payment_pending', waiterId: 7, x: 74, y: 12 },
]

export const RESERVATIONS: Reservation[] = [
  { id: 1, customer: 'Sana Nawaz', tableLabel: 'T4', date: '2026-11-20', time: '19:00', guests: 2, status: 'Confirmed' },
  { id: 2, customer: 'Shahid Mehmood', tableLabel: 'T10', date: '2026-11-21', time: '20:00', guests: 8, status: 'Confirmed' },
]

// Deterministic seeded demo orders, 13–19 Nov 2026: 54 orders, 48 completed, 3 pending, 3 cancelled.
// Completed sales total ≈ PKR 136,530 (verified by simulation; target was ≈140,392).
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildSeedOrders(): Order[] {
  const r = mulberry32(123)
  const types = ['dine_in', 'takeaway', 'delivery', 'pickup', 'online'] as const
  const methods = ['Cash', 'Card', 'Bank Transfer', 'Digital Wallet']
  const waiters = ['Usman Tariq', 'Ali Hassan']
  const orders: Order[] = []
  for (let i = 0; i < 54; i++) {
    const day = 13 + Math.floor(i / 8)
    const hour = 12 + Math.floor(r() * 9)
    const min = Math.floor(r() * 60)
    const cancelled = i % 18 === 5
    const pending = !cancelled && i >= 51
    const nItems = 2 + Math.floor(r() * 2)
    const used = new Set<number>()
    const items = []
    let subtotal = 0
    for (let j = 0; j < nItems; j++) {
      let p = PRODUCTS[Math.floor(r() * PRODUCTS.length)]
      while (used.has(p.id)) p = PRODUCTS[Math.floor(r() * PRODUCTS.length)]
      used.add(p.id)
      const qty = r() < 0.35 ? 2 : 1
      subtotal += p.price * qty
      items.push({ productId: p.id, name: p.name, qty, unitPrice: p.price, variation: '', modifiers: '', notes: '' })
    }
    const tax = Math.round(subtotal * 0.05)
    const total = subtotal + tax
    const cust = CUSTOMERS[Math.floor(r() * CUSTOMERS.length)]
    const type = types[Math.floor(r() * types.length)]
    const createdAt = `2026-11-${day}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`
    const method = methods[Math.floor(r() * methods.length)]
    orders.push({
      id: 1000 + i, number: `UB-${1085 + i}`, type,
      status: cancelled ? 'cancelled' : pending ? 'pending' : 'completed',
      kitchenStatus: cancelled ? 'completed' : pending ? (i === 51 ? 'new' : i === 52 ? 'preparing' : 'ready') : 'completed',
      customerId: cust.id, customerName: cust.name, waiterName: waiters[i % 2],
      tableLabel: type === 'dine_in' ? `T${1 + (i % 12)}` : null,
      items, subtotal, discount: 0, tax, serviceCharge: 0, deliveryFee: type === 'delivery' ? 200 : 0,
      total: total + (type === 'delivery' ? 200 : 0),
      paidAmount: cancelled || pending ? 0 : total + (type === 'delivery' ? 200 : 0),
      paymentStatus: cancelled || pending ? 'unpaid' : 'paid',
      payments: cancelled || pending ? [] : [{ method, amount: total + (type === 'delivery' ? 200 : 0), at: createdAt }],
      createdAt, notes: '', cancelReason: cancelled ? 'Customer cancelled' : '', source: type === 'online' ? 'online' : 'pos',
    })
  }
  return orders
}

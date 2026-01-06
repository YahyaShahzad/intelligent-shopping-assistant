# INTELLIGENT SHOPPING ASSISTANT - UML DOCUMENTATION

**Project:** AI-Powered E-Commerce Shopping Assistant  
**Stack:** MEVN (MongoDB, Express.js, Vue.js, Node.js)  
**Version:** 1.0.0  
**Date:** January 6, 2026

---

## 1. USE CASE NARRATION

### 1.1 USER AUTHENTICATION USE CASES

#### UC-01: User Registration
**Actor:** Visitor  
**Precondition:** User is not logged in  
**Postcondition:** User account is created and activated

**Main Flow:**
1. Visitor navigates to registration page
2. System displays registration form
3. Visitor enters name, email, password, and student status
4. Visitor submits registration form
5. System validates input data (email format, password length ≥ 6)
6. System checks if email already exists in database
7. System hashes password using bcrypt (10 rounds)
8. System creates new user account in MongoDB
9. System generates JWT token (7-day expiration)
10. System returns success message with authentication token
11. System redirects user to home page

**Alternative Flows:**
- **A1:** Email already exists
  - System displays error: "Email already registered"
  - User returns to step 3
- **A2:** Invalid input (weak password, invalid email)
  - System displays validation errors
  - User returns to step 3

**Business Rules:**
- Email must be unique
- Password minimum 6 characters
- Student status is optional (default: false)

---

#### UC-02: User Login
**Actor:** Registered User  
**Precondition:** User has valid account  
**Postcondition:** User is authenticated and session is active

**Main Flow:**
1. User navigates to login page
2. System displays login form
3. User enters email and password
4. User submits login form
5. System retrieves user from database by email
6. System compares password with hashed password using bcrypt
7. System generates JWT token with userId
8. System returns token and user details (excluding password)
9. Frontend stores token in localStorage and Vuex store
10. System creates shopping session with sessionId
11. System redirects user to home page

**Alternative Flows:**
- **A1:** Invalid credentials
  - System displays error: "Invalid email or password"
  - User returns to step 3
- **A2:** Account not found
  - System displays error: "Account does not exist"
  - User can choose to register

---

### 1.2 PRODUCT BROWSING USE CASES

#### UC-03: Browse Products
**Actor:** Authenticated User  
**Precondition:** User is logged in with active session  
**Postcondition:** Products are displayed to user

**Main Flow:**
1. User accesses products page
2. System initializes user session (if not exists)
3. System transitions session state to "Browsing"
4. System fetches all products from database
5. System displays products in grid layout with:
   - Product image
   - Product name
   - Price
   - Category
   - Stock status
6. User views product list
7. System updates user's browsing history

**Alternative Flows:**
- **A1:** No products available
  - System displays message: "No products available"

---

#### UC-04: Search and Filter Products
**Actor:** Authenticated User  
**Precondition:** User is on products page  
**Postcondition:** Filtered products are displayed

**Main Flow:**
1. User enters search term in search box
2. System transitions session state to "Searching"
3. System filters products by:
   - Name (contains search term)
   - Description (contains search term)
   - Category (exact match)
4. User selects category filter dropdown
5. System applies category filter
6. User sets price range filters (min/max)
7. System applies price filters
8. System displays filtered results
9. System shows result count

**Alternative Flows:**
- **A1:** No matching products
  - System displays "No products found"
  - System suggests clearing filters
- **A2:** User clears filters
  - System resets all filters
  - System displays all products

---

#### UC-05: View Product Details
**Actor:** Authenticated User  
**Precondition:** User is viewing product list  
**Postcondition:** Detailed product information is displayed

**Main Flow:**
1. User clicks on product card
2. System fetches complete product details including:
   - Full description
   - Category
   - Tags
   - Current stock level
   - Product images
   - Ratings
3. System displays product detail page
4. System shows "Add to Cart" button
5. System displays quantity selector
6. System records product view in browsing history
7. User views product information

**Alternative Flows:**
- **A1:** Product out of stock
  - System disables "Add to Cart" button
  - System displays "Out of Stock" message

---

### 1.3 SHOPPING CART USE CASES

#### UC-06: Add Product to Cart
**Actor:** Authenticated User  
**Precondition:** User is viewing product details, product is in stock  
**Postcondition:** Product is added to cart, discounts are applied

**Main Flow:**
1. User selects quantity using quantity selector
2. User clicks "Add to Cart" button
3. System transitions session state to "Cart"
4. System creates CartItem object with:
   - productId
   - name
   - price
   - quantity
   - category
   - tags
5. System adds CartItem to ShoppingCart
6. System triggers Blackboard update
7. **Knowledge Sources Execute:**
   - **RuleInterpreterKS** evaluates business rules
   - **InventoryCheckerKS** validates stock availability
   - **DiscountCalculatorKS** calculates applicable discounts:
     * Student discount (15-20% if user.isStudent = true)
     * Category discount (e.g., 20% on electronics)
     * Bulk discount (10% if quantity ≥ 3)
8. System applies Visitor pattern:
   - DiscountVisitor calculates total discount
   - TaxVisitor calculates tax (if applicable)
   - TotalCalculatorVisitor computes final total
9. System updates cart with:
   - Subtotal
   - Total discount
   - Final total
10. System returns updated cart to frontend
11. Frontend displays success notification
12. Frontend updates cart icon badge with item count
13. Frontend opens cart sidebar showing cart contents

**Alternative Flows:**
- **A1:** Insufficient stock
  - System displays error: "Only X items available"
  - User adjusts quantity
- **A2:** Product already in cart
  - System increases quantity of existing cart item
  - System recalculates discounts

---

#### UC-07: View Shopping Cart
**Actor:** Authenticated User  
**Precondition:** User has active session  
**Postcondition:** Cart contents are displayed

**Main Flow:**
1. User clicks cart icon in header
2. System opens cart sidebar
3. System displays for each cart item:
   - Product name
   - Quantity with +/- controls
   - Unit price
   - Subtotal
   - Applied discounts
4. System displays cart summary:
   - Subtotal
   - Total discount (with breakdown)
   - Final total
5. System displays "Proceed to Checkout" button
6. User reviews cart contents

**Alternative Flows:**
- **A1:** Cart is empty
  - System displays "Your cart is empty"
  - System shows "Start Shopping" button

---

#### UC-08: Update Cart Quantity
**Actor:** Authenticated User  
**Precondition:** Product exists in cart  
**Postcondition:** Cart is updated with new quantity

**Main Flow:**
1. User clicks +/- buttons on cart item
2. System validates new quantity against stock
3. System updates CartItem quantity
4. System recalculates discounts via Knowledge Sources
5. System updates cart totals
6. System emits Socket.IO event "cart:updated"
7. Frontend receives real-time update
8. Frontend refreshes cart display

**Alternative Flows:**
- **A1:** Quantity exceeds stock
  - System sets quantity to maximum available
  - System displays warning message
- **A2:** Quantity reduced to 0
  - System removes item from cart
  - System recalculates remaining cart

---

#### UC-09: Remove Item from Cart
**Actor:** Authenticated User  
**Precondition:** Item exists in cart  
**Postcondition:** Item is removed, cart is recalculated

**Main Flow:**
1. User clicks remove/delete icon on cart item
2. System removes CartItem from ShoppingCart
3. System triggers Blackboard update
4. System recalculates cart:
   - Updates subtotal
   - Recalculates applicable discounts
   - Updates final total
5. System returns updated cart
6. Frontend removes item from display
7. Frontend updates cart badge count

**Alternative Flows:**
- **A1:** Last item removed
  - System displays empty cart message
  - System hides checkout button

---

### 1.4 AI ASSISTANT USE CASES

#### UC-10: Get Product Recommendations
**Actor:** Authenticated User  
**Precondition:** User is logged in  
**Postcondition:** Personalized recommendations are provided

**Main Flow:**
1. User opens AI assistant panel
2. User clicks "Get Recommendations" or asks for suggestions
3. System fetches user data from database including:
   - Purchase history
   - Browsing history
   - Preferences
   - Student status
4. System updates Blackboard with user data
5. **PersonalizationEngineKS executes:**
   - Analyzes purchase history for frequent categories
   - Examines browsing history for interest patterns
   - Identifies preferred price ranges
   - Considers user attributes (student status)
6. System generates recommendations based on:
   - Most viewed categories
   - Previously purchased product types
   - Similar products to browsing history
   - Trending products in preferred categories
7. System returns top 5-10 recommended products
8. Frontend displays recommendations with:
   - Product image
   - Name and price
   - Reason for recommendation
   - "Add to Cart" quick action
9. User views personalized suggestions

**Alternative Flows:**
- **A1:** No purchase history
  - System recommends based on browsing history only
- **A2:** New user (no history)
  - System recommends trending/popular products

---

#### UC-11: Get Cart Optimization Suggestions
**Actor:** Authenticated User  
**Precondition:** User has items in cart  
**Postcondition:** Optimization suggestions are provided

**Main Flow:**
1. System automatically triggers **CartOptimizerKS**
2. CartOptimizerKS analyzes current cart:
   - Checks for bundle opportunities
   - Identifies discount thresholds
   - Looks for category-based deals
3. System generates suggestions:
   - "Add $X more for free shipping"
   - "Buy 1 more electronics item for 20% off"
   - "You're $Y away from bulk discount"
4. System displays suggestions in:
   - Cart sidebar
   - AI assistant panel
   - Checkout page
5. User reviews optimization tips
6. User can click suggestion to view recommended products

**Alternative Flows:**
- **A1:** Cart is already optimized
  - System displays "Your cart is optimized!"
  - System shows current savings

---

### 1.5 CHECKOUT AND ORDER USE CASES

#### UC-12: Proceed to Checkout
**Actor:** Authenticated User  
**Precondition:** Cart has items, all items in stock  
**Postcondition:** User is on checkout page

**Main Flow:**
1. User clicks "Proceed to Checkout" button
2. System validates cart:
   - Checks all items are still in stock
   - Verifies prices haven't changed
3. **InventoryCheckerKS** validates availability
4. System transitions session state to "Checkout"
5. System navigates user to checkout page
6. System displays:
   - Order summary (items, quantities, prices)
   - Subtotal, discount, total
   - Billing information form
   - Payment method section
   - Shipping options
7. System pre-fills user information if available

**Alternative Flows:**
- **A1:** Items out of stock
  - System displays error for each unavailable item
  - System removes out-of-stock items
  - User returns to cart
- **A2:** Price changed
  - System updates cart with new prices
  - System notifies user of changes
  - User reviews updated cart

---

#### UC-13: Complete Order
**Actor:** Authenticated User  
**Precondition:** User is on checkout page, form is valid  
**Postcondition:** Order is placed and saved to database

**Main Flow:**
1. User fills billing information:
   - Full name
   - Email
   - Phone number
   - Shipping address
   - City and postal code
2. User selects shipping method:
   - Standard (free, 5-7 days)
   - Express ($9.99, 2-3 days)
3. User enters payment information:
   - Card number
   - Expiry date
   - CVV
4. User clicks "Place Order" button
5. System validates all form fields
6. System transitions session state to "Complete"
7. **CheckoutState.completeCheckout()** executes:
   - Generates unique orderId (ORD-timestamp-random)
   - Creates Order document with:
     * orderId
     * user (ObjectId reference)
     * items (product details, quantities, prices)
     * billingInfo
     * paymentInfo (masked card number)
     * subtotal, discount, total
     * status: "confirmed"
     * createdAt: current timestamp
8. System saves Order to MongoDB
9. System updates user's purchase history:
   - Adds products to purchaseHistory array
   - Records orderId, productIds, categories
10. System reduces product stock for each item
11. System clears shopping cart
12. System displays order confirmation:
    - Order ID
    - Order summary
    - Estimated delivery date
    - "View Orders" button
13. System sends confirmation (UI notification)

**Alternative Flows:**
- **A1:** Payment fails (simulated)
  - System displays error message
  - User returns to payment step
- **A2:** Validation errors
  - System highlights invalid fields
  - User corrects and resubmits

---

#### UC-14: View Order History
**Actor:** Authenticated User  
**Precondition:** User is logged in  
**Postcondition:** User's orders are displayed

**Main Flow:**
1. User navigates to Orders page
2. System fetches orders from database:
   - Query: `{ user: userId }`
   - Sort: newest first (createdAt DESC)
   - Populate: product details
3. System displays for each order:
   - Order ID
   - Order date
   - Total amount
   - Status (pending/processing/shipped/delivered)
   - Number of items
4. User clicks on order for details
5. System displays complete order information:
   - All items with images
   - Billing and shipping address
   - Payment method
   - Status history
   - Tracking information (if shipped)

**Alternative Flows:**
- **A1:** No orders found
  - System displays "No orders yet"
  - System shows "Start Shopping" button

---

### 1.6 ADMIN USE CASES

#### UC-15: Admin - Manage Products
**Actor:** Administrator  
**Precondition:** Admin is logged in (user.isAdmin = true)  
**Postcondition:** Product is created/updated/deleted

**Main Flow - Add Product:**
1. Admin navigates to Admin Dashboard
2. Admin selects "Products" tab
3. Admin clicks "Add New Product" button
4. System displays product form
5. Admin enters product details:
   - Name
   - Description
   - Price
   - Category
   - Stock quantity
   - Image URL
   - Tags
6. Admin clicks "Save Product"
7. System validates input
8. System creates Product document in MongoDB
9. System broadcasts stock update via Socket.IO
10. System displays success message
11. System refreshes product list

**Main Flow - Update Product:**
1. Admin searches/filters products
2. Admin clicks "Edit" on product
3. System displays product form with current data
4. Admin modifies fields (price, stock, etc.)
5. Admin clicks "Update Product"
6. System validates changes
7. System updates Product document
8. System triggers Blackboard notification
9. System updates any active carts with new data

**Main Flow - Delete Product:**
1. Admin clicks "Delete" on product
2. System displays confirmation dialog
3. Admin confirms deletion
4. System checks if product is in active orders
5. System removes Product from database
6. System removes product from any active carts
7. System displays success message

---

#### UC-16: Admin - View Analytics
**Actor:** Administrator  
**Precondition:** Admin is logged in  
**Postcondition:** Analytics data is displayed

**Main Flow:**
1. Admin navigates to Admin Dashboard
2. Admin clicks "Analytics" tab
3. System fetches analytics data:
   - **Sales Analytics:**
     * Total revenue (sum of delivered orders)
     * Total orders count
     * Average order value
     * Top selling products (by quantity sold)
     * Sales by category
   - **Customer Analytics:**
     * Total customers count
     * Customers with orders
     * Conversion rate (%)
     * Top customers (by total spent)
4. System aggregates data using MongoDB pipelines
5. System displays statistics in cards and charts:
   - Revenue card with total amount
   - Orders card with count
   - Average order value card
   - Top products list with sales figures
   - Category sales breakdown
   - Customer statistics
6. Admin reviews analytics
7. Admin can export data to CSV

**Alternative Flows:**
- **A1:** No data available
  - System displays "No data to display"

---

#### UC-17: Admin - Manage Orders
**Actor:** Administrator  
**Precondition:** Admin is logged in  
**Postcondition:** Order status is updated

**Main Flow:**
1. Admin navigates to "Orders" tab
2. System fetches all orders with user data (populated)
3. System displays orders table:
   - Order ID
   - Customer name
   - Total amount
   - Status
   - Order date
4. Admin searches/filters orders by:
   - Customer name/email
   - Status
   - Date range
5. Admin clicks on order to view details
6. System displays complete order information
7. Admin changes status using dropdown:
   - pending → processing
   - processing → shipped
   - shipped → delivered
8. System updates Order.status
9. System updates Order.updatedAt
10. System notifies customer (simulated)
11. System displays success message

---

#### UC-18: Admin - Manage Users
**Actor:** Administrator  
**Precondition:** Admin is logged in  
**Postcondition:** User information is updated

**Main Flow:**
1. Admin navigates to "Users" tab
2. System fetches all users (excluding passwords)
3. System displays users table:
   - Name
   - Email
   - Student status
   - Registration date
   - Order count
4. Admin searches users by name/email
5. Admin filters by student status
6. Admin clicks "Edit" on user
7. System displays user edit form
8. Admin modifies:
   - Name
   - Email (validates uniqueness)
   - Student status
9. Admin clicks "Update User"
10. System validates changes
11. System updates User document
12. System prevents admin status changes
13. System displays success message

---

#### UC-19: Admin - Monitor Low Stock
**Actor:** Administrator  
**Precondition:** Admin is logged in  
**Postcondition:** Low stock products are identified

**Main Flow:**
1. Admin navigates to "Low Stock" tab
2. System queries products where stock < 10
3. System displays low stock products:
   - Product name
   - Category
   - Current stock level
   - Price
4. System highlights critical items (stock < 5) in red
5. Admin clicks "Restock" on product
6. System opens edit form
7. Admin updates stock quantity
8. System saves changes
9. System removes from low stock if stock ≥ 10

---

## 2. USE CASE DIAGRAM ELEMENTS

### 2.1 ACTORS

#### Primary Actors:
1. **Visitor** (Unauthenticated User)
   - Can view products
   - Can register
   - Can login

2. **Customer** (Authenticated User)
   - Inherits from Visitor
   - Can manage cart
   - Can place orders
   - Can view order history
   - Can get AI recommendations
   - Can manage profile

3. **Administrator**
   - Inherits from Customer
   - Can manage products
   - Can manage orders
   - Can manage users
   - Can view analytics
   - Can monitor inventory

#### Secondary Actors:
4. **AI Shopping Assistant** (System)
   - Provides recommendations
   - Applies business rules
   - Calculates discounts
   - Optimizes cart

5. **Blackboard System** (System)
   - Coordinates knowledge sources
   - Manages shared data
   - Triggers rule evaluations

### 2.2 USE CASES (Organized by Package)

#### Authentication Package:
- UC-01: Register
- UC-02: Login
- UC-03: Logout
- UC-04: Update Profile

#### Product Browsing Package:
- UC-05: Browse Products
- UC-06: Search Products
- UC-07: Filter Products
- UC-08: View Product Details
- UC-09: View Product by Category

#### Shopping Cart Package:
- UC-10: Add to Cart
- UC-11: View Cart
- UC-12: Update Cart Quantity
- UC-13: Remove from Cart
- UC-14: Clear Cart

#### AI Assistant Package:
- UC-15: Get Recommendations
- UC-16: Get Cart Optimization
- UC-17: Apply Discounts
- UC-18: Check Inventory

#### Checkout Package:
- UC-19: Proceed to Checkout
- UC-20: Enter Billing Info
- UC-21: Select Shipping Method
- UC-22: Complete Order
- UC-23: View Order Confirmation

#### Order Management Package:
- UC-24: View Order History
- UC-25: View Order Details
- UC-26: Track Order

#### Admin - Product Management Package:
- UC-27: Create Product
- UC-28: Update Product
- UC-29: Delete Product
- UC-30: View Low Stock Products

#### Admin - Order Management Package:
- UC-31: View All Orders
- UC-32: Update Order Status
- UC-33: View Order Details
- UC-34: Search Orders

#### Admin - User Management Package:
- UC-35: View All Users
- UC-36: Update User Info
- UC-37: Delete User
- UC-38: Search Users

#### Admin - Analytics Package:
- UC-39: View Dashboard Statistics
- UC-40: View Sales Analytics
- UC-41: View Customer Analytics
- UC-42: Export Data to CSV

### 2.3 RELATIONSHIPS

#### Generalization (Inheritance):
- Customer extends Visitor
- Administrator extends Customer

#### Include (Mandatory):
- "Add to Cart" includes "Apply Discounts"
- "Complete Order" includes "Validate Stock"
- "View Product Details" includes "Update Browsing History"
- "Place Order" includes "Create Order Record"
- "Register" includes "Create Session"

#### Extend (Optional):
- "Apply Discounts" extends "Add to Cart"
- "Get Recommendations" extends "Browse Products"
- "Cart Optimization" extends "View Cart"
- "Export CSV" extends "View Analytics"

---

## 3. OBJECT DIAGRAM

### 3.1 SCENARIO: User Completes Order with Discounts

**Timestamp:** January 6, 2026, 10:30 AM  
**Context:** Student user "John Doe" places order for 3 electronics items

### Object Instances:

#### User Object: john_doe
```
john_doe: User {
  _id: ObjectId("677abc123...")
  name: "John Doe"
  email: "john@example.com"
  password: "$2b$10$hashed..." (bcrypt)
  isStudent: true
  isAdmin: false
  preferences: {
    categories: ["electronics", "books"]
    priceRange: { min: 0, max: 500 }
  }
  purchaseHistory: [
    {
      orderId: "ORD-1234567890"
      productId: ObjectId("677abc456...")
      category: "electronics"
      purchaseDate: 2026-01-01
    }
  ]
  createdAt: 2026-01-01T00:00:00Z
}
```

#### Session Object: session_123
```
session_123: ShoppingSession {
  sessionId: "sess-1736154600-xyz"
  userId: ObjectId("677abc123...")
  state: CheckoutState
  cart: shoppingCart_456
  history: [
    { action: "BROWSING", timestamp: "10:15:00" }
    { action: "ITEM_ADDED", timestamp: "10:20:00" }
    { action: "PROCEED_CHECKOUT", timestamp: "10:28:00" }
  ]
  metadata: {
    startTime: 2026-01-06T10:15:00Z
    lastActivity: 2026-01-06T10:30:00Z
    transitions: [
      { from: "Browsing", to: "Cart", timestamp: "10:20:00" }
      { from: "Cart", to: "Checkout", timestamp: "10:28:00" }
    ]
  }
}
```

#### ShoppingCart Object: shoppingCart_456
```
shoppingCart_456: ShoppingCart {
  sessionId: "sess-1736154600-xyz"
  items: [cartItem_1, cartItem_2, cartItem_3]
  subtotal: 900.00
  totalDiscount: 180.00
  total: 720.00
  discounts: [studentDiscount_1, categoryDiscount_1]
}
```

#### CartItem Objects:
```
cartItem_1: CartItem {
  productId: ObjectId("677prod001")
  name: "Wireless Headphones"
  price: 150.00
  quantity: 2
  category: "electronics"
  tags: ["audio", "bluetooth"]
  totalPrice: 300.00
  discountAmount: 60.00
}

cartItem_2: CartItem {
  productId: ObjectId("677prod002")
  name: "Smart Watch"
  price: 400.00
  quantity: 1
  category: "electronics"
  tags: ["wearable", "fitness"]
  totalPrice: 400.00
  discountAmount: 80.00
}

cartItem_3: CartItem {
  productId: ObjectId("677prod003")
  name: "USB-C Cable"
  price: 20.00
  quantity: 10
  category: "electronics"
  tags: ["accessories"]
  totalPrice: 200.00
  discountAmount: 40.00
}
```

#### Discount Objects:
```
studentDiscount_1: PercentageDiscount {
  name: "Student Discount"
  percentage: 15
  condition: UserAttributeExpression {
    attribute: "isStudent"
    operator: "==="
    value: true
  }
  applied: true
  amount: 135.00
}

categoryDiscount_1: CategoryDiscount {
  name: "Electronics Bundle"
  category: "electronics"
  percentage: 20
  minQuantity: 2
  condition: CategoryCondition {
    category: "electronics"
    minItems: 2
  }
  applied: true
  amount: 45.00
}
```

#### Product Objects:
```
product_1: Product {
  _id: ObjectId("677prod001")
  productId: ObjectId("677prod001")
  name: "Wireless Headphones"
  description: "High-quality bluetooth headphones"
  price: 150.00
  category: "electronics"
  stock: 25
  image: "https://example.com/headphones.jpg"
  tags: ["audio", "bluetooth"]
  ratings: 4.5
  createdAt: 2026-01-01T00:00:00Z
}

product_2: Product {
  _id: ObjectId("677prod002")
  productId: ObjectId("677prod002")
  name: "Smart Watch"
  description: "Fitness tracking smart watch"
  price: 400.00
  category: "electronics"
  stock: 15
  image: "https://example.com/watch.jpg"
  tags: ["wearable", "fitness"]
  ratings: 4.8
  createdAt: 2026-01-01T00:00:00Z
}

product_3: Product {
  _id: ObjectId("677prod003")
  productId: ObjectId("677prod003")
  name: "USB-C Cable"
  description: "Fast charging USB-C cable"
  price: 20.00
  category: "electronics"
  stock: 100
  image: "https://example.com/cable.jpg"
  tags: ["accessories"]
  ratings: 4.2
  createdAt: 2026-01-01T00:00:00Z
}
```

#### Order Object: order_789 (After Checkout)
```
order_789: Order {
  _id: ObjectId("677order789")
  orderId: "ORD-1736154600-ABC123"
  user: ObjectId("677abc123...") → john_doe
  userId: "677abc123..."
  sessionId: "sess-1736154600-xyz"
  items: [
    {
      product: ObjectId("677prod001")
      productId: ObjectId("677prod001")
      name: "Wireless Headphones"
      price: 150.00
      quantity: 2
      category: "electronics"
      totalPrice: 300.00
      discountAmount: 60.00
    },
    {
      product: ObjectId("677prod002")
      productId: ObjectId("677prod002")
      name: "Smart Watch"
      price: 400.00
      quantity: 1
      category: "electronics"
      totalPrice: 400.00
      discountAmount: 80.00
    },
    {
      product: ObjectId("677prod003")
      productId: ObjectId("677prod003")
      name: "USB-C Cable"
      price: 20.00
      quantity: 10
      category: "electronics"
      totalPrice: 200.00
      discountAmount: 40.00
    }
  ]
  billingInfo: {
    name: "John Doe"
    email: "john@example.com"
    phone: "+1-234-567-8900"
    address: "123 Main St, Apt 4B"
    city: "New York"
    postalCode: "10001"
  }
  paymentInfo: {
    method: "Credit Card"
    lastFourDigits: "4242"
  }
  subtotal: 900.00
  discount: 180.00
  total: 720.00
  status: "confirmed"
  createdAt: 2026-01-06T10:30:00Z
  updatedAt: 2026-01-06T10:30:00Z
}
```

#### Blackboard Object: blackboard
```
blackboard: Blackboard {
  users: Map {
    "677abc123...": john_doe
  }
  carts: Map {
    "677abc123...": shoppingCart_456
  }
  sessions: Map {
    "sess-1736154600-xyz": session_123
  }
  inventory: Map {
    "677prod001": { stock: 25, available: true }
    "677prod002": { stock: 15, available: true }
    "677prod003": { stock: 100, available: true }
  }
  rules: [studentDiscount_1, categoryDiscount_1]
  recommendations: Map {
    "677abc123...": [product_5, product_7, product_12]
  }
  changeLog: [
    { type: "CART_UPDATED", timestamp: "10:20:00" }
    { type: "RULE_APPLIED", timestamp: "10:21:00" }
    { type: "ORDER_CREATED", timestamp: "10:30:00" }
  ]
}
```

#### Knowledge Source Objects:
```
ruleInterpreterKS: RuleInterpreterKS {
  name: "RuleInterpreter"
  priority: 9 (HIGH)
  enabled: true
  rules: [
    studentDiscountRule,
    categoryDiscountRule,
    bulkDiscountRule
  ]
}

discountCalculatorKS: DiscountCalculatorKS {
  name: "DiscountCalculator"
  priority: 9 (HIGH)
  enabled: true
  appliedDiscounts: [studentDiscount_1, categoryDiscount_1]
  totalCalculated: 180.00
}

inventoryCheckerKS: InventoryCheckerKS {
  name: "InventoryChecker"
  priority: 10 (CRITICAL)
  enabled: true
  stockAlerts: []
}

personalizationEngineKS: PersonalizationEngineKS {
  name: "PersonalizationEngine"
  priority: 5 (MEDIUM)
  enabled: true
  recommendations: [product_5, product_7, product_12]
}

cartOptimizerKS: CartOptimizerKS {
  name: "CartOptimizer"
  priority: 3 (LOW)
  enabled: true
  suggestions: [
    "Your cart is optimized!"
    "Current savings: $180"
  ]
}
```

### 3.2 OBJECT RELATIONSHIPS

#### Associations:
- `john_doe` (User) ←→ `session_123` (ShoppingSession): userId
- `session_123` (ShoppingSession) ←→ `shoppingCart_456` (ShoppingCart): cart
- `shoppingCart_456` (ShoppingCart) ←→ `[cartItem_1, cartItem_2, cartItem_3]` (CartItem): items
- `cartItem_1` (CartItem) ←→ `product_1` (Product): productId
- `order_789` (Order) ←→ `john_doe` (User): user reference
- `blackboard` (Blackboard) ←→ `session_123` (ShoppingSession): sessions map
- `ruleInterpreterKS` (KnowledgeSource) ←→ `blackboard` (Blackboard): observes

#### Aggregation:
- `ShoppingCart` has `CartItem` objects
- `Order` has item objects (embedded)
- `Blackboard` aggregates all system data

#### Composition:
- `Session` owns `Cart` (cart destroyed when session ends)
- `CartItem` owned by `Cart` (cannot exist independently)

#### Dependencies:
- `Order` depends on `Product` (for product details)
- `Discount` depends on `UserAttributeExpression` (for conditions)
- `KnowledgeSource` depends on `Blackboard` (for data access)

---

## 4. SEQUENCE DIAGRAM SCENARIO

### Complete Order Flow (Simplified)

**Participants:**
- User (Actor)
- Vue Frontend
- API Gateway
- Session Service
- Cart Service
- Order Service
- Blackboard
- Knowledge Sources
- MongoDB

**Flow:**
1. User clicks "Place Order"
2. Frontend → API: PUT /session/:id/state { action: "complete", data: {...} }
3. API → Session Service: completeCheckout(sessionId, checkoutData)
4. Session Service → Cart Service: getCart(sessionId)
5. Cart Service → Session Service: returns cart data
6. Session Service → Blackboard: notify checkout
7. Blackboard → Knowledge Sources: execute (RuleInterpreter, InventoryChecker)
8. Knowledge Sources → Blackboard: return results
9. Session Service → Order Service: createOrder(orderData)
10. Order Service → MongoDB: db.orders.insertOne()
11. MongoDB → Order Service: order saved
12. Order Service → User Service: updatePurchaseHistory()
13. User Service → MongoDB: db.users.updateOne()
14. Order Service → Session Service: order created
15. Session Service → API: { success: true, orderId: "..." }
16. API → Frontend: order confirmation
17. Frontend → User: display success message

---

## 5. CLASS DIAGRAM ELEMENTS

### Key Classes:

#### Domain Classes:
- **User**: name, email, password, isStudent, isAdmin, preferences, purchaseHistory
- **Product**: productId, name, description, price, category, stock, image, tags
- **Order**: orderId, user, items[], billingInfo, total, status
- **CartItem**: productId, name, price, quantity, category
- **ShoppingCart**: items[], subtotal, totalDiscount, total

#### Pattern Classes:
- **ShoppingSession** (State Pattern): userId, sessionId, state, cart
- **SessionState** (Abstract): BrowsingState, CartState, CheckoutState
- **Discount** (Composite Pattern): PercentageDiscount, FixedDiscount
- **CartVisitor** (Visitor Pattern): DiscountVisitor, TaxVisitor
- **Condition** (Interpreter Pattern): PriceCondition, CategoryCondition

#### Architecture Classes:
- **Blackboard**: users, carts, sessions, inventory, rules
- **KnowledgeSource**: RuleInterpreterKS, DiscountCalculatorKS, etc.
- **BlackboardController**: orchestrates knowledge sources

---

## 6. ACTIVITY DIAGRAM SCENARIOS

### 6.1 Add Product to Cart Activity

**Start** → User browses products → User selects product → User views details → 
Decision: In stock? → 
  [Yes] → User selects quantity → User clicks "Add to Cart" → 
  System creates CartItem → System adds to Cart → 
  Parallel:
    - Apply business rules
    - Check inventory
    - Calculate discounts
  Join → Update cart totals → Display success → **End**
  [No] → Display "Out of Stock" → **End**

### 6.2 Complete Checkout Activity

**Start** → User in checkout page → User fills billing info → 
User selects shipping → User enters payment → User clicks "Place Order" →
Validate form → 
Decision: Valid? →
  [No] → Display errors → Return to form
  [Yes] → Process payment → Validate stock →
  Decision: Available? →
    [No] → Display stock error → **End**
    [Yes] → Create order → Save to DB →
    Update inventory → Update purchase history →
    Clear cart → Display confirmation → **End**

---

## 7. STATE DIAGRAM

### Shopping Session States

**States:**
1. **Browsing** (Initial State)
2. **Searching**
3. **Cart**
4. **Comparing**
5. **Checkout**
6. **Completed** (Final State)

**Transitions:**
- Browsing → Searching: user searches products
- Searching → Browsing: user clears search
- Browsing → Cart: user adds item to cart
- Cart → Checkout: user proceeds to checkout
- Checkout → Completed: order placed successfully
- Checkout → Cart: user cancels checkout
- Cart → Browsing: user continues shopping
- Any State → Browsing: user starts new session

---

## 8. DEPLOYMENT DIAGRAM

### Components:
- **Client Browser** (Vue.js application)
- **Web Server** (Nginx - port 8080)
- **API Server** (Express.js - port 3000)
- **MongoDB Database** (port 27017)
- **Socket.IO Server** (WebSocket)

### Connections:
- Browser ←HTTP→ Nginx ←HTTP→ Express
- Express ←TCP→ MongoDB
- Browser ←WebSocket→ Socket.IO Server
- Express uses JWT for authentication
- CORS enabled between frontend/backend

---

## SUMMARY

This document provides comprehensive UML documentation including:

✅ **20+ detailed use case narrations** with flows and alternatives
✅ **42 identified use cases** across 9 packages
✅ **Actor definitions** (Visitor, Customer, Admin, AI System)
✅ **Complete object diagram** showing real instances with relationships
✅ **Object interactions** during order completion scenario
✅ **Relationship types** (association, aggregation, composition, dependency)
✅ **Pattern implementations** (State, Composite, Visitor, Interpreter, Blackboard)
✅ **Sequence and activity flows** for key scenarios
✅ **State transitions** for shopping session lifecycle

Use this documentation to create:
- **Use Case Diagrams** in tools like Lucidchart, Draw.io, or Enterprise Architect
- **Object Diagrams** showing runtime instances and their relationships
- **Class Diagrams** from the identified domain and pattern classes
- **Sequence Diagrams** for detailed interaction flows
- **Activity Diagrams** for complex business processes

# Pick & Play Guitar Shop

A full-featured guitar e-commerce website with user and admin functionality.

## Technology Stack

- **Frontend**: React with React Router and Bootstrap
- **Backend**: Spring Boot (Java)
- **Database**: MySQL

## Features

### Customer Features
- Browse guitars by category
- Search and filter products
- View detailed product information
- Add products to cart
- Register and login
- Checkout process
- View order history

### Admin Features
- Dashboard with sales analytics
- Product management (add, edit, delete)
- Order management
- User management
- Inventory control

## Project Structure

```
src/
 ├── components/
 │    ├── Navbar.jsx - Navigation bar with cart status
 │    ├── Footer.jsx - Site footer
 │    ├── ProductCard.jsx - Reusable product card component
 │    └── ProtectedRoute.jsx - Route protection for admin pages
 ├── pages/
 │    ├── Home.jsx - Landing page with featured products
 │    ├── Shop.jsx - Product listing with filters
 │    ├── ProductDetails.jsx - Detailed product view
 │    ├── Cart.jsx - Shopping cart management
 │    ├── Login.jsx - User authentication
 │    ├── Register.jsx - New user registration
 │    ├── Admin/
 │    │    ├── Dashboard.jsx - Admin overview
 │    │    ├── ProductList.jsx - Product management
 │    │    ├── AddProduct.jsx - Add new products
 │    │    ├── EditProduct.jsx - Edit existing products
 │    │    ├── Orders.jsx - Order management
 │    │    └── Users.jsx - User management
 ├── services/
 │    └── api.js - Axios configuration and API services
 ├── App.jsx - Main app with routes
 └── main.jsx - Application entry point
```

## Next Steps

### Backend Development
1. Set up Spring Boot project
2. Create entity models (Product, User, Order)
3. Implement repositories
4. Create REST controllers
5. Implement security with JWT

### Database Setup
1. Set up MySQL database
2. Create tables for products, users, orders
3. Configure Spring Boot to connect to the database

### Deployment
1. Set up CI/CD pipeline
2. Deploy frontend to a static hosting service
3. Deploy backend to a cloud provider
4. Configure database hosting

## Running the Application

1. Install dependencies:
```
npm install
```

2. Start development server:
```
npm run dev
```

3. Build for production:
```
npm run build
```

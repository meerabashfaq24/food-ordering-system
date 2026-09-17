import { Link, Route, Routes } from "react-router-dom";
import RestaurantDetails from "./pages/RestaurantDetails";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Restaurants from "./pages/Restaurants";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import RestaurantOrders from "./pages/RestaurantOrders";
import OrderStatus from "./pages/OrderStatus";
import Profile from "./pages/Profile";
import ManageMenu from "./pages/ManageMenu";
import ManageRestaurant from "./pages/ManageRestaurant";


function App() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="brand">
            Food<span>Order</span>
          </Link>

          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/restaurants">Restaurants</Link>

            {token ? (
              <>
                <Link to="/cart">Cart</Link>
                <Link to="/orders">My Orders</Link>
                <Link to="/profile">Profile</Link>

                {user && (
                  <Link to="/manage-restaurant">
                    Manage Restaurant
                  </Link>
                )}
                <Link to="/manage-menu">
  Manage Menu
</Link>
<Link to="/restaurant-orders">
  Restaurant Orders
</Link>

                {user && (
                  <button
                    type="button"
                    className="logout-button"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                )}
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>

                <Link
                  to="/register"
                  className="nav-register"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        <Routes>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/products"
            element={<Products />}
          />

          <Route
            path="/restaurants"
            element={<Restaurants />}
          />

          <Route
            path="/restaurants/:id"
            element={<RestaurantDetails />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/cart"
            element={<Cart />}
          />

          <Route
            path="/checkout"
            element={<Checkout />}
          />

          <Route
            path="/orders"
            element={<Orders />}
          />
          <Route
  path="/orders/:id"
  element={<OrderStatus />}
/>

          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/manage-restaurant"
            element={<ManageRestaurant />}

            
          />
          <Route
  path="/manage-menu"
  element={<ManageMenu />}
/>
<Route
  path="/restaurant-orders"
  element={<RestaurantOrders />}
/>
        </Routes>
      </main>

      <footer className="footer">
        <p>
          © 2026 FoodOrder. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default App;
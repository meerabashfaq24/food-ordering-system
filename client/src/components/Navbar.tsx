import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();


  const handleLogout = () => {
  logout();
  navigate("/");
};

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        padding: "18px 30px",
        borderBottom: "1px solid #e5e7eb",
        background: "#ffffff",
      }}
    >
      <Link
        to="/"
        style={{
          fontSize: "22px",
          fontWeight: 800,
          textDecoration: "none",
          color: "#111827",
        }}
      >
        FoodOrder 🍔
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <Link to="/">Home</Link>

        <Link to="/products">Products</Link>

        {user && (
          <>
            <Link to="/cart">Cart</Link>
            <Link to="/orders">My Orders</Link>
            <Link to="/profile">Profile</Link>
          </>
        )}

        {user?.role === "admin" && (
          <Link to="/admin">Admin Dashboard</Link>
        )}

        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            style={{
              border: "none",
              background: "#111827",
              color: "#ffffff",
              padding: "9px 15px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

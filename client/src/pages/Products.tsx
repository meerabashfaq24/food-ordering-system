import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

interface Category {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: Category | string;
  stock: number;
  isAvailable: boolean;
}

function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [addingId, setAddingId] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${API_URL}/products`
        );

        if (response.data.success) {
          setProducts(response.data.data);
        } else {
          setError(
            response.data.message ||
              "Failed to load products."
          );
        }
      } catch (err) {
        console.error("Products error:", err);

        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
              "Failed to load products."
          );
        } else {
          setError("Failed to load products.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const addToCart = async (productId: string) => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setAddingId(productId);

      const response = await axios.post(
        `${API_URL}/cart/items`,
        {
          productId,
          quantity: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.success) {
        alert(
          response.data.message ||
            "Unable to add product."
        );
        return;
      }

      alert("Product added to cart.");
    } catch (err) {
      console.error("Add to cart error:", err);

      if (axios.isAxiosError(err)) {
        alert(
          err.response?.data?.message ||
            "Unable to add product."
        );
      } else {
        alert("Unable to add product.");
      }
    } finally {
      setAddingId("");
    }
  };

  if (loading) {
    return (
      <div className="page">
        <h1 className="page-title">
          Products
        </h1>

        <p className="page-subtitle">
          Loading products...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h1 className="page-title">
          Products
        </h1>

        <div className="form-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">
        Our Menu
      </h1>

      <p className="page-subtitle">
        Choose from our delicious selection.
      </p>

      {products.length === 0 ? (
        <div className="empty-state">
          <h2>No products available</h2>
          <p>
            Check back later for delicious new
            meals.
          </p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <article
              className="product-card"
              key={product._id}
            >
              {product.image ? (
                <img
                  className="product-image"
                  src={product.image}
                  alt={product.name}
                />
              ) : (
                <div
                  className="product-image"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "60px",
                  }}
                >
                  🍔
                </div>
              )}

              <div className="product-content">
                <h2 className="product-name">
                  {product.name}
                </h2>

                <p className="product-description">
                  {product.description}
                </p>

                <div className="product-bottom">
                  <span className="product-price">
                    ${product.price.toFixed(2)}
                  </span>

                  {product.stock > 0 &&
                  product.isAvailable ? (
                    <button
                      className="button button-primary"
                      type="button"
                      disabled={
                        addingId === product._id
                      }
                      onClick={() =>
                        addToCart(product._id)
                      }
                    >
                      {addingId === product._id
                        ? "Adding..."
                        : "Add to Cart"}
                    </button>
                  ) : (
                    <span
                      style={{
                        color: "#dc2626",
                        fontWeight: 700,
                      }}
                    >
                      Out of stock
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div style={{ marginTop: "30px" }}>
        <Link
          to="/cart"
          className="button button-secondary"
        >
          View Cart
        </Link>
      </div>
    </div>
  );
}

export default Products;

import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../types";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

interface Props {
  product: Product;
  onCartChange?: () => void;
}

export default function ProductCard({
  product,
  onCartChange,
}: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const addToCart = async () => {
  if (!user) {
    navigate("/login");
    return;
  }

  try {
    await api.post("/cart/items", {
      productId: product._id,
      quantity: 1,
    });

    alert("Added to cart!");
    onCartChange?.();
  } catch (error) {
    console.error("Failed to add item to cart:", error);
  }
};
  return (
    <article className="product-card">
      <div
        className="product-image"
        onClick={() => navigate(`/products/${product._id}`)}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
          />
        ) : (
          <div className="image-placeholder">
            🍔
          </div>
        )}
      </div>

      <div className="product-info">
        <h3>{product.name}</h3>

        <p className="product-description">
          {product.description}
        </p>

        <div className="product-bottom">
          <strong>
            ${product.price.toFixed(2)}
          </strong>

          <button
            type="button"
            className="cart-button"
            onClick={addToCart}
            disabled={
              !product.isAvailable ||
              product.stock <= 0
            }
          >
            <ShoppingCart size={17} />

            {product.stock <= 0
              ? "Sold out"
              : "Add"}
          </button>
        </div>
      </div>
    </article>
  );
}

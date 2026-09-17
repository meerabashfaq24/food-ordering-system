import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../api/cartApi";

import type { Cart as CartType } from "../types";

function Cart() {
  const navigate = useNavigate();

  const [cart, setCart] =
    useState<CartType | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const token =
    localStorage.getItem("token");

  const fetchCart = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await getCart(token);

      if (
        response.success &&
        response.data
      ) {
        setCart(response.data);
      } else {
        setError(
          response.message ||
            "Failed to load your cart."
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch cart:",
        error
      );

      setError(
        "Failed to load your cart."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (
    productId: string,
    quantity: number
  ) => {
    if (!token || quantity < 1) {
      return;
    }

    try {
      setError("");

      const response =
        await updateCartItem(
          productId,
          quantity,
          token
        );

      if (
        response.success &&
        response.data
      ) {
        setCart(response.data);
      } else {
        setError(
          response.message ||
            "Failed to update cart."
        );
      }
    } catch (error) {
      console.error(
        "Failed to update cart:",
        error
      );

      setError(
        "Failed to update cart."
      );
    }
  };

  const handleRemoveItem = async (
    productId: string
  ) => {
    if (!token) return;

    try {
      setError("");

      const response =
        await removeCartItem(
          productId,
          token
        );

      if (
        response.success &&
        response.data
      ) {
        setCart(response.data);
      } else {
        setError(
          response.message ||
            "Failed to remove item."
        );
      }
    } catch (error) {
      console.error(
        "Failed to remove item:",
        error
      );

      setError(
        "Failed to remove item."
      );
    }
  };

  const handleClearCart = async () => {
    if (!token) return;

    try {
      setError("");

      const response =
        await clearCart(token);

      if (
        response.success &&
        response.data
      ) {
        setCart(response.data);
      } else {
        setError(
          response.message ||
            "Failed to clear cart."
        );
      }
    } catch (error) {
      console.error(
        "Failed to clear cart:",
        error
      );

      setError(
        "Failed to clear cart."
      );
    }
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="cart-loading">
            <div className="loading-spinner" />
            <p>
              Loading your basket...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (
    !cart ||
    cart.items.length === 0
  ) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="cart-empty">
            <div className="cart-empty-icon">
              🛒
            </div>

            <p className="section-label">
              YOUR BASKET
            </p>

            <h1>
              Your basket is empty
            </h1>

            <p>
              Looks like you haven't
              added anything yet.
              Browse our restaurants
              and find something
              delicious.
            </p>

            <Link
              to="/restaurants"
              className="primary-button"
            >
              Browse Restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal =
    cart.items.reduce(
      (sum, item) =>
        sum +
        item.product.price *
          item.quantity,
      0
    );

  return (
    <div className="cart-page">
      <div className="cart-container">
        <Link
          to="/restaurants"
          className="restaurant-back-link"
        >
          ← Continue shopping
        </Link>

        <div className="cart-heading">
          <div>
            <p className="section-label">
              YOUR ORDER
            </p>

            <h1>
              Your basket
            </h1>

            <p>
              Review your items before
              checkout.
            </p>
          </div>

          <button
            type="button"
            className="clear-cart-button"
            onClick={handleClearCart}
          >
            Clear basket
          </button>
        </div>

        {error && (
          <div className="restaurant-alert">
            {error}
          </div>
        )}

        <div className="cart-layout">
          <main className="cart-items">
            {cart.items.map((item) => (
              <article
                className="cart-item-card"
                key={
                  item.product._id
                }
              >
                <div className="cart-item-image">
                  {item.product.image ? (
                    <img
                      src={
                        item.product.image
                      }
                      alt={
                        item.product.name
                      }
                    />
                  ) : (
                    <div className="menu-image-placeholder">
                      <span>
                        {item.product.name.charAt(
                          0
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="cart-item-content">
                  <h2>
                    {item.product.name}
                  </h2>

                  <p>
                    {
                      item.product
                        .description
                    }
                  </p>

                  <strong>
                    $
                    {item.product.price.toFixed(
                      2
                    )}
                  </strong>
                </div>

                <div className="cart-item-actions">
                  <div className="quantity-control">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateQuantity(
                          item.product
                            ._id,
                          item.quantity -
                            1
                        )
                      }
                      disabled={
                        item.quantity <=
                        1
                      }
                    >
                      −
                    </button>

                    <span>
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateQuantity(
                          item.product
                            ._id,
                          item.quantity +
                            1
                        )
                      }
                    >
                      +
                    </button>
                  </div>

                  <strong className="cart-item-subtotal">
                    $
                    {(
                      item.product.price *
                      item.quantity
                    ).toFixed(2)}
                  </strong>

                  <button
                    type="button"
                    className="remove-item-button"
                    onClick={() =>
                      handleRemoveItem(
                        item.product
                          ._id
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </main>

          <aside className="cart-summary-card">
            <p className="section-label">
              SUMMARY
            </p>

            <h2>
              Order summary
            </h2>

            <div className="cart-summary-row">
              <span>
                Items
              </span>

              <span>
                {cart.items.reduce(
                  (sum, item) =>
                    sum +
                    item.quantity,
                  0
                )}
              </span>
            </div>

            <div className="cart-summary-row">
              <span>
                Subtotal
              </span>

              <strong>
                $
                {subtotal.toFixed(2)}
              </strong>
            </div>

            <div className="cart-summary-row">
              <span>
                Delivery
              </span>

              <span>
                Calculated at checkout
              </span>
            </div>

            <div className="cart-summary-total">
              <span>
                Total
              </span>

              <strong>
                $
                {subtotal.toFixed(2)}
              </strong>
            </div>

            <button
              type="button"
              className="checkout-button"
              onClick={() =>
                navigate(
                  "/checkout"
                )
              }
            >
              Proceed to checkout
              <span>→</span>
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Cart;
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";
import type { Order } from "../types";

function getStatusClass(status: Order["status"]): string {
  return `status-${status
    .toLowerCase()
    .replaceAll(" ", "-")}`;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const loadOrders = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        }

        const response =
          await api.get<{
            success: boolean;
            message: string;
            data: Order[];
          }>("/orders/my-orders");

        setOrders(response.data.data || []);
      } catch (error) {
        console.error("Failed to load orders:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (location.state?.success) {
      window.history.replaceState(
        {},
        document.title
      );
    }
  }, [location.state]);

  if (loading) {
    return (
      <main className="page">
        <div className="loading-screen">
          Loading orders...
        </div>
      </main>
    );
  }

  return (
    <main className="page orders-page">
      <section className="page-heading orders-heading">
        <div>
          <span className="eyebrow">
            Your history
          </span>

          <h1>My Orders</h1>

          <p>
            View your previous orders and track
            your current deliveries.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => loadOrders(true)}
          disabled={refreshing}
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh orders"}
        </button>
      </section>

      {location.state?.success && (
        <div className="success-message">
          {location.state.success}
        </div>
      )}

      {location.search.includes("payment=cancelled") && (
        <div className="error-message">
          Payment was cancelled. Your cart has not
          been turned into an order.
        </div>
      )}

      {orders.length === 0 ? (
        <div className="empty-state">
          <h2>No orders yet</h2>

          <p>
            Your delicious journey starts with
            your first order.
          </p>

          <Link
            to="/restaurants"
            className="primary-button"
          >
            Browse Restaurants
          </Link>
        </div>
      ) : (
        <section className="orders-list">
          {orders.map((order) => (
            <article
              className="order-card"
              key={order._id}
            >
              <div className="order-header">
                <div>
                  <span className="order-id">
                    Order #
                    {order._id.slice(-6).toUpperCase()}
                  </span>

                  <p>
                    {new Date(
                      order.createdAt
                    ).toLocaleDateString()}
                  </p>
                </div>

                <span
                  className={`status ${getStatusClass(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="order-products">
                {order.products.map(
                  (product, index) => (
                    <div
                      className="order-product"
                      key={`${order._id}-${index}`}
                    >
                      <div>
                        <span>
                          {product.name}
                        </span>

                        <small>
                          Quantity:{" "}
                          {product.quantity}
                        </small>
                      </div>

                      <strong>
                        $
                        {(
                          product.price *
                          product.quantity
                        ).toFixed(2)}
                      </strong>
                    </div>
                  )
                )}
              </div>

              <div className="order-footer">
                <div>
                  <span>
                    Delivered to
                  </span>

                  <strong>
                    {order.address}
                  </strong>
                </div>

                <strong>
                  ${order.totalPrice.toFixed(2)}
                </strong>
              </div>

              <div className="order-card-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    navigate(
                      `/orders/${order._id}`
                    )
                  }
                >
                  Track Order
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
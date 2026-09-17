import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  getRestaurantOrders,
  updateOrderStatus,
} from "../api/orderApi";
import type { Order, OrderStatus } from "../types";

const statusOptions: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

function getStatusClass(status: OrderStatus): string {
  return `status-${status.toLowerCase().replaceAll(" ", "-")}`;
}

function getNextStatus(status: OrderStatus): OrderStatus | null {
  switch (status) {
    case "Pending":
      return "Confirmed";
    case "Confirmed":
      return "Preparing";
    case "Preparing":
      return "Out for Delivery";
    case "Out for Delivery":
      return "Delivered";
    default:
      return null;
  }
}

export default function RestaurantOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(
    null
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  const loadOrders = useCallback(
    async (showRefreshing = false) => {
      if (!token) {
        setError("Please log in first.");
        setLoading(false);
        return;
      }

      try {
        if (showRefreshing) {
          setRefreshing(true);
        }

        setError("");

        const response = await getRestaurantOrders(token);

        setOrders(response.data || []);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ??
              "Failed to load restaurant orders."
          );
        } else {
          setError("Failed to load restaurant orders.");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleStatusUpdate = async (
    orderId: string,
    status: OrderStatus
  ) => {
    if (!token) {
      setError("Please log in first.");
      return;
    }

    try {
      setUpdatingOrder(orderId);
      setError("");
      setMessage("");

      const response = await updateOrderStatus(
        orderId,
        status,
        token
      );

      setOrders((previous) =>
        previous.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status: response.data.status,
              }
            : order
        )
      );

      setMessage(
        `Order #${orderId
          .slice(-6)
          .toUpperCase()} updated to ${status}.`
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ??
            "Failed to update order status."
        );
      } else {
        setError("Failed to update order status.");
      }
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleQuickUpdate = async (order: Order) => {
    const nextStatus = getNextStatus(order.status);

    if (!nextStatus) {
      return;
    }

    await handleStatusUpdate(order._id, nextStatus);
  };

  if (loading) {
    return (
      <main className="page">
        <div className="loading-screen">
          Loading restaurant orders...
        </div>
      </main>
    );
  }

  return (
    <main className="page restaurant-orders-page">
      <section className="page-heading restaurant-orders-heading">
        <div>
          <span className="eyebrow">RESTAURANT OWNER</span>

          <h1>Restaurant Orders</h1>

          <p>
            Manage incoming orders and keep customers updated
            throughout the delivery process.
          </p>
        </div>

        <div className="restaurant-orders-summary">
          <strong>{orders.length}</strong>
          <span>
            {orders.length === 1
              ? "Order"
              : "Orders"}
          </span>
        </div>
      </section>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {message && (
        <div className="success-message">
          ✓ {message}
        </div>
      )}

      <section className="restaurant-orders-toolbar">
        <div>
          <span className="eyebrow">ORDER MANAGEMENT</span>
          <h2>Incoming Orders</h2>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => void loadOrders(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh orders"}
        </button>
      </section>

      {orders.length === 0 ? (
        <section className="restaurant-orders-empty">
          <div className="restaurant-orders-empty-icon">
            🧾
          </div>

          <h2>No orders yet</h2>

          <p>
            Orders containing items from your restaurant will
            appear here.
          </p>
        </section>
      ) : (
        <section className="restaurant-orders-list">
          {orders.map((order) => {
            const nextStatus = getNextStatus(order.status);
            const isUpdating =
              updatingOrder === order._id;

            return (
              <article
                className="restaurant-order-card"
                key={order._id}
              >
                <div className="restaurant-order-header">
                  <div>
                    <span className="order-id">
                      Order #
                      {order._id
                        .slice(-6)
                        .toUpperCase()}
                    </span>

                    <p>
                      {new Date(
                        order.createdAt
                      ).toLocaleString()}
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

                <div className="restaurant-order-content">
                  <div className="restaurant-order-items">
                    <h3>Order items</h3>

                    {order.products.map(
                      (product, index) => (
                        <div
                          className="restaurant-order-item"
                          key={`${order._id}-${index}`}
                        >
                          <div>
                            <strong>
                              {product.name}
                            </strong>

                            <span>
                              Quantity:{" "}
                              {product.quantity}
                            </span>
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

                  <div className="restaurant-order-details">
                    <h3>Customer details</h3>

                    <div className="restaurant-order-detail">
                      <span>Delivery address</span>
                      <strong>
                        {order.address}
                      </strong>
                    </div>

                    <div className="restaurant-order-detail">
                      <span>Phone</span>
                      <strong>
                        {order.phone}
                      </strong>
                    </div>

                    <div className="restaurant-order-detail">
                      <span>Payment</span>
                      <strong>
                        {order.paymentStatus}
                      </strong>
                    </div>

                    <div className="restaurant-order-total">
                      <span>Total</span>
                      <strong>
                        $
                        {order.totalPrice.toFixed(
                          2
                        )}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="restaurant-order-footer">
                  <div>
                    <span>Update order status</span>

                    <select
                      value={order.status}
                      onChange={(event) =>
                        void handleStatusUpdate(
                          order._id,
                          event.target
                            .value as OrderStatus
                        )
                      }
                      disabled={isUpdating}
                    >
                      {statusOptions.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {nextStatus && (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() =>
                        void handleQuickUpdate(
                          order
                        )
                      }
                      disabled={isUpdating}
                    >
                      {isUpdating
                        ? "Updating..."
                        : `Mark as ${nextStatus}`}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/api";
import type { Order, OrderStatus } from "../types";

const statuses: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
];

function getStatusIndex(
  status: OrderStatus
): number {
  return statuses.indexOf(status);
}

function getStatusDescription(
  status: OrderStatus
): string {
  switch (status) {
    case "Pending":
      return "Your order has been received and is waiting for confirmation.";

    case "Confirmed":
      return "Your order has been confirmed by the restaurant.";

    case "Preparing":
      return "The restaurant is preparing your food.";

    case "Out for Delivery":
      return "Your order is on its way to you.";

    case "Delivered":
      return "Your order has been delivered. Enjoy your meal!";

    case "Cancelled":
      return "This order has been cancelled.";

    default:
      return "Your order status is being updated.";
  }
}

function OrderStatusPage() {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      const response =
        await api.get<{
          success: boolean;
          message: string;
          data: Order[];
        }>("/orders/my-orders");

      const foundOrder =
        response.data.data.find(
          (item) => item._id === id
        );

      setOrder(foundOrder || null);
    } catch (error) {
      console.error(
        "Failed to load order:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();

    const interval = window.setInterval(
      loadOrder,
      5000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [loadOrder]);

  if (loading) {
    return (
      <main className="page">
        <div className="loading-screen">
          Loading order...
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="page">
        <div className="empty-state">
          <h2>Order not found</h2>

          <p>
            We couldn't find this order.
          </p>

          <Link
            to="/orders"
            className="primary-button"
          >
            Back to My Orders
          </Link>
        </div>
      </main>
    );
  }

  const currentIndex =
    getStatusIndex(order.status);

  const isCancelled =
    order.status === "Cancelled";

  return (
    <main className="page order-status-page">
      <Link
        to="/orders"
        className="back-link"
      >
        ← Back to My Orders
      </Link>

      <section className="order-status-header">
        <div>
          <span className="eyebrow">
            Order tracking
          </span>

          <h1>
            Order #
            {order._id
              .slice(-6)
              .toUpperCase()}
          </h1>

          <p>
            Placed{" "}
            {new Date(
              order.createdAt
            ).toLocaleString()}
          </p>
        </div>

        <div
          className={`status ${isCancelled
            ? "status-cancelled"
            : `status-${order.status
                .toLowerCase()
                .replaceAll(" ", "-")}`
          }`}
        >
          {order.status}
        </div>
      </section>

      <section className="tracking-card">
        <div className="tracking-card-header">
          <div>
            <span className="eyebrow">
              Live updates
            </span>

            <h2>
              {order.status}
            </h2>

            <p>
              {getStatusDescription(
                order.status
              )}
            </p>
          </div>

          {!isCancelled && (
            <span className="tracking-live">
              ● Live
            </span>
          )}
        </div>

        {!isCancelled && (
          <div className="tracking-timeline">
            {statuses.map(
              (status, index) => {
                const completed =
                  index <= currentIndex;

                const active =
                  index === currentIndex;

                return (
                  <div
                    className={`tracking-step ${
                      completed
                        ? "completed"
                        : ""
                    } ${
                      active
                        ? "active"
                        : ""
                    }`}
                    key={status}
                  >
                    <div className="tracking-icon">
                      {completed
                        ? "✓"
                        : index + 1}
                    </div>

                    <div>
                      <strong>
                        {status}
                      </strong>

                      {active && (
                        <p>
                          Current status
                        </p>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

        {isCancelled && (
          <div className="cancelled-order">
            This order has been cancelled.
          </div>
        )}
      </section>

      <section className="order-status-grid">
        <div className="tracking-details-card">
          <h2>Delivery details</h2>

          <div className="detail-row">
            <span>Address</span>
            <strong>{order.address}</strong>
          </div>

          <div className="detail-row">
            <span>Phone</span>
            <strong>{order.phone}</strong>
          </div>
        </div>

        <div className="tracking-details-card">
          <h2>Payment</h2>

          <div className="detail-row">
            <span>Status</span>

            <strong className="payment-paid">
              {order.paymentStatus}
            </strong>
          </div>

          <div className="detail-row">
            <span>Total</span>

            <strong>
              ${order.totalPrice.toFixed(2)}
            </strong>
          </div>
        </div>
      </section>

      <section className="tracking-details-card">
        <h2>Order items</h2>

        <div className="tracking-products">
          {order.products.map(
            (product, index) => (
              <div
                className="tracking-product"
                key={`${product.name}-${index}`}
              >
                <div>
                  <strong>
                    {product.name}
                  </strong>

                  <span>
                    × {product.quantity}
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
      </section>
    </main>
  );
}

export default OrderStatusPage;
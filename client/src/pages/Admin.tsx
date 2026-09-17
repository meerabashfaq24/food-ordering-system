import { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

interface AdminOrder {
  _id: string;
  user:
    | {
        _id: string;
        name: string;
        email: string;
      }
    | string;
  products: {
    product:
      | {
          _id: string;
          name: string;
          image?: string;
        }
      | string;
    name: string;
    quantity: number;
    price: number;
  }[];
  totalPrice: number;
  address: string;
  phone: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

const statuses = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

export default function Admin() {
  const { user } = useAuth();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders");

      setOrders(response.data.data || []);
    } catch (err: any) {
      console.error("Admin orders error:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load admin orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const updateStatus = async (
    orderId: string,
    status: string
  ) => {
    try {
      setError("");

      const response = await api.put(
        `/orders/${orderId}/status`,
        { status }
      );

      const updatedOrder = response.data.data;

      setOrders((current) =>
        current.map((order) =>
          order._id === orderId
            ? { ...order, status: updatedOrder.status }
            : order
        )
      );
    } catch (err: any) {
      console.error("Update status error:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to update order status."
      );
    }
  };

  if (!user) {
    return (
      <main className="page">
        <h1>Admin Dashboard</h1>
        <p>Please login as an administrator.</p>
      </main>
    );
  }

  if (user.role !== "admin") {
    return (
      <main className="page">
        <h1>Access Denied</h1>
        <p>
          You must have administrator privileges to view
          this page.
        </p>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            Management
          </span>
          <h1>Admin Dashboard</h1>
          <p>
            Manage customer orders and update their
            delivery status.
          </p>
        </div>
      </section>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-screen">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h2>No orders yet</h2>
          <p>
            Customer orders will appear here once they
            are placed.
          </p>
        </div>
      ) : (
        <section
          style={{
            display: "grid",
            gap: "20px",
          }}
        >
          {orders.map((order) => {
            const customer =
              typeof order.user === "object"
                ? order.user
                : null;

            return (
              <article
                key={order._id}
                className="card"
                style={{
                  padding: "22px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "20px",
                    flexWrap: "wrap",
                    marginBottom: "15px",
                  }}
                >
                  <div>
                    <strong>
                      Order #{order._id.slice(-6)}
                    </strong>

                    <p>
                      {customer
                        ? `${customer.name} (${customer.email})`
                        : "Customer"}
                    </p>
                  </div>

                  <strong>
                    ${order.totalPrice.toFixed(2)}
                  </strong>
                </div>

                <div
                  style={{
                    marginBottom: "15px",
                  }}
                >
                  {order.products.map(
                    (product, index) => (
                      <div
                        key={`${order._id}-${index}`}
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          padding: "6px 0",
                        }}
                      >
                        <span>
                          {product.name} ×{" "}
                          {product.quantity}
                        </span>

                        <span>
                          $
                          {(
                            product.price *
                            product.quantity
                          ).toFixed(2)}
                        </span>
                      </div>
                    )
                  )}
                </div>

                <div
                  style={{
                    borderTop:
                      "1px solid #e5e7eb",
                    paddingTop: "15px",
                    marginBottom: "15px",
                  }}
                >
                  <p>
                    <strong>Address:</strong>{" "}
                    {order.address}
                  </p>

                  <p>
                    <strong>Phone:</strong>{" "}
                    {order.phone}
                  </p>

                  <p>
                    <strong>Payment:</strong>{" "}
                    {order.paymentStatus}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <label
                    htmlFor={`status-${order._id}`}
                  >
                    Status:
                  </label>

                  <select
                    id={`status-${order._id}`}
                    value={order.status}
                    onChange={(event) =>
                      updateStatus(
                        order._id,
                        event.target.value
                      )
                    }
                    style={{
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border:
                        "1px solid #d1d5db",
                    }}
                  >
                    {statuses.map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

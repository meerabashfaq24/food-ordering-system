import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

interface CheckoutResponse {
  success: boolean;
  message: string;
  data?: {
    url: string | null;
  };
}

interface StoredUser {
  name?: string;
  email?: string;
}

function Checkout() {
  const navigate = useNavigate();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const [showConfirmation, setShowConfirmation] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const storedUser =
      localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as StoredUser);
      } catch {
        setUser(null);
      }
    }

    const savedAddress =
      localStorage.getItem("deliveryAddress");

    const savedPhone =
      localStorage.getItem("deliveryPhone");

    if (savedAddress) {
      setAddress(savedAddress);
    }

    if (savedPhone) {
      setPhone(savedPhone);
    }
  }, [navigate, token]);

  const handleContinue = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!address.trim() || !phone.trim()) {
      setError(
        "Please enter your delivery address and phone number."
      );
      return;
    }

    setError("");
    setShowConfirmation(true);
  };

  const handlePayment = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      localStorage.setItem(
        "deliveryAddress",
        address.trim()
      );

      localStorage.setItem(
        "deliveryPhone",
        phone.trim()
      );

      const response =
        await axios.post<CheckoutResponse>(
          `${API_URL}/orders/create-checkout-session`,
          {
            address: address.trim(),
            phone: phone.trim(),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      if (
        response.data.success &&
        response.data.data?.url
      ) {
        window.location.href =
          response.data.data.url;
        return;
      }

      setError(
        response.data.message ||
          "Failed to start payment."
      );

      setShowConfirmation(false);
    } catch (error) {
      console.error("Checkout error:", error);

      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.message ||
            "Failed to start payment."
        );
      } else {
        setError("Failed to start payment.");
      }

      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page checkout-page">
      <section className="checkout-header">
        <span className="eyebrow">
          Almost there
        </span>

        <h1>Checkout</h1>

        <p>
          Confirm your delivery details before
          completing your order.
        </p>
      </section>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="checkout-layout">
        <section className="checkout-card">
          <div className="checkout-card-header">
            <h2>Delivery details</h2>
            <span>1 of 2</span>
          </div>

          {user && (
            <div className="checkout-account">
              <div className="checkout-account-avatar">
                {(user.name?.charAt(0) || "U").toUpperCase()}
              </div>

              <div>
                <strong>
                  {user.name || "Customer"}
                </strong>

                <p>
                  {user.email || ""}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleContinue}>
            <div className="form-group">
              <label htmlFor="address">
                Delivery Address
              </label>

              <textarea
                id="address"
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                placeholder="Enter your full delivery address"
                rows={4}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                Phone Number
              </label>

              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="03001234567"
                required
              />
            </div>

            <button
              type="submit"
              className="primary-button checkout-button"
            >
              Review Delivery Details
            </button>
          </form>
        </section>

        <aside className="checkout-info-card">
          <h3>Secure checkout</h3>

          <div className="checkout-info-item">
            <span>✓</span>
            <p>Secure Stripe payment</p>
          </div>

          <div className="checkout-info-item">
            <span>✓</span>
            <p>Your payment details are protected</p>
          </div>

          <div className="checkout-info-item">
            <span>✓</span>
            <p>Track your order after payment</p>
          </div>
        </aside>
      </div>

      {showConfirmation && (
        <div
          className="modal-overlay"
          onClick={() =>
            !loading && setShowConfirmation(false)
          }
        >
          <div
            className="confirmation-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="modal-close"
              onClick={() =>
                !loading &&
                setShowConfirmation(false)
              }
              aria-label="Close"
              disabled={loading}
            >
              ×
            </button>

            <span className="eyebrow">
              Confirm your order
            </span>

            <h2>Delivery information</h2>

            <div className="confirmation-user">
              <strong>
                {user?.name || "Customer"}
              </strong>

              <span>
                {user?.email || ""}
              </span>
            </div>

            <div className="confirmation-detail">
              <span>Delivery address</span>
              <strong>{address}</strong>
            </div>

            <div className="confirmation-detail">
              <span>Phone number</span>
              <strong>{phone}</strong>
            </div>

            <div className="confirmation-payment">
              <div>
                <span>Payment</span>
                <strong>Stripe</strong>
              </div>

              <div>
                <span>Next step</span>
                <strong>Secure payment</strong>
              </div>
            </div>

            <button
              type="button"
              className="primary-button confirmation-button"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading
                ? "Redirecting to Stripe..."
                : "Confirm & Continue to Payment"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setShowConfirmation(false)
              }
              disabled={loading}
            >
              Edit delivery details
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default Checkout;
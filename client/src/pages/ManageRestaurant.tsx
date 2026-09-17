import { useEffect, useState } from "react";
import axios from "axios";
import {
  createRestaurant,
  getMyRestaurant,
  updateMyRestaurant,
  type Restaurant,
  type RestaurantFormData,
} from "../api/restaurantApi";

const initialForm: RestaurantFormData = {
  name: "",
  description: "",
  city: "",
  address: "",
  cuisines: [],
  imageUrl: "",
  deliveryPrice: 0,
  estimatedDeliveryTime: 30,
  isActive: true,
};

export default function ManageRestaurant() {
  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [form, setForm] =
    useState<RestaurantFormData>(initialForm);

  const [cuisinesText, setCuisinesText] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadRestaurant = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login first.");
        setLoading(false);
        return;
      }

      try {
        const response = await getMyRestaurant(token);
        const data = response.data;

        setRestaurant(data);

        setForm({
          name: data.name,
          description: data.description,
          city: data.city,
          address: data.address,
          cuisines: data.cuisines,
          imageUrl: data.imageUrl,
          deliveryPrice: data.deliveryPrice,
          estimatedDeliveryTime:
            data.estimatedDeliveryTime,
          isActive: data.isActive,
        });

        setCuisinesText(data.cuisines.join(", "));
      } catch (err) {
        if (
          axios.isAxiosError(err) &&
          err.response?.status === 404
        ) {
          setRestaurant(null);
        } else {
          console.error("Load restaurant error:", err);

          setError(
            axios.isAxiosError(err)
              ? err.response?.data?.message ||
                  "Failed to load restaurant."
              : "Failed to load restaurant."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadRestaurant();
  }, []);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    if (
      name === "deliveryPrice" ||
      name === "estimatedDeliveryTime"
    ) {
      setForm((current) => ({
        ...current,
        [name]: Number(value),
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login first.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const cuisines = cuisinesText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const restaurantData: RestaurantFormData = {
        ...form,
        cuisines,
      };

      if (restaurant) {
        const response = await updateMyRestaurant(
          restaurantData,
          token
        );

        setRestaurant(response.data);
        setSuccess(
          "Restaurant updated successfully!"
        );
      } else {
        const response = await createRestaurant(
          restaurantData,
          token
        );

        setRestaurant(response.data);
        setSuccess(
          "Restaurant created successfully!"
        );
      }
    } catch (err) {
      console.error("Save restaurant error:", err);

      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message ||
              "Failed to save restaurant."
          : "Failed to save restaurant."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="page manage-restaurant-page">
        <div className="manage-loading">
          <div className="loading-spinner" />
          <p>Loading restaurant...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page manage-restaurant-page">
      <section className="manage-restaurant-heading">
        <div>
          <span className="eyebrow">RESTAURANT OWNER</span>

          <h1>
            {restaurant
              ? "Manage Restaurant"
              : "Create Your Restaurant"}
          </h1>

          <p>
            {restaurant
              ? "Keep your restaurant information up to date for customers."
              : "Set up your restaurant and start accepting food orders."}
          </p>
        </div>

        {restaurant && (
          <div
            className={`restaurant-status-pill ${
              form.isActive
                ? "restaurant-active"
                : "restaurant-inactive"
            }`}
          >
            <span />
            {form.isActive ? "Active" : "Inactive"}
          </div>
        )}
      </section>

      {error && (
        <div className="form-error manage-alert">
          {error}
        </div>
      )}

      {success && (
        <div className="manage-success">
          <span>✓</span>
          {success}
        </div>
      )}

      <form
        className="restaurant-form-card"
        onSubmit={handleSubmit}
      >
        <div className="form-card-heading">
          <div>
            <span className="form-section-number">01</span>
            <div>
              <h2>Restaurant information</h2>
              <p>
                Tell customers what makes your restaurant special.
              </p>
            </div>
          </div>
        </div>

        <div className="restaurant-form-body">
          <label className="restaurant-field restaurant-field-full">
            <span>Restaurant Name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="FoodOrder Kitchen"
              required
            />
          </label>

          <label className="restaurant-field restaurant-field-full">
            <span>Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Tell customers about your restaurant..."
              rows={5}
              required
            />
          </label>

          <div className="restaurant-field-grid">
            <label className="restaurant-field">
              <span>City</span>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Gujranwala"
                required
              />
            </label>

            <label className="restaurant-field">
              <span>Address</span>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Main Market"
                required
              />
            </label>
          </div>

          <label className="restaurant-field restaurant-field-full">
            <span>Cuisines</span>
            <input
              type="text"
              value={cuisinesText}
              onChange={(event) =>
                setCuisinesText(event.target.value)
              }
              placeholder="Burgers, Fast Food, Pakistani"
            />
            <small>
              Separate each cuisine with a comma.
            </small>
          </label>

          <label className="restaurant-field restaurant-field-full">
            <span>Restaurant Image URL</span>
            <input
              type="url"
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/restaurant.jpg"
            />
            <small>
              Use a publicly accessible image URL.
            </small>
          </label>
        </div>

        <div className="form-card-heading form-card-heading-spaced">
          <div>
            <span className="form-section-number">02</span>
            <div>
              <h2>Delivery settings</h2>
              <p>
                Set the delivery cost and estimated delivery time.
              </p>
            </div>
          </div>
        </div>

        <div className="restaurant-form-body">
          <div className="restaurant-field-grid">
            <label className="restaurant-field">
              <span>Delivery Price</span>
              <div className="input-with-prefix">
                <span>$</span>
                <input
                  type="number"
                  name="deliveryPrice"
                  value={form.deliveryPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>
            </label>

            <label className="restaurant-field">
              <span>Estimated Delivery Time</span>
              <div className="input-with-suffix">
                <input
                  type="number"
                  name="estimatedDeliveryTime"
                  value={form.estimatedDeliveryTime}
                  onChange={handleChange}
                  min="1"
                />
                <span>min</span>
              </div>
            </label>
          </div>

          {restaurant && (
            <label className="restaurant-active-toggle">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />

              <span className="toggle-visual" />

              <span>
                <strong>Restaurant is active</strong>
                <small>
                  Customers can see and order from your restaurant.
                </small>
              </span>
            </label>
          )}
        </div>

        <div className="restaurant-form-footer">
          <p>
            {restaurant
              ? "Changes will be reflected across your restaurant."
              : "You can update these details later."}
          </p>

          <button
            type="submit"
            className="primary-button restaurant-save-button"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : restaurant
              ? "Save Changes"
              : "Create Restaurant"}
          </button>
        </div>
      </form>
    </main>
  );
}
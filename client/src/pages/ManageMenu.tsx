import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import axios from "axios";

import {
  getCategories,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductFormData,
} from "../api/productApi";

import {
  getMyRestaurant,
  type Restaurant,
} from "../api/restaurantApi";

import type { Category, Product } from "../types";

const emptyForm: ProductFormData = {
  name: "",
  description: "",
  price: 0,
  image: "",
  restaurant: "",
  category: "",
  stock: 0,
  isAvailable: true,
};

export default function ManageMenu() {
  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [form, setForm] =
    useState<ProductFormData>(emptyForm);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  const loadData = async () => {
    if (!token) {
      setError("Please log in first.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const restaurantResponse =
        await getMyRestaurant(token);

      const currentRestaurant =
        restaurantResponse.data;

      setRestaurant(currentRestaurant);

      const [productsResponse, categoriesResponse] =
        await Promise.all([
          getProducts(currentRestaurant._id),
          getCategories(),
        ]);

      setProducts(productsResponse.data);
      setCategories(categoriesResponse.data);

      setForm((previous) => ({
        ...previous,
        restaurant: currentRestaurant._id,
      }));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ??
            "Failed to load menu."
        );
      } else {
        setError("Failed to load menu.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement |
        HTMLTextAreaElement |
        HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === "price" || name === "stock"
          ? Number(value)
          : name === "isAvailable"
          ? value === "true"
          : value,
    }));
  };

  const resetForm = () => {
    setEditingProduct(null);

    setForm({
      ...emptyForm,
      restaurant: restaurant?._id ?? "",
    });
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!token || !restaurant) {
      setError(
        "Restaurant information is unavailable."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (editingProduct) {
        await updateProduct(
          editingProduct._id,
          {
            name: form.name,
            description: form.description,
            price: form.price,
            image: form.image,
            category: form.category,
            stock: form.stock,
            isAvailable: form.isAvailable,
          },
          token
        );

        setMessage(
          "Menu item updated successfully."
        );
      } else {
        await createProduct(
          {
            ...form,
            restaurant: restaurant._id,
          },
          token
        );

        setMessage(
          "Menu item added successfully."
        );
      }

      resetForm();

      const productsResponse =
        await getProducts(restaurant._id);

      setProducts(productsResponse.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ??
            "Failed to save menu item."
        );
      } else {
        setError("Failed to save menu item.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);

    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image ?? "",
      restaurant: restaurant?._id ?? "",
      category:
        typeof product.category === "string"
          ? product.category
          : product.category._id,
      stock: product.stock,
      isAvailable: product.isAvailable,
    });

    setMessage("");
    setError("");
  };

  const handleDelete = async (id: string) => {
    if (!token || !restaurant) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this menu item?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await deleteProduct(id, token);

      setProducts((previous) =>
        previous.filter(
          (product) => product._id !== id
        )
      );

      if (editingProduct?._id === id) {
        resetForm();
      }

      setMessage(
        "Menu item removed successfully."
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ??
            "Failed to remove menu item."
        );
      } else {
        setError("Failed to remove menu item.");
      }
    }
  };

  if (loading) {
    return (
      <main className="page">
        <p>Loading menu...</p>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="page manage-menu-page">
        <section className="manage-menu-heading">
          <div>
            <span className="eyebrow">
              RESTAURANT OWNER
            </span>

            <h1>Manage Menu</h1>

            <p>
              {error ||
                "Restaurant not found. Please create your restaurant first."}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const currentRestaurant = restaurant;

  return (
    <main className="page manage-menu-page">
      <section className="manage-menu-heading">
        <div>
          <span className="eyebrow">
            RESTAURANT OWNER
          </span>

          <h1>Manage Menu</h1>

          <p>
            Add, edit and manage the food items
            available at{" "}
            <strong>
              {currentRestaurant.name}
            </strong>
          </p>
        </div>

        <div className="menu-count-badge">
          <strong>{products.length}</strong>

          <span>
            {products.length === 1
              ? "Menu item"
              : "Menu items"}
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

      <section className="menu-management-grid">
        <div className="menu-form-card">
          <div className="menu-form-header">
            <div>
              <span className="form-section-number">
                {editingProduct ? "02" : "01"}
              </span>

              <div>
                <h2>
                  {editingProduct
                    ? "Edit Menu Item"
                    : "Add Menu Item"}
                </h2>

                <p>
                  {editingProduct
                    ? "Update the details of this item."
                    : "Add a new food item to your restaurant."}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="menu-form-body">
              <label className="menu-field">
                <span>Name</span>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Classic Beef Burger"
                  required
                />
              </label>

              <label className="menu-field">
                <span>Description</span>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe this menu item..."
                  rows={4}
                  required
                />
              </label>

              <div className="menu-field-grid">
                <label className="menu-field">
                  <span>Price</span>

                  <div className="menu-input-prefix">
                    <span>$</span>

                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </label>

                <label className="menu-field">
                  <span>Stock</span>

                  <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </label>
              </div>

              <label className="menu-field">
                <span>Category</span>

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category._id}
                      value={category._id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="menu-field">
                <span>Availability</span>

                <select
                  name="isAvailable"
                  value={form.isAvailable ? "true" : "false"}
                  onChange={handleChange}
                >
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
              </label>

              <label className="menu-field">
                <span>Image URL</span>

                <input
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="https://example.com/food.jpg"
                />

                <small>
                  Use a publicly accessible image URL.
                </small>
              </label>
            </div>

            <div className="menu-form-footer">
              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingProduct
                  ? "Save Changes"
                  : "Add Menu Item"}
              </button>

              {editingProduct && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="menu-items-section">
          <div className="menu-items-heading">
            <div>
              <span className="eyebrow">
                YOUR RESTAURANT
              </span>

              <h2>Your Menu</h2>
            </div>

            <span className="menu-items-total">
              {products.length}{" "}
              {products.length === 1
                ? "item"
                : "items"}
            </span>
          </div>

          {products.length === 0 ? (
            <div className="menu-empty-state">
              <div className="menu-empty-icon">
                🍽
              </div>

              <h3>Your menu is empty</h3>

              <p>
                Add your first menu item using
                the form.
              </p>
            </div>
          ) : (
            <div className="menu-list">
              {products.map((product) => (
                <article
                  className="menu-item-card"
                  key={product._id}
                >
                  <div className="menu-item-image">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                      />
                    ) : (
                      <span>🍔</span>
                    )}
                  </div>

                  <div className="menu-item-content">
                    <div className="menu-item-top">
                      <div>
                        <h3>{product.name}</h3>

                        <p>
                          {product.description}
                        </p>
                      </div>

                      <strong className="menu-item-price">
                        ${product.price.toFixed(2)}
                      </strong>
                    </div>

                    <div className="menu-item-bottom">
                      <span
                        className={`stock-badge ${
                          product.stock > 0
                            ? "in-stock"
                            : "out-of-stock"
                        }`}
                      >
                        {product.stock > 0
                          ? `${product.stock} in stock`
                          : "Out of stock"}
                      </span>

                      <span
                        className={`availability-badge ${
                          product.isAvailable
                            ? "available"
                            : "unavailable"
                        }`}
                      >
                        {product.isAvailable
                          ? "Available"
                          : "Unavailable"}
                      </span>

                      <div className="menu-item-actions">
                        <button
                          type="button"
                          className="menu-edit-button"
                          onClick={() =>
                            handleEdit(product)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="menu-remove-button"
                          onClick={() =>
                            handleDelete(
                              product._id
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
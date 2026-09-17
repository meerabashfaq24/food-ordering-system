import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
} from "../api/cartApi";

import type { Cart as CartType } from "../types";

const API_URL = "http://localhost:5000/api";

interface Restaurant {
  _id: string;
  name: string;
  description: string;
  city: string;
  address: string;
  cuisines: string[];
  imageUrl: string;
  deliveryPrice: number;
  estimatedDeliveryTime: number;
  isActive: boolean;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  stock: number;
  isAvailable: boolean;
  category?:
    | string
    | {
        _id: string;
        name: string;
      };
  restaurant?: string;
}

interface RestaurantResponse {
  success: boolean;
  message: string;
  data: Restaurant;
}

interface ProductsResponse {
  success: boolean;
  message: string;
  data: Product[];
}

function RestaurantDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [cart, setCart] =
    useState<CartType | null>(null);

  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] =
    useState(true);
  const [cartLoading, setCartLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [menuError, setMenuError] =
    useState("");

  const [addingProduct, setAddingProduct] =
    useState<string | null>(null);

  const [updatingProduct, setUpdatingProduct] =
    useState<string | null>(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError("");

        const response =
          await axios.get<RestaurantResponse>(
            `${API_URL}/restaurants/${id}`
          );

        if (response.data.success) {
          setRestaurant(response.data.data);
        } else {
          setError(
            response.data.message ||
              "Restaurant not found."
          );
        }
      } catch (err) {
        console.error(
          "Restaurant error:",
          err
        );

        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
              "Failed to load restaurant."
          );
        } else {
          setError(
            "Failed to load restaurant."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [id]);

  useEffect(() => {
    const fetchMenu = async () => {
      if (!id) return;

      try {
        setMenuLoading(true);
        setMenuError("");

        const response =
          await axios.get<ProductsResponse>(
            `${API_URL}/products`,
            {
              params: {
                restaurant: id,
              },
            }
          );

        if (response.data.success) {
          setProducts(response.data.data);
        } else {
          setMenuError(
            response.data.message ||
              "Failed to load menu."
          );
        }
      } catch (err) {
        console.error("Menu error:", err);

        if (axios.isAxiosError(err)) {
          setMenuError(
            err.response?.data?.message ||
              "Failed to load menu."
          );
        } else {
          setMenuError(
            "Failed to load menu."
          );
        }
      } finally {
        setMenuLoading(false);
      }
    };

    fetchMenu();
  }, [id]);

  const fetchCart = async () => {
    if (!token) {
      setCart(null);
      return;
    }

    try {
      setCartLoading(true);

      const response =
        await getCart(token);

      if (
        response.success &&
        response.data
      ) {
        setCart(response.data);
      }
    } catch (err) {
      console.error(
        "Failed to load cart:",
        err
      );
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const getCategoryName = (
    category: Product["category"]
  ): string => {
    if (!category) {
      return "Menu item";
    }

    if (typeof category === "string") {
      return category;
    }

    return category.name;
  };

  const groupedProducts = useMemo(() => {
    const groups: Record<
      string,
      Product[]
    > = {};

    products.forEach((product) => {
      const category =
        getCategoryName(product.category);

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push(product);
    });

    return groups;
  }, [products]);

  const cartItemsForRestaurant =
    cart?.items || [];

  const cartSubtotal =
    cartItemsForRestaurant.reduce(
      (sum, item) =>
        sum +
        item.product.price *
          item.quantity,
      0
    );

  const deliveryFee =
    restaurant?.deliveryPrice || 0;

  const cartTotal =
    cartSubtotal + deliveryFee;

  const getCartQuantity = (
    productId: string
  ): number => {
    const item = cart?.items.find(
      (cartItem) =>
        cartItem.product._id ===
        productId
    );

    return item?.quantity || 0;
  };

  const handleAddToCart = async (
    productId: string
  ) => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setAddingProduct(productId);

      const response =
        await addToCart(
          productId,
          1,
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
            "Failed to add item."
        );
      }
    } catch (err) {
      console.error(
        "Add to cart error:",
        err
      );

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Failed to add item to cart."
        );
      } else {
        setError(
          "Failed to add item to cart."
        );
      }
    } finally {
      setAddingProduct(null);
    }
  };

  const handleIncreaseQuantity = async (
    productId: string,
    currentQuantity: number
  ) => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setUpdatingProduct(productId);

      const response =
        await updateCartItem(
          productId,
          currentQuantity + 1,
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
    } catch (err) {
      console.error(
        "Increase quantity error:",
        err
      );
      setError(
        "Failed to update cart."
      );
    } finally {
      setUpdatingProduct(null);
    }
  };

  const handleDecreaseQuantity = async (
    productId: string,
    currentQuantity: number
  ) => {
    if (!token) return;

    try {
      setUpdatingProduct(productId);

      if (currentQuantity <= 1) {
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
        }

        return;
      }

      const response =
        await updateCartItem(
          productId,
          currentQuantity - 1,
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
    } catch (err) {
      console.error(
        "Decrease quantity error:",
        err
      );
      setError(
        "Failed to update cart."
      );
    } finally {
      setUpdatingProduct(null);
    }
  };

  const handleRemoveFromCart = async (
    productId: string
  ) => {
    if (!token) return;

    try {
      setUpdatingProduct(productId);

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
    } catch (err) {
      console.error(
        "Remove cart item error:",
        err
      );
      setError(
        "Failed to remove item."
      );
    } finally {
      setUpdatingProduct(null);
    }
  };

  const handleCheckout = () => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (
      !cart ||
      cart.items.length === 0
    ) {
      return;
    }

    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="restaurant-page">
        <div className="restaurant-loading">
          <div className="loading-spinner" />
          <p>
            Loading restaurant...
          </p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="restaurant-page">
        <div className="restaurant-error">
          <h1>
            Restaurant not found
          </h1>

          <p>
            {error ||
              "We couldn't find this restaurant."}
          </p>

          <Link
            to="/restaurants"
            className="primary-button"
          >
            Back to Restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurant-page">
      <div className="restaurant-container">
        <Link
          to="/restaurants"
          className="restaurant-back-link"
        >
          ← Back to restaurants
        </Link>

        <section className="restaurant-hero">
          <div className="restaurant-hero-image">
            {restaurant.imageUrl ? (
              <img
                src={restaurant.imageUrl}
                alt={restaurant.name}
              />
            ) : (
              <div className="restaurant-image-placeholder">
                <span>
                  {restaurant.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          <div className="restaurant-hero-content">
            <div className="restaurant-rating">
              <span className="rating-star">
                ★
              </span>
              <span>
                Popular restaurant
              </span>
            </div>

            <h1>
              {restaurant.name}
            </h1>

            <p className="restaurant-description">
              {restaurant.description}
            </p>

            <div className="restaurant-location">
              <span>📍</span>
              <span>
                {restaurant.address},{" "}
                {restaurant.city}
              </span>
            </div>

            <div className="restaurant-cuisines">
              {restaurant.cuisines.map(
                (cuisine) => (
                  <span
                    key={cuisine}
                    className="cuisine-pill"
                  >
                    {cuisine}
                  </span>
                )
              )}
            </div>

            <div className="restaurant-meta">
              <div className="restaurant-meta-item">
                <span className="meta-icon">
                  🚴
                </span>

                <div>
                  <strong>
                    $
                    {restaurant.deliveryPrice.toFixed(
                      2
                    )}
                  </strong>
                  <span>
                    Delivery fee
                  </span>
                </div>
              </div>

              <div className="restaurant-meta-item">
                <span className="meta-icon">
                  ⏱
                </span>

                <div>
                  <strong>
                    {
                      restaurant.estimatedDeliveryTime
                    }{" "}
                    min
                  </strong>
                  <span>
                    Delivery time
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="restaurant-alert">
            {error}
          </div>
        )}

        <div className="restaurant-content-layout">
          <main className="menu-content">
            <div className="menu-heading">
              <div>
                <p className="section-label">
                  MENU
                </p>

                <h2>
                  {restaurant.name}
                </h2>

                <p>
                  Choose your favourite
                  dishes.
                </p>
              </div>
            </div>

            {menuLoading && (
              <div className="menu-loading">
                <div className="loading-spinner" />
                <p>
                  Loading menu...
                </p>
              </div>
            )}

            {menuError && (
              <div className="restaurant-error small">
                <p>{menuError}</p>
              </div>
            )}

            {!menuLoading &&
              !menuError &&
              products.length === 0 && (
                <div className="menu-empty">
                  <div className="empty-icon">
                    🍽
                  </div>

                  <h3>
                    No menu items yet
                  </h3>

                  <p>
                    This restaurant hasn't
                    added any menu items yet.
                  </p>
                </div>
              )}

            {!menuLoading &&
              !menuError &&
              products.length > 0 && (
                <div className="menu-groups">
                  {Object.entries(
                    groupedProducts
                  ).map(
                    ([
                      category,
                      categoryProducts,
                    ]) => (
                      <section
                        className="menu-category"
                        key={category}
                      >
                        <h3>
                          {category}
                        </h3>

                        <div className="menu-item-list">
                          {categoryProducts.map(
                            (product) => {
                              const quantity =
                                getCartQuantity(
                                  product._id
                                );

                              return (
                                <article
                                  className="menu-item"
                                  key={
                                    product._id
                                  }
                                >
                                  <div className="menu-item-image">
                                    {product.image ? (
                                      <img
                                        src={
                                          product.image
                                        }
                                        alt={
                                          product.name
                                        }
                                      />
                                    ) : (
                                      <div className="menu-image-placeholder">
                                        <span>
                                          {product.name.charAt(
                                            0
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="menu-item-content">
                                    <h4>
                                      {
                                        product.name
                                      }
                                    </h4>

                                    <p>
                                      {
                                        product.description
                                      }
                                    </p>

                                    <strong className="menu-item-price">
                                      $
                                      {product.price.toFixed(
                                        2
                                      )}
                                    </strong>
                                  </div>

                                  <div className="menu-item-action">
                                    {quantity ===
                                    0 ? (
                                      <button
                                        type="button"
                                        className="add-button"
                                        disabled={
                                          product.stock <=
                                            0 ||
                                          !product.isAvailable ||
                                          addingProduct ===
                                            product._id
                                        }
                                        onClick={() =>
                                          handleAddToCart(
                                            product._id
                                          )
                                        }
                                      >
                                        {addingProduct ===
                                        product._id
                                          ? "Adding..."
                                          : product.stock <=
                                              0
                                          ? "Sold out"
                                          : "Add"}
                                      </button>
                                    ) : (
                                      <div className="quantity-control">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDecreaseQuantity(
                                              product._id,
                                              quantity
                                            )
                                          }
                                          disabled={
                                            updatingProduct ===
                                            product._id
                                          }
                                        >
                                          −
                                        </button>

                                        <span>
                                          {quantity}
                                        </span>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleIncreaseQuantity(
                                              product._id,
                                              quantity
                                            )
                                          }
                                          disabled={
                                            updatingProduct ===
                                            product._id
                                          }
                                        >
                                          +
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </article>
                              );
                            }
                          )}
                        </div>
                      </section>
                    )
                  )}
                </div>
              )}
          </main>

          <aside className="restaurant-basket">
            <div className="basket-card">
              <div className="basket-header">
                <div>
                  <p className="section-label">
                    YOUR ORDER
                  </p>

                  <h2>
                    Your basket
                  </h2>
                </div>

                {cart &&
                  cart.items.length > 0 && (
                    <span className="basket-count">
                      {cart.items.reduce(
                        (sum, item) =>
                          sum +
                          item.quantity,
                        0
                      )}
                    </span>
                  )}
              </div>

              {cartLoading && (
                <div className="basket-loading">
                  <div className="loading-spinner small-spinner" />
                </div>
              )}

              {!cartLoading &&
                (!cart ||
                  cart.items.length ===
                    0) && (
                  <div className="basket-empty">
                    <div className="basket-empty-icon">
                      🛒
                    </div>

                    <h3>
                      Your basket is empty
                    </h3>

                    <p>
                      Add something delicious
                      from the menu.
                    </p>
                  </div>
                )}

              {!cartLoading &&
                cart &&
                cart.items.length > 0 && (
                  <>
                    <div className="basket-items">
                      {cart.items.map(
                        (item) => (
                          <div
                            className="basket-item"
                            key={
                              item.product
                                ._id
                            }
                          >
                            <div className="basket-item-top">
                              <div>
                                <strong>
                                  {
                                    item.product
                                      .name
                                  }
                                </strong>

                                <span>
                                  $
                                  {item.product.price.toFixed(
                                    2
                                  )}
                                </span>
                              </div>

                              <strong>
                                $
                                {(
                                  item.product
                                    .price *
                                  item.quantity
                                ).toFixed(2)}
                              </strong>
                            </div>

                            <div className="basket-item-bottom">
                              <div className="quantity-control basket-quantity">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDecreaseQuantity(
                                      item
                                        .product
                                        ._id,
                                      item.quantity
                                    )
                                  }
                                  disabled={
                                    updatingProduct ===
                                    item
                                      .product
                                      ._id
                                  }
                                >
                                  −
                                </button>

                                <span>
                                  {
                                    item.quantity
                                  }
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleIncreaseQuantity(
                                      item
                                        .product
                                        ._id,
                                      item.quantity
                                    )
                                  }
                                  disabled={
                                    updatingProduct ===
                                    item
                                      .product
                                      ._id
                                  }
                                >
                                  +
                                </button>
                              </div>

                              <button
                                type="button"
                                className="remove-item-button"
                                onClick={() =>
                                  handleRemoveFromCart(
                                    item
                                      .product
                                      ._id
                                  )
                                }
                                disabled={
                                  updatingProduct ===
                                  item
                                    .product
                                    ._id
                                }
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    <div className="basket-summary">
                      <div>
                        <span>
                          Subtotal
                        </span>
                        <strong>
                          $
                          {cartSubtotal.toFixed(
                            2
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Delivery
                        </span>
                        <strong>
                          $
                          {deliveryFee.toFixed(
                            2
                          )}
                        </strong>
                      </div>

                      <div className="basket-total">
                        <span>
                          Total
                        </span>
                        <strong>
                          $
                          {cartTotal.toFixed(
                            2
                          )}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="checkout-button"
                      onClick={
                        handleCheckout
                      }
                    >
                      Go to checkout
                      <span>→</span>
                    </button>
                  </>
                )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default RestaurantDetails;
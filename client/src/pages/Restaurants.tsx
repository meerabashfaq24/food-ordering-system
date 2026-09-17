import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getRestaurants,
  type Restaurant,
} from "../api/restaurantApi";

function Restaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [sort, setSort] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getRestaurants({
          search: search || undefined,
          city: city || undefined,
          cuisine: cuisine || undefined,
          sort: sort || undefined,
          page,
          limit: 6,
        });

        if (response.success) {
          setRestaurants(response.data.restaurants);
          setTotalPages(response.data.pagination.totalPages);
        }
      } catch (err) {
        console.error("Failed to load restaurants:", err);
        setError(
          "Unable to load restaurants. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, [search, city, cuisine, sort, page]);

  const handleSearch = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleCityChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCity(event.target.value);
    setPage(1);
  };

  const handleCuisineChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setCuisine(event.target.value);
    setPage(1);
  };

  const handleSortChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSort(event.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setCity("");
    setCuisine("");
    setSort("");
    setPage(1);
  };

  return (
    <div className="restaurants-page">
      {/* HEADER */}
      <section className="restaurants-hero">
        <div className="restaurants-hero-content">
          <span className="eyebrow">
            DISCOVER FOOD
          </span>

          <h1>
            Find your next
            <br />
            <span>favorite meal.</span>
          </h1>

          <p>
            Explore restaurants, discover new cuisines
            and find something delicious near you.
          </p>

          <form
            className="restaurant-search"
            onSubmit={handleSearch}
          >
            <div className="search-input-wrapper">
              <span>⌕</span>

              <input
                type="search"
                placeholder="Search restaurants..."
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
              />
            </div>

            <button
              type="submit"
              className="primary-button"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* CONTENT */}
      <main className="restaurants-content">
        <div className="restaurants-toolbar">
          <div>
            <span className="eyebrow">
              RESTAURANTS
            </span>

            <h2>
              Explore places to eat
            </h2>
          </div>

          <span className="restaurant-count">
            {loading
              ? "Loading..."
              : `${restaurants.length} shown`}
          </span>
        </div>

        {/* FILTERS */}
        <div className="restaurant-filters">
          <div className="filter-field">
            <label htmlFor="city">
              Location
            </label>

            <input
              id="city"
              type="text"
              placeholder="Enter city"
              value={city}
              onChange={handleCityChange}
            />
          </div>

          <div className="filter-field">
            <label htmlFor="cuisine">
              Cuisine
            </label>

            <select
              id="cuisine"
              value={cuisine}
              onChange={handleCuisineChange}
            >
              <option value="">
                All cuisines
              </option>
              <option value="Burgers">
                Burgers
              </option>
              <option value="Fast Food">
                Fast Food
              </option>
              <option value="Pakistani">
                Pakistani
              </option>
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="sort">
              Sort by
            </label>

            <select
              id="sort"
              value={sort}
              onChange={handleSortChange}
            >
              <option value="">
                Newest
              </option>
              <option value="deliveryPrice">
                Lowest delivery price
              </option>
              <option value="deliveryTime">
                Fastest delivery
              </option>
            </select>
          </div>

          {(search || city || cuisine || sort) && (
            <button
              type="button"
              className="clear-filters"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* LOADING */}
        {loading && (
          <div className="restaurant-loading">
            <div className="loading-spinner" />
            <p>Finding restaurants...</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="restaurant-error">
            <div>!</div>
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button
              type="button"
              className="primary-button"
              onClick={() => setSearch(search)}
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !error &&
          restaurants.length === 0 && (
            <div className="restaurant-empty">
              <div className="empty-icon">
                🍽️
              </div>

              <h2>
                No restaurants found
              </h2>

              <p>
                We couldn't find anything matching
                your search. Try changing your filters.
              </p>

              <button
                type="button"
                className="secondary-button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          )}

        {/* RESTAURANTS */}
        {!loading &&
          !error &&
          restaurants.length > 0 && (
            <>
              <section className="restaurant-grid">
                {restaurants.map((restaurant) => (
                  <article
                    className="restaurant-card"
                    key={restaurant._id}
                  >
                    <div className="restaurant-image">
                      {restaurant.imageUrl ? (
                        <img
                          src={restaurant.imageUrl}
                          alt={restaurant.name}
                        />
                      ) : (
                        <div className="restaurant-placeholder">
                          <span>
                            {restaurant.name
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}

                      <div className="delivery-time">
                        ⏱{" "}
                        {restaurant.estimatedDeliveryTime} min
                      </div>
                    </div>

                    <div className="restaurant-content">
                      <div className="restaurant-title-row">
                        <div>
                          <h2>
                            {restaurant.name}
                          </h2>

                          <p className="restaurant-location">
                            📍 {restaurant.city}
                          </p>
                        </div>

                        <div className="restaurant-rating">
                          ★
                        </div>
                      </div>

                      <p className="restaurant-description">
                        {restaurant.description}
                      </p>

                      <div className="cuisine-list">
                        {restaurant.cuisines.map(
                          (item) => (
                            <span key={item}>
                              {item}
                            </span>
                          )
                        )}
                      </div>

                      <div className="restaurant-footer">
                        <div className="delivery-info">
                          <span>
                            Delivery
                          </span>

                          <strong>
                            $
                            {restaurant.deliveryPrice.toFixed(
                              2
                            )}
                          </strong>
                        </div>

                        <Link
                          to={`/restaurants/${restaurant._id}`}
                          className="secondary-button"
                        >
                          View Restaurant →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </section>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    type="button"
                    className="pagination-button"
                    disabled={page === 1}
                    onClick={() =>
                      setPage(
                        (currentPage) =>
                          currentPage - 1
                      )
                    }
                  >
                    ← Previous
                  </button>

                  <div className="pagination-info">
                    <strong>{page}</strong>
                    <span>
                      of {totalPages}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="pagination-button"
                    disabled={
                      page === totalPages
                    }
                    onClick={() =>
                      setPage(
                        (currentPage) =>
                          currentPage + 1
                      )
                    }
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
      </main>
    </div>
  );
}

export default Restaurants;
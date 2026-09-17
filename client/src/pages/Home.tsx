import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-page">
      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-overlay">
          <div className="home-hero-content">
            <span className="hero-badge">
              Delicious food. Delivered.
            </span>

            <h1>
              Your favorite meals,
              <br />
              <span>right at your door.</span>
            </h1>

            <p>
              Discover the best restaurants around you,
              explore delicious cuisines and order
              everything you love in just a few clicks.
            </p>

            <div className="hero-actions">
              <Link
                to="/restaurants"
                className="primary-button hero-button"
              >
                Explore Restaurants →
              </Link>

              <Link
                to="/products"
                className="hero-secondary-button"
              >
                Browse Menu
              </Link>
            </div>

            <div className="hero-stats">
              <div>
                <strong>100+</strong>
                <span>Food choices</span>
              </div>

              <div>
                <strong>30 min</strong>
                <span>Average delivery</span>
              </div>

              <div>
                <strong>Easy</strong>
                <span>Secure checkout</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="home-section home-features">
        <div className="home-section-heading">
          <span className="eyebrow">
            WHY FOODORDER?
          </span>

          <h2>
            Everything you need
            <br />
            for a great meal.
          </h2>

          <p>
            From discovering a new restaurant to
            tracking your order, we've made ordering
            food simple.
          </p>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <div className="feature-icon">
              🍽️
            </div>

            <span>01</span>

            <h3>
              Discover restaurants
            </h3>

            <p>
              Find restaurants by cuisine, location,
              delivery price and speed.
            </p>

            <Link to="/restaurants">
              Find restaurants →
            </Link>
          </article>

          <article className="feature-card">
            <div className="feature-icon">
              🛒
            </div>

            <span>02</span>

            <h3>
              Build your basket
            </h3>

            <p>
              Choose your favorite dishes and
              customize your order before checkout.
            </p>

            <Link to="/restaurants">
              Start ordering →
            </Link>
          </article>

          <article className="feature-card">
            <div className="feature-icon">
              📦
            </div>

            <span>03</span>

            <h3>
              Track your order
            </h3>

            <p>
              Follow your order from confirmation
              all the way to your doorstep.
            </p>

            <Link to="/orders">
              View orders →
            </Link>
          </article>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="home-section how-section">
        <div className="how-content">
          <div>
            <span className="eyebrow">
              HOW IT WORKS
            </span>

            <h2>
              Great food is
              <br />
              only a few clicks away.
            </h2>

            <p>
              We've kept the whole experience
              straightforward so you can spend less
              time ordering and more time enjoying
              your food.
            </p>

            <Link
              to="/restaurants"
              className="primary-button"
            >
              Start Ordering
            </Link>
          </div>

          <div className="steps-list">
            <div className="home-step">
              <div className="step-number">
                01
              </div>

              <div>
                <h3>
                  Choose a restaurant
                </h3>

                <p>
                  Explore restaurants and discover
                  the cuisine you are craving.
                </p>
              </div>
            </div>

            <div className="home-step">
              <div className="step-number">
                02
              </div>

              <div>
                <h3>
                  Pick your favorites
                </h3>

                <p>
                  Add dishes to your basket and
                  adjust quantities before checkout.
                </p>
              </div>
            </div>

            <div className="home-step">
              <div className="step-number">
                03
              </div>

              <div>
                <h3>
                  Pay securely
                </h3>

                <p>
                  Confirm your delivery details and
                  complete payment through Stripe.
                </p>
              </div>
            </div>

            <div className="home-step">
              <div className="step-number">
                04
              </div>

              <div>
                <h3>
                  Track your delivery
                </h3>

                <p>
                  Keep an eye on your order as it
                  moves from the restaurant to you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div>
          <span className="eyebrow">
            READY TO ORDER?
          </span>

          <h2>
            Your next favorite meal
            <br />
            is waiting.
          </h2>

          <p>
            Browse restaurants and start your order
            today.
          </p>

          <Link
            to="/restaurants"
            className="primary-button cta-button"
          >
            Explore Restaurants →
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
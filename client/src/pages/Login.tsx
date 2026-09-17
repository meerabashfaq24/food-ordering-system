import { useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        `${API_URL}/auth/login`,
        {
          email: email.trim(),
          password,
        }
      );

      if (!response.data.success) {
        setError(
          response.data.message ||
            "Login failed."
        );
        return;
      }

      const { token, user } = response.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      navigate("/products");
      window.location.reload();
    } catch (err) {
      console.error("Login error:", err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Invalid email or password."
        );
      } else {
        setError("Unable to login.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <form
        className="form card"
        onSubmit={handleSubmit}
      >
        <h1 className="page-title">Login</h1>

        <p className="page-subtitle">
          Sign in to your FoodOrder account.
        </p>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">
            Email
          </label>

          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Password
          </label>

          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />
        </div>

        <button
          className="button button-primary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <p style={{ marginTop: "20px" }}>
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{
              color: "#ea580c",
              fontWeight: 700,
            }}
          >
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;

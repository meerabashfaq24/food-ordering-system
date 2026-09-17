import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import type { User } from "../types";

interface ProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export default function Profile() {
  const { user, token, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get<ProfileResponse>("/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setFormData({
          name: response.data.data.user.name,
          email: response.data.data.user.email,
        });
      } catch (err) {
        console.error("Failed to load profile:", err);

        if (user) {
          setFormData({
            name: user.name,
            email: user.email,
          });
        }

        setError("Could not load your profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [token, user]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await api.put<ProfileResponse>(
        "/auth/profile",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setFormData({
        name: response.data.data.user.name,
        email: response.data.data.user.email,
      });
      updateUser(response.data.data.user);

      setMessage(response.data.message);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Could not update your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <main className="page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Account</span>
          <h1>My Profile</h1>
          <p>Manage your personal information.</p>
        </div>
      </section>

      <section className="profile-card">
        <div className="profile-avatar">
          {formData.name.charAt(0).toUpperCase()}
        </div>

        <div className="profile-info">
          <h2>{formData.name}</h2>
          <p>{formData.email}</p>

          <span className="role-badge">
            {user.role}
          </span>
        </div>
      </section>

      <section className="profile-form-card">
        <div className="profile-form-heading">
          <div>
            <span className="eyebrow">Personal details</span>
            <h2>Update your profile</h2>
          </div>
        </div>

        {loading ? (
          <p>Loading your profile...</p>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <label>
              Name
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </label>

            {message && (
              <p className="profile-success">
                {message}
              </p>
            )}

            {error && (
              <p className="profile-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
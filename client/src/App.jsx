import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Providers from "./pages/Providers.jsx";
import ProviderDetail from "./pages/ProviderDetail.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Bookings from "./pages/Bookings.jsx";
import BookingDetail from "./pages/BookingDetail.jsx";
import MyListing from "./pages/MyListing.jsx";
import Notifications from "./pages/Notifications.jsx";
import Admin from "./pages/Admin.jsx";
import NotFound from "./pages/NotFound.jsx";
import ApplyForLeave from "./pages/ApplyForLeave.jsx";

/** Sends signed-out visitors to the login page and remembers where they were going (FR-4). */
function RequireAuth({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return <p className="container page muted">Loading your account…</p>;
  if (!user)
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  if (roles && !roles.includes(user.role)) {
    return (
      <main className="container page">
        <h1>You can't open this page</h1>
        <p className="muted">This page is for {roles.join(" or ")} accounts.</p>
      </main>
    );
  }
  return children;
}


export default function App() {
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Navbar />

      <main id="main" className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/providers" element={<Providers />} />
          <Route path="/providers/:id" element={<ProviderDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/bookings"
            element={
              <RequireAuth roles={["customer", "provider"]}>
                <Bookings />
              </RequireAuth>
            }
          />
          <Route
            path="/bookings/:id"
            element={
              <RequireAuth>
                <BookingDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/listing"
            element={
              <RequireAuth roles={["provider"]}>
                <MyListing />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={<Navigate to="/listing" replace />}
          />
          <Route
            path="/notifications"
            element={
              <RequireAuth>
                <Notifications />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth roles={["admin"]}>
                <Admin />
              </RequireAuth>
            }
          />
          <Route
            path="/leave"
            element={
              <RequireAuth roles={["provider"]}>
                <ApplyForLeave />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="container">
          Trusted Local Pros. Software Engineering Lab project.
        </div>
      </footer>
    </div>
  );
}


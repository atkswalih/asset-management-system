import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useEffect, useState } from "react";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import ImpersonationBanner from "./components/ImpersonationBanner";

import Assignments from "./pages/Assignments";
import Assets from "./pages/Assets";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Tickets from "./pages/Tickets";
import UserManagement from "./pages/UserManagement";
import AIAssistant from "./pages/AIAssistant";

function Layout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-area">
        <Navbar />

        <ImpersonationBanner />

        <main>{children}</main>
      </div>
    </div>
  );
}

function App() {
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const wakeBackend = async () => {
      while (!cancelled) {
        try {
          const response = await fetch("/api/health/", {
            method: "GET",
            cache: "no-store",
          });

          if (response.ok) {
            console.log("Backend is ready.");

            if (!cancelled) {
              setBackendReady(true);
            }

            break;
          }

          console.log("Backend is waking up...");
        } catch (error) {
          console.log("Backend is waking up...");
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    };

    wakeBackend();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!backendReady) {
    return (
      <div className="backend-loading-screen">
        <div className="loading-background-glow glow-one"></div>
        <div className="loading-background-glow glow-two"></div>

        <div className="loading-content">
          <div className="loading-logo-wrapper">
            <div className="loading-ring loading-ring-one"></div>
            <div className="loading-ring loading-ring-two"></div>

            <div className="loading-logo">
              <span>AM</span>
            </div>
          </div>

          <div className="loading-text">
            <h1>Asset Management</h1>

            <p className="loading-title">
              Waking up your workspace
              <span className="loading-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </p>

            <p className="loading-description">
              Connecting securely to the application server.
            </p>
          </div>

          <div className="loading-status">
            <span className="loading-status-dot"></span>
            <span>Connecting to server</span>
          </div>

          <div className="loading-progress">
            <div className="loading-progress-bar"></div>
          </div>

          <p className="loading-footer">
            This may take a few seconds if the server was idle.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets"
          element={
            <ProtectedRoute>
              <Layout>
                <Assets />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Layout>
                <Inventory />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assignments"
          element={
            <ProtectedRoute>
              <Layout>
                <Assignments />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets"
          element={
            <ProtectedRoute>
              <Layout>
                <Tickets />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-assistant"
          element={
            <ProtectedRoute>
              <Layout>
                <AIAssistant />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:uid/:token"
          element={<ResetPassword />}
        />

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
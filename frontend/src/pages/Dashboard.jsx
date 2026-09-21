import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Box,
  ClipboardList,
  Ticket,
  Wrench,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState({
    assets: 0,
    inventory: 0,
    assignments: 0,
    tickets: 0,
  });

  const [assetStatus, setAssetStatus] = useState([]);
  const [ticketStatus, setTicketStatus] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const response = await api.get("dashboard/");

        const data = response.data;

        setStats({
          assets: data.assets,
          inventory: data.inventory,
          assignments: data.assignments,
          tickets: data.tickets,
        });

        setAssetStatus([
          {
            name: "Available",
            value: data.asset_status.AVAILABLE,
          },
          {
            name: "Assigned",
            value: data.asset_status.ASSIGNED,
          },
          {
            name: "Repair",
            value: data.asset_status.REPAIR,
          },
          {
            name: "Retired",
            value: data.asset_status.RETIRED,
          },
        ]);

        setTicketStatus([
          {
            name: "Open",
            value: data.ticket_status.OPEN,
          },
          {
            name: "In Progress",
            value: data.ticket_status.IN_PROGRESS,
          },
          {
            name: "Resolved",
            value: data.ticket_status.RESOLVED,
          },
          {
            name: "Closed",
            value: data.ticket_status.CLOSED,
          },
        ]);
      } catch (error) {
        console.error(
          "Dashboard error:",
          error,
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const cards = [
    {
      title: "Total Assets",
      value: stats.assets,
      icon: Box,
      className: "blue",
      description: "Registered assets",
    },
    {
      title: "Inventory Items",
      value: stats.inventory,
      icon: ClipboardList,
      className: "purple",
      description: "Inventory records",
    },
    {
      title: "Assignments",
      value: stats.assignments,
      icon: ArrowUpRight,
      className: "green",
      description: "Current records",
    },
    {
      title: "Repair Tickets",
      value: stats.tickets,
      icon: Wrench,
      className: "orange",
      description: "Support tickets",
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-kicker">
            OVERVIEW
          </p>

          <h1>Dashboard</h1>

          <p className="page-description">
            Here's what's happening with your
            assets today.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              className="stat-card"
              key={card.title}
            >
              <div
                className={`stat-icon ${card.className}`}
              >
                <Icon size={21} />
              </div>

              <div className="stat-content">
                <span>{card.title}</span>

                <strong>
                  {loading
                    ? "..."
                    : card.value}
                </strong>

                <small>
                  {card.description}
                </small>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-charts">
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <div>
              <h2>Asset Status</h2>

              <p>
                Current status of registered
                assets
              </p>
            </div>
          </div>

          <div className="chart-container">
            {loading ? (
              <div className="chart-loading">
                Loading chart...
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={assetStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {assetStatus.map(
                      (entry, index) => (
                        <Cell
                          key={`asset-cell-${index}`}
                          fill={
                            [
                              "#2563eb",
                              "#16a34a",
                              "#f97316",
                              "#94a3b8",
                            ][index]
                          }
                        />
                      ),
                    )}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-legend">
            {assetStatus.map(
              (item, index) => (
                <div
                  className="legend-item"
                  key={item.name}
                >
                  <span
                    className="legend-dot"
                    style={{
                      background:
                        [
                          "#2563eb",
                          "#16a34a",
                          "#f97316",
                          "#94a3b8",
                        ][index],
                    }}
                  ></span>

                  <span>{item.name}</span>

                  <strong>
                    {item.value}
                  </strong>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="dashboard-card chart-card">
          <div className="card-header">
            <div>
              <h2>Repair Tickets</h2>

              <p>
                Tickets by current status
              </p>
            </div>
          </div>

          <div className="chart-container">
            {loading ? (
              <div className="chart-loading">
                Loading chart...
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={ticketStatus}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fontSize: 12,
                    }}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="value"
                    radius={[
                      5,
                      5,
                      0,
                      0,
                    ]}
                    fill="#2563eb"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>System Overview</h2>

              <p>
                Current asset management
                information
              </p>
            </div>
          </div>

          <div className="overview-list">
            <div className="overview-row">
              <div className="overview-icon">
                <Box size={18} />
              </div>

              <div>
                <strong>Assets</strong>

                <span>
                  Equipment and company
                  property
                </span>
              </div>

              <b>
                {loading
                  ? "..."
                  : stats.assets}
              </b>
            </div>

            <div className="overview-row">
              <div className="overview-icon">
                <ClipboardList size={18} />
              </div>

              <div>
                <strong>Inventory</strong>

                <span>
                  Consumable and stock
                  items
                </span>
              </div>

              <b>
                {loading
                  ? "..."
                  : stats.inventory}
              </b>
            </div>

            <div className="overview-row">
              <div className="overview-icon">
                <Ticket size={18} />
              </div>

              <div>
                <strong>
                  Repair Tickets
                </strong>

                <span>
                  Maintenance and repair
                  requests
                </span>
              </div>

              <b>
                {loading
                  ? "..."
                  : stats.tickets}
              </b>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Quick Status</h2>

              <p>
                System activity summary
              </p>
            </div>
          </div>

          <div className="status-box">
            <div className="status-icon">
              <AlertTriangle size={20} />
            </div>

            <div>
              <strong>
                Asset system is active
              </strong>

              <p>
                Your dashboard is connected
                to the Django REST API.
              </p>
            </div>
          </div>

          <div className="connection-status">
            <span className="status-dot"></span>

            API connection active
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
import { useEffect, useState } from 'react';
import { api } from '../api';
import './AdminDashboard.css';

function KpiCard({ label, value, sub, color }) {
  return (
    <div className={`kpi-card kpi-${color}`}>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function BarChart({ data, valueKey, labelKey, color }) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0));
  return (
    <div className="bar-chart">
      {data.map((d, i) => {
        const pct = max > 0 ? (Number(d[valueKey]) / max) * 100 : 0;
        return (
          <div key={i} className="bar-row">
            <div className="bar-label" title={d[labelKey]}>{d[labelKey]}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${pct}%`, background: color || 'var(--primary)' }}
              />
            </div>
            <div className="bar-val">{Number(d[valueKey]).toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
}

function MonthlyChart({ data }) {
  const max = Math.max(...data.map((d) => Number(d.count) || 0), 1);
  return (
    <div className="monthly-chart">
      {data.map((d, i) => {
        const pct = (Number(d.count) / max) * 100;
        const label = new Date(d.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        return (
          <div key={i} className="monthly-col">
            <div className="monthly-count">{d.count}</div>
            <div className="monthly-bar-wrap">
              <div className="monthly-bar" style={{ height: `${pct}%` }} />
            </div>
            <div className="monthly-label">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function StatusDots({ data }) {
  const colors = { confirmed: '#16a34a', requested: '#f59e0b', cancelled: '#dc2626' };
  const total = data.reduce((s, d) => s + Number(d.count), 0);
  return (
    <div className="status-dots">
      {data.map((d, i) => {
        const pct = total > 0 ? ((Number(d.count) / total) * 100).toFixed(1) : 0;
        return (
          <div key={i} className="status-item">
            <span className="status-dot" style={{ background: colors[d.status] || '#64748b' }} />
            <span className="status-name">{d.status}</span>
            <span className="status-count">{d.count}</span>
            <span className="status-pct">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error-message">Failed to load stats: {error}</div>;

  const o = stats.overview;
  const fmt = (n) => Number(n || 0).toLocaleString();
  const fmtMoney = (n) => '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview and analytics</p>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Total Hotels" value={fmt(o.total_hotels)} color="blue" />
        <KpiCard label="Total Rooms" value={fmt(o.total_rooms)} color="indigo" />
        <KpiCard label="Total Bookings" value={fmt(o.total_bookings)} color="purple" />
        <KpiCard label="Registered Users" value={fmt(o.total_users)} color="teal" />
        <KpiCard label="Total Revenue" value={fmtMoney(o.total_revenue)} color="green" />
        <KpiCard label="Avg Booking Value" value={fmtMoney(o.avg_booking_value)} color="amber" />
        <KpiCard label="Rooms Booked" value={fmt(o.rooms_booked)} color="sky" />
        <KpiCard label="Confirmed Revenue" value={fmtMoney(o.confirmed_revenue)} color="emerald" />
      </div>

      <div className="dashboard-grid">
        <div className="dash-card">
          <h3>Monthly Bookings (last 12 months)</h3>
          {stats.monthly_bookings?.length ? (
            <MonthlyChart data={stats.monthly_bookings} />
          ) : (
            <p className="no-data">No data</p>
          )}
        </div>

        <div className="dash-card">
          <h3>Booking Status</h3>
          {stats.bookings_by_status?.length ? (
            <StatusDots data={stats.bookings_by_status} />
          ) : (
            <p className="no-data">No data</p>
          )}
        </div>

        <div className="dash-card">
          <h3>Top Hotels by Bookings</h3>
          {stats.top_hotels?.length ? (
            <BarChart
              data={stats.top_hotels}
              labelKey="name"
              valueKey="booking_count"
              color="var(--primary)"
            />
          ) : (
            <p className="no-data">No data</p>
          )}
        </div>

        <div className="dash-card">
          <h3>Room Type Distribution</h3>
          {stats.room_type_distribution?.length ? (
            <BarChart
              data={stats.room_type_distribution}
              labelKey="room_type"
              valueKey="booking_count"
              color="#7c3aed"
            />
          ) : (
            <p className="no-data">No data</p>
          )}
        </div>

        <div className="dash-card dash-card-wide">
          <h3>Top Hotels Revenue</h3>
          {stats.top_hotels?.length ? (
            <div className="top-hotels-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Hotel</th>
                    <th>Location</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_hotels.map((h, i) => (
                    <tr key={i}>
                      <td className="rank">{i + 1}</td>
                      <td className="hotel-name">{h.name}</td>
                      <td className="hotel-loc">{h.location}</td>
                      <td>{fmt(h.booking_count)}</td>
                      <td className="revenue">{fmtMoney(h.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">No data</p>
          )}
        </div>
      </div>
    </div>
  );
}

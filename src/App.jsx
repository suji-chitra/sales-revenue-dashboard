
import { useMemo, useState } from "react";
import "./App.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Wallet,
  Upload,
  Search,
  Download,
} from "lucide-react";
import "./App.css";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement,
  Tooltip, Legend
);

const initialData = [
  { date: "2026-01-10", product: "Laptop", category: "Electronics", sales: 65000, cost: 50000, quantity: 2 },
  { date: "2026-01-15", product: "Phone", category: "Electronics", sales: 30000, cost: 22000, quantity: 3 },
  { date: "2026-02-05", product: "Chair", category: "Furniture", sales: 12000, cost: 8000, quantity: 4 },
  { date: "2026-02-18", product: "Laptop", category: "Electronics", sales: 70000, cost: 53000, quantity: 2 },
  { date: "2026-03-08", product: "Table", category: "Furniture", sales: 18000, cost: 12000, quantity: 3 },
  { date: "2026-03-20", product: "Phone", category: "Electronics", sales: 45000, cost: 33000, quantity: 5 },
  { date: "2026-04-12", product: "Chair", category: "Furniture", sales: 15000, cost: 9500, quantity: 5 },
  { date: "2026-04-22", product: "Laptop", category: "Electronics", sales: 80000, cost: 60000, quantity: 2 },
];

const money = value =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function App() {
  const [sales, setSales] = useState(initialData);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() =>
    sales.filter(item =>
      item.product.toLowerCase().includes(search.toLowerCase()) &&
      (category === "All" || item.category === category)
    ), [sales, search, category]);

  const revenue = filtered.reduce((sum, item) => sum + item.sales, 0);
  const profit = filtered.reduce((sum, item) => sum + item.sales - item.cost, 0);
  const orders = filtered.length;
  const units = filtered.reduce((sum, item) => sum + item.quantity, 0);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthlyRevenue = months.map((month, index) =>
    filtered.filter(item =>
      new Date(item.date).getMonth() === index
    ).reduce((sum, item) => sum + item.sales, 0)
  );

  const productNames = [...new Set(filtered.map(item => item.product))];
  const productRevenue = productNames.map(name =>
    filtered.filter(item => item.product === name)
      .reduce((sum, item) => sum + item.sales, 0)
  );

  function uploadCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const lines = e.target.result.trim().split(/\r?\n/);
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        const get = (row, key) => row[headers.indexOf(key)]?.trim();

        const parsed = lines.slice(1).map(line => {
          const row = line.split(",");
          return {
            date: get(row, "date"),
            product: get(row, "product"),
            category: get(row, "category"),
            sales: Number(get(row, "sales")),
            cost: Number(get(row, "cost")),
            quantity: Number(get(row, "quantity")),
          };
        });

        if (!parsed.length || parsed.some(r =>
          !r.date || !r.product || !r.category ||
          !Number.isFinite(r.sales) || !Number.isFinite(r.cost) ||
          !Number.isFinite(r.quantity)
        )) {
          throw new Error("Invalid CSV data");
        }

        setSales(parsed);
        setSearch("");
        setCategory("All");
      } catch {
        alert("Invalid CSV. Check the column names and values.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function downloadCSV() {
    const rows = [
      ["date", "product", "category", "sales", "cost", "quantity"],
      ...filtered.map(r => [
        r.date, r.product, r.category, r.sales, r.cost, r.quantity
      ]),
    ];
    const csv = rows.map(row =>
      row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "sales-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const monthlyChart = {
    labels: months,
    datasets: [{
      label: "Revenue (₹)",
      data: monthlyRevenue,
      borderColor: "#2563eb",
      backgroundColor: "#dbeafe",
      fill: true,
      tension: 0.35,
    }],
  };

  const productChart = {
    labels: productNames,
    datasets: [{
      label: "Revenue (₹)",
      data: productRevenue,
      backgroundColor: ["#2563eb", "#14b8a6", "#f59e0b", "#a78bfa"],
      borderRadius: 7,
    }],
  };

  const categoryTotals = [...new Set(filtered.map(r => r.category))]
    .map(name => ({
      name,
      value: filtered.filter(r => r.category === name)
        .reduce((sum, r) => sum + r.sales, 0),
    }));

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Sales<span>Flow</span></h2>
        <p className="side-label">WORKSPACE</p>
        <div className="nav-active">
          <LayoutDashboard size={19} /> Dashboard
        </div>
        <p className="side-note">Sales Analytics</p>
        <div className="sidebar-bottom">Business Intelligence<br />
          <small>Analytics Dashboard v1.0</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">OVERVIEW</p>
            <h1>Sales Dashboard</h1>
            <p className="muted">Monitor your business performance</p>
          </div>
          <label className="upload-btn">
            <Upload size={17} /> Import CSV
            <input type="file" accept=".csv,text/csv" onChange={uploadCSV} />
          </label>
        </header>

        <section className="toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="All">All Categories</option>
            {[...new Set(sales.map(r => r.category))].map(c =>
              <option key={c} value={c}>{c}</option>
            )}
          </select>
          <button className="export-btn" onClick={downloadCSV}>
            <Download size={16} /> Export
          </button>
        </section>

        <section className="kpi-grid">
          <article className="kpi">
            <div className="kpi-top"><span>Total Revenue</span><Wallet /></div>
            <h2>{money(revenue)}</h2>
            <p className="positive"><TrendingUp size={15} /> Sales generated</p>
          </article>
          <article className="kpi">
            <div className="kpi-top"><span>Total Profit</span><TrendingUp /></div>
            <h2>{money(profit)}</h2>
            <p className="positive">Revenue − Cost</p>
          </article>
          <article className="kpi">
            <div className="kpi-top"><span>Total Orders</span><ShoppingCart /></div>
            <h2>{orders}</h2>
            <p className="muted">Sales records</p>
          </article>
          <article className="kpi">
            <div className="kpi-top"><span>Units Sold</span><ShoppingCart /></div>
            <h2>{units}</h2>
            <p className="muted">Total quantity</p>
          </article>
        </section>

        <section className="charts-grid">
          <article className="panel revenue-panel">
            <h3>Revenue Trend</h3>
            <p className="muted">Monthly sales performance</p>
            <Line data={monthlyChart} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: {
                  callback: value => "₹" + Number(value).toLocaleString("en-IN")
                }}
              }
            }} />
          </article>
          <article className="panel">
            <h3>Revenue by Product</h3>
            <p className="muted">Compare product performance</p>
            <div className="bar-wrap">
              <Bar data={productChart} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
              }} />
            </div>
          </article>
          <article className="panel category-panel">
            <h3>Category Breakdown</h3>
            <p className="muted">Revenue distribution</p>
            <div className="doughnut-wrap">
              <Doughnut data={{
                labels: categoryTotals.map(c => c.name),
                datasets: [{
                  data: categoryTotals.map(c => c.value),
                  backgroundColor: ["#2563eb", "#14b8a6", "#f59e0b", "#a78bfa"],
                  borderWidth: 0,
                }]
              }} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } }
              }} />
            </div>
          </article>
        </section>

        <section className="panel table-panel">
          <div className="table-heading">
            <div>
              <h3>Recent Sales</h3>
              <p className="muted">Transaction details</p>
            </div>
            <span className="record-count">{filtered.length} records</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead><tr>
                <th>Date</th><th>Product</th><th>Category</th>
                <th>Quantity</th><th>Revenue</th><th>Profit</th>
              </tr></thead>
              <tbody>
                {filtered.map((item, index) => (
                  <tr key={`${item.date}-${item.product}-${index}`}>
                    <td>{item.date}</td><td><strong>{item.product}</strong></td>
                    <td><span className="category-tag">{item.category}</span></td>
                    <td>{item.quantity}</td><td>{money(item.sales)}</td>
                    <td className="profit-cell">{money(item.sales - item.cost)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr>
                  <td colSpan="6" className="empty">No matching sales found.</td>
                </tr>}
              </tbody>
            </table>
          </div>
        </section>
        <footer>SalesFlow Analytics · Demo data · Built with React</footer>
      </main>
    </div>
  );
}

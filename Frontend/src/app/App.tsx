import { useState, useMemo, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Receipt, BarChart2, Plus, X, Wallet, Bell,
  ChevronRight, Search, Home, Car, Utensils, ShoppingBag, Coffee,
  Zap, Heart, Tv, TrendingUp, ArrowUpRight, ArrowDownRight, LogOut,
  Download, Target, BookOpen, ShoppingCart, Plane, Landmark, PiggyBank,
  Pencil, Check, AlertTriangle, TrendingDown, Calendar, Filter,
} from "lucide-react";
import {
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend,
  LineChart, Line,
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { expensesApi, Expense, Category, Summary } from "../lib/expenses";
import { seedDefaultCategories } from "../lib/seedCategories";

type Tab = "overview" | "transactions" | "budgets" | "analytics";

// ── Category metadata with full color system ──────────────────────────────────
const CAT_META: Record<string, {
  icon: React.ElementType; color: string; bg: string; glow: string; label: string;
}> = {
  Housing:       { icon: Home,         color: "#58a6ff", bg: "rgba(88,166,255,0.12)",  glow: "rgba(88,166,255,0.25)",  label: "Housing"       },
  Food:          { icon: Utensils,     color: "#3fb950", bg: "rgba(63,185,80,0.12)",   glow: "rgba(63,185,80,0.25)",   label: "Food & Dining" },
  Transport:     { icon: Car,          color: "#e3b341", bg: "rgba(227,179,65,0.12)",  glow: "rgba(227,179,65,0.25)",  label: "Transport"     },
  Shopping:      { icon: ShoppingBag,  color: "#bc8cff", bg: "rgba(188,140,255,0.12)", glow: "rgba(188,140,255,0.25)", label: "Shopping"      },
  Coffee:        { icon: Coffee,       color: "#f0883e", bg: "rgba(240,136,62,0.12)",  glow: "rgba(240,136,62,0.25)",  label: "Coffee"        },
  Utilities:     { icon: Zap,          color: "#39d353", bg: "rgba(57,211,83,0.12)",   glow: "rgba(57,211,83,0.25)",   label: "Utilities"     },
  Health:        { icon: Heart,        color: "#f85149", bg: "rgba(248,81,73,0.12)",   glow: "rgba(248,81,73,0.25)",   label: "Health"        },
  Entertainment: { icon: Tv,           color: "#ff6e6e", bg: "rgba(255,110,110,0.12)", glow: "rgba(255,110,110,0.25)", label: "Entertainment" },
  Income:        { icon: TrendingUp,   color: "#3fb950", bg: "rgba(63,185,80,0.12)",   glow: "rgba(63,185,80,0.25)",   label: "Income"        },
  Education:     { icon: BookOpen,     color: "#79c0ff", bg: "rgba(121,192,255,0.12)", glow: "rgba(121,192,255,0.25)", label: "Education"     },
  Groceries:     { icon: ShoppingCart, color: "#56d364", bg: "rgba(86,211,100,0.12)",  glow: "rgba(86,211,100,0.25)",  label: "Groceries"     },
  Travel:        { icon: Plane,        color: "#d2a8ff", bg: "rgba(210,168,255,0.12)", glow: "rgba(210,168,255,0.25)", label: "Travel"        },
  EMI:           { icon: Landmark,     color: "#ff7b72", bg: "rgba(255,123,114,0.12)", glow: "rgba(255,123,114,0.25)", label: "EMI / Loan"    },
  Investment:    { icon: PiggyBank,    color: "#ffa657", bg: "rgba(255,166,87,0.12)",  glow: "rgba(255,166,87,0.25)",  label: "Investment"    },
};

function getCat(name: string) {
  return CAT_META[name] ?? { icon: Wallet, color: "#7d8590", bg: "rgba(125,133,144,0.12)", glow: "rgba(125,133,144,0.2)", label: name };
}

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  "₹" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` :
  n >= 1000   ? `₹${(n / 1000).toFixed(1)}K` : fmt(n);
const fmtDate = (s: string) =>
  new Date(s + "T12:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtDay = (s: string) =>
  new Date(s + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short" });

const TT = { backgroundColor: "#0d1420", border: "1px solid rgba(99,130,168,0.2)", borderRadius: "10px", fontSize: "12px", color: "#e6edf3", padding: "8px 12px" };

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, trend, accent, alert }: {
  label: string; value: string; sub: string;
  trend?: "up" | "down" | "neutral"; accent?: string; alert?: boolean;
}) {
  const borderColor = alert ? "rgba(248,81,73,0.4)" : accent ? `${accent}40` : "rgba(99,130,168,0.12)";
  const glowColor   = alert ? "rgba(248,81,73,0.08)" : accent ? `${accent}10` : "transparent";
  return (
    <div className="hover-lift rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg,#0f1620 0%,#111927 100%)", border: `1px solid ${borderColor}`, boxShadow: `0 2px 16px ${glowColor}` }}>
      {accent && (
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.06] pointer-events-none"
          style={{ background: accent, transform: "translate(40%,-40%)" }} />
      )}
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-['DM_Mono',monospace] text-2xl font-semibold text-foreground">{value}</span>
      <div className="flex items-center gap-1.5">
        {trend === "up"   && <ArrowUpRight   className="w-3.5 h-3.5" style={{ color: "#3fb950" }} />}
        {trend === "down" && <ArrowDownRight className="w-3.5 h-3.5" style={{ color: "#f85149" }} />}
        {alert            && <AlertTriangle  className="w-3.5 h-3.5" style={{ color: "#f85149" }} />}
        <span className="text-xs text-muted-foreground">{sub}</span>
      </div>
    </div>
  );
}

// ── Transaction Row ────────────────────────────────────────────────────────────
function TxRow({ tx, onDelete, onEdit }: {
  tx: Expense; onDelete: (id: string) => void; onEdit: (tx: Expense) => void;
}) {
  const meta = getCat(tx.category?.name ?? "");
  const Icon = meta.icon;
  const isIncome = tx.type === "income";
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 transition-colors group cursor-default"
      style={{ borderBottom: "1px solid rgba(99,130,168,0.07)" }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,130,168,0.04)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
      {/* Category icon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
        style={{ background: meta.bg, boxShadow: `0 0 0 1px ${meta.glow}` }}>
        <Icon className="w-4 h-4" style={{ color: meta.color }} />
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{tx.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
            style={{ background: meta.bg, color: meta.color }}>{tx.category?.name}</span>
          <span className="text-xs text-muted-foreground">{fmtDate(tx.date)}</span>
          {tx.note && <span className="text-xs text-muted-foreground italic truncate max-w-[120px]">"{tx.note}"</span>}
        </div>
      </div>
      {/* Amount */}
      <span className="font-['DM_Mono',monospace] text-sm font-semibold shrink-0"
        style={{ color: isIncome ? "#3fb950" : "#e6edf3" }}>
        {isIncome ? "+" : "−"}{fmt(tx.amount)}
      </span>
      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-2 transition-opacity">
        <button onClick={() => onEdit(tx)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(tx.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab({ expenses, summary, onViewAll, onDelete, onEdit }: {
  expenses: Expense[]; summary: Summary; onViewAll: () => void;
  onDelete: (id: string) => void; onEdit: (tx: Expense) => void;
}) {
  const savingsRate = summary.income > 0 ? ((summary.balance / summary.income) * 100).toFixed(1) : "0.0";
  const daysInMonth = new Date().getDate();
  const dailyAvg = summary.expense / daysInMonth;

  const last7 = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days[d.toISOString().split("T")[0]] = 0;
    }
    expenses.filter(t => t.type === "expense" && days[t.date] !== undefined)
      .forEach(t => { days[t.date] += Number(t.amount); });
    return Object.entries(days).map(([date, amt]) => ({ day: fmtDay(date), amt }));
  }, [expenses]);

  const catSpending = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.filter(t => t.type === "expense").forEach(t => {
      const n = t.category?.name ?? "Other";
      map[n] = (map[n] || 0) + Number(t.amount);
    });
    return Object.entries(map).map(([cat, val]) => ({ cat, val, color: getCat(cat).color }))
      .sort((a, b) => b.val - a.val);
  }, [expenses]);

  const topCat = catSpending[0];

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Income"  value={fmt(summary.income)}  sub="This period"   trend="up"   accent="#3fb950" />
        <StatCard label="Total Spent"   value={fmt(summary.expense)} sub={`${expenses.filter(t=>t.type==="expense").length} transactions`} trend="down" accent="#f85149" />
        <StatCard label="Balance"       value={fmt(summary.balance)} sub="Income − Expenses"
          trend={summary.balance >= 0 ? "up" : "down"} accent={summary.balance >= 0 ? "#58a6ff" : "#f85149"} alert={summary.balance < 0} />
        <StatCard label="Savings Rate"  value={`${savingsRate}%`}   sub={`${fmt(summary.balance)} saved`}
          trend={parseFloat(savingsRate) > 20 ? "up" : "neutral"} accent="#bc8cff" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Daily Average"  value={fmt(dailyAvg)}     sub="per day this month"    accent="#e3b341" />
        <StatCard label="Top Category"   value={topCat?.cat ?? "—"} sub={topCat ? `${fmt(topCat.val)} spent` : "No expenses yet"} accent={topCat ? getCat(topCat.cat).color : undefined} />
        <StatCard label="Transactions"   value={String(expenses.length)} sub="total recorded"  accent="#56d364" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Donut chart */}
          <div className="rounded-2xl p-5" style={{ background: "linear-gradient(160deg,#0f1620,#111927)", border: "1px solid rgba(99,130,168,0.12)" }}>
            <h3 className="text-sm font-semibold mb-0.5">Spending by Category</h3>
            <p className="text-xs text-muted-foreground mb-4">All time breakdown</p>
            {catSpending.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No expenses yet</div>
            ) : (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={170}>
                    <RechartsPieChart>
                      <Pie data={catSpending} dataKey="val" cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} strokeWidth={0}>
                        {catSpending.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={TT} formatter={(v: number) => [fmt(v), ""]} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="font-['DM_Mono',monospace] text-sm font-semibold">{fmtShort(summary.expense)}</div>
                      <div className="text-[10px] text-muted-foreground">total spent</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mt-1">
                  {catSpending.slice(0, 6).map(({ cat, val, color }) => {
                    const pct = summary.expense > 0 ? (val / summary.expense) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-xs text-muted-foreground">{getCat(cat).label}</span>
                          </div>
                          <span className="font-['DM_Mono',monospace] text-xs">{fmtShort(val)}</span>
                        </div>
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Last 7 days */}
          <div className="rounded-2xl p-5" style={{ background: "linear-gradient(160deg,#0f1620,#111927)", border: "1px solid rgba(99,130,168,0.12)" }}>
            <h3 className="text-sm font-semibold mb-0.5">Last 7 Days</h3>
            <p className="text-xs text-muted-foreground mb-3">Daily spending</p>
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={last7} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6e7a8a" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT} formatter={(v: number) => [fmt(v), "Spent"]} />
                <Bar dataKey="amt" radius={[4, 4, 0, 0]}>
                  {last7.map((e, i) => <Cell key={i} fill={e.amt > 0 ? "#58a6ff" : "#1a2235"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg,#0f1620,#111927)", border: "1px solid rgba(99,130,168,0.12)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(99,130,168,0.1)" }}>
            <div>
              <h3 className="text-sm font-semibold">Recent Transactions</h3>
              <p className="text-xs text-muted-foreground">Latest activity</p>
            </div>
            <button onClick={onViewAll} className="flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity font-medium">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            {expenses.slice(0, 8).length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No transactions yet</div>
            ) : (
              expenses.slice(0, 8).map(tx => <TxRow key={tx.id} tx={tx} onDelete={onDelete} onEdit={onEdit} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Transactions Tab ───────────────────────────────────────────────────────────
function TransactionsTab({ expenses, categories, onDelete, onEdit, onExport }: {
  expenses: Expense[]; categories: Category[];
  onDelete: (id: string) => void; onEdit: (tx: Expense) => void; onExport: () => void;
}) {
  const [filter, setFilter]       = useState<"all"|"income"|"expense">("all");
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sortBy, setSortBy]       = useState<"date"|"amount">("date");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]     = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...expenses];
    if (filter !== "all") list = list.filter(t => t.type === filter);
    if (catFilter !== "all") list = list.filter(t => t.category?.name === catFilter);
    if (search) list = list.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.note?.toLowerCase().includes(search.toLowerCase()));
    if (startDate) list = list.filter(t => t.date >= startDate);
    if (endDate)   list = list.filter(t => t.date <= endDate);
    list.sort((a, b) => sortBy === "amount"
      ? Number(b.amount) - Number(a.amount)
      : b.date.localeCompare(a.date));
    return list;
  }, [expenses, filter, catFilter, search, startDate, endDate, sortBy]);

  const totalSpent  = filtered.filter(t => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0);
  const totalIncome = filtered.filter(t => t.type === "income").reduce((a, t) => a + Number(t.amount), 0);

  const activeFilters = (catFilter !== "all" ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by title or note…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
            style={{ background: "#0f1620", border: "1px solid rgba(99,130,168,0.14)", }} />
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          {/* Type pills */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(99,130,168,0.14)" }}>
            {(["all","income","expense"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-2.5 text-sm capitalize transition-colors"
                style={filter === f
                  ? { background: f === "income" ? "rgba(63,185,80,0.2)" : f === "expense" ? "rgba(248,81,73,0.2)" : "rgba(88,166,255,0.2)",
                      color: f === "income" ? "#3fb950" : f === "expense" ? "#f85149" : "#58a6ff", fontWeight: 600 }
                  : { color: "#6e7a8a" }}>
                {f}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2.5 rounded-xl text-sm text-foreground focus:outline-none"
            style={{ background: "#0f1620", border: "1px solid rgba(99,130,168,0.14)" }}>
            <option value="date">Date ↓</option>
            <option value="amount">Amount ↓</option>
          </select>
          <button onClick={() => setShowFilters(p => !p)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors relative"
            style={showFilters
              ? { background: "rgba(88,166,255,0.15)", border: "1px solid rgba(88,166,255,0.4)", color: "#58a6ff" }
              : { background: "#0f1620", border: "1px solid rgba(99,130,168,0.14)", color: "#6e7a8a" }}>
            <Filter className="w-4 h-4" />Filters
            {activeFilters > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                style={{ background: "#58a6ff", color: "#090e17" }}>{activeFilters}</span>
            )}
          </button>
          <button onClick={onExport}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors"
            style={{ background: "#0f1620", border: "1px solid rgba(99,130,168,0.14)", color: "#6e7a8a" }}>
            <Download className="w-4 h-4" />CSV
          </button>
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3"
          style={{ background: "#0d1420", border: "1px solid rgba(88,166,255,0.15)" }}>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Category</label>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm text-foreground focus:outline-none"
              style={{ background: "#0f1620", border: "1px solid rgba(99,130,168,0.14)" }}>
              <option value="all">All categories</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">From</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm text-foreground focus:outline-none"
              style={{ background: "#0f1620", border: "1px solid rgba(99,130,168,0.14)" }} />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">To</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm text-foreground focus:outline-none"
              style={{ background: "#0f1620", border: "1px solid rgba(99,130,168,0.14)" }} />
          </div>
          {activeFilters > 0 && (
            <button onClick={() => { setCatFilter("all"); setStartDate(""); setEndDate(""); }}
              className="text-xs col-span-full text-left" style={{ color: "#f85149" }}>
              ✕ Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Showing", value: `${filtered.length} txns`, color: "#7d8590" },
          { label: "Spent",   value: fmt(totalSpent),   color: "#f85149" },
          { label: "Received",value: fmt(totalIncome),  color: "#3fb950" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3 text-center"
            style={{ background: "#0f1620", border: "1px solid rgba(99,130,168,0.1)" }}>
            <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
            <div className="font-['DM_Mono',monospace] text-sm font-semibold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Transaction list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg,#0f1620,#111927)", border: "1px solid rgba(99,130,168,0.12)" }}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No transactions found</div>
        ) : (
          filtered.map(tx => <TxRow key={tx.id} tx={tx} onDelete={onDelete} onEdit={onEdit} />)
        )}
      </div>
    </div>
  );
}

// ── Budgets Tab ────────────────────────────────────────────────────────────────
const DEFAULT_LIMITS: Record<string, number> = {
  Food:5000,Transport:3000,Housing:15000,Shopping:4000,Coffee:1000,
  Utilities:2000,Health:2000,Entertainment:1500,Education:3000,
  Groceries:6000,Travel:8000,EMI:10000,Investment:5000,
};

function BudgetsTab({ expenses }: { expenses: Expense[] }) {
  const [limits, setLimits] = useState<Record<string,number>>(() => {
    try { return JSON.parse(localStorage.getItem("budgetLimits")||"{}"); } catch { return {}; }
  });
  const [editing, setEditing] = useState<string|null>(null);
  const [editVal, setEditVal] = useState("");
  const [editingTotal, setEditingTotal] = useState(false);
  const [totalEditVal, setTotalEditVal] = useState("");

  const catTotals = useMemo(() => {
    const map: Record<string,number> = {};
    expenses.filter(t => t.type==="expense").forEach(t => {
      const n = t.category?.name??"Other";
      map[n] = (map[n]||0) + Number(t.amount);
    });
    return map;
  }, [expenses]);

  const allCats = useMemo(() => {
    const s = new Set([...Object.keys(catTotals), ...Object.keys(CAT_META).filter(k => k!=="Income")]);
    return [...s];
  }, [catTotals]);

  const saveLimits = (u: Record<string,number>) => {
    setLimits(u); localStorage.setItem("budgetLimits",JSON.stringify(u));
  };

  const totalBudget = allCats.reduce((a,c) => a+(limits[c]??DEFAULT_LIMITS[c]??0),0);
  const totalSpent  = Object.values(catTotals).reduce((a,b)=>a+b,0);
  const overCount   = allCats.filter(c => catTotals[c]>(limits[c]??DEFAULT_LIMITS[c]??Infinity)).length;

  // Distribute new total budget proportionally across all categories
  const applyTotalBudget = (newTotal: number) => {
    if (newTotal <= 0 || allCats.length === 0) return;
    const perCat = Math.round(newTotal / allCats.length);
    const updated: Record<string,number> = {};
    allCats.forEach(c => { updated[c] = perCat; });
    saveLimits(updated);
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget — editable */}
        <div className="hover-lift rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
          style={{ background:"linear-gradient(160deg,#0f1620,#111927)", border:"1px solid rgba(88,166,255,0.3)", boxShadow:"0 2px 16px rgba(88,166,255,0.08)" }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.06] pointer-events-none"
            style={{ background:"#58a6ff", transform:"translate(40%,-40%)" }} />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Budget</span>
          {editingTotal ? (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-['DM_Mono',monospace] text-sm">₹</span>
              <input type="number" value={totalEditVal} onChange={e=>setTotalEditVal(e.target.value)} autoFocus
                className="flex-1 px-2 py-1 rounded-lg text-sm text-foreground focus:outline-none font-['DM_Mono',monospace]"
                style={{ background:"#090e17", border:"1px solid rgba(88,166,255,0.5)" }}
                onKeyDown={e=>{ if(e.key==="Enter"){applyTotalBudget(parseFloat(totalEditVal)||totalBudget);setEditingTotal(false);} if(e.key==="Escape")setEditingTotal(false); }}/>
              <button onClick={()=>{applyTotalBudget(parseFloat(totalEditVal)||totalBudget);setEditingTotal(false);}}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background:"rgba(88,166,255,0.15)", color:"#58a6ff" }}>
                <Check className="w-3.5 h-3.5"/>
              </button>
              <button onClick={()=>setEditingTotal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent/60">
                <X className="w-3.5 h-3.5"/>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="font-['DM_Mono',monospace] text-2xl font-semibold text-foreground">{fmt(totalBudget)}</span>
              <button onClick={()=>{setTotalEditVal(String(Math.round(totalBudget)));setEditingTotal(true);}}
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                style={{ background:"rgba(88,166,255,0.1)", border:"1px solid rgba(88,166,255,0.25)", color:"#58a6ff" }}
                title="Edit total budget — distributes evenly across all categories">
                <Pencil className="w-3.5 h-3.5"/>
              </button>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Monthly · click ✏️ to edit</span>
          </div>
        </div>

        <StatCard label="Total Spent"  value={fmt(totalSpent)}  sub={`${((totalSpent/totalBudget)*100||0).toFixed(0)}% used`} trend="down" accent="#f85149" />
        <StatCard label="Remaining"    value={fmt(totalBudget-totalSpent)} sub="Left to spend" trend={totalBudget-totalSpent>=0?"up":"down"} accent="#3fb950" />
        <StatCard label="Over Limit"   value={`${overCount}`}  sub="categories over budget" alert={overCount>0} accent="#f85149" />
      </div>

      <p className="text-xs text-muted-foreground">Click ✏️ on Total Budget to set an overall monthly limit (splits evenly). Click ✏️ on each card for per-category limits.</p>

      {/* Category budget cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allCats.map(name => {
          const meta  = getCat(name);
          const Icon  = meta.icon;
          const spent = catTotals[name]??0;
          const limit = limits[name]??DEFAULT_LIMITS[name]??5000;
          const pct   = limit>0 ? Math.min((spent/limit)*100,100):0;
          const col   = pct>=100?"#f85149":pct>=80?"#e3b341":"#3fb950";
          const remaining = limit-spent;
          const isEditing = editing===name;

          return (
            <div key={name} className="hover-lift rounded-2xl p-5 relative overflow-hidden"
              style={{ background: `linear-gradient(160deg,${meta.bg} 0%,#0f1620 60%)`, border: `1px solid ${pct>=100?"rgba(248,81,73,0.35)":meta.glow}` }}>
              {/* Background blob */}
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none opacity-[0.07]"
                style={{ background: meta.color, transform:"translate(30%,-30%)" }} />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: meta.bg, boxShadow:`0 0 0 1px ${meta.glow}` }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: meta.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{meta.label}</div>
                    <div className="text-[10px] text-muted-foreground">{pct.toFixed(0)}% used</div>
                  </div>
                </div>
                <span className="font-['DM_Mono',monospace] text-xs font-bold px-2 py-1 rounded-lg"
                  style={{ color: col, background: `${col}20`, border: `1px solid ${col}40` }}>
                  {pct>=100?"OVER":pct>=80?"HIGH":"OK"}
                </span>
              </div>

              <div className="font-['DM_Mono',monospace] text-2xl font-bold mb-1">{fmtShort(spent)}</div>

              {isEditing ? (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-muted-foreground font-['DM_Mono',monospace]">₹</span>
                  <input type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} autoFocus
                    className="flex-1 px-3 py-1.5 rounded-lg text-sm text-foreground focus:outline-none"
                    style={{ background:"#0f1620", border:`1px solid ${meta.color}60` }} />
                  <button onClick={()=>{saveLimits({...limits,[name]:parseFloat(editVal)||limit});setEditing(null);}}
                    className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:meta.bg, color:meta.color }}>
                    <Check className="w-3.5 h-3.5"/>
                  </button>
                  <button onClick={()=>setEditing(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent/60">
                    <X className="w-3.5 h-3.5"/>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground font-['DM_Mono',monospace]">of {fmtShort(limit)}</span>
                  <button onClick={()=>{setEditing(name);setEditVal(String(limit));}}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
                    <Pencil className="w-3.5 h-3.5"/>
                  </button>
                </div>
              )}

              <div className="progress-bar h-2 rounded-full bg-muted/50">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width:`${pct}%`, background:`linear-gradient(90deg,${col}cc,${col})` }} />
              </div>

              <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                <span>{fmtShort(spent)} spent</span>
                <span style={{ color: remaining<0?"#f85149":undefined }}>
                  {remaining>=0?`${fmtShort(remaining)} left`:`${fmtShort(Math.abs(remaining))} over`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Analytics Tab ──────────────────────────────────────────────────────────────
function AnalyticsTab({ expenses }: { expenses: Expense[] }) {
  const monthlyData = useMemo(() => {
    const map: Record<string,{income:number;expenses:number}> = {};
    expenses.forEach(tx => {
      const key = tx.date.slice(0,7);
      if(!map[key]) map[key]={income:0,expenses:0};
      if(tx.type==="income") map[key].income+=Number(tx.amount);
      else map[key].expenses+=Number(tx.amount);
    });
    return Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>({
      month: new Date(key+"-01").toLocaleDateString("en-IN",{month:"short",year:"2-digit"}),
      ...v, savings: v.income-v.expenses,
    }));
  }, [expenses]);

  const dailyData = useMemo(() => {
    const map: Record<string,number> = {};
    expenses.filter(t=>t.type==="expense").forEach(t=>{map[t.date]=(map[t.date]||0)+Number(t.amount);});
    return Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).slice(-30)
      .map(([date,amt])=>({ date: new Date(date+"T12:00:00").toLocaleDateString("en-IN",{month:"short",day:"numeric"}), amt }));
  }, [expenses]);

  const catBar = useMemo(() => {
    const map: Record<string,number> = {};
    expenses.filter(t=>t.type==="expense").forEach(t=>{
      const n=t.category?.name??"Other";
      map[n]=(map[n]||0)+Number(t.amount);
    });
    return Object.entries(map).sort(([,a],[,b])=>b-a).map(([name,spent])=>({
      name: name.length>8?name.slice(0,7)+"…":name, fullName: name, spent, color:getCat(name).color,
    }));
  }, [expenses]);

  const biggestExp = useMemo(()=>expenses.filter(t=>t.type==="expense").sort((a,b)=>Number(b.amount)-Number(a.amount))[0],[expenses]);
  const totalIncome  = expenses.filter(t=>t.type==="income").reduce((a,t)=>a+Number(t.amount),0);
  const totalExpense = expenses.filter(t=>t.type==="expense").reduce((a,t)=>a+Number(t.amount),0);

  // Smart axis formatter — shows actual value if < 1000, else shows k
  const axisFormatter = (v: number) => {
    if (v === 0) return "₹0";
    if (v >= 100000) return `₹${(v/100000).toFixed(1)}L`;
    if (v >= 1000)   return `₹${(v/1000).toFixed(0)}k`;
    return `₹${v}`;
  };

  // Smart domain — adds 10% padding above max value so bars don't touch the top
  const getMaxDomain = (data: any[], keys: string[]) => {
    const max = Math.max(...data.flatMap(d => keys.map(k => Number(d[k]||0))));
    if (max === 0) return 100;
    return Math.ceil(max * 1.15);
  };

  const CARD_STYLE = { background:"linear-gradient(160deg,#0f1620,#111927)", border:"1px solid rgba(99,130,168,0.12)", borderRadius:"1rem" };

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Income"  value={fmt(totalIncome)}  sub="All time" trend="up"   accent="#3fb950" />
        <StatCard label="Total Expense" value={fmt(totalExpense)} sub="All time" trend="down" accent="#f85149" />
        <StatCard label="Net Savings"   value={fmt(totalIncome-totalExpense)} sub="Income − Expense"
          trend={totalIncome-totalExpense>=0?"up":"down"} accent="#58a6ff" alert={totalIncome-totalExpense<0} />
        <StatCard label="Biggest Spend" value={biggestExp?fmt(Number(biggestExp.amount)):"—"}
          sub={biggestExp?.title??"No expenses"} trend="down" accent="#e3b341" />
      </div>

      {/* Monthly area chart */}
      <div className="p-5" style={CARD_STYLE}>
        <h3 className="text-sm font-semibold mb-0.5">Monthly Income vs Expenses</h3>
        <p className="text-xs text-muted-foreground mb-5">Cash flow by month</p>
        {monthlyData.length===0 ? <div className="py-10 text-center text-sm text-muted-foreground">No data yet</div> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData} margin={{top:10,right:10,left:10,bottom:0}}>
              <defs>
                <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3fb950" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#3fb950" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f85149" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f85149" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,168,0.07)"/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:"#6e7a8a"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:"#6e7a8a"}} axisLine={false} tickLine={false}
                tickFormatter={axisFormatter}
                domain={[0, getMaxDomain(monthlyData, ["income","expenses"])]}
                width={60}/>
              <Tooltip contentStyle={TT} formatter={(v:number, name:string)=>[fmt(v), name]}/>
              <Area type="monotone" dataKey="income"   name="Income"   stroke="#3fb950" strokeWidth={2} fill="url(#gInc)" dot={{fill:"#3fb950",r:3}} activeDot={{r:5}}/>
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f85149" strokeWidth={2} fill="url(#gExp)" dot={{fill:"#f85149",r:3}} activeDot={{r:5}}/>
              <Legend formatter={v=><span style={{fontSize:11,color:"#6e7a8a"}}>{v}</span>}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily trend */}
        <div className="p-5" style={CARD_STYLE}>
          <h3 className="text-sm font-semibold mb-0.5">Daily Spending (Last 30 Days)</h3>
          <p className="text-xs text-muted-foreground mb-5">Day-by-day pattern</p>
          {dailyData.length===0 ? <div className="py-10 text-center text-sm text-muted-foreground">No data</div> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData} margin={{top:10,right:10,left:10,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,168,0.07)"/>
                <XAxis dataKey="date" tick={{fontSize:10,fill:"#6e7a8a"}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
                <YAxis tick={{fontSize:10,fill:"#6e7a8a"}} axisLine={false} tickLine={false}
                  tickFormatter={axisFormatter}
                  domain={[0, getMaxDomain(dailyData, ["amt"])]}
                  width={60}/>
                <Tooltip contentStyle={TT} formatter={(v:number)=>[fmt(v),"Spent"]}/>
                <Line type="monotone" dataKey="amt" stroke="#58a6ff" strokeWidth={2}
                  dot={{fill:"#58a6ff",r:3}} activeDot={{r:6, fill:"#58a6ff", stroke:"#fff", strokeWidth:2}}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category bar — horizontal */}
        <div className="p-5" style={CARD_STYLE}>
          <h3 className="text-sm font-semibold mb-0.5">Top Spending Categories</h3>
          <p className="text-xs text-muted-foreground mb-5">Click a bar to see amount</p>
          {catBar.length===0 ? <div className="py-10 text-center text-sm text-muted-foreground">No data</div> : (
            <ResponsiveContainer width="100%" height={Math.max(180, catBar.length * 36)}>
              <BarChart data={catBar} layout="vertical" margin={{top:4,right:60,left:4,bottom:0}}>
                <XAxis type="number" tick={{fontSize:10,fill:"#6e7a8a"}} axisLine={false} tickLine={false}
                  tickFormatter={axisFormatter}
                  domain={[0, getMaxDomain(catBar, ["spent"])]}/>
                <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:"#6e7a8a"}} axisLine={false} tickLine={false} width={60}/>
                <Tooltip contentStyle={TT}
                  formatter={(v:number, _name:string, props:any)=>[fmt(v), props?.payload?.fullName ?? "Spent"]}/>
                <Bar dataKey="spent" radius={[0,6,6,0]} label={{ position:"right", formatter:(v:number)=>fmt(v), fill:"#6e7a8a", fontSize:10 }}>
                  {catBar.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Monthly savings */}
      {monthlyData.length>0 && (
        <div className="p-5" style={CARD_STYLE}>
          <h3 className="text-sm font-semibold mb-0.5">Monthly Savings</h3>
          <p className="text-xs text-muted-foreground mb-5">Green = saved money · Red = overspent</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} margin={{top:10,right:10,left:10,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,168,0.07)" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:"#6e7a8a"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:"#6e7a8a"}} axisLine={false} tickLine={false}
                tickFormatter={axisFormatter} width={60}/>
              <Tooltip contentStyle={TT} formatter={(v:number)=>[fmt(v),"Savings"]}/>
              <Bar dataKey="savings" radius={[4,4,0,0]} label={{ position:"top", formatter:(v:number)=>fmt(v), fill:"#6e7a8a", fontSize:10 }}>
                {monthlyData.map((e,i)=><Cell key={i} fill={e.savings>=0?"#3fb950":"#f85149"}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── CSV export ─────────────────────────────────────────────────────────────────
function exportCSV(expenses: Expense[]) {
  const rows = [["Date","Title","Category","Type","Amount (₹)","Note"],
    ...expenses.map(e=>[e.date,e.title,e.category?.name??"",e.type,Number(e.amount).toFixed(2),e.note??""])];
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href=url; a.download=`expenses_${new Date().toISOString().split("T")[0]}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab]   = useState<Tab>("overview");
  const [expenses, setExpenses]     = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary]       = useState<Summary>({income:0,expense:0,balance:0});
  const [showAdd, setShowAdd]       = useState(false);
  const [editTx, setEditTx]         = useState<Expense|null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const blankForm = useCallback(()=>({
    title:"", amount:"", type:"expense" as "income"|"expense",
    category_id: categories[0]?.id??"",
    date: new Date().toISOString().split("T")[0], note:"",
  }),[categories]);

  const [form, setForm] = useState(blankForm);

  useEffect(()=>{
    (async()=>{
      setLoadingData(true);
      try {
        const [expData,catData,sumData] = await Promise.all([
          expensesApi.list({limit:100}), seedDefaultCategories(), expensesApi.summary(),
        ]);
        setExpenses(expData.expenses); setCategories(catData); setSummary(sumData);
        if(catData.length>0) setForm(f=>({...f,category_id:catData[0].id}));
      } catch { toast.error("Failed to load data"); }
      finally { setLoadingData(false); }
    })();
  },[]);

  const handleSave = async () => {
    if(!form.title||!form.amount||!form.category_id) return;
    setSubmitting(true);
    try {
      if(editTx) {
        const updated = await expensesApi.update(editTx.id,{
          title:form.title, amount:parseFloat(form.amount),
          date:form.date, type:form.type, category_id:form.category_id, note:form.note,
        });
        setExpenses(p=>p.map(e=>e.id===editTx.id?updated:e));
        const s = await expensesApi.summary(); setSummary(s);
        toast.success("Transaction updated");
      } else {
        const newExp = await expensesApi.create({
          title:form.title, amount:parseFloat(form.amount),
          date:form.date, type:form.type, category_id:form.category_id,
          note:form.note,
        });
        setExpenses(p=>[newExp,...p]);
        setSummary(prev=>{
          const amt=parseFloat(form.amount);
          return form.type==="income"
            ? {...prev,income:prev.income+amt,balance:prev.balance+amt}
            : {...prev,expense:prev.expense+amt,balance:prev.balance-amt};
        });
        toast.success("Transaction added");
      }
      setShowAdd(false); setEditTx(null);
      setForm(f=>({...f,title:"",amount:"",note:""}));
    } catch(err:any) {
      toast.error(err?.response?.data?.message??"Failed to save");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async(id:string)=>{
    const tx=expenses.find(e=>e.id===id); if(!tx) return;
    try {
      await expensesApi.delete(id);
      setExpenses(p=>p.filter(e=>e.id!==id));
      setSummary(prev=>{
        const amt=Number(tx.amount);
        return tx.type==="income"
          ? {...prev,income:prev.income-amt,balance:prev.balance-amt}
          : {...prev,expense:prev.expense-amt,balance:prev.balance+amt};
      });
      toast.success("Deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const handleEdit=(tx:Expense)=>{
    setEditTx(tx);
    setForm({title:tx.title,amount:String(tx.amount),type:tx.type,
      category_id:tx.category_id,date:tx.date,note:tx.note??""});
    setShowAdd(true);
  };

  const NAV = [
    {id:"overview",    label:"Overview",     icon:LayoutDashboard},
    {id:"transactions",label:"Transactions", icon:Receipt},
    {id:"budgets",     label:"Budgets",      icon:Target},
    {id:"analytics",   label:"Analytics",    icon:BarChart2},
  ] as const;

  const spentPct = summary.income>0 ? Math.min((summary.expense/summary.income)*100,100):0;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden" style={{fontFamily:"'Outfit',system-ui,sans-serif"}}>

      {/* ── Sidebar ── */}
      <aside className="w-58 shrink-0 flex flex-col" style={{background:"#080d15",borderRight:"1px solid rgba(99,130,168,0.1)",width:"224px"}}>
        {/* Logo */}
        <div className="px-5 py-5" style={{borderBottom:"1px solid rgba(99,130,168,0.1)"}}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:"linear-gradient(135deg,#3fb950,#56d364)"}}>
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight">Fynance</span>
              <div className="text-[9px] text-muted-foreground font-medium tracking-wider uppercase">Expense Tracker</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({id,label,icon:Icon})=>(
            <button key={id} onClick={()=>setActiveTab(id as Tab)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={activeTab===id
                ? {background:"rgba(63,185,80,0.12)",color:"#3fb950",fontWeight:600,boxShadow:"inset 0 0 0 1px rgba(63,185,80,0.2)"}
                : {color:"#6e7a8a"}
              }
              onMouseEnter={e=>{if(activeTab!==id){e.currentTarget.style.background="rgba(99,130,168,0.06)";e.currentTarget.style.color="#c9d1d9";}}}
              onMouseLeave={e=>{if(activeTab!==id){e.currentTarget.style.background="transparent";e.currentTarget.style.color="#6e7a8a";}}}>

              <Icon className="w-4 h-4 shrink-0"/>
              {label}
            </button>
          ))}
        </nav>

        {/* Balance widget */}
        <div className="px-4 py-4 mx-3 mb-3 rounded-xl" style={{background:"rgba(63,185,80,0.07)",border:"1px solid rgba(63,185,80,0.15)"}}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Balance</span>
            <span className="font-['DM_Mono',monospace] text-xs font-bold" style={{color:summary.balance>=0?"#3fb950":"#f85149"}}>
              {fmtShort(summary.balance)}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{background:"rgba(99,130,168,0.15)"}}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{width:`${spentPct}%`,background:spentPct>=90?"#f85149":spentPct>=70?"#e3b341":"#3fb950"}}/>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
            <span>{fmtShort(summary.expense)} spent</span>
            <span>{spentPct.toFixed(0)}%</span>
          </div>
        </div>

        {/* User + logout */}
        <div className="px-4 pb-5 pt-2" style={{borderTop:"1px solid rgba(99,130,168,0.08)"}}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{background:"linear-gradient(135deg,#3fb950,#58a6ff)",color:"#090e17"}}>
              {user?.name?.[0]?.toUpperCase()??"U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{user?.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground transition-colors"
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(248,81,73,0.1)";e.currentTarget.style.color="#f85149"}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#6e7a8a"}}>
            <LogOut className="w-4 h-4"/>Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto" style={{"scrollbarWidth":"none" as any}}>
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-7 py-4"
          style={{background:"rgba(9,14,23,0.85)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(99,130,168,0.08)"}}>
          <div>
            <h1 className="text-base font-semibold">{NAV.find(n=>n.id===activeTab)?.label}</h1>
            <p className="text-xs text-muted-foreground font-['DM_Mono',monospace]">
              {new Date().toLocaleDateString("en-IN",{month:"long",year:"numeric"})}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live spent chip */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{background:"rgba(248,81,73,0.1)",border:"1px solid rgba(248,81,73,0.2)"}}>
              <TrendingDown className="w-3.5 h-3.5" style={{color:"#f85149"}}/>
              <span className="text-xs font-['DM_Mono',monospace] font-medium" style={{color:"#f85149"}}>{fmtShort(summary.expense)}</span>
            </div>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground transition-colors"
              style={{border:"1px solid rgba(99,130,168,0.14)"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(99,130,168,0.08)";e.currentTarget.style.color="#e6edf3"}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#6e7a8a"}}>
              <Bell className="w-4 h-4"/>
            </button>
            <button onClick={()=>{setEditTx(null);setForm(blankForm());setShowAdd(true);}}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{background:"linear-gradient(135deg,#3fb950,#56d364)",color:"#060d0a",boxShadow:"0 4px 14px rgba(63,185,80,0.3)"}}>
              <Plus className="w-4 h-4"/>Add
            </button>
          </div>
        </header>

        <div className="px-7 py-6">
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"/>
              <span className="text-sm">Loading your finances…</span>
            </div>
          ) : (
            <>
              {activeTab==="overview"     && <OverviewTab expenses={expenses} summary={summary} onViewAll={()=>setActiveTab("transactions")} onDelete={handleDelete} onEdit={handleEdit}/>}
              {activeTab==="transactions" && <TransactionsTab expenses={expenses} categories={categories} onDelete={handleDelete} onEdit={handleEdit} onExport={()=>exportCSV(expenses)}/>}
              {activeTab==="budgets"      && <BudgetsTab expenses={expenses}/>}
              {activeTab==="analytics"    && <AnalyticsTab expenses={expenses}/>}
            </>
          )}
        </div>
      </main>

      {/* ── Add/Edit Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={()=>{setShowAdd(false);setEditTx(null);}}/>
          <div className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
            style={{background:"linear-gradient(160deg,#111927,#0d1420)",border:"1px solid rgba(99,130,168,0.18)",boxShadow:"0 24px 64px rgba(0,0,0,0.5)"}}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold">{editTx?"Edit Transaction":"New Transaction"}</h2>
                <p className="text-xs text-muted-foreground">{editTx?"Update the details below":"Record an income or expense"}</p>
              </div>
              <button onClick={()=>{setShowAdd(false);setEditTx(null);}}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground transition-colors"
                style={{border:"1px solid rgba(99,130,168,0.14)"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(248,81,73,0.1)";e.currentTarget.style.color="#f85149"}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#6e7a8a"}}>
                <X className="w-4 h-4"/>
              </button>
            </div>

            <div className="space-y-4">
              {/* Type toggle */}
              <div className="flex rounded-xl overflow-hidden" style={{border:"1px solid rgba(99,130,168,0.14)"}}>
                {(["expense","income"] as const).map(t=>(
                  <button key={t} onClick={()=>setForm(f=>({...f,type:t}))}
                    className="flex-1 py-2.5 text-sm capitalize font-medium transition-all"
                    style={form.type===t
                      ? t==="expense"
                        ? {background:"rgba(248,81,73,0.15)",color:"#f85149",borderBottom:"2px solid #f85149"}
                        : {background:"rgba(63,185,80,0.15)",color:"#3fb950",borderBottom:"2px solid #3fb950"}
                      : {color:"#6e7a8a"}}>
                    {t==="expense"?"💸 Expense":"💰 Income"}
                  </button>
                ))}
              </div>

              {/* Title */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Title</label>
                <input type="text" placeholder="e.g. Zomato order" value={form.title}
                  onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                  style={{background:"#090e17",border:"1px solid rgba(99,130,168,0.18)"}}
                  onFocus={e=>e.target.style.borderColor="rgba(63,185,80,0.5)"}
                  onBlur={e=>e.target.style.borderColor="rgba(99,130,168,0.18)"}/>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-['DM_Mono',monospace] text-sm">₹</span>
                  <input type="number" min="0" placeholder="0.00" value={form.amount}
                    onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all font-['DM_Mono',monospace]"
                    style={{background:"#090e17",border:"1px solid rgba(99,130,168,0.18)"}}
                    onFocus={e=>e.target.style.borderColor="rgba(63,185,80,0.5)"}
                    onBlur={e=>e.target.style.borderColor="rgba(99,130,168,0.18)"}/>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Category</label>
                {categories.length === 0 ? (
                  <div className="w-full px-4 py-2.5 rounded-xl text-sm text-center"
                    style={{background:"#090e17",border:"1px solid rgba(248,81,73,0.3)",color:"#f85149"}}>
                    ⚠️ No categories found — they may still be loading. Close and reopen this modal.
                  </div>
                ) : (
                  <select value={form.category_id} onChange={e=>setForm(f=>({...f,category_id:e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-foreground focus:outline-none transition-all"
                    style={{background:"#090e17",border:"1px solid rgba(99,130,168,0.18)"}}>
                    {categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"/>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-foreground focus:outline-none transition-all"
                    style={{background:"#090e17",border:"1px solid rgba(99,130,168,0.18)"}}/>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Note (optional)</label>
                <input type="text" placeholder="Add a note…" value={form.note}
                  onChange={e=>setForm(f=>({...f,note:e.target.value}))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                  style={{background:"#090e17",border:"1px solid rgba(99,130,168,0.18)"}}
                  onFocus={e=>e.target.style.borderColor="rgba(63,185,80,0.5)"}
                  onBlur={e=>e.target.style.borderColor="rgba(99,130,168,0.18)"}/>
              </div>

              <button onClick={handleSave}
                disabled={!form.title||!form.amount||!form.category_id||submitting}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{background:"linear-gradient(135deg,#3fb950,#56d364)",color:"#060d0a",boxShadow:"0 4px 16px rgba(63,185,80,0.3)"}}>
                {submitting?"Saving…":editTx?"Update Transaction":"Add Transaction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

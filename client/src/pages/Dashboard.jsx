import React, { useContext } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";

const navigation = [
  { to: "/dashboard", label: "Overview", image: "home_icon", end: true },
  { to: "/dashboard/company-profile", label: "Company Profile", image: "company_icon" },
  { to: "/dashboard/add-job", label: "Add Job", image: "add_icon" },
  { to: "/dashboard/manage-jobs", label: "Manage Jobs", image: "home_icon" },
  { to: "/dashboard/view-applications", label: "Applications", image: "person_tick_icon" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { companyData, logoutCompany } = useContext(AppContext);

  const handleLogout = () => {
    logoutCompany();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <button type="button" onClick={() => navigate("/")} className="flex items-center gap-3" aria-label="Go to home page">
            <img className="w-28 sm:w-32" src={assets.logo} alt="Job portal" />
            <span className="hidden border-l border-slate-200 pl-3 text-sm font-medium text-slate-500 sm:block">Recruiter workspace</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-sm font-semibold text-slate-800">{companyData?.name || "Company"}</p><p className="text-xs text-slate-500">Recruiter account</p></div>
            {companyData?.image ? <img className="h-9 w-9 rounded-full border border-slate-200 object-cover" src={companyData.image} alt="Company logo" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">{companyData?.name?.charAt(0)?.toUpperCase() || "C"}</div>}
            <button type="button" onClick={handleLogout} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:text-sm">Log out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
          <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Workspace</p>
          <nav className="space-y-1">
            {navigation.map((item) => <NavLink key={item.to} end={item.end} to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
              {item.image ? <img className="h-4 w-4 object-contain" src={assets[item.image]} alt="" /> : <span className="flex h-4 w-4 items-center justify-center text-xs font-bold">{item.icon}</span>}
              {item.label}
            </NavLink>)}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden">
            {navigation.map((item) => <NavLink key={item.to} end={item.end} to={item.to} className={({ isActive }) => `whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-600"}`}>{item.label}</NavLink>)}
          </nav>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

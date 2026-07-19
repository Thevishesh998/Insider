import React, { useContext, useState } from "react";
import { assets } from "../assets/assets";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CircleHelp,
  House,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { AppContext } from "../context/AppContext";

const mobileNavItemClass = (active) => `group flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${active
  ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
  : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"}`;

const Navbar = () => {
  const { openSignIn, signOut } = useClerk();
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { setShowRecruiterLogin } = useContext(AppContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  // Keep these desktop links unchanged; the richer navigation below is mobile-only.
  const publicLinks = <><Link onClick={closeMenu} to="/about">About</Link><Link onClick={closeMenu} to="/resources">Resources</Link><Link onClick={closeMenu} to="/help">Help</Link></>;
  const candidateLinks = <><Link onClick={closeMenu} to="/candidate-dashboard">Dashboard</Link><Link onClick={closeMenu} to="/applications">My applications</Link><Link onClick={closeMenu} to="/applications?tab=saved">Saved jobs</Link><Link onClick={closeMenu} to="/account">Profile</Link></>;

  const isActive = (to) => {
    const [pathname, search] = to.split("?");
    return location.pathname === pathname && (!search || location.search === `?${search}`);
  };

  const mobileLinks = [
    { label: "Home", to: "/", icon: House },
    { label: "About", to: "/about", icon: Info },
    { label: "Resources", to: "/resources", icon: BriefcaseBusiness },
    { label: "Help", to: "/help", icon: CircleHelp },
    ...(user ? [
      { label: "Dashboard", to: "/candidate-dashboard", icon: LayoutDashboard },
      { label: "My Applications", to: "/applications", icon: BriefcaseBusiness },
      { label: "Saved Jobs", to: "/applications?tab=saved", icon: Bookmark },
      { label: "Profile", to: "/account", icon: UserRound },
    ] : []),
  ];

  const accountMenu = <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-10 w-10 ring-2 ring-blue-100", userButtonPopoverCard: "rounded-2xl border border-slate-200 shadow-xl", userButtonPopoverActionButton: "rounded-lg" } }}><UserButton.MenuItems><UserButton.Link label="My Profile" href="/account" labelIcon={<span aria-hidden="true">◉</span>} /><UserButton.Link label="Applied Jobs" href="/applications" labelIcon={<span aria-hidden="true">✓</span>} /><UserButton.Link label="Saved Jobs" href="/applications?tab=saved" labelIcon={<span aria-hidden="true">★</span>} /><UserButton.Link label="Settings" href="/account#settings" labelIcon={<span aria-hidden="true">⚙</span>} /><UserButton.Action label="signOut" /></UserButton.MenuItems></UserButton>;

  const handleLogout = async () => {
    closeMenu();
    await signOut();
  };

  return <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
    <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <button onClick={() => navigate("/")} className="shrink-0" aria-label="Go to home"><img className="w-32" src={assets.logo} alt="Job portal" /></button>
      <div className="hidden items-center gap-6 md:flex"><div className="flex items-center gap-5 text-sm font-semibold text-slate-600">{publicLinks}</div>{user && <div className="flex items-center gap-5 border-l border-slate-200 pl-5 text-sm font-semibold text-slate-600">{candidateLinks}</div>}{user ? <div className="flex items-center gap-3 border-l border-slate-200 pl-5"><div className="hidden text-right lg:block"><p className="max-w-32 truncate text-sm font-bold text-slate-800">{user.fullName || "Candidate"}</p><p className="max-w-40 truncate text-xs text-slate-500">{user.primaryEmailAddress?.emailAddress}</p></div>{accountMenu}</div> : <div className="flex items-center gap-3 text-sm"><button onClick={() => setShowRecruiterLogin(true)} className="font-semibold text-slate-600 hover:text-slate-900">Recruiter login</button><button onClick={() => openSignIn()} className="rounded-lg bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-700">Sign in</button></div>}</div>
      <button onClick={() => setMenuOpen((value) => !value)} className="rounded-xl border border-slate-200 p-2.5 text-slate-700 transition-colors hover:bg-slate-50 active:scale-95 md:hidden" aria-expanded={menuOpen} aria-label="Toggle navigation">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
    </nav>

    {menuOpen && <div className="border-t border-slate-100 bg-white md:hidden">
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.24)]">
          <nav className="space-y-1" aria-label="Mobile navigation">
            {mobileLinks.map(({ label, to, icon: Icon }) => <Link key={to} onClick={closeMenu} to={to} className={mobileNavItemClass(isActive(to))} aria-current={isActive(to) ? "page" : undefined}>
              <Icon size={19} strokeWidth={2} className="shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate tracking-[-0.01em]">{label}</span>
            </Link>)}
          </nav>

          {user ? <div className="mt-3 border-t border-slate-100 pt-3">
            <Link to="/account" onClick={closeMenu} className="flex min-h-16 items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-slate-50 active:scale-[0.99]">
              {user.imageUrl ? <img src={user.imageUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-blue-100" /> : <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">{(user.fullName || "A").charAt(0)}</div>}
              <div className="min-w-0"><p className="truncate text-sm font-bold tracking-[-0.01em] text-slate-900">{user.fullName || "Account"}</p><p className="truncate text-xs font-medium text-slate-500">{user.primaryEmailAddress?.emailAddress}</p></div>
            </Link>
            <button onClick={handleLogout} className="mt-2 flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700 active:scale-[0.98]">
              <LogOut size={19} className="shrink-0" aria-hidden="true" /> Logout
            </button>
          </div> : <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
            <button onClick={() => { closeMenu(); setShowRecruiterLogin(true); }} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98]"><Building2 size={19} aria-hidden="true" />Recruiter login</button>
            <button onClick={() => { closeMenu(); openSignIn(); }} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"><LogIn size={18} aria-hidden="true" />Sign in</button>
          </div>}
        </div>
      </div>
    </div>}
  </header>;
};

export default Navbar;

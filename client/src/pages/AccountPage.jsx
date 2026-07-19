import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Briefcase, Check, Download, FileText, GraduationCap, Mail, MapPin, Pencil, Phone, Upload, X } from "lucide-react";
import { AppContext } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SUGGESTED_SKILLS = ["React", "Node.js", "Express.js", "MongoDB", "JavaScript", "TypeScript", "Next.js", "Redux", "HTML", "CSS", "Tailwind CSS", "Git", "GitHub", "REST API", "Postman", "Docker", "AWS", "Linux", "Java", "Spring Boot", "Python", "Django", "Flask", "FastAPI", "SQL", "MySQL", "PostgreSQL", "Firebase", "C++", "Selenium", "Cypress", "Playwright", "Jira"];

const icons = { edit: Pencil, file: FileText, upload: Upload, pin: MapPin, briefcase: Briefcase, check: Check, download: Download, mail: Mail, phone: Phone, education: GraduationCap, close: X };
const Icon = ({ name, className = "" }) => {
  const LucideIcon = icons[name];
  return <LucideIcon aria-hidden="true" className={className} strokeWidth={1.9} />;
};

const emptyProfile = { resume: "", candidateSkills: [], manualSkills: [], manualSkillsConfigured: false, primaryRole: "", preferredLocation: "", experienceLevel: "", phone: "", education: "" };
const displayValue = (value, placeholder = "Not added yet") => value || placeholder;

const AccountPage = () => {
  const { backendUrl } = useContext(AppContext);
  const { getToken } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState(emptyProfile);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingResume, setSavingResume] = useState(false);
  const [savingSkills, setSavingSkills] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [editingSkill, setEditingSkill] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ primaryRole: "", preferredLocation: "", experienceLevel: "", phone: "", education: "" });

  const displayedSkills = profile.manualSkillsConfigured ? profile.manualSkills || [] : profile.candidateSkills || [];
  const normalizedSkills = useMemo(() => new Set(displayedSkills.map((skill) => skill.toLowerCase())), [displayedSkills]);
  const suggestions = useMemo(() => SUGGESTED_SKILLS.filter((skill) => skill.toLowerCase().includes(skillInput.trim().toLowerCase()) && !normalizedSkills.has(skill.toLowerCase())).slice(0, 7), [skillInput, normalizedSkills]);
  const completionItems = [
    ["Resume uploaded", Boolean(profile.resume)],
    ["Skills added", displayedSkills.length > 0],
    ["Preferred role", Boolean(profile.primaryRole)],
    ["Location", Boolean(profile.preferredLocation)],
    ["Profile photo", Boolean(user?.imageUrl)],
  ];
  const completion = Math.round((completionItems.filter(([, complete]) => complete).length / completionItems.length) * 100);

  const loadProfile = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/users/user`, { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) setProfile({ ...emptyProfile, ...data.user });
    } catch {
      toast.error("Unable to load profile details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const openEditor = () => {
    setForm({ primaryRole: profile.primaryRole || "", preferredLocation: profile.preferredLocation || "", experienceLevel: profile.experienceLevel || "", phone: profile.phone || "", education: profile.education || "" });
    setEditOpen(true);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const token = await getToken();
      const { data } = await axios.put(`${backendUrl}/api/users/profile`, form, { headers: { Authorization: `Bearer ${token}` } });
      if (!data.success) throw new Error(data.message);
      setProfile((current) => ({ ...current, ...data.profile }));
      setEditOpen(false);
      toast.success("Profile details saved");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Unable to save profile details");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveSkills = async (nextSkills) => {
    setSavingSkills(true);
    try {
      const token = await getToken();
      const { data } = await axios.put(`${backendUrl}/api/users/skills`, { skills: nextSkills }, { headers: { Authorization: `Bearer ${token}` } });
      if (!data.success) throw new Error(data.message);
      setProfile((current) => ({ ...current, manualSkills: data.skills, manualSkillsConfigured: true }));
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Unable to save skills");
    } finally {
      setSavingSkills(false);
    }
  };

  const addSkill = (value = skillInput) => {
    const skill = value.trim().replace(/\s+/g, " ");
    if (!skill) return;
    if (normalizedSkills.has(skill.toLowerCase())) return toast.info("That skill is already in your profile.");
    if (skill.length > 50) return toast.error("Skills must be 50 characters or fewer.");
    setSkillInput(""); setEditingSkill(null); saveSkills([...displayedSkills, skill]);
  };
  const submitSkill = (event) => {
    event.preventDefault();
    if (!editingSkill) return addSkill();
    const replacement = skillInput.trim().replace(/\s+/g, " ");
    if (!replacement) return;
    if (replacement.toLowerCase() !== editingSkill.toLowerCase() && normalizedSkills.has(replacement.toLowerCase())) return toast.info("That skill is already in your profile.");
    setSkillInput(""); setEditingSkill(null); saveSkills(displayedSkills.map((skill) => skill === editingSkill ? replacement : skill));
  };

  const uploadResume = async () => {
    if (!file || file.type !== "application/pdf" || file.size > 5 * 1024 * 1024) return toast.error("Choose a PDF resume smaller than 5 MB.");
    setSavingResume(true);
    try {
      const formData = new FormData(); formData.append("resume", file);
      const token = await getToken();
      const { data } = await axios.post(`${backendUrl}/api/users/update-resume`, formData, { headers: { Authorization: `Bearer ${token}` } });
      if (!data.success) throw new Error(data.message);
      setProfile((current) => ({ ...current, resume: data.resume, resumeUpdatedAt: data.resumeUpdatedAt, resumeOriginalName: data.resumeOriginalName, resumeFileName: data.resumeOriginalName, candidateSkills: data.candidateSkills || [], manualSkills: data.manualSkills || [], manualSkillsConfigured: data.manualSkillsConfigured || false, primaryRole: current.primaryRole || data.primaryRole || "" }));
      setFile(null); toast.success("Resume updated");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Unable to update resume");
    } finally {
      setSavingResume(false);
    }
  };

  const profileDetails = [
    ["Name", user?.fullName || profile.name, "edit"], ["Email", user?.primaryEmailAddress?.emailAddress || profile.email, "mail"],
    ["Phone", displayValue(profile.phone), "phone"], ["Location", displayValue(profile.preferredLocation), "pin"],
    ["Education", displayValue(profile.education), "education"], ["Experience", displayValue(profile.experienceLevel), "briefcase"],
  ];

  return <><Navbar /><main className="min-h-[70vh] bg-slate-50/70 py-7 sm:py-10"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl shadow-slate-900/10"><div className="relative px-6 py-8 sm:px-10 sm:py-10"><div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" /><div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-4 sm:gap-5"><div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/20 bg-blue-600 text-2xl font-bold"><>{user?.imageUrl ? <img src={user.imageUrl} alt="Candidate profile" className="h-full w-full object-cover" /> : (user?.fullName || "C").slice(0, 1)}</></div><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Candidate profile</p><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{user?.fullName || profile.name || "Your profile"}</h1><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300"><span>{displayValue(profile.primaryRole, "Add your preferred role")}</span><span className="hidden text-slate-600 sm:inline">•</span><span>{displayValue(profile.preferredLocation, "Add location")}</span><span className="hidden text-slate-600 sm:inline">•</span><span>{displayValue(profile.experienceLevel, "Add experience")}</span></div><p className="mt-2 text-sm text-slate-400">{user?.primaryEmailAddress?.emailAddress || profile.email}</p></div></div><div className="flex flex-col gap-3 sm:flex-row lg:items-center"><button onClick={openEditor} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 hover:bg-blue-50"><Icon name="edit" className="h-4 w-4" />Edit profile</button><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15"><Icon name="upload" className="h-4 w-4" />Update resume<input type="file" accept="application/pdf" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label></div></div><div className="relative mt-8 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.06] p-4 sm:p-5"><div className="flex items-center justify-between"><p className="text-sm font-bold">Profile completion</p><p className="text-lg font-bold text-blue-300">{completion}%</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${completion}%` }} /></div><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">{completionItems.map(([label, complete]) => <span key={label} className={`inline-flex items-center gap-1.5 text-xs ${complete ? "text-emerald-300" : "text-slate-400"}`}><span className={`flex h-4 w-4 items-center justify-center rounded-full ${complete ? "bg-emerald-400 text-emerald-950" : "border border-slate-500"}`}>{complete && <Icon name="check" className="h-3 w-3" />}</span>{label}</span>)}</div></div></div></section>

    <section className="mt-6 grid gap-4 sm:grid-cols-3"><SummaryCard icon="briefcase" label="Preferred role" value={displayValue(profile.primaryRole)} /><SummaryCard icon="pin" label="Preferred location" value={displayValue(profile.preferredLocation)} /><SummaryCard icon="education" label="Experience" value={displayValue(profile.experienceLevel)} /></section>

    <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,.95fr)]"><div className="space-y-7"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><SectionHeading title="Resume" text="Keep the document you share with employers current." /><div className="mt-5">{loading ? <div className="h-36 animate-pulse rounded-xl bg-slate-100" /> : profile.resume ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"><div className="flex gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><Icon name="file" className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate font-bold text-slate-900">{profile.resumeOriginalName || profile.resumeFileName || "Resume.pdf"}</p><p className="mt-1 text-sm text-slate-500">Uploaded {profile.resumeUpdatedAt ? new Date(profile.resumeUpdatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "recently"}</p><span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">Ready to share</span></div></div><div className="mt-5 flex flex-wrap gap-3"><a href={profile.resume} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"><Icon name="file" className="h-4 w-4" />View resume</a><a href={profile.resume} download className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><Icon name="download" className="h-4 w-4" />Download</a><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><Icon name="upload" className="h-4 w-4" />Replace resume<input type="file" accept="application/pdf" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label></div></div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Icon name="upload" className="h-6 w-6" /></div><h3 className="mt-4 font-bold text-slate-900">No resume uploaded</h3><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">Add a PDF resume so you can apply to roles without missing a step.</p><label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"><Icon name="upload" className="h-4 w-4" />Upload resume<input type="file" accept="application/pdf" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label></div>}</div>{file && <div className="mt-4 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 sm:flex-row sm:items-center sm:justify-between"><p className="truncate text-sm font-semibold text-blue-900">Selected: {file.name}</p><button onClick={uploadResume} disabled={savingResume} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">{savingResume ? "Uploading..." : "Save resume"}</button></div>}</section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-3"><SectionHeading title="Skills" text="Add the technologies and tools you work with." />{savingSkills && <span className="text-xs font-semibold text-slate-400">Saving...</span>}</div><form onSubmit={submitSkill} className="relative mt-5"><div className="flex gap-2"><input value={skillInput} onChange={(event) => setSkillInput(event.target.value)} maxLength="50" placeholder="Search or add a skill" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50" /><button type="submit" disabled={savingSkills} className="rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">{editingSkill ? "Update" : "Add"}</button></div>{(skillInput || editingSkill) && <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">{suggestions.map((skill) => <button type="button" key={skill} onClick={() => addSkill(skill)} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50">{skill}</button>)}{!suggestions.length && !editingSkill && <p className="px-3 py-2 text-xs text-slate-500">Press Add to use this skill.</p>}</div>}</form><div className="mt-4 flex flex-wrap gap-2">{displayedSkills.length ? displayedSkills.map((skill) => <span key={skill} className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 py-1.5 pl-3 pr-1 text-sm font-semibold text-blue-700"><button type="button" onClick={() => { setEditingSkill(skill); setSkillInput(skill); }} className="hover:underline">{skill}</button><button type="button" onClick={() => saveSkills(displayedSkills.filter((item) => item !== skill))} disabled={savingSkills} aria-label={`Remove ${skill}`} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-blue-100 disabled:opacity-50"><Icon name="close" className="h-3.5 w-3.5" /></button></span>) : <p className="text-sm text-slate-500">Choose from popular skills or add your own.</p>}</div><div className="mt-5 border-t border-slate-100 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Popular developer skills</p><div className="mt-2 flex flex-wrap gap-2">{SUGGESTED_SKILLS.slice(0, 10).filter((skill) => !normalizedSkills.has(skill.toLowerCase())).map((skill) => <button type="button" key={skill} onClick={() => addSkill(skill)} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700">+ {skill}</button>)}</div></div></section></div>

      <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-4"><SectionHeading title="Personal details" text="Your candidate information at a glance." /><button onClick={openEditor} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-800"><Icon name="edit" className="h-4 w-4" />Edit</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{profileDetails.map(([label, value, icon]) => <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5"><div className="flex items-center gap-2 text-slate-400"><Icon name={icon} className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-wide">{label}</span></div><p className="mt-2 truncate text-sm font-semibold text-slate-800">{value}</p></div>)}</div><p className="mt-5 text-xs leading-5 text-slate-400">Your name and email are securely managed through your account.</p></section></div>
  </div></main>{editOpen && <ProfileEditor form={form} setForm={setForm} onClose={() => setEditOpen(false)} onSave={saveProfile} saving={savingProfile} />}<Footer /></>;
};

const SummaryCard = ({ icon, label, value }) => <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon name={icon} className="h-5 w-5" /></div><p className="mt-4 text-sm font-medium text-slate-500">{label}</p><p className="mt-1 truncate text-lg font-bold text-slate-900">{value}</p></div>;
const SectionHeading = ({ title, text }) => <div><h2 className="text-lg font-bold text-slate-900">{title}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{text}</p></div>;
const ProfileEditor = ({ form, setForm, onClose, onSave, saving }) => <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-0 sm:items-center sm:justify-center sm:p-5"><form onSubmit={onSave} className="w-full rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-lg sm:rounded-3xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900">Edit profile</h2><p className="mt-1 text-sm text-slate-500">Update the details employers use to understand your fit.</p></div><button type="button" onClick={onClose} aria-label="Close editor" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Icon name="close" className="h-5 w-5" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Preferred role" value={form.primaryRole} onChange={(value) => setForm({ ...form, primaryRole: value })} placeholder="e.g. Full Stack Developer" /><Field label="Preferred location" value={form.preferredLocation} onChange={(value) => setForm({ ...form, preferredLocation: value })} placeholder="e.g. Noida" /><label className="grid gap-1.5 text-sm font-semibold text-slate-700"><span>Experience level</span><select value={form.experienceLevel} onChange={(event) => setForm({ ...form, experienceLevel: event.target.value })} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"><option value="">Select experience</option><option>Fresher</option><option>0-1 years</option><option>1-3 years</option><option>3-5 years</option><option>5+ years</option></select></label><Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} placeholder="e.g. +91 98765 43210" /><div className="sm:col-span-2"><Field label="Education" value={form.education} onChange={(value) => setForm({ ...form, education: value })} placeholder="e.g. B.Tech, Computer Science" /></div></div><div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancel</button><button disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button></div></form></div>;
const Field = ({ label, value, onChange, placeholder }) => <label className="grid gap-1.5 text-sm font-semibold text-slate-700"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} maxLength="120" placeholder={placeholder} className="rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" /></label>;

export default AccountPage;

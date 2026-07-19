import React, { useContext, useEffect, useRef, useState } from "react";
import { JobCategories, JobLocations } from "../assets/assets";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import "quill/dist/quill.snow.css";
import Quill from "quill";
import { useNavigate, useSearchParams } from "react-router-dom";

const fieldClass = "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500";
const labelClass = "text-sm font-semibold text-slate-700";

const AddJob = () => {
  const { backendUrl, companyToken, logoutCompany } = useContext(AppContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editJobId = searchParams.get("edit");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Bangalore");
  const [category, setCategory] = useState("Programming");
  const [level, setLevel] = useState("Beginner level");
  const [salary, setSalary] = useState(0);
  const [loading, setLoading] = useState(Boolean(editJobId));
  const [saving, setSaving] = useState(false);
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    if (!quillRef.current && editorRef.current) quillRef.current = new Quill(editorRef.current, { theme: "snow" });
  }, []);

  useEffect(() => {
    const fetchJob = async () => {
      if (!editJobId || !quillRef.current) return;
      try {
        const { data } = await axios.get(`${backendUrl}/api/company/jobs/${editJobId}`, { headers: { Authorization: `Bearer ${companyToken}` } });
        if (data.success) {
          const { job } = data;
          setTitle(job.title); setLocation(job.location); setCategory(job.category); setLevel(job.level); setSalary(job.salary);
          quillRef.current.root.innerHTML = job.description;
        }
      } catch (error) {
        if (error.response?.status === 401) logoutCompany();
        toast.error(error.response?.data?.message || "Unable to load job");
        navigate("/dashboard/manage-jobs");
      } finally { setLoading(false); }
    };
    fetchJob();
  }, [backendUrl, companyToken, editJobId, logoutCompany, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios({
        method: editJobId ? "put" : "post",
        url: editJobId ? `${backendUrl}/api/company/jobs/${editJobId}` : `${backendUrl}/api/company/post-job`,
        data: { title, description: quillRef.current.root.innerHTML, location, salary, category, level },
        headers: { Authorization: `Bearer ${companyToken}` },
      });
      if (data.success) {
        toast.success(editJobId ? "Job updated successfully" : "Job added successfully");
        if (editJobId) return navigate("/dashboard/manage-jobs");
        setTitle(""); setSalary(0); setLocation("Bangalore"); setCategory("Programming"); setLevel("Beginner level"); quillRef.current.root.innerHTML = "";
      }
    } catch (error) {
      if (error.response?.status === 401) logoutCompany();
      toast.error(error.response?.data?.message || "Unable to save job");
    } finally { setSaving(false); }
  };

  if (loading) return <main className="p-4 sm:p-6 lg:p-8"><div className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">Loading job details...</div></main>;

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-blue-600">Recruiting workspace</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{editJobId ? "Edit job posting" : "Create a job posting"}</h1><p className="mt-2 text-sm text-slate-500">Write a clear role summary and set the details candidates need.</p></div>{editJobId && <button type="button" onClick={() => navigate("/dashboard/manage-jobs")} className="text-sm font-semibold text-slate-600 hover:text-slate-900">Cancel editing</button>}</div>
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-7"><h2 className="font-semibold text-slate-900">Role details</h2><p className="mt-1 text-sm text-slate-500">Fields marked by your workflow are validated before publishing.</p></div>
        <div className="grid gap-6 p-5 sm:p-7">
          <label><span className={labelClass}>Job title</span><input required type="text" placeholder="e.g. Senior Frontend Engineer" onChange={(event) => setTitle(event.target.value)} value={title} className={fieldClass} /></label>
          <label><span className={labelClass}>Job description</span><div className="mt-1.5 overflow-hidden rounded-lg border border-slate-200 bg-white"><div ref={editorRef} /></div></label>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <label><span className={labelClass}>Category</span><select className={fieldClass} value={category} onChange={(event) => setCategory(event.target.value)}>{JobCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label><span className={labelClass}>Location</span><select className={fieldClass} value={location} onChange={(event) => setLocation(event.target.value)}>{JobLocations.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label><span className={labelClass}>Experience level</span><select className={fieldClass} value={level} onChange={(event) => setLevel(event.target.value)}><option value="Beginner level">Beginner level</option><option value="Intermediate level">Intermediate level</option><option value="Senior level">Senior level</option></select></label>
          </div>
          <label className="max-w-xs"><span className={labelClass}>Annual salary</span><input value={salary} min={0} className={fieldClass} onChange={(event) => setSalary(event.target.value)} type="number" placeholder="2500" /></label>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-7"><button type="button" onClick={() => navigate("/dashboard/manage-jobs")} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : editJobId ? "Save changes" : "Publish job"}</button></div>
      </form>
    </main>
  );
};

export default AddJob;

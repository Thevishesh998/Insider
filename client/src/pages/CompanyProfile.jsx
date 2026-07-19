import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const emptyForm = {
  name: "",
  about: "",
  website: "",
  industry: "",
  companySize: "",
  headquarters: "",
  foundedYear: "",
};

const toProfileForm = (company) => ({
  name: company.name || "",
  about: company.about || "",
  website: company.website || "",
  industry: company.industry || "",
  companySize: company.companySize || "",
  headquarters: company.headquarters || "",
  foundedYear: company.foundedYear || "",
});

const CompanyProfile = () => {
  const { backendUrl, companyToken, logoutCompany, setCompanyData } = useContext(AppContext);
  const [form, setForm] = useState(emptyForm);
  const [logo, setLogo] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${backendUrl}/api/company/profile`, {
        headers: { Authorization: `Bearer ${companyToken}` },
      });
      if (data.success) {
        const { company } = data;
        setForm(toProfileForm(company));
        setLogo(company.image || "");
      } else {
        setError(data.message || "Unable to load company profile.");
      }
    } catch (requestError) {
      if (requestError.response?.status === 401) logoutCompany();
      setError(requestError.response?.data?.message || "Unable to load company profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyToken) loadProfile();
  }, [companyToken]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast.error("Choose an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }
    setLogoFile(file);
    setLogo(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (logoFile) payload.append("image", logoFile);

      const { data } = await axios.put(`${backendUrl}/api/company/profile`, payload, {
        headers: { Authorization: `Bearer ${companyToken}` },
      });
      if (data.success) {
        setCompanyData(data.company);
        setForm(toProfileForm(data.company));
        setLogo(data.company.image || "");
        setLogoFile(null);
        toast.success("Company profile updated");
      } else {
        toast.error(data.message || "Unable to update company profile.");
      }
    } catch (requestError) {
      if (requestError.response?.status === 401) logoutCompany();
      toast.error(requestError.response?.data?.message || "Unable to update company profile.");
    } finally {
      setSaving(false);
    }
  };

  const isEmpty = !form.about && !form.website && !form.industry && !form.companySize && !form.headquarters && !form.foundedYear;

  if (loading) return <main className="p-4 sm:p-6 lg:p-8"><div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">Loading company profile...</div></main>;
  if (error) return <main className="p-4 sm:p-6 lg:p-8"><div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700"><p>{error}</p><button type="button" onClick={loadProfile} className="mt-2 font-medium underline">Try again</button></div></main>;

  return (
    <main className="w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6"><p className="text-sm font-medium text-blue-600">Recruiter settings</p><h1 className="mt-1 text-2xl font-semibold text-gray-900">Company profile</h1><p className="mt-2 text-sm text-gray-500">Keep your company information accurate for candidates.</p></div>
      {isEmpty && <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">Your company profile is incomplete. Add details to help candidates understand your organization.</div>}
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <section className="flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center">
          {logo ? <img src={logo} alt="Company logo preview" className="h-20 w-20 rounded-xl border object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-blue-100 text-2xl font-semibold text-blue-700">{form.name.charAt(0).toUpperCase() || "C"}</div>}
          <div><label htmlFor="image" className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Change logo</label><input id="image" name="image" type="file" accept="image/*" className="sr-only" onChange={handleLogoChange} /><p className="mt-2 text-xs text-gray-500">PNG, JPG, or WebP up to 5 MB.</p></div>
        </section>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className="text-sm font-medium text-gray-700">Company name</span><input required name="name" value={form.name} onChange={handleChange} maxLength="120" className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500" /></label>
          <label className="block sm:col-span-2"><span className="text-sm font-medium text-gray-700">About company</span><textarea name="about" value={form.about} onChange={handleChange} maxLength="3000" rows="5" className="mt-1.5 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Describe your company, engineering culture, and mission." /><span className="mt-1 block text-right text-xs text-gray-400">{form.about.length}/3000</span></label>
          <label className="block"><span className="text-sm font-medium text-gray-700">Website</span><input name="website" type="url" value={form.website} onChange={handleChange} maxLength="2048" placeholder="https://example.com" className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500" /></label>
          <label className="block"><span className="text-sm font-medium text-gray-700">Industry</span><input name="industry" value={form.industry} onChange={handleChange} maxLength="100" placeholder="Software development" className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500" /></label>
          <label className="block"><span className="text-sm font-medium text-gray-700">Company size</span><select name="companySize" value={form.companySize} onChange={handleChange} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"><option value="">Select size</option><option value="1-10">1-10 employees</option><option value="11-50">11-50 employees</option><option value="51-200">51-200 employees</option><option value="201-500">201-500 employees</option><option value="501-1000">501-1000 employees</option><option value="1001+">1001+ employees</option></select></label>
          <label className="block"><span className="text-sm font-medium text-gray-700">Headquarters</span><input name="headquarters" value={form.headquarters} onChange={handleChange} maxLength="160" placeholder="City, Country" className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500" /></label>
          <label className="block"><span className="text-sm font-medium text-gray-700">Founded year</span><input name="foundedYear" type="number" min="1800" max={new Date().getFullYear()} value={form.foundedYear} onChange={handleChange} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500" /></label>
        </div>
        <div className="mt-6 flex justify-end border-t border-gray-100 pt-5"><button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : "Update Profile"}</button></div>
      </form>
    </main>
  );
};

export default CompanyProfile;

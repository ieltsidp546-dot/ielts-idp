"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RecordItem = {
  id: string; givenName: string; familyName: string; identification: string;
  dateOfBirth: string; originalName: string; mimeType: string; createdAt: string;
};

const empty = { givenName: "", familyName: "", identification: "", dateOfBirth: "" };

export default function AdminDashboardPage() {
  const router = useRouter();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  async function load() {
    const response = await fetch("/api/admin/documents", { cache: "no-store" });
    if (response.status === 401) { router.replace("/admin/login"); return; }
    const data = await response.json();
    setRecords(data.records || []); setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault(); setMessage("");
    if (!editing && !file) { setMessage("Select a PDF or image certificate."); return; }
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.set(key, value));
    if (file) body.set("file", file);
    setBusy(true);
    try {
      const response = await fetch(editing ? `/api/admin/documents/${editing}` : "/api/admin/upload", {
        method: editing ? "PATCH" : "POST", body
      });
      const data = await response.json();
      if (!response.ok) setMessage(data.error || "Operation failed.");
      else {
        setMessage(editing ? "Record updated." : "Certificate uploaded.");
        setForm(empty); setFile(null); setEditing(null); await load();
        const input = document.getElementById("certificate-file") as HTMLInputElement | null;
        if (input) input.value = "";
      }
    } catch { setMessage("A network error occurred."); }
    finally { setBusy(false); }
  }

  function edit(record: RecordItem) {
    setEditing(record.id);
    setForm({
      givenName: record.givenName, familyName: record.familyName,
      identification: record.identification, dateOfBirth: record.dateOfBirth.slice(0, 10)
    });
    setFile(null); setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(record: RecordItem) {
    if (!window.confirm(`Delete the result record for ${record.givenName} ${record.familyName}? This cannot be undone.`)) return;
    const response = await fetch(`/api/admin/documents/${record.id}`, { method: "DELETE" });
    if (response.ok) { setMessage("Record deleted."); await load(); }
    else setMessage("Unable to delete record.");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  const visible = records.filter(r =>
    `${r.givenName} ${r.familyName} ${r.identification}`.toLowerCase().includes(filter.toLowerCase())
  );

  return <section className="admin-page shell">
    <div className="admin-top"><div><div className="section-eyebrow">PRIVATE ADMINISTRATION</div><h1>Results management</h1><p className="muted">Upload and maintain candidate result documents.</p></div><button className="button button-outline" onClick={logout}>Log out</button></div>

    <div className="admin-stats">
      <div className="stat-card"><span>Total records</span><strong>{records.length}</strong></div>
      <div className="stat-card"><span>Latest upload</span><strong>{records[0] ? new Date(records[0].createdAt).toLocaleDateString() : "—"}</strong></div>
    </div>

    <form className="admin-panel" onSubmit={submit}>
      <div className="section-eyebrow">{editing ? "EDIT EXISTING RECORD" : "NEW CERTIFICATE"}</div>
      <h2>{editing ? "Update student result" : "Upload a result document"}</h2>
      <div className="form-grid">
        <label>Given name<input required maxLength={100} value={form.givenName} onChange={e=>setForm({...form,givenName:e.target.value})}/></label>
        <label>Family name<input required maxLength={100} value={form.familyName} onChange={e=>setForm({...form,familyName:e.target.value})}/></label>
        <label>Identification number<input required maxLength={100} value={form.identification} onChange={e=>setForm({...form,identification:e.target.value})}/></label>
        <label>Date of birth<input required type="date" value={form.dateOfBirth} onChange={e=>setForm({...form,dateOfBirth:e.target.value})}/></label>
        <label className="full-width">Certificate file {editing && <span className="muted">(optional — select to replace current file)</span>}
          <input id="certificate-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" required={!editing} onChange={e=>setFile(e.target.files?.[0] || null)}/>
        </label>
      </div>
      <p className="fine-print">Accepted: PDF, JPEG, PNG, WebP · Maximum size: 10 MB. Files are validated on the server.</p>
      {message && <p className="form-message" role="status">{message}</p>}
      <div className="admin-actions"><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Upload certificate"}</button>
        {editing && <button type="button" className="button button-outline" onClick={()=>{setEditing(null);setForm(empty);setFile(null);setMessage("");}}>Cancel edit</button>}
      </div>
    </form>

    <section className="admin-panel">
      <div className="records-heading"><div><div className="section-eyebrow">DOCUMENT LIBRARY</div><h2>Uploaded records</h2></div><input className="record-filter" placeholder="Search name or ID…" value={filter} onChange={e=>setFilter(e.target.value)}/></div>
      {loading ? <p className="muted">Loading records…</p> : visible.length === 0 ? <p className="muted">No matching records.</p> :
        <div className="table-wrap"><table className="records-table"><thead><tr><th>Student</th><th>Identification</th><th>Date of birth</th><th>Document</th><th>Actions</th></tr></thead><tbody>
          {visible.map(r=><tr key={r.id}><td>{r.givenName} {r.familyName}</td><td>{r.identification}</td><td>{r.dateOfBirth.slice(0, 10)}</td><td>{r.originalName}</td><td><div className="row-actions"><button onClick={()=>edit(r)}>Edit</button><button className="danger-link" onClick={()=>void remove(r)}>Delete</button></div></td></tr>)}
        </tbody></table></div>}
    </section>
  </section>;
}

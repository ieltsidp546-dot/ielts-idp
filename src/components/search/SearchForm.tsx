"use client";

import { FormEvent, useState } from "react";
import { ResultCard } from "./ResultCard";

type SearchResult = {
  documentUrl: string;
  fileType: "pdf" | "image";
  fileName: string;
};

export function SearchForm() {
  const [values, setValues] = useState({
    givenName: "", familyName: "", identification: "", dateOfBirth: ""
  });
  const [result, setResult] = useState<SearchResult | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setMessage("");

    if (Object.values(values).some((value) => !value.trim())) {
      setMessage("Please complete all four fields.");
      return;
    }
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(values.dateOfBirth)) {
      setMessage("Please enter a valid date of birth.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/results/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(values)
      });
      const data = await response.json();
      if (response.status === 404) setMessage("Record not found. Check your details or contact the test centre.");
      else if (!response.ok) setMessage(data.error || "Unable to process your request.");
      else setResult(data as SearchResult);
    } catch {
      setMessage("A connection error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="search-layout">
      <form className="search-card" onSubmit={handleSubmit} noValidate>
        <div className="section-eyebrow">CANDIDATE VERIFICATION</div>
        <h2>Find your result document</h2>
        <p className="muted">Enter your details exactly as they appear on your identification document.</p>

        <div className="form-grid">
          <label>Given name
            <input autoComplete="given-name" value={values.givenName} onChange={(e) => update("givenName", e.target.value)} required maxLength={100} />
          </label>
          <label>Family name
            <input autoComplete="family-name" value={values.familyName} onChange={(e) => update("familyName", e.target.value)} required maxLength={100} />
          </label>
          <label className="full-width">Identification number
            <input autoComplete="off" value={values.identification} onChange={(e) => update("identification", e.target.value)} required maxLength={100} />
          </label>
          <label className="full-width">Date of birth
            <input type="date" autoComplete="bday" value={values.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} required />
          </label>
        </div>

        {message && <p className="form-message" role="alert">{message}</p>}
        <button className="button button-primary submit-button" type="submit" disabled={loading}>
          {loading ? "Verifying details…" : "Search for result"}
        </button>
        <p className="privacy-note">Your information is used only to verify the matching record.</p>
      </form>

      {result && <ResultCard {...result} />}
    </div>
  );
}

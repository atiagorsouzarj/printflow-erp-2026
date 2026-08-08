"use client";
import { ImageUp, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export function CompanyLogoField({ initialUrl }: { initialUrl?: string | null }) {
  const [url, setUrl] = useState(initialUrl || "");
  const [loading, setLoading] = useState(false);
  async function upload(file: File) {
    setLoading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha no upload");
      setUrl(data.url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Não foi possível enviar a logo.");
    } finally {
      setLoading(false);
    }
  }
  return <div className="company-logo-field">
    <input type="hidden" name="logoUrl" value={url}/>
    <div className="company-logo-preview">{url ? <Image unoptimized src={url} alt="Logomarca da empresa" width={260} height={110}/> : <div><ImageUp/><span>Nenhuma logo cadastrada</span></div>}</div>
    <div className="company-logo-actions">
      <label className="button button-secondary"><ImageUp/> {loading ? "Enviando..." : url ? "Substituir logo" : "Enviar logo"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={loading} onChange={event => event.target.files?.[0] && upload(event.target.files[0])}/></label>
      {url && <button type="button" className="button button-secondary" onClick={() => setUrl("")}><Trash2/> Remover</button>}
    </div>
    <small>Formatos: PNG, JPG ou WebP até 5 MB. Recomendado: fundo transparente e proporção horizontal.</small>
  </div>;
}

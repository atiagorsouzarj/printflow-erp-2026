import type { ReactNode } from "react";
import { DrawerClient } from "./drawer";

export const money = (value: string | number | null | undefined) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const number = (value: string | number | null | undefined, digits = 0) => Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: digits });
export const shortDate = (value: Date | string | null | undefined) => value ? new Intl.DateTimeFormat("pt-BR").format(new Date(value)) : "—";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-header"><div><p className="eyebrow">{eyebrow || "Visão geral"}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</div>;
}
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`card ${className}`}>{children}</section>; }
export function CardTitle({ children, detail }: { children: ReactNode; detail?: string }) { return <div className="card-title"><div><h2>{children}</h2>{detail && <p>{detail}</p>}</div></div>; }
export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "green" | "amber" | "red" | "blue" | "purple" | "gray" }) { return <span className={`badge badge-${tone}`}>{children}</span>; }
export function Empty({ title, description }: { title: string; description: string }) { return <div className="empty"><div className="empty-mark">◇</div><strong>{title}</strong><p>{description}</p></div>; }
export function Metric({ label, value, change, icon, tone = "blue" }: { label: string; value: ReactNode; change?: string; icon: ReactNode; tone?: string }) { return <Card className="metric"><div className={`metric-icon tone-${tone}`}>{icon}</div><div><p>{label}</p><strong>{value}</strong>{change && <small>{change}</small>}</div></Card>; }
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function Drawer({ label, title, children }: { label: string; title: string; children: ReactNode }) { return <DrawerClient label={label} title={title}>{children}</DrawerClient>; }
export function Submit({ children = "Salvar" }: { children?: ReactNode }) { return <button className="button button-primary" type="submit">{children}</button>; }

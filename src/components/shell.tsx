"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, BriefcaseBusiness, ChevronDown, CircleDollarSign, ClipboardList, CreditCard, ExternalLink, Gauge, Headphones, KanbanSquare, Mail, Menu, MessageCircle, Network, PackageOpen, Palette, PanelLeftClose, Plus, Printer, Search, Settings, ShoppingCart, Sparkles, Star, Truck, UserRound, UsersRound, Wrench, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { logout } from "@/app/auth-actions";

const groups = [
  { label: "OPERAÇÃO", items: [
    { href: "/", label: "Dashboard", icon: Gauge }, { href: "/kanban", label: "Kanban", icon: KanbanSquare }, { href: "/pdv", label: "PDV", icon: ShoppingCart },
    {href:"/orcamentos",label:"Orçamentos",icon:ClipboardList},{href:"/pedidos",label:"Pedidos",icon:PackageOpen},{href:"/artes",label:"Aprovação de arte",icon:Palette},{href:"/pagamentos",label:"Pagamentos",icon:CreditCard},{href:"/logistica",label:"Logística",icon:Truck},{href:"/fretes",label:"SuperFrete",icon:Truck},{href:"/impressao-producao",label:"Impressão interna",icon:Printer},
  ]},
  { label: "CADASTROS", items: [
    { href: "/crm", label: "Clientes", icon: UsersRound }, { href: "/pre-cadastros", label: "Pré-cadastros", icon: UserRound }, { href: "/produtos", label: "Produtos", icon: Boxes }, { href: "/servicos", label: "Serviços", icon: Wrench },
    { href: "/materiais", label: "Materiais", icon: BriefcaseBusiness }, { href: "/impressoras", label: "Impressoras", icon: Printer },
  ]},
  { label: "GESTÃO", items: [
    { href: "/financeiro", label: "Financeiro", icon: CircleDollarSign }, { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  ]},
  { label: "CANAIS", items: [
    {href:"/canais",label:"Canais de entrada",icon:Network},{href:"/whatsapp",label:"WhatsApp",icon:MessageCircle},{href:"/email",label:"E-mail",icon:Mail},{href:"/google-reviews",label:"Google Reviews",icon:Star}, { href: "/configuracoes?aba=integracoes", label: "Integrações", icon: Sparkles },
  ]},
];

export function Shell({children,user}:{children:ReactNode;user:{name:string;email:string;role:string}}){
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <div className="app-shell">
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><i></i><i></i><i></i></div><div><strong>PrintFlow</strong><span>GESTÃO GRÁFICA</span></div><button onClick={() => setOpen(false)} className="mobile-close"><X size={20}/></button></div>
      <nav>{groups.map(group => <div className="nav-group" key={group.label}><p>{group.label}</p>{group.items.map(item => { const Icon = item.icon; const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href); return <Link href={item.href} key={item.href} className={active ? "active" : ""} onClick={() => setOpen(false)}><Icon size={18}/><span>{item.label}</span>{item.label === "Orçamentos" && <em>4</em>}</Link>})}</div>)}</nav>
      <Link href="/cadastro" target="_blank" className="public-access"><div><ExternalLink/><span><strong>Cadastro público</strong><small>Abrir página do cliente</small></span></div><b>↗</b></Link>
      <div className="sidebar-bottom"><Link href="/configuracoes" className={pathname.startsWith("/configuracoes") ? "active" : ""}><Settings size={18}/> Painel de Controle</Link><button><PanelLeftClose size={18}/> Recolher menu</button></div>
    </aside>
    {open && <button className="mobile-overlay" onClick={() => setOpen(false)} aria-label="Fechar menu"/>}
    <div className="main-wrap">
      <header className="topbar"><button className="menu-button" onClick={() => setOpen(true)}><Menu size={21}/></button><div className="top-search"><Search size={18}/><input placeholder="Buscar pedidos, clientes, produtos..."/><kbd>⌘ K</kbd></div><div className="top-actions"><Link className="public-top-link" href="/cadastro" target="_blank"><ExternalLink/> Cadastro público</Link><Link className="quick-new" href="/orcamentos"><Plus size={17}/> Novo orçamento</Link><button className="support"><Headphones size={18}/></button><div className="profile"><div className="avatar">{user.name.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase()}</div><div><strong>{user.name}</strong><span>{user.role}</span></div><form action={logout}><button className="logout-button" title="Sair">Sair</button></form></div></div></header>
      <main className="content">{children}</main>
      <footer><span>PrintFlow ERP</span><span>Sistema operacional • Ambiente seguro</span></footer>
    </div>
  </div>;
}

import { db } from "@/db";
import { clients, financialEntries, materials, orders, quotes } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { AlertTriangle, ArrowUpRight, CircleDollarSign, ClipboardCheck, PackageCheck, UsersRound } from "lucide-react";
import { Badge, Card, CardTitle, Metric, PageHeader, money, shortDate } from "@/components/ui";
import Link from "next/link";
import {currentUser} from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Dashboard(){
  const user=await currentUser();
  const [[revenue], [orderCount], [clientCount], [quoteCount], recentOrders, lowMaterials, entries] = await Promise.all([
    db.select({ value: sql<string>`coalesce(sum(${financialEntries.amount}),0)` }).from(financialEntries).where(and(eq(financialEntries.type, "receber"), eq(financialEntries.status, "pago"))),
    db.select({ value: sql<number>`count(*)::int` }).from(orders), db.select({ value: sql<number>`count(*)::int` }).from(clients),
    db.select({ value: sql<number>`count(*)::int` }).from(quotes).where(eq(quotes.status, "enviado")),
    db.select({ order: orders, client: clients }).from(orders).innerJoin(clients, eq(orders.clientId, clients.id)).orderBy(desc(orders.createdAt)).limit(5),
    db.select().from(materials).where(sql`${materials.stock} <= ${materials.minimumStock}`).limit(5),
    db.select().from(financialEntries).orderBy(desc(financialEntries.createdAt)).limit(5),
  ]);
  const bars = [42,58,47,74,66,89,78];
  return <>
    <PageHeader eyebrow="Central de comando" title={`Bom dia, ${user?.name.split(" ")[0]||"Administrador"}.`} description="Acompanhe o ritmo da sua operação em tempo real." action={<Link href="/orcamentos" className="button button-secondary">Ver todos os orçamentos <ArrowUpRight size={14}/></Link>}/>
    <div className="metrics">
      <Metric label="Receita confirmada" value={money(revenue.value)} change="Fluxo realizado" icon={<CircleDollarSign size={20}/>} tone="green"/>
      <Metric label="Pedidos em produção" value={orderCount.value} change="Visão completa no Kanban" icon={<PackageCheck size={20}/>} tone="blue"/>
      <Metric label="Orçamentos aguardando" value={quoteCount.value} change="Precisam de acompanhamento" icon={<ClipboardCheck size={20}/>} tone="amber"/>
      <Metric label="Clientes ativos" value={clientCount.value} change="Base comercial" icon={<UsersRound size={20}/>} tone="purple"/>
    </div>
    <div className="grid-2">
      <Card><CardTitle detail="Receita x custos nos últimos 7 dias">Desempenho financeiro</CardTitle><div className="chart-wrap"><div className="chart-bars">{bars.map((h,i)=><div className="bar-group" key={i}><i className="bar bar-revenue" style={{height:`${h}%`}}></i><i className="bar bar-cost" style={{height:`${Math.max(18,h-27)}%`}}></i><span>{["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"][i]}</span></div>)}</div><div className="chart-legend"><span><i style={{background:"#31775b"}}/>Receitas</span><span><i style={{background:"#dce8e1"}}/>Custos</span></div></div></Card>
      <Card><CardTitle detail="Itens que precisam de reposição">Alertas de estoque</CardTitle><div className="list">{lowMaterials.length ? lowMaterials.map(m=><div className="list-item" key={m.id}><div className="metric-icon tone-amber" style={{width:32,height:32}}><AlertTriangle size={15}/></div><div className="list-content"><strong>{m.name}</strong><span>{m.sku} • mínimo {Number(m.minimumStock)} {m.unit}</span><div className="progress"><i style={{width:`${Math.min(100,Number(m.stock)/Math.max(1,Number(m.minimumStock))*100)}%`}}/></div></div><div className="list-value"><strong className="stock-low">{Number(m.stock)} {m.unit}</strong><span>disponível</span></div></div>) : <div className="empty"><strong>Estoque saudável</strong><p>Nenhum material abaixo do mínimo.</p></div>}</div></Card>
    </div>
    <div className="grid-equal">
      <Card><CardTitle detail="Últimos pedidos que entraram no fluxo">Produção recente</CardTitle><div className="table-wrap"><table className="table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Etapa</th><th>Total</th></tr></thead><tbody>{recentOrders.map(({order,client})=><tr key={order.id}><td><strong>{order.code}</strong><br/><small>{shortDate(order.createdAt)}</small></td><td>{client.name}</td><td><Badge tone={order.stage==="concluido"?"green":"blue"}>{order.stage}</Badge></td><td><strong>{money(order.total)}</strong></td></tr>)}</tbody></table></div></Card>
      <Card><CardTitle detail="Movimentações financeiras mais recentes">Fluxo do caixa</CardTitle><div className="list">{entries.map(e=><div className="list-item" key={e.id}><div className={`list-dot`} style={{background:e.type==="receber"?"#2b7c59":"#c0782c"}}/><div className="list-content"><strong>{e.description}</strong><span>{shortDate(e.createdAt)} • {e.status}</span></div><div className="list-value"><strong>{e.type==="pagar"?"− ":"+ "}{money(e.amount)}</strong><span>{e.type}</span></div></div>)}</div></Card>
    </div>
  </>;
}

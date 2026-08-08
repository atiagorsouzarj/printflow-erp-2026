"use client";
import { useState } from "react";
import { Calculator, Layers3, Settings2 } from "lucide-react";
import { PrinterEditor } from "./printer-editor";
import { Badge, Card, money } from "./ui";

type Category={id:number;name:string;technology:string;pricingMode:string};
type Printer={id:number;name:string;model:string|null;categoryId:number;acquisitionCost:string;usefulLifeMonths:number;monthlyVolume:number;maintenanceMonthly:string;energyCostHour:string;bwCost:string;colorCost:string;hourlyCost:string;pricingData:Record<string,number|string>|null;active:boolean};
type Consumable={id:number;printerId:number;name:string;kind:string;color:string|null;acquisitionCost:string;yieldAmount:string;coveragePercent:string;unit:string;active:boolean};
const order=["laser","inkjet","thermal","sublimation","cutter","three_d","custom"];
export function PrinterTabs({categories,printers,consumables}:{categories:Category[];printers:Printer[];consumables:Consumable[]}){
 const available=[...categories].filter(c=>printers.some(p=>p.categoryId===c.id)).sort((a,b)=>order.indexOf(a.technology)-order.indexOf(b.technology));
 const [active,setActive]=useState(available[0]?.id||0);
 const category=available.find(c=>c.id===active)||available[0];
 const list=printers.filter(p=>p.categoryId===category?.id);
 return <>
  <div className="printer-tabs">{available.map(c=><button type="button" className={category?.id===c.id?"active":""} key={c.id} onClick={()=>setActive(c.id)}><span>{icon(c.technology)}</span>{c.name}<Badge tone="blue">{printers.filter(p=>p.categoryId===c.id).length}</Badge></button>)}</div>
  {category&&<div className="category-explanation"><div><strong>{category.name}</strong><small>{friendly(category.technology)}</small></div><span>Perfil {category.technology} • cálculo por {category.pricingMode}</span></div>}
  <div className="printer-cards two-columns">
   {list.map(p=>{
    const used=consumables.filter(c=>c.printerId===p.id),depreciation=Number(p.acquisitionCost)/Math.max(1,p.usefulLifeMonths*p.monthlyVolume),fixed=depreciation+Number(p.maintenanceMonthly)/Math.max(1,p.monthlyVolume)+Number(p.pricingData?.fixedConsumable||0);
    return <Card className="printer-cost-card" key={p.id}>
      <div className="printer-card-head"><div className="printer-identity"><div>{icon(category?.technology||"")}</div><span><strong>{p.name}</strong><small>{p.model}</small></span></div><PrinterEditor printer={p} categories={categories} consumables={used}/></div>
      <div className="printer-cost-grid"><div><span>P&B a 5%</span><strong>{money(Number(p.bwCost)+fixed)}</strong></div><div><span>Cor a 5%</span><strong>{money(Number(p.colorCost)+fixed)}</strong></div><div><span>Hora máquina</span><strong>{money(Number(p.hourlyCost)+Number(p.energyCostHour))}</strong></div><div><span>Base fixa</span><strong>{money(fixed)}</strong></div>{["laser","inkjet","sublimation"].includes(category?.technology||"")&&[30,50,100].map(c=><div className={c===100?"highlight":""} key={c}><span>Cor a {c}%</span><strong>{money(Number(p.colorCost)*(c/5)+fixed)}</strong></div>)}</div>
      <div className="consumable-list"><p>{category?.technology==="three_d"?"Material selecionado no produto":`Consumíveis e desgaste (${used.length})`}</p>{used.map(c=><div key={c.id}><span><i className={`ink-${c.color||"none"}`}/>{c.name}</span><b>{money(Number(c.acquisitionCost)/Math.max(1,Number(c.yieldAmount)))}/{c.unit}</b></div>)}{!used.length&&<small>{category?.technology==="three_d"?"Filamento ou resina vem do estoque e é consumido por gramas.":"Adicione somente os insumos que deseja ratear."}</small>}</div>
    </Card>
   })}
   {category&&<TechnologyGuide category={category} printer={list[0]} materialsHint={materialsHint(category.technology)}/>} 
  </div>
 </>;
}
function TechnologyGuide({category,printer,materialsHint}:{category:Category;printer?:Printer;materialsHint:string}){const info=guide(category.technology);return <Card className="technology-guide"><div className="guide-icon"><Calculator/></div><p className="eyebrow">Como esta aba calcula</p><h3>{info.title}</h3><p>{info.description}</p><div className="guide-flow"><span><Settings2/> Equipamento<b>{info.machine}</b></span><span><Layers3/> Material<b>{materialsHint}</b></span></div><div className="cost-breakdown"><div className="cost-row"><span>Unidade principal</span><strong>{info.unit}</strong></div><div className="cost-row"><span>Volume de referência</span><strong>{printer?.monthlyVolume.toLocaleString("pt-BR")||"—"}</strong></div><div className="cost-row total"><span>Resultado</span><strong>Custo enviado à ficha do produto</strong></div></div><small>Edite o equipamento para ajustar rendimento, cobertura, energia, manutenção e depreciação.</small></Card>}
function guide(t:string){return ({laser:{title:"Laser CMYK",description:"Separa toner por cor e soma componentes de imagem, manutenção e depreciação.",machine:"Clique × cobertura",unit:"página/clique"},inkjet:{title:"Jato fotográfico",description:"Calcula as seis tintas, limpeza, caixa de manutenção e formato impresso.",machine:"Tinta × formato",unit:"página/foto"},thermal:{title:"Etiqueta térmica",description:"Rateia ribbon por metro e desgaste da cabeça. A etiqueta vem do estoque.",machine:"Ribbon em metros",unit:"etiqueta/metro"},sublimation:{title:"Sublimação CMYK",description:"Soma quatro tintas Genesis, papel de transferência, prensa e tempo operacional.",machine:"Impressão + prensa",unit:"folha/peça"},cutter:{title:"Plotter de recorte",description:"Precifica minuto de corte, passes e desgaste opcional. O material vem do estoque.",machine:"Minutos + passes",unit:"corte/tempo"},three_d:{title:"Impressão 3D",description:"Usa hora-máquina, energia e falha. Filamento ou resina entra por gramas.",machine:"Tempo de impressão",unit:"hora/peça"},custom:{title:"Tecnologia personalizada",description:"Use os parâmetros editáveis para construir a fórmula operacional.",machine:"Configuração livre",unit:"personalizada"}} as Record<string,{title:string;description:string;machine:string;unit:string}>)[t]||{title:"Equipamento",description:"Configuração técnica personalizada.",machine:"Custo operacional",unit:"personalizada"}}
function materialsHint(t:string){return ({laser:"Papel + acabamento",inkjet:"Papel fotográfico",thermal:"Etiqueta em rolo",sublimation:"Caneca/camisa + papel",cutter:"Vinil/papel",three_d:"Filamento ou resina"} as Record<string,string>)[t]||"Conforme a ficha"}
function friendly(t:string){return ({laser:"Produção digital em toner",inkjet:"Fotografia e personalizados",thermal:"Etiquetas e códigos",sublimation:"Transferência térmica",cutter:"Corte e acabamento",three_d:"Peças por peso e tempo"} as Record<string,string>)[t]||"Categoria personalizada"}
function icon(t:string){return ({laser:"⚡",inkjet:"💧",cutter:"✂️",thermal:"🏷️",sublimation:"🔥",three_d:"🧊"} as Record<string,string>)[t]||"🖨️"}

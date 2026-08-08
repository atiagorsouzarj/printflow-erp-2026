"use client";
import { createMarketingCampaign, saveMessageTemplate } from "@/app/actions";
import { Eye, Link2, Mail, MessageCircle, Save, Send } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type Template={id:number;event:string;label:string;channel:string;subject:string|null;body:string;automatic:boolean;active:boolean};
type Company={name:string;legalName?:string|null;logoUrl?:string|null;email?:string|null;phone?:string|null;website?:string|null;address?:string|null};
export function TemplateStudio({channel,templates,company}:{channel:"email"|"whatsapp";templates:Template[];company?:Company}){
 const first=templates[0], [selected,setSelected]=useState(first?.id||0), current=templates.find(t=>t.id===selected);
 const [label,setLabel]=useState(current?.label||"Novo template"),[event,setEvent]=useState(current?.event||"enviado"),[subject,setSubject]=useState(current?.subject||"Orçamento {{pedido.codigo}}"),[body,setBody]=useState(current?.body||"Olá {{cliente.nome}}, seu pedido {{pedido.codigo}} foi atualizado.\n\nAcesse: {{pedido.link}}");
 function choose(id:number){const template=templates.find(item=>item.id===id);if(!template)return;setSelected(id);setLabel(template.label);setEvent(template.event);setSubject(template.subject||"");setBody(template.body)}
 const sample=body.replaceAll("{{cliente.nome}}","Marcos Ribeiro Silva").replaceAll("{{pedido.codigo}}","PED-000017").replaceAll("{{pedido.etapa}}","Em produção").replaceAll("{{pedido.link}}","https://empresa.com/acompanhar/pedido");
 const business=company?.name||"PrintFlow Art Studio";
 return <div className="studio-layout">
  <aside className="studio-menu"><p>MODELOS DISPONÍVEIS</p>{templates.map(template=><button type="button" className={selected===template.id?"active":""} onClick={()=>choose(template.id)} key={template.id}>{channel==="email"?<Mail/>:<MessageCircle/>}<span><strong>{template.label}</strong><small>{template.event} • {template.automatic?"automático":"manual"}</small></span></button>)}</aside>
  <section className="studio-editor"><form action={saveMessageTemplate}><input type="hidden" name="id" value={selected}/><input type="hidden" name="channel" value={channel}/><div className="studio-fields">
   <label>Nome do modelo<input name="label" value={label} onChange={e=>setLabel(e.target.value)}/></label>
   <label>Evento do ERP<select name="event" value={event} onChange={e=>setEvent(e.target.value)}><option value="enviado">Orçamento enviado</option><option value="aprovado">Pedido aprovado</option><option value="arte">Arte para aprovação</option><option value="producao">Em produção</option><option value="acabamento">Acabamento</option><option value="concluido">Pronto / concluído</option><option value="entregue">Entregue / pós-venda</option><option value="cobranca">Cobrança</option><option value="marketing">Campanha</option></select></label>
   {channel==="email"&&<label className="full">Assunto<input name="subject" value={subject} onChange={e=>setSubject(e.target.value)}/></label>}
   <label className="full">Conteúdo<textarea name="body" value={body} onChange={e=>setBody(e.target.value)}/></label>
   <div className="placeholder-bar"><Link2/> Use: {`{{cliente.nome}} · {{pedido.codigo}} · {{pedido.etapa}} · {{pedido.link}}`}</div>
   <label><input name="automatic" type="checkbox" defaultChecked={current?.automatic??true}/> Automatizar pelo ERP/Kanban</label><input type="hidden" name="active" value="on"/><button className="button button-primary"><Save/> Salvar template</button>
  </div></form></section>
  <section className="studio-preview"><div className="preview-title"><Eye/> PRÉ-VISUALIZAÇÃO AO VIVO</div>{channel==="email"?<div className="email-preview"><header>{company?.logoUrl&&<Image unoptimized src={company.logoUrl} alt={business} width={190} height={70}/>}<strong>{business}</strong><span>{company?.legalName||"GRÁFICA RÁPIDA E PERSONALIZADOS"}</span></header><main><h2>{subject.replaceAll("{{pedido.codigo}}","PED-000017")}</h2>{sample.split("\n").map((line,index)=><p key={index}>{line||" "}</p>)}<button>Acessar pedido</button></main><footer><strong>{business.toUpperCase()}</strong><br/>{company?.address}<br/>{company?.phone} • {company?.email}<br/>{company?.website}</footer></div>:<div className="wa-preview"><div className="wa-company"><MessageCircle/><span><strong>{business}</strong><small>Conta comercial</small></span></div><div className="wa-bubble">{sample.split("\n").map((line,index)=><p key={index}>{line||" "}</p>)}<a>↗ Acessar pedido</a><time>18:49 ✓✓</time></div></div>}
   <form action={createMarketingCampaign} className="campaign-box"><input type="hidden" name="channel" value={channel}/><input type="hidden" name="subject" value={subject}/><input type="hidden" name="body" value={body}/><strong><Send/> Envio de marketing</strong><p>Gera fila somente para clientes cadastrados, liberados e com consentimento.</p><button className="button button-secondary" disabled={event!=="marketing"}>Criar campanha consentida</button></form>
  </section>
 </div>;
}

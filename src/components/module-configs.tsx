"use client";
import { saveModuleConfig } from "@/app/actions";
import { CreditCard, Mail, MapPin, MessageCircle, PhoneCall, Receipt, Send, Settings2, Star, Truck } from "lucide-react";
import { Submit } from "./ui";
import { useState } from "react";

type Config = Record<string, Record<string, string | number | boolean>>;
type Module = { id: string; name: string; icon: typeof Mail; secret: string; fields: string[] };
const integrations: Module[] = [
  { id: "viacep", name: "ViaCEP", icon: MapPin, secret: "Sem chave", fields: ["endpoint", "timeoutSeconds"] },
  { id: "infinitepay", name: "InfinitePay", icon: CreditCard, secret: "INFINITEPAY_HANDLE / WEBHOOK_SECRET", fields: ["environment", "redirectUrl", "webhookUrl"] },
  { id: "banco_inter", name: "Banco Inter / Pix", icon: CreditCard, secret: "INTER_CLIENT_ID / SECRET / CERT / KEY", fields: ["environment", "pixKey", "webhookUrl"] },
  { id: "superfrete", name: "SuperFrete", icon: Truck, secret: "SUPERFRETE_TOKEN", fields: ["environment", "originCep", "defaultService"] },
  { id: "google_business", name: "Google Business", icon: Star, secret: "GOOGLE_BUSINESS_ACCESS_TOKEN", fields: ["accountId", "locationId", "syncReviews"] },
  { id: "external_api", name: "API Externa", icon: PhoneCall, secret: "EXTERNAL_API_TOKEN", fields: ["allowedOrigin", "captureLeads", "allowOrderRead"] },
  { id: "fiscal", name: "Emissão fiscal", icon: Receipt, secret: "CERTIFICADO_A1 / CSC", fields: ["environment", "nfceSeries", "nfeSeries", "municipalityCode"] },
];
const communications: Module[] = [
  { id: "smtp", name: "E-mail SMTP", icon: Mail, secret: "SMTP_HOST / USER / PASS", fields: ["fromName", "fromEmail", "replyTo", "dailyLimit"] },
  { id: "whatsapp_qr", name: "WhatsApp QR / Bridge", icon: MessageCircle, secret: "WHATSAPP_BRIDGE_URL / TOKEN", fields: ["sessionName", "businessNumber", "dailyLimit", "minimumInterval"] },
  { id: "whatsapp_cloud", name: "WhatsApp Meta Cloud", icon: MessageCircle, secret: "CLOUD_ACCESS_TOKEN / PHONE_ID / APP_SECRET", fields: ["businessNumber", "apiVersion", "templateName", "languageCode", "dailyLimit"] },
  { id: "marketing", name: "Marketing consentido", icon: Send, secret: "Usa consentimentos do CRM", fields: ["defaultChannel", "businessHours", "maxRecipients", "requireApproval"] },
  { id: "automation", name: "Automação transacional", icon: Settings2, secret: "Usa templates internos", fields: ["sendOnQuote", "sendOnKanban", "sendOnPayment", "sendAfterDelivery"] },
];
const checkboxFields = ["syncReviews", "captureLeads", "allowOrderRead", "requireApproval", "sendOnQuote", "sendOnKanban", "sendOnPayment", "sendAfterDelivery"];
export function ModuleConfigs({section,config}:{section:"integrations"|"communications";config:Config}){
  const modules=section==="integrations"?integrations:communications;
  const [active,setActive]=useState(modules[0]?.id||"");
  const effectiveActive=modules.some(item=>item.id===active)?active:modules[0]?.id||"";
  const selectedModule=modules.find(item=>item.id===effectiveActive)||modules[0];
  if(!selectedModule)return null;
  const Icon=selectedModule.icon,values=config[selectedModule.id]||{};
  return <div className="module-tabs-shell">
    {section==="communications"&&<div className="provider-warning">WhatsApp: QR/Bridge e Meta Cloud são provedores independentes. O ERP mantém somente um ativo.</div>}
    <nav className="module-tabs">{modules.map(item=>{const TabIcon=item.icon;return <button type="button" className={effectiveActive===item.id?"active":""} onClick={()=>setActive(item.id)} key={item.id}><TabIcon/><span>{item.name}</span>{config[item.id]?.enabled&&<i/>}</button>})}</nav>
    <form action={saveModuleConfig} className="module-config module-config-single">
      <input type="hidden" name="section" value={section}/><input type="hidden" name="provider" value={selectedModule.id}/>
      <header><div className="metric-icon tone-blue"><Icon/></div><div><strong>{selectedModule.name}</strong><span>Credenciais no servidor: {selectedModule.secret}</span></div><label className="switch-label"><input name="enabled" type="checkbox" defaultChecked={Boolean(values.enabled)}/><span>Ativo</span></label></header>
      <div className="module-fields">{selectedModule.fields.map(field=><label key={field}>{label(field)}{checkboxFields.includes(field)?<input name={field} type="checkbox" defaultChecked={Boolean(values[field])}/>:<input name={field} defaultValue={String(values[field]??defaults(field))}/>}</label>)}</div>
      <div className="form-actions"><Submit>Salvar {selectedModule.name}</Submit></div>
    </form>
  </div>;
}
const labels: Record<string,string> = { endpoint:"Endpoint",timeoutSeconds:"Timeout (s)",environment:"Ambiente",redirectUrl:"URL de retorno",webhookUrl:"URL do webhook",originCep:"CEP de origem",defaultService:"Serviços (IDs)",pixKey:"Chave Pix",apiVersion:"Versão Graph API",templateName:"Template Meta aprovado",languageCode:"Idioma do template",accountId:"Conta Google",locationId:"Local Google",syncReviews:"Sincronizar avaliações",allowedOrigin:"Origem autorizada",captureLeads:"Permitir criar leads",allowOrderRead:"Permitir consultar pedidos",nfceSeries:"Série NFC-e",nfeSeries:"Série NF-e",municipalityCode:"Código do município",fromName:"Nome do remetente",fromEmail:"E-mail remetente",replyTo:"Responder para",dailyLimit:"Limite diário",sessionName:"Nome da sessão",businessNumber:"Número empresarial",minimumInterval:"Intervalo mínimo (s)",defaultChannel:"Canal padrão",businessHours:"Horário permitido",maxRecipients:"Máximo por campanha",requireApproval:"Exigir aprovação",sendOnQuote:"Orçamento",sendOnKanban:"Etapas do Kanban",sendOnPayment:"Pagamento",sendAfterDelivery:"Pós-venda" };
function label(value:string){return labels[value] || value}
function defaults(value:string){if(value==="endpoint")return "https://viacep.com.br/ws";if(value==="environment")return "sandbox";if(value==="timeoutSeconds")return "10";if(value==="businessHours")return "08:00-18:00";if(value==="apiVersion")return "v23.0";if(value==="languageCode")return "pt_BR";return ""}

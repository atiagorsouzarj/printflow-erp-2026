"use client";
import { QrCode, RefreshCw, ShieldCheck, Wifi } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
type State={configured?:boolean;status?:string;qr?:string;phone?:string};
export function WhatsappQr(){
 const [state,setState]=useState<State>({status:"loading"});const [loading,setLoading]=useState(false);
 async function load(method="GET",interactive=true){if(interactive)setLoading(true);try{const r=await fetch("/api/whatsapp/session",{method});setState(await r.json())}finally{if(interactive)setLoading(false)}}
 useEffect(()=>{let active=true;const poll=async()=>{const r=await fetch("/api/whatsapp/session");const data=await r.json();if(active)setState(data)};const first=window.setTimeout(()=>void poll(),0);const timer=window.setInterval(()=>void poll(),8000);return()=>{active=false;clearTimeout(first);clearInterval(timer)}},[]);
 return <div className="qr-panel"><div className="qr-visual">{state.qr?<Image unoptimized src={state.qr} alt="QR para conectar WhatsApp" width={210} height={210}/>:<QrCode size={120}/>}</div><div className="qr-info"><p className="eyebrow">Dispositivo vinculado</p><h3>{state.status==="connected"?"WhatsApp conectado":"Conectar com QR Code"}</h3><p>{!state.configured?"Configure WHATSAPP_BRIDGE_URL e WHATSAPP_BRIDGE_TOKEN no servidor.":state.status==="connected"?`Sessão empresarial ativa${state.phone?` em ${state.phone}`:""}.`:"Abra WhatsApp › Aparelhos conectados › Conectar aparelho e leia o QR."}</p><div className="qr-security"><span><ShieldCheck/> Credenciais somente no servidor</span><span><Wifi/> Reconexão controlada</span></div><button className="button button-primary" disabled={loading||!state.configured} onClick={()=>load("POST")}><RefreshCw className={loading?"spin":""}/> {state.status==="connected"?"Atualizar status":"Gerar novo QR"}</button></div></div>
}

"use server";

import { db } from "@/db";
import { artworkVersions,bankPixCharges,cashMovements,cashSessions,clients,deliveries,financialAccounts,financialCategories,financialEntries,financialTransfers,googleReviewsCache,integrationLogs,paymentLinks,shippingQuotes, leads, materialCategories, materials, messageTemplates, notifications, orders, outsourcedServices, outsourcedServiceTiers, posSaleItems, posSales, printerCategories, printerConsumables, printers, productMaterials, productOutsourcedServices, productPrinterProcesses, products, quoteItems, quotes, settings, stockMovements, suppliers, whatsappConversations, whatsappSettings } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import {requireUser} from "@/lib/auth";
import {digits,validatePerson} from "@/lib/validation";
import {configs,googleAccessToken,interRequest,interToken,log,sendSmtp,sendWhatsApp} from "@/lib/integrations";

const text = (f: FormData, key: string) => { const values=f.getAll(key); return String(values.at(-1) ?? "").trim(); };
const num = (f: FormData, key: string) => Number(text(f,key).replace(",", ".")) || 0;
const refresh = () => {
  revalidatePath("/");
  revalidatePath("/materiais");
  revalidatePath("/impressoras");
  revalidatePath("/produtos");
  revalidatePath("/orcamentos");
  revalidatePath("/kanban");
};

export async function addSupplier(form: FormData) {await requireUser();
  await db.insert(suppliers).values({ name: text(form, "name"), contact: text(form, "contact"), phone: text(form, "phone"), email: text(form, "email") });
  refresh();
}

export async function addMaterial(form: FormData) {await requireUser();
  const units=Math.max(1,num(form,"labelsPerRoll")||num(form,"unitsPerPackage")||1);const packageCost=num(form,"averageCost");
  await db.insert(materials).values({sku:text(form,"sku"),name:text(form,"name"),category:text(form,"category"),categoryId:num(form,"categoryId")||null,unit:text(form,"unit"),purchaseUnit:text(form,"purchaseUnit"),unitsPerPackage:String(units),format:text(form,"format"),grammage:String(num(form,"grammage"))||null,size:text(form,"size"),color:text(form,"color"),attributes:{brand:text(form,"brand"),finish:text(form,"finish"),composition:text(form,"composition"),shape:text(form,"shape"),rollLengthMeters:num(form,"rollLengthMeters"),labelsPerRoll:num(form,"labelsPerRoll"),widthMm:num(form,"widthMm"),heightMm:num(form,"heightMm"),gapMm:num(form,"gapMm")},minimumStock:String(num(form,"minimumStock")),averageCost:String(packageCost/units),stock:String(num(form,"initialStock")*units),supplierId:num(form,"supplierId")||null});refresh();
}

export async function addMaterialCategory(form:FormData){await requireUser();await db.insert(materialCategories).values({name:text(form,"name"),code:text(form,"code"),attributeSchema:[]});revalidatePath("/materiais");}

export async function purchaseMaterial(form: FormData) {await requireUser();
  const materialId = num(form, "materialId");
  const quantity = num(form, "quantity");
  const unitCost = num(form, "unitCost");
  if (!materialId || quantity <= 0) return;
  await db.transaction(async (tx) => {
    const [current] = await tx.select().from(materials).where(eq(materials.id, materialId)).for("update");
    if (!current) throw new Error("Material não encontrado");
    const oldStock = Number(current.stock);
    const newStock = oldStock + quantity;
    const average = newStock > 0 ? ((oldStock * Number(current.averageCost)) + quantity * unitCost) / newStock : unitCost;
    await tx.update(materials).set({ stock: String(newStock), averageCost: String(average), updatedAt: new Date() }).where(eq(materials.id, materialId));
    await tx.insert(stockMovements).values({ materialId, type: "entrada", quantity: String(quantity), unitCost: String(unitCost), reason: text(form, "reason") || "Compra de material" });
    await tx.insert(financialEntries).values({ type: "pagar", description: `Compra de ${current.name}`, amount: String(quantity * unitCost), status: "pendente", dueDate: text(form, "dueDate") || null });
  });
  refresh();
}

export async function addPrinterCategory(form: FormData) {await requireUser();
  await db.insert(printerCategories).values({name:text(form,"name"),technology:text(form,"technology")||"custom",pricingMode:text(form,"pricingMode"),description:text(form,"description"),pricingConfig:{defaultCoverage:num(form,"defaultCoverage"),includeMaintenance:true}});
  refresh();
}

export async function addPrinter(form: FormData) {await requireUser();
  const id = num(form, "id");
  const consumables = [1,2,3,4,5,6,7,8,9,10].map(i=>({name:text(form,`consumableName_${i}`),kind:text(form,`consumableKind_${i}`)||"consumable",color:text(form,`consumableColor_${i}`),acquisitionCost:num(form,`consumableCost_${i}`),yieldAmount:Math.max(1,num(form,`consumableYield_${i}`)),coveragePercent:num(form,`consumableCoverage_${i}`)||5,unit:text(form,`consumableUnit_${i}`)||"pag"})).filter(x=>x.name);
  const variableConsumables=consumables.filter(x=>x.kind!=="wear");const wearCost=consumables.filter(x=>x.kind==="wear").reduce((s,x)=>s+x.acquisitionCost/x.yieldAmount,0);const bwCalculated=variableConsumables.filter(x=>["black","preto",""].includes(x.color.toLowerCase())).reduce((s,x)=>s+x.acquisitionCost/x.yieldAmount,0);
  const colorCalculated=variableConsumables.reduce((s,x)=>s+x.acquisitionCost/x.yieldAmount,0);
  const values={ name:text(form,"name"),model:text(form,"model"),categoryId:num(form,"categoryId"),acquisitionCost:String(num(form,"acquisitionCost")),usefulLifeMonths:num(form,"usefulLifeMonths")||60,monthlyVolume:num(form,"monthlyVolume")||10000,maintenanceMonthly:String(num(form,"maintenanceMonthly")),energyCostHour:String(num(form,"energyCostHour")),bwCost:String(num(form,"bwCost")||bwCalculated),colorCost:String(num(form,"colorCost")||colorCalculated),hourlyCost:String(num(form,"hourlyCost")),pricingData:{a4:num(form,"priceA4"),a3:num(form,"priceA3"),a3plus:num(form,"priceA3Plus"),photo10x15:num(form,"price10x15"),cutMinute:num(form,"cutMinute"),cutPass:num(form,"cutPass"),powerWatts:num(form,"powerWatts"),failurePercent:num(form,"machineFailurePercent"),fixedConsumable:wearCost},active:form.get("active")!=="off" };
  await db.transaction(async tx=>{let printerId=id;if(id){await tx.update(printers).set(values).where(eq(printers.id,id));await tx.delete(printerConsumables).where(eq(printerConsumables.printerId,id));}else{const [created]=await tx.insert(printers).values(values).returning();printerId=created.id;}if(consumables.length)await tx.insert(printerConsumables).values(consumables.map(x=>({printerId,name:x.name,kind:x.kind,color:x.color,acquisitionCost:String(x.acquisitionCost),yieldAmount:String(x.yieldAmount),coveragePercent:String(x.coveragePercent),unit:x.unit})));});
  refresh();
}

export async function saveOutsourcedService(form:FormData){await requireUser();const id=num(form,"id"),pricingMethod=text(form,"pricingMethod")||"sheet_nesting",pricePerM2=num(form,"pricePerM2");const values={name:text(form,"name"),technology:text(form,"technology"),pricingMethod,pricePerM2:String(pricePerM2),supplierId:num(form,"supplierId")||null,description:text(form,"description"),updatedAt:new Date()};await db.transaction(async tx=>{let serviceId=id;if(id)await tx.update(outsourcedServices).set(values).where(eq(outsourcedServices.id,id));else{const [created]=await tx.insert(outsourcedServices).values(values).returning();serviceId=created.id}if(pricingMethod==="per_m2"){const [tier]=await tx.select().from(outsourcedServiceTiers).where(eq(outsourcedServiceTiers.serviceId,serviceId)).limit(1);const tierValues={serviceId,label:"Preço por m²",sheetWidthCm:"100",sheetHeightCm:"100",price:String(pricePerM2),active:true};if(tier)await tx.update(outsourcedServiceTiers).set(tierValues).where(eq(outsourcedServiceTiers.id,tier.id));else await tx.insert(outsourcedServiceTiers).values(tierValues);}});revalidatePath("/servicos");}

export async function saveOutsourcedTier(form:FormData){await requireUser();const id=num(form,"id");const values={serviceId:num(form,"serviceId"),label:text(form,"label"),sheetWidthCm:String(num(form,"sheetWidthCm")),sheetHeightCm:String(num(form,"sheetHeightCm")),price:String(num(form,"price")),active:true};if(id)await db.update(outsourcedServiceTiers).set(values).where(eq(outsourcedServiceTiers.id,id));else await db.insert(outsourcedServiceTiers).values(values);revalidatePath("/servicos");}

export async function addClient(form:FormData){await requireUser();const type=text(form,"type")||"pf",document=digits(text(form,"document")),email=text(form,"email").toLowerCase(),phone=text(form,"whatsapp")||text(form,"mobile")||text(form,"phone"),birthDate=text(form,"birthDate"),cep=text(form,"cep");const errors=validatePerson({type,document,email,phone,birthDate,cep});if(!text(form,"name"))errors.push("Nome ou razão social é obrigatório");if(errors.length)throw new Error(errors.join("; "));if(document){const [duplicate]=await db.select().from(clients).where(sql`regexp_replace(coalesce(${clients.document}, ''), '\\D', '', 'g') = ${document}`).limit(1);if(duplicate)throw new Error("CPF/CNPJ já cadastrado no CRM");}
  await db.insert(clients).values({
    type,name:text(form,"name"),nickname: text(form, "nickname"), company: text(form, "company"),
    fantasyName: text(form, "fantasyName"), document: text(form, "document"), stateRegistration: text(form, "stateRegistration"),
    birthDate: text(form, "birthDate") || null, gender: text(form, "gender"), segment: text(form, "segment"), status: text(form, "status") || "liberado",
    marketingSource: text(form, "marketingSource"), foundUsAt: text(form, "foundUsAt"), contactPerson: text(form, "contactPerson"),
    email,phone:text(form,"phone"), mobile: text(form, "mobile"), whatsapp: text(form, "whatsapp"),
    instagram: text(form, "instagram"), facebook: text(form, "facebook"), cep: text(form, "cep"), address: text(form, "address"),
    addressNumber: text(form, "addressNumber"), complement: text(form, "complement"), neighborhood: text(form, "neighborhood"), city: text(form, "city"), uf: text(form, "uf"),
    acceptsWhatsapp: form.get("acceptsWhatsapp") === "on", acceptsEmail: form.get("acceptsEmail") === "on", acceptsVoice: form.get("acceptsVoice") === "on",
    whatsappOptOut: form.get("whatsappOptOut") === "on", notes: text(form, "notes"),
  });
  refresh();
}

export async function addLead(form:FormData){const origin=text(form,"origin")||"manual",phone=text(form,"phone"),type=text(form,"type")||"pf",document=digits(text(form,"document")),email=text(form,"email").toLowerCase(),birthDate=text(form,"birthDate"),cep=text(form,"cep");const errors=validatePerson({type,document,email,phone,birthDate,cep});if(!text(form,"name"))errors.push("Nome ou razão social é obrigatório");if(!phone)errors.push("WhatsApp ou telefone é obrigatório");if(errors.length)throw new Error(errors.join("; "));if(phone){const recent=new Date(Date.now()-60_000);const [duplicate]=await db.select().from(leads).where(and(eq(leads.phone,phone),sql`${leads.createdAt} > ${recent}`)).limit(1);if(duplicate){if(origin==="pagina_publica")redirect(`/cadastro/sucesso?protocolo=${duplicate.protocol||`PR-${duplicate.id}`}`);return;}}
  const protocol = `PR-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth()+1).padStart(2,"0")}-${Date.now().toString().slice(-5)}`;
  await db.insert(leads).values({
    protocol,type,name:text(form,"name"),document,birthDate:birthDate||null,gender:text(form,"gender"),foundUsAt:text(form,"foundUsAt"),email,
    phone:text(form,"phone"),interest:text(form,"interest"),message:text(form,"message"),origin,
    score: num(form, "score") || 50, cep: text(form, "cep"), address: text(form, "address"), addressNumber: text(form, "addressNumber"),
    neighborhood: text(form, "neighborhood"), city: text(form, "city"), uf: text(form, "uf"), acceptsWhatsapp: form.get("acceptsWhatsapp") === "on",
    acceptsEmail: form.get("acceptsEmail") === "on", acceptsVoice: form.get("acceptsVoice") === "on",
  });
  revalidatePath("/pre-cadastros");revalidatePath("/cadastro");refresh();if(origin==="pagina_publica")redirect(`/cadastro/sucesso?protocolo=${protocol}`);
}

export async function convertLead(form: FormData) {await requireUser();
  const id = num(form, "leadId");
  await db.transaction(async (tx) => {
    const [lead] = await tx.select().from(leads).where(eq(leads.id, id)).for("update");
    if (!lead || lead.status === "convertido") return;
    await tx.insert(clients).values({ type: lead.type, name:lead.name,document:lead.document,birthDate:lead.birthDate,gender:lead.gender,foundUsAt:lead.foundUsAt,email:lead.email,phone:lead.phone, mobile: lead.phone, whatsapp: lead.phone, cep: lead.cep, address: lead.address, addressNumber: lead.addressNumber, neighborhood: lead.neighborhood, city: lead.city, uf: lead.uf, marketingSource: lead.origin, acceptsWhatsapp: lead.acceptsWhatsapp, acceptsEmail: lead.acceptsEmail, acceptsVoice: lead.acceptsVoice });
    await tx.update(leads).set({ status: "convertido" }).where(eq(leads.id, id));
  });
  revalidatePath("/pre-cadastros"); refresh();
}

export async function addProduct(form: FormData) {await requireUser();
  const printerId = num(form, "printerId") || null;
  let printCost = 0;
  if (printerId) {
    const [printer] = await db.select().from(printers).where(eq(printers.id, printerId));
    if (printer) {
      const [category]=await db.select().from(printerCategories).where(eq(printerCategories.id,printer.categoryId));const technology=category?.technology||"custom";const clicks=num(form,"printsPerUnit")||1;const mode=text(form,"printMode");const depreciation=Number(printer.acquisitionCost)/Math.max(1,printer.usefulLifeMonths*printer.monthlyVolume);const maintenance=Number(printer.maintenanceMonthly)/Math.max(1,printer.monthlyVolume);const fixed=depreciation+maintenance+Number(printer.pricingData?.fixedConsumable||0);const coverage=Math.max(0,num(form,"coveragePercent")||5);const size=text(form,"paperSize").toLowerCase();const key=size.includes("a3+")||size.includes("sra3")?"a3plus":size.includes("a3")?"a3":"a4";const configured=Number(printer.pricingData?.[key]||0);const variable=mode==="bw"?Number(printer.bwCost):Number(printer.colorCost);
      if(["laser","inkjet","sublimation"].includes(technology)){const reference=5;printCost=clicks*((configured||variable)*(coverage/reference)+fixed);}else if(technology==="thermal"){const meters=num(form,"consumableUsage");printCost=meters*variable+clicks*fixed;}else if(technology==="three_d"){const hours=num(form,"machineMinutes")/60;printCost=hours*(Number(printer.hourlyCost)+Number(printer.energyCostHour))+hours*depreciation;}else{printCost=clicks*(variable+fixed)+(num(form,"machineMinutes")/60)*(Number(printer.hourlyCost)+Number(printer.energyCostHour));}
    }
  }
  const selected: { materialId: number; quantity: number; waste: number; cost: number }[] = [];
  const allMaterials = await db.select().from(materials);
  for (const material of allMaterials) {
    let quantity = num(form, `material_${material.id}`);const is3d=["filamento","resina","3d"].some(x=>(material.category||"").toLowerCase().includes(x));if(is3d&&num(form,"weightGrams")>0)quantity=num(form,"weightGrams")/1000;
    if (quantity > 0) {
      const waste = num(form, `waste_${material.id}`);
      selected.push({ materialId: material.id, quantity, waste, cost: quantity * (1 + waste / 100) * Number(material.averageCost) });
    }
  }
  const materialCost = selected.reduce((sum, item) => sum + item.cost, 0);
  const serviceTierId=num(form,"outsourcedTierId");const artworkWidth=num(form,"artworkWidthCm"),artworkHeight=num(form,"artworkHeightCm"),serviceGap=num(form,"serviceGap")||0.3;let outsourcedCost=0;let outsourcedComposition:{tierId:number;copies:number;unitCost:number}|null=null;if(serviceTierId&&artworkWidth>0&&artworkHeight>0){const [tier]=await db.select().from(outsourcedServiceTiers).where(eq(outsourcedServiceTiers.id,serviceTierId));if(tier){const [service]=await db.select().from(outsourcedServices).where(eq(outsourcedServices.id,tier.serviceId));if(service?.pricingMethod==="per_m2"){const area=(artworkWidth/100)*(artworkHeight/100);outsourcedCost=area*Number(service.pricePerM2);outsourcedComposition={tierId:serviceTierId,copies:1,unitCost:outsourcedCost};}else{const sw=Number(tier.sheetWidthCm),sh=Number(tier.sheetHeightCm);const normal=Math.floor(sw/(artworkWidth+serviceGap))*Math.floor(sh/(artworkHeight+serviceGap));const rotated=Math.floor(sw/(artworkHeight+serviceGap))*Math.floor(sh/(artworkWidth+serviceGap));const copies=Math.max(1,normal,rotated);outsourcedCost=Number(tier.price)/copies;outsourcedComposition={tierId:serviceTierId,copies,unitCost:outsourcedCost};}}}
  const secondaryPrinterId=num(form,"secondaryPrinterId");let secondaryCost=0;let secondaryProcess:{printerId:number;minutes:number;passes:number;cost:number}|null=null;if(secondaryPrinterId){const [machine]=await db.select().from(printers).where(eq(printers.id,secondaryPrinterId));if(machine){const minutes=num(form,"secondaryMinutes"),passes=num(form,"secondaryPasses");secondaryCost=minutes*Number(machine.pricingData?.cutMinute||0)+passes*Number(machine.pricingData?.cutPass||0)+(minutes/60)*(Number(machine.hourlyCost)+Number(machine.energyCostHour));secondaryProcess={printerId:secondaryPrinterId,minutes,passes,cost:secondaryCost};}}
  const laborCost = (num(form, "laborMinutes") / 60) * num(form, "laborHourCost");
  const minimumQuantity = Math.max(1, num(form, "minimumQuantity") || 1);
  const setupPerUnit = num(form, "setupCost") / minimumQuantity;
  const directCost = materialCost + outsourcedCost + printCost + secondaryCost + laborCost + num(form, "extraCost") + setupPerUnit;
  const failurePercent = Math.min(90, num(form, "failurePercent"));
  const baseCost = directCost / (1 - failurePercent / 100);
  const rates = num(form, "taxPercent") + num(form, "cardFeePercent") + num(form, "commissionPercent") + num(form, "marginPercent");
  const salePrice = rates < 100 ? baseCost / (1 - rates / 100) : baseCost * 2;
  const quantityTiers = [1, 2, 3].map((i) => ({ from: num(form, `tierFrom_${i}`), discount: num(form, `tierDiscount_${i}`) })).filter((tier) => tier.from > 0 && tier.discount > 0);
  await db.transaction(async (tx) => {
    const [product] = await tx.insert(products).values({
      sku: text(form, "sku"), name: text(form, "name"), kind: text(form, "kind"), category: text(form, "category"), description: text(form, "description"),
      printerId, printMode: text(form, "printMode"), paperSize: text(form, "paperSize"), printsPerUnit: String(num(form, "printsPerUnit") || 1),coveragePercent:String(num(form,"coveragePercent")||5),consumableUsage:String(num(form,"consumableUsage")),
      minimumQuantity: String(minimumQuantity), setupCost: String(num(form, "setupCost")), machineMinutes: String(num(form, "machineMinutes")),
      laborMinutes: String(num(form, "laborMinutes")), laborHourCost: String(num(form, "laborHourCost")), extraCost: String(num(form, "extraCost")), failurePercent: String(failurePercent),
      weightGrams: String(num(form, "weightGrams")), widthCm: String(num(form, "widthCm")), heightCm: String(num(form, "heightCm")), lengthCm: String(num(form, "lengthCm")), quantityTiers,
      taxPercent: String(num(form, "taxPercent")), cardFeePercent: String(num(form, "cardFeePercent")), commissionPercent: String(num(form, "commissionPercent")),
      marginPercent:String(num(form,"marginPercent")),calculatedCost:String(baseCost),salePrice:String(salePrice),leadTimeDays:num(form,"leadTimeDays")||3,
    }).returning();
    if (selected.length) await tx.insert(productMaterials).values(selected.map((item) => ({ productId: product.id, materialId: item.materialId, quantity: String(item.quantity), wastePercent: String(item.waste) })));
    if(outsourcedComposition)await tx.insert(productOutsourcedServices).values({productId:product.id,serviceTierId:outsourcedComposition.tierId,artworkWidthCm:String(artworkWidth),artworkHeightCm:String(artworkHeight),copiesPerSheet:outsourcedComposition.copies,unitCost:String(outsourcedComposition.unitCost)});if(secondaryProcess)await tx.insert(productPrinterProcesses).values({productId:product.id,printerId:secondaryProcess.printerId,process:"acabamento/corte",minutes:String(secondaryProcess.minutes),passes:String(secondaryProcess.passes),calculatedCost:String(secondaryProcess.cost)});
  });
  refresh();
}

export async function createQuote(form:FormData){await requireUser();const clientId=num(form,"clientId");if(!clientId)throw new Error("Selecione um cliente");const raw=text(form,"items");let requested:{productId:number;quantity:number;unitPrice:number}[]=[];try{requested=JSON.parse(raw)}catch{throw new Error("Itens do orçamento inválidos")}if(!requested.length)throw new Error("Adicione ao menos um item");const validated:{productId:number;description:string;quantity:number;unitPrice:number;total:number}[]=[];for(const item of requested){const [product]=await db.select().from(products).where(and(eq(products.id,Number(item.productId)),eq(products.active,true))).limit(1);const quantity=Number(item.quantity),unitPrice=Number(item.unitPrice);if(!product||!Number.isFinite(quantity)||quantity<=0||!Number.isFinite(unitPrice)||unitPrice<0)throw new Error("Produto, quantidade ou preço inválido");validated.push({productId:product.id,description:product.name,quantity,unitPrice,total:quantity*unitPrice})}const shipping=num(form,"shippingCost"),discount=num(form,"discount"),subtotal=validated.reduce((s,i)=>s+i.total,0),total=Math.max(0,subtotal+shipping-discount),token=randomBytes(16).toString("hex"),code=`ORC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;await db.transaction(async tx=>{const [quote]=await tx.insert(quotes).values({code,clientId,paymentMethod:text(form,"paymentMethod"),installments:num(form,"installments")||1,shippingType:text(form,"shippingType"),shippingCost:String(shipping),discount:String(discount),subtotal:String(subtotal),total:String(total),notes:text(form,"notes"),publicToken:token,validUntil:text(form,"validUntil")||null}).returning();await tx.insert(quoteItems).values(validated.map(i=>({quoteId:quote.id,productId:i.productId,description:i.description,quantity:String(i.quantity),unitPrice:String(i.unitPrice),total:String(i.total)})))});refresh();}

export async function sendQuote(form: FormData) {await requireUser();
  const quoteId = num(form, "quoteId");
  const [row] = await db.select({ quote: quotes, client: clients }).from(quotes).innerJoin(clients, eq(quotes.clientId, clients.id)).where(eq(quotes.id, quoteId));
  if (!row) return;
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/proposta/${row.quote.publicToken}`;
  const pdfUrl=`${process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000"}/api/pdf/orcamento/${row.quote.publicToken}`;const entries:{channel:string;recipient:string;subject:string|null;body:string;quoteId:number;attachmentUrl:string}[]=[];
  if (row.client.email) entries.push({ channel: "email", recipient: row.client.email, subject: `Orçamento ${row.quote.code} — PrintFlow`, body:`Olá ${row.client.name}, sua proposta de ${Number(row.quote.total).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})} está disponível em ${url}. PDF: ${pdfUrl}`,quoteId,attachmentUrl:pdfUrl });
  const whatsapp=row.client.whatsapp||row.client.mobile||row.client.phone;if(whatsapp)entries.push({channel:"whatsapp",recipient:whatsapp,subject:null,body:`Olá, ${row.client.name}! Preparamos o orçamento ${row.quote.code}. Confira e aprove: ${url}\nPDF: ${pdfUrl}`,quoteId,attachmentUrl:pdfUrl});
  await db.transaction(async (tx) => {
    if (entries.length) await tx.insert(notifications).values(entries);
    await tx.update(quotes).set({ status: "enviado", sentAt: new Date() }).where(eq(quotes.id, quoteId));
  });
  refresh();
}

export async function reviewArtwork(form:FormData){const token=text(form,"token"),decision=text(form,"decision"),comment=text(form,"comment").slice(0,2000);await db.transaction(async tx=>{const [art]=await tx.select().from(artworkVersions).where(and(eq(artworkVersions.publicToken,token),eq(artworkVersions.status,"awaiting"))).for("update");if(!art)return;const status=decision==="approve"?"approved":"changes_requested";await tx.update(artworkVersions).set({status,clientComment:comment,approvedAt:status==="approved"?new Date():null}).where(eq(artworkVersions.id,art.id));if(status==="approved")await tx.update(orders).set({stage:"producao"}).where(eq(orders.id,art.orderId));const [order]=await tx.select().from(orders).where(eq(orders.id,art.orderId));await tx.insert(integrationLogs).values({provider:"artwork",action:"client_review",status,reference:order?.code,message:comment})});revalidatePath(`/aprovar-arte/${token}`);redirect(`/aprovar-arte/${token}?resultado=${decision}`);}

export async function approveQuote(form: FormData) {
  const token = text(form, "token");
  await db.transaction(async (tx) => {
    const [quote] = await tx.select().from(quotes).where(and(eq(quotes.publicToken, token), eq(quotes.status, "enviado"))).for("update");
    if (!quote) return;
    const [sequence]=await tx.select().from(settings).limit(1).for("update");const next=sequence?.orderNextNumber||1;const prefix=sequence?.orderPrefix||"PED";const padding=sequence?.orderNumberPadding||6;const code=`${prefix}-${String(next).padStart(padding,"0")}`;if(sequence)await tx.update(settings).set({orderNextNumber:next+1}).where(eq(settings.id,sequence.id));
    const itemRows=await tx.select({leadTime:products.leadTimeDays}).from(quoteItems).innerJoin(products,eq(quoteItems.productId,products.id)).where(eq(quoteItems.quoteId,quote.id));const maxDays=Math.max(1,...itemRows.map(x=>x.leadTime));const due=new Date();due.setDate(due.getDate()+maxDays);const publicToken=randomBytes(18).toString("hex");
    const [order] = await tx.insert(orders).values({code,quoteId:quote.id,clientId:quote.clientId,stage:"aprovado",total:quote.total,dueDate:due.toISOString().slice(0,10),publicToken,deliveryMethod:quote.shippingType==="retirada"?"balcao":quote.shippingType||"balcao"}).returning();
    await tx.insert(financialEntries).values({ type: "receber", description: `Pedido ${order.code}`, amount: quote.total, orderId: order.id, status: "pendente",dueDate:due.toISOString().slice(0,10) });
    const [client]=await tx.select().from(clients).where(eq(clients.id,quote.clientId));const baseUrl=process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000";const trackingUrl=`${baseUrl}/acompanhar/${publicToken}`;const orderPdfUrl=`${baseUrl}/api/pdf/acompanhamento/${publicToken}`;if(client?.email)await tx.insert(notifications).values({channel:"email",recipient:client.email,subject:`Pedido ${code} aprovado`,body:`Olá ${client.name}, seu pedido foi aprovado. Prazo estimado: ${due.toLocaleDateString("pt-BR")}. Acompanhe: ${trackingUrl}. PDF: ${orderPdfUrl}`,attachmentUrl:orderPdfUrl});if(client&&(client.whatsapp||client.mobile||client.phone))await tx.insert(notifications).values({channel:"whatsapp",recipient:(client.whatsapp||client.mobile||client.phone)!,body:`Olá ${client.name}! Seu pedido ${code} foi aprovado. Previsão: ${due.toLocaleDateString("pt-BR")}. Acompanhe cada etapa: ${trackingUrl}\nPDF: ${orderPdfUrl}`,attachmentUrl:orderPdfUrl});
    await tx.update(quotes).set({ status: "aprovado", approvedAt: new Date() }).where(eq(quotes.id, quote.id));
  });
  revalidatePath(`/proposta/${token}`);
  redirect(`/proposta/${token}?aprovado=1`);
}

export async function moveOrder(form: FormData) {await requireUser();
  const orderId = num(form, "orderId"); const stage = text(form, "stage");
  await db.transaction(async (tx) => {
    const [row] = await tx.select({ order: orders, client: clients }).from(orders).innerJoin(clients, eq(orders.clientId, clients.id)).where(eq(orders.id, orderId));
    if(!row)return;if(stage==="producao"){const versions=await tx.select().from(artworkVersions).where(eq(artworkVersions.orderId,orderId));const latest=versions.sort((a,b)=>b.version-a.version)[0];if(latest&&latest.status!=="approved")throw new Error("A arte precisa ser aprovada antes da produção");}
    await tx.update(orders).set({stage,deliveryStatus:stage==="concluido"?"aguardando":row.order.deliveryStatus}).where(eq(orders.id,orderId));
    const templates = await tx.select().from(messageTemplates).where(and(eq(messageTemplates.event, stage), eq(messageTemplates.active, true), eq(messageTemplates.automatic, true)));
    for (const template of templates) {
      const recipient = template.channel === "email" ? row.client.email : (row.client.whatsapp || row.client.mobile || row.client.phone);
      const allowed = template.channel === "email" ? Boolean(row.client.email) : Boolean(recipient && !row.client.whatsappOptOut);
      if (!recipient || !allowed) continue;
      const trackingUrl=row.order.publicToken?`${process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000"}/acompanhar/${row.order.publicToken}`:"";const body=template.body.replaceAll("{{cliente.nome}}",row.client.name).replaceAll("{{pedido.codigo}}",row.order.code).replaceAll("{{pedido.etapa}}",stage).replaceAll("{{pedido.link}}",trackingUrl);
      await tx.insert(notifications).values({ channel: template.channel, recipient, subject: template.subject?.replaceAll("{{pedido.codigo}}", row.order.code), body });
    }
  });
  refresh();
}

export async function updateOrderDetails(form:FormData){await requireUser();const id=num(form,"orderId");await db.update(orders).set({code:text(form,"code"),dueDate:text(form,"dueDate")||null,deliveryMethod:text(form,"deliveryMethod")||"balcao",trackingCode:text(form,"trackingCode")}).where(eq(orders.id,id));revalidatePath("/pedidos");revalidatePath("/logistica");}

export async function createDelivery(form:FormData){await requireUser();const orderId=num(form,"orderId");await db.transaction(async tx=>{const [row]=await tx.select({order:orders,client:clients}).from(orders).innerJoin(clients,eq(orders.clientId,clients.id)).where(eq(orders.id,orderId));if(!row)return;const provider=text(form,"provider");const address=text(form,"address")||[row.client.address,row.client.addressNumber,row.client.neighborhood,row.client.city,row.client.uf,row.client.cep].filter(Boolean).join(", ");const [delivery]=await tx.insert(deliveries).values({orderId,provider,status:text(form,"status")||"agendado",recipientName:row.client.name,recipientPhone:row.client.whatsapp||row.client.mobile||row.client.phone,address,driverName:text(form,"driverName"),driverPhone:text(form,"driverPhone"),trackingCode:text(form,"trackingCode"),trackingUrl:text(form,"trackingUrl"),price:String(num(form,"price")),scheduledAt:text(form,"scheduledAt")?new Date(text(form,"scheduledAt")):null,notes:text(form,"notes")}).returning();await tx.update(orders).set({deliveryMethod:provider,deliveryStatus:delivery.status,trackingCode:delivery.trackingCode}).where(eq(orders.id,orderId));const recipient=row.client.whatsapp||row.client.mobile||row.client.phone;if(recipient)await tx.insert(notifications).values({channel:"whatsapp",recipient,body:`Olá ${row.client.name}! A entrega do pedido ${row.order.code} foi organizada por ${provider}. Status: ${delivery.status}.${delivery.trackingUrl?` Acompanhe: ${delivery.trackingUrl}`:""}`});});revalidatePath("/logistica");revalidatePath("/pedidos");}

export async function updateDeliveryStatus(form:FormData){await requireUser();const id=num(form,"deliveryId"),status=text(form,"status");await db.transaction(async tx=>{const [delivery]=await tx.select().from(deliveries).where(eq(deliveries.id,id));if(!delivery)return;const now=new Date();await tx.update(deliveries).set({status,pickedUpAt:status==="em_transito"?now:delivery.pickedUpAt,deliveredAt:status==="entregue"?now:delivery.deliveredAt}).where(eq(deliveries.id,id));await tx.update(orders).set({deliveryStatus:status,dispatchedAt:status==="em_transito"?now:undefined,deliveredAt:status==="entregue"?now:undefined,stage:status==="entregue"?"concluido":undefined}).where(eq(orders.id,delivery.orderId));const [row]=await tx.select({order:orders,client:clients}).from(orders).innerJoin(clients,eq(orders.clientId,clients.id)).where(eq(orders.id,delivery.orderId));const recipient=row?.client.whatsapp||row?.client.mobile||row?.client.phone;if(row&&recipient)await tx.insert(notifications).values({channel:"whatsapp",recipient,body:`Atualização do pedido ${row.order.code}: entrega ${status.replaceAll("_"," ")}.`});if(row&&status==="entregue"){const templates=await tx.select().from(messageTemplates).where(and(eq(messageTemplates.event,"entregue"),eq(messageTemplates.active,true)));for(const template of templates){const target=template.channel==="email"?row.client.email:recipient;if(!target||(template.channel==="whatsapp"&&row.client.whatsappOptOut))continue;await tx.insert(notifications).values({channel:template.channel,recipient:target,subject:template.subject?.replaceAll("{{pedido.codigo}}",row.order.code),body:template.body.replaceAll("{{cliente.nome}}",row.client.name).replaceAll("{{pedido.codigo}}",row.order.code)});}}});revalidatePath("/logistica");revalidatePath("/pedidos");}

export async function saveCompanySettings(form: FormData) {await requireUser();
  const values={companyName:text(form,"companyName"),tradeName:text(form,"tradeName"),logoUrl:text(form,"logoUrl"),document: text(form,"document"),stateRegistration:text(form,"stateRegistration"),municipalRegistration:text(form,"municipalRegistration"),taxRegime:text(form,"taxRegime"),cnae:text(form,"cnae"), email: text(form,"email"), phone: text(form,"phone"), mobile: text(form,"mobile"), website: text(form,"website"), address: text(form,"address"), neighborhood: text(form,"neighborhood"), city: text(form,"city"), uf: text(form,"uf"), cep: text(form,"cep"), receiptFooter: text(form,"receiptFooter"), defaultMargin:String(num(form,"defaultMargin")),hourlyLaborCost:String(num(form,"hourlyLaborCost")),orderPrefix:text(form,"orderPrefix")||"PED",orderNextNumber:num(form,"orderNextNumber")||1,orderNumberPadding:num(form,"orderNumberPadding")||6};
  const { settings } = await import("@/db/schema"); const [existing] = await db.select().from(settings).limit(1);
  if (existing) await db.update(settings).set(values).where(eq(settings.id,existing.id)); else await db.insert(settings).values(values);
  revalidatePath("/configuracoes");
}

export async function saveLandingPage(form:FormData){await requireUser();const [row]=await db.select().from(settings).limit(1);if(!row)return;const landing={heroTitle:text(form,"heroTitle"),heroSubtitle:text(form,"heroSubtitle"),bannerImage:text(form,"bannerImage"),bannerTitle:text(form,"bannerTitle"),bannerText:text(form,"bannerText"),bannerLink:text(form,"bannerLink"),instagram:text(form,"instagram"),facebook:text(form,"facebook"),tiktok:text(form,"tiktok"),youtube:text(form,"youtube"),website:text(form,"publicWebsite"),googleReviewsUrl:text(form,"googleReviewsUrl"),showGoogleReviews:form.get("showGoogleReviews")==="on"};await db.update(settings).set({landingPage:landing}).where(eq(settings.id,row.id));revalidatePath("/configuracoes");revalidatePath("/cadastro");}

export async function saveModuleConfig(form:FormData){await requireUser();const section=text(form,"section"),provider=text(form,"provider");const [row]=await db.select().from(settings).limit(1);if(!row)return;const config:Record<string,string|number|boolean>={enabled:false};for(const [key,value] of form.entries())if(!["section","provider"].includes(key))config[key]=value==="on"?true:String(value);const current=section==="communications"?(row.communications||{}):(row.integrations||{});let merged={...current,[provider]:config};if(section==="communications"&&config.enabled&&provider==="whatsapp_qr")merged={...merged,whatsapp_cloud:{...(merged.whatsapp_cloud||{}),enabled:false}};if(section==="communications"&&config.enabled&&provider==="whatsapp_cloud")merged={...merged,whatsapp_qr:{...(merged.whatsapp_qr||{}),enabled:false}};if(section==="communications")await db.update(settings).set({communications:merged}).where(eq(settings.id,row.id));else await db.update(settings).set({integrations:merged}).where(eq(settings.id,row.id));revalidatePath("/configuracoes");revalidatePath("/whatsapp");}

export async function processNotificationQueue(form:FormData){await requireUser();const channel=text(form,"channel");const queue=await db.select().from(notifications).where(channel?and(eq(notifications.status,"fila"),eq(notifications.channel,channel)):eq(notifications.status,"fila")).limit(25);for(const item of queue){try{if(item.channel==="email")await sendSmtp(item);else if(item.channel==="whatsapp")await sendWhatsApp(item)}catch(error){await db.update(notifications).set({status:"erro"}).where(eq(notifications.id,item.id));await log(item.channel,"send","error",error instanceof Error?error.message:"Erro desconhecido",String(item.id))}}revalidatePath("/email");revalidatePath("/whatsapp");}

export async function createInfinitePayCheckout(form:FormData){await requireUser();const orderId=num(form,"orderId"),[row]=await db.select({order:orders,client:clients}).from(orders).innerJoin(clients,eq(orders.clientId,clients.id)).where(eq(orders.id,orderId));if(!row)throw new Error("Pedido não encontrado");const {integrations}=await configs();if(!integrations.infinitepay?.enabled)throw new Error("InfinitePay desativada");const handle=process.env.INFINITEPAY_HANDLE;if(!handle)throw new Error("INFINITEPAY_HANDLE ausente");const base=process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000",webhookSecret=process.env.INFINITEPAY_WEBHOOK_SECRET;const payload={handle,redirect_url:String(integrations.infinitepay.redirectUrl||`${base}/acompanhar/${row.order.publicToken}`),webhook_url:String(integrations.infinitepay.webhookUrl||`${base}/api/integrations/infinitepay/webhook${webhookSecret?`?token=${webhookSecret}`:""}`),order_nsu:row.order.code,customer:{name:row.client.name,email:row.client.email,phone_number:row.client.whatsapp||row.client.mobile||row.client.phone},items:[{quantity:1,price:Math.round(Number(row.order.total)*100),description:`Pedido ${row.order.code}`} ]};const r=await fetch("https://api.checkout.infinitepay.io/links",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const data=await r.json() as {url?:string};if(!r.ok||!data.url)throw new Error(`InfinitePay: ${JSON.stringify(data)}`);await db.insert(paymentLinks).values({orderId,provider:"infinitepay",url:data.url,amount:row.order.total,payload});await log("infinitepay","create_checkout","success",undefined,row.order.code);revalidatePath("/pagamentos");}

export async function createInterPix(form:FormData){await requireUser();const orderId=num(form,"orderId"),[row]=await db.select({order:orders,client:clients}).from(orders).innerJoin(clients,eq(orders.clientId,clients.id)).where(eq(orders.id,orderId));if(!row)throw new Error("Pedido não encontrado");const {integrations}=await configs();if(!integrations.banco_inter?.enabled)throw new Error("Banco Inter desativado");const {access_token}=await interToken(),txid=`PF${orderId}${Date.now()}`.slice(0,35),doc=digits(row.client.document||"");const devedor=doc.length===14?{cnpj:doc,nome:row.client.name}:{cpf:doc,nome:row.client.name};const data=await interRequest<{pixCopiaECola?:string;location?:string;status?:string}>("PUT",`/pix/v2/cob/${txid}`,{calendario:{expiracao:3600},devedor,valor:{original:Number(row.order.total).toFixed(2)},chave:process.env.INTER_PIX_KEY,solicitacaoPagador:`Pedido ${row.order.code}`},access_token);await db.insert(bankPixCharges).values({orderId,txid,amount:row.order.total,status:data.status||"ATIVA",copyPaste:data.pixCopiaECola,location:data.location,payerDocument:doc});await log("banco_inter","create_pix","success",undefined,row.order.code);revalidatePath("/pagamentos");}

export async function uploadArtworkVersion(form:FormData){await requireUser();const orderId=num(form,"orderId"),fileUrl=text(form,"fileUrl");if(!orderId||!fileUrl)throw new Error("Pedido e arquivo são obrigatórios");const existing=await db.select().from(artworkVersions).where(eq(artworkVersions.orderId,orderId));await db.update(artworkVersions).set({status:"superseded"}).where(and(eq(artworkVersions.orderId,orderId),eq(artworkVersions.status,"awaiting")));const token=randomBytes(18).toString("hex"),version=existing.length+1;await db.insert(artworkVersions).values({orderId,version,fileUrl,notes:text(form,"notes"),publicToken:token});const [row]=await db.select({order:orders,client:clients}).from(orders).innerJoin(clients,eq(orders.clientId,clients.id)).where(eq(orders.id,orderId));const target=row?.client.whatsapp||row?.client.mobile||row?.client.phone;if(row&&target){const url=`${process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000"}/aprovar-arte/${token}`;await db.insert(notifications).values({channel:"whatsapp",recipient:target,body:`🎨 Arte v${version} do pedido ${row.order.code} disponível para aprovação: ${url}`})}revalidatePath("/artes");}

export async function selectShippingQuote(form:FormData){await requireUser();const id=num(form,"quoteId");await db.transaction(async tx=>{const [quote]=await tx.select().from(shippingQuotes).where(eq(shippingQuotes.id,id));if(!quote)return;if(quote.orderId){await tx.update(shippingQuotes).set({selected:false}).where(eq(shippingQuotes.orderId,quote.orderId));await tx.update(shippingQuotes).set({selected:true}).where(eq(shippingQuotes.id,id));await tx.update(orders).set({deliveryMethod:"superfrete"}).where(eq(orders.id,quote.orderId))}});revalidatePath("/fretes");}

export async function syncGoogleReviews(){await requireUser();const {integrations}=await configs(),cfg=integrations.google_business||{};if(!cfg.enabled)throw new Error("Google Business desativado");const token=await googleAccessToken(),account=String(cfg.accountId||process.env.GOOGLE_BUSINESS_ACCOUNT_ID||""),location=String(cfg.locationId||process.env.GOOGLE_BUSINESS_LOCATION_ID||"");if(!token||!account||!location)throw new Error("Credenciais Google Business ausentes");const r=await fetch(`https://mybusiness.googleapis.com/v4/accounts/${account}/locations/${location}/reviews?pageSize=50&orderBy=updateTime%20desc`,{headers:{authorization:`Bearer ${token}`}});const data=await r.json() as {reviews?:Array<{reviewId:string;reviewer?:{displayName?:string};starRating?:string;comment?:string;createTime?:string;reviewReply?:{comment?:string}}>};if(!r.ok)throw new Error(`Google Business: ${JSON.stringify(data)}`);for(const review of data.reviews||[]){const rating={ONE:1,TWO:2,THREE:3,FOUR:4,FIVE:5}[review.starRating as "ONE"]||0;await db.insert(googleReviewsCache).values({reviewId:review.reviewId,reviewerName:review.reviewer?.displayName,rating,comment:review.comment,reply:review.reviewReply?.comment,reviewCreatedAt:review.createTime?new Date(review.createTime):null,syncedAt:new Date()}).onConflictDoUpdate({target:googleReviewsCache.reviewId,set:{reviewerName:review.reviewer?.displayName,rating,comment:review.comment,reply:review.reviewReply?.comment,syncedAt:new Date()}})}await log("google_business","sync_reviews","success",undefined,location);revalidatePath("/google-reviews");revalidatePath("/cadastro");}

export async function saveWhatsappPolicy(form: FormData) {await requireUser();
  const values = { mode: text(form, "mode"), botEnabled: form.get("botEnabled") === "on", humanHandoff: form.get("humanHandoff") === "on", businessStart: text(form, "businessStart"), businessEnd: text(form, "businessEnd"), dailyLimit: num(form, "dailyLimit"), minimumIntervalSeconds: num(form, "minimumIntervalSeconds"), onlyOptIn: form.get("onlyOptIn") === "on", createLead: form.get("createLead") === "on", updatedAt: new Date() };
  const [existing] = await db.select().from(whatsappSettings).limit(1);
  if (existing) await db.update(whatsappSettings).set(values).where(eq(whatsappSettings.id, existing.id)); else await db.insert(whatsappSettings).values(values);
  revalidatePath("/whatsapp");
}

export async function saveMessageTemplate(form: FormData) {await requireUser();
  const id=num(form,"id");const values={event:text(form,"event"),label:text(form,"label"),channel:text(form,"channel"),subject:text(form,"subject"),body:text(form,"body"),automatic:form.get("automatic")==="on",active:form.get("active")!=="off"};
  if(id)await db.update(messageTemplates).set(values).where(eq(messageTemplates.id,id));else await db.insert(messageTemplates).values(values);
  revalidatePath("/email"); revalidatePath("/whatsapp");
}

export async function createMarketingCampaign(form: FormData){await requireUser();const channel=text(form,"channel");const body=text(form,"body");const subject=text(form,"subject");const rows=await db.select().from(clients).where(eq(clients.status,"liberado"));const eligible=rows.filter(c=>channel==="email"?c.acceptsEmail&&c.email:c.acceptsWhatsapp&&!c.whatsappOptOut&&(c.whatsapp||c.mobile||c.phone));if(eligible.length)await db.insert(notifications).values(eligible.map(c=>({channel,recipient:channel==="email"?c.email!:(c.whatsapp||c.mobile||c.phone)!,subject:channel==="email"?subject:null,body:body.replaceAll("{{cliente.nome}}",c.name),status:"fila"})));revalidatePath(channel==="email"?"/email":"/whatsapp");}

export async function addFinancialAccount(form:FormData){await requireUser();await db.insert(financialAccounts).values({name:text(form,"name"),type:text(form,"type"),institution:text(form,"institution"),initialBalance:String(num(form,"initialBalance")),color:text(form,"color")||"#159fd0"});revalidatePath("/financeiro");revalidatePath("/pdv");}

export async function transferBetweenAccounts(form:FormData){await requireUser();const fromAccountId=num(form,"fromAccountId"),toAccountId=num(form,"toAccountId"),amount=num(form,"amount"),fee=num(form,"fee");if(!fromAccountId||!toAccountId||fromAccountId===toAccountId||amount<=0)return;await db.transaction(async tx=>{await tx.insert(financialTransfers).values({fromAccountId,toAccountId,amount:String(amount),fee:String(fee),description:text(form,"description")});await tx.insert(financialEntries).values([{type:"pagar",description:`Transferência enviada — ${text(form,"description")||"entre contas"}`,amount:String(amount+fee),status:"pago",paidAt:new Date(),accountId:fromAccountId,paymentMethod:"Transferência"},{type:"receber",description:`Transferência recebida — ${text(form,"description")||"entre contas"}`,amount:String(amount),status:"pago",paidAt:new Date(),accountId:toAccountId,paymentMethod:"Transferência"}]);});revalidatePath("/financeiro");}

export async function openCashSession(form:FormData){const user=await requireUser();const accountId=num(form,"accountId");const [open]=await db.select().from(cashSessions).where(and(eq(cashSessions.accountId,accountId),eq(cashSessions.status,"open"))).limit(1);if(open)return;await db.insert(cashSessions).values({accountId,openedBy:user.id,openingBalance:String(num(form,"openingBalance")),notes:text(form,"notes")});revalidatePath("/financeiro");revalidatePath("/pdv");}

export async function addCashMovement(form:FormData){await requireUser();const sessionId=num(form,"sessionId"),type=text(form,"type"),amount=num(form,"amount");if(!sessionId||amount<=0)return;await db.insert(cashMovements).values({sessionId,type,description:text(form,"description"),amount:String(amount)});revalidatePath("/financeiro");}

export async function closeCashSession(form:FormData){const user=await requireUser();const id=num(form,"sessionId"),counted=num(form,"countedBalance");await db.transaction(async tx=>{const [session]=await tx.select().from(cashSessions).where(eq(cashSessions.id,id)).for("update");if(!session||session.status!=="open")return;const movements=await tx.select().from(cashMovements).where(eq(cashMovements.sessionId,id));const expected=Number(session.openingBalance)+movements.reduce((s,m)=>s+(m.type==="entrada"||m.type==="suprimento"?1:-1)*Number(m.amount),0);await tx.update(cashSessions).set({status:"closed",closedBy:user.id,expectedBalance:String(expected),countedBalance:String(counted),difference:String(counted-expected),closedAt:new Date(),notes:text(form,"notes")||session.notes}).where(eq(cashSessions.id,id));});revalidatePath("/financeiro");revalidatePath("/pdv");}

export async function addFinancialEntry(form:FormData){await requireUser();await db.insert(financialEntries).values({type:text(form,"type"),description:text(form,"description"),amount:String(num(form,"amount")),status:text(form,"status")||"pendente",dueDate:text(form,"dueDate")||null,competenceDate:text(form,"competenceDate")||null,categoryId:num(form,"categoryId")||null,account:text(form,"account"),accountId:num(form,"accountId")||null,paymentMethod:text(form,"paymentMethod"),costCenter:text(form,"costCenter"),documentNumber:text(form,"documentNumber"),recurring:form.get("recurring")==="on",notes:text(form,"notes")});revalidatePath("/financeiro");}

export async function addFinancialCategory(form:FormData){await requireUser();await db.insert(financialCategories).values({name:text(form,"name"),type:text(form,"type"),color:text(form,"color")||"#159fd0"});revalidatePath("/financeiro");}

export async function createPosSale(form: FormData) {await requireUser();
  const raw = text(form, "items");
  const items=JSON.parse(raw) as {productId:number;description:string;quantity:number;unitPrice:number;discount:number;leadTimeDays?:number}[];
  if (!items.length) throw new Error("Venda sem itens");
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const itemDiscount = items.reduce((sum, item) => sum + item.discount, 0);
  const discountType=text(form,"discountType")||"fixed";const discountInput=num(form,"discount");const globalDiscount=discountType==="percent"?subtotal*Math.min(100,discountInput)/100:discountInput;const discount=itemDiscount+globalDiscount;const surcharge=num(form,"surcharge");const total=Math.max(0,subtotal-discount+surcharge);const amountPaid=num(form,"amountPaid")||total;
  const code = `PV-${Date.now().toString().slice(-7)}`;
  const [sale] = await db.transaction(async (tx) => {
    const inserted = await tx.insert(posSales).values({ code, clientId: num(form, "clientId") || null, seller: text(form, "seller") || "Tiago Souza", paymentMethod: text(form, "paymentMethod"), subtotal: String(subtotal), discount: String(discount), discountType,discountPercent:String(discountType==="percent"?discountInput:0),surcharge:String(surcharge),installments:num(form,"installments")||1,discountReason:text(form,"discountReason"),authorizedBy:text(form,"authorizedBy"),total: String(total), amountPaid: String(amountPaid), change: String(Math.max(0, amountPaid - total)), deliveryType: text(form, "deliveryType"), notes: text(form, "notes") }).returning();
    await tx.insert(posSaleItems).values(items.map((item)=>({saleId:inserted[0].id,productId:item.productId,description:item.description,quantity:String(item.quantity),unitPrice:String(item.unitPrice),discount:String(item.discount),total:String(item.quantity*item.unitPrice-item.discount)})));
    const clientId=num(form,"clientId");if(form.get("sendToProduction")==="on"&&clientId){const [sequence]=await tx.select().from(settings).limit(1).for("update");const next=sequence?.orderNextNumber||1;const orderCode=`${sequence?.orderPrefix||"PED"}-${String(next).padStart(sequence?.orderNumberPadding||6,"0")}`;if(sequence)await tx.update(settings).set({orderNextNumber:next+1}).where(eq(settings.id,sequence.id));const days=Math.max(1,...items.map(i=>i.leadTimeDays||1));const due=new Date();due.setDate(due.getDate()+days);const [order]=await tx.insert(orders).values({code:orderCode,clientId,stage:"aprovado",paymentStatus:"pago",total:String(total),dueDate:due.toISOString().slice(0,10),publicToken:randomBytes(18).toString("hex"),deliveryMethod:text(form,"deliveryType").includes("Retirada")?"balcao":"a_definir"}).returning();await tx.update(posSales).set({orderId:order.id}).where(eq(posSales.id,inserted[0].id));}
    const accountId=num(form,"accountId");await tx.insert(financialEntries).values({type:"receber",description:`Venda balcão ${code}`,amount:String(total),status:"pago",paidAt:new Date(),paymentMethod:text(form,"paymentMethod"),accountId:accountId||null});const [cash]=accountId?await tx.select().from(cashSessions).where(and(eq(cashSessions.accountId,accountId),eq(cashSessions.status,"open"))).limit(1):[];if(cash)await tx.insert(cashMovements).values({sessionId:cash.id,type:"entrada",description:`Venda ${code}`,amount:String(total),posSaleId:inserted[0].id});
    return inserted;
  });
  revalidatePath("/pdv"); redirect(`/cupom/${sale.id}`);
}

export async function toggleFinancial(form: FormData) {await requireUser();
  const paying=text(form,"status")!=="pago";await db.update(financialEntries).set({status:paying?"pago":"pendente",paidAt:paying?new Date():null}).where(eq(financialEntries.id,num(form,"entryId")));
  refresh();
}

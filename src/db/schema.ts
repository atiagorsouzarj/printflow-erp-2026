import { boolean, date, integer, jsonb, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  active: boolean("active").notNull().default(true),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("pf"),
  name: text("name").notNull(),
  nickname: text("nickname"),
  company: text("company"),
  fantasyName: text("fantasy_name"),
  document: text("document"),
  stateRegistration: text("state_registration"),
  birthDate: date("birth_date"),
  gender: text("gender"),
  segment: text("segment"),
  status: text("status").notNull().default("liberado"),
  marketingSource: text("marketing_source"),
  foundUsAt: text("found_us_at"),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  mobile: text("mobile"),
  whatsapp: text("whatsapp"),
  instagram: text("instagram"),
  facebook: text("facebook"),
  cep: text("cep"),
  address: text("address"),
  addressNumber: text("address_number"),
  complement: text("complement"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  uf: text("uf"),
  acceptsWhatsapp: boolean("accepts_whatsapp").notNull().default(false),
  acceptsEmail: boolean("accepts_email").notNull().default(false),
  acceptsVoice: boolean("accepts_voice").notNull().default(false),
  whatsappOptOut: boolean("whatsapp_opt_out").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  protocol: text("protocol").unique(),
  type: text("type").notNull().default("pf"),
  name: text("name").notNull(),
  document: text("document"),
  birthDate: date("birth_date"),
  gender: text("gender"),
  foundUsAt: text("found_us_at"),
  email: text("email"),
  phone: text("phone"),
  interest: text("interest"),
  message: text("message"),
  origin: text("origin").notNull().default("manual"),
  score: integer("score").notNull().default(50),
  status: text("status").notNull().default("novo"),
  cep: text("cep"),
  address: text("address"),
  addressNumber: text("address_number"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  uf: text("uf"),
  acceptsWhatsapp: boolean("accepts_whatsapp").notNull().default(false),
  acceptsEmail: boolean("accepts_email").notNull().default(false),
  acceptsVoice: boolean("accepts_voice").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  document: text("document"),
  contact: text("contact"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const materialCategories = pgTable("material_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  attributeSchema: jsonb("attribute_schema").$type<{ key: string; label: string; type: string; options?: string[] }[]>().default([]),
});

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  categoryId: integer("category_id").references(() => materialCategories.id),
  unit: text("unit").notNull().default("un"),
  purchaseUnit: text("purchase_unit").default("un"),
  unitsPerPackage: numeric("units_per_package", { precision: 14, scale: 4 }).notNull().default("1"),
  format: text("format"),
  grammage: numeric("grammage", { precision: 10, scale: 2 }),
  size: text("size"),
  color: text("color"),
  attributes: jsonb("attributes").$type<Record<string, string | number | boolean>>().default({}),
  stock: numeric("stock", { precision: 14, scale: 4 }).notNull().default("0"),
  minimumStock: numeric("minimum_stock", { precision: 14, scale: 4 }).notNull().default("0"),
  averageCost: numeric("average_cost", { precision: 14, scale: 4 }).notNull().default("0"),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  active: boolean("active").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").notNull().references(() => materials.id),
  type: text("type").notNull(),
  quantity: numeric("quantity", { precision: 14, scale: 4 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 14, scale: 4 }).notNull().default("0"),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const printerCategories = pgTable("printer_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  technology: text("technology").notNull().default("custom"),
  pricingMode: text("pricing_mode").notNull().default("click"),
  description: text("description"),
  pricingConfig: jsonb("pricing_config").$type<Record<string, string | number | boolean>>().default({}),
});

export const printers = pgTable("printers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  model: text("model"),
  categoryId: integer("category_id").notNull().references(() => printerCategories.id),
  acquisitionCost: numeric("acquisition_cost", { precision: 14, scale: 2 }).notNull().default("0"),
  usefulLifeMonths: integer("useful_life_months").notNull().default(60),
  monthlyVolume: integer("monthly_volume").notNull().default(10000),
  maintenanceMonthly: numeric("maintenance_monthly", { precision: 12, scale: 2 }).notNull().default("0"),
  energyCostHour: numeric("energy_cost_hour", { precision: 12, scale: 4 }).notNull().default("0"),
  bwCost: numeric("bw_cost", { precision: 12, scale: 4 }).notNull().default("0"),
  colorCost: numeric("color_cost", { precision: 12, scale: 4 }).notNull().default("0"),
  hourlyCost: numeric("hourly_cost", { precision: 12, scale: 4 }).notNull().default("0"),
  pricingData: jsonb("pricing_data").$type<Record<string, number | string>>().default({}),
  active: boolean("active").notNull().default(true),
});

export const printerConsumables = pgTable("printer_consumables", {
  id: serial("id").primaryKey(),
  printerId: integer("printer_id").notNull().references(() => printers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("consumable"),
  color: text("color"),
  acquisitionCost: numeric("acquisition_cost", { precision: 14, scale: 2 }).notNull().default("0"),
  yieldAmount: numeric("yield_amount", { precision: 14, scale: 2 }).notNull().default("1"),
  coveragePercent: numeric("coverage_percent", { precision: 7, scale: 2 }).notNull().default("5"),
  unit: text("unit").notNull().default("pag"),
  active: boolean("active").notNull().default(true),
});

export const outsourcedServices = pgTable("outsourced_services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  technology: text("technology").notNull(),
  pricingMethod: text("pricing_method").notNull().default("sheet_nesting"),
  pricePerM2: numeric("price_per_m2", { precision: 14, scale: 2 }).notNull().default("0"),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const outsourcedServiceTiers = pgTable("outsourced_service_tiers", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => outsourcedServices.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  sheetWidthCm: numeric("sheet_width_cm", { precision: 10, scale: 2 }).notNull(),
  sheetHeightCm: numeric("sheet_height_cm", { precision: 10, scale: 2 }).notNull(),
  price: numeric("price", { precision: 14, scale: 2 }).notNull(),
  active: boolean("active").notNull().default(true),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("produto"),
  category: text("category").notNull(),
  description: text("description"),
  printerId: integer("printer_id").references(() => printers.id),
  printMode: text("print_mode").default("color"),
  paperSize: text("paper_size"),
  printsPerUnit: numeric("prints_per_unit", { precision: 10, scale: 2 }).notNull().default("1"),
  coveragePercent: numeric("coverage_percent", { precision: 7, scale: 2 }).notNull().default("5"),
  consumableUsage: numeric("consumable_usage", { precision: 12, scale: 5 }).notNull().default("0"),
  minimumQuantity: numeric("minimum_quantity", { precision: 12, scale: 2 }).notNull().default("1"),
  setupCost: numeric("setup_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  machineMinutes: numeric("machine_minutes", { precision: 12, scale: 2 }).notNull().default("0"),
  laborMinutes: numeric("labor_minutes", { precision: 10, scale: 2 }).notNull().default("0"),
  laborHourCost: numeric("labor_hour_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  extraCost: numeric("extra_cost", { precision: 12, scale: 4 }).notNull().default("0"),
  failurePercent: numeric("failure_percent", { precision: 7, scale: 3 }).notNull().default("0"),
  weightGrams: numeric("weight_grams", { precision: 12, scale: 3 }).notNull().default("0"),
  widthCm: numeric("width_cm", { precision: 10, scale: 2 }).notNull().default("0"),
  heightCm: numeric("height_cm", { precision: 10, scale: 2 }).notNull().default("0"),
  lengthCm: numeric("length_cm", { precision: 10, scale: 2 }).notNull().default("0"),
  quantityTiers: jsonb("quantity_tiers").$type<{ from: number; discount: number }[]>().default([]),
  taxPercent: numeric("tax_percent", { precision: 7, scale: 3 }).notNull().default("0"),
  cardFeePercent: numeric("card_fee_percent", { precision: 7, scale: 3 }).notNull().default("0"),
  commissionPercent: numeric("commission_percent", { precision: 7, scale: 3 }).notNull().default("0"),
  marginPercent: numeric("margin_percent", { precision: 7, scale: 3 }).notNull().default("30"),
  calculatedCost: numeric("calculated_cost", { precision: 14, scale: 4 }).notNull().default("0"),
  salePrice: numeric("sale_price", { precision: 14, scale: 2 }).notNull().default("0"),
  leadTimeDays: integer("lead_time_days").notNull().default(3),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const productPrinterProcesses = pgTable("product_printer_processes", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  printerId: integer("printer_id").notNull().references(() => printers.id),
  process: text("process").notNull(),
  minutes: numeric("minutes", { precision: 10, scale: 2 }).notNull().default("0"),
  passes: numeric("passes", { precision: 10, scale: 2 }).notNull().default("0"),
  calculatedCost: numeric("calculated_cost", { precision: 14, scale: 4 }).notNull(),
});

export const productMaterials = pgTable("product_materials", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  materialId: integer("material_id").notNull().references(() => materials.id),
  quantity: numeric("quantity", { precision: 14, scale: 4 }).notNull(),
  wastePercent: numeric("waste_percent", { precision: 7, scale: 3 }).notNull().default("0"),
});

export const productOutsourcedServices = pgTable("product_outsourced_services", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  serviceTierId: integer("service_tier_id").notNull().references(() => outsourcedServiceTiers.id),
  artworkWidthCm: numeric("artwork_width_cm", { precision: 10, scale: 2 }).notNull(),
  artworkHeightCm: numeric("artwork_height_cm", { precision: 10, scale: 2 }).notNull(),
  copiesPerSheet: integer("copies_per_sheet").notNull(),
  unitCost: numeric("unit_cost", { precision: 14, scale: 4 }).notNull(),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  status: text("status").notNull().default("rascunho"),
  paymentMethod: text("payment_method").notNull().default("pix"),
  installments: integer("installments").notNull().default(1),
  shippingType: text("shipping_type").notNull().default("retirada"),
  shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  publicToken: text("public_token").notNull().unique(),
  validUntil: date("valid_until"),
  sentAt: timestamp("sent_at"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  quoteId: integer("quote_id").references(() => quotes.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  stage: text("stage").notNull().default("aprovado"),
  paymentStatus: text("payment_status").notNull().default("pendente"),
  deliveryStatus: text("delivery_status").notNull().default("aguardando_producao"),
  deliveryMethod: text("delivery_method").notNull().default("balcao"),
  trackingCode: text("tracking_code"),
  publicToken: text("public_token").unique(),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
  dueDate: date("due_date"),
  dispatchedAt: timestamp("dispatched_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  status: text("status").notNull().default("aguardando"),
  recipientName: text("recipient_name").notNull(),
  recipientPhone: text("recipient_phone"),
  address: text("address"),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  trackingCode: text("tracking_code"),
  trackingUrl: text("tracking_url"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  scheduledAt: timestamp("scheduled_at"),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const financialAccounts = pgTable("financial_accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  institution: text("institution"),
  initialBalance: numeric("initial_balance", { precision: 14, scale: 2 }).notNull().default("0"),
  color: text("color").notNull().default("#159fd0"),
  active: boolean("active").notNull().default(true),
});

export const financialTransfers = pgTable("financial_transfers", {
  id: serial("id").primaryKey(),
  fromAccountId: integer("from_account_id").notNull().references(() => financialAccounts.id),
  toAccountId: integer("to_account_id").notNull().references(() => financialAccounts.id),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  fee: numeric("fee", { precision: 12, scale: 2 }).notNull().default("0"),
  description: text("description"),
  transferredAt: timestamp("transferred_at").notNull().defaultNow(),
});

export const cashSessions = pgTable("cash_sessions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => financialAccounts.id),
  openedBy: integer("opened_by").references(() => users.id),
  closedBy: integer("closed_by").references(() => users.id),
  openingBalance: numeric("opening_balance", { precision: 14, scale: 2 }).notNull().default("0"),
  expectedBalance: numeric("expected_balance", { precision: 14, scale: 2 }),
  countedBalance: numeric("counted_balance", { precision: 14, scale: 2 }),
  difference: numeric("difference", { precision: 14, scale: 2 }),
  status: text("status").notNull().default("open"),
  openedAt: timestamp("opened_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
  notes: text("notes"),
});

export const cashMovements = pgTable("cash_movements", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => cashSessions.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  posSaleId: integer("pos_sale_id").references(() => posSales.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const externalEvents = pgTable("external_events", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  event: text("event").notNull(),
  externalId: text("external_id"),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  status: text("status").notNull().default("received"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const financialCategories = pgTable("financial_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  color: text("color").notNull().default("#159fd0"),
});

export const financialEntries = pgTable("financial_entries", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  status: text("status").notNull().default("pendente"),
  dueDate: date("due_date"),
  paidAt: timestamp("paid_at"),
  competenceDate: date("competence_date"),
  categoryId: integer("category_id").references(() => financialCategories.id),
  account: text("account").default("Caixa principal"),
  accountId: integer("account_id").references(() => financialAccounts.id),
  paymentMethod: text("payment_method"),
  costCenter: text("cost_center"),
  documentNumber: text("document_number"),
  recurring: boolean("recurring").notNull().default(false),
  notes: text("notes"),
  orderId: integer("order_id").references(() => orders.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  channel: text("channel").notNull(),
  recipient: text("recipient").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  attachmentUrl: text("attachment_url"),
  status: text("status").notNull().default("fila"),
  quoteId: integer("quote_id").references(() => quotes.id),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const paymentLinks = pgTable("payment_links", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  externalId: text("external_id"),
  url: text("url"),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 14, scale: 2 }),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method"),
  receiptUrl: text("receipt_url"),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bankPixCharges = pgTable("bank_pix_charges", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  txid: text("txid").notNull().unique(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  status: text("status").notNull().default("ATIVA"),
  copyPaste: text("copy_paste"),
  location: text("location"),
  payerDocument: text("payer_document"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const artworkVersions = pgTable("artwork_versions", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  fileUrl: text("file_url").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("awaiting"),
  publicToken: text("public_token").notNull().unique(),
  clientComment: text("client_comment"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const shippingQuotes = pgTable("shipping_quotes", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("superfrete"),
  serviceId: text("service_id"),
  serviceName: text("service_name").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  deliveryDays: integer("delivery_days"),
  raw: jsonb("raw").$type<Record<string, unknown>>().default({}),
  selected: boolean("selected").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const googleReviewsCache = pgTable("google_reviews_cache", {
  id: serial("id").primaryKey(),
  reviewId: text("review_id").notNull().unique(),
  reviewerName: text("reviewer_name"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  reply: text("reply"),
  reviewCreatedAt: timestamp("review_created_at"),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
});

export const integrationLogs = pgTable("integration_logs", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(),
  action: text("action").notNull(),
  status: text("status").notNull(),
  reference: text("reference"),
  message: text("message"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull().default("PrintFlow"),
  tradeName: text("trade_name"),
  logoUrl: text("logo_url"),
  document: text("document"),
  stateRegistration: text("state_registration"),
  municipalRegistration: text("municipal_registration"),
  taxRegime: text("tax_regime"),
  cnae: text("cnae"),
  email: text("email"),
  phone: text("phone"),
  mobile: text("mobile"),
  website: text("website"),
  address: text("address"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  uf: text("uf"),
  cep: text("cep"),
  receiptFooter: text("receipt_footer").default("Agradecemos pela preferência, esperamos seu retorno em breve!"),
  defaultMargin: numeric("default_margin", { precision: 7, scale: 3 }).notNull().default("30"),
  hourlyLaborCost: numeric("hourly_labor_cost", { precision: 12, scale: 2 }).notNull().default("35"),
  orderPrefix: text("order_prefix").notNull().default("PED"),
  orderNextNumber: integer("order_next_number").notNull().default(1),
  orderNumberPadding: integer("order_number_padding").notNull().default(6),
  landingPage: jsonb("landing_page").$type<Record<string, string | boolean>>().default({}),
  integrations: jsonb("integrations").$type<Record<string, Record<string, string | number | boolean>>>().default({}),
  communications: jsonb("communications").$type<Record<string, Record<string, string | number | boolean>>>().default({}),
});

export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  event: text("event").notNull(),
  label: text("label").notNull(),
  channel: text("channel").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  automatic: boolean("automatic").notNull().default(true),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const whatsappSettings = pgTable("whatsapp_settings", {
  id: serial("id").primaryKey(),
  mode: text("mode").notNull().default("simulator"),
  connectionStatus: text("connection_status").notNull().default("offline"),
  botEnabled: boolean("bot_enabled").notNull().default(false),
  humanHandoff: boolean("human_handoff").notNull().default(true),
  businessStart: text("business_start").notNull().default("08:00"),
  businessEnd: text("business_end").notNull().default("18:00"),
  dailyLimit: integer("daily_limit").notNull().default(80),
  minimumIntervalSeconds: integer("minimum_interval_seconds").notNull().default(15),
  onlyOptIn: boolean("only_opt_in").notNull().default(true),
  createLead: boolean("create_lead").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const whatsappConversations = pgTable("whatsapp_conversations", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  contactName: text("contact_name"),
  direction: text("direction").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("received"),
  requiresHuman: boolean("requires_human").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const posSales = pgTable("pos_sales", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  clientId: integer("client_id").references(() => clients.id),
  orderId: integer("order_id").references(() => orders.id),
  seller: text("seller").notNull().default("Tiago Souza"),
  paymentMethod: text("payment_method").notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 14, scale: 2 }).notNull().default("0"),
  discountType: text("discount_type").notNull().default("fixed"),
  discountPercent: numeric("discount_percent", { precision: 7, scale: 2 }).notNull().default("0"),
  surcharge: numeric("surcharge", { precision: 14, scale: 2 }).notNull().default("0"),
  installments: integer("installments").notNull().default(1),
  discountReason: text("discount_reason"),
  authorizedBy: text("authorized_by"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
  amountPaid: numeric("amount_paid", { precision: 14, scale: 2 }).notNull(),
  change: numeric("change", { precision: 14, scale: 2 }).notNull().default("0"),
  deliveryType: text("delivery_type").notNull().default("Entrega direta para o cliente"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const posSaleItems = pgTable("pos_sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => posSales.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  description: text("description").notNull(),
  unit: text("unit").notNull().default("UNI"),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 14, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
});

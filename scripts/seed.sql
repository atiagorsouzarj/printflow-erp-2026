INSERT INTO settings (id, company_name, document, email, phone, default_margin, hourly_labor_cost)
VALUES (1,'PrintFlow Gráfica Criativa','12.345.678/0001-90','contato@printflow.com.br','(11) 4002-8922',30,35)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (name, contact, phone, email) SELECT * FROM (VALUES
('Distribuidora Alpha','Marina','(11) 3333-1020','vendas@alpha.com.br'),
('Mundo do Papel','Ricardo','(11) 98888-4310','comercial@mundodopapel.com.br')
) AS v(name,contact,phone,email) WHERE NOT EXISTS (SELECT 1 FROM suppliers);

INSERT INTO materials (sku,name,category,unit,stock,minimum_stock,average_cost,supplier_id) SELECT * FROM (VALUES
('PAP-A4-90','Papel Offset A4 90g','Papel','fl',2500::numeric,500::numeric,0.1180::numeric,(SELECT id FROM suppliers ORDER BY id LIMIT 1)),
('PAP-SRA3-250','Papel Couchê SRA3 250g','Papel','fl',180::numeric,250::numeric,0.8200::numeric,(SELECT id FROM suppliers ORDER BY id DESC LIMIT 1)),
('LAM-FOSCA','Laminação BOPP Fosca','Acabamento','m2',42::numeric,10::numeric,8.4000::numeric,(SELECT id FROM suppliers ORDER BY id LIMIT 1)),
('FIL-PLA-BR','Filamento PLA Branco','Filamento','kg',3.2::numeric,2::numeric,92.0000::numeric,(SELECT id FROM suppliers ORDER BY id LIMIT 1)),
('EMB-KRAFT-P','Caixa Kraft Pequena','Embalagem','un',75::numeric,30::numeric,1.8500::numeric,(SELECT id FROM suppliers ORDER BY id DESC LIMIT 1))
) AS v(sku,name,category,unit,stock,minimum_stock,average_cost,supplier_id) ON CONFLICT (sku) DO NOTHING;

INSERT INTO printer_categories (name,pricing_mode,description) VALUES
('Laser','click','Toner CMYK com custo por clique, depreciação e manutenção.'),
('Jato de Tinta','click','Tintas individuais calculadas pelo consumo médio por página.'),
('Impressão 3D','time','Custo por hora de máquina somado ao filamento usado.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO printers (name,model,category_id,acquisition_cost,useful_life_months,monthly_volume,maintenance_monthly,energy_cost_hour,bw_cost,color_cost,hourly_cost) SELECT * FROM (VALUES
('Laser Produção 01','Ricoh IM C6000',(SELECT id FROM printer_categories WHERE name='Laser'),48000::numeric,60,18000,650::numeric,0.95::numeric,0.07::numeric,0.42::numeric,0::numeric),
('Jato Fotográfica','Epson L8180',(SELECT id FROM printer_categories WHERE name='Jato de Tinta'),6200::numeric,48,3500,95::numeric,0.18::numeric,0.035::numeric,0.19::numeric,0::numeric),
('3D Principal','Bambu Lab P1S',(SELECT id FROM printer_categories WHERE name='Impressão 3D'),7800::numeric,48,450,120::numeric,0.42::numeric,0::numeric,0::numeric,8.5::numeric)
) AS v(name,model,category_id,acquisition_cost,useful_life_months,monthly_volume,maintenance_monthly,energy_cost_hour,bw_cost,color_cost,hourly_cost) WHERE NOT EXISTS (SELECT 1 FROM printers);

INSERT INTO clients (name,company,document,email,phone) SELECT * FROM (VALUES
('Ana Oliveira','Café Aurora','28.991.321/0001-44','ana@cafeaurora.com.br','(11) 99871-2001'),
('Carlos Mendes','Mendes Arquitetura','44.702.109/0001-08','carlos@mendes.arq.br','(11) 98744-3012'),
('Fernanda Souza',NULL,'392.441.208-10','fernanda.souza@email.com','(11) 97730-2219')
) AS v(name,company,document,email,phone) WHERE NOT EXISTS (SELECT 1 FROM clients);

INSERT INTO leads (name,email,phone,interest,status) SELECT * FROM (VALUES
('Luana Costa','luana@email.com','(11) 95544-1188','Kit de personalizados','novo'),
('Studio Norte','contato@studionorte.com','(11) 94411-9920','Material corporativo','contato')
) AS v(name,email,phone,interest,status) WHERE NOT EXISTS (SELECT 1 FROM leads);

INSERT INTO products (sku,name,kind,category,printer_id,print_mode,paper_size,prints_per_unit,labor_minutes,labor_hour_cost,extra_cost,tax_percent,card_fee_percent,commission_percent,margin_percent,calculated_cost,sale_price) SELECT * FROM (VALUES
('CAR-VIS-4X0','Cartão de Visita Premium','produto','Papelaria Corporativa',(SELECT id FROM printers WHERE name='Laser Produção 01'),'color','SRA3 — 320 × 450 mm',0.05::numeric,0.5::numeric,35::numeric,0.08::numeric,6::numeric,3.49::numeric,0::numeric,30::numeric,0.48::numeric,0.80::numeric),
('PAN-A5-4X4','Panfleto A5 4x4','produto','Impressos Promocionais',(SELECT id FROM printers WHERE name='Laser Produção 01'),'color','A4 — 210 × 297 mm',0.5::numeric,0.2::numeric,35::numeric,0::numeric,6::numeric,3.49::numeric,0::numeric,25::numeric,0.39::numeric,0.60::numeric),
('MODEL-3D','Modelagem e Impressão 3D','servico','Impressão 3D',(SELECT id FROM printers WHERE name='3D Principal'),'color','Bobina / personalizado',1::numeric,25::numeric,35::numeric,4::numeric,6::numeric,3.49::numeric,5::numeric,35::numeric,32::numeric,63.36::numeric),
('ARTE-PRO','Criação de Arte Profissional','servico','Design',NULL,'color',NULL,0::numeric,60::numeric,35::numeric,0::numeric,6::numeric,3.49::numeric,5::numeric,40::numeric,35::numeric,76.91::numeric)
) AS v(sku,name,kind,category,printer_id,print_mode,paper_size,prints_per_unit,labor_minutes,labor_hour_cost,extra_cost,tax_percent,card_fee_percent,commission_percent,margin_percent,calculated_cost,sale_price) ON CONFLICT (sku) DO NOTHING;

INSERT INTO orders (code,client_id,stage,payment_status,total,due_date) SELECT * FROM (VALUES
('PED-2026-001',(SELECT id FROM clients ORDER BY id LIMIT 1),'arte','pago',420::numeric,current_date+3),
('PED-2026-002',(SELECT id FROM clients ORDER BY id OFFSET 1 LIMIT 1),'producao','pendente',780::numeric,current_date+2),
('PED-2026-003',(SELECT id FROM clients ORDER BY id OFFSET 2 LIMIT 1),'acabamento','pago',215::numeric,current_date+1)
) AS v(code,client_id,stage,payment_status,total,due_date) ON CONFLICT (code) DO NOTHING;

INSERT INTO financial_entries (type,description,amount,status,due_date,order_id) SELECT 'receber','Pedido '||code,total,CASE WHEN payment_status='pago' THEN 'pago' ELSE 'pendente' END,due_date,id FROM orders o WHERE NOT EXISTS (SELECT 1 FROM financial_entries f WHERE f.order_id=o.id);

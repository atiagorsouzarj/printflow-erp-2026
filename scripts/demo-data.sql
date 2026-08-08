BEGIN;
INSERT INTO clients(type,name,company,fantasy_name,document,email,phone,mobile,whatsapp,city,uf,status,marketing_source,accepts_whatsapp,accepts_email)
SELECT * FROM (VALUES
('pj','Mariana Costa','Ateliê Encanto Ltda','Ateliê Encanto','48726193000155','mariana.demo@printflow.local','2132111001','21991001001','21991001001','Rio de Janeiro','RJ','liberado','Instagram',true,true),
('pf','Rafael Nunes',NULL,NULL,'52998224725','rafael.demo@printflow.local','2132111002','21991001002','21991001002','Rio de Janeiro','RJ','liberado','Google',true,true),
('pj','Cláudia Ribeiro','Doce Festa Eventos Ltda','Doce Festa','19131243000197','claudia.demo@printflow.local','2132111003','21991001003','21991001003','Niterói','RJ','liberado','Indicação',true,true),
('pf','Bruno Almeida',NULL,NULL,'11144477735','bruno.demo@printflow.local','2132111004','21991001004','21991001004','Duque de Caxias','RJ','liberado','WhatsApp',true,false),
('pj','Studio Horizonte','Studio Horizonte Criativo Ltda','Studio Horizonte','27865757000102','studio.demo@printflow.local','2132111005','21991001005','21991001005','Rio de Janeiro','RJ','liberado','Balcão',false,true)
) v(type,name,company,fantasy_name,document,email,phone,mobile,whatsapp,city,uf,status,marketing_source,accepts_whatsapp,accepts_email)
WHERE NOT EXISTS(SELECT 1 FROM clients c WHERE c.email=v.email);

INSERT INTO leads(protocol,type,name,email,phone,interest,message,origin,score,status,accepts_whatsapp,accepts_email)
SELECT * FROM (VALUES
('DEMO-WA-001','pf','Júlia Martins','julia.lead@demo.local','21992002001','Canecas personalizadas','Solicitou 30 canecas','whatsapp',85,'em atendimento',true,false),
('DEMO-PUB-002','pj','Loja Bela Casa','contato.belacasa@demo.local','21992002002','Etiquetas em rolo','Etiquetas 50x50 para produtos','pagina_publica',90,'novo',true,true),
('DEMO-API-003','pf','André Gomes','andre.lead@demo.local','21992002003','Banner','Banner 2x1 para evento','external_api',72,'novo',false,true),
('DEMO-BAL-004','pf','Sônia Paes',NULL,'21992002004','Convites','Visitou a loja','balcao',60,'qualificado',true,false),
('DEMO-SITE-005','pj','Academia Movimento','academia@demo.local','21992002005','Camisas DTF','Orçamento de 80 camisas','site',88,'novo',true,true)
) v(protocol,type,name,email,phone,interest,message,origin,score,status,accepts_whatsapp,accepts_email)
ON CONFLICT(protocol) DO NOTHING;

INSERT INTO materials(sku,name,category,category_id,unit,purchase_unit,units_per_package,format,grammage,size,color,attributes,stock,minimum_stock,average_cost,active)
SELECT v.sku,v.name,v.category,c.id,v.unit,v.purchase_unit,v.units_per_package,v.format,v.grammage,v.size,v.color,v.attributes::jsonb,v.stock,v.minimum_stock,v.average_cost,true
FROM (VALUES
('DEMO-PAP-A4-250','Couchê Brilho 250g','Papéis','papel','fl','resma',250::numeric,'A4',250::numeric,NULL,NULL,'{"finish":"Brilho","brand":"Demo"}',1250::numeric,250::numeric,.48::numeric),
('DEMO-CAM-P-BR','Camisa Branca P','Camisas e vestuário','camisa','un','un',1,NULL,NULL,'P','Branca','{"composition":"100% algodão"}',24,5,18.50),
('DEMO-CAM-M-PR','Camisa Preta M','Camisas e vestuário','camisa','un','un',1,NULL,NULL,'M','Preta','{"composition":"100% algodão"}',18,5,20.00),
('DEMO-ETQ-50','Etiqueta Couchê Redonda 50x50','Etiquetas em rolo','etiqueta','un','rolo',1000,NULL,NULL,'50x50','Branca','{"shape":"Redonda","labelsPerRoll":1000,"rollLengthMeters":26,"widthMm":50,"heightMm":50,"gapMm":2}',3000,500,.065),
('DEMO-CAN-BR','Caneca Porcelana Branca','Canecas e brindes','brinde','un','caixa',36,NULL,NULL,'325ml','Branca','{"composition":"Porcelana"}',72,12,8.90)
) v(sku,name,category,code,unit,purchase_unit,units_per_package,format,grammage,size,color,attributes,stock,minimum_stock,average_cost)
JOIN material_categories c ON c.code=v.code ON CONFLICT(sku) DO NOTHING;

INSERT INTO products(sku,name,kind,category,description,minimum_quantity,labor_minutes,labor_hour_cost,tax_percent,card_fee_percent,margin_percent,calculated_cost,sale_price,lead_time_days,active)
SELECT * FROM (VALUES
('DEMO-CARTAO-250','Cartão de Visita Couchê 250g','produto','Gráfica Rápida','Impressão colorida e corte',100::numeric,8::numeric,35::numeric,6::numeric,3.49::numeric,35::numeric,22::numeric,55::numeric,3,true),
('DEMO-CANECA','Caneca Personalizada','produto','Personalizados','Caneca com sublimação',1,18,35,6,3.49,40,18,45,4,true),
('DEMO-CAM-DTF','Camisa Personalizada DTF','produto','Vestuário','Camisa com DTF têxtil',1,20,35,6,3.49,38,29,69,5,true),
('DEMO-BANNER-M2','Banner Personalizado por m²','servico','Grandes Formatos','Banner terceirizado com acabamento',1,15,35,6,3.49,35,35,75,5,true),
('DEMO-ETIQUETA','Etiquetas Personalizadas em Rolo','produto','Etiquetas','Etiqueta + ribbon + impressão térmica',100,12,35,6,3.49,35,16,39,3,true),
('DEMO-ARTE','Criação de Arte para Redes Sociais','servico','Design','Criação e aprovação digital',1,60,35,6,3.49,45,35,89,3,true)
) v(sku,name,kind,category,description,minimum_quantity,labor_minutes,labor_hour_cost,tax_percent,card_fee_percent,margin_percent,calculated_cost,sale_price,lead_time_days,active)
ON CONFLICT(sku) DO NOTHING;

DO $$
DECLARE c1 int; c2 int; p1 int; p2 int; q1 int; q2 int; o1 int; o2 int;
BEGIN
 SELECT id INTO c1 FROM clients WHERE email='mariana.demo@printflow.local';
 SELECT id INTO c2 FROM clients WHERE email='rafael.demo@printflow.local';
 SELECT id INTO p1 FROM products WHERE sku='DEMO-CARTAO-250';
 SELECT id INTO p2 FROM products WHERE sku='DEMO-CANECA';
 IF NOT EXISTS(SELECT 1 FROM quotes WHERE code='ORC-DEMO-001') THEN
  INSERT INTO quotes(code,client_id,status,payment_method,installments,shipping_type,shipping_cost,discount,subtotal,total,notes,public_token,valid_until,sent_at)
  VALUES('ORC-DEMO-001',c1,'enviado','pix',1,'retirada',0,10,280,270,'Couchê brilho, impressão 4x4 e corte.','demo-orcamento-001',current_date+7,now()) RETURNING id INTO q1;
  INSERT INTO quote_items(quote_id,product_id,description,quantity,unit_price,total) VALUES(q1,p1,'Cartão de Visita Couchê 250g',500,.45,225),(q1,p2,'Caneca Personalizada',1,55,55);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM quotes WHERE code='ORC-DEMO-002') THEN
  INSERT INTO quotes(code,client_id,status,payment_method,installments,shipping_type,shipping_cost,discount,subtotal,total,notes,public_token,valid_until)
  VALUES('ORC-DEMO-002',c2,'rascunho','cartao',3,'superfrete',25,0,345,370,'Camisas tamanho M, arte frontal.','demo-orcamento-002',current_date+10) RETURNING id INTO q2;
  INSERT INTO quote_items(quote_id,product_id,description,quantity,unit_price,total) SELECT q2,id,name,5,69,345 FROM products WHERE sku='DEMO-CAM-DTF';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM orders WHERE code='PED-DEMO-001') THEN
  INSERT INTO orders(code,client_id,stage,payment_status,delivery_status,delivery_method,public_token,total,due_date)
  VALUES('PED-DEMO-001',c1,'arte','pendente','aguardando_producao','balcao','demo-pedido-token-001',270,current_date+4) RETURNING id INTO o1;
  INSERT INTO financial_entries(type,description,amount,status,due_date,order_id,payment_method,cost_center) VALUES('receber','Pedido PED-DEMO-001',270,'pendente',current_date+4,o1,'PIX','Comercial');
  INSERT INTO artwork_versions(order_id,version,file_url,notes,status,public_token) VALUES(o1,1,'/images/demo-arte.svg','Confira nome, telefone e cores.','awaiting','demo-arte-token-001');
 END IF;
 IF NOT EXISTS(SELECT 1 FROM orders WHERE code='PED-DEMO-002') THEN
  INSERT INTO orders(code,client_id,stage,payment_status,delivery_status,delivery_method,public_token,total,due_date)
  VALUES('PED-DEMO-002',c2,'acabamento','pago','agendado','uber_entrega','demo-pedido-token-002',450,current_date+1) RETURNING id INTO o2;
  INSERT INTO financial_entries(type,description,amount,status,paid_at,order_id,payment_method,cost_center) VALUES('receber','Pedido PED-DEMO-002',450,'pago',now(),o2,'PIX Banco Inter','Comercial');
  INSERT INTO deliveries(order_id,provider,status,recipient_name,recipient_phone,address,driver_name,price,scheduled_at,notes) VALUES(o2,'uber_entrega','agendado','Rafael Nunes','21991001002','Rio de Janeiro/RJ','A definir',22,current_date+1,'Produto frágil');
  INSERT INTO shipping_quotes(order_id,provider,service_id,service_name,price,delivery_days,raw,selected) VALUES(o2,'superfrete','1','PAC Demo',24.90,5,'{}',false),(o2,'superfrete','2','SEDEX Demo',39.90,2,'{}',false);
 END IF;
END $$;

INSERT INTO google_reviews_cache(review_id,reviewer_name,rating,comment,reply,review_created_at)
VALUES('demo-review-001','Camila Rocha',5,'Atendimento excelente e cartões impecáveis.','Muito obrigado pela confiança!',now()-interval '4 days'),('demo-review-002','Loja Criativa',5,'Entrega no prazo e ótimo acabamento.',NULL,now()-interval '9 days'),('demo-review-003','Paulo Mendes',4,'Boa qualidade e comunicação durante a produção.',NULL,now()-interval '15 days')
ON CONFLICT(review_id) DO NOTHING;

INSERT INTO financial_entries(type,description,amount,status,due_date,paid_at,payment_method,cost_center,document_number)
SELECT * FROM (VALUES
('pagar','Aluguel da loja',2200::numeric,'pendente',current_date+5,NULL::timestamp,'PIX','Administrativo','ALUG-DEM'),
('pagar','Energia elétrica',780,'pendente',current_date+8,NULL,'Boleto','Produção','ENER-DEM'),
('pagar','Compra de papel couchê',950,'pago',current_date-5,now()-interval '5 days','PIX','Produção','NF-DEMO-101'),
('receber','Venda corporativa etiquetas',1680,'pendente',current_date-3,NULL,'Boleto','Comercial','REC-DEMO-01'),
('receber','Venda balcão canecas',360,'pago',current_date-2,now()-interval '2 days','InfinitePay','Comercial','REC-DEMO-02')
) v(type,description,amount,status,due_date,paid_at,payment_method,cost_center,document_number)
WHERE NOT EXISTS(SELECT 1 FROM financial_entries f WHERE f.document_number=v.document_number);
COMMIT;

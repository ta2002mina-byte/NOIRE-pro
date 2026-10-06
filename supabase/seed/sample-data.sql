-- =====================================================================
-- NOIRÉ — SAMPLE DATA (demo content, safe to run more than once)
-- Fictional restaurant, dishes, people and contact details. Run it in the Supabase
-- SQL editor AFTER the migrations. Replace everything with your real details from
-- /admin (Settings, Menu, ...) before you launch. Images are left empty: add photos
-- from the admin (Menu, Experiences, Chef, Ingredients, Gallery, Site content).
-- Prices are in BDT (Bangladeshi taka) and the time zone is Asia/Dhaka.
-- =====================================================================
set search_path = public, extensions;

insert into public.restaurants (name, slug, tagline, description, address_line, city, region, postal_code, country, phone, email, latitude, longitude, timezone, currency, opening_hours, reservation_duration_minutes, is_active)
values ('NOIRÉ','noire','Your table. Your taste. Your story.',
 'A candle-lit dining room where every dish is chosen around your mood, and every ingredient has a name, a farm and a season.',
 'House 12, Road 34, Gulshan 2','Dhaka','Dhaka Division','1212','Bangladesh','+880 1700-000000','hello@example.com',23.794100,90.414400,
 'Asia/Dhaka','BDT',
 '{"monday":"18:00–23:00","tuesday":"18:00–23:00","wednesday":"18:00–23:00","thursday":"18:00–23:30","friday":"13:00–15:30, 18:00–23:30","saturday":"13:00–15:30, 18:00–23:30","sunday":"13:00–22:30"}'::jsonb,
 120,true)
on conflict (slug) do nothing;

insert into public.categories (restaurant_id, name, slug, description, sort_order) values
((select id from public.restaurants where slug = 'noire'),'Starters','starters','Small plates to begin.',1),
((select id from public.restaurants where slug = 'noire'),'Mains','mains','The heart of the evening.',2),
((select id from public.restaurants where slug = 'noire'),'Desserts','desserts','A slow, sweet finish.',3),
((select id from public.restaurants where slug = 'noire'),'Drinks','drinks','Cold, warm and in between.',4)
on conflict (restaurant_id, slug) do nothing;

insert into public.menu_items (restaurant_id, category_id, name, slug, description, story, chef_note, price, spice_level, diet_type, dietary_tags, is_featured, is_chef_choice, is_available, sort_order) values
((select id from public.restaurants where slug = 'noire'),(select id from public.categories where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'starters'),'Burrata & Roasted Tomato','burrata-roasted-tomato','Creamy burrata, slow-roasted tomatoes, basil oil and warm sourdough.','We roast the tomatoes for three hours until they taste like the sun.','Eat it while the bread is still warm.',780,0,'vegetarian',array['gluten']::text[],true,false,true,1),
((select id from public.restaurants where slug = 'noire'),(select id from public.categories where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'starters'),'Charred Corn Velouté','charred-corn-soup','Silky sweet-corn soup with chilli oil and toasted seeds.','Born from a street-side corn cart memory.','A little heat at the end, never at the start.',520,2,'vegetarian',array['gluten-free','dairy']::text[],false,false,true,2),
((select id from public.restaurants where slug = 'noire'),(select id from public.categories where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'starters'),'Tuna Crudo','tuna-crudo','Thin-sliced tuna, citrus, cucumber and green chilli.','Bright, cold and clean — the lightest thing we make.','Best shared between two.',890,1,'pescatarian',array['gluten-free','fish']::text[],false,false,true,3),
((select id from public.restaurants where slug = 'noire'),(select id from public.categories where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'starters'),'Crispy Prawn Bao','crispy-prawn-bao','Soft steamed buns, crisp prawns, pickled cucumber and spicy mayo.','A late-night favourite of the kitchen team.','Two bites each, three if you are brave.',720,3,'pescatarian',array['shellfish','gluten','egg']::text[],true,false,true,4),
((select id from public.restaurants where slug = 'noire'),(select id from public.categories where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'mains'),'Wild Mushroom Risotto','wild-mushroom-risotto','Carnaroli rice, mixed mushrooms, parmesan and truffle butter.','Stirred for eighteen minutes, never rushed.','Ask for extra truffle if you love earthy flavours.',1180,0,'vegetarian',array['gluten-free','dairy']::text[],true,true,true,1),
((select id from public.restaurants where slug = 'noire'),(select id from public.categories where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'mains'),'Slow-Braised Beef Short Rib','slow-braised-beef-short-rib','Twelve-hour braised short rib, red wine jus, creamy mash and glazed carrots.','The dish people come back for.','Fork-tender; no knife needed.',1890,1,'non_vegetarian',array['gluten-free','dairy']::text[],true,true,true,2),
((select id from public.restaurants where slug = 'noire'),(select id from public.categories where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'mains'),'Lemon & Herb Roast Chicken','lemon-herb-roast-chicken','Free-range chicken, lemon, thyme, garlic jus and roasted potatoes.','Sunday-lunch comfort, every day of the week.','Crisp skin, juicy inside.',1290,0,'non_vegetarian',array['gluten-free']::text[],false,false,true,3),
((select id from public.restaurants where slug = 'noire'),(select id from public.categories where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'mains'),'Pan-Seared Sea Bass','pan-seared-sea-bass','Crisp-skinned sea bass, saffron beurre blanc and wilted greens.','Light, golden and quietly luxurious.','Pair with something crisp and cold.',1590,0,'pescatarian',array['gluten-free','fish','dairy']::text[],false,false,true,4),
((select id from public.restaurants where slug = 'noire'),(select id from public.categories where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'mains'),'Spiced Lamb Rack','spiced-lamb-rack','Herb-crusted lamb rack, cumin carrots and a pomegranate glaze.','A nod to the spice markets of Old Dhaka.','Medium-rare is the way.',2150,3,'non_vegetarian',array['gluten']::text[],false,true,true,5),
((select id from public.restaurants where slug = 'noire'),(select id from public.categories where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'mains'),'Coconut Green Curry','coconut-green-curry','Vegetables and tofu in a fragrant green curry with jasmine rice.','Fresh herbs ground by hand every morning.','The spice builds slowly.',1050,4,'vegan',array['gluten-free','vegan','soy']::text[],false,false,true,6),
((select id from public.restaurants where slug = 'noire'),(select id from public.categories where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'mains'),'Smoked Chilli Pasta','smoked-chilli-pasta','Fresh tagliatelle, smoked chilli, garlic and charred broccoli.','For the nights you want something bold.','Not for the faint of heart.',980,5,'vegan',array['vegan']::text[],false,false,true,7),
((select id from public.restaurants where slug = 'noire'),(select id from public.categories where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'desserts'),'Dark Chocolate Fondant','dark-chocolate-fondant','Warm molten chocolate cake with vanilla bean ice cream.','Twelve minutes in the oven, exactly.','Break it open slowly.',640,0,'vegetarian',array['egg','dairy','gluten']::text[],true,false,true,1),
((select id from public.restaurants where slug = 'noire'),(select id from public.categories where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'desserts'),'Saffron Panna Cotta','saffron-panna-cotta','Silky saffron cream with pistachio crumble and honey.','A soft, floral finish.','Light enough after a big meal.',580,0,'vegetarian',array['gluten-free','dairy','nuts']::text[],false,true,true,2),
((select id from public.restaurants where slug = 'noire'),(select id from public.categories where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'desserts'),'Mango Lassi Sorbet','mango-lassi-sorbet','Dairy-free mango sorbet with cardamom and lime.','Summer in a bowl.','Refreshing and cleansing.',460,0,'vegan',array['vegan','gluten-free']::text[],false,false,true,3),
((select id from public.restaurants where slug = 'noire'),(select id from public.categories where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'drinks'),'NOIRÉ Signature Mocktail','noire-signature-mocktail','Blackberry, lime, mint and ginger beer over crushed ice.','Our house non-alcoholic drink.','Sweet, sour and fizzy.',420,0,'vegan',array['vegan','gluten-free']::text[],false,false,true,1),
((select id from public.restaurants where slug = 'noire'),(select id from public.categories where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'drinks'),'Cardamom Cold Brew','cardamom-cold-brew','Slow-steeped cold brew with cardamom and a little jaggery.','Made the night before.','Great with dessert.',380,0,'vegan',array['vegan','gluten-free']::text[],false,false,true,2)
on conflict (restaurant_id, slug) do nothing;

insert into public.dish_preferences (menu_item_id, mood, flavor, texture, meal_type, occasion, spice_level) values
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'burrata-roasted-tomato'),'light','fresh','creamy','starter','date night',0),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'charred-corn-soup'),'comfort','sweet','silky','starter','casual',2),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'tuna-crudo'),'light','citrus','tender','starter','date night',1),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'crispy-prawn-bao'),'something_new','savory','crispy','starter','friends',3),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'crispy-prawn-bao'),'spicy','savory','crispy','starter','friends',3),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'wild-mushroom-risotto'),'comfort','earthy','creamy','main','date night',0),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'wild-mushroom-risotto'),'rich_creamy','earthy','creamy','main','celebration',0),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'wild-mushroom-risotto'),'chefs_choice','earthy','creamy','main','celebration',0),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'slow-braised-beef-short-rib'),'comfort','savory','tender','main','celebration',1),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'slow-braised-beef-short-rib'),'chefs_choice','savory','tender','main','celebration',1),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'lemon-herb-roast-chicken'),'comfort','herby','juicy','main','family',0),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'pan-seared-sea-bass'),'light','buttery','flaky','main','date night',0),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'spiced-lamb-rack'),'spicy','spiced','tender','main','celebration',3),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'spiced-lamb-rack'),'chefs_choice','spiced','tender','main','celebration',3),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'coconut-green-curry'),'spicy','herby','creamy','main','casual',4),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'coconut-green-curry'),'something_new','herby','creamy','main','casual',4),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'smoked-chilli-pasta'),'spicy','smoky','chewy','main','casual',5),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'dark-chocolate-fondant'),'rich_creamy','sweet','molten','dessert','celebration',0),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'saffron-panna-cotta'),'light','floral','silky','dessert','date night',0),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'saffron-panna-cotta'),'chefs_choice','floral','silky','dessert','date night',0),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'mango-lassi-sorbet'),'light','fruity','smooth','dessert','casual',0),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'noire-signature-mocktail'),'something_new','tangy','fizzy','drink','friends',0),
((select id from public.menu_items where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = 'cardamom-cold-brew'),'something_new','spiced','smooth','drink','casual',0)
on conflict do nothing;

insert into public.ingredients (restaurant_id, name, slug, description, season, is_active) values
((select id from public.restaurants where slug = 'noire'),'Heirloom Tomatoes','heirloom-tomatoes','Sun-ripened tomatoes with deep, sweet flavour.','Winter',true),
((select id from public.restaurants where slug = 'noire'),'Wild Mushrooms','wild-mushrooms','A mix of oyster, shiitake and king oyster mushrooms.','Year-round',true),
((select id from public.restaurants where slug = 'noire'),'Sea Bass','sea-bass','Line-caught fish, delivered whole.','Year-round',true),
((select id from public.restaurants where slug = 'noire'),'Free-Range Chicken','free-range-chicken','Slow-grown birds with proper flavour.','Year-round',true),
((select id from public.restaurants where slug = 'noire'),'Cardamom & Spices','black-cardamom','Whole spices, toasted and ground in-house.','Year-round',true),
((select id from public.restaurants where slug = 'noire'),'Saffron','saffron','Fine threads that give colour and a floral note.','Autumn',true),
((select id from public.restaurants where slug = 'noire'),'Mango','alphonso-mango','Sweet, fragrant mangoes at their peak.','Summer',true),
((select id from public.restaurants where slug = 'noire'),'Dark Chocolate','dark-chocolate','70% cocoa, fairly traded.','Year-round',true)
on conflict (restaurant_id, slug) do nothing;

insert into public.ingredient_sources (ingredient_id, source_name, source_type, location, season_start_month, season_end_month, notes, is_published)
select i.id, v.source_name, v.source_type, v.location, v.sm, v.em, v.notes, true from (values
('heirloom-tomatoes','Green Valley Farm','farm','Savar, Dhaka',11,3,'Picked in the morning, in our kitchen by noon.'),
('wild-mushrooms','Forest Floor Growers','supplier','Gazipur',1,12,'Grown indoors, so the supply stays steady.'),
('sea-bass','Bay Fisheries','supplier','Cox’s Bazar',10,4,'We ask for the catch time on every delivery.'),
('free-range-chicken','Haque Family Farm','farm','Narsingdi',1,12,'Raised on open pasture.'),
('black-cardamom','Old Dhaka Spice Merchant','market','Chawkbazar, Dhaka',1,12,'We buy whole and grind weekly.'),
('saffron','Kashmir Saffron Co.','supplier','Imported',10,11,'Used sparingly — a few threads go a long way.'),
('alphonso-mango','Rajshahi Orchards','farm','Rajshahi',5,7,'Only in season, so the sorbet is a summer dish.'),
('dark-chocolate','Cacao Direct','supplier','Imported',1,12,'Chosen for a clean, fruity finish.')
) as v(slug, source_name, source_type, location, sm, em, notes)
join public.ingredients i on i.restaurant_id = (select id from public.restaurants where slug = 'noire') and i.slug = v.slug
where not exists (select 1 from public.ingredient_sources x where x.ingredient_id = i.id and x.source_name = v.source_name);

insert into public.menu_item_ingredients (menu_item_id, ingredient_id, is_primary)
select m.id, i.id, v.p from (values
('burrata-roasted-tomato','heirloom-tomatoes',true),
('wild-mushroom-risotto','wild-mushrooms',true),
('pan-seared-sea-bass','sea-bass',true),
('lemon-herb-roast-chicken','free-range-chicken',true),
('spiced-lamb-rack','black-cardamom',false),
('saffron-panna-cotta','saffron',true),
('mango-lassi-sorbet','alphonso-mango',true),
('dark-chocolate-fondant','dark-chocolate',true),
('cardamom-cold-brew','black-cardamom',true),
('coconut-green-curry','black-cardamom',false)
) as v(dish, ing, p)
join public.menu_items m on m.restaurant_id = (select id from public.restaurants where slug = 'noire') and m.slug = v.dish
join public.ingredients i on i.restaurant_id = (select id from public.restaurants where slug = 'noire') and i.slug = v.ing
on conflict do nothing;

insert into public.dining_experiences (restaurant_id, title, slug, description, min_guests, max_guests, available_areas, preparation_notes, sort_order, is_active) values
((select id from public.restaurants where slug = 'noire'),'Chef’s Table','chefs-table','A seven-course tasting menu at the pass, with the chef explaining each plate.',2,6,array['bar','private_dining']::text[],'Please tell us about allergies when you book. Seven courses take about two and a half hours.',1,true),
((select id from public.restaurants where slug = 'noire'),'Candlelit Date Night','candlelit-date-night','A quiet corner, a shared starter and a dessert on the house.',2,2,array['quiet','window']::text[],'Tell us if it is an anniversary or birthday and we will add a small surprise.',2,true),
((select id from public.restaurants where slug = 'noire'),'Private Dining Room','private-dining-room','Your own room for family dinners, birthdays and small celebrations.',6,14,array['private_dining']::text[],'A minimum spend applies. Please contact us a week ahead for larger groups.',3,true),
((select id from public.restaurants where slug = 'noire'),'Garden Evening','garden-evening','Dinner outdoors among the lanterns, in cooler months.',2,8,array['garden','outdoor']::text[],'Weather permitting. We will move you inside if it rains.',4,true)
on conflict (restaurant_id, slug) do nothing;

insert into public.tables (restaurant_id, label, area, min_capacity, capacity, shape, pos_x, pos_y, width, height, is_active) values
((select id from public.restaurants where slug = 'noire'),'W1','window',2,2,'round',12,15,8,8,true),
((select id from public.restaurants where slug = 'noire'),'W2','window',2,2,'round',12,35,8,8,true),
((select id from public.restaurants where slug = 'noire'),'W3','window',2,4,'square',12,55,10,10,true),
((select id from public.restaurants where slug = 'noire'),'Q1','quiet',2,2,'round',40,12,8,8,true),
((select id from public.restaurants where slug = 'noire'),'Q2','quiet',2,4,'square',40,32,10,10,true),
((select id from public.restaurants where slug = 'noire'),'M1','main_hall',2,4,'square',40,58,10,10,true),
((select id from public.restaurants where slug = 'noire'),'M2','main_hall',2,4,'square',58,58,10,10,true),
((select id from public.restaurants where slug = 'noire'),'M3','main_hall',4,6,'rectangle',76,58,14,9,true),
((select id from public.restaurants where slug = 'noire'),'M4','main_hall',4,6,'rectangle',58,78,14,9,true),
((select id from public.restaurants where slug = 'noire'),'B1','bar',1,2,'round',88,15,7,7,true),
((select id from public.restaurants where slug = 'noire'),'B2','bar',1,2,'round',88,30,7,7,true),
((select id from public.restaurants where slug = 'noire'),'P1','private_dining',6,14,'rectangle',70,15,22,12,true),
((select id from public.restaurants where slug = 'noire'),'G1','garden',2,4,'round',12,80,9,9,true),
((select id from public.restaurants where slug = 'noire'),'G2','garden',2,6,'rectangle',30,80,14,9,true)
on conflict (restaurant_id, label) do nothing;

insert into public.chef_notes (restaurant_id, ingredient_id, title, body, status, is_featured, publish_at)
select (select id from public.restaurants where slug = 'noire'), (select id from public.ingredients where restaurant_id = (select id from public.restaurants where slug = 'noire') and slug = v.ing), v.title, v.body, 'published', v.feat, now() - interval '1 day' from (values
('The tomato that started it all','Our tomatoes come from one family farm outside Savar. When the first heirlooms arrive in winter, the menu quietly changes around them. This is why the burrata is the first dish you will see.','heirloom-tomatoes',true),
('Why we braise for twelve hours','Short rib is a cheap, tough cut that rewards patience. We start the braise before lunch service so it is ready for dinner, and we never reheat it twice.',null,false),
('A note on spice','Spice here is a dial, not a switch. Our menu marks every dish from 0 to 5, and if you tell us what you like, we will happily tune the heat.','black-cardamom',false)
) as v(title, body, ing, feat)
where not exists (select 1 from public.chef_notes c where c.restaurant_id = (select id from public.restaurants where slug = 'noire') and c.title = v.title);

insert into public.restaurant_stories (restaurant_id, title, description, story_type, published_at, expires_at, is_active)
select (select id from public.restaurants where slug = 'noire'), v.title, v.d, v.t, now() - interval '2 hours', now() + interval '90 days', true from (values
('Inside the kitchen at 4 pm','The hour before service is the quietest and busiest of the day: stocks simmering, herbs picked, tables set.','kitchen'),
('Meet the chef','Our head chef grew up cooking beside her grandmother in Old Dhaka and still uses her spice blend for the lamb.','chef'),
('Dish of the week: Wild Mushroom Risotto','Earthy, creamy and finished with truffle butter at the table.','dish')
) as v(title, d, t)
where not exists (select 1 from public.restaurant_stories s where s.restaurant_id = (select id from public.restaurants where slug = 'noire') and s.title = v.title);

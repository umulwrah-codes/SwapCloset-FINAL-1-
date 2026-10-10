import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'swapcloset-development-secret-change-me';
const db = new Database(path.join(__dirname, 'swapcloset.db'));
db.pragma('foreign_keys = ON');
app.use(cors());
app.use(express.json({ limit:'2mb' }));

function init(){
 db.exec(`
 CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'user',avatar TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS items(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,title TEXT NOT NULL,brand TEXT,category TEXT NOT NULL,size TEXT NOT NULL,condition TEXT NOT NULL,description TEXT,location TEXT,image_url TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'available',created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
 CREATE TABLE IF NOT EXISTS wishlists(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,item_id INTEGER NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,item_id),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(item_id) REFERENCES items(id) ON DELETE CASCADE);
 CREATE TABLE IF NOT EXISTS swaps(id INTEGER PRIMARY KEY AUTOINCREMENT,requester_id INTEGER NOT NULL,owner_id INTEGER NOT NULL,item_id INTEGER NOT NULL,offered_item_id INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(requester_id) REFERENCES users(id),FOREIGN KEY(owner_id) REFERENCES users(id),FOREIGN KEY(item_id) REFERENCES items(id),FOREIGN KEY(offered_item_id) REFERENCES items(id));
 CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,title TEXT NOT NULL,message TEXT NOT NULL,is_read INTEGER NOT NULL DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
 `);
 const count=db.prepare('SELECT COUNT(*) c FROM users').get().c;
 if(!count){
  const hash=bcrypt.hashSync('admin123',10); const user=bcrypt.hashSync('demo123',10);
  db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run('SwapCloset Admin','admin@swapcloset.local',hash,'admin');
  db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run('Aarohi Sharma','demo@swapcloset.local',user,'user');
  const demoId=db.prepare('SELECT id FROM users WHERE email=?').get('demo@swapcloset.local').id;
  const seed=[
   ['Vintage Denim Jacket','Levi\'s','Women','M','Like new','Classic oversized denim jacket with a soft worn-in finish.','Pune','/images/denim.jpg'],
   ['Wool Blend Coat','Zara','Women','S','Gently used','Warm neutral coat, perfect for winter layering.','Pune','/images/coat.jpg'],
   ['Cream Knit Sweater','H&M','Women','M','Like new','Minimal cream knit with a relaxed fit.','Mumbai','/images/knit.jpg'],
   ['Everyday Sneakers','Nike','Unisex','8','Gently used','Clean everyday sneakers with plenty of life left.','Pune','/images/sneakers.jpg'],
   ['Kids Weekend Set','Mango Kids','Kids','8Y','Like new','Comfortable two-piece set for casual days.','Pune','/images/kids.jpg'],
   ['Printed Silk Scarf','FabIndia','Accessories','Free','New with tags','Lightweight printed scarf that works all year.','Mumbai','/images/scarf.jpg']
  ];
  const ins=db.prepare('INSERT INTO items(user_id,title,brand,category,size,condition,description,location,image_url) VALUES(?,?,?,?,?,?,?,?,?)');
  seed.forEach(x=>ins.run(demoId,...x));
 }
}
init();

function tokenFor(user){return jwt.sign({id:user.id,email:user.email,role:user.role,name:user.name},JWT_SECRET,{expiresIn:'7d'});}
function auth(req,res,next){const h=req.headers.authorization||''; if(!h.startsWith('Bearer ')) return res.status(401).json({error:'Authentication required'}); try{req.user=jwt.verify(h.slice(7),JWT_SECRET); next();}catch{return res.status(401).json({error:'Session expired. Please sign in again.'});}}
function optionalAuth(req,_res,next){const h=req.headers.authorization||''; if(h.startsWith('Bearer ')){try{req.user=jwt.verify(h.slice(7),JWT_SECRET)}catch{}} next();}

app.get('/api/health',(_req,res)=>res.json({ok:true,service:'SwapCloset API',database:'SQLite'}));
app.post('/api/auth/register',(req,res)=>{const {name,email,password}=req.body||{}; if(!name||!email||!password||password.length<6)return res.status(400).json({error:'Name, email and a password of at least 6 characters are required.'}); try{const hash=bcrypt.hashSync(password,10); const info=db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run(name.trim(),email.trim().toLowerCase(),hash); const user=db.prepare('SELECT id,name,email,role,avatar,created_at FROM users WHERE id=?').get(info.lastInsertRowid); res.json({token:tokenFor(user),user});}catch(e){res.status(400).json({error:e.message.includes('UNIQUE')?'Email is already registered.':'Could not create account.'});}});
app.post('/api/auth/login',(req,res)=>{const {email,password}=req.body||{}; const user=db.prepare('SELECT * FROM users WHERE email=?').get(String(email||'').trim().toLowerCase()); if(!user||!bcrypt.compareSync(password||'',user.password_hash))return res.status(401).json({error:'Invalid email or password.'}); const safe={id:user.id,name:user.name,email:user.email,role:user.role,avatar:user.avatar,created_at:user.created_at}; res.json({token:tokenFor(safe),user:safe});});
app.get('/api/auth/me',auth,(req,res)=>{const u=db.prepare('SELECT id,name,email,role,avatar,created_at FROM users WHERE id=?').get(req.user.id); res.json({user:u});});

app.get('/api/items',optionalAuth,(req,res)=>{const {q,category,condition,size,owner,status='available'}=req.query; let sql=`SELECT i.*,u.name AS owner_name FROM items i JOIN users u ON u.id=i.user_id WHERE 1=1`; const args=[]; if(status!=='all'){sql+=' AND i.status=?';args.push(status)} if(q){sql+=' AND (i.title LIKE ? OR i.brand LIKE ? OR i.description LIKE ?)';const x='%'+q+'%';args.push(x,x,x)} if(category){sql+=' AND i.category=?';args.push(category)} if(condition){sql+=' AND i.condition=?';args.push(condition)} if(size){sql+=' AND i.size LIKE ?';args.push('%'+size+'%')} if(owner){sql+=' AND i.user_id=?';args.push(Number(owner))} sql+=' ORDER BY i.created_at DESC'; res.json({items:db.prepare(sql).all(...args)});});
app.get('/api/items/:id',optionalAuth,(req,res)=>{const item=db.prepare(`SELECT i.*,u.name owner_name FROM items i JOIN users u ON u.id=i.user_id WHERE i.id=?`).get(Number(req.params.id)); if(!item)return res.status(404).json({error:'Item not found'}); const wished=req.user?!!db.prepare('SELECT 1 FROM wishlists WHERE user_id=? AND item_id=?').get(req.user.id,item.id):false; res.json({item,wished});});
app.post('/api/items',auth,(req,res)=>{const {title,brand,category,size,condition,description,location,image_url}=req.body||{}; if(!title||!category||!size||!condition||!image_url)return res.status(400).json({error:'Please fill all required listing fields.'}); const info=db.prepare('INSERT INTO items(user_id,title,brand,category,size,condition,description,location,image_url) VALUES(?,?,?,?,?,?,?,?,?)').run(req.user.id,title,brand||'',category,size,condition,description||'',location||'',image_url); res.json({item:db.prepare('SELECT * FROM items WHERE id=?').get(info.lastInsertRowid)});});
app.patch('/api/items/:id',auth,(req,res)=>{const item=db.prepare('SELECT * FROM items WHERE id=?').get(Number(req.params.id)); if(!item||item.user_id!==req.user.id)return res.status(403).json({error:'You can only edit your own listings.'}); const fields=['title','brand','category','size','condition','description','location','image_url','status']; const data=fields.filter(k=>req.body[k]!==undefined); if(!data.length)return res.json({item}); const sql='UPDATE items SET '+data.map(k=>k+'=?').join(',')+' WHERE id=?'; db.prepare(sql).run(...data.map(k=>req.body[k]),item.id); res.json({item:db.prepare('SELECT * FROM items WHERE id=?').get(item.id)});});
app.delete('/api/items/:id',auth,(req,res)=>{const item=db.prepare('SELECT * FROM items WHERE id=?').get(Number(req.params.id)); if(!item||item.user_id!==req.user.id)return res.status(403).json({error:'You can only delete your own listings.'}); db.prepare('DELETE FROM items WHERE id=?').run(item.id); res.json({ok:true});});

app.get('/api/wishlist',auth,(req,res)=>res.json({items:db.prepare(`SELECT i.*,u.name owner_name FROM wishlists w JOIN items i ON i.id=w.item_id JOIN users u ON u.id=i.user_id WHERE w.user_id=? ORDER BY w.created_at DESC`).all(req.user.id)}));
app.post('/api/wishlist/:id',auth,(req,res)=>{const id=Number(req.params.id); try{db.prepare('INSERT INTO wishlists(user_id,item_id) VALUES(?,?)').run(req.user.id,id)}catch{} res.json({ok:true});});
app.delete('/api/wishlist/:id',auth,(req,res)=>{db.prepare('DELETE FROM wishlists WHERE user_id=? AND item_id=?').run(req.user.id,Number(req.params.id));res.json({ok:true});});

app.get('/api/swaps',auth,(req,res)=>{const rows=db.prepare(`SELECT s.*,a.title item_title,a.image_url item_image,o.title offered_title,o.image_url offered_image,ru.name requester_name,ou.name owner_name FROM swaps s JOIN items a ON a.id=s.item_id JOIN items o ON o.id=s.offered_item_id JOIN users ru ON ru.id=s.requester_id JOIN users ou ON ou.id=s.owner_id WHERE s.requester_id=? OR s.owner_id=? ORDER BY s.updated_at DESC`).all(req.user.id,req.user.id);res.json({swaps:rows});});
app.post('/api/swaps',auth,(req,res)=>{const {item_id,offered_item_id}=req.body||{}; const target=db.prepare('SELECT * FROM items WHERE id=?').get(Number(item_id)); const offered=db.prepare('SELECT * FROM items WHERE id=?').get(Number(offered_item_id)); if(!target||!offered)return res.status(404).json({error:'Listing not found.'}); if(offered.user_id!==req.user.id)return res.status(403).json({error:'You can only offer one of your own listings.'}); if(target.user_id===req.user.id)return res.status(400).json({error:'You cannot request your own listing.'}); const info=db.prepare('INSERT INTO swaps(requester_id,owner_id,item_id,offered_item_id) VALUES(?,?,?,?)').run(req.user.id,target.user_id,target.id,offered.id); db.prepare('INSERT INTO notifications(user_id,title,message) VALUES(?,?,?)').run(target.user_id,'New swap request',`${req.user.name} wants to swap for ${target.title}.`);res.json({swap:db.prepare('SELECT * FROM swaps WHERE id=?').get(info.lastInsertRowid)});});
app.patch('/api/swaps/:id',auth,(req,res)=>{const s=db.prepare('SELECT * FROM swaps WHERE id=?').get(Number(req.params.id)); if(!s||s.owner_id!==req.user.id)return res.status(403).json({error:'Only the listing owner can update this request.'}); const status=req.body.status; if(!['accepted','rejected'].includes(status))return res.status(400).json({error:'Invalid status.'}); db.prepare('UPDATE swaps SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status,s.id); db.prepare('INSERT INTO notifications(user_id,title,message) VALUES(?,?,?)').run(s.requester_id,`Swap ${status}`,`Your swap request has been ${status}.`);res.json({ok:true});});

app.get('/api/notifications',auth,(req,res)=>res.json({notifications:db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC').all(req.user.id)}));
app.patch('/api/notifications/read-all',auth,(req,res)=>{db.prepare('UPDATE notifications SET is_read=1 WHERE user_id=?').run(req.user.id);res.json({ok:true});});
app.get('/api/profile',auth,(req,res)=>res.json({user:db.prepare('SELECT id,name,email,role,avatar,created_at FROM users WHERE id=?').get(req.user.id)}));
app.patch('/api/profile',auth,(req,res)=>{const {name,avatar}=req.body||{}; db.prepare('UPDATE users SET name=COALESCE(?,name),avatar=COALESCE(?,avatar) WHERE id=?').run(name||null,avatar||null,req.user.id); const u=db.prepare('SELECT id,name,email,role,avatar,created_at FROM users WHERE id=?').get(req.user.id);res.json({user:u});});
app.get('/api/admin/stats',auth,(req,res)=>{if(req.user.role!=='admin')return res.status(403).json({error:'Admin access required.'}); res.json({stats:{users:db.prepare('SELECT COUNT(*) c FROM users').get().c,items:db.prepare('SELECT COUNT(*) c FROM items').get().c,available:db.prepare("SELECT COUNT(*) c FROM items WHERE status='available'").get().c,swaps:db.prepare('SELECT COUNT(*) c FROM swaps').get().c}});});
app.get('/api/admin/items',auth,(req,res)=>{if(req.user.role!=='admin')return res.status(403).json({error:'Admin access required.'});res.json({items:db.prepare(`SELECT i.*,u.name owner_name,u.email owner_email FROM items i JOIN users u ON u.id=i.user_id ORDER BY i.created_at DESC`).all()});});

const clientDist=path.resolve(__dirname,'../dist');
// Serve the built frontend only in production. In development Vite serves the UI on port 8081.
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDist));
  app.get('/{*splat}',(req,res)=>{if(req.path.startsWith('/api/')) return res.status(404).json({error:'API route not found'});res.sendFile(path.join(clientDist,'index.html'));});
} else {
  app.get('/{*splat}',(req,res)=>{if(req.path.startsWith('/api/')) return res.status(404).json({error:'API route not found'});res.status(404).send('Frontend is served by Vite at http://localhost:8081');});
}
app.listen(PORT,()=>console.log(`SwapCloset API running on http://localhost:${PORT}`));

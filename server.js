const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {DatabaseSync} = require('node:sqlite');

const port = Number(process.env.PORT || 8080);
const root = __dirname;
const dataDir = process.env.DATA_DIR || path.join(root, 'data');
const databaseFile = path.join(dataDir, 'beliel.sqlite');
const legacyFile = path.join(dataDir, 'leaderboard.json');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.gif':'image/gif','.svg':'image/svg+xml','.ico':'image/x-icon'};
const phrasePattern = /^[a-z]+(?: [a-z]+)+$/;
const dataKey = crypto.createHash('sha256').update(process.env.BELIEL_DATA_KEY || 'beliel-local-development-key-change-in-production').digest();
fs.mkdirSync(dataDir, {recursive:true});

// Los datos del JSON de la versión anterior no se migran deliberadamente.
// Al iniciar esta versión se elimina para que no reaparezcan usuarios antiguos.
if(fs.existsSync(legacyFile))fs.rmSync(legacyFile,{force:true});
const db = new DatabaseSync(databaseFile);
db.exec(`PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username_key TEXT NOT NULL UNIQUE,
    username_enc TEXT NOT NULL,
    score_enc TEXT NOT NULL,
    salt_enc TEXT NOT NULL,
    phrase_hash_enc TEXT NOT NULL,
    created_at TEXT NOT NULL
  );`);

function encrypt(value){const iv=crypto.randomBytes(12);const cipher=crypto.createCipheriv('aes-256-gcm',dataKey,iv);const encrypted=Buffer.concat([cipher.update(String(value),'utf8'),cipher.final()]);return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;}
function decrypt(value){const [ivText,tagText,dataText]=String(value).split('.');const decipher=crypto.createDecipheriv('aes-256-gcm',dataKey,Buffer.from(ivText,'base64url'));decipher.setAuthTag(Buffer.from(tagText,'base64url'));return Buffer.concat([decipher.update(Buffer.from(dataText,'base64url')),decipher.final()]).toString('utf8');}
function lookupKey(value){return crypto.createHmac('sha256',dataKey).update(value.toLowerCase()).digest('hex');}
function hydrate(row){return {id:row.id,key:row.username_key,username:decrypt(row.username_enc),score:Number(decrypt(row.score_enc)),salt:decrypt(row.salt_enc),phraseHash:decrypt(row.phrase_hash_enc),createdAt:row.created_at};}
function allUsers(){return db.prepare('SELECT * FROM users').all().map(hydrate);}
function findUser(username){const row=db.prepare('SELECT * FROM users WHERE username_key = ?').get(lookupKey(username));return row?hydrate(row):null;}
function writeScore(user,score){db.prepare('UPDATE users SET score_enc = ? WHERE id = ?').run(encrypt(score),user.id);user.score=score;}
function json(res,status,payload){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(payload));}
function body(req){return new Promise((resolve,reject)=>{let raw='';req.on('data',chunk=>{raw+=chunk;if(raw.length>10000)reject(new Error('Solicitud demasiado grande'));});req.on('end',()=>{try{resolve(JSON.parse(raw||'{}'));}catch{reject(new Error('JSON inválido'));}});req.on('error',reject);});}
function validUsername(value){return typeof value==='string'&&/^[A-Za-z0-9_]{3,16}$/.test(value);}
function validPhrase(value){return typeof value==='string'&&value.length>=8&&value.length<=80&&phrasePattern.test(value);}
function publicUser(user){return {username:user.username,score:user.score};}
function leaderboard(){return allUsers().sort((a,b)=>b.score-a.score||a.createdAt.localeCompare(b.createdAt)).slice(0,10).map(publicUser);}
function hashPhrase(phrase,salt){return crypto.scryptSync(phrase,salt,64,{N:16384,r:8,p:1}).toString('hex');}
function issueSession(user){const expires=Date.now()+1000*60*60*24*30;const payload=`${user.id}.${expires}`;const signature=crypto.createHmac('sha256',dataKey).update(payload).digest('base64url');return `${Buffer.from(payload).toString('base64url')}.${signature}`;}
function authenticated(req){const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');const [encoded,signature]=token.split('.');if(!encoded||!signature)return null;try{const payload=Buffer.from(encoded,'base64url').toString('utf8');const expected=crypto.createHmac('sha256',dataKey).update(payload).digest('base64url');if(signature.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null;const [userId,expires]=payload.split('.');if(!userId||Number(expires)<Date.now())return null;return allUsers().find(user=>user.id===userId)||null;}catch{return null;}}

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  try{
    if(url.pathname==='/api/leaderboard'&&req.method==='GET')return json(res,200,{totalUsers:db.prepare('SELECT COUNT(*) AS count FROM users').get().count,entries:leaderboard()});
    if(url.pathname==='/api/users/register'&&req.method==='POST'){
      const input=await body(req);const username=input.username?.trim();const phrase=input.phrase;
      if(!validUsername(username)||!validPhrase(phrase))return json(res,400,{error:'Usa un nombre válido y una frase de letras minúsculas separadas por espacios.'});
      if(findUser(username))return json(res,409,{error:'Ese nombre ya está en uso. Inicia sesión con tu frase.'});
      const salt=crypto.randomBytes(16).toString('hex');const user={id:crypto.randomUUID(),key:lookupKey(username),username,score:0,salt,phraseHash:hashPhrase(phrase,salt),createdAt:new Date().toISOString()};
      db.prepare('INSERT INTO users (id,username_key,username_enc,score_enc,salt_enc,phrase_hash_enc,created_at) VALUES (?,?,?,?,?,?,?)').run(user.id,user.key,encrypt(user.username),encrypt(user.score),encrypt(user.salt),encrypt(user.phraseHash),user.createdAt);
      return json(res,201,{created:true,token:issueSession(user),user:publicUser(user)});
    }
    if(url.pathname==='/api/users/login'&&req.method==='POST'){
      const input=await body(req);const username=input.username?.trim();const phrase=input.phrase;const user=findUser(username||'');
      if(!user||!validPhrase(phrase))return json(res,401,{error:'El nombre o la frase no coinciden.'});
      const candidate=hashPhrase(phrase,user.salt);const valid=crypto.timingSafeEqual(Buffer.from(candidate,'hex'),Buffer.from(user.phraseHash,'hex'));if(!valid)return json(res,401,{error:'El nombre o la frase no coinciden.'});
      return json(res,200,{token:issueSession(user),user:publicUser(user)});
    }
    if(url.pathname==='/api/scores'&&req.method==='POST'){
      const user=authenticated(req);if(!user)return json(res,401,{error:'Tu sesión expiró. Inicia sesión de nuevo.'});const input=await body(req);const score=Math.floor(Number(input.score));if(!Number.isFinite(score)||score<0||score>10000000)return json(res,400,{error:'Puntaje inválido.'});const updated=score>user.score;if(updated)writeScore(user,score);return json(res,200,{updated,user:publicUser(user)});
    }
    if(req.method!=='GET')return json(res,405,{error:'Método no permitido.'});
    let filePath=path.normalize(path.join(root,url.pathname==='/'?'index.html':url.pathname));if(!filePath.startsWith(root))return res.writeHead(403).end();if(!fs.existsSync(filePath)||fs.statSync(filePath).isDirectory())filePath=path.join(root,'index.html');res.writeHead(200,{'Content-Type':mime[path.extname(filePath)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'});fs.createReadStream(filePath).pipe(res);
  }catch(error){json(res,500,{error:error.message||'Error interno.'});}
});
server.listen(port,'0.0.0.0',()=>console.log(`Beliel listening on ${port}`));

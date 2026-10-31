// Servidor de testes local: serve o site e imita o Supabase (login, tabelas e funções)
// executando o SQL de verdade no PostgreSQL local, com as mesmas regras de acesso (RLS).
const http = require("http"), fs = require("fs"), path = require("path"), { spawn } = require("child_process");
const APP = path.join(__dirname, "..", "app"), DEV = __dirname, PORT = +(process.env.PORT || 8787);
const DB = ["-h", "/tmp", "-p", "54329", "-U", "postgres", "-d", process.env.DBNAME || "teste", "-At", "-q", "-v", "ON_ERROR_STOP=1"];

function psql(sql){
  return new Promise(res => {
    const p = spawn("psql", DB); let out = "", err = "";
    p.stdout.on("data", d => out += d); p.stderr.on("data", d => err += d);
    p.on("close", code => res({code, out: out.trim(), err: err.trim()}));
    p.stdin.end(sql);
  });
}
const lit = v => v === null || v === undefined ? "NULL" : typeof v === "number" ? String(v) : typeof v === "boolean" ? String(v)
  : "'" + (typeof v === "object" ? JSON.stringify(v) : String(v)).replace(/'/g, "''") + "'";
const ident = s => { if(!/^[a-z_][a-z0-9_]*$/.test(s)) throw new Error("identificador inválido: " + s); return s; };
const pre = token => token ? `set role authenticated; select set_config('request.jwt.claims', ${lit(JSON.stringify({sub: token, role: "authenticated"}))}, false) \\g /dev/null\n` : "set role anon;\n";
const erro = e => ({ error: { message: (e.match(/ERROR:\s+(.*)/) || [null, e])[1] } });

async function rest(b){
  const t = "public." + ident(b.table);
  const where = (b.filters || []).map(([c, v]) => `${ident(c)}::text = ${lit(v)}`).join(" and ");
  const W = where ? " where " + where : "";
  let sql;
  if(b.op === "select"){
    const ord = b.order ? ` order by ${ident(b.order[0])} ${b.order[1] ? "asc" : "desc"}` : "";
    const rng = b.range ? ` limit ${b.range[1] - b.range[0] + 1} offset ${b.range[0]}` : "";
    sql = `select coalesce(json_agg(t), '[]') from (select * from ${t}${W}${ord}${rng}) t;`;
  } else if(b.op === "insert"){
    const rows = Array.isArray(b.body) ? b.body : [b.body];
    const cols = [...new Set(rows.flatMap(r => Object.keys(r)))].map(ident).join(", ");
    sql = `with x as (insert into ${t} (${cols}) select ${cols} from json_populate_recordset(null::${t}, ${lit(rows)}) returning *) select coalesce(json_agg(x), '[]') from x;`;
  } else if(b.op === "update"){
    const cols = Object.keys(b.body).map(ident).join(", ");
    sql = `with x as (update ${t} set (${cols}) = (select ${cols} from json_populate_record(null::${t}, ${lit(b.body)}))${W} returning *) select coalesce(json_agg(x), '[]') from x;`;
  } else if(b.op === "delete"){
    sql = `with x as (delete from ${t}${W} returning *) select coalesce(json_agg(x), '[]') from x;`;
  } else throw new Error("op");
  if(b.op !== "select" && !b.returning) sql = sql.replace(/ returning \*\) select coalesce\(json_agg\(x\), '\[\]'\) from x;$/, ") select '[]';").replace(/^with x as \(/, "with x as (");
  const r = await psql(pre(b.token) + sql);
  return r.code ? erro(r.err) : { data: b.op !== "select" && !b.returning ? null : JSON.parse(r.out || "[]"), error: null };
}
async function rpc(b){
  const fn = ident(b.fn);
  const info = await psql(`select proretset::text || '|' || prorettype::regtype::text from pg_proc where proname = ${lit(fn)} and pronamespace = 'public'::regnamespace limit 1;`);
  if(!info.out) return { error: { message: "função não existe: " + fn } };
  const [set, tipo] = info.out.split("|");
  const args = Object.entries(b.args || {}).map(([k, v]) => `${ident(k)} => ${lit(v)}`).join(", ");
  const call = `public.${fn}(${args})`;
  const sql = set === "true" ? `select coalesce(json_agg(t), '[]') from ${call} t;` : tipo === "void" ? `select ${call} \\g /dev/null\nselect 'null';` : `select to_json(${call});`;
  const r = await psql(pre(b.token) + sql);
  return r.code ? erro(r.err) : { data: JSON.parse(r.out || "null"), error: null };
}
async function auth(b){
  const sessao = row => ({ data: { user: { id: row.id, email: row.email, user_metadata: row.raw_user_meta_data || {} }, session: { access_token: row.id, user: { id: row.id, email: row.email, user_metadata: row.raw_user_meta_data || {} } } }, error: null });
  if(b.action === "signup"){
    const r = await psql(`insert into auth.users (email, senha, raw_user_meta_data) values (lower(${lit(b.email)}), ${lit(b.password)}, ${lit(b.data || {})}) returning row_to_json(users);`);
    if(r.code) return { data: {}, error: { message: /duplicate/.test(r.err) ? "User already registered" : r.err } };
    return sessao(JSON.parse(r.out));
  }
  if(b.action === "login"){
    const r = await psql(`select row_to_json(u) from auth.users u where email = lower(${lit(b.email)}) and senha = ${lit(b.password)};`);
    if(!r.out) return { data: {}, error: { message: "Invalid login credentials" } };
    return sessao(JSON.parse(r.out));
  }
  if(b.action === "user"){
    const r = await psql(`select row_to_json(u) from auth.users u where id::text = ${lit(b.token)};`);
    return r.out ? sessao(JSON.parse(r.out)) : { data: {}, error: { message: "sessão inválida" } };
  }
  return { error: { message: "ação" } };
}
const tipos = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml" };
http.createServer(async (req, res) => {
  try{
    if(req.method === "POST" && req.url.startsWith("/fake/")){
      let body = ""; for await (const c of req) body += c; const b = JSON.parse(body || "{}");
      const out = req.url === "/fake/rest" ? await rest(b) : req.url === "/fake/rpc" ? await rpc(b) : await auth(b);
      res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify(out));
    }
    let p = decodeURIComponent(req.url.split("?")[0]);
    const base = p.startsWith("/dev/") ? DEV : APP; if(p.startsWith("/dev/")) p = p.slice(4);
    if(p === "/") p = "/index.html";
    const f = path.join(base, path.normalize(p));
    if(!f.startsWith(base) || !fs.existsSync(f)) { res.writeHead(404); return res.end("404"); }
    res.writeHead(200, { "content-type": tipos[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  }catch(e){ res.writeHead(500, { "content-type": "application/json" }); res.end(JSON.stringify({ error: { message: String(e.message || e) } })); }
}).listen(PORT, () => console.log("servidor de testes em http://localhost:" + PORT));

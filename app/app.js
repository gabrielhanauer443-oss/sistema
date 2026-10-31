"use strict";
/* ===================== constantes ===================== */
const TAXAS_PADRAO = {deb:null, cred:[3.0538,4.2421,4.943,5.6426,6.3407,7.0373,7.4931,8.1895,8.8921,9.5923,10.2898,10.9924,11.4417,12.0879,12.74,13.3899,14.0377,14.6903]};
const CATS = ["iPhone","iPad","Mac","Apple Watch","AirPods","Acessório","Outros"];
const ORIGENS = ["Indicação","Recompra","Tráfego pago","Instagram","Loja física","Outro"];
const DESP = ["Aluguel","Internet e telefone","Gestor de tráfego","Anúncios e marketing","Frete e envios","Embalagens","Contador","Impostos","Sistemas e assinaturas","Taxas bancárias","Manutenção e reparos","Outras despesas"];
const PARADO = 30;
const MSG_PADRAO = {abertura:"Olá! Segue o seu orçamento da {loja}:", cartao:"No cartão:", cartaoTroca:"No cartão (sobre a diferença):", lacrado:"Produto lacrado, com garantia total da Apple.", troca:"O valor do seu aparelho é uma estimativa e é confirmado na avaliação presencial.", fechamento:"Ficamos à disposição para qualquer dúvida.", pick:["1","10","12","18"]};
const MSG_K = ["abertura","cartao","cartaoTroca","lacrado","troca","fechamento"];

const ICON = {
  painel:'<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
  skus:'<path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  estoque:'<path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/>',
  venda:'<path d="M12 5v14M5 12h14"/>',
  vendas:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  financeiro:'<path d="M3 7h18v12H3zM3 11h18M7 15h4"/>',
  clientes:'<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7M17 4a4 4 0 010 8M22 21c0-3-2-6-5-6.5"/>',
  simulador:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h4"/>',
  ajustes:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L14 3h-4l-.5 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 000 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 002 1.2L10 21h4l.5-2.6a7 7 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/>',
  wa:'<path d="M20 12a8 8 0 01-11.8 7L4 20l1.1-4A8 8 0 1120 12z"/>',
  copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/>'
};
const ic = (k, extra="") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${ICON[k]}</svg>`;

const TODAS_VIEWS = [
  {id:"painel", nome:"Painel", custos:true},
  {id:"estoque", nome:"Estoque"},
  {id:"skus", nome:"SKUs", custos:true},
  {id:"venda", nome:"Nova venda"},
  {id:"simulador", nome:"Simulador"},
  {id:"vendas", nome:"Vendas do mês", custos:true},
  {id:"financeiro", nome:"Financeiro", custos:true},
  {id:"clientes", nome:"Clientes", sep:true},
  {id:"ajustes", nome:"Taxas", custos:true},
  {id:"loja", nome:"Minha loja", custos:true},
  {id:"admin", nome:"Lojas do sistema", admin:true, sep:true}
];
const VIEWS_VISIVEIS = () => TODAS_VIEWS.filter(v => (!v.custos || S.verCustos) && (!v.admin || S.superadmin));
const inicio = () => S.verCustos ? "painel" : "venda";

/* ===================== utilidades ===================== */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const R = n => (Number(n)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const P = n => (Number(n)||0).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1}) + "%";
const N = n => (Number(n)||0).toLocaleString("pt-BR");
const r2 = n => Math.round((Number(n)||0)*100)/100;
const parseMoney = s => { const d = String(s ?? "").replace(/\D/g,""); return d ? parseInt(d,10)/100 : 0; };
const hoje = () => { const d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
const dataBR = s => s ? s.slice(8,10)+"/"+s.slice(5,7)+"/"+s.slice(0,4) : "—";
const dias = (a, b) => a ? Math.max(0, Math.round((Date.parse((b||hoje())+"T12:00:00") - Date.parse(a+"T12:00:00"))/864e5)) : 0;
const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const mesNome = m => MESES[+m.slice(5,7)-1] + " de " + m.slice(0,4);
const mesCurto = m => MESES[+m.slice(5,7)-1].slice(0,3) + "/" + m.slice(2,4);
const mesMais = (m, k) => { let y = +m.slice(0,4), mo = +m.slice(5,7)-1+k; y += Math.floor(mo/12); mo = ((mo%12)+12)%12; return y+"-"+String(mo+1).padStart(2,"0"); };
const norm = s => String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ").trim();
const soDig = s => String(s||"").replace(/\D/g,"");
const avg = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0;
const sum = a => a.reduce((x,y)=>x+(Number(y)||0),0);
const fone = s => { const d = soDig(s); if(d.length===11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`; if(d.length===10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`; return s||""; };
const waLink = (tel, txt) => { let d = soDig(tel); if(d && d.length<=11) d = "55"+d; return "https://wa.me/"+(d||"")+"?text="+encodeURIComponent(txt||""); };
const identFmt = u => u && u.ident ? (u.tipo==="serie" ? "Série " : "IMEI ") + u.ident : "";
function cpfOk(c){ c = soDig(c); if(c.length !== 11 || /^(\d)\1+$/.test(c)) return false; for(let t = 9; t < 11; t++){ let s = 0; for(let i = 0; i < t; i++) s += +c[i]*(t+1-i); if(((s*10)%11)%10 !== +c[t]) return false; } return true; }
const cpfFmt = c => { const d = soDig(c).slice(0,11); return d.length > 9 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/,"$1.$2.$3-$4") : d.length > 6 ? d.replace(/(\d{3})(\d{3})(\d{1,3})/,"$1.$2.$3") : d.length > 3 ? d.replace(/(\d{3})(\d{1,3})/,"$1.$2") : d; };
const cepFmt = c => { const d = soDig(c).slice(0,8); return d.length > 5 ? d.slice(0,5)+"-"+d.slice(5) : d; };
const endTxt = e => { if(!e) return ""; const p1 = [e.rua, e.num].filter(Boolean).join(", "), p2 = [p1, e.comp].filter(Boolean).join(" · "); return [p2, e.bairro, [e.cidade, e.uf].filter(Boolean).join("/"), e.cep ? "CEP "+cepFmt(e.cep) : ""].filter(Boolean).join(" · "); };
const dataV = x => x.semData ? '<span class="sub" style="display:inline">sem data</span>' : dataBR(x.data);
const CAMPOS_CLI = `
  <div class="row"><div class="f"><label for="X-cpf">CPF</label><input class="in" id="X-cpf" inputmode="numeric" placeholder="000.000.000-00" autocomplete="off"><span class="hint" id="X-cpfh"></span></div>
    <div class="f"><label for="X-email">E-mail</label><input class="in" id="X-email" type="email" inputmode="email" placeholder="nome@email.com" autocomplete="off"></div></div>
  <div class="row3"><div class="f"><label for="X-cep">CEP</label><input class="in" id="X-cep" inputmode="numeric" placeholder="00000-000" autocomplete="off"></div>
    <div class="f"><label for="X-cidade">Cidade</label><input class="in" id="X-cidade" autocomplete="off"></div>
    <div class="f"><label for="X-uf">UF</label><input class="in" id="X-uf" maxlength="2" placeholder="RS" autocomplete="off" style="text-transform:uppercase"></div></div>
  <div class="f"><label for="X-rua">Rua</label><input class="in" id="X-rua" autocomplete="off"></div>
  <div class="row3"><div class="f"><label for="X-num">Número</label><input class="in" id="X-num" autocomplete="off"></div>
    <div class="f"><label for="X-comp">Complemento</label><input class="in" id="X-comp" placeholder="Apto, bloco" autocomplete="off"></div>
    <div class="f"><label for="X-bairro">Bairro</label><input class="in" id="X-bairro" autocomplete="off"></div></div>`;
const camposCli = p => CAMPOS_CLI.replace(/X-/g, p+"-");
const END_K = ["cep","rua","num","comp","bairro","cidade","uf"];
function preencherCli(p, c, soVazios){
  const set = (k, v) => { const el = $(p+"-"+k); if(el && v && (!soVazios || !el.value)) el.value = v; };
  set("cpf", c.cpf ? cpfFmt(c.cpf) : ""); set("email", c.email);
  END_K.forEach(k => set(k, c.end && (k === "cep" ? cepFmt(c.end[k]||"") : c.end[k])));
  checarCpf(p);
}
function lerCli(p){
  const v = k => ($(p+"-"+k) ? $(p+"-"+k).value.trim() : "");
  const end = {}; END_K.forEach(k => end[k] = k === "cep" ? soDig(v(k)) : k === "uf" ? v(k).toUpperCase() : v(k));
  return {cpf: soDig(v("cpf")), email: v("email").toLowerCase(), end};
}
function checarCpf(p){
  const el = $(p+"-cpf"), h = $(p+"-cpfh"); if(!el || !h) return;
  const d = soDig(el.value); h.textContent = ""; h.style.color = ""; el.classList.remove("err");
  if(d.length === 11 && !cpfOk(d)){ h.textContent = "CPF inválido. Confira os números."; h.style.color = "var(--bad)"; el.classList.add("err"); }
  else if(d.length === 11){ h.textContent = "CPF válido"; h.style.color = "var(--ok)"; }
  else if(d.length){ h.textContent = d.length+" de 11 dígitos"; }
}
function ligarCli(p, onChange){
  const cpf = $(p+"-cpf"), cep = $(p+"-cep");
  cpf.addEventListener("input", () => { cpf.value = cpfFmt(cpf.value); checarCpf(p); onChange && onChange(); });
  cep.addEventListener("input", () => { cep.value = cepFmt(cep.value); });
  [p+"-email",p+"-cidade",p+"-uf",p+"-rua",p+"-num",p+"-comp",p+"-bairro"].forEach(i => $(i).addEventListener("input", () => onChange && onChange()));
}
const cliValido = p => { const d = soDig(($(p+"-cpf")||{}).value); const em = (($(p+"-email")||{}).value||"").trim();
  if(d && (d.length !== 11 || !cpfOk(d))) return "CPF inválido. Confira os números ou deixe em branco.";
  if(em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return "E-mail inválido.";
  return ""; };
function luhn(s){ let t=0; for(let i=0;i<s.length;i++){ let d=+s[s.length-1-i]; if(i%2){ d*=2; if(d>9) d-=9; } t+=d; } return t%10===0; }

function maskMoney(el, cb){
  el.addEventListener("input", () => { el.value = el.value ? R(parseMoney(el.value)) : ""; cb && cb(); });
  el.addEventListener("focus", () => { const v0 = el.value; if(v0) setTimeout(() => { try{ if(document.activeElement === el && el.value === v0) el.select(); }catch(e){} }, 0); });
}
let toastT;
function toast(t){ const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 2600); }
async function copiar(txt, el){
  try{ await navigator.clipboard.writeText(txt); toast("Copiado"); }
  catch(e){ if(el){ el.focus(); el.select && el.select(); } toast("Texto selecionado. Use Ctrl+C para copiar."); }
}

/* ===================== estado e nuvem ===================== */
const S = {skus:{}, un:[], vendas:[], lanc:[], cli:[], membros:[], convites:[], taxas:{deb:TAXAS_PADRAO.deb, cred:TAXAS_PADRAO.cred.slice()}, msg:JSON.parse(JSON.stringify(MSG_PADRAO)), loaded:{}, mes:hoje().slice(0,7), view:"painel",
  user:null, empresas:[], emp:null, papel:"", verCustos:false, superadmin:false};
let sb = null, online = false, recarregando = null;

function setConn(state, txt){
  ["dot","dot2"].forEach(i => { const d = $(i); if(d) d.className = "dot " + state; });
  const c = $("conn"); if(c) c.textContent = txt;
}
const msgErro = e => {
  const m = (e && (e.message || e.error_description || e.msg)) || "";
  if(/fetch|network|Failed to fetch/i.test(m)) return "Sem conexão com a internet. Tente de novo.";
  if(/row-level security|permission denied|violates row-level/i.test(m)) return "Você não tem permissão para isso, ou o período de teste acabou.";
  if(/duplicate key|unique/i.test(m)) return "Já existe um registro igual.";
  return m ? m.replace(/^ERROR:\s*/,"") : "Não consegui salvar agora. Tente de novo em instantes.";
};
function erroNuvem(e){ toast(msgErro(e)); }
function precisaNuvem(){
  if(!online){ toast("Sem conexão. Verifique a internet."); return false; }
  if(!liberada()){ toast("O período de teste acabou. Fale com a gente para ativar a assinatura."); return false; }
  return true;
}
const liberada = () => { const e = S.emp; if(!e) return false; const agora = Date.now();
  return (e.status === "ativa" && (!e.pago_ate || Date.parse(e.pago_ate) > agora)) || (e.status === "teste" && Date.parse(e.teste_ate) > agora); };
const diasRestantes = () => S.emp ? Math.ceil((Date.parse(S.emp.teste_ate) - Date.now()) / 864e5) : 0;

/* chamadas ao banco: {data, error} vira valor ou exceção */
async function q(p){ const r = await p; if(r.error) throw r.error; return r.data; }
const rpc = (fn, args) => q(sb.rpc(fn, args || {}));
async function todos(tabela, extra){
  const out = []; const passo = 1000;
  for(let de = 0; ; de += passo){
    let b = sb.from(tabela).select("*").eq("empresa_id", S.emp.id);
    if(extra) b = extra(b);
    const lote = await q(b.range(de, de + passo - 1));
    out.push(...lote); if(lote.length < passo) break;
  }
  return out;
}
const num = v => v == null ? 0 : Number(v);

async function carregar(){
  const custos = S.verCustos;
  const [skus, un, ucusto, cli, vendas, itens, icusto, vfin, lanc, cfg, membros, convites] = await Promise.all([
    todos("skus"), todos("unidades"), custos ? todos("unidades_custo") : [], todos("clientes"),
    todos("vendas"), todos("venda_itens"), custos ? todos("venda_itens_custo") : [], custos ? todos("vendas_fin") : [],
    custos ? todos("lancamentos") : [], q(sb.from("config").select("*").eq("empresa_id", S.emp.id)),
    todos("membros"), custos ? q(sb.from("convites").select("*").eq("empresa_id", S.emp.id)) : []
  ]);
  const cMap = {}; ucusto.forEach(c => cMap[c.unidade_id] = num(c.custo));
  const icMap = {}; icusto.forEach(c => icMap[c.item_id] = num(c.custo));
  const fMap = {}; vfin.forEach(f => fMap[f.venda_id] = f);
  const porVenda = {}; itens.sort((a,b) => a.ordem - b.ordem).forEach(i => (porVenda[i.venda_id] = porVenda[i.venda_id] || []).push(i));
  S.skus = {}; skus.forEach(s => S.skus[s.id] = {id: s.id, cod: s.cod, nome: s.nome, cat: s.cat});
  S.un = un.map(u => ({id: u.id, sku: u.sku_id, tipo: u.tipo, ident: u.ident || "", custo: custos ? (cMap[u.id] ?? 0) : null, entrada: u.entrada, cond: u.cond, bateria: u.bateria || "", obs: u.obs || "",
    status: u.status, origem: u.origem, trocaDe: u.troca_de || "", venda: u.venda_id, criado: u.criado_em}));
  S.cli = cli.map(c => ({id: c.id, nome: c.nome, fone: c.fone || "", nasc: c.nasc || "", cpf: c.cpf || "", email: c.email || "", end: c.endereco || null}))
    .sort((x,y) => norm(x.nome).localeCompare(norm(y.nome)));
  S.vendas = vendas.map(v => { const f = fMap[v.id]; const cl = v.cliente || {};
    return {id: v.id, data: v.data, mes: v.data.slice(0,7), semData: v.sem_data, cliente: {...cl, id: v.cliente_id || "", nome: cl.nome || "Cliente não informado", fone: cl.fone || "", cpf: cl.cpf || "", email: cl.email || "", end: cl.end || null},
      vendedor: v.vendedor || "", origem: v.origem || "", forma: v.forma, parcelas: v.parcelas, modo: v.modo, taxaPct: num(v.taxa_pct),
      itens: (porVenda[v.id] || []).map(i => ({id: i.id, brinde: !!i.brinde, u: i.unidade_id, sku: i.sku_id, nome: i.nome, tipo: i.tipo, ident: i.ident || "", cond: i.cond, preco: num(i.preco), custo: custos ? (icMap[i.id] ?? 0) : null})),
      troca: v.troca ? {...v.troca, valor: num(v.troca.valor)} : null,
      aPagar: num(v.a_pagar), clientePaga: num(v.cliente_paga), recebido: num(v.recebido), receita: num(v.receita),
      cmv: f ? num(f.cmv) : 0, taxaValor: f ? num(f.taxa_valor) : 0, lucro: f ? num(f.lucro) : 0, obs: v.obs || "", criado: v.criado_em}; })
    .sort((x,y) => (y.data + y.criado).localeCompare(x.data + x.criado));
  S.lanc = lanc.map(l => ({id: l.id, tipo: l.tipo, data: l.data, mes: l.data.slice(0,7), semData: l.sem_data, valor: num(l.valor), cat: l.cat || "", pessoa: l.pessoa || "", desc: l.descr || "", fixa: l.fixa}))
    .sort((x,y) => (y.data||"").localeCompare(x.data||""));
  const c = cfg[0];
  if(c){
    if(c.taxas && Array.isArray(c.taxas.cred) && c.taxas.cred.length === 18) S.taxas = {deb: c.taxas.deb ?? null, cred: c.taxas.cred.map(Number)};
    const m = JSON.parse(JSON.stringify(MSG_PADRAO)), d = c.mensagem || {};
    MSG_K.forEach(k => { if(typeof d[k] === "string") m[k] = d[k]; }); if(Array.isArray(d.pick)) m.pick = d.pick.map(String);
    S.msg = m; if(!SIM.valor && !SIM.mexeuPick) SIM.pick = new Set(m.pick);
  }
  S.membros = membros; S.convites = convites.filter(c => !c.aceito_em);
  ["taxas","mensagem","skus","unidades","vendas","lancamentos","clientes"].forEach(k => S.loaded[k] = 1);
}
async function recarregar(){
  if(recarregando) return recarregando;
  recarregando = (async () => {
    try{ await carregar(); online = true; setConn("on", "Conectado · " + (S.emp ? S.emp.nome : "")); }
    catch(e){ online = false; setConn("off", "Sem conexão. " + msgErro(e)); }
    finally{ recarregando = null; refresh(); }
  })();
  return recarregando;
}
/* depois de gravar: atualiza os dados e a tela */
async function feito(t){ await recarregar(); if(t) toast(t); }
const carregado = () => ["skus","unidades","vendas","lancamentos","clientes"].every(k => S.loaded[k]);

/* ===================== cálculos ===================== */
const skuNome = id => (S.skus[id] && S.skus[id].nome) || "Produto removido";
const skuCod = id => (S.skus[id] && S.skus[id].cod) ? "SKU " + S.skus[id].cod : "";
const itNome = it => (it && it.sku && S.skus[it.sku] && S.skus[it.sku].nome) || (it && it.nome) || "";
const proxCod = () => Object.values(S.skus).reduce((m,s) => Math.max(m, Number(s.cod)||0), 0) + 1;
const skuBusca = id => norm(skuNome(id) + " " + skuCod(id) + " sku" + ((S.skus[id]||{}).cod||""));
const emEstoque = () => S.un.filter(u => u.status === "estoque");
function skuPorNome(nome){ const n = norm(nome); return Object.values(S.skus).find(s => norm(s.nome) === n); }
async function garantirSku(nome, cat, cod){
  const ex = skuPorNome(nome); if(ex) return ex.id;
  if(cod && Object.values(S.skus).some(s => Number(s.cod) === Number(cod))) throw new Error("O SKU " + cod + " já existe com outro nome.");
  const r = await q(sb.from("skus").insert({empresa_id: S.emp.id, nome: nome.trim().replace(/\s+/g," "), cat: cat || "Outros", ...(cod ? {cod} : {})}).select());
  const s = r[0]; S.skus[s.id] = {id: s.id, cod: s.cod, nome: s.nome, cat: s.cat};
  return s.id;
}
const valorEstoque = () => sum([...new Set(emEstoque().map(u => u.sku))].map(k => statsSku(k).totalEst));
function custosSku(id){
  const todos = S.un.filter(u => u.sku === id).map(u => Number(u.custo)||0);
  S.vendas.forEach(v => (v.itens||[]).forEach(it => { if(!it.u && it.sku === id) todos.push(Number(it.custo)||0); }));
  return todos;
}
/* Custo médio ponderado: quem sai do estoque leva o custo médio do momento da venda,
   então a média dos que ficam não muda. Valor em estoque = tudo que entrou − custo já baixado nas vendas. */
function statsSku(id){
  const todas = S.un.filter(u => u.sku === id), est = todas.filter(u => u.status === "estoque");
  const ids = new Set(todas.map(u => u.id));
  let baixado = 0;
  S.vendas.forEach(v => (v.itens||[]).forEach(it => { if(it.u && ids.has(it.u)) baixado += Number(it.custo)||0; }));
  const valorEst = est.length ? Math.max(0, sum(todas.map(u => u.custo)) - baixado) : 0;
  const cE = est.map(u => Number(u.custo)||0), cH = custosSku(id);
  const maisAntigo = est.reduce((m,u) => Math.max(m, dias(u.entrada)), 0);
  const ultimo = S.un.filter(u => u.sku === id).sort((a,b) => (b.entrada||"").localeCompare(a.entrada||""))[0];
  return {qtd: est.length, est, medioEst: est.length ? valorEst/est.length : 0, medioHist: avg(cH), nHist: cH.length, min: cE.length ? Math.min(...cE) : 0, max: cE.length ? Math.max(...cE) : 0, maisAntigo, totalEst: valorEst, ultimoCusto: ultimo ? Number(ultimo.custo)||0 : 0};
}
function taxaDe(forma, parc){
  if(forma === "debito") return S.taxas.deb ?? 0;
  if(forma === "credito") return S.taxas.cred[(parc||1)-1] ?? 0;
  return 0;
}
/* pagamento: aPagar = itens − troca */
function calcPag(aPagar, forma, parc, modo){
  const t = taxaDe(forma, parc) / 100;
  if(!aPagar || !t) return {taxaPct: t*100, clientePaga: aPagar, recebido: aPagar, taxaValor: 0};
  if(modo === "repassa"){ const cp = r2(aPagar/(1-t)); return {taxaPct: t*100, clientePaga: cp, recebido: aPagar, taxaValor: 0, taxaCliente: r2(cp - aPagar)}; }
  const rec = r2(aPagar*(1-t)); return {taxaPct: t*100, clientePaga: aPagar, recebido: rec, taxaValor: r2(aPagar - rec)};
}
function dre(m){
  const vs = S.vendas.filter(v => v.mes === m);
  const receita = sum(vs.map(v => v.receita)), cmv = sum(vs.map(v => v.cmv)), taxas = sum(vs.map(v => v.taxaValor));
  const ls = S.lanc.filter(l => l.mes === m);
  const desp = {}, pro = {}; let entradas = 0;
  ls.forEach(l => {
    const v = Number(l.valor)||0;
    if(l.tipo === "despesa") desp[l.cat||"Outras despesas"] = (desp[l.cat||"Outras despesas"]||0) + v;
    else if(l.tipo === "prolabore") pro[l.pessoa||"Sócio"] = (pro[l.pessoa||"Sócio"]||0) + v;
    else entradas += v;
  });
  const totDesp = sum(Object.values(desp)), totPro = sum(Object.values(pro));
  const bruto = receita - cmv - taxas;
  const itens = sum(vs.map(v => (v.itens||[]).filter(i => !i.brinde).length));
  return {vs, ls, receita, cmv, taxas, bruto, desp, pro, totDesp, totPro, entradas, itens, resultado: bruto + entradas - totDesp - totPro, margem: receita ? bruto/receita*100 : 0};
}
const formaNome = v => v.forma === "nao_informado" ? "Não informado" : v.forma === "credito" ? `Crédito ${v.parcelas}x` : v.forma === "debito" ? "Débito" : v.forma === "dinheiro" ? "Dinheiro" : "Pix";

/* ===================== navegação ===================== */
function navHtml(){
  const parados = emEstoque().filter(u => dias(u.entrada) >= PARADO).length;
  return VIEWS_VISIVEIS().map(v => (v.sep ? '<div class="sep" role="separator"></div>' : "") +
    `<a class="nav" href="#${v.id}" data-go="${v.id}" ${S.view===v.id ? 'aria-current="page"' : ""}>${ic(v.id)}<span>${v.nome}</span>${v.id==="estoque" && parados ? `<span class="badge" title="Parados há ${PARADO}+ dias">${parados}</span>` : ""}</a>`).join("");
}
function renderNav(){
  $("nav").innerHTML = navHtml();
  $("mobnav").innerHTML = VIEWS_VISIVEIS().filter(v => !v.admin).map(v => `<a class="nav" href="#${v.id}" data-go="${v.id}" ${S.view===v.id ? 'aria-current="page"' : ""}>${ic(v.id)}<span>${v.nome.replace("Vendas do mês","Mês").replace("Nova venda","Vender").replace("Simulador","Simular").replace("Minha loja","Loja")}</span></a>`).join("");
}
function go(id, keep){
  if(!V[id] || !VIEWS_VISIVEIS().some(v => v.id === id)) id = inicio();
  S.view = id;
  if(location.hash !== "#"+id){ try{ history.replaceState(null,"","#"+id); }catch(e){ location.hash = id; } }
  renderNav();
  $("view").innerHTML = V[id].mount();
  V[id].bind && V[id].bind();
  V[id].update && V[id].update();
  if(!keep) window.scrollTo(0,0);
}
function refresh(){
  renderNav();
  const v = V[S.view]; if(v && v.update) v.update();
}
window.addEventListener("hashchange", () => { const h = location.hash.slice(1); if(h && h !== S.view) go(h); });
document.addEventListener("click", e => {
  const a = e.target.closest("[data-go]");
  if(a){ e.preventDefault(); go(a.dataset.go); }
});

const loadingRow = (cols, txt="Carregando…") => `<tr><td colspan="${cols}" class="empty">${txt}</td></tr>`;
function monthBar(){
  const y = S.mes.slice(0,4), atual = hoje().slice(0,7);
  const tem = new Set([...S.vendas.map(v => v.mes), ...S.lanc.map(l => l.mes)]);
  return `<div class="monthnav"><button type="button" data-ano="-1" aria-label="Ano anterior">‹</button><b>${y}</b><button type="button" data-ano="1" aria-label="Próximo ano">›</button></div>
    <div class="mtabs" role="group" aria-label="Mês">${MESES.map((n,i) => { const m = y+"-"+String(i+1).padStart(2,"0");
      return `<button type="button" class="mtab" data-m="${m}" aria-pressed="${m===S.mes}" ${m===atual?'aria-label="'+n+' (mês atual)"':""}>${n.slice(0,3)}${tem.has(m) ? '<i aria-hidden="true"></i>' : ""}</button>`; }).join("")}</div>`;
}
const monthNav = () => `<div class="months" id="mbar">${monthBar()}</div>`;
function bindMonth(){
  const el = $("mbar"); if(!el) return;
  el.querySelectorAll("[data-ano]").forEach(b => b.onclick = () => { S.mes = (+S.mes.slice(0,4) + +b.dataset.ano) + S.mes.slice(4); go(S.view, true); });
  el.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { S.mes = b.dataset.m; go(S.view, true); });
  const sel = el.querySelector('[aria-pressed="true"]'); if(sel && sel.scrollIntoView) try{ sel.scrollIntoView({block:"nearest", inline:"center"}); }catch(e){}
}
function refreshMonth(){ const el = $("mbar"); if(el){ el.innerHTML = monthBar(); bindMonth(); } }

/* ===================== modal ===================== */
function abrirModal(titulo, corpo, rodape, onOpen){
  const d = $("modal");
  d.innerHTML = `<div class="mh"><h2>${titulo}</h2><button class="x" type="button" data-close aria-label="Fechar">×</button></div><div class="mb">${corpo}</div>${rodape ? `<div class="mf">${rodape}</div>` : ""}`;
  d.querySelectorAll("[data-close]").forEach(b => b.onclick = () => d.close());
  try{ d.showModal(); }catch(e){ d.setAttribute("open",""); }
  onOpen && onOpen(d);
}
const fecharModal = () => { const d = $("modal"); try{ d.close(); }catch(e){ d.removeAttribute("open"); } };
/* confirmação em dois toques, sem diálogos do navegador */
function confirmar(btn, texto, fn){
  if(btn.dataset.armed){ fn(); return; }
  const orig = btn.innerHTML; btn.dataset.armed = "1"; btn.innerHTML = texto;
  setTimeout(() => { if(btn.isConnected){ btn.innerHTML = orig; delete btn.dataset.armed; } }, 3500);
}

/* ===================== telas ===================== */
const V = {};

/* ---------- PAINEL ---------- */
V.painel = {
  mount(){
    const h = new Date().getHours(), saud = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
    return `<div class="head"><div><h1>${saud}</h1><p>${mesNome(hoje().slice(0,7))} · resumo do mês até hoje</p></div>
      <div class="acts"><button class="btn btn-ghost" type="button" id="p-ent">+ Entrada no estoque</button><a class="btn btn-gold" href="#venda" data-go="venda">+ Nova venda</a></div></div>
      <div class="kpis" id="p-kpis"></div>
      <div class="grid2b">
        <div class="card"><div class="card-h"><h2>Precisa de atenção</h2></div><div class="att" id="p-att"><div class="empty">Carregando…</div></div></div>
        <div class="card"><div class="card-h"><h2>Últimos 6 meses</h2><p>resultado já sem despesas e pró-labore</p></div><div class="tw"><table><thead><tr><th>Mês</th><th class="r">Vendido</th><th class="r">Lucro bruto</th><th class="r">Resultado</th></tr></thead><tbody id="p-meses">${loadingRow(4)}</tbody></table></div></div>
      </div>
      <div class="card"><div class="card-h"><h2>Últimas vendas</h2><a class="link" href="#vendas" data-go="vendas">Ver vendas do mês →</a></div><div class="tw"><table><thead><tr><th>Data</th><th>Cliente</th><th>Itens</th><th>Pagamento</th><th class="r">Valor</th><th class="r">Lucro</th></tr></thead><tbody id="p-ult">${loadingRow(6)}</tbody></table></div></div>`;
  },
  bind(){ $("p-ent").onclick = () => modalEntrada(); },
  update(){
    const m = hoje().slice(0,7), d = dre(m), est = emEstoque();
    const parados = est.filter(u => dias(u.entrada) >= PARADO);
    $("p-kpis").innerHTML = `
      <div class="kpi"><small>Vendido no mês</small><b>${R(d.receita)}</b><span>${N(d.itens)} ${d.itens===1?"item":"itens"} em ${N(d.vs.length)} ${d.vs.length===1?"venda":"vendas"}</span></div>
      <div class="kpi hl"><small>Lucro bruto no mês</small><b>${R(d.bruto)}</b><span>margem ${P(d.margem)} · já sem custo e taxas</span></div>
      <div class="kpi"><small>Resultado do mês</small><b class="${d.resultado<0?"neg":""}">${R(d.resultado)}</b><span>depois de despesas e pró-labore</span></div>
      <div class="kpi"><small>Em estoque</small><b>${N(est.length)} ${est.length===1?"aparelho":"aparelhos"}</b><span>${R(valorEstoque())} em custo${parados.length ? ` · <b style="display:inline;font:inherit;color:var(--warn)">${parados.length} parado${parados.length>1?"s":""}</b>` : ""}</span></div>`;
    if(!carregado()) return;
    let rows = "";
    for(let k = 5; k >= 0; k--){
      const mm = mesMais(m, -k), x = dre(mm);
      rows += `<tr><td class="nw">${mesCurto(mm).replace(/^./,c=>c.toUpperCase())}${k===0?' <span class="tag t-lac">atual</span>':""}</td><td class="r">${R(x.receita)}</td><td class="r">${R(x.bruto)}</td><td class="r"><b class="${x.resultado<0?"neg":""}">${R(x.resultado)}</b></td></tr>`;
    }
    $("p-meses").innerHTML = rows;
    const att = [];
    parados.sort((a,b) => dias(b.entrada) - dias(a.entrada)).slice(0,5).forEach(u => att.push(`<div class="it"><div><b>${esc(skuNome(u.sku))}</b><span class="sub">${esc(identFmt(u))} · custo ${R(u.custo)}</span></div><span class="tag t-warn">${dias(u.entrada)} dias parado</span></div>`));
    const prox = aniversariantes(7);
    prox.forEach(({c, em}) => att.push(`<div class="it"><div><b>Aniversário · ${esc(c.nome)}</b><span class="sub">${em===0 ? "hoje" : em===1 ? "amanhã" : "em "+em+" dias"}</span></div>${c.fone ? `<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${waLink(c.fone, `Olá, ${c.nome.split(" ")[0]}! A equipe da ${S.emp ? S.emp.nome : "nossa loja"} deseja um feliz aniversário. Que seja um ano incrível!`)}">Parabenizar</a>` : `<span class="tag t-ok">sem WhatsApp</span>`}</div>`));
    if(!S.lanc.some(l => l.mes === m) && S.lanc.some(l => l.mes === mesMais(m,-1) && l.fixa)) att.push(`<div class="it"><div><b>Despesas fixas de ${mesNome(m)}</b><span class="sub">Ainda não lançadas este mês</span></div><a class="btn btn-ghost btn-sm" href="#financeiro" data-go="financeiro">Lançar</a></div>`);
    if(!S.un.length) att.push(`<div class="empty"><b>Comece pelo estoque</b>Cadastre seus aparelhos com IMEI ou número de série e o custo de cada um.</div>`);
    $("p-att").innerHTML = att.length ? att.join("") : `<div class="empty"><b>Tudo em dia</b>Nenhum aparelho parado há mais de ${PARADO} dias e nenhum aniversário nos próximos 7 dias.</div>`;
    const ult = S.vendas.slice(0,6);
    $("p-ult").innerHTML = ult.length ? ult.map(v => `<tr class="click" data-recibo="${v.id}"><td class="nw">${dataV(v)}</td><td>${esc(v.cliente && v.cliente.nome || "—")}</td><td>${esc((v.itens||[]).map(itNome).join(", "))}</td><td class="nw">${formaNome(v)}${v.troca ? " + troca" : ""}</td><td class="r nw">${R(v.receita)}</td><td class="r nw"><b>${R(v.lucro)}</b></td></tr>`).join("")
      : `<tr><td colspan="6" class="empty"><b>Nenhuma venda ainda</b>As vendas registradas em Nova venda aparecem aqui.</td></tr>`;
    $("p-ult").querySelectorAll("[data-recibo]").forEach(tr => tr.onclick = () => modalRecibo(tr.dataset.recibo));
  }
};
function aniversariantes(janela){
  const out = [], t = new Date(); t.setHours(12,0,0,0);
  S.cli.forEach(c => {
    if(!c.nasc || !/^\d{2}\/\d{2}/.test(c.nasc)) return;
    const dd = +c.nasc.slice(0,2), mm = +c.nasc.slice(3,5);
    let a = new Date(t.getFullYear(), mm-1, dd, 12); if(a < t && (t - a) > 864e5/2) a = new Date(t.getFullYear()+1, mm-1, dd, 12);
    const em = Math.round((a - t)/864e5);
    if(em >= 0 && em <= janela) out.push({c, em});
  });
  return out.sort((a,b) => a.em - b.em);
}

/* ---------- ESTOQUE ---------- */
const EST = {q:"", cat:"", parados:false, modo:"sku", abertos:new Set()};
V.estoque = {
  mount(){
    return `<div class="head"><div><h1>Estoque</h1><p id="e-res">Carregando…</p></div><div class="acts">${S.verCustos ? `<button class="btn btn-gold" type="button" id="e-ent">+ Entrada no estoque</button>` : ""}</div></div>
      <div class="bar"><input class="search" id="e-q" type="search" placeholder="Buscar modelo, IMEI ou número de série" value="${esc(EST.q)}" aria-label="Buscar no estoque">
        <div class="seg" role="group" aria-label="Visualização"><button type="button" data-modo="sku" aria-pressed="${EST.modo==="sku"}">Por produto</button><button type="button" data-modo="un" aria-pressed="${EST.modo==="un"}">Por aparelho</button></div></div>
      <div class="bar" id="e-chips"></div>
      <div class="card"><div class="tw" id="e-tab"><div class="empty">Carregando…</div></div></div>
      ${S.verCustos ? `<p class="sub">Custo médio em estoque: média ponderada dos aparelhos que estão na loja agora. Custo médio histórico: média de todos que já entraram, vendidos ou não.</p>` : ""}`;
  },
  bind(){
    if($("e-ent")) $("e-ent").onclick = () => modalEntrada();
    $("e-q").oninput = e => { EST.q = e.target.value; this.update(); };
    document.querySelectorAll("[data-modo]").forEach(b => b.onclick = () => { EST.modo = b.dataset.modo; document.querySelectorAll("[data-modo]").forEach(x => x.setAttribute("aria-pressed", x===b)); this.update(); });
  },
  update(){
    const est = emEstoque();
    $("e-res").textContent = carregado() ? `${N(est.length)} ${est.length===1?"aparelho":"aparelhos"}${S.verCustos ? " · " + R(valorEstoque()) + " em custo" : ""}` : "Carregando…";
    const cats = [...new Set(est.map(u => (S.skus[u.sku]||{}).cat || "Outros"))].sort((a,b) => CATS.indexOf(a) - CATS.indexOf(b));
    const nPar = est.filter(u => dias(u.entrada) >= PARADO).length;
    $("e-chips").innerHTML = `<button class="chip" type="button" data-cat="" aria-pressed="${!EST.cat && !EST.parados}">Todos ${est.length}</button>` +
      cats.map(c => `<button class="chip" type="button" data-cat="${esc(c)}" aria-pressed="${EST.cat===c}">${esc(c)} ${est.filter(u => ((S.skus[u.sku]||{}).cat||"Outros")===c).length}</button>`).join("") +
      (nPar ? `<button class="chip" type="button" data-par aria-pressed="${EST.parados}">Parados há ${PARADO}+ dias ${nPar}</button>` : "");
    $("e-chips").querySelectorAll("[data-cat]").forEach(b => b.onclick = () => { EST.cat = b.dataset.cat; EST.parados = false; this.update(); });
    const bp = $("e-chips").querySelector("[data-par]"); if(bp) bp.onclick = () => { EST.parados = !EST.parados; EST.cat = ""; this.update(); };
    if(!carregado()) return;
    const q = norm(EST.q), qd = soDig(EST.q);
    let lista = est.filter(u => {
      const s = S.skus[u.sku] || {};
      if(EST.cat && (s.cat||"Outros") !== EST.cat) return false;
      if(EST.parados && dias(u.entrada) < PARADO) return false;
      if(!q) return true;
      return skuBusca(u.sku).includes(q) || norm(u.ident).includes(q) || (qd.length >= 4 && soDig(u.ident).includes(qd));
    });
    if(!S.un.length){
      $("e-tab").innerHTML = S.verCustos ? `<div class="empty"><b>Seu estoque está vazio</b>Crie seus produtos em SKUs e use “+ Entrada” para lançar o custo de cada compra.<br><br><button class="btn btn-gold" type="button" onclick="modalEntrada()">+ Primeira entrada</button></div>` : `<div class="empty"><b>Estoque vazio</b>Quando o dono der entrada nos aparelhos, eles aparecem aqui.</div>`; return;
    }
    if(!lista.length){ $("e-tab").innerHTML = `<div class="empty"><b>Nada encontrado</b>Nenhum aparelho em estoque com esse filtro.</div>`; return; }
    if(EST.modo === "un"){
      lista.sort((a,b) => dias(b.entrada) - dias(a.entrada));
      $("e-tab").innerHTML = `<table><thead><tr><th>Aparelho</th><th>Identificação</th><th>Condição</th>${S.verCustos ? '<th class="r">Custo</th>' : ""}<th>Entrada</th><th class="r">No estoque</th><th></th></tr></thead><tbody>` +
        lista.map(u => linhaUn(u, true)).join("") + `</tbody></table>`;
    } else {
      const grupos = {};
      lista.forEach(u => (grupos[u.sku] = grupos[u.sku] || []).push(u));
      const ids = Object.keys(grupos).sort((a,b) => norm(skuNome(a)).localeCompare(norm(skuNome(b))));
      $("e-tab").innerHTML = `<table><thead><tr><th>Produto</th><th class="r">Em estoque</th>${S.verCustos ? '<th class="r">Custo médio em estoque</th><th class="r">Faixa de custo</th><th class="r">Custo médio histórico</th>' : ""}<th class="r">Mais antigo</th></tr></thead><tbody>` +
        ids.map(id => {
          const st = statsSku(id), aberto = EST.abertos.has(id) || !!q;
          return `<tr class="click" data-sku="${id}"><td><b>${aberto?"▾":"▸"} ${esc(skuNome(id))}</b><span class="sub">${esc([skuCod(id), (S.skus[id]||{}).cat].filter(Boolean).join(" · "))}${S.verCustos === false ? "" : ` · <span class="link" role="button" tabindex="0" data-esku="${id}" style="font-size:12px">editar SKU</span>`}</span></td><td class="r"><b>${st.qtd}</b></td>${S.verCustos ? `<td class="r"><b>${R(st.medioEst)}</b></td><td class="r nw">${st.min===st.max ? "—" : R(st.min)+" a "+R(st.max)}</td><td class="r">${R(st.medioHist)}<span class="sub">${st.nHist} ${st.nHist===1?"aparelho":"aparelhos"}</span></td>` : ""}<td class="r">${st.maisAntigo>=PARADO ? `<span class="tag t-warn">${st.maisAntigo} dias</span>` : st.maisAntigo+" dias"}</td></tr>` +
            (aberto ? grupos[id].sort((a,b) => dias(b.entrada)-dias(a.entrada)).map(u => linhaUn(u, false)).join("") : "");
        }).join("") + `</tbody></table>`;
      $("e-tab").querySelectorAll("[data-sku]").forEach(tr => tr.onclick = () => { const id = tr.dataset.sku; EST.abertos.has(id) ? EST.abertos.delete(id) : EST.abertos.add(id); this.update(); });
    }
    $("e-tab").querySelectorAll("[data-edit]").forEach(b => b.onclick = e => { e.stopPropagation(); modalEditarUn(b.dataset.edit); });
    $("e-tab").querySelectorAll("[data-esku]").forEach(b => b.onclick = e => { e.stopPropagation(); modalSku(b.dataset.esku); });
  }
};
function linhaUn(u, comNome){
  const d = dias(u.entrada);
  return `<tr ${comNome ? "" : 'style="background:var(--sunk)"'}><td>${comNome ? `<b>${esc(skuNome(u.sku))}</b>` : `<span style="padding-left:18px" class="sub">↳ aparelho</span>`}${u.origem==="troca" ? `<span class="sub">Troca${u.trocaDe ? " · "+esc(u.trocaDe) : ""}</span>` : ""}</td>
    <td class="mono nw">${esc(identFmt(u) || "—")}</td><td>${u.cond==="seminovo" ? `<span class="tag t-semi">Seminovo${u.bateria ? " · "+esc(u.bateria)+"%" : ""}</span>` : `<span class="tag t-lac">Lacrado</span>`}</td>
    ${S.verCustos ? `<td class="r nw"><b>${R(u.custo)}</b></td>` : ""}<td class="nw">${dataBR(u.entrada)}</td><td class="r nw">${d>=PARADO ? `<span class="tag t-warn">${d} dias</span>` : d+" dias"}</td>
    <td class="r">${S.verCustos ? `<button class="btn btn-ghost btn-sm" type="button" data-edit="${u.id}">Editar</button>` : ""}</td></tr>`;
}
function camposAparelho(p, u){
  u = u || {};
  const tipo = u.tipo || "imei";
  const sAtual = u.sku && S.skus[u.sku];
  return `<div class="f"><div class="rowsku"><div class="f"><label for="${p}-cod">SKU</label><input class="in" id="${p}-cod" inputmode="numeric" list="${p}-cods" placeholder="${proxCod()}" value="${sAtual && sAtual.cod ? esc(sAtual.cod) : ""}" autocomplete="off"><datalist id="${p}-cods">${Object.values(S.skus).filter(s => s.cod).sort((a,b) => a.cod - b.cod).map(s => `<option value="${esc(s.cod)}">${esc(s.nome)}</option>`).join("")}</datalist></div>
      <div class="f"><label for="${p}-sku">Nome do produto</label><input class="in" id="${p}-sku" list="${p}-skus" placeholder="Ex.: iPhone 17 Pro 256 GB Laranja" value="${esc(u.sku ? skuNome(u.sku) : "")}" autocomplete="off"><datalist id="${p}-skus">${Object.values(S.skus).sort((a,b)=>norm(a.nome).localeCompare(norm(b.nome))).map(s => `<option value="${esc(s.nome)}">`).join("")}</datalist></div></div>
    <span class="hint" id="${p}-skuh">Digite o número de um SKU que já existe ou o nome do produto. Para um produto novo, preencha os dois.</span></div>
    <div class="f" id="${p}-catf" hidden><label for="${p}-cat">Categoria do produto novo</label><select class="in" id="${p}-cat">${CATS.map(c => `<option>${c}</option>`).join("")}</select></div>
    <div class="f"><span class="lbl">Identificação <span class="sub" style="display:inline;font-weight:500">opcional</span></span><div class="seg" role="group" aria-label="Tipo de identificação" style="justify-self:start"><button type="button" data-tipo="imei" aria-pressed="${tipo==="imei"}">IMEI</button><button type="button" data-tipo="serie" aria-pressed="${tipo==="serie"}">Número de série</button></div>
      <input class="in" id="${p}-id" placeholder="${tipo==="imei" ? "15 dígitos" : "Ex.: C02XK1ABJG5H"}" value="${esc(u.ident||"")}" autocomplete="off" inputmode="${tipo==="imei"?"numeric":"text"}" style="font-family:ui-monospace,Menlo,Consolas,monospace"><span class="hint" id="${p}-idh"></span></div>`;
}
function ligarCamposAparelho(p, ignorarId){
  let tipo = document.querySelector(`#modal [data-tipo][aria-pressed="true"]`)?.dataset.tipo || "imei";
  const idEl = $(p+"-id"), skuEl = $(p+"-sku"), codEl = $(p+"-cod");
  const porCod = c => Object.values(S.skus).find(s => Number(s.cod) === Number(c));
  document.querySelectorAll("#modal [data-tipo]").forEach(b => b.onclick = () => {
    tipo = b.dataset.tipo;
    document.querySelectorAll("#modal [data-tipo]").forEach(x => x.setAttribute("aria-pressed", x===b));
    idEl.placeholder = tipo==="imei" ? "15 dígitos" : "Ex.: C02XK1ABJG5H"; idEl.inputMode = tipo==="imei" ? "numeric" : "text"; checarId(); idEl.focus();
  });
  const conflito = () => { const c = +soDig(codEl.value), s = c && porCod(c), n = skuPorNome(skuEl.value);
    if(s && skuEl.value.trim() && (!n || n.id !== s.id)) return `O SKU ${c} já é “${s.nome}”. Troque o número ou deixe vazio.`;
    return ""; };
  const checarSku = () => { const h = $(p+"-skuh"); h.style.color = ""; skuEl.classList.remove("err"); codEl.classList.remove("err");
    const ex = skuPorNome(skuEl.value), novo = skuEl.value.trim() && !ex; $(p+"-catf").hidden = !novo;
    if(novo){ const n = norm(skuEl.value); const c = CATS.find(c => n.includes(norm(c).split(" ")[0])) || (n.includes("macbook")||n.includes("imac") ? "Mac" : n.includes("watch") ? "Apple Watch" : "Outros"); $(p+"-cat").value = c; }
    const cf = conflito();
    if(cf){ h.textContent = cf; h.style.color = "var(--bad)"; codEl.classList.add("err"); return; }
    if(ex){ const st = statsSku(ex.id); h.textContent = `SKU ${ex.cod || "?"} · ${st.qtd} em estoque` + (S.verCustos === false ? "" : ` · custo médio ${R(st.medioEst || st.medioHist)}`); return; }
    if(novo){ h.textContent = `Produto novo: será criado como SKU ${soDig(codEl.value) || proxCod()}.`; return; }
    h.textContent = "Digite o número de um SKU que já existe ou o nome do produto. Para um produto novo, preencha os dois."; };
  codEl.oninput = () => { codEl.value = soDig(codEl.value).slice(0,6); const s = codEl.value && porCod(codEl.value);
    if(s){ skuEl.value = s.nome; skuEl.dispatchEvent(new Event("input")); } else checarSku(); };
  const checarId = () => {
    const v = idEl.value.trim(), h = $(p+"-idh"); idEl.classList.remove("err"); h.textContent = ""; h.style.color = "";
    if(!v) return;
    if(tipo === "imei"){ const d = soDig(v); if(d.length !== 15){ h.textContent = `${d.length} de 15 dígitos`; } else if(!luhn(d)){ h.textContent = "Confira o IMEI: o dígito verificador não bate."; h.style.color = "var(--warn)"; } }
    const dup = S.un.find(u => u.id !== ignorarId && norm(u.ident) === norm(v));
    if(dup){ idEl.classList.add("err"); h.style.color = "var(--bad)"; h.textContent = `Já cadastrado: ${skuNome(dup.sku)} (${dup.status==="estoque"?"em estoque":"vendido"}).`; }
  };
  skuEl.oninput = () => { const s = skuPorNome(skuEl.value); if(s && s.cod) codEl.value = s.cod; checarSku(); };
  idEl.oninput = checarId; checarSku(); checarId();
  return { tipo: () => tipo, cod: () => +soDig(codEl.value) || null, conflito, dup: () => { const v = idEl.value.trim(); return v && S.un.find(u => u.id !== ignorarId && norm(u.ident) === norm(v)); } };
}
function modalEntrada(pre){
  pre = pre || {};
  abrirModal("Entrada no estoque", `<form class="form" id="m-form" autocomplete="off">
      ${camposAparelho("m", pre)}
      <div class="row3"><div class="f"><label for="m-custo">Custo de cada um</label><input class="in" id="m-custo" inputmode="numeric" placeholder="R$ 0,00" value="${pre.custo ? R(pre.custo) : ""}"></div>
        <div class="f"><label for="m-qtd">Quantidade</label><input class="in" id="m-qtd" inputmode="numeric" value="1"><span class="hint" id="m-qtdh"></span></div>
        <div class="f"><label for="m-data">Data de entrada</label><input class="in" id="m-data" type="date" value="${hoje()}"></div></div>
      <div id="m-media"></div>
      <div class="row"><div class="f"><label for="m-cond">Condição</label><select class="in" id="m-cond"><option value="lacrado">Lacrado</option><option value="seminovo">Seminovo</option></select></div>
        <div class="f" id="m-batf" hidden><label for="m-bat">Saúde da bateria (%)</label><input class="in" id="m-bat" inputmode="numeric" placeholder="Ex.: 91"></div></div>
      <div class="f"><label for="m-obs">Observação (opcional)</label><input class="in" id="m-obs" placeholder="Ex.: cor, detalhes, acessórios"></div>
      <div id="m-msg"></div></form>`,
    `<button class="btn btn-ghost" type="button" data-close>Cancelar</button><div class="acts"><button class="btn btn-ghost" type="button" id="m-mais">Salvar e cadastrar outro</button><button class="btn btn-gold" type="button" id="m-ok">Salvar</button></div>`,
    () => {
      const ctl = ligarCamposAparelho("m");
      const media = () => { const s = skuPorNome($("m-sku").value), c = parseMoney($("m-custo").value), q = Math.max(1, +soDig($("m-qtd").value) || 1);
        $("m-qtdh").textContent = $("m-id").value.trim() ? "Com IMEI ou série, entra 1 por vez." : "";
        if(!s || !c){ $("m-media").innerHTML = ""; return; }
        const st = statsSku(s.id), n = st.qtd + q, nova = r2((st.totalEst + c*q)/n);
        $("m-media").innerHTML = `<div class="msg warn" style="font-weight:500">${st.qtd ? `Hoje: ${st.qtd} em estoque, custo médio ${R(st.medioEst)}.` : "Sem unidades em estoque hoje."} Depois desta entrada: <b>${n} em estoque, custo médio ${R(nova)}</b>.</div>`; };
      maskMoney($("m-custo"), media);
      $("m-qtd").oninput = () => { $("m-qtd").value = soDig($("m-qtd").value).slice(0,3); media(); };
      $("m-sku").addEventListener("input", media); $("m-id").addEventListener("input", () => { if($("m-id").value.trim()) $("m-qtd").value = "1"; $("m-qtd").disabled = !!$("m-id").value.trim(); media(); });
      media();
      $("m-cond").onchange = () => $("m-batf").hidden = $("m-cond").value !== "seminovo";
      let feitos = 0;
      const salvar = async (continuar) => {
        if(!precisaNuvem()) return;
        const nome = $("m-sku").value.trim(), ident = $("m-id").value.trim(), custo = parseMoney($("m-custo").value), msg = $("m-msg");
        if(!nome) return msg.innerHTML = `<div class="msg bad">Informe o nome do produto.</div>`;
        if(ctl.conflito()) return msg.innerHTML = `<div class="msg bad">${esc(ctl.conflito())}</div>`;
        if(ident && ctl.dup()) return msg.innerHTML = `<div class="msg bad">Esse ${ctl.tipo()==="imei"?"IMEI":"número de série"} já está cadastrado.</div>`;
        if(!custo) return msg.innerHTML = `<div class="msg bad">Informe o custo.</div>`;
        $("m-ok").disabled = $("m-mais").disabled = true;
        try{
          const sku = await garantirSku(nome, $("m-cat").value, ctl.cod());
          const cond = $("m-cond").value, qtd = ident ? 1 : Math.min(200, Math.max(1, +soDig($("m-qtd").value) || 1));
          feitos += await rpc("entrada_estoque", {p_empresa: S.emp.id, p_sku: sku, p_qtd: qtd, p_custo: custo, p_tipo: ctl.tipo(), p_ident: ident, p_entrada: $("m-data").value || hoje(), p_cond: cond, p_bateria: cond==="seminovo" ? soDig($("m-bat").value) : "", p_obs: $("m-obs").value.trim()});
          await recarregar();
          if(continuar){ $("m-id").value = ""; $("m-qtd").value = "1"; $("m-id").dispatchEvent(new Event("input")); $("m-bat").value = ""; $("m-obs").value = ""; $("m-sku").dispatchEvent(new Event("input")); msg.innerHTML = `<div class="msg ok">${feitos} ${feitos===1?"aparelho salvo":"aparelhos salvos"}. Produto e custo mantidos para o próximo.</div>`; $("m-id").focus(); }
          else { fecharModal(); toast(feitos === 1 ? "Aparelho salvo no estoque" : feitos + " aparelhos salvos no estoque"); }
        }catch(e){ erroNuvem(e); }
        $("m-ok").disabled = $("m-mais").disabled = false;
      };
      $("m-ok").onclick = () => salvar(false); $("m-mais").onclick = () => salvar(true);
      $("m-form").onsubmit = e => { e.preventDefault(); salvar(false); };
      setTimeout(() => (pre.sku ? $("m-custo") : $("m-sku")).focus(), 50);
    });
}
function modalEditarUn(id){
  const u = S.un.find(x => x.id === id); if(!u) return;
  abrirModal("Editar aparelho", `<form class="form" id="m-form" autocomplete="off">
      ${camposAparelho("m", u)}
      <div class="row"><div class="f"><label for="m-custo">Custo</label><input class="in" id="m-custo" inputmode="numeric" value="${R(u.custo)}"></div>
        <div class="f"><label for="m-data">Data de entrada</label><input class="in" id="m-data" type="date" value="${esc(u.entrada||hoje())}"></div></div>
      <div class="row"><div class="f"><label for="m-cond">Condição</label><select class="in" id="m-cond"><option value="lacrado" ${u.cond!=="seminovo"?"selected":""}>Lacrado</option><option value="seminovo" ${u.cond==="seminovo"?"selected":""}>Seminovo</option></select></div>
        <div class="f" id="m-batf" ${u.cond==="seminovo"?"":"hidden"}><label for="m-bat">Saúde da bateria (%)</label><input class="in" id="m-bat" inputmode="numeric" value="${esc(u.bateria||"")}"></div></div>
      <div class="f"><label for="m-obs">Observação</label><input class="in" id="m-obs" value="${esc(u.obs||"")}"></div><div id="m-msg"></div></form>`,
    `<button class="btn btn-danger" type="button" id="m-del">Remover do estoque</button><div class="acts"><button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-gold" type="button" id="m-ok">Salvar</button></div>`,
    () => {
      const ctl = ligarCamposAparelho("m", id);
      maskMoney($("m-custo"));
      $("m-cond").onchange = () => $("m-batf").hidden = $("m-cond").value !== "seminovo";
      $("m-ok").onclick = async () => {
        if(!precisaNuvem()) return;
        const nome = $("m-sku").value.trim(), ident = $("m-id").value.trim();
        if(!nome) return $("m-msg").innerHTML = `<div class="msg bad">Informe o nome do produto.</div>`;
        if(ctl.conflito()) return $("m-msg").innerHTML = `<div class="msg bad">${esc(ctl.conflito())}</div>`;
        if(ident && ctl.dup()) return $("m-msg").innerHTML = `<div class="msg bad">Essa identificação já está em outro aparelho.</div>`;
        try{
          const sku = await garantirSku(nome, $("m-cat").value, ctl.cod()), cond = $("m-cond").value;
          await q(sb.from("unidades").update({sku_id: sku, tipo: ctl.tipo(), ident: !ident ? "" : ctl.tipo()==="imei" ? soDig(ident) : ident.toUpperCase(), entrada: $("m-data").value || u.entrada, cond, bateria: cond==="seminovo" ? soDig($("m-bat").value) : "", obs: $("m-obs").value.trim()}).eq("id", id));
          if(u.status === "estoque" && parseMoney($("m-custo").value) !== Number(u.custo)) await rpc("editar_custo_unidade", {p_unidade: id, p_custo: parseMoney($("m-custo").value)});
          fecharModal(); await feito("Aparelho atualizado");
        }catch(e){ erroNuvem(e); }
      };
      $("m-del").onclick = e => {
        if(u.status !== "estoque") return $("m-msg").innerHTML = `<div class="msg bad">Este aparelho já foi vendido. Para devolvê-lo ao estoque, estorne a venda em Vendas do mês.</div>`;
        confirmar(e.currentTarget, "Toque de novo para remover", async () => {
          if(!precisaNuvem()) return;
          try{ await q(sb.from("unidades").delete().eq("id", id)); fecharModal(); await feito("Aparelho removido do estoque"); }catch(err){ erroNuvem(err); }
        });
      };
    });
}


/* ---------- SKUs ---------- */
const SK = {q:""};
function statsVendaSku(id){
  const pr = [];
  S.vendas.forEach(v => (v.itens||[]).forEach(it => { if(it.sku === id && !it.brinde) pr.push(Number(it.preco)||0); }));
  return {n: pr.length, medio: avg(pr), ult: ultimoPreco(id)};
}
V.skus = {
  mount(){
    return `<div class="head"><div><h1>SKUs</h1><p id="k-res">Cada produto com um código. Em “+ Entrada” você lança o custo de cada compra e o sistema faz a média.</p></div><div class="acts"><button class="btn btn-gold" type="button" id="k-novo">+ Novo SKU</button></div></div>
      <div class="bar"><input class="search" id="k-q" type="search" placeholder="Buscar por código ou nome" value="${esc(SK.q)}" aria-label="Buscar SKU"></div>
      <div class="card"><div class="tw"><table><thead><tr><th>Código</th><th>Produto</th><th>Categoria</th><th class="r">Em estoque</th><th class="r">Custo médio em estoque</th><th class="r">Vendidos</th><th class="r">Preço médio de venda</th><th></th></tr></thead><tbody id="k-lista">${loadingRow(8)}</tbody></table></div></div>
      <div class="card" id="k-orf-card" hidden><div class="card-h"><h2>Vendas sem SKU</h2><p>Ligue cada produto vendido a um SKU para entrar no custo e no preço médio</p></div><div class="tw"><table><thead><tr><th>Produto na venda</th><th class="r">Vendas</th><th>Ligar ao SKU</th><th></th></tr></thead><tbody id="k-orf"></tbody></table></div></div>
      <p class="sub">Para corrigir um SKU repetido (por exemplo, “iPhone 18 Pro Max” sem armazenamento), abra o SKU errado em Editar e use “Juntar com outro SKU”: o estoque e as vendas passam para o SKU certo.</p>`;
  },
  bind(){
    $("k-q").oninput = e => { SK.q = e.target.value; this.update(); };
    $("k-novo").onclick = () => modalSku();
  },
  update(){
    if(!carregado()) return;
    const q = norm(SK.q);
    const l = Object.values(S.skus).filter(s => !q || skuBusca(s.id).includes(q))
      .sort((a,b) => (Number(a.cod)||1e9) - (Number(b.cod)||1e9) || norm(a.nome).localeCompare(norm(b.nome)));
    $("k-lista").innerHTML = l.length ? l.map(s => { const st = statsSku(s.id), sv = statsVendaSku(s.id);
      return `<tr><td class="nw"><span class="tag t-lac">${s.cod ? "SKU "+s.cod : "sem código"}</span></td><td><button class="link" type="button" data-ked="${s.id}" style="font-size:14px;color:var(--fg);text-align:left" title="Editar SKU">${esc(s.nome)} ✎</button></td><td>${esc(s.cat||"Outros")}</td>
        <td class="r">${st.qtd || '<span class="sub" style="display:inline">0</span>'}</td><td class="r nw">${st.medioEst ? R(st.medioEst) : st.medioHist ? `<span class="sub" style="display:inline">${R(st.medioHist)}</span>` : "—"}</td>
        <td class="r">${sv.n}</td><td class="r nw">${sv.n ? R(sv.medio) : "—"}</td><td class="r nw"><button class="btn btn-gold btn-sm" type="button" data-kent="${s.id}">+ Entrada</button> <button class="btn btn-ghost btn-sm" type="button" data-ked="${s.id}">Editar</button></td></tr>` +
        (st.qtd ? `<tr><td></td><td colspan="7" style="padding-top:0;border-top:0"><div class="prices" style="align-items:center"><small class="sub" style="display:inline;font-size:12px">Compras em estoque:</small>${st.est.slice().sort((x,y) => (x.entrada||"").localeCompare(y.entrada||"")).map(u => `<button type="button" class="chip" data-kun="${u.id}" title="Editar esta unidade">${R(u.custo)} <small class="sub" style="display:inline;font-size:11.5px;font-weight:500">${dataBR(u.entrada).slice(0,5)}${u.ident ? " · …"+esc(String(u.ident).slice(-4)) : ""}</small></button>`).join("")}</div></td></tr>` : ""); }).join("")
      : `<tr><td colspan="8" class="empty">${Object.keys(S.skus).length ? "Nenhum SKU com essa busca." : "<b>Nenhum SKU ainda</b>Crie o primeiro em “Novo SKU” ou ao dar entrada no estoque."}</td></tr>`;
    $("k-lista").querySelectorAll("[data-ked]").forEach(b => b.onclick = () => modalSku(b.dataset.ked));
    $("k-lista").querySelectorAll("[data-kent]").forEach(b => b.onclick = () => modalEntrada({sku: b.dataset.kent}));
    $("k-lista").querySelectorAll("[data-kun]").forEach(b => b.onclick = () => modalEditarUn(b.dataset.kun));
    /* vendas sem SKU */
    const orf = {};
    S.vendas.forEach(v => (v.itens||[]).forEach(it => { if(it.sku && S.skus[it.sku]) return; const k = norm(it.nome); (orf[k] = orf[k] || {nome: it.nome, n: 0}).n++; }));
    const ks = Object.keys(orf).sort((x,y) => orf[x].nome.localeCompare(orf[y].nome));
    $("k-orf-card").hidden = !ks.length;
    const opts = Object.values(S.skus).sort((x,y) => (Number(x.cod)||1e9) - (Number(y.cod)||1e9)).map(s => `<option value="${s.id}">${s.cod ? "SKU "+s.cod+" · " : ""}${esc(s.nome)}</option>`).join("");
    $("k-orf").innerHTML = ks.map((k,i) => { const o = orf[k], igual = skuPorNome(o.nome);
      return `<tr><td><b>${esc(o.nome)}</b></td><td class="r">${o.n}</td><td><select class="in" data-orf-sel="${i}" aria-label="SKU para ${esc(o.nome)}" style="min-width:220px"><option value="">Escolha o SKU</option>${opts}</select></td>
        <td class="r nw"><button class="btn btn-gold btn-sm" type="button" data-orf-ok="${i}">Ligar</button> <button class="btn btn-ghost btn-sm" type="button" data-orf-novo="${i}" ${igual ? "hidden" : ""}>Criar SKU com este nome</button></td></tr>`; }).join("");
    const ligar = async (nomeOrig, dest) => {
      if(!precisaNuvem()) return;
      const k = norm(nomeOrig);
      try{
        await rpc("ligar_itens_sem_sku", {p_empresa: S.emp.id, p_nome: nomeOrig, p_sku: dest});
        await feito("Vendas ligadas a " + (skuCod(dest) || skuNome(dest)));
      }catch(e){ erroNuvem(e); }
    };
    $("k-orf").querySelectorAll("[data-orf-ok]").forEach(b => b.onclick = () => { const i = +b.dataset.orfOk, dest = $("k-orf").querySelector(`[data-orf-sel="${i}"]`).value; if(!dest) return toast("Escolha o SKU primeiro"); ligar(orf[ks[i]].nome, dest); });
    $("k-orf").querySelectorAll("[data-orf-novo]").forEach(b => b.onclick = async () => { if(!precisaNuvem()) return; const o = orf[ks[+b.dataset.orfNovo]];
      try{ const n = norm(o.nome); const cat = n.includes("macbook") || n.includes("imac") ? "Mac" : n.includes("watch") && !n.includes("iphone") ? "Apple Watch" : n.includes("airpods") ? "AirPods" : n.includes("ipad") ? "iPad" : n.includes("iphone") ? "iPhone" : "Outros";
        const id = await garantirSku(o.nome, cat); await ligar(o.nome, id); }catch(e){ erroNuvem(e); } });
  }
};
function modalSku(id){
  const s = id ? S.skus[id] : {cod: proxCod(), nome:"", cat:"iPhone"};
  if(!s) return;
  const usoUn = id ? S.un.filter(u => u.sku === id).length : 0;
  const usoV = id ? S.vendas.filter(v => (v.itens||[]).some(it => it.sku === id) || (v.troca && v.troca.sku === id)).length : 0;
  const outros = Object.values(S.skus).filter(x => x.id !== id).sort((a,b) => (Number(a.cod)||1e9) - (Number(b.cod)||1e9));
  abrirModal(id ? "Editar SKU" : "Novo SKU", `<form class="form" id="k-form" autocomplete="off">
      <div class="row"><div class="f"><label for="k-cod">Código</label><input class="in" id="k-cod" inputmode="numeric" value="${esc(s.cod||"")}"><span class="hint">Aparece como SKU ${esc(s.cod||"?")}</span></div>
        <div class="f"><label for="k-cat">Categoria</label><select class="in" id="k-cat">${CATS.map(c => `<option ${(s.cat||"Outros")===c?"selected":""}>${c}</option>`).join("")}</select></div></div>
      <div class="f"><label for="k-nome">Nome do produto</label><input class="in" id="k-nome" value="${esc(s.nome)}" placeholder="Ex.: iPhone 18 Pro Max 256 GB"></div>
      ${id ? `<p class="sub" style="margin:0">Usado em ${usoUn} ${usoUn===1?"aparelho":"aparelhos"} do estoque e ${usoV} ${usoV===1?"venda":"vendas"}. Mudar o nome atualiza tudo.</p>
      <details class="more"><summary>Juntar com outro SKU</summary><div class="form" style="margin-top:12px">
        <p class="sub" style="margin:0">Tudo que está em “${esc(s.nome)}” passa para o SKU escolhido, e este SKU é apagado.</p>
        <select class="in" id="k-dest" aria-label="SKU de destino"><option value="">Escolha o SKU certo</option>${outros.map(o => `<option value="${o.id}">${o.cod ? "SKU "+o.cod+" · " : ""}${esc(o.nome)}</option>`).join("")}</select>
        <button class="btn btn-ghost" type="button" id="k-juntar" style="justify-self:start">Juntar</button></div></details>` : ""}
      <div id="k-msg"></div></form>`,
    `${id ? `<button class="btn btn-danger" type="button" id="k-del">Apagar</button>` : "<span></span>"}<div class="acts"><button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-gold" type="button" id="k-ok">Salvar</button></div>`,
    () => {
      const msg = t => $("k-msg").innerHTML = `<div class="msg bad">${t}</div>`;
      $("k-cod").oninput = () => { $("k-cod").value = soDig($("k-cod").value).slice(0,5); $("k-cod").nextElementSibling.textContent = "Aparece como SKU " + ($("k-cod").value || "?"); };
      const ok = async () => {
        const cod = +soDig($("k-cod").value), nome = $("k-nome").value.trim().replace(/\s+/g," ");
        if(!cod) return msg("Informe um código, por exemplo 12.");
        if(!nome) return msg("Informe o nome do produto.");
        const dupC = Object.values(S.skus).find(x => x.id !== id && Number(x.cod) === cod);
        if(dupC) return msg(`O código ${cod} já é do SKU “${esc(dupC.nome)}”.`);
        const dupN = Object.values(S.skus).find(x => x.id !== id && norm(x.nome) === norm(nome));
        if(dupN) return msg(`Já existe um SKU com esse nome (SKU ${esc(dupN.cod||"?")}). Use “Juntar com outro SKU” se forem o mesmo produto.`);
        if(!precisaNuvem()) return;
        try{
          if(id) await q(sb.from("skus").update({cod, nome, cat: $("k-cat").value}).eq("id", id));
          else await q(sb.from("skus").insert({empresa_id: S.emp.id, cod, nome, cat: $("k-cat").value}));
          fecharModal(); await feito(id ? "SKU atualizado" : "SKU criado");
        }catch(e){ erroNuvem(e); }
      };
      $("k-ok").onclick = ok; $("k-form").onsubmit = e => { e.preventDefault(); ok(); };
      if(!id) return;
      $("k-del").onclick = e => {
        if(usoUn || usoV) return msg("Este SKU está em uso. Para tirá-lo da lista, use “Juntar com outro SKU”.");
        confirmar(e.currentTarget, "Toque de novo para apagar", async () => { if(!precisaNuvem()) return; try{ await q(sb.from("skus").delete().eq("id", id)); fecharModal(); await feito("SKU apagado"); }catch(err){ erroNuvem(err); } });
      };
      $("k-juntar").onclick = e => {
        const dest = $("k-dest").value; if(!dest) return msg("Escolha o SKU de destino.");
        confirmar(e.currentTarget, "Confirmar: juntar em “" + esc(skuNome(dest)) + "”", async () => {
          if(!precisaNuvem()) return;
          const btn = $("k-juntar"); btn.disabled = true; btn.textContent = "Juntando…";
          try{
            await rpc("juntar_skus", {p_origem: id, p_destino: dest});
            fecharModal(); await feito("SKUs juntados");
          }catch(err){ erroNuvem(err); btn.disabled = false; btn.textContent = "Juntar"; }
        });
      };
    });
}

/* ---------- NOVA VENDA ---------- */
const NV_PAD = () => ({addBrinde:false, itens:[], troca:null, forma:"pix", parc:12, modo:"repassa", cliente:"", fone:"", data:hoje(), obs:"", vendedor:"", origem:"", dados:null, maisAberto:false, feita:null});
const NV = NV_PAD();
function novaVendaLimpa(){ Object.assign(NV, NV_PAD()); }
V.venda = {
  mount(){
    if(NV.feita) return vendaFeitaHtml();
    return `<div class="head"><div><h1>Nova venda</h1><p>Escolha os aparelhos do estoque, registre a troca e a forma de pagamento. O estoque é atualizado na hora.</p></div></div>
      <div class="sale">
        <div class="form">
          <div class="card"><div class="card-h"><div class="step"><i>1</i><h2>Cliente e data</h2></div></div><div class="card-b form">
            <div class="row"><div class="f"><label for="v-cli">Nome do cliente</label><input class="in" id="v-cli" list="v-clis" value="${esc(NV.cliente)}" placeholder="Digite para buscar ou cadastrar" autocomplete="off"><datalist id="v-clis">${S.cli.map(c => `<option value="${esc(c.nome)}">${esc(fone(c.fone))}</option>`).join("")}</datalist></div>
              <div class="f"><label for="v-fone">WhatsApp</label><input class="in" id="v-fone" value="${esc(NV.fone)}" inputmode="tel" placeholder="(51) 99999-9999"></div></div>
            <details class="more" id="v-mais" ${NV.maisAberto?"open":""}><summary>CPF, e-mail e endereço do cliente <span class="sub" style="display:inline">opcional</span></summary><div class="form" style="margin-top:14px">${camposCli("v")}
              <p class="sub" style="margin:0">Fica salvo no cadastro do cliente, visível só para a equipe desta loja.</p></div></details>
            <div class="row"><div class="f"><label for="v-data">Data da venda</label><input class="in" id="v-data" type="date" value="${NV.data}"><span class="hint">Pode lançar vendas antigas mudando a data.</span></div>
              <div class="f"><label for="v-obs">Observação (opcional)</label><input class="in" id="v-obs" value="${esc(NV.obs)}" placeholder="Ex.: entrega em casa"></div></div>
            <div class="row"><div class="f"><label for="v-vend">Vendedor</label><input class="in" id="v-vend" list="v-vends" value="${esc(NV.vendedor)}" placeholder="Quem fechou a venda" autocomplete="off"><datalist id="v-vends">${[...new Set(S.vendas.map(v => v.vendedor).filter(Boolean))].map(n => `<option value="${esc(n)}">`).join("")}</datalist></div>
              <div class="f"><label for="v-orig">Como o cliente chegou</label><select class="in" id="v-orig"><option value="">Não informado</option>${ORIGENS.map(o => `<option ${NV.origem===o?"selected":""}>${o}</option>`).join("")}</select></div></div>
          </div></div>
          <div class="card"><div class="card-h"><div class="step"><i>2</i><h2>Produtos e brindes</h2></div><button class="link" type="button" id="v-avulso">+ Item fora do estoque</button></div><div class="card-b form">
            <div class="seg" role="group" aria-label="Como adicionar" style="justify-self:start"><button type="button" data-addmodo="venda" aria-pressed="${!NV.addBrinde}">Vender</button><button type="button" data-addmodo="brinde" aria-pressed="${!!NV.addBrinde}">Dar de brinde</button></div>
            <p class="sub" id="v-addh" style="margin:0">${NV.addBrinde ? "O que você escolher entra como brinde: sai do estoque, não é cobrado e o custo sai do lucro." : "Aparelhos e acessórios que o cliente está comprando."}</p>
            <input class="search" id="v-q" type="search" placeholder="Buscar no estoque por modelo, IMEI ou série" autocomplete="off" aria-label="Buscar aparelho no estoque">
            <div class="results" id="v-res"></div>
            <div class="form" id="v-itens" style="gap:8px"></div>
          </div></div>
          <div class="card"><div class="card-h"><div class="step"><i>3</i><h2>Aparelho na troca</h2></div><label class="check"><input type="checkbox" id="v-tem-troca" ${NV.troca?"checked":""}> Cliente deu um aparelho</label></div><div class="card-b form" id="v-troca" ${NV.troca?"":"hidden"}>
            <div class="f"><label for="v-t-sku">Modelo</label><input class="in" id="v-t-sku" list="v-t-skus" placeholder="Ex.: iPhone 15 Pro 128 GB Natural" autocomplete="off"><datalist id="v-t-skus">${Object.values(S.skus).map(s => `<option value="${esc(s.nome)}">`).join("")}</datalist></div>
            <div class="row"><div class="f"><span class="lbl">Identificação</span><div class="seg" role="group" aria-label="Tipo de identificação da troca"><button type="button" data-ttipo="imei" aria-pressed="true">IMEI</button><button type="button" data-ttipo="serie" aria-pressed="false">Número de série</button></div></div>
              <div class="f"><label for="v-t-id">IMEI ou série</label><input class="in" id="v-t-id" autocomplete="off" style="font-family:ui-monospace,Menlo,Consolas,monospace"></div></div>
            <div class="row"><div class="f"><label for="v-t-val">Valor pago na troca</label><input class="in" id="v-t-val" inputmode="numeric" placeholder="R$ 0,00"><span class="hint">Vira o custo desse aparelho no estoque.</span></div>
              <div class="f"><label for="v-t-bat">Saúde da bateria (%)</label><input class="in" id="v-t-bat" inputmode="numeric" placeholder="Ex.: 88"></div></div>
          </div></div>
          <div class="card"><div class="card-h"><div class="step"><i>4</i><h2>Pagamento</h2></div></div><div class="card-b form">
            <div class="seg" role="group" aria-label="Forma de pagamento" id="v-forma">${[["pix","Pix"],["dinheiro","Dinheiro"],["debito","Débito"],["credito","Crédito"]].map(([k,n]) => `<button type="button" data-forma="${k}" aria-pressed="${NV.forma===k}">${n}</button>`).join("")}</div>
            <div class="row" id="v-cred" ${NV.forma==="credito"?"":"hidden"}><div class="f"><label for="v-parc">Parcelas</label><select class="in" id="v-parc">${Array.from({length:18},(_,i) => `<option value="${i+1}" ${NV.parc===i+1?"selected":""}>${i+1}x · taxa ${P(S.taxas.cred[i])}</option>`).join("")}</select></div>
              <div class="f"><span class="lbl">Quem paga a taxa</span><div class="seg" role="group" aria-label="Quem paga a taxa"><button type="button" data-modo2="repassa" aria-pressed="${NV.modo==="repassa"}">Cliente</button><button type="button" data-modo2="absorve" aria-pressed="${NV.modo==="absorve"}">A loja</button></div></div></div>
            <p class="sub" id="v-deb-h" ${NV.forma==="debito"?"":"hidden"}></p>
          </div></div>
        </div>
        <aside class="card summary"><div class="card-h"><h2>Resumo</h2></div><div class="card-b" id="v-sum"></div></aside>
      </div>`;
  },
  bind(){
    if(NV.feita){ bindVendaFeita(); return; }
    const up = () => this.calc();
    const salvarDados = () => { NV.dados = lerCli("v"); up(); };
    ligarCli("v", salvarDados);
    if(NV.dados) preencherCli("v", {cpf: NV.dados.cpf, email: NV.dados.email, end: NV.dados.end}, false);
    $("v-mais").ontoggle = () => { NV.maisAberto = $("v-mais").open; };
    $("v-vend").oninput = () => { NV.vendedor = $("v-vend").value; };
    $("v-orig").onchange = () => { NV.origem = $("v-orig").value; };
    $("v-cli").oninput = () => { NV.cliente = $("v-cli").value; const c = S.cli.find(c => norm(c.nome) === norm(NV.cliente));
      if(c){ if(c.fone && !$("v-fone").value){ $("v-fone").value = fone(c.fone); NV.fone = $("v-fone").value; }
        preencherCli("v", c, true); salvarDados(); if((c.cpf || c.email || endTxt(c.end)) && !$("v-mais").open){ $("v-mais").open = true; NV.maisAberto = true; } }
      up(); };
    $("v-fone").oninput = () => { NV.fone = $("v-fone").value; };
    $("v-data").oninput = () => { NV.data = $("v-data").value; };
    $("v-obs").oninput = () => { NV.obs = $("v-obs").value; };
    $("v-q").oninput = () => this.busca();
    $("v-avulso").onclick = () => modalAvulso();
    document.querySelectorAll("[data-addmodo]").forEach(b => b.onclick = () => { NV.addBrinde = b.dataset.addmodo === "brinde";
      document.querySelectorAll("[data-addmodo]").forEach(x => x.setAttribute("aria-pressed", x === b));
      $("v-addh").textContent = NV.addBrinde ? "O que você escolher entra como brinde: sai do estoque, não é cobrado e o custo sai do lucro." : "Aparelhos e acessórios que o cliente está comprando.";
      $("v-q").placeholder = NV.addBrinde ? "Buscar o brinde no estoque: capa, película, cabo…" : "Buscar no estoque por modelo, IMEI ou série"; $("v-q").focus(); });
    $("v-tem-troca").onchange = () => { const on = $("v-tem-troca").checked; $("v-troca").hidden = !on; NV.troca = on ? (NV.troca || {tipo:"imei"}) : null; up(); };
    if(NV.troca){ $("v-t-sku").value = NV.troca.nome||""; $("v-t-id").value = NV.troca.ident||""; $("v-t-val").value = NV.troca.valor ? R(NV.troca.valor) : ""; $("v-t-bat").value = NV.troca.bateria||""; }
    const ttipo = t => { if(NV.troca) NV.troca.tipo = t; document.querySelectorAll("[data-ttipo]").forEach(x => x.setAttribute("aria-pressed", x.dataset.ttipo===t)); };
    document.querySelectorAll("[data-ttipo]").forEach(b => b.onclick = () => ttipo(b.dataset.ttipo));
    if(NV.troca) ttipo(NV.troca.tipo||"imei");
    const tr = () => { if(!NV.troca) return; NV.troca.nome = $("v-t-sku").value; NV.troca.ident = $("v-t-id").value; NV.troca.valor = parseMoney($("v-t-val").value); NV.troca.bateria = soDig($("v-t-bat").value); up(); };
    ["v-t-sku","v-t-id","v-t-bat"].forEach(i => $(i).oninput = tr); maskMoney($("v-t-val"), tr);
    document.querySelectorAll("[data-forma]").forEach(b => b.onclick = () => { NV.forma = b.dataset.forma; document.querySelectorAll("[data-forma]").forEach(x => x.setAttribute("aria-pressed", x===b)); $("v-cred").hidden = NV.forma !== "credito"; $("v-deb-h").hidden = NV.forma !== "debito"; up(); });
    $("v-parc").onchange = () => { NV.parc = +$("v-parc").value; up(); };
    document.querySelectorAll("[data-modo2]").forEach(b => b.onclick = () => { NV.modo = b.dataset.modo2; document.querySelectorAll("[data-modo2]").forEach(x => x.setAttribute("aria-pressed", x===b)); up(); });
    this.itens(); this.busca();
  },
  update(){ if(NV.feita) return; this.busca(); this.calc(); },
  busca(){
    const el = $("v-res"); if(!el) return;
    const q = norm($("v-q").value), qd = soDig($("v-q").value), usados = new Set(NV.itens.map(i => i.u).filter(Boolean));
    if(!carregado()){ el.innerHTML = `<div class="sub">Carregando estoque…</div>`; return; }
    const est = emEstoque().filter(u => !usados.has(u.id));
    if(!est.length){ el.innerHTML = `<div class="sub">${S.un.length ? "Todos os aparelhos em estoque já estão nesta venda." : "Estoque vazio. Use “Item fora do estoque” para vender sem SKU."}</div>`; return; }
    if(!q){ el.innerHTML = `<div class="sub">${est.length} ${est.length===1?"aparelho disponível":"aparelhos disponíveis"}. Digite o modelo, o código do SKU ou o IMEI.</div>`; return; }
    /* IMEI ou série específico */
    const porId = (qd.length >= 4 || /[a-z]\d|\d[a-z]/.test(q)) ? est.filter(u => u.ident && (norm(u.ident).includes(q) || (qd.length >= 4 && soDig(u.ident).includes(qd)))) : [];
    /* agrupado por SKU */
    const g = {};
    est.filter(u => skuBusca(u.sku).includes(q)).forEach(u => (g[u.sku] = g[u.sku] || []).push(u));
    const ks = Object.keys(g).sort((x,y) => norm(skuNome(x)).localeCompare(norm(skuNome(y))));
    let html = porId.slice(0,6).map(u => `<button type="button" class="res" data-un="${u.id}"><span><b>${esc(skuNome(u.sku))}</b><span class="sub">${esc(identFmt(u))} · ${u.cond==="seminovo"?"Seminovo":"Lacrado"}</span></span><span class="nw">${S.verCustos ? "custo médio " + R(statsSku(u.sku).medioEst) : ""}</span></button>`).join("");
    html += ks.slice(0,10).map(k => { const st = statsSku(k);
      return `<button type="button" class="res" data-sk="${k}"><span><b>${esc(skuNome(k))}</b><span class="sub">${[skuCod(k), g[k].length + (g[k].length===1 ? " disponível" : " disponíveis")].filter(Boolean).join(" · ")}</span></span><span class="nw">${S.verCustos ? "custo médio " + R(st.medioEst) : ""}</span></button>`; }).join("");
    el.innerHTML = html || `<div class="sub">Nada em estoque com “${esc($("v-q").value)}”. Use “Item fora do estoque” se for vender sem SKU.</div>`;
    const add = u => {
      NV.itens.push({u: u.id, sku: u.sku, nome: skuNome(u.sku), tipo: u.tipo, ident: u.ident, custo: r2(statsSku(u.sku).medioEst || Number(u.custo) || 0), cond: u.cond||"lacrado", preco: 0, brinde: !!NV.addBrinde});
      $("v-q").value = ""; this.itens(); this.busca();
      const ins = document.querySelectorAll("[data-preco]"); ins.length && ins[ins.length-1].focus();
    };
    el.querySelectorAll("[data-un]").forEach(b => b.onclick = () => add(S.un.find(x => x.id === b.dataset.un)));
    el.querySelectorAll("[data-sk]").forEach(b => b.onclick = () => { const l = g[b.dataset.sk].slice().sort((x,y) => (x.entrada||"").localeCompare(y.entrada||"") || (x.criado||"").localeCompare(y.criado||"")); add(l[0]); });
  },
  itens(){
    const el = $("v-itens"); if(!el) return;
    el.innerHTML = NV.itens.map((it,i) => {
      const ult = ultimoPreco(it.sku);
      if(it.brinde) return `<div class="item"><div><b>${esc(it.nome)}</b> <span class="tag t-ok">Brinde</span><span class="sub">${it.u ? esc(identFmt(it) || "Do estoque") : "Fora do estoque"}${S.verCustos === false ? "" : " · custo " + R(it.custo) + " sai do lucro"}</span></div>
        <span class="sub" style="display:block;text-align:right">sem cobrar</span>
        <button class="x" type="button" data-rm="${i}" aria-label="Remover brinde">×</button></div>`;
      return `<div class="item"><div><b>${esc(it.nome)}</b><span class="sub">${it.u ? esc(identFmt(it) || "Do estoque") : "Fora do estoque"}${S.verCustos ? (it.u ? " · custo médio " : " · custo ") + R(it.custo) : ""}${ult ? ` · última venda ${R(ult)}` : ""}</span></div>
        <input class="in" data-preco="${i}" inputmode="numeric" placeholder="Preço de venda" aria-label="Preço de venda" value="${it.preco ? R(it.preco) : ""}">
        <button class="x" type="button" data-rm="${i}" aria-label="Remover item">×</button></div>`;
    }).join("");
    el.querySelectorAll("[data-preco]").forEach(inp => maskMoney(inp, () => { NV.itens[+inp.dataset.preco].preco = parseMoney(inp.value); this.calc(); }));
    el.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { NV.itens.splice(+b.dataset.rm, 1); this.itens(); this.busca(); });
    this.calc();
  },
  calc(){
    const el = $("v-sum"); if(!el) return;
    const totItens = sum(NV.itens.map(i => i.preco)), troca = NV.troca ? (NV.troca.valor||0) : 0;
    const aPagar = Math.max(0, r2(totItens - troca)), pg = calcPag(aPagar, NV.forma, NV.parc, NV.modo);
    const cmv = sum(NV.itens.map(i => i.custo)), lucro = r2(totItens - cmv - pg.taxaValor);
    const deb = $("v-deb-h"); if(deb) deb.textContent = S.taxas.deb == null ? "Taxa do débito ainda não informada em Taxas. Por enquanto conta como 0%." : `Taxa do débito: ${P(S.taxas.deb)}, descontada do seu lucro.`;
    const erros = [];
    if(!NV.itens.length) erros.push("Adicione pelo menos um aparelho.");
    if(!NV.itens.some(i => !i.brinde)) erros.push("Adicione o produto vendido, além dos brindes.");
    if(NV.itens.some(i => !i.brinde && !i.preco)) erros.push("Informe o preço de venda de cada item.");
    if(!NV.cliente.trim()) erros.push("Informe o nome do cliente.");
    const ec = $("v-cpf") ? cliValido("v") : ""; if(ec) erros.push(ec);
    if(NV.troca && (!NV.troca.nome || !NV.troca.nome.trim() || !NV.troca.ident || !NV.troca.valor)) erros.push("Complete os dados do aparelho na troca.");
    if(NV.troca && NV.troca.ident && S.un.some(u => norm(u.ident) === norm(NV.troca.ident))) erros.push("O aparelho da troca já está cadastrado no estoque.");
    if(troca > totItens && totItens) erros.push("O valor da troca é maior que o total dos itens.");
    el.innerHTML = `
      <div class="sumrow"><span>Itens (${NV.itens.filter(i => !i.brinde).length})</span><b>${R(totItens)}</b></div>
      ${NV.itens.some(i => i.brinde) ? `<div class="sumrow"><span>Brindes (${NV.itens.filter(i => i.brinde).length})</span><b>sem cobrar</b></div>` : ""}
      ${troca ? `<div class="sumrow"><span>Aparelho na troca</span><b>− ${R(troca)}</b></div>` : ""}
      <div class="sumrow big"><span>Cliente paga</span><b>${R(pg.clientePaga)}</b></div>
      ${NV.forma==="credito" && pg.clientePaga ? `<div class="sumrow"><span>${NV.parc}x de</span><b>${R(pg.clientePaga/NV.parc)}</b></div>` : ""}
      ${pg.taxaPct ? `<div class="sumrow"><span>Taxa ${P(pg.taxaPct)} ${NV.forma==="credito" && NV.modo==="repassa" ? "(paga pelo cliente)" : "(sai do seu lucro)"}</span><b>${R(pg.taxaValor || pg.taxaCliente || 0)}</b></div>` : ""}
      <div class="sumrow"><span>Você recebe</span><b>${R(pg.recebido)}</b></div>
      ${S.verCustos ? `<div class="sumrow"><span>Custo dos aparelhos</span><b>${R(cmv)}</b></div>
      <div class="sumrow profit big"><span>Lucro da venda</span><b>${R(lucro)}</b></div>
      <div class="sumrow"><span>Margem</span><b>${totItens ? P(lucro/totItens*100) : "—"}</b></div>` : ""}
      <div id="v-err" style="margin:12px 0 0">${erros.length && (NV.itens.length || NV.cliente) ? `<div class="msg warn">${erros[0]}</div>` : ""}</div>
      <button class="btn btn-gold" type="button" id="v-ok" style="width:100%;margin-top:12px" ${erros.length ? "disabled" : ""}>Registrar venda</button>
      <button class="link" type="button" id="v-limpar" style="width:100%;margin-top:12px">Limpar venda</button>`;
    $("v-ok").onclick = () => registrarVenda({totItens, troca, aPagar, pg, cmv, lucro});
    $("v-limpar").onclick = e => confirmar(e.currentTarget, "Toque de novo para limpar", () => { novaVendaLimpa(); go("venda", true); });
  }
};
function ultimoPreco(sku){
  for(const v of S.vendas) for(const it of (v.itens||[])) if(it.sku === sku && it.preco && !it.brinde) return it.preco;
  return 0;
}
function modalAvulso(){
  abrirModal("Item fora do estoque", `<form class="form" id="m-form" autocomplete="off"><p class="sub" style="margin:0">Para vender algo sem tirar do estoque: encomendas, vendas antigas ou produtos sem SKU. Não precisa ter SKU.</p>
      <div class="f"><label for="a-sku">Produto</label><input class="in" id="a-sku" list="a-skus" autocomplete="off" placeholder="Ex.: iPhone 14 128 GB"><datalist id="a-skus">${Object.values(S.skus).map(s => `<option value="${esc(s.nome)}">`).join("")}</datalist><span class="hint" id="a-skuh">Se escrever o nome de um SKU, a venda entra na média dele.</span></div>
      <div class="row"><div class="f" ${S.verCustos ? "" : "hidden"}><label for="a-custo">Custo</label><input class="in" id="a-custo" inputmode="numeric" placeholder="R$ 0,00"></div><div class="f"><label for="a-preco">Preço de venda</label><input class="in" id="a-preco" inputmode="numeric" placeholder="R$ 0,00"></div></div>
      <div class="f"><label for="a-id">IMEI ou série (opcional)</label><input class="in" id="a-id" autocomplete="off"></div>
      <label class="check"><input type="checkbox" id="a-brinde" ${NV.addBrinde ? "checked" : ""}> É brinde (não cobrar do cliente)</label><div id="a-msg"></div></form>`,
    `<button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-gold" type="button" id="a-ok">Adicionar à venda</button>`,
    () => {
      maskMoney($("a-custo")); maskMoney($("a-preco"));
      const brindeUI = () => { const b = $("a-brinde").checked; $("a-preco").closest(".f").hidden = b; $("a-id").closest(".f").hidden = b; };
      $("a-brinde").onchange = brindeUI; brindeUI();
      $("a-sku").oninput = () => { const s = skuPorNome($("a-sku").value);
        $("a-skuh").textContent = s ? `${skuCod(s.id) || "SKU"} encontrado. Custo médio ${R(statsSku(s.id).medioEst || statsSku(s.id).medioHist)}.` : $("a-sku").value.trim() ? "Sem SKU. A venda entra normalmente no mês." : "Se escrever o nome de um SKU, a venda entra na média dele.";
        if(s && !$("a-custo").value){ const st = statsSku(s.id); if(st.medioEst || st.medioHist) $("a-custo").value = R(r2(st.medioEst || st.medioHist)); } };
      const ok = () => {
        const nome = $("a-sku").value.trim().replace(/\s+/g," "), custo = parseMoney($("a-custo").value), preco = parseMoney($("a-preco").value);
        const ehBrinde = $("a-brinde").checked;
        if(!nome || (!preco && !ehBrinde)) return $("a-msg").innerHTML = `<div class="msg bad">${ehBrinde ? "Preencha o nome do brinde." : "Preencha o produto e o preço de venda."}</div>`;
        if(!custo && S.verCustos) return $("a-msg").innerHTML = `<div class="msg bad">Informe o custo para o lucro sair certo.</div>`;
        const s = skuPorNome(nome), ident = $("a-id").value.trim();
        NV.itens.push({u:null, sku: s ? s.id : null, nome: s ? s.nome : nome, tipo: ident && soDig(ident).length===15 ? "imei" : "serie", ident: ehBrinde ? "" : ident, custo, cond:"lacrado", preco: ehBrinde ? 0 : preco, brinde: ehBrinde});
        fecharModal(); V.venda.itens(); V.venda.busca();
      };
      $("a-ok").onclick = ok; $("m-form").onsubmit = e => { e.preventDefault(); ok(); };
      setTimeout(() => $("a-sku").focus(), 50);
    });
}
async function registrarVenda(c){
  if(!precisaNuvem()) return;
  const btn = $("v-ok"); btn.disabled = true; btn.textContent = "Salvando…";
  try{
    const data = NV.data || hoje();
    const tel = soDig(NV.fone), dd = $("v-cpf") ? lerCli("v") : (NV.dados || {cpf:"", email:"", end:{}});
    const temEnd = END_K.some(k => dd.end && dd.end[k]);
    const cli = S.cli.find(x => norm(x.nome) === norm(NV.cliente));
    const payload = {
      data, sem_data: false,
      cliente: {id: cli ? cli.id : "", nome: NV.cliente.trim(), fone: tel, cpf: dd.cpf, email: dd.email, endereco: temEnd ? dd.end : null},
      vendedor: NV.vendedor.trim(), origem: NV.origem, obs: NV.obs.trim(),
      forma: NV.forma, parcelas: NV.forma === "credito" ? NV.parc : 1, modo: NV.forma === "credito" ? NV.modo : null,
      itens: NV.itens.map(i => i.u ? {unidade_id: i.u, preco: i.brinde ? 0 : i.preco, brinde: !!i.brinde} : {brinde: !!i.brinde, sku_id: i.sku || "", nome: i.nome, tipo: i.tipo, ident: i.ident, cond: i.cond, preco: i.preco, ...(S.verCustos ? {custo: i.custo} : {})}),
      troca: NV.troca ? {nome: NV.troca.nome.trim(), tipo: NV.troca.tipo || "imei", ident: NV.troca.ident || "", valor: NV.troca.valor || 0, bateria: NV.troca.bateria || ""} : null
    };
    const id = await rpc("registrar_venda", {p_empresa: S.emp.id, p: payload});
    await recarregar();
    NV.feita = S.vendas.find(v => v.id === id) || null;
    if(!NV.feita) throw new Error("Venda salva, mas não consegui abrir o recibo. Veja em Vendas do mês.");
    go("venda");
    toast("Venda registrada");
  }catch(e){ erroNuvem(e); btn.disabled = false; btn.textContent = "Registrar venda"; }
}
function textoRecibo(v){
  const L = [], nome = (v.cliente && v.cliente.nome || "").split(" ")[0];
  L.push(`Olá${nome ? ", "+nome : ""}! Obrigado por comprar na ${S.emp ? S.emp.nome : "nossa loja"}.`); L.push("");
  L.push(v.semData ? "*Resumo da sua compra*" : `*Resumo da sua compra* (${dataBR(v.data)})`);
  (v.itens||[]).filter(i => !i.brinde).forEach(i => L.push(`• ${itNome(i)}${i.ident ? " · "+(i.tipo==="serie"?"Série ":"IMEI ")+i.ident : ""}: ${R(i.preco)}`));
  const br = (v.itens||[]).filter(i => i.brinde);
  if(br.length) L.push(`🎁 Brinde${br.length > 1 ? "s" : ""}: ${br.map(itNome).join(", ")}`);
  if(v.troca) L.push(`Seu aparelho na troca (${v.troca.nome}): −${R(v.troca.valor)}`);
  L.push("");
  if(v.forma === "credito") L.push(`Pagamento: cartão de crédito em ${v.parcelas}x de ${R(v.clientePaga/v.parcelas)} (total ${R(v.clientePaga)})`);
  else L.push(`Pagamento: ${formaNome(v).toLowerCase() === "pix" ? "Pix" : formaNome(v)}, ${R(v.clientePaga)}`);
  if((v.itens||[]).some(i => !i.brinde && i.cond !== "seminovo")) { L.push(""); L.push("Produto lacrado, com garantia total da Apple."); }
  L.push(""); L.push("Qualquer dúvida, estamos à disposição.");
  return L.join("\n");
}
function vendaFeitaHtml(){
  const v = NV.feita;
  return `<div class="head"><div><h1>Venda registrada</h1><p>${esc(v.cliente.nome)} · ${dataBR(v.data)}${S.verCustos ? " · lucro de " + R(v.lucro) : ""}</p></div><div class="acts"><button class="btn btn-gold" type="button" id="f-nova">+ Nova venda</button></div></div>
    <div class="grid2"><div class="card"><div class="card-h"><h2>Mensagem para o cliente</h2><p>Revise e envie pelo WhatsApp</p></div><div class="card-b form">
      <textarea class="receipt" id="f-txt">${esc(textoRecibo(v))}</textarea>
      <div class="acts"><button class="btn btn-gold" type="button" id="f-termo">Termo de entrega</button><a class="btn btn-wa" id="f-wa" target="_blank" rel="noopener" href="${waLink(v.cliente.fone, textoRecibo(v))}">${ic("wa")} Abrir no WhatsApp</a><button class="btn btn-ghost" type="button" id="f-copy">${ic("copy")} Copiar</button></div>
      ${v.cliente.fone ? `<p class="sub">Enviando para ${esc(fone(v.cliente.fone))}.</p>` : `<p class="sub">Sem número cadastrado: o WhatsApp vai pedir para escolher o contato.</p>`}
    </div></div>
    <div class="card"><div class="card-h"><h2>O que mudou no sistema</h2></div><div class="att">
      ${(v.itens||[]).map(i => `<div class="it"><div><b>${esc(i.nome)}</b><span class="sub">${i.u ? "Saiu do estoque" : "Lançado fora do estoque"}</span></div><span class="tag t-ok">${i.brinde ? "Brinde" : R(i.preco)}</span></div>`).join("")}
      ${v.troca ? `<div class="it"><div><b>${esc(v.troca.nome)}</b><span class="sub">Entrou no estoque como seminovo, custo ${R(v.troca.valor)}</span></div><span class="tag t-lac">Troca</span></div>` : ""}
      ${S.verCustos ? `<div class="it"><div><b>Lucro da venda</b><span class="sub">Somado em Vendas do mês e no Financeiro</span></div><b style="color:var(--gold-ink)">${R(v.lucro)}</b></div>` : ""}
    </div></div></div>`;
}
function bindVendaFeita(){
  $("f-nova").onclick = () => { novaVendaLimpa(); go("venda"); };
  $("f-txt").oninput = () => { $("f-wa").href = waLink(NV.feita.cliente.fone, $("f-txt").value); };
  $("f-copy").onclick = () => copiar($("f-txt").value, $("f-txt"));
  $("f-termo").onclick = () => abrirTermo(NV.feita);
}


/* ---------- SIMULADOR ---------- */
const SIM = {produto:"", valor:0, desconto:0, troca:0, custo:0, custoAuto:false, modo:"repassa", lacrado:true, pick:new Set(MSG_PADRAO.pick), mexeuPick:false, msg:"", msgEditada:false};
function simOpcoes(base){
  const out = [];
  if(S.taxas.deb != null) out.push({k:"deb", n:0, label:"Débito", t:S.taxas.deb});
  S.taxas.cred.forEach((t,i) => { if(t != null) out.push({k:String(i+1), n:i+1, label:(i+1)+"x", t}); });
  return out.map(o => { const f = o.t/100;
    const total = SIM.modo === "repassa" ? r2(base/(1-f)) : base, recebe = SIM.modo === "repassa" ? base : r2(base*(1-f));
    return {...o, total, parcela: total/Math.max(o.n,1), recebe}; });
}
V.simulador = {
  mount(){
    const skus = Object.values(S.skus).sort((a,b) => norm(a.nome).localeCompare(norm(b.nome)));
    return `<div class="head"><div><h1>Simulador</h1><p>Parcelamento com as taxas da maquininha e orçamento pronto para o WhatsApp</p></div><div class="acts"><button class="btn btn-ghost" type="button" id="s-limpar">Nova simulação</button></div></div>
      <div class="sale">
        <div class="form">
          <div class="kpis k3" id="s-kpis"></div>
          <div class="card"><div class="card-h"><h2>Parcelamento no cartão</h2><p>Marque as opções que vão no orçamento</p></div><div class="tw"><table><thead><tr><th>Forma</th><th class="r">Taxa</th><th class="r">Parcela</th><th class="r">Total do cliente</th><th class="r">Você recebe</th><th class="r" id="s-th-luc">Lucro</th></tr></thead><tbody id="s-tab"></tbody></table></div></div>
          <div class="card"><div class="card-h"><h2>Orçamento para o WhatsApp</h2><p>Ajuste o texto antes de enviar</p></div><div class="card-b form">
            <textarea class="receipt" id="s-msg" aria-label="Mensagem do orçamento"></textarea>
            <div class="acts"><button class="btn btn-gold" type="button" id="s-copy">${ic("copy")} Copiar orçamento</button><a class="btn btn-wa" id="s-wa" target="_blank" rel="noopener" href="#">${ic("wa")} Abrir no WhatsApp</a></div>
          </div></div>
        </div>
        <aside class="card summary sim-in"><div class="card-h"><h2>Dados da venda</h2></div><div class="card-b form">
          <div class="f"><label for="s-prod">Produto</label><input class="in" id="s-prod" list="s-prods" value="${esc(SIM.produto)}" placeholder="Ex.: iPhone 18 Pro Max 256 GB" autocomplete="off"><datalist id="s-prods">${skus.map(s => `<option value="${esc(s.nome)}">`).join("")}</datalist><span class="hint" id="s-prod-h"></span></div>
          <div class="f"><label for="s-valor">Valor do produto (à vista)</label><input class="in" id="s-valor" inputmode="numeric" placeholder="R$ 0,00" value="${SIM.valor ? R(SIM.valor) : ""}"></div>
          <div class="row"><div class="f"><label for="s-desc">Desconto</label><input class="in" id="s-desc" inputmode="numeric" placeholder="R$ 0,00" value="${SIM.desconto ? R(SIM.desconto) : ""}"></div>
            <div class="f"><label for="s-troca">Aparelho na troca</label><input class="in" id="s-troca" inputmode="numeric" placeholder="R$ 0,00" value="${SIM.troca ? R(SIM.troca) : ""}"></div></div>
          <div class="f" ${S.verCustos ? "" : "hidden"}><label for="s-custo">Seu custo <span class="sub" style="display:inline">não aparece no orçamento</span></label><input class="in" id="s-custo" inputmode="numeric" placeholder="R$ 0,00" value="${SIM.custo ? R(SIM.custo) : ""}"><span class="hint">Preenchido com o custo médio do estoque quando o produto existe lá. Serve para ver o lucro de cada parcela.</span></div>
          <div class="f"><span class="lbl">Quem paga a taxa do cartão</span><div class="seg" role="group" aria-label="Quem paga a taxa"><button type="button" data-smodo="repassa" aria-pressed="${SIM.modo==="repassa"}">Cliente</button><button type="button" data-smodo="absorve" aria-pressed="${SIM.modo==="absorve"}">A loja absorve</button></div><span class="hint" id="s-modo-h"></span></div>
          <label class="check"><input type="checkbox" id="s-lac" ${SIM.lacrado?"checked":""}> Produto lacrado (garantia total da Apple)</label>
          <a class="btn btn-ghost" href="#taxas-link" data-go="ajustes" style="justify-self:start">Ver ou editar taxas</a>
        </div></aside>
      </div>`;
  },
  bind(){
    const up = () => { SIM.msgEditada = false; this.update(); };
    $("s-prod").oninput = () => { SIM.produto = $("s-prod").value; const s = skuPorNome(SIM.produto);
      if(s){ const st = statsSku(s.id), c = r2(st.medioEst || st.medioHist); if(c && (!SIM.custo || SIM.custoAuto)){ SIM.custo = c; SIM.custoAuto = true; $("s-custo").value = R(c); }
        if(!SIM.valor){ const u = ultimoPreco(s.id); if(u){ SIM.valor = u; $("s-valor").value = R(u); } } }
      up(); };
    maskMoney($("s-valor"), () => { SIM.valor = parseMoney($("s-valor").value); up(); });
    maskMoney($("s-desc"), () => { SIM.desconto = parseMoney($("s-desc").value); up(); });
    maskMoney($("s-troca"), () => { SIM.troca = parseMoney($("s-troca").value); up(); });
    maskMoney($("s-custo"), () => { SIM.custo = parseMoney($("s-custo").value); SIM.custoAuto = false; this.update(); });
    document.querySelectorAll("[data-smodo]").forEach(b => b.onclick = () => { SIM.modo = b.dataset.smodo; document.querySelectorAll("[data-smodo]").forEach(x => x.setAttribute("aria-pressed", x===b)); up(); });
    $("s-lac").onchange = () => { SIM.lacrado = $("s-lac").checked; up(); };
    $("s-msg").oninput = () => { SIM.msg = $("s-msg").value; SIM.msgEditada = true; $("s-wa").href = waLink("", SIM.msg); };
    $("s-copy").onclick = () => copiar($("s-msg").value, $("s-msg"));
    $("s-limpar").onclick = () => { Object.assign(SIM, {produto:"", valor:0, desconto:0, troca:0, custo:0, custoAuto:false, msg:"", msgEditada:false, mexeuPick:false, pick:new Set(S.msg.pick)}); go("simulador", true); $("s-prod").focus(); };
  },
  update(){
    if(!$("s-tab")) return;
    const base = Math.max(r2(SIM.valor - SIM.desconto - SIM.troca), 0), receita = Math.max(SIM.valor - SIM.desconto, 0);
    $("s-modo-h").textContent = SIM.modo === "repassa" ? "O cliente paga a taxa e você recebe o valor cheio." : "O cliente paga o mesmo valor em qualquer parcela e a taxa sai da sua margem.";
    const s = skuPorNome(SIM.produto);
    $("s-prod-h").textContent = s ? (() => { const st = statsSku(s.id), u = ultimoPreco(s.id); return `${st.qtd} em estoque${u ? " · última venda "+R(u) : ""}`; })() : SIM.produto.trim() ? "Produto fora do estoque. Tudo bem para simular." : "";
    const comLucro = S.verCustos && SIM.custo > 0;
    $("s-th-luc").hidden = !comLucro;
    const ops = base ? simOpcoes(base) : [];
    const o12 = ops.find(o => o.n === 12), o18 = ops.find(o => o.n === 18);
    $("s-kpis").innerHTML = `
      <div class="kpi"><small>À vista no Pix</small><b>${base ? R(base) : "—"}</b><span>${SIM.desconto || SIM.troca ? "de "+R(SIM.valor) : "valor a pagar"}</span></div>
      <div class="kpi hl"><small>Em 12x</small><b>${o12 ? R(o12.parcela) : "—"}</b><span>${o12 ? "total "+R(o12.total) : "no cartão"}</span></div>
      <div class="kpi"><small>Em 18x</small><b>${o18 ? R(o18.parcela) : "—"}</b><span>${o18 ? "total "+R(o18.total) : "no cartão"}</span></div>`;
    if(!base){
      $("s-tab").innerHTML = `<tr><td colspan="6" class="empty"><b>Digite o valor do produto</b>As parcelas de débito e de 1x a 18x aparecem aqui.</td></tr>`;
    } else {
      const lucroPix = r2(receita - SIM.custo);
      let html = `<tr><td><b>Pix ou dinheiro</b></td><td class="r sub" style="display:table-cell">—</td><td class="r nw">${R(base)}</td><td class="r nw">${R(base)}</td><td class="r nw">${R(base)}</td>${comLucro ? `<td class="r nw"><b class="${lucroPix<0?"neg":""}">${R(lucroPix)}</b></td>` : ""}</tr>`;
      ops.forEach(o => {
        if(o.n === 13) html += `<tr><td colspan="${comLucro?6:5}" style="background:var(--warn-soft);color:var(--warn);font-weight:600;font-size:13px;text-align:center">Acima de 12x depende do limite e do banco do cliente. Confirme antes de fechar.</td></tr>`;
        const on = SIM.pick.has(o.k), luc = r2(receita - SIM.custo - (base - o.recebe));
        html += `<tr class="${on?"sel":""}"><td><label class="check" style="font-weight:700"><input type="checkbox" data-pk="${o.k}" ${on?"checked":""}> ${o.label}</label></td><td class="r nw sub" style="display:table-cell">${P(o.t)}</td><td class="r nw"><b>${o.n>1 ? o.n+"x "+R(o.parcela) : R(o.total)}</b></td><td class="r nw">${R(o.total)}</td><td class="r nw">${R(o.recebe)}</td>${comLucro ? `<td class="r nw"><b class="${luc<0?"neg":""}">${R(luc)}</b></td>` : ""}</tr>`;
      });
      $("s-tab").innerHTML = html;
      $("s-tab").querySelectorAll("[data-pk]").forEach(cb => cb.onchange = () => { cb.checked ? SIM.pick.add(cb.dataset.pk) : SIM.pick.delete(cb.dataset.pk); SIM.mexeuPick = true; SIM.msgEditada = false; this.update(); });
    }
    if(!SIM.msgEditada) SIM.msg = base ? montarOrcamento({produto: SIM.produto, valor: SIM.valor, desconto: SIM.desconto, troca: SIM.troca, lacrado: SIM.lacrado, base, ops, pick: SIM.pick, cfg: S.msg}) : "";
    $("s-msg").value = SIM.msg;
    $("s-wa").href = waLink("", SIM.msg);
  }
};
function montarOrcamento(o){
  const c = o.cfg, L = [], add = t => { if(t && t.trim()) L.push(t.trim()); };
  add((c.abertura||"").replace(/\{loja\}/g, S.emp ? S.emp.nome : "")); if(L.length) L.push("");
  if(o.produto && o.produto.trim()) L.push("*" + o.produto.trim() + "*");
  if(o.desconto || o.troca){
    L.push("Valor: " + R(o.valor));
    if(o.desconto) L.push("Desconto: −" + R(o.desconto));
    if(o.troca) L.push("Seu aparelho na troca: −" + R(o.troca));
  }
  L.push("À vista no Pix: *" + R(o.base) + "*");
  const esc2 = o.ops.filter(x => o.pick.has(x.k));
  if(esc2.length){
    L.push(""); add(o.troca ? c.cartaoTroca : c.cartao);
    esc2.forEach(x => L.push("• " + (x.n === 0 ? "Débito: " + R(x.total) : x.n === 1 ? "1x de " + R(x.total) : x.n + "x de " + R(x.parcela) + " (total " + R(x.total) + ")")));
  }
  const fim = [];
  if(o.lacrado && c.lacrado.trim()) fim.push(c.lacrado.trim());
  if(o.troca && c.troca.trim()) fim.push(c.troca.trim());
  if(c.fechamento.trim()) fim.push(c.fechamento.trim());
  if(fim.length){ L.push(""); fim.forEach(t => L.push(t)); }
  return L.join("\n");
}



/* ---------- EDITAR VENDA ---------- */
const EV = {};
function modalEditarVenda(id){
  const v = S.vendas.find(x => x.id === id); if(!v) return;
  Object.assign(EV, {forma: v.forma, parc: v.parcelas || 12, modo: v.modo || "repassa", precos: (v.itens||[]).map(i => Number(i.preco)||0)});
  const formas = [["pix","Pix"],["dinheiro","Dinheiro"],["debito","Débito"],["credito","Crédito"]].concat(v.forma === "nao_informado" ? [["nao_informado","Não informado"]] : []);
  const vendedores = [...new Set(S.vendas.map(x => x.vendedor).filter(Boolean))];
  abrirModal("Editar venda", `<form class="form" id="ev-form" autocomplete="off">
      <div class="row"><div class="f"><label for="ev-cli">Cliente</label><input class="in" id="ev-cli" list="ev-clis" value="${esc(v.cliente && v.cliente.id ? v.cliente.nome : "")}" placeholder="Nome do cliente"><datalist id="ev-clis">${S.cli.map(c => `<option value="${esc(c.nome)}">`).join("")}</datalist></div>
        <div class="f"><label for="ev-fone">WhatsApp</label><input class="in" id="ev-fone" inputmode="tel" value="${esc(fone((v.cliente && v.cliente.fone) || ""))}"></div></div>
      <div class="row"><div class="f"><label for="ev-vend">Vendedor</label><input class="in" id="ev-vend" list="ev-vends" value="${esc(v.vendedor||"")}" placeholder="Quem fechou a venda"><datalist id="ev-vends">${vendedores.map(n => `<option value="${esc(n)}">`).join("")}</datalist></div>
        <div class="f"><label for="ev-orig">Como o cliente chegou</label><select class="in" id="ev-orig"><option value="">Não informado</option>${ORIGENS.map(o => `<option ${v.origem===o?"selected":""}>${o}</option>`).join("")}</select></div></div>
      <div class="row"><div class="f"><label for="ev-data">Data da venda</label><input class="in" id="ev-data" type="date" value="${v.semData ? "" : esc(v.data)}">${v.semData ? `<span class="hint">Esta venda está sem data. Preencha para corrigir.</span>` : ""}</div>
        <div class="f"><label for="ev-obs">Observação</label><input class="in" id="ev-obs" value="${esc(v.obs||"")}"></div></div>
      <div class="f"><span class="lbl">Valores dos itens</span><div class="form" style="gap:6px">${(v.itens||[]).map((it, i) => `<div class="item" style="grid-template-columns:minmax(0,1fr) 150px"><div><b>${esc(itNome(it))}</b><span class="sub">${it.brinde ? "Brinde" : esc(identFmt(it) || (it.u ? "Do estoque" : "Fora do estoque"))}${S.verCustos === false ? "" : " · custo " + R(it.custo)}</span></div>${it.brinde ? `<span class="sub" style="display:block;text-align:right">sem cobrar</span>` : `<input class="in" data-evp="${i}" inputmode="numeric" value="${R(it.preco)}" aria-label="Preço de ${esc(itNome(it))}">`}</div>`).join("")}</div>
        ${v.troca ? `<span class="hint">Troca: ${esc(v.troca.nome)} por ${R(v.troca.valor)}. Para mudar itens ou a troca, estorne e lance de novo.</span>` : `<span class="hint">Para trocar ou tirar itens, estorne a venda e lance de novo.</span>`}</div>
      <div class="f"><span class="lbl">Pagamento</span><div class="seg" role="group" aria-label="Forma de pagamento">${formas.map(([k,n]) => `<button type="button" data-evf="${k}" aria-pressed="${EV.forma===k}">${n}</button>`).join("")}</div></div>
      <div class="row" id="ev-cred" ${EV.forma==="credito"?"":"hidden"}><div class="f"><label for="ev-parc">Parcelas</label><select class="in" id="ev-parc">${Array.from({length:18},(_,i) => `<option value="${i+1}" ${EV.parc===i+1?"selected":""}>${i+1}x · taxa ${P(S.taxas.cred[i])}</option>`).join("")}</select></div>
        <div class="f"><span class="lbl">Quem paga a taxa</span><div class="seg" role="group" aria-label="Quem paga a taxa"><button type="button" data-evm="repassa" aria-pressed="${EV.modo==="repassa"}">Cliente</button><button type="button" data-evm="absorve" aria-pressed="${EV.modo==="absorve"}">A loja</button></div></div></div>
      <div id="ev-sum" class="card-b" style="background:var(--sunk);border-radius:12px;padding:12px 14px"></div>
      <div id="ev-msg"></div></form>`,
    `<button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-gold" type="button" id="ev-ok">Salvar alterações</button>`,
    () => {
      const mudouPag = () => EV.forma !== v.forma || (EV.forma === "credito" && (EV.parc !== v.parcelas || EV.modo !== (v.modo || "repassa")));
      const calc = () => {
        const itens = (v.itens||[]).map((it, i) => it.brinde ? {...it, preco: 0} : {...it, preco: EV.precos[i]});
        const receita = r2(sum(itens.map(i => i.preco))), cmv = r2(sum(itens.map(i => i.custo))), troca = v.troca ? (Number(v.troca.valor)||0) : 0;
        const aPagar = Math.max(0, r2(receita - troca));
        let clientePaga = v.clientePaga, recebido = v.recebido, taxaValor = v.taxaValor || 0, taxaPct = v.taxaPct || 0;
        if(mudouPag() || receita !== r2(v.receita)){ const pg = calcPag(aPagar, EV.forma, EV.parc, EV.modo); clientePaga = pg.clientePaga; recebido = pg.recebido; taxaValor = pg.taxaValor || 0; taxaPct = pg.taxaPct || 0; }
        return {itens, receita, cmv, aPagar, clientePaga, recebido, taxaValor, taxaPct, lucro: r2(receita - cmv - taxaValor)};
      };
      const resumo = () => { const c = calc();
        $("ev-sum").innerHTML = `<div class="sumrow"><span>Cliente paga</span><b>${R(c.clientePaga)}</b></div><div class="sumrow"><span>Você recebe</span><b>${R(c.recebido)}</b></div>${S.verCustos === false ? "" : `<div class="sumrow"><span>Lucro</span><b style="color:var(--gold-ink)">${R(c.lucro)}</b>${c.lucro !== r2(v.lucro) ? `<span class="sub" style="display:inline"> antes ${R(v.lucro)}</span>` : ""}</div>`}`; };
      document.querySelectorAll("#modal [data-evp]").forEach(inp => maskMoney(inp, () => { EV.precos[+inp.dataset.evp] = parseMoney(inp.value); resumo(); }));
      document.querySelectorAll("#modal [data-evf]").forEach(b => b.onclick = () => { EV.forma = b.dataset.evf; document.querySelectorAll("#modal [data-evf]").forEach(x => x.setAttribute("aria-pressed", x === b)); $("ev-cred").hidden = EV.forma !== "credito"; resumo(); });
      document.querySelectorAll("#modal [data-evm]").forEach(b => b.onclick = () => { EV.modo = b.dataset.evm; document.querySelectorAll("#modal [data-evm]").forEach(x => x.setAttribute("aria-pressed", x === b)); resumo(); });
      $("ev-parc").onchange = () => { EV.parc = +$("ev-parc").value; resumo(); };
      $("ev-cli").oninput = () => { const c = S.cli.find(x => norm(x.nome) === norm($("ev-cli").value)); if(c && c.fone && !$("ev-fone").value) $("ev-fone").value = fone(c.fone); };
      resumo();
      $("ev-ok").onclick = async () => {
        if((v.itens||[]).some((it, i) => !it.brinde && !EV.precos[i])) return $("ev-msg").innerHTML = `<div class="msg bad">Informe o preço de cada item.</div>`;
        if(v.troca && r2(sum(EV.precos)) < Number(v.troca.valor)) return $("ev-msg").innerHTML = `<div class="msg bad">O total ficou menor que o valor da troca.</div>`;
        if(!precisaNuvem()) return;
        const btn = $("ev-ok"); btn.disabled = true; btn.textContent = "Salvando…";
        try{
        const cliNome = $("ev-cli").value.trim(), cli = S.cli.find(x => norm(x.nome) === norm(cliNome));
        const precos = {}; (v.itens||[]).forEach((it, i) => { if(!it.brinde) precos[it.id] = EV.precos[i]; });
        await rpc("editar_venda", {p_venda: id, p: {data: $("ev-data").value || null, cliente: {id: cli ? cli.id : "", nome: cliNome, fone: soDig($("ev-fone").value)},
          vendedor: $("ev-vend").value.trim(), origem: $("ev-orig").value, obs: $("ev-obs").value.trim(),
          forma: EV.forma, parcelas: EV.forma === "credito" ? EV.parc : 1, modo: EV.forma === "credito" ? EV.modo : null, precos}});
        fecharModal(); await feito("Venda atualizada");
        }catch(e){ erroNuvem(e); btn.disabled = false; btn.textContent = "Salvar alterações"; }
      };
    });
}

/* ---------- TERMO DE ENTREGA ---------- */
function lojaInfo(){
  if(typeof S !== "undefined" && S.emp) return {nome: S.emp.nome, fone: S.emp.whatsapp || "", logo: S.emp.logo || "", cor: S.emp.cor || "#D5951D"};
  const img = document.querySelector(".mobtop img");
  return {nome: "South Import's", fone: "51992191293", logo: img ? img.src : "", cor: "#D5951D"};
}
function termoHtml(v){
  const L = lojaInfo(), c = v.cliente || {}, it = (v.itens||[]).filter(i => !i.brinde), br = (v.itens||[]).filter(i => i.brinde);
  const num = String(v.id || "").replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase();
  const pag = v.forma === "credito" ? `Cartão de crédito em ${v.parcelas}x de ${R(v.clientePaga/v.parcelas)}` : formaNome(v);
  const lac = it.some(i => i.cond !== "seminovo"), semi = it.some(i => i.cond === "seminovo");
  const linhaCli = [c.cpf ? "CPF " + cpfFmt(c.cpf) : "", c.fone ? fone(c.fone) : "", c.email || ""].filter(Boolean).join(" · ");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Termo de entrega ${esc(num)} · ${esc(L.nome)}</title>
<style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{margin:0;font:13.5px/1.5 -apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#17171a;background:#f3f2ef}
.folha{max-width:800px;margin:24px auto;background:#fff;padding:44px 48px;border-radius:10px;box-shadow:0 6px 30px rgba(0,0,0,.08)}
header{display:flex;justify-content:space-between;align-items:center;gap:20px;padding-bottom:18px;border-bottom:2px solid ${esc(L.cor)}}
.marca{display:flex;align-items:center;gap:14px}.marca img{max-height:58px;max-width:120px}.marca b{font-size:20px;letter-spacing:-.01em}.marca small{display:block;color:#6c6b70;font-size:12px}
.doc{text-align:right}.doc h1{margin:0;font-size:17px;letter-spacing:.02em;text-transform:uppercase}.doc span{color:#6c6b70;font-size:12px}
h2{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#6c6b70;margin:26px 0 8px}
.cli b{font-size:15px}.cli div{color:#45444a}
table{width:100%;border-collapse:collapse}th{text-align:left;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#6c6b70;border-bottom:1px solid #ddd;padding:8px 6px}
td{padding:10px 6px;border-bottom:1px solid #eee;vertical-align:top}td.r,th.r{text-align:right}.mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;color:#45444a}
.tag{display:inline-block;font-size:10.5px;font-weight:700;padding:1px 8px;border-radius:20px;background:#f1efe9;color:#6c6b70}
.brinde{background:#e8f4ec;color:#1b7a4a}
.tot{display:flex;justify-content:flex-end;margin-top:10px}.tot div{min-width:280px}.tot p{display:flex;justify-content:space-between;margin:4px 0}.tot p.big{font-size:16px;font-weight:700;border-top:1px solid #ddd;padding-top:8px;margin-top:8px}
.gar{background:#faf8f3;border-left:3px solid ${esc(L.cor)};padding:12px 16px;border-radius:6px}.gar p{margin:4px 0}
.decl{margin-top:22px;color:#45444a}
.ass{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:64px}.ass div{border-top:1px solid #17171a;padding-top:8px;text-align:center;font-size:12px}.ass small{display:block;color:#6c6b70}
footer{margin-top:34px;text-align:center;color:#8d8c92;font-size:11px}
.bar{max-width:800px;margin:16px auto 0;display:flex;justify-content:flex-end;gap:8px}.bar button{font:600 14px inherit;padding:10px 18px;border-radius:10px;border:0;background:#17171a;color:#fff;cursor:pointer}
@media print{body{background:#fff}.folha{margin:0;box-shadow:none;padding:0;max-width:none}.bar{display:none}}
@media (max-width:640px){.folha{padding:24px 18px;margin:0;border-radius:0}.ass{grid-template-columns:1fr;gap:40px}header{flex-direction:column;align-items:flex-start}.doc{text-align:left}}</style></head><body>
<div class="bar"><button onclick="window.print()">Imprimir ou salvar em PDF</button></div>
<div class="folha">
<header><div class="marca">${L.logo ? `<img src="${esc(L.logo)}" alt="">` : ""}<div><b>${esc(L.nome)}</b>${L.fone ? `<small>WhatsApp ${esc(fone(L.fone))}</small>` : ""}</div></div>
<div class="doc"><h1>Termo de entrega</h1><span>Nº ${esc(num)} · ${v.semData ? "outubro de 2026" : dataBR(v.data)}</span></div></header>
<h2>Cliente</h2><div class="cli"><b>${esc(c.nome || "Cliente")}</b>${linhaCli ? `<div>${esc(linhaCli)}</div>` : ""}${endTxt(c.end) ? `<div>${esc(endTxt(c.end))}</div>` : ""}</div>
<h2>Produtos entregues</h2>
<table><thead><tr><th>Produto</th><th>Identificação</th><th>Condição</th><th class="r">Valor</th></tr></thead><tbody>
${it.map(i => `<tr><td><b>${esc(itNome(i))}</b></td><td class="mono">${i.ident ? (i.tipo === "serie" ? "Série " : "IMEI ") + esc(i.ident) : "—"}</td><td><span class="tag">${i.cond === "seminovo" ? "Seminovo" : "Lacrado"}</span></td><td class="r">${R(i.preco)}</td></tr>`).join("")}
${br.map(i => `<tr><td><b>${esc(itNome(i))}</b></td><td class="mono">—</td><td><span class="tag brinde">Brinde</span></td><td class="r">cortesia</td></tr>`).join("")}
</tbody></table>
<div class="tot"><div>
<p><span>Produtos</span><span>${R(v.receita)}</span></p>
${v.troca ? `<p><span>Aparelho na troca (${esc(v.troca.nome)}${v.troca.ident ? " · " + esc(v.troca.ident) : ""})</span><span>− ${R(v.troca.valor)}</span></p>` : ""}
<p class="big"><span>Total pago</span><span>${R(v.clientePaga)}</span></p>
<p><span>Forma de pagamento</span><span>${esc(pag)}</span></p>
</div></div>
<h2>Garantia</h2><div class="gar">
${lac ? `<p><b>Produtos lacrados:</b> garantia total da Apple, a partir da data de ativação.</p>` : ""}
${semi ? `<p><b>Aparelhos seminovos:</b> garantia da loja nas condições combinadas no atendimento.</p>` : ""}
${br.length ? `<p><b>Brindes:</b> cortesia da loja, sem valor comercial nesta venda.</p>` : ""}
<p>A garantia não cobre quedas, contato com líquidos, mau uso ou abertura do aparelho por terceiros.</p></div>
<p class="decl">Declaro que recebi os produtos acima em perfeito estado, conferi o funcionamento e a identificação de cada aparelho, e estou de acordo com as condições deste termo.</p>
<div class="ass"><div>${esc(c.nome || "Cliente")}<small>Cliente${c.cpf ? " · CPF " + esc(cpfFmt(c.cpf)) : ""}</small></div><div>${esc(L.nome)}<small>${esc(v.vendedor || "Responsável pela entrega")}</small></div></div>
<footer>${esc(L.nome)} · Termo gerado em ${dataBR(hoje())}</footer>
</div></body></html>`;
}
function abrirTermo(v){
  const html = termoHtml(v), nomeArq = "termo-entrega-" + norm((v.cliente && v.cliente.nome) || "cliente").replace(/[^a-z0-9]+/g, "-") + ".html";
  abrirModal("Termo de entrega", `<iframe title="Termo de entrega" id="tm-frame" style="width:100%;height:60vh;border:1px solid var(--line);border-radius:10px;background:#fff"></iframe>
    <p class="sub" id="tm-h" style="margin:10px 0 0">${"saas" === "saas" ? "Abra para imprimir ou salvar em PDF e colher a assinatura do cliente." : "Baixe o termo, abra o arquivo no navegador e use “Imprimir ou salvar em PDF”."}</p>`,
    `<button class="btn btn-ghost" type="button" data-close>Fechar</button><div class="acts"><button class="btn btn-gold" type="button" id="tm-ok">${"saas" === "saas" ? "Abrir para imprimir" : "Baixar termo"}</button></div>`,
    () => {
      const f = $("tm-frame"); f.srcdoc = html.replace('<div class="bar">', '<div class="bar" style="display:none">');
      $("tm-ok").onclick = async () => {
        if("saas" === "saas"){
          const w = window.open("", "_blank");
          if(w){ w.document.open(); w.document.write(html); w.document.close(); setTimeout(() => { try{ w.focus(); w.print(); }catch(e){} }, 400); }
          else { try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){ toast("Libere as janelas pop-up para imprimir."); } }
          return;
        }
        try{
          const dl = window.claude && await window.claude.use("downloads");
          if(!dl) return toast("Não consegui baixar aqui. Use o Copiar no recibo.");
          await dl.save({filename: nomeArq, data: new Blob([html], {type: "text/html"})});
          toast("Termo baixado. Abra o arquivo para imprimir ou salvar em PDF.");
        }catch(e){ if(!e || e.code !== "declined") toast("Não consegui baixar o termo agora."); }
      };
    });
}

/* ---------- VENDAS DO MÊS ---------- */
V.vendas = {
  mount(){
    return `<div class="head"><div><h1>Vendas de ${mesNome(S.mes)}</h1><p>Quanto cada produto vendeu, a que preço e com qual lucro</p></div><div class="acts"><a class="btn btn-gold" href="#venda" data-go="venda">+ Nova venda</a></div></div>
      ${monthNav()}
      <div class="kpis" id="vm-kpis"></div>
      <div class="card"><div class="card-h"><h2>Por produto</h2><p>preços de cada venda, preço médio e custo médio</p></div><div class="tw"><table><thead><tr><th>Produto</th><th class="r">Qtd</th><th>Vendido a</th><th class="r">Preço médio</th><th class="r">Custo médio</th><th class="r">Lucro</th></tr></thead><tbody id="vm-sku">${loadingRow(6)}</tbody></table></div></div>
      <div class="grid2b"><div class="card"><div class="card-h"><h2>Por vendedor</h2></div><div class="tw"><table><thead><tr><th>Vendedor</th><th class="r">Vendas</th><th class="r">Vendido</th><th class="r">Lucro</th></tr></thead><tbody id="vm-vend">${loadingRow(4)}</tbody></table></div></div>
        <div class="card"><div class="card-h"><h2>Como os clientes chegaram</h2></div><div class="tw"><table><thead><tr><th>Origem</th><th class="r">Vendas</th><th class="r">Vendido</th><th class="r">Lucro</th></tr></thead><tbody id="vm-orig">${loadingRow(4)}</tbody></table></div></div></div>
      <div class="card"><div class="card-h"><h2>Todas as vendas</h2></div><div class="tw"><table><thead><tr><th>Data</th><th>Cliente</th><th>Itens</th><th>Pagamento</th><th class="r">Valor</th><th class="r">Taxa</th><th class="r">Lucro</th><th></th></tr></thead><tbody id="vm-lista">${loadingRow(8)}</tbody></table></div></div>`;
  },
  bind(){ bindMonth(); },
  update(){
    const d = dre(S.mes);
    refreshMonth();
    $("vm-kpis").innerHTML = `
      <div class="kpi"><small>Vendido</small><b>${R(d.receita)}</b><span>${N(d.vs.length)} ${d.vs.length===1?"venda":"vendas"}</span></div>
      <div class="kpi"><small>Itens vendidos</small><b>${N(d.itens)}</b><span>ticket médio ${R(d.vs.length ? d.receita/d.vs.length : 0)}</span></div>
      <div class="kpi"><small>Custo + taxas</small><b>${R(d.cmv + d.taxas)}</b><span>${R(d.taxas)} em taxas de cartão</span></div>
      <div class="kpi hl"><small>Lucro bruto</small><b>${R(d.bruto)}</b><span>margem ${P(d.margem)}</span></div>`;
    if(!carregado()) return;
    const g = {};
    const brindesMes = []; d.vs.forEach(v => (v.itens||[]).forEach(it => { if(it.brinde){ brindesMes.push(it); return; } const k = it.sku; (g[k] = g[k] || {nome: it.nome, precos:[], custos:[]}); g[k].precos.push(Number(it.preco)||0); g[k].custos.push(Number(it.custo)||0); }));
    const ks = Object.keys(g).sort((a,b) => sum(g[b].precos) - sum(g[a].precos));
    $("vm-sku").innerHTML = ks.length ? ks.map(k => { const x = g[k], luc = sum(x.precos) - sum(x.custos);
      return `<tr><td><b>${esc(S.skus[k] ? S.skus[k].nome : x.nome)}</b>${skuCod(k) ? `<span class="sub">${skuCod(k)}</span>` : ""}</td><td class="r"><b>${x.precos.length}</b></td><td><div class="prices">${x.precos.map(p => `<span>${R(p)}</span>`).join("")}</div></td><td class="r nw">${R(avg(x.precos))}</td><td class="r nw">${R(avg(x.custos))}</td><td class="r nw"><b>${R(luc)}</b></td></tr>`; }).join("") +
      `<tr><td><b>Total</b></td><td class="r"><b>${d.itens}</b></td><td class="sub">sem descontar taxas de cartão</td><td></td><td></td><td class="r nw"><b>${R(d.receita - d.cmv)}</b></td></tr>` +
      (brindesMes.length ? `<tr><td><b>Brindes dados</b><span class="sub">${esc([...new Set(brindesMes.map(itNome))].join(", "))}</span></td><td class="r">${brindesMes.length}</td><td class="sub">sem cobrar do cliente</td><td></td><td class="r nw">${R(avg(brindesMes.map(i => Number(i.custo)||0)))}</td><td class="r nw neg">− ${R(sum(brindesMes.map(i => i.custo)))}</td></tr>` : "")
      : `<tr><td colspan="6" class="empty"><b>Nenhuma venda em ${mesNome(S.mes)}</b>Registre em Nova venda. Para lançar vendas antigas, mude a data da venda.</td></tr>`;
    const agrupa = (campo, el) => { const g = {}; d.vs.forEach(v => { const k = v[campo] || "Não informado"; const x = g[k] = g[k] || {n:0, rec:0, luc:0}; x.n++; x.rec += Number(v.receita)||0; x.luc += Number(v.lucro)||0; });
      const ks = Object.keys(g).sort((a,b) => g[b].luc - g[a].luc);
      $(el).innerHTML = ks.length ? ks.map(k => `<tr><td><b>${esc(k)}</b></td><td class="r">${g[k].n}</td><td class="r nw">${R(g[k].rec)}</td><td class="r nw"><b>${R(g[k].luc)}</b></td></tr>`).join("") : `<tr><td colspan="4" class="empty">Nenhuma venda neste mês.</td></tr>`; };
    agrupa("vendedor", "vm-vend"); agrupa("origem", "vm-orig");
    $("vm-lista").innerHTML = d.vs.length ? d.vs.map(v => `<tr><td class="nw">${dataV(v)}</td><td>${esc(v.cliente && v.cliente.nome || "—")}${v.vendedor || v.origem ? `<span class="sub">${esc([v.vendedor, v.origem].filter(Boolean).join(" · "))}</span>` : ""}</td><td>${esc((v.itens||[]).map(itNome).join(", "))}${v.troca ? `<span class="sub">Troca: ${esc(v.troca.nome)} · ${R(v.troca.valor)}</span>` : ""}</td><td class="nw">${formaNome(v)}${v.modo==="repassa" ? '<span class="sub">taxa paga pelo cliente</span>' : ""}</td><td class="r nw">${R(v.receita)}</td><td class="r nw">${v.taxaValor ? R(v.taxaValor) : "—"}</td><td class="r nw"><b>${R(v.lucro)}</b></td><td class="r nw"><button class="btn btn-ghost btn-sm" type="button" data-rec="${v.id}">Recibo</button> <button class="btn btn-ghost btn-sm" type="button" data-edv="${v.id}">Editar</button> <button class="btn btn-danger btn-sm" type="button" data-est="${v.id}">Estornar</button></td></tr>`).join("")
      : `<tr><td colspan="8" class="empty">Nenhuma venda neste mês.</td></tr>`;
    $("vm-lista").querySelectorAll("[data-rec]").forEach(b => b.onclick = () => modalRecibo(b.dataset.rec));
    $("vm-lista").querySelectorAll("[data-edv]").forEach(b => b.onclick = () => modalEditarVenda(b.dataset.edv));
    $("vm-lista").querySelectorAll("[data-est]").forEach(b => b.onclick = e => confirmar(e.currentTarget, "Confirmar estorno", () => estornar(b.dataset.est)));
  }
};
async function estornar(id){
  if(!precisaNuvem()) return;
  const v = S.vendas.find(x => x.id === id); if(!v) return;
  if(v.troca && v.troca.u){
    const tu = S.un.find(u => u.id === v.troca.u);
    if(tu && tu.status !== "estoque"){ toast("O aparelho da troca já foi vendido. Estorne aquela venda primeiro."); return; }
  }
  try{
    await rpc("estornar_venda", {p_venda: id});
    await feito("Venda estornada. Os aparelhos voltaram ao estoque.");
  }catch(e){ erroNuvem(e); }
}
function modalRecibo(id){
  const v = S.vendas.find(x => x.id === id); if(!v) return;
  const t = textoRecibo(v);
  const cdados = [v.cliente.cpf ? "CPF "+cpfFmt(v.cliente.cpf) : "", v.cliente.email || "", endTxt(v.cliente.end)].filter(Boolean);
  abrirModal("Recibo · "+esc(v.cliente.nome), `${cdados.length ? `<p class="sub" style="margin:0 0 12px">${cdados.map(esc).join("<br>")}</p>` : ""}<textarea class="receipt" id="r-txt">${esc(t)}</textarea>
    <div class="row" style="margin-top:14px"><div class="sumrow"><span>Você recebeu</span><b>${R(v.recebido)}</b></div><div class="sumrow"><span>Lucro</span><b style="color:var(--gold-ink)">${R(v.lucro)}</b></div></div>`,
    `<button class="btn btn-gold" type="button" id="r-termo">Termo de entrega</button><button class="btn btn-ghost" type="button" id="r-copy">${ic("copy")} Copiar</button><a class="btn btn-wa" id="r-wa" target="_blank" rel="noopener" href="${waLink(v.cliente.fone, t)}">${ic("wa")} Abrir no WhatsApp</a>`,
    () => { $("r-termo").onclick = () => { fecharModal(); abrirTermo(v); }; $("r-copy").onclick = () => copiar($("r-txt").value, $("r-txt")); $("r-txt").oninput = () => $("r-wa").href = waLink(v.cliente.fone, $("r-txt").value); });
}

/* ---------- FINANCEIRO ---------- */
const FIN = {tipo:"despesa"};
V.financeiro = {
  mount(){
    return `<div class="head"><div><h1>Financeiro</h1><p>O resultado do mês: vendas, custos, despesas e pró-labore</p></div></div>
      ${monthNav()}
      <div class="kpis" id="f-kpis"></div>
      <div class="grid2">
        <div class="card"><div class="card-h"><h2>Resultado de ${mesNome(S.mes)}</h2></div><div class="tw"><table class="dre"><tbody id="f-dre">${loadingRow(2)}</tbody></table></div></div>
        <div class="card"><div class="card-h"><h2>Novo lançamento</h2></div><div class="card-b"><form class="form" id="f-form" autocomplete="off">
          <div class="seg" role="group" aria-label="Tipo de lançamento">${[["despesa","Despesa"],["prolabore","Pró-labore"],["entrada","Outra entrada"]].map(([k,n]) => `<button type="button" data-ftipo="${k}" aria-pressed="${FIN.tipo===k}">${n}</button>`).join("")}</div>
          <div class="row"><div class="f"><label for="f-data">Data</label><input class="in" id="f-data" type="date" value="${S.mes === hoje().slice(0,7) ? hoje() : S.mes+"-01"}"></div><div class="f"><label for="f-valor">Valor</label><input class="in" id="f-valor" inputmode="numeric" placeholder="R$ 0,00"></div></div>
          <div class="f" id="f-catf"><label for="f-cat">Categoria</label><select class="in" id="f-cat">${DESP.map(c => `<option>${c}</option>`).join("")}</select></div>
          <div class="f" id="f-pesf" hidden><label for="f-pes">Sócio</label><input class="in" id="f-pes" list="f-pess" placeholder="Nome de quem recebeu"><datalist id="f-pess">${[...new Set(S.lanc.filter(l => l.pessoa).map(l => l.pessoa))].map(p => `<option value="${esc(p)}">`).join("")}</datalist></div>
          <div class="f"><label for="f-desc">Descrição</label><input class="in" id="f-desc" placeholder="Ex.: aluguel da loja, impulsionamento do Instagram"></div>
          <label class="check" id="f-fixaf"><input type="checkbox" id="f-fixa"> Repete todo mês</label>
          <div id="f-msg"></div>
          <button class="btn btn-gold" type="submit">Lançar</button></form></div></div>
      </div>
      <div class="card"><div class="card-h"><h2>Lançamentos de ${mesNome(S.mes)}</h2><div id="f-copiar"></div></div><div class="tw"><table><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th class="r">Valor</th><th></th></tr></thead><tbody id="f-lista">${loadingRow(5)}</tbody></table></div></div>`;
  },
  bind(){
    bindMonth(); maskMoney($("f-valor"));
    const setTipo = t => { FIN.tipo = t; document.querySelectorAll("[data-ftipo]").forEach(x => x.setAttribute("aria-pressed", x.dataset.ftipo===t)); $("f-catf").hidden = t !== "despesa"; $("f-pesf").hidden = t !== "prolabore"; $("f-fixaf").hidden = t === "entrada"; };
    document.querySelectorAll("[data-ftipo]").forEach(b => b.onclick = () => setTipo(b.dataset.ftipo)); setTipo(FIN.tipo);
    $("f-form").onsubmit = async e => {
      e.preventDefault(); if(!precisaNuvem()) return;
      const valor = parseMoney($("f-valor").value), data = $("f-data").value || hoje(), msg = $("f-msg");
      if(!valor) return msg.innerHTML = `<div class="msg bad">Informe o valor.</div>`;
      if(FIN.tipo === "prolabore" && !$("f-pes").value.trim()) return msg.innerHTML = `<div class="msg bad">Informe o sócio que recebeu.</div>`;
      try{
        await q(sb.from("lancamentos").insert({empresa_id: S.emp.id, tipo: FIN.tipo, data, valor, cat: FIN.tipo==="despesa" ? $("f-cat").value : "", pessoa: FIN.tipo==="prolabore" ? $("f-pes").value.trim() : "", descr: $("f-desc").value.trim(), fixa: FIN.tipo !== "entrada" && $("f-fixa").checked}));
        await recarregar();
        $("f-valor").value = ""; $("f-desc").value = ""; $("f-fixa").checked = false; msg.innerHTML = "";
        toast(data.slice(0,7) === S.mes ? "Lançado" : "Lançado em "+mesNome(data.slice(0,7)));
      }catch(err){ erroNuvem(err); }
    };
  },
  update(){
    const d = dre(S.mes);
    refreshMonth();
    $("f-kpis").innerHTML = `
      <div class="kpi"><small>Lucro bruto das vendas</small><b>${R(d.bruto)}</b><span>${R(d.receita)} vendidos</span></div>
      <div class="kpi"><small>Despesas</small><b>${R(d.totDesp)}</b><span>${Object.keys(d.desp).length} ${Object.keys(d.desp).length===1?"categoria":"categorias"}</span></div>
      <div class="kpi"><small>Pró-labore</small><b>${R(d.totPro)}</b><span>${Object.keys(d.pro).map(esc).join(" e ") || "nenhum lançado"}</span></div>
      <div class="kpi hl"><small>Resultado do mês</small><b class="${d.resultado<0?"neg":""}">${R(d.resultado)}</b><span>${d.receita ? "sobra "+P(d.resultado/d.receita*100)+" do vendido" : "—"}</span></div>`;
    if(!carregado()) return;
    const linha = (n, v, cls="", ind=false) => `<tr class="${cls}"><td class="${ind?"ind":""}">${n}</td><td class="r nw ${v<0&&cls==="fim"?"neg":""}">${ind ? R(Math.abs(v)) : R(v)}</td></tr>`;
    $("f-dre").innerHTML = linha("Vendas", d.receita, "t") +
      linha("(−) Custo dos aparelhos vendidos", -d.cmv, "", true) + linha("(−) Taxas de cartão", -d.taxas, "", true) +
      linha("Lucro bruto", d.bruto, "t") +
      (d.entradas ? linha("(+) Outras entradas", d.entradas, "", true) : "") +
      (Object.keys(d.desp).length ? Object.entries(d.desp).sort((a,b)=>b[1]-a[1]).map(([k,v]) => linha("(−) "+esc(k), -v, "", true)).join("") : linha("(−) Despesas", 0, "", true)) +
      (Object.keys(d.pro).length ? Object.entries(d.pro).map(([k,v]) => linha("(−) Pró-labore · "+esc(k), -v, "", true)).join("") : linha("(−) Pró-labore", 0, "", true)) +
      linha("Resultado do mês", d.resultado, "fim");
    $("f-lista").innerHTML = d.ls.length ? d.ls.map(l => `<tr><td class="nw">${dataV(l)}</td><td class="nw">${l.tipo==="despesa" ? `<span class="tag t-bad">Despesa</span>` : l.tipo==="prolabore" ? `<span class="tag t-lac">Pró-labore</span>` : `<span class="tag t-ok">Entrada</span>`}${l.fixa ? ' <span class="tag t-semi">fixa</span>' : ""}</td><td>${esc(l.tipo==="despesa" ? l.cat : l.tipo==="prolabore" ? l.pessoa : "Outra entrada")}${l.desc ? `<span class="sub">${esc(l.desc)}</span>` : ""}</td><td class="r nw"><b>${l.tipo==="entrada" ? "" : "− "}${R(l.valor)}</b></td><td class="r"><button class="btn btn-danger btn-sm" type="button" data-del="${l.id}">Apagar</button></td></tr>`).join("")
      : `<tr><td colspan="5" class="empty"><b>Nenhum lançamento em ${mesNome(S.mes)}</b>Lance aluguel, anúncios, embalagens e o pró-labore de cada sócio para ver o resultado real do mês.</td></tr>`;
    $("f-lista").querySelectorAll("[data-del]").forEach(b => b.onclick = e => confirmar(e.currentTarget, "Confirmar", async () => { if(!precisaNuvem()) return; try{ await q(sb.from("lancamentos").delete().eq("id", b.dataset.del)); await feito("Lançamento apagado"); }catch(err){ erroNuvem(err); } }));
    const ant = mesMais(S.mes, -1), fixos = S.lanc.filter(l => l.mes === ant && l.fixa);
    const jaTem = f => d.ls.some(l => l.tipo === f.tipo && l.cat === f.cat && l.pessoa === f.pessoa && l.desc === f.desc && Number(l.valor) === Number(f.valor));
    const faltam = fixos.filter(f => !jaTem(f));
    $("f-copiar").innerHTML = faltam.length ? `<button class="btn btn-ghost btn-sm" type="button" id="f-cp">Copiar ${faltam.length} ${faltam.length===1?"fixo":"fixos"} de ${mesCurto(ant)}</button>` : "";
    if(faltam.length) $("f-cp").onclick = async () => {
      if(!precisaNuvem()) return;
      try{ await q(sb.from("lancamentos").insert(faltam.map(f => ({empresa_id: S.emp.id, tipo: f.tipo, data: S.mes+"-"+String(Math.min(+f.data.slice(8,10), 28)).padStart(2,"0"), valor: f.valor, cat: f.cat||"", pessoa: f.pessoa||"", descr: f.desc||"", fixa: true})))); await feito("Lançamentos fixos copiados"); }catch(e){ erroNuvem(e); }
    };
  }
};

/* ---------- CLIENTES ---------- */
const CL = {q:"", filtro:""};
V.clientes = {
  mount(){
    return `<div class="head"><div><h1>Clientes</h1><p id="c-res">Carregando…</p></div><div class="acts"><button class="btn btn-ghost" type="button" id="c-novo">+ Cliente</button></div></div>
      <div class="bar"><input class="search" id="c-q" type="search" placeholder="Buscar por nome, telefone ou CPF" value="${esc(CL.q)}" aria-label="Buscar cliente">
        <button class="chip" type="button" data-cf="" aria-pressed="${!CL.filtro}">Todos</button><button class="chip" type="button" data-cf="aniv" aria-pressed="${CL.filtro==="aniv"}">Aniversário este mês</button><button class="chip" type="button" data-cf="ano" aria-pressed="${CL.filtro==="ano"}">Última compra há +1 ano</button></div>
      <div class="card"><div class="tw"><table><thead><tr><th>Cliente</th><th>WhatsApp</th><th>CPF</th><th class="r">Compras</th><th class="r">Total comprado</th><th>Última compra</th><th>Aniversário</th><th></th></tr></thead><tbody id="c-lista">${loadingRow(8)}</tbody></table></div></div>`;
  },
  bind(){
    $("c-q").oninput = e => { CL.q = e.target.value; this.update(); };
    $("c-novo").onclick = () => modalCliente();
    document.querySelectorAll("[data-cf]").forEach(b => b.onclick = () => { CL.filtro = b.dataset.cf; document.querySelectorAll("[data-cf]").forEach(x => x.setAttribute("aria-pressed", x===b)); this.update(); });
  },
  update(){
    if(!carregado()) return;
    const hist = {};
    S.vendas.forEach(v => { const id = v.cliente && v.cliente.id; if(!id) return; const h = hist[id] = hist[id] || {n:0, tot:0, ult:"", ultItem:""}; h.n++; h.tot += Number(v.receita)||0; if(v.data > h.ult || !h.ultV){ h.ult = v.data; h.ultV = v; h.ultItem = (v.itens||[]).map(itNome).join(", "); } });
    const mesAtual = hoje().slice(5,7), q = norm(CL.q), qd = soDig(CL.q), umAno = mesMais(hoje().slice(0,7), -12) + hoje().slice(7);
    let l = S.cli.filter(c => {
      if(q && !norm(c.nome).includes(q) && !(qd.length>=3 && (soDig(c.fone).includes(qd) || soDig(c.cpf).includes(qd)))) return false;
      if(CL.filtro === "aniv") return c.nasc && c.nasc.slice(3,5) === mesAtual;
      if(CL.filtro === "ano") return hist[c.id] && hist[c.id].ult <= umAno;
      return true;
    });
    $("c-res").textContent = `${N(S.cli.length)} ${S.cli.length===1?"cliente":"clientes"}`;
    $("c-lista").innerHTML = l.length ? l.map(c => { const h = hist[c.id] || {n:0,tot:0};
      const msgTxt = CL.filtro==="aniv" ? `Olá, ${c.nome.split(" ")[0]}! A equipe da ${S.emp ? S.emp.nome : "nossa loja"} deseja um feliz aniversário!` : h.ult ? `Olá, ${c.nome.split(" ")[0]}! Tudo bem? Aqui é da ${S.emp ? S.emp.nome : "nossa loja"}. Como está o seu ${h.ultItem.split(",")[0]}?` : `Olá, ${c.nome.split(" ")[0]}! Aqui é da ${S.emp ? S.emp.nome : "nossa loja"}.`;
      return `<tr><td><b>${esc(c.nome)}</b>${h.ultItem ? `<span class="sub">${esc(h.ultItem)}</span>` : ""}</td><td class="nw">${esc(fone(c.fone)) || '<span class="sub">—</span>'}</td><td class="nw mono">${c.cpf ? esc(cpfFmt(c.cpf)) : '<span class="sub">—</span>'}</td><td class="r">${h.n}</td><td class="r nw">${R(h.tot)}</td><td class="nw">${h.ultV ? (h.ultV.semData ? mesCurto(h.ultV.mes).replace(/^./,x=>x.toUpperCase()) : dataBR(h.ult)) : "—"}</td><td class="nw">${esc(c.nasc||"—")}</td>
        <td class="r nw">${c.fone ? `<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${waLink(c.fone, msgTxt)}">WhatsApp</a> ` : ""}<button class="btn btn-ghost btn-sm" type="button" data-ced="${c.id}">Editar</button></td></tr>`; }).join("")
      : `<tr><td colspan="8" class="empty">${S.cli.length ? "Nenhum cliente com esse filtro." : "<b>Nenhum cliente ainda</b>Os clientes são cadastrados automaticamente a cada venda."}</td></tr>`;
    $("c-lista").querySelectorAll("[data-ced]").forEach(b => b.onclick = () => modalCliente(b.dataset.ced));
  }
};
function modalCliente(id){
  const c = id ? S.cli.find(x => x.id === id) : {nome:"", fone:"", nasc:"", cpf:"", email:"", end:null};
  if(!c) return;
  abrirModal(id ? "Editar cliente" : "Novo cliente", `<form class="form" id="m-form" autocomplete="off"><div class="f"><label for="c-nome">Nome</label><input class="in" id="c-nome" value="${esc(c.nome)}"></div>
    <div class="row"><div class="f"><label for="c-fone">WhatsApp</label><input class="in" id="c-fone" inputmode="tel" value="${esc(fone(c.fone))}"></div><div class="f"><label for="c-nasc">Aniversário (dia/mês)</label><input class="in" id="c-nasc" inputmode="numeric" placeholder="dd/mm" maxlength="5" value="${esc(c.nasc||"")}"></div></div>${camposCli("cc")}<div id="c-msg"></div></form>`,
    `${id ? `<button class="btn btn-danger" type="button" id="c-del">Apagar</button>` : "<span></span>"}<div class="acts"><button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-gold" type="button" id="c-ok">Salvar</button></div>`,
    () => {
      ligarCli("cc"); preencherCli("cc", c, false);
      $("c-nasc").oninput = e => { let d = soDig(e.target.value).slice(0,4); e.target.value = d.length > 2 ? d.slice(0,2)+"/"+d.slice(2) : d; };
      const ok = async () => {
        const nome = $("c-nome").value.trim(), nasc = $("c-nasc").value.trim();
        if(!nome) return $("c-msg").innerHTML = `<div class="msg bad">Informe o nome.</div>`;
        if(nasc && !/^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])$/.test(nasc)) return $("c-msg").innerHTML = `<div class="msg bad">Aniversário no formato dia/mês, por exemplo 03/11.</div>`;
        const ec = cliValido("cc"); if(ec) return $("c-msg").innerHTML = `<div class="msg bad">${ec}</div>`;
        if(!precisaNuvem()) return;
        try{ const dd = lerCli("cc"), body = {nome, fone: soDig($("c-fone").value), nasc, cpf: dd.cpf, email: dd.email, end: END_K.some(k => dd.end[k]) ? dd.end : null};
          const linha = {nome: body.nome, fone: body.fone, nasc: body.nasc, cpf: body.cpf, email: body.email, endereco: body.end};
          if(id) await q(sb.from("clientes").update(linha).eq("id", id)); else await q(sb.from("clientes").insert({empresa_id: S.emp.id, ...linha}));
          await recarregar();
          fecharModal(); toast("Cliente salvo"); }catch(e){ erroNuvem(e); }
      };
      $("c-ok").onclick = ok; $("m-form").onsubmit = e => { e.preventDefault(); ok(); };
      if(id) $("c-del").onclick = e => confirmar(e.currentTarget, "Toque de novo para apagar", async () => { try{ await q(sb.from("clientes").delete().eq("id", id)); fecharModal(); await feito("Cliente apagado. As vendas dele continuam registradas."); }catch(err){ erroNuvem(err); } });
    });
}

/* ---------- TAXAS ---------- */
V.ajustes = {
  mount(){
    return `<div class="head"><div><h1>Taxas e orçamento</h1><p>As taxas valem para o Simulador e a Nova venda. A mensagem padrão monta o orçamento do Simulador.</p></div><div class="acts"><a class="btn btn-ghost" href="#simulador" data-go="simulador">Abrir simulador</a></div></div>
      <div class="card"><div class="card-b form">
        <div class="rates"><div class="f"><label for="t-deb">Débito</label><input class="in" id="t-deb" inputmode="decimal" placeholder="não informada"></div>
          ${Array.from({length:18},(_,i) => `<div class="f"><label for="t-${i}">${i+1}x</label><input class="in" id="t-${i}" inputmode="decimal"></div>`).join("")}</div>
        <p class="sub" style="margin:0">Em porcentagem. Coloque as taxas da sua maquininha. O Simulador e a Nova venda usam estas mesmas taxas.</p>
        <div id="t-msg"></div>
        <div class="acts"><button class="btn btn-gold" type="button" id="t-ok">Salvar taxas</button><button class="btn btn-ghost" type="button" id="t-pad">Usar taxas de exemplo</button></div>
      </div></div>
      <div class="card"><div class="card-h"><h2>Mensagem padrão do orçamento</h2><p>Usada no Simulador para montar o orçamento do WhatsApp</p></div><div class="card-b">
        <div class="grid2b" style="align-items:start">
          <div class="form">
            <div class="f"><label for="om-abertura">Abertura</label><textarea class="in" id="om-abertura" rows="2"></textarea></div>
            <div class="row"><div class="f"><label for="om-cartao">Título das parcelas</label><input class="in" id="om-cartao"></div>
              <div class="f"><label for="om-cartaoTroca">Título das parcelas com troca</label><input class="in" id="om-cartaoTroca"></div></div>
            <div class="f"><label for="om-lacrado">Linha para produto lacrado</label><textarea class="in" id="om-lacrado" rows="2"></textarea></div>
            <div class="f"><label for="om-troca">Linha quando tem troca</label><textarea class="in" id="om-troca" rows="2"></textarea></div>
            <div class="f"><label for="om-fechamento">Encerramento</label><textarea class="in" id="om-fechamento" rows="2"></textarea></div>
            <div class="f"><span class="lbl">Parcelas que já vêm marcadas</span><div class="bar" id="om-pick"></div></div>
            <div id="om-res"></div>
            <div class="acts"><button class="btn btn-gold" type="button" id="om-salvar">Salvar mensagem</button><button class="btn btn-ghost" type="button" id="om-padrao">Voltar à mensagem original</button></div>
          </div>
          <div class="f"><span class="lbl">Prévia com um exemplo</span><textarea class="receipt" id="om-prev" readonly style="min-height:420px" aria-label="Prévia do orçamento"></textarea><span class="hint">Exemplo: iPhone 18 Pro Max 256 GB por R$ 12.300,00 com troca de R$ 3.000,00. Deixe uma linha em branco para não usá-la.</span></div>
        </div></div></div>`;
  },
  bind(){
    const fill = () => { $("t-deb").value = S.taxas.deb == null ? "" : String(S.taxas.deb).replace(".",","); S.taxas.cred.forEach((t,i) => $("t-"+i).value = String(r2(t)).replace(".",",")); };
    fill(); this.fill = fill;
    const MP = {pick: new Set(S.msg.pick)};
    const opsExemplo = () => { const base = 9300, out = []; if(S.taxas.deb != null) out.push({k:"deb", n:0, t:S.taxas.deb}); S.taxas.cred.forEach((t,i) => out.push({k:String(i+1), n:i+1, t}));
      return out.map(o => { const total = r2(base/(1-o.t/100)); return {...o, total, parcela: total/Math.max(o.n,1)}; }); };
    const lerMsg = () => { const m = {}; MSG_K.forEach(k => m[k] = $("om-"+k).value); m.pick = [...MP.pick]; return m; };
    const preview = () => { $("om-prev").value = montarOrcamento({produto:"iPhone 18 Pro Max 256 GB", valor:12300, desconto:0, troca:3000, lacrado:true, base:9300, ops:opsExemplo(), pick:MP.pick, cfg:lerMsg()}); };
    const chips = () => { const ks = (S.taxas.deb != null ? ["deb"] : []).concat(Array.from({length:18},(_,i) => String(i+1)));
      $("om-pick").innerHTML = ks.map(k => `<button type="button" class="chip" data-mp="${k}" aria-pressed="${MP.pick.has(k)}">${k==="deb" ? "Débito" : k+"x"}</button>`).join("");
      $("om-pick").querySelectorAll("[data-mp]").forEach(b => b.onclick = () => { const k = b.dataset.mp; MP.pick.has(k) ? MP.pick.delete(k) : MP.pick.add(k); b.setAttribute("aria-pressed", MP.pick.has(k)); preview(); }); };
    const fillMsg = m => { MSG_K.forEach(k => $("om-"+k).value = m[k]); MP.pick = new Set(m.pick); chips(); preview(); };
    fillMsg(S.msg);
    MSG_K.forEach(k => $("om-"+k).oninput = preview);
    $("om-padrao").onclick = () => { fillMsg(MSG_PADRAO); $("om-res").innerHTML = `<div class="msg warn">Mensagem original preenchida. Clique em Salvar mensagem para aplicar.</div>`; };
    $("om-salvar").onclick = async () => {
      if(!precisaNuvem()) return;
      const m = lerMsg(); m.pick = m.pick.sort((x,y) => (x==="deb"?0:+x) - (y==="deb"?0:+y));
      try{ await q(sb.from("config").update({mensagem: m, atualizado_em: new Date().toISOString()}).eq("empresa_id", S.emp.id)); S.msg = m; if(!SIM.valor){ SIM.pick = new Set(m.pick); } SIM.msgEditada = false; $("om-res").innerHTML = `<div class="msg ok">Mensagem salva. O Simulador já usa a nova versão.</div>`; }catch(e){ erroNuvem(e); }
    };
    $("t-pad").onclick = () => { S.taxas.cred.forEach((_,i) => $("t-"+i).value = String(r2(TAXAS_PADRAO.cred[i])).replace(".",",")); $("t-msg").innerHTML = `<div class="msg warn">Taxas de exemplo preenchidas. Confira com a sua maquininha e clique em Salvar taxas.</div>`; };
    $("t-ok").onclick = async () => {
      const num = s => { const v = parseFloat(String(s).replace(",",".")); return isFinite(v) ? v : null; };
      const cred = Array.from({length:18},(_,i) => num($("t-"+i).value)), deb = $("t-deb").value.trim() ? num($("t-deb").value) : null;
      if(cred.some(v => v == null || v < 0 || v >= 50) || (deb != null && (deb < 0 || deb >= 50))) return $("t-msg").innerHTML = `<div class="msg bad">Confira as taxas: use números entre 0 e 50, como 3,05.</div>`;
      if(!precisaNuvem()) return;
      try{ await q(sb.from("config").update({taxas: {deb, cred}, atualizado_em: new Date().toISOString()}).eq("empresa_id", S.emp.id)); S.taxas = {deb, cred}; $("t-msg").innerHTML = `<div class="msg ok">Taxas salvas.</div>`; }catch(e){ erroNuvem(e); }
    };
  },
  update(){}
};

/* ===================== conta, loja, painel do sistema e início ===================== */
const CFG = window.APP_CONFIG || {};
const NOME_SISTEMA = CFG.NOME_SISTEMA || "Balcão";
ICON.loja = '<path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6"/>';
ICON.admin = '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>';
ICON.sair = '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>';
const PAPEL_NOME = {dono:"Dono", socio:"Sócio", vendedor:"Vendedor"};
const suporteLink = txt => "https://wa.me/" + soDig(CFG.SUPORTE_WHATSAPP || "") + "?text=" + encodeURIComponent(txt || "");
const urlBase = () => location.origin + location.pathname.replace(/index\.html$/, "");

/* ---------- telas de entrada ---------- */
function telaAuth(corpo){
  const el = $("auth");
  el.innerHTML = `<div class="auth-wrap"><section class="auth-brand"><div class="auth-logo">${esc(NOME_SISTEMA.slice(0,1))}</div><h1>${esc(NOME_SISTEMA)}</h1>
      <p>Gestão para lojas de iPhone e eletrônicos: estoque por IMEI com custo médio, vendas com troca e parcelamento, simulador de taxas e o lucro real do mês.</p>
      <ul><li>Estoque por IMEI ou número de série</li><li>Simulador com as taxas da sua maquininha</li><li>Financeiro com despesas e pró-labore</li><li>Equipe com acesso por papel</li></ul></section>
    <section class="auth-card">${corpo}</section></div>`;
  el.hidden = false; $("app").hidden = true;
  const f = el.querySelector("input"); if(f) setTimeout(() => f.focus(), 50);
}
const authMsg = (t, tipo) => { const m = $("au-msg"); if(m) m.innerHTML = t ? `<div class="msg ${tipo||"bad"}">${t}</div>` : ""; };
const ocupado = (btn, on, txt) => { btn.disabled = on; if(txt) btn.textContent = txt; };

function telaEntrar(email){
  const conv = localStorage_get("convite");
  telaAuth(`<h2>Entrar</h2>${conv ? `<p class="sub" style="margin:0">Entre para aceitar o convite.</p>` : ""}
    <form class="form" id="au-form"><div class="f"><label for="au-email">E-mail</label><input class="in" id="au-email" type="email" autocomplete="email" value="${esc(email||"")}" required></div>
      <div class="f"><label for="au-senha">Senha</label><input class="in" id="au-senha" type="password" autocomplete="current-password" required></div>
      <div id="au-msg"></div><button class="btn btn-gold" type="submit" id="au-ok">Entrar</button></form>
    <div class="auth-links"><button class="link" type="button" id="au-criar">Criar conta grátis</button><button class="link" type="button" id="au-esqueci">Esqueci a senha</button></div>`);
  $("au-criar").onclick = () => telaCriarConta($("au-email").value);
  $("au-esqueci").onclick = () => telaEsqueci($("au-email").value);
  $("au-form").onsubmit = async e => {
    e.preventDefault(); const b = $("au-ok"); ocupado(b, true, "Entrando…"); authMsg("");
    const {data, error} = await sb.auth.signInWithPassword({email: $("au-email").value.trim(), password: $("au-senha").value});
    if(error){ ocupado(b, false, "Entrar"); return authMsg(/invalid/i.test(error.message) ? "E-mail ou senha incorretos." : /confirm/i.test(error.message) ? "Confirme seu e-mail antes de entrar. Procure a mensagem na sua caixa de entrada." : msgErro(error)); }
    entrarComSessao(data.user);
  };
}
function telaCriarConta(email){
  const conv = localStorage_get("convite");
  telaAuth(`<h2>${conv ? "Criar sua conta" : "Teste grátis por 7 dias"}</h2><p class="sub" style="margin:0">${conv ? "Use o mesmo e-mail que recebeu o convite." : "Sem cartão. Depois do teste, você escolhe se quer continuar."}</p>
    <form class="form" id="au-form"><div class="f"><label for="au-nome">Seu nome</label><input class="in" id="au-nome" autocomplete="name" required></div>
      <div class="f"><label for="au-email">E-mail</label><input class="in" id="au-email" type="email" autocomplete="email" value="${esc(email||"")}" required></div>
      <div class="f"><label for="au-senha">Senha</label><input class="in" id="au-senha" type="password" autocomplete="new-password" minlength="8" required><span class="hint">Pelo menos 8 caracteres.</span></div>
      ${conv ? "" : `<div class="f"><label for="au-loja">Nome da loja</label><input class="in" id="au-loja" required></div>
      <div class="f"><label for="au-wa">WhatsApp da loja</label><input class="in" id="au-wa" inputmode="tel" placeholder="(51) 99999-9999"></div>`}
      <div id="au-msg"></div><button class="btn btn-gold" type="submit" id="au-ok">${conv ? "Criar conta" : "Começar o teste grátis"}</button></form>
    <div class="auth-links"><button class="link" type="button" id="au-entrar">Já tenho conta</button></div>`);
  $("au-entrar").onclick = () => telaEntrar($("au-email").value);
  $("au-form").onsubmit = async e => {
    e.preventDefault(); const b = $("au-ok"), txt = b.textContent; authMsg("");
    if($("au-senha").value.length < 8) return authMsg("A senha precisa ter pelo menos 8 caracteres.");
    ocupado(b, true, "Criando…");
    const meta = {nome: $("au-nome").value.trim(), loja: conv ? "" : $("au-loja").value.trim(), whatsapp: conv ? "" : soDig($("au-wa").value)};
    const {data, error} = await sb.auth.signUp({email: $("au-email").value.trim(), password: $("au-senha").value, options: {data: meta, emailRedirectTo: urlBase()}});
    if(error){ ocupado(b, false, txt); return authMsg(/registered|exists/i.test(error.message) ? "Este e-mail já tem conta. Use “Já tenho conta”." : msgErro(error)); }
    if(!data.session){
      telaAuth(`<h2>Confirme seu e-mail</h2><p>Enviamos um link para <b>${esc($("au-email") ? $("au-email").value : "")}</b>. Abra o e-mail, toque no link e depois entre com sua senha.</p>
        <p class="sub">Não chegou? Veja a caixa de spam.</p><button class="btn btn-ghost" type="button" id="au-entrar2">Ir para o login</button>`);
      $("au-entrar2").onclick = () => telaEntrar(); return;
    }
    entrarComSessao(data.user);
  };
}
function telaEsqueci(email){
  telaAuth(`<h2>Recuperar senha</h2><p class="sub" style="margin:0">Enviamos um link para você criar uma senha nova.</p>
    <form class="form" id="au-form"><div class="f"><label for="au-email">E-mail</label><input class="in" id="au-email" type="email" value="${esc(email||"")}" required></div>
      <div id="au-msg"></div><button class="btn btn-gold" type="submit" id="au-ok">Enviar link</button></form>
    <div class="auth-links"><button class="link" type="button" id="au-entrar">Voltar para o login</button></div>`);
  $("au-entrar").onclick = () => telaEntrar($("au-email").value);
  $("au-form").onsubmit = async e => {
    e.preventDefault(); const b = $("au-ok"); ocupado(b, true, "Enviando…");
    const {error} = await sb.auth.resetPasswordForEmail($("au-email").value.trim(), {redirectTo: urlBase()});
    ocupado(b, false, "Enviar link");
    authMsg(error ? msgErro(error) : "Pronto. Se o e-mail tiver conta, o link chega em instantes.", error ? "bad" : "ok");
  };
}
function telaNovaSenha(){
  telaAuth(`<h2>Criar senha nova</h2><form class="form" id="au-form"><div class="f"><label for="au-senha">Senha nova</label><input class="in" id="au-senha" type="password" autocomplete="new-password" minlength="8" required></div>
    <div id="au-msg"></div><button class="btn btn-gold" type="submit" id="au-ok">Salvar senha</button></form>`);
  $("au-form").onsubmit = async e => {
    e.preventDefault(); if($("au-senha").value.length < 8) return authMsg("A senha precisa ter pelo menos 8 caracteres.");
    const b = $("au-ok"); ocupado(b, true, "Salvando…");
    const {data, error} = await sb.auth.updateUser({password: $("au-senha").value});
    if(error){ ocupado(b, false, "Salvar senha"); return authMsg(msgErro(error)); }
    entrarComSessao(data.user);
  };
}
async function telaConvite(){
  const tok = localStorage_get("convite");
  let info = null; try{ info = (await rpc("ver_convite", {p_token: tok}))[0]; }catch(e){}
  if(!info){ localStorage_set("convite", null); return telaAuth(`<h2>Convite inválido</h2><p>Este link de convite não existe mais. Peça um novo para quem te convidou.</p><button class="btn btn-ghost" type="button" id="au-entrar">Ir para o login</button>`), $("au-entrar").onclick = () => telaEntrar(); }
  telaAuth(`<h2>Você foi convidado</h2><p>Para entrar na equipe da <b>${esc(info.empresa)}</b> como <b>${esc(PAPEL_NOME[info.papel]||info.papel)}</b>.</p>
    <p class="sub">O convite é para ${esc(info.email)}.</p><div class="acts"><button class="btn btn-gold" type="button" id="au-criar">Criar minha conta</button><button class="btn btn-ghost" type="button" id="au-entrar">Já tenho conta</button></div>`);
  $("au-criar").onclick = () => telaCriarConta(info.email); $("au-entrar").onclick = () => telaEntrar(info.email);
}
function telaCriarLoja(user){
  const m = (user && user.user_metadata) || {};
  telaAuth(`<h2>Sua loja</h2><p class="sub" style="margin:0">Último passo: o teste grátis de 7 dias começa agora.</p>
    <form class="form" id="au-form"><div class="f"><label for="au-loja">Nome da loja</label><input class="in" id="au-loja" value="${esc(m.loja||"")}" required></div>
      <div class="f"><label for="au-wa">WhatsApp da loja</label><input class="in" id="au-wa" inputmode="tel" value="${esc(m.whatsapp ? fone(m.whatsapp) : "")}"></div>
      <div id="au-msg"></div><button class="btn btn-gold" type="submit" id="au-ok">Criar minha loja</button></form>
    <div class="auth-links"><button class="link" type="button" id="au-sair">Sair</button></div>`);
  $("au-sair").onclick = sair;
  $("au-form").onsubmit = async e => {
    e.preventDefault(); const b = $("au-ok"); ocupado(b, true, "Criando…");
    try{ await rpc("criar_empresa", {p_nome: $("au-loja").value.trim(), p_whatsapp: soDig($("au-wa").value), p_meu_nome: m.nome || ""}); entrarComSessao(user); }
    catch(err){ ocupado(b, false, "Criar minha loja"); authMsg(msgErro(err)); }
  };
}
function localStorage_get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function localStorage_set(k, v){ try{ v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); }catch(e){} }
async function sair(){ try{ await sb.auth.signOut(); }catch(e){} localStorage_set("empresa", null); location.hash = ""; location.reload(); }

/* ---------- entrar no sistema ---------- */
let timerRecarga = null;
async function entrarComSessao(user){
  S.user = user;
  const tok = localStorage_get("convite");
  if(tok){
    try{ const eid = await rpc("aceitar_convite", {p_token: tok, p_meu_nome: (user.user_metadata && user.user_metadata.nome) || ""}); localStorage_set("empresa", eid); toast("Convite aceito. Bem-vindo à equipe!"); }
    catch(e){ toast(msgErro(e)); }
    localStorage_set("convite", null);
  }
  try{ S.empresas = await rpc("minhas_empresas"); S.superadmin = !!(await rpc("e_superadmin")); }
  catch(e){ return telaAuth(`<h2>Sem conexão</h2><p>${esc(msgErro(e))}</p><button class="btn btn-gold" type="button" onclick="location.reload()">Tentar de novo</button>`); }
  if(!S.empresas.length) return telaCriarLoja(user);
  S.emp = S.empresas.find(e => e.id === localStorage_get("empresa")) || S.empresas[0];
  localStorage_set("empresa", S.emp.id);
  aplicarEmpresa();
  $("auth").hidden = true; $("app").hidden = false;
  go((location.hash||"").slice(1) || inicio());
  await recarregar();
  go(S.view, true);
  clearInterval(timerRecarga);
  timerRecarga = setInterval(() => { if(document.visibilityState === "visible" && !$("modal").open) recarregar(); }, 60000);
}
window.addEventListener("focus", () => { if(S.emp && !$("modal").open) recarregar(); });

function corSuave(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`; }
function corClara(hex, f){ const n = parseInt(hex.slice(1), 16); const c = x => Math.round(x + (255-x)*f).toString(16).padStart(2,"0"); return "#" + c(n>>16&255) + c(n>>8&255) + c(n&255); }
function corEscura(hex, f){ const n = parseInt(hex.slice(1), 16); const c = x => Math.round(x*f).toString(16).padStart(2,"0"); return "#" + c(n>>16&255) + c(n>>8&255) + c(n&255); }
function aplicarEmpresa(){
  const e = S.emp;
  S.papel = e.papel; S.verCustos = e.papel !== "vendedor";
  document.title = e.nome + " · " + NOME_SISTEMA;
  const cor = /^#[0-9a-f]{6}$/i.test(e.cor || "") ? e.cor : "#D5951D";
  const n = parseInt(cor.slice(1), 16), lum = (0.2126*(n>>16&255) + 0.7152*(n>>8&255) + 0.0722*(n&255)) / 255;
  const texto = lum > 0.55 ? "#1a1205" : "#ffffff";
  const claro = corClara(cor, 0.45), escura = lum > 0.5 ? corEscura(cor, .62) : cor;
  let st = $("marca-css"); if(!st){ st = document.createElement("style"); st.id = "marca-css"; document.head.appendChild(st); }
  st.textContent = `:root{--gold:${cor};--gold-soft:${corSuave(cor,.13)};--gold-ink:${escura};--on-gold:${texto}}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--gold:${cor};--on-gold:${texto};--gold-soft:${corSuave(cor,.18)};--gold-ink:${claro}}}
:root[data-theme="dark"]{--gold:${cor};--on-gold:${texto};--gold-soft:${corSuave(cor,.18)};--gold-ink:${claro}}`;
  const marca = e.logo ? `<img src="${esc(e.logo)}" alt="">` : `<span class="mono-logo">${esc(e.nome.trim().slice(0,1).toUpperCase())}</span>`;
  $("brand-mark").innerHTML = marca; $("mob-mark").innerHTML = marca;
  $("brand-nome").textContent = e.nome; $("mob-nome").textContent = e.nome;
  $("brand-sub").textContent = PAPEL_NOME[e.papel] || "";
  $("conta").innerHTML = `${S.empresas.length > 1 ? `<select class="in" id="troca-emp" aria-label="Trocar de loja" style="padding:6px 8px;font-size:13px">${S.empresas.map(x => `<option value="${x.id}" ${x.id===e.id?"selected":""}>${esc(x.nome)}</option>`).join("")}</select>` : ""}
    <span class="conta-email">${esc(S.user.email || "")}</span><button class="nav" type="button" id="bt-sair">${ic("sair")}<span>Sair</span></button>`;
  $("bt-sair").onclick = sair;
  const te = $("troca-emp"); if(te) te.onchange = () => { localStorage_set("empresa", te.value); location.hash = ""; location.reload(); };
  bannerAssinatura();
}
function bannerAssinatura(){
  const e = S.emp, el = $("banner"); if(!e || !el) return;
  const pedido = `Olá! Quero ativar a assinatura do ${NOME_SISTEMA} para a loja ${e.nome}.`;
  const bt = `<a class="btn btn-sm btn-gold" target="_blank" rel="noopener" href="${suporteLink(pedido)}">Ativar assinatura</a>`;
  if(!liberada()){
    el.innerHTML = `<div class="banner bad"><span>${e.status === "bloqueada" ? "Esta loja está bloqueada." : e.status === "ativa" ? "A assinatura venceu." : "O teste grátis acabou."} Você ainda vê seus dados, mas não consegue registrar nada.</span>${S.papel === "dono" ? bt : ""}</div>`;
  } else if(e.status === "teste"){
    const d = diasRestantes();
    el.innerHTML = `<div class="banner"><span>Teste grátis: ${d <= 1 ? "último dia" : "faltam " + d + " dias"}.</span>${S.papel === "dono" ? bt : ""}</div>`;
  } else if(e.pago_ate && (Date.parse(e.pago_ate) - Date.now()) < 5 * 864e5){
    el.innerHTML = `<div class="banner"><span>Sua assinatura vence em ${dataBR(e.pago_ate.slice(0,10))}.</span>${S.papel === "dono" ? `<a class="btn btn-sm btn-gold" target="_blank" rel="noopener" href="${suporteLink("Olá! Quero renovar a assinatura da loja " + e.nome + ".")}">Renovar</a>` : ""}</div>`;
  } else el.innerHTML = "";
}
async function atualizarEmpresa(){
  S.empresas = await rpc("minhas_empresas");
  S.emp = S.empresas.find(e => e.id === S.emp.id) || S.empresas[0];
  aplicarEmpresa();
}

function abrirConta(){
  abrirModal("Sua conta", `<div class="form"><div class="sumrow"><span>E-mail</span><b>${esc(S.user.email||"")}</b></div><div class="sumrow"><span>Loja</span><b>${esc(S.emp.nome)}</b></div><div class="sumrow"><span>Papel</span><b>${PAPEL_NOME[S.papel]||""}</b></div>
    ${S.empresas.length > 1 ? `<div class="f"><label for="mc-emp">Trocar de loja</label><select class="in" id="mc-emp">${S.empresas.map(x => `<option value="${x.id}" ${x.id===S.emp.id?"selected":""}>${esc(x.nome)}</option>`).join("")}</select></div>` : ""}
    ${S.superadmin ? `<button class="btn btn-ghost" type="button" id="mc-admin">Lojas do sistema</button>` : ""}</div>`,
    `<span></span><button class="btn btn-danger" type="button" id="mc-sair">Sair</button>`,
    () => { $("mc-sair").onclick = sair; const a = $("mc-admin"); if(a) a.onclick = () => { fecharModal(); go("admin"); };
      const s = $("mc-emp"); if(s) s.onchange = () => { localStorage_set("empresa", s.value); location.hash = ""; location.reload(); }; });
}

/* ---------- Minha loja: dados, marca e equipe ---------- */
V.loja = {
  mount(){
    const e = S.emp, dono = S.papel === "dono";
    return `<div class="head"><div><h1>Minha loja</h1><p>Dados da loja, marca e quem tem acesso</p></div></div>
      <div class="grid2b">
        <div class="card"><div class="card-h"><h2>Dados e marca</h2>${dono ? "" : `<p>Só o dono altera</p>`}</div><div class="card-b form">
          <div class="f"><label for="lj-nome">Nome da loja</label><input class="in" id="lj-nome" value="${esc(e.nome)}" ${dono?"":"disabled"}></div>
          <div class="f"><label for="lj-wa">WhatsApp</label><input class="in" id="lj-wa" inputmode="tel" value="${esc(fone(e.whatsapp||""))}" ${dono?"":"disabled"}></div>
          <div class="row"><div class="f"><label for="lj-cor">Cor de destaque</label><input class="in" id="lj-cor" type="color" value="${esc(e.cor||"#D5951D")}" ${dono?"":"disabled"} style="height:46px;padding:4px"></div>
            <div class="f"><label for="lj-logo">Logo</label><input class="in" id="lj-logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" ${dono?"":"disabled"}><span class="hint">Quadrada, de preferência com fundo transparente.</span></div></div>
          <div class="lj-prev"><span id="lj-prev-mark">${e.logo ? `<img src="${esc(e.logo)}" alt="">` : `<span class="mono-logo">${esc(e.nome.slice(0,1).toUpperCase())}</span>`}</span><b id="lj-prev-nome">${esc(e.nome)}</b>${e.logo && dono ? `<button class="link" type="button" id="lj-tirar">Tirar logo</button>` : ""}</div>
          <div id="lj-msg"></div>${dono ? `<button class="btn btn-gold" type="button" id="lj-salvar" style="justify-self:start">Salvar</button>` : ""}
        </div></div>
        <div class="card"><div class="card-h"><h2>Assinatura</h2></div><div class="card-b form" id="lj-ass"></div></div>
      </div>
      <div class="card"><div class="card-h"><h2>Equipe</h2><p>Dono e sócio veem tudo. Vendedor registra vendas, consulta o estoque e usa o simulador, sem ver custos, lucro e financeiro.</p></div>
        <div class="tw"><table><thead><tr><th>Pessoa</th><th>Papel</th><th>Desde</th><th></th></tr></thead><tbody id="lj-membros"></tbody></table></div></div>
      <div class="card"><div class="card-h"><h2>Convidar alguém</h2></div><div class="card-b form">
        <div class="row"><div class="f"><label for="cv-email">E-mail da pessoa</label><input class="in" id="cv-email" type="email" placeholder="nome@email.com"></div>
          <div class="f"><label for="cv-papel">Papel</label><select class="in" id="cv-papel">${dono ? `<option value="socio">Sócio</option>` : ""}<option value="vendedor">Vendedor</option></select></div></div>
        <div id="cv-msg"></div><button class="btn btn-gold" type="button" id="cv-ok" style="justify-self:start">Gerar convite</button>
        <div id="cv-pend"></div></div></div>`;
  },
  bind(){
    const dono = S.papel === "dono";
    let logo = S.emp.logo || "";
    if(dono){
      const prev = () => { $("lj-prev-nome").textContent = $("lj-nome").value || S.emp.nome; $("lj-prev-mark").innerHTML = logo ? `<img src="${esc(logo)}" alt="">` : `<span class="mono-logo" style="background:${esc($("lj-cor").value)}">${esc(($("lj-nome").value||"?").slice(0,1).toUpperCase())}</span>`; };
      $("lj-nome").oninput = prev; $("lj-cor").oninput = prev;
      $("lj-logo").onchange = async () => { const f = $("lj-logo").files[0]; if(!f) return;
        try{ logo = await reduzirImagem(f, 256); prev(); }catch(e){ $("lj-msg").innerHTML = `<div class="msg bad">Não consegui ler essa imagem. Tente PNG ou JPG.</div>`; } };
      const tirar = $("lj-tirar"); if(tirar) tirar.onclick = () => { logo = ""; prev(); };
      $("lj-salvar").onclick = async () => {
        const nome = $("lj-nome").value.trim(); if(nome.length < 2) return $("lj-msg").innerHTML = `<div class="msg bad">Informe o nome da loja.</div>`;
        try{ await q(sb.from("empresas").update({nome, whatsapp: soDig($("lj-wa").value), cor: $("lj-cor").value, logo}).eq("id", S.emp.id)); await atualizarEmpresa(); $("lj-msg").innerHTML = `<div class="msg ok">Salvo.</div>`; }
        catch(e){ $("lj-msg").innerHTML = `<div class="msg bad">${esc(msgErro(e))}</div>`; }
      };
    }
    $("cv-ok").onclick = async () => {
      const email = $("cv-email").value.trim().toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return $("cv-msg").innerHTML = `<div class="msg bad">Informe um e-mail válido.</div>`;
      if(!precisaNuvem()) return;
      try{ const tok = await rpc("criar_convite", {p_empresa: S.emp.id, p_email: email, p_papel: $("cv-papel").value});
        $("cv-email").value = ""; $("cv-msg").innerHTML = `<div class="msg ok">Convite criado. Envie o link abaixo para ${esc(email)}.</div>`;
        await recarregar(); destacarConvite(tok); }
      catch(e){ $("cv-msg").innerHTML = `<div class="msg bad">${esc(msgErro(e))}</div>`; }
    };
  },
  update(){
    if(!$("lj-membros")) return;
    const e = S.emp, dono = S.papel === "dono";
    const st = !liberada() ? `<span class="tag t-bad">${e.status === "bloqueada" ? "Bloqueada" : "Vencida"}</span>` : e.status === "teste" ? `<span class="tag t-warn">Teste grátis</span>` : `<span class="tag t-ok">Ativa</span>`;
    $("lj-ass").innerHTML = `<div class="sumrow"><span>Situação</span>${st}</div>
      ${e.status === "teste" ? `<div class="sumrow"><span>Teste até</span><b>${dataBR(e.teste_ate.slice(0,10))}</b></div>` : ""}
      ${e.pago_ate ? `<div class="sumrow"><span>Pago até</span><b>${dataBR(e.pago_ate.slice(0,10))}</b></div>` : ""}
      ${dono ? `<a class="btn btn-wa" target="_blank" rel="noopener" href="${suporteLink("Olá! Quero falar sobre a assinatura da loja " + e.nome + ".")}" style="justify-self:start">${ic("wa")} Falar com o suporte</a>` : ""}`;
    $("lj-membros").innerHTML = S.membros.slice().sort((a,b) => ["dono","socio","vendedor"].indexOf(a.papel) - ["dono","socio","vendedor"].indexOf(b.papel)).map(m =>
      `<tr><td><b>${esc(m.nome || m.email)}</b>${m.nome ? `<span class="sub">${esc(m.email)}</span>` : ""}</td><td><span class="tag ${m.papel==="vendedor"?"t-semi":"t-lac"}">${PAPEL_NOME[m.papel]}</span></td><td class="nw">${dataBR((m.criado_em||"").slice(0,10))}</td>
        <td class="r">${dono && m.user_id !== S.user.id ? `<button class="btn btn-danger btn-sm" type="button" data-rm="${m.user_id}">Remover</button>` : m.user_id === S.user.id ? `<span class="sub" style="display:inline">você</span>` : ""}</td></tr>`).join("");
    $("lj-membros").querySelectorAll("[data-rm]").forEach(b => b.onclick = ev => confirmar(ev.currentTarget, "Confirmar", async () => {
      try{ await rpc("remover_membro", {p_empresa: S.emp.id, p_user: b.dataset.rm}); await feito("Pessoa removida da equipe"); }catch(e){ erroNuvem(e); } }));
    $("cv-pend").innerHTML = S.convites.length ? `<div class="lbl" style="margin-top:6px">Convites ainda não aceitos</div>` + S.convites.map(c => { const link = urlBase() + "#convite-" + c.token;
      return `<div class="item" style="grid-template-columns:minmax(0,1fr) auto" data-tok="${esc(c.token)}"><div><b>${esc(c.email)}</b><span class="sub">${PAPEL_NOME[c.papel]} · vale 14 dias · <span class="mono">${esc(link)}</span></span></div>
        <div class="acts"><button class="btn btn-ghost btn-sm" type="button" data-cp="${esc(link)}">${ic("copy")} Copiar link</button><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent("Você foi convidado para a equipe da " + S.emp.nome + " no " + NOME_SISTEMA + ". Crie sua conta com este e-mail (" + c.email + ") pelo link: " + link)}">WhatsApp</a><button class="btn btn-danger btn-sm" type="button" data-cc="${c.id}">Cancelar</button></div></div>`; }).join("") : "";
    $("cv-pend").querySelectorAll("[data-cp]").forEach(b => b.onclick = () => copiar(b.dataset.cp));
    $("cv-pend").querySelectorAll("[data-cc]").forEach(b => b.onclick = async () => { try{ await rpc("cancelar_convite", {p_convite: b.dataset.cc}); await feito("Convite cancelado"); }catch(e){ erroNuvem(e); } });
  }
};
function destacarConvite(tok){ const el = document.querySelector(`[data-tok="${tok}"]`); if(el){ el.style.borderColor = "var(--gold)"; el.scrollIntoView({block:"nearest"}); } }
function reduzirImagem(file, lado){
  return new Promise((ok, falha) => {
    if(file.size > 5e6) return falha(new Error("grande"));
    const fr = new FileReader();
    fr.onload = () => { const img = new Image(); img.onload = () => {
      const k = Math.min(1, lado / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); ok(c.toDataURL("image/png")); };
      img.onerror = falha; img.src = fr.result; };
    fr.onerror = falha; fr.readAsDataURL(file);
  });
}

/* ---------- Painel do dono do sistema ---------- */
const ADM = {lista:[], filtro:""};
V.admin = {
  mount(){
    return `<div class="head"><div><h1>Lojas do sistema</h1><p>Todas as lojas cadastradas no ${esc(NOME_SISTEMA)}. Só você vê esta tela.</p></div><div class="acts"><button class="btn btn-ghost" type="button" id="ad-rec">Atualizar</button></div></div>
      <div class="kpis" id="ad-kpis"></div>
      <div class="bar"><input class="search" id="ad-q" type="search" placeholder="Buscar loja ou e-mail" aria-label="Buscar loja"></div>
      <div class="card"><div class="tw"><table><thead><tr><th>Loja</th><th>Situação</th><th>Até</th><th class="r">Equipe</th><th class="r">Vendas 30 dias</th><th>Observação</th><th></th></tr></thead><tbody id="ad-lista">${loadingRow(7)}</tbody></table></div></div>
      <p class="sub">“Ativar 30 dias” soma 30 dias ao prazo pago. Depois do prazo, a loja volta a ficar só leitura sozinha.</p>`;
  },
  async bind(){
    $("ad-rec").onclick = () => this.carregar();
    $("ad-q").oninput = e => { ADM.filtro = e.target.value; this.render(); };
    this.carregar();
  },
  async carregar(){
    try{ ADM.lista = await rpc("admin_empresas"); this.render(); }catch(e){ $("ad-lista").innerHTML = `<tr><td colspan="7" class="empty">${esc(msgErro(e))}</td></tr>`; }
  },
  render(){
    if(!$("ad-lista")) return;
    const agora = Date.now(), sit = e => e.status === "bloqueada" ? "bloqueada" : e.status === "ativa" ? (!e.pago_ate || Date.parse(e.pago_ate) > agora ? "ativa" : "vencida") : (Date.parse(e.teste_ate) > agora ? "teste" : "vencida");
    const L = ADM.lista, cont = k => L.filter(e => sit(e) === k).length;
    $("ad-kpis").innerHTML = `<div class="kpi"><small>Lojas</small><b>${L.length}</b><span>cadastradas</span></div><div class="kpi hl"><small>Pagando</small><b>${cont("ativa")}</b><span>assinatura em dia</span></div>
      <div class="kpi"><small>Em teste</small><b>${cont("teste")}</b><span>7 dias grátis</span></div><div class="kpi"><small>Vencidas ou bloqueadas</small><b>${cont("vencida") + cont("bloqueada")}</b><span>só leitura</span></div>`;
    const f = norm(ADM.filtro);
    const tag = {ativa:'<span class="tag t-ok">Ativa</span>', teste:'<span class="tag t-warn">Teste</span>', vencida:'<span class="tag t-bad">Vencida</span>', bloqueada:'<span class="tag t-bad">Bloqueada</span>'};
    $("ad-lista").innerHTML = L.filter(e => !f || norm(e.nome + " " + (e.dono_email||"")).includes(f)).map(e => { const s = sit(e);
      return `<tr><td><b>${esc(e.nome)}</b><span class="sub">${esc(e.dono_email||"")}${e.whatsapp ? " · " + esc(fone(e.whatsapp)) : ""} · desde ${dataBR(e.criado_em.slice(0,10))}</span></td><td>${tag[s]}</td>
        <td class="nw">${e.status === "ativa" && e.pago_ate ? dataBR(e.pago_ate.slice(0,10)) : e.status === "teste" ? dataBR(e.teste_ate.slice(0,10)) : "—"}</td><td class="r">${e.membros}</td><td class="r">${e.vendas_30d}</td>
        <td><input class="in" data-obs="${e.id}" value="${esc(e.obs_admin||"")}" placeholder="Ex.: Pix recebido 05/11" style="min-width:160px;padding:6px 8px;font-size:13px"></td>
        <td class="r nw"><button class="btn btn-gold btn-sm" type="button" data-ad="ativa|30|${e.id}">Ativar 30 dias</button> <button class="btn btn-ghost btn-sm" type="button" data-ad="teste|7|${e.id}">+7 dias de teste</button> <button class="btn btn-danger btn-sm" type="button" data-ad="bloqueada||${e.id}">Bloquear</button></td></tr>`; }).join("") || `<tr><td colspan="7" class="empty">Nenhuma loja.</td></tr>`;
    $("ad-lista").querySelectorAll("[data-ad]").forEach(b => b.onclick = ev => { const [st, dias, id] = b.dataset.ad.split("|");
      const go2 = async () => { try{ await rpc("admin_definir", {p_empresa: id, p_status: st, p_dias: dias ? +dias : null, p_obs: (document.querySelector(`[data-obs="${id}"]`)||{}).value ?? null}); toast("Loja atualizada"); await this.carregar(); if(S.emp && id === S.emp.id) await atualizarEmpresa(); }catch(e){ erroNuvem(e); } };
      st === "bloqueada" ? confirmar(ev.currentTarget, "Confirmar bloqueio", go2) : go2(); });
    $("ad-lista").querySelectorAll("[data-obs]").forEach(i => i.onchange = async () => { const e = ADM.lista.find(x => x.id === i.dataset.obs);
      try{ await rpc("admin_definir", {p_empresa: e.id, p_status: e.status, p_dias: null, p_obs: i.value}); toast("Observação salva"); }catch(err){ erroNuvem(err); } });
  },
  update(){}
};

/* ---------- início ---------- */
async function boot(){
  if(!window.supabase || !CFG.SUPABASE_URL || /COLE_AQUI/.test(CFG.SUPABASE_URL)){
    return telaAuth(`<h2>Falta configurar</h2><p>Preencha o endereço e a chave do Supabase no arquivo <b>config.js</b>.</p>`);
  }
  sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
  const m = (location.hash || "").match(/^#convite-([a-f0-9]{20,})$/i);
  if(m){ localStorage_set("convite", m[1]); try{ history.replaceState(null, "", location.pathname); }catch(e){} }
  sb.auth.onAuthStateChange(ev => { if(ev === "PASSWORD_RECOVERY") telaNovaSenha(); });
  if(/type=recovery/.test(location.hash)) return;
  const {data} = await sb.auth.getSession();
  if(!data.session) return localStorage_get("convite") ? telaConvite() : telaEntrar();
  entrarComSessao(data.session.user);
}
boot();
if("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});


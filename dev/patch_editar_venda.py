"""Editar venda registrada + atalhos para editar SKU. Uso: python3 patch_editar_venda.py <app.js> <saas|artifact>"""
import sys
app, modo = sys.argv[1], sys.argv[2]
a = open(app).read()
def rep(old, new, count=1):
    global a
    n = a.count(old); assert n == count, (n, old[:100]); a = a.replace(old, new)

# botão Editar na lista de vendas
rep('''data-rec="${v.id}">Recibo</button>''', '''data-rec="${v.id}">Recibo</button> <button class="btn btn-ghost btn-sm" type="button" data-edv="${v.id}">Editar</button>''')
rep('''    $("vm-lista").querySelectorAll("[data-est]").forEach(b => b.onclick = e''', '''    $("vm-lista").querySelectorAll("[data-edv]").forEach(b => b.onclick = () => modalEditarVenda(b.dataset.edv));
    $("vm-lista").querySelectorAll("[data-est]").forEach(b => b.onclick = e''')

# atalhos para editar SKU: nome clicável na aba SKUs e no Estoque
rep('''<td><b>${esc(s.nome)}</b></td><td>${esc(s.cat||"Outros")}</td>''', '''<td><button class="link" type="button" data-ked="${s.id}" style="font-size:14px;color:var(--fg);text-align:left" title="Editar SKU">${esc(s.nome)} ✎</button></td><td>${esc(s.cat||"Outros")}</td>''')
rep('''<span class="sub">${esc([skuCod(id), (S.skus[id]||{}).cat].filter(Boolean).join(" · "))}</span></td>''', '''<span class="sub">${esc([skuCod(id), (S.skus[id]||{}).cat].filter(Boolean).join(" · "))}${S.verCustos === false ? "" : ` · <span class="link" role="button" tabindex="0" data-esku="${id}" style="font-size:12px">editar SKU</span>`}</span></td>''')
rep('''    $("e-tab").querySelectorAll("[data-edit]").forEach(b => b.onclick = e => { e.stopPropagation(); modalEditarUn(b.dataset.edit); });''',
    '''    $("e-tab").querySelectorAll("[data-edit]").forEach(b => b.onclick = e => { e.stopPropagation(); modalEditarUn(b.dataset.edit); });
    $("e-tab").querySelectorAll("[data-esku]").forEach(b => b.onclick = e => { e.stopPropagation(); modalSku(b.dataset.esku); });''')

salvar_artifact = r'''
        const cliNome = $("ev-cli").value.trim(), tel = soDig($("ev-fone").value);
        let cli = S.cli.find(x => norm(x.nome) === norm(cliNome));
        if(cliNome && !cli){ const novo = {nome: cliNome, fone: tel, nasc: "", cpf: "", email: "", end: null, criado: new Date().toISOString()}; const ref = await db.collection("clientes").add(novo); cli = {id: ref.id, ...novo}; }
        else if(cli && tel && tel !== cli.fone) await db.doc("clientes/"+cli.id).update({fone: tel});
        const c = calc();
        const up = {vendedor: $("ev-vend").value.trim(), origem: $("ev-orig").value, obs: $("ev-obs").value.trim(), itens: c.itens,
          cliente: cli ? {...(v.cliente||{}), id: cli.id, nome: cli.nome, fone: tel || cli.fone || "", cpf: cli.cpf || "", email: cli.email || "", end: cli.end || null} : {id: "", nome: "Cliente não informado", fone: "", cpf: "", email: "", end: null},
          receita: c.receita, cmv: c.cmv, aPagar: c.aPagar, clientePaga: c.clientePaga, recebido: c.recebido, taxaValor: c.taxaValor, taxaPct: c.taxaPct, lucro: c.lucro,
          forma: EV.forma, parcelas: EV.forma === "credito" ? EV.parc : 1, modo: EV.forma === "credito" ? EV.modo : null};
        const dt = $("ev-data").value;
        if(dt){ up.data = dt; up.mes = dt.slice(0,7); up.semData = false; }
        await db.doc("vendas/"+id).update(up);
        fecharModal(); toast("Venda atualizada");'''
salvar_saas = r'''
        const cliNome = $("ev-cli").value.trim(), cli = S.cli.find(x => norm(x.nome) === norm(cliNome));
        const precos = {}; (v.itens||[]).forEach((it, i) => { if(!it.brinde) precos[it.id] = EV.precos[i]; });
        await rpc("editar_venda", {p_venda: id, p: {data: $("ev-data").value || null, cliente: {id: cli ? cli.id : "", nome: cliNome, fone: soDig($("ev-fone").value)},
          vendedor: $("ev-vend").value.trim(), origem: $("ev-orig").value, obs: $("ev-obs").value.trim(),
          forma: EV.forma, parcelas: EV.forma === "credito" ? EV.parc : 1, modo: EV.forma === "credito" ? EV.modo : null, precos}});
        fecharModal(); await feito("Venda atualizada");'''

fn = r'''
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
        try{''' + (salvar_saas if modo == "saas" else salvar_artifact) + r'''
        }catch(e){ erroNuvem(e); btn.disabled = false; btn.textContent = "Salvar alterações"; }
      };
    });
}
'''
rep('''/* ---------- TERMO DE ENTREGA ---------- */''', fn + '''
/* ---------- TERMO DE ENTREGA ---------- */''')
open(app, 'w').write(a)
print("ok", modo)

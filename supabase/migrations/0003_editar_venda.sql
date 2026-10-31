-- Editar uma venda já registrada (dono e sócio): cliente, vendedor, origem, data,
-- observação, preço dos itens e forma de pagamento. Custo dos itens e troca não mudam.
-- Pode rodar mais de uma vez.
create or replace function public.editar_venda(p_venda uuid, p jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v vendas%rowtype; v_cli uuid; v_cli_json jsonb; v_nome text; v_it record; v_preco numeric;
  v_receita numeric; v_cmv numeric; v_troca numeric; v_a_pagar numeric; v_t numeric := 0;
  v_cliente_paga numeric; v_recebido numeric; v_taxa_valor numeric := 0; v_taxas jsonb;
  v_forma text; v_parc int; v_modo text; v_mudou boolean;
begin
  select * into v from vendas where id = p_venda for update;
  if not found then raise exception 'Venda não encontrada.'; end if;
  if not public.pode_gerir(v.empresa_id) then raise exception 'Só o dono ou o sócio podem editar vendas.'; end if;

  -- preços dos itens (brinde continua zero)
  for v_it in select vi.id, vi.brinde, vi.preco from venda_itens vi where vi.venda_id = p_venda loop
    if not v_it.brinde and (p->'precos') ? v_it.id::text then
      v_preco := round((p->'precos'->>(v_it.id::text))::numeric, 2);
      if v_preco is null or v_preco < 0 then raise exception 'Preço inválido.'; end if;
      update venda_itens set preco = v_preco where id = v_it.id;
    end if;
  end loop;
  select coalesce(sum(vi.preco), 0), coalesce(sum(ic.custo), 0) into v_receita, v_cmv
    from venda_itens vi left join venda_itens_custo ic on ic.item_id = vi.id where vi.venda_id = p_venda;
  v_troca := coalesce((v.troca->>'valor')::numeric, 0);
  if v_troca > v_receita then raise exception 'O total ficou menor que o valor da troca.'; end if;

  -- cliente
  v_nome := trim(coalesce(p->'cliente'->>'nome', ''));
  if v_nome <> '' then
    select id into v_cli from clientes where empresa_id = v.empresa_id
      and (id::text = coalesce(p->'cliente'->>'id','') or lower(trim(nome)) = lower(v_nome))
      order by (id::text = coalesce(p->'cliente'->>'id','')) desc limit 1;
    if v_cli is null then
      insert into clientes (empresa_id, nome, fone) values (v.empresa_id, v_nome, coalesce(p->'cliente'->>'fone','')) returning id into v_cli;
    elsif coalesce(p->'cliente'->>'fone','') <> '' then
      update clientes set fone = p->'cliente'->>'fone' where id = v_cli;
    end if;
    select jsonb_build_object('id', id, 'nome', nome, 'fone', fone, 'cpf', cpf, 'email', email, 'end', endereco) into v_cli_json from clientes where id = v_cli;
  else
    v_cli := null;
    v_cli_json := jsonb_build_object('id', '', 'nome', 'Cliente não informado', 'fone', '', 'cpf', '', 'email', '', 'end', null);
  end if;

  -- pagamento: recalcula só se mudou forma, parcelas, quem paga a taxa ou o total
  v_forma := coalesce(p->>'forma', v.forma);
  if v_forma not in ('pix','dinheiro','debito','credito','nao_informado') then raise exception 'Forma de pagamento inválida.'; end if;
  v_parc := case when v_forma = 'credito' then greatest(1, least(coalesce((p->>'parcelas')::int, v.parcelas, 1), 18)) else 1 end;
  v_modo := case when v_forma = 'credito' then coalesce(p->>'modo', v.modo, 'repassa') else null end;
  if v_modo is not null and v_modo not in ('repassa','absorve') then raise exception 'Opção de taxa inválida.'; end if;
  v_mudou := v_forma <> v.forma or v_parc <> v.parcelas or coalesce(v_modo,'') <> coalesce(v.modo,'') or v_receita <> v.receita;
  v_a_pagar := greatest(v_receita - v_troca, 0);
  if v_mudou then
    select taxas into v_taxas from config where empresa_id = v.empresa_id;
    if v_forma = 'debito' then v_t := coalesce((v_taxas->>'deb')::numeric, 0) / 100;
    elsif v_forma = 'credito' then v_t := coalesce((v_taxas->'cred'->>(v_parc - 1))::numeric, 0) / 100; end if;
    if v_t > 0 and v_forma = 'credito' and v_modo = 'repassa' then
      v_cliente_paga := round(v_a_pagar / (1 - v_t), 2); v_recebido := v_a_pagar; v_taxa_valor := 0;
    elsif v_t > 0 then
      v_cliente_paga := v_a_pagar; v_recebido := round(v_a_pagar * (1 - v_t), 2); v_taxa_valor := v_a_pagar - v_recebido;
    else
      v_cliente_paga := v_a_pagar; v_recebido := v_a_pagar; v_taxa_valor := 0;
    end if;
  else
    v_t := v.taxa_pct / 100; v_cliente_paga := v.cliente_paga; v_recebido := v.recebido;
    select taxa_valor into v_taxa_valor from vendas_fin where venda_id = p_venda;
    v_taxa_valor := coalesce(v_taxa_valor, 0);
  end if;

  update vendas set
    data = coalesce(nullif(p->>'data','')::date, data),
    sem_data = case when nullif(p->>'data','') is not null then false else sem_data end,
    cliente_id = v_cli, cliente = v_cli_json,
    vendedor = coalesce(p->>'vendedor', vendedor), origem = coalesce(p->>'origem', origem), obs = coalesce(p->>'obs', obs),
    forma = v_forma, parcelas = v_parc, modo = v_modo, taxa_pct = round(v_t * 100, 4),
    a_pagar = v_a_pagar, cliente_paga = v_cliente_paga, recebido = v_recebido, receita = v_receita
  where id = p_venda;
  update vendas_fin set cmv = v_cmv, taxa_valor = v_taxa_valor, lucro = v_receita - v_cmv - v_taxa_valor where venda_id = p_venda;
end $$;

revoke execute on function public.editar_venda(uuid, jsonb) from public, anon;
grant execute on function public.editar_venda(uuid, jsonb) to authenticated;

-- Só para quem JÁ rodou o 0001 antes de 31/10/2026 à tarde: adiciona brindes nas vendas.
-- Quem vai rodar o 0001 agora não precisa deste arquivo.
alter table public.venda_itens add column if not exists brinde boolean not null default false;

create or replace function public.registrar_venda(p_empresa uuid, p jsonb)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_venda uuid; v_cli uuid; v_cli_json jsonb; v_it jsonb; v_un unidades%rowtype; v_item uuid;
  v_custo numeric; v_receita numeric := 0; v_cmv numeric := 0; v_troca_val numeric := 0; v_troca jsonb := null;
  v_a_pagar numeric; v_t numeric := 0; v_cliente_paga numeric; v_recebido numeric; v_taxa_valor numeric := 0;
  v_forma text := coalesce(p->>'forma', 'pix'); v_parc int := greatest(1, least(coalesce((p->>'parcelas')::int, 1), 18));
  v_modo text := coalesce(p->>'modo', 'repassa'); v_taxas jsonb; v_data date := coalesce((p->>'data')::date, current_date);
  v_ve_custo boolean := public.ve_custos(p_empresa); v_ordem int := 0; v_sku uuid; v_tsku uuid; v_tun uuid; v_tident text;
  medios jsonb := '{}'::jsonb; v_brinde boolean; v_preco numeric;
begin
  if not public.pode_escrever(p_empresa) then raise exception 'O período de teste acabou ou você não tem acesso a esta loja.'; end if;
  if jsonb_array_length(coalesce(p->'itens','[]'::jsonb)) = 0 then raise exception 'Adicione pelo menos um item.'; end if;

  -- cliente
  v_cli_json := coalesce(p->'cliente', '{}'::jsonb);
  if coalesce(trim(v_cli_json->>'nome'), '') <> '' then
    select id into v_cli from clientes where empresa_id = p_empresa and (id::text = coalesce(v_cli_json->>'id','') or lower(trim(nome)) = lower(trim(v_cli_json->>'nome'))) order by (id::text = coalesce(v_cli_json->>'id','')) desc limit 1;
    if v_cli is null then
      insert into clientes (empresa_id, nome, fone, cpf, email, endereco)
      values (p_empresa, trim(v_cli_json->>'nome'), coalesce(v_cli_json->>'fone',''), coalesce(v_cli_json->>'cpf',''), coalesce(v_cli_json->>'email',''), nullif(v_cli_json->'endereco','null'::jsonb))
      returning id into v_cli;
    else
      update clientes set
        fone = case when coalesce(v_cli_json->>'fone','') <> '' then v_cli_json->>'fone' else fone end,
        cpf = case when coalesce(v_cli_json->>'cpf','') <> '' then v_cli_json->>'cpf' else cpf end,
        email = case when coalesce(v_cli_json->>'email','') <> '' then v_cli_json->>'email' else email end,
        endereco = case when v_cli_json ? 'endereco' and jsonb_typeof(v_cli_json->'endereco') = 'object' then v_cli_json->'endereco' else endereco end
      where id = v_cli;
    end if;
    select jsonb_build_object('id', id, 'nome', nome, 'fone', fone, 'cpf', cpf, 'email', email, 'end', endereco) into v_cli_json from clientes where id = v_cli;
  else
    v_cli_json := jsonb_build_object('id', '', 'nome', 'Cliente não informado', 'fone', '', 'cpf', '', 'email', '', 'end', null);
  end if;

  insert into vendas (empresa_id, data, sem_data, cliente_id, cliente, vendedor, vendedor_id, origem, forma, parcelas, modo, obs)
  values (p_empresa, v_data, coalesce((p->>'sem_data')::boolean, false), v_cli, v_cli_json, coalesce(p->>'vendedor',''), auth.uid(),
          coalesce(p->>'origem',''), v_forma, case when v_forma = 'credito' then v_parc else 1 end, case when v_forma = 'credito' then v_modo else null end, coalesce(p->>'obs',''))
  returning id into v_venda;

  -- custo médio de cada SKU antes de baixar o estoque
  for v_it in select * from jsonb_array_elements(p->'itens') loop
    if coalesce(v_it->>'unidade_id','') <> '' then
      select sku_id into v_sku from unidades where id = (v_it->>'unidade_id')::uuid and empresa_id = p_empresa;
      if v_sku is not null and not medios ? v_sku::text then medios := medios || jsonb_build_object(v_sku::text, public.custo_medio(v_sku)); end if;
    end if;
  end loop;

  -- itens
  for v_it in select * from jsonb_array_elements(p->'itens') loop
    if coalesce((v_it->>'preco')::numeric, 0) < 0 or coalesce((v_it->>'custo')::numeric, 0) < 0 then raise exception 'Preço ou custo inválido.'; end if;
    v_ordem := v_ordem + 1;
    v_brinde := coalesce((v_it->>'brinde')::boolean, false);
    v_preco := case when v_brinde then 0 else round(coalesce((v_it->>'preco')::numeric,0),2) end;
    if coalesce(v_it->>'unidade_id','') <> '' then
      select * into v_un from unidades where id = (v_it->>'unidade_id')::uuid and empresa_id = p_empresa for update;
      if not found then raise exception 'Aparelho não encontrado no estoque.'; end if;
      if v_un.status <> 'estoque' then raise exception 'Um dos aparelhos já foi vendido. Atualize a página.'; end if;
      v_custo := coalesce((medios->>(v_un.sku_id::text))::numeric, 0);
      insert into venda_itens (venda_id, empresa_id, unidade_id, sku_id, nome, tipo, ident, cond, preco, brinde, ordem)
      values (v_venda, p_empresa, v_un.id, v_un.sku_id, (select nome from skus where id = v_un.sku_id), v_un.tipo, v_un.ident, v_un.cond, v_preco, v_brinde, v_ordem)
      returning id into v_item;
      update unidades set status = 'vendido', venda_id = v_venda, saida = v_data where id = v_un.id;
    else
      v_sku := nullif(v_it->>'sku_id','')::uuid;
      if v_sku is not null and not exists (select 1 from skus where id = v_sku and empresa_id = p_empresa) then v_sku := null; end if;
      if v_ve_custo and (v_it ? 'custo') then v_custo := round(coalesce((v_it->>'custo')::numeric, 0), 2);
      elsif v_sku is not null then v_custo := public.custo_medio(v_sku);
      else v_custo := 0; end if;
      insert into venda_itens (venda_id, empresa_id, unidade_id, sku_id, nome, tipo, ident, cond, preco, brinde, ordem)
      values (v_venda, p_empresa, null, v_sku, coalesce(nullif(trim(v_it->>'nome'),''), (select nome from skus where id = v_sku), 'Produto'),
              coalesce(v_it->>'tipo','serie'), coalesce(v_it->>'ident',''), coalesce(v_it->>'cond','lacrado'), v_preco, v_brinde, v_ordem)
      returning id into v_item;
    end if;
    insert into venda_itens_custo (item_id, empresa_id, custo) values (v_item, p_empresa, v_custo);
    v_receita := v_receita + v_preco;
    v_cmv := v_cmv + v_custo;
  end loop;

  -- aparelho na troca entra no estoque
  if p ? 'troca' and jsonb_typeof(p->'troca') = 'object' and coalesce(trim(p->'troca'->>'nome'),'') <> '' then
    v_troca_val := round(coalesce((p->'troca'->>'valor')::numeric, 0), 2);
    if v_troca_val < 0 then raise exception 'Valor da troca inválido.'; end if;
    if v_troca_val > v_receita then raise exception 'O valor da troca não pode ser maior que o total da venda.'; end if;
    select id into v_tsku from skus where empresa_id = p_empresa and lower(trim(nome)) = lower(regexp_replace(trim(p->'troca'->>'nome'), '\s+', ' ', 'g'));
    if v_tsku is null then
      insert into skus (empresa_id, nome, cat) values (p_empresa, p->'troca'->>'nome', 'iPhone') returning id into v_tsku;
    end if;
    v_tident := upper(trim(coalesce(p->'troca'->>'ident','')));
    if coalesce(p->'troca'->>'tipo','imei') = 'imei' then v_tident := regexp_replace(v_tident, '\D', '', 'g'); end if;
    if v_tident <> '' and exists (select 1 from unidades where empresa_id = p_empresa and upper(ident) = v_tident) then
      raise exception 'O aparelho da troca já está cadastrado no estoque.';
    end if;
    insert into unidades (empresa_id, sku_id, tipo, ident, entrada, cond, bateria, origem, troca_de, venda_origem)
    values (p_empresa, v_tsku, coalesce(p->'troca'->>'tipo','imei'), v_tident, v_data, 'seminovo', coalesce(p->'troca'->>'bateria',''), 'troca', v_cli_json->>'nome', v_venda)
    returning id into v_tun;
    insert into unidades_custo (unidade_id, empresa_id, custo) values (v_tun, p_empresa, v_troca_val);
    v_troca := jsonb_build_object('u', v_tun, 'sku', v_tsku, 'nome', (select nome from skus where id = v_tsku), 'tipo', coalesce(p->'troca'->>'tipo','imei'), 'ident', v_tident, 'valor', v_troca_val);
  end if;

  -- pagamento: a taxa vem da configuração da loja, não do navegador
  v_a_pagar := greatest(v_receita - v_troca_val, 0);
  select taxas into v_taxas from config where empresa_id = p_empresa;
  if v_forma = 'debito' then v_t := coalesce((v_taxas->>'deb')::numeric, 0) / 100;
  elsif v_forma = 'credito' then v_t := coalesce((v_taxas->'cred'->>(v_parc - 1))::numeric, 0) / 100;
  end if;
  if v_t > 0 and v_forma = 'credito' and v_modo = 'repassa' then
    v_cliente_paga := round(v_a_pagar / (1 - v_t), 2); v_recebido := v_a_pagar; v_taxa_valor := 0;
  elsif v_t > 0 then
    v_cliente_paga := v_a_pagar; v_recebido := round(v_a_pagar * (1 - v_t), 2); v_taxa_valor := v_a_pagar - v_recebido;
  else
    v_cliente_paga := v_a_pagar; v_recebido := v_a_pagar;
  end if;

  update vendas set troca = v_troca, taxa_pct = round(v_t * 100, 4), a_pagar = v_a_pagar, cliente_paga = v_cliente_paga,
    recebido = v_recebido, receita = v_receita where id = v_venda;
  insert into vendas_fin (venda_id, empresa_id, cmv, taxa_valor, lucro) values (v_venda, p_empresa, v_cmv, v_taxa_valor, v_receita - v_cmv - v_taxa_valor);
  return v_venda;
end $$;

revoke execute on function public.registrar_venda(uuid, jsonb) from public, anon;
grant execute on function public.registrar_venda(uuid, jsonb) to authenticated;

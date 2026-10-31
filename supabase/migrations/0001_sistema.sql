-- =====================================================================
-- Sistema de gestão para lojas de iPhone e eletrônicos — estrutura do banco
-- Rodar uma única vez no Supabase: SQL Editor > New query > colar > Run.
-- Cada loja (empresa) só enxerga os próprios dados (Row Level Security).
-- Papéis: dono e sócio veem tudo; vendedor não vê custo, lucro nem financeiro.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------
create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) between 2 and 80),
  whatsapp text default '',
  logo text default '' check (length(logo) < 400000),  -- imagem pequena em data URL
  cor text default '#D5951D' check (cor ~ '^#[0-9A-Fa-f]{6}$'),
  status text not null default 'teste' check (status in ('teste','ativa','bloqueada')),
  teste_ate timestamptz not null default now() + interval '7 days',
  pago_ate timestamptz,
  obs_admin text default '',
  criado_por uuid,
  criado_em timestamptz not null default now()
);

create table public.membros (
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  user_id uuid not null,
  papel text not null check (papel in ('dono','socio','vendedor')),
  nome text default '',
  email text default '',
  criado_em timestamptz not null default now(),
  primary key (empresa_id, user_id)
);
create index on public.membros (user_id);

create table public.convites (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  email text not null,
  papel text not null check (papel in ('socio','vendedor')),
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  criado_por uuid,
  criado_em timestamptz not null default now(),
  aceito_em timestamptz,
  aceito_por uuid
);

create table public.superadmins (
  user_id uuid primary key
);

create table public.config (
  empresa_id uuid primary key references public.empresas(id) on delete cascade,
  taxas jsonb not null default '{"deb":null,"cred":[3.0538,4.2421,4.943,5.6426,6.3407,7.0373,7.4931,8.1895,8.8921,9.5923,10.2898,10.9924,11.4417,12.0879,12.74,13.3899,14.0377,14.6903]}'::jsonb,
  mensagem jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz default now()
);

create table public.skus (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  cod int,
  nome text not null check (length(trim(nome)) between 1 and 120),
  cat text not null default 'Outros',
  criado_em timestamptz not null default now(),
  unique (empresa_id, cod),
  unique (id, empresa_id)
);
create unique index skus_nome_unico on public.skus (empresa_id, lower(trim(nome)));

create table public.unidades (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  sku_id uuid not null,
  tipo text not null default 'imei' check (tipo in ('imei','serie')),
  ident text not null default '',
  entrada date not null default current_date,
  cond text not null default 'lacrado' check (cond in ('lacrado','seminovo')),
  bateria text default '',
  obs text default '',
  status text not null default 'estoque' check (status in ('estoque','vendido')),
  origem text not null default 'compra' check (origem in ('compra','troca')),
  troca_de text default '',
  venda_id uuid,
  venda_origem uuid,
  saida date,
  criado_em timestamptz not null default now(),
  unique (id, empresa_id),
  foreign key (sku_id, empresa_id) references public.skus(id, empresa_id)
);
create index on public.unidades (empresa_id, status);
create index on public.unidades (sku_id);
create unique index unidades_ident_unico on public.unidades (empresa_id, upper(ident)) where ident <> '';

-- custo fica separado para o vendedor não enxergar
create table public.unidades_custo (
  unidade_id uuid primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  custo numeric(12,2) not null check (custo >= 0),
  foreign key (unidade_id, empresa_id) references public.unidades(id, empresa_id) on delete cascade
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  fone text default '',
  nasc text default '',
  cpf text default '',
  email text default '',
  endereco jsonb,
  criado_em timestamptz not null default now(),
  unique (id, empresa_id)
);
create index on public.clientes (empresa_id);

create table public.vendas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  data date not null default current_date,
  sem_data boolean not null default false,
  cliente_id uuid,
  cliente jsonb not null default '{}'::jsonb,   -- cópia dos dados do cliente no dia da venda
  vendedor text default '',
  vendedor_id uuid,
  origem text default '',
  forma text not null default 'pix' check (forma in ('pix','dinheiro','debito','credito','nao_informado')),
  parcelas int not null default 1 check (parcelas between 1 and 18),
  modo text check (modo in ('repassa','absorve')),
  taxa_pct numeric(8,4) not null default 0,
  troca jsonb,
  a_pagar numeric(12,2) not null default 0,
  cliente_paga numeric(12,2) not null default 0,
  recebido numeric(12,2) not null default 0,
  receita numeric(12,2) not null default 0,
  obs text default '',
  criado_em timestamptz not null default now(),
  unique (id, empresa_id),
  foreign key (cliente_id, empresa_id) references public.clientes(id, empresa_id) on delete set null (cliente_id)
);
create index on public.vendas (empresa_id, data);

create table public.venda_itens (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  unidade_id uuid,
  sku_id uuid,
  nome text not null,
  tipo text default 'imei',
  ident text default '',
  cond text default 'lacrado',
  preco numeric(12,2) not null default 0 check (preco >= 0),
  brinde boolean not null default false,
  ordem int not null default 0,
  unique (id, empresa_id),
  foreign key (venda_id, empresa_id) references public.vendas(id, empresa_id) on delete cascade,
  foreign key (unidade_id, empresa_id) references public.unidades(id, empresa_id) on delete set null (unidade_id),
  foreign key (sku_id, empresa_id) references public.skus(id, empresa_id) on delete set null (sku_id)
);
create index on public.venda_itens (venda_id);
alter table public.unidades add foreign key (venda_id, empresa_id) references public.vendas(id, empresa_id) on delete set null (venda_id);
create index on public.venda_itens (empresa_id);

create table public.venda_itens_custo (
  item_id uuid primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  custo numeric(12,2) not null default 0,
  foreign key (item_id, empresa_id) references public.venda_itens(id, empresa_id) on delete cascade
);

create table public.vendas_fin (
  venda_id uuid primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  foreign key (venda_id, empresa_id) references public.vendas(id, empresa_id) on delete cascade,
  cmv numeric(12,2) not null default 0,
  taxa_valor numeric(12,2) not null default 0,
  lucro numeric(12,2) not null default 0
);

create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  tipo text not null check (tipo in ('despesa','prolabore','entrada')),
  data date not null default current_date,
  sem_data boolean not null default false,
  valor numeric(12,2) not null check (valor > 0),
  cat text default '',
  pessoa text default '',
  descr text default '',
  fixa boolean not null default false,
  criado_em timestamptz not null default now()
);
create index on public.lancamentos (empresa_id, data);

-- ---------------------------------------------------------------------
-- Funções de permissão (usadas pelas regras de acesso)
-- ---------------------------------------------------------------------
create or replace function public.meu_papel(eid uuid) returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select papel from membros where empresa_id = eid and user_id = auth.uid()
$$;
create or replace function public.e_membro(eid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from membros where empresa_id = eid and user_id = auth.uid())
$$;
create or replace function public.ve_custos(eid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select papel in ('dono','socio') from membros where empresa_id = eid and user_id = auth.uid()), false)
$$;
create or replace function public.e_superadmin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from superadmins where user_id = auth.uid())
$$;
create or replace function public.empresa_liberada(eid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select status = 'ativa' or (status = 'teste' and teste_ate > now()) from empresas where id = eid), false)
$$;
create or replace function public.pode_escrever(eid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.e_membro(eid) and public.empresa_liberada(eid)
$$;
create or replace function public.pode_gerir(eid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.ve_custos(eid) and public.empresa_liberada(eid)
$$;

-- código do SKU automático (próximo número livre da loja)
create or replace function public.tg_sku_cod() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.cod is null then
    select coalesce(max(cod), 0) + 1 into new.cod from skus where empresa_id = new.empresa_id;
  end if;
  new.nome := regexp_replace(trim(new.nome), '\s+', ' ', 'g');
  return new;
end $$;
create trigger sku_cod before insert or update of nome, cod on public.skus
for each row execute function public.tg_sku_cod();

-- custo médio ponderado: tudo que entrou − custo já baixado em vendas, dividido pelas unidades em estoque
create or replace function public.custo_medio(p_sku uuid) returns numeric
language sql stable security definer set search_path = public, pg_temp as $$
  with u as (
    select un.id, un.status, coalesce(c.custo, 0) custo
    from unidades un left join unidades_custo c on c.unidade_id = un.id
    where un.sku_id = p_sku
  ), baixado as (
    select coalesce(sum(ic.custo), 0) v
    from venda_itens vi join venda_itens_custo ic on ic.item_id = vi.id
    where vi.unidade_id in (select id from u)
  )
  select case when (select count(*) from u where status = 'estoque') = 0 then 0
    else round(greatest((select coalesce(sum(custo),0) from u) - (select v from baixado), 0)
               / (select count(*) from u where status = 'estoque'), 2) end
$$;

-- ---------------------------------------------------------------------
-- Regras de acesso (Row Level Security)
-- ---------------------------------------------------------------------
alter table public.empresas enable row level security;
alter table public.membros enable row level security;
alter table public.convites enable row level security;
alter table public.superadmins enable row level security;
alter table public.config enable row level security;
alter table public.skus enable row level security;
alter table public.unidades enable row level security;
alter table public.unidades_custo enable row level security;
alter table public.clientes enable row level security;
alter table public.vendas enable row level security;
alter table public.venda_itens enable row level security;
alter table public.venda_itens_custo enable row level security;
alter table public.vendas_fin enable row level security;
alter table public.lancamentos enable row level security;

create policy empresas_ler on public.empresas for select to authenticated using (public.e_membro(id) or public.e_superadmin());
create policy empresas_editar on public.empresas for update to authenticated using (public.meu_papel(id) = 'dono') with check (public.meu_papel(id) = 'dono');

create policy membros_ler on public.membros for select to authenticated using (public.e_membro(empresa_id));
create policy convites_ler on public.convites for select to authenticated using (public.ve_custos(empresa_id));

create policy config_ler on public.config for select to authenticated using (public.e_membro(empresa_id));
create policy config_editar on public.config for update to authenticated using (public.pode_gerir(empresa_id)) with check (public.pode_gerir(empresa_id));

create policy skus_ler on public.skus for select to authenticated using (public.e_membro(empresa_id));
create policy skus_criar on public.skus for insert to authenticated with check (public.pode_gerir(empresa_id));
create policy skus_editar on public.skus for update to authenticated using (public.pode_gerir(empresa_id)) with check (public.pode_gerir(empresa_id));
create policy skus_apagar on public.skus for delete to authenticated using (public.pode_gerir(empresa_id));

create policy unidades_ler on public.unidades for select to authenticated using (public.e_membro(empresa_id));
create policy unidades_editar on public.unidades for update to authenticated using (public.pode_gerir(empresa_id)) with check (public.pode_gerir(empresa_id));
create policy unidades_apagar on public.unidades for delete to authenticated using (public.pode_gerir(empresa_id) and status = 'estoque');

create policy ucusto_ler on public.unidades_custo for select to authenticated using (public.ve_custos(empresa_id));
create policy ucusto_editar on public.unidades_custo for update to authenticated using (public.pode_gerir(empresa_id)) with check (public.pode_gerir(empresa_id));

create policy clientes_ler on public.clientes for select to authenticated using (public.e_membro(empresa_id));
create policy clientes_criar on public.clientes for insert to authenticated with check (public.pode_escrever(empresa_id));
create policy clientes_editar on public.clientes for update to authenticated using (public.pode_escrever(empresa_id)) with check (public.pode_escrever(empresa_id));
create policy clientes_apagar on public.clientes for delete to authenticated using (public.pode_gerir(empresa_id));

create policy vendas_ler on public.vendas for select to authenticated using (public.e_membro(empresa_id));
create policy itens_ler on public.venda_itens for select to authenticated using (public.e_membro(empresa_id));
create policy icusto_ler on public.venda_itens_custo for select to authenticated using (public.ve_custos(empresa_id));
create policy vfin_ler on public.vendas_fin for select to authenticated using (public.ve_custos(empresa_id));

create policy lanc_ler on public.lancamentos for select to authenticated using (public.ve_custos(empresa_id));
create policy lanc_criar on public.lancamentos for insert to authenticated with check (public.pode_gerir(empresa_id));
create policy lanc_editar on public.lancamentos for update to authenticated using (public.pode_gerir(empresa_id)) with check (public.pode_gerir(empresa_id));
create policy lanc_apagar on public.lancamentos for delete to authenticated using (public.pode_gerir(empresa_id));

-- Permissões de tabela: anônimo não acessa nada; logado passa pelas regras acima.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
grant select on all tables in schema public to authenticated;
revoke select on public.superadmins from authenticated;
revoke select on public.empresas from authenticated;
grant select (id, nome, whatsapp, logo, cor, status, teste_ate, pago_ate, criado_em) on public.empresas to authenticated;
grant update (nome, whatsapp, logo, cor) on public.empresas to authenticated;
grant insert, delete on public.skus, public.clientes, public.lancamentos to authenticated;
grant delete on public.unidades to authenticated;
grant update (cod, nome, cat) on public.skus to authenticated;
grant update (sku_id, tipo, ident, entrada, cond, bateria, obs) on public.unidades to authenticated;
grant update (nome, fone, nasc, cpf, email, endereco) on public.clientes to authenticated;
grant update (tipo, data, valor, cat, pessoa, descr, fixa) on public.lancamentos to authenticated;
grant update (taxas, mensagem, atualizado_em) on public.config to authenticated;

-- ---------------------------------------------------------------------
-- Ações (funções chamadas pelo site)
-- ---------------------------------------------------------------------
create or replace function public.minhas_empresas()
returns table (id uuid, nome text, papel text, status text, teste_ate timestamptz, pago_ate timestamptz, logo text, cor text, whatsapp text, superadmin boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  select e.id, e.nome, m.papel, e.status, e.teste_ate, e.pago_ate, e.logo, e.cor, e.whatsapp, public.e_superadmin()
  from membros m join empresas e on e.id = m.empresa_id
  where m.user_id = auth.uid()
  order by m.criado_em
$$;

create or replace function public.criar_empresa(p_nome text, p_whatsapp text default '', p_meu_nome text default '')
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_email text;
begin
  if auth.uid() is null then raise exception 'Faça login primeiro.'; end if;
  if exists (select 1 from membros where user_id = auth.uid() and papel = 'dono') then
    raise exception 'Você já tem uma loja cadastrada.';
  end if;
  select email into v_email from auth.users where id = auth.uid();
  insert into empresas (nome, whatsapp, criado_por) values (trim(p_nome), coalesce(p_whatsapp, ''), auth.uid()) returning id into v_id;
  insert into membros (empresa_id, user_id, papel, nome, email) values (v_id, auth.uid(), 'dono', coalesce(p_meu_nome, ''), coalesce(v_email, ''));
  insert into config (empresa_id) values (v_id);
  return v_id;
end $$;

create or replace function public.criar_convite(p_empresa uuid, p_email text, p_papel text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_token text; v_papel text := public.meu_papel(p_empresa);
begin
  if v_papel is null or v_papel = 'vendedor' then raise exception 'Só o dono ou o sócio podem convidar.'; end if;
  if p_papel = 'socio' and v_papel <> 'dono' then raise exception 'Só o dono pode convidar um sócio.'; end if;
  if p_papel not in ('socio','vendedor') then raise exception 'Papel inválido.'; end if;
  if not public.empresa_liberada(p_empresa) then raise exception 'O período de teste acabou. Ative a assinatura para convidar pessoas.'; end if;
  insert into convites (empresa_id, email, papel, criado_por) values (p_empresa, lower(trim(p_email)), p_papel, auth.uid()) returning token into v_token;
  return v_token;
end $$;

create or replace function public.ver_convite(p_token text)
returns table (empresa text, papel text, email text, aceito boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  select e.nome, c.papel, c.email, c.aceito_em is not null from convites c join empresas e on e.id = c.empresa_id where c.token = p_token
$$;

create or replace function public.aceitar_convite(p_token text, p_meu_nome text default '')
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare c convites%rowtype; v_email text;
begin
  if auth.uid() is null then raise exception 'Faça login primeiro.'; end if;
  select * into c from convites where token = p_token for update;
  if not found then raise exception 'Convite não encontrado.'; end if;
  if c.aceito_em is not null then raise exception 'Este convite já foi usado.'; end if;
  if c.criado_em < now() - interval '14 days' then raise exception 'Convite vencido. Peça um novo.'; end if;
  select email into v_email from auth.users where id = auth.uid();
  if lower(coalesce(v_email, '')) <> lower(c.email) then
    raise exception 'Este convite é para %. Entre com esse e-mail.', c.email;
  end if;
  insert into membros (empresa_id, user_id, papel, nome, email) values (c.empresa_id, auth.uid(), c.papel, coalesce(p_meu_nome, ''), v_email)
  on conflict (empresa_id, user_id) do update set papel = excluded.papel where membros.papel = 'vendedor';
  update convites set aceito_em = now(), aceito_por = auth.uid() where id = c.id;
  return c.empresa_id;
end $$;

create or replace function public.remover_membro(p_empresa uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if coalesce(public.meu_papel(p_empresa), '') <> 'dono' then raise exception 'Só o dono pode remover pessoas.'; end if;
  if p_user = auth.uid() then raise exception 'Você não pode remover a si mesmo.'; end if;
  delete from membros where empresa_id = p_empresa and user_id = p_user;
end $$;

create or replace function public.cancelar_convite(p_convite uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_emp uuid;
begin
  select empresa_id into v_emp from convites where id = p_convite;
  if not public.ve_custos(v_emp) then raise exception 'Sem permissão.'; end if;
  delete from convites where id = p_convite and aceito_em is null;
end $$;

-- Entrada no estoque (uma ou várias unidades com o mesmo custo)
create or replace function public.entrada_estoque(p_empresa uuid, p_sku uuid, p_qtd int, p_custo numeric, p_tipo text default 'imei',
  p_ident text default '', p_entrada date default current_date, p_cond text default 'lacrado', p_bateria text default '', p_obs text default '')
returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare i int; v_id uuid; v_qtd int := greatest(1, least(coalesce(p_qtd,1), 200)); v_ident text := upper(trim(coalesce(p_ident,'')));
begin
  if not public.pode_gerir(p_empresa) then raise exception 'Sem permissão para dar entrada no estoque.'; end if;
  if not exists (select 1 from skus where id = p_sku and empresa_id = p_empresa) then raise exception 'SKU não encontrado.'; end if;
  if p_custo is null or p_custo < 0 then raise exception 'Informe o custo.'; end if;
  if v_ident <> '' then
    v_qtd := 1;
    if p_tipo = 'imei' then v_ident := regexp_replace(v_ident, '\D', '', 'g'); end if;
    if exists (select 1 from unidades where empresa_id = p_empresa and upper(ident) = v_ident) then
      raise exception 'Esse IMEI ou número de série já está cadastrado.';
    end if;
  end if;
  for i in 1..v_qtd loop
    insert into unidades (empresa_id, sku_id, tipo, ident, entrada, cond, bateria, obs)
    values (p_empresa, p_sku, coalesce(p_tipo,'imei'), v_ident, coalesce(p_entrada, current_date), coalesce(p_cond,'lacrado'), coalesce(p_bateria,''), coalesce(p_obs,''))
    returning id into v_id;
    insert into unidades_custo (unidade_id, empresa_id, custo) values (v_id, p_empresa, round(p_custo, 2));
  end loop;
  return v_qtd;
end $$;

-- Venda completa em uma única operação (o custo é calculado no servidor)
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

create or replace function public.estornar_venda(p_venda uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v vendas%rowtype;
begin
  select * into v from vendas where id = p_venda for update;
  if not found then raise exception 'Venda não encontrada.'; end if;
  if not public.pode_gerir(v.empresa_id) then raise exception 'Só o dono ou o sócio podem estornar vendas.'; end if;
  if v.troca is not null and exists (select 1 from unidades where id = (v.troca->>'u')::uuid and status <> 'estoque') then
    raise exception 'O aparelho da troca já foi vendido. Estorne aquela venda primeiro.';
  end if;
  update unidades set status = 'estoque', venda_id = null, saida = null where venda_id = p_venda;
  if v.troca is not null then delete from unidades where id = (v.troca->>'u')::uuid; end if;
  delete from vendas where id = p_venda;
end $$;

create or replace function public.juntar_skus(p_origem uuid, p_destino uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_emp uuid; v_nome text;
begin
  select empresa_id into v_emp from skus where id = p_origem;
  if v_emp is null or not exists (select 1 from skus where id = p_destino and empresa_id = v_emp) then raise exception 'SKU não encontrado.'; end if;
  if not public.pode_gerir(v_emp) then raise exception 'Sem permissão.'; end if;
  if p_origem = p_destino then raise exception 'Escolha um SKU diferente.'; end if;
  select nome into v_nome from skus where id = p_destino;
  update unidades set sku_id = p_destino where sku_id = p_origem;
  update venda_itens set sku_id = p_destino, nome = v_nome where sku_id = p_origem;
  update vendas set troca = jsonb_set(jsonb_set(troca, '{sku}', to_jsonb(p_destino::text)), '{nome}', to_jsonb(v_nome))
    where empresa_id = v_emp and troca->>'sku' = p_origem::text;
  delete from skus where id = p_origem;
end $$;

create or replace function public.ligar_itens_sem_sku(p_empresa uuid, p_nome text, p_sku uuid)
returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare n int; v_nome text;
begin
  if not public.pode_gerir(p_empresa) then raise exception 'Sem permissão.'; end if;
  select nome into v_nome from skus where id = p_sku and empresa_id = p_empresa;
  if v_nome is null then raise exception 'SKU não encontrado.'; end if;
  update venda_itens set sku_id = p_sku, nome = v_nome
  where empresa_id = p_empresa and (sku_id is null) and lower(trim(nome)) = lower(trim(p_nome));
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.editar_custo_unidade(p_unidade uuid, p_custo numeric)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_emp uuid;
begin
  select empresa_id into v_emp from unidades where id = p_unidade and status = 'estoque';
  if v_emp is null then raise exception 'Aparelho não encontrado no estoque.'; end if;
  if not public.pode_gerir(v_emp) then raise exception 'Sem permissão.'; end if;
  insert into unidades_custo (unidade_id, empresa_id, custo) values (p_unidade, v_emp, round(p_custo, 2))
  on conflict (unidade_id) do update set custo = excluded.custo;
end $$;

-- ---------------------------------------------------------------------
-- Painel do dono do sistema (superadmin)
-- ---------------------------------------------------------------------
create or replace function public.admin_empresas()
returns table (id uuid, nome text, status text, teste_ate timestamptz, pago_ate timestamptz, criado_em timestamptz,
               dono_email text, whatsapp text, membros bigint, vendas_30d bigint, obs_admin text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.e_superadmin() then raise exception 'Acesso restrito.'; end if;
  return query
    select e.id, e.nome, e.status, e.teste_ate, e.pago_ate, e.criado_em,
      (select m.email from membros m where m.empresa_id = e.id and m.papel = 'dono' limit 1),
      e.whatsapp,
      (select count(*) from membros m where m.empresa_id = e.id),
      (select count(*) from vendas v where v.empresa_id = e.id and v.criado_em > now() - interval '30 days'),
      e.obs_admin
    from empresas e order by e.criado_em desc;
end $$;

create or replace function public.admin_definir(p_empresa uuid, p_status text, p_dias int default null, p_obs text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.e_superadmin() then raise exception 'Acesso restrito.'; end if;
  if p_status not in ('teste','ativa','bloqueada') then raise exception 'Situação inválida.'; end if;
  update empresas set
    status = p_status,
    teste_ate = case when p_status = 'teste' and p_dias is not null then now() + make_interval(days => p_dias) else teste_ate end,
    pago_ate = case when p_status = 'ativa' and p_dias is not null then greatest(coalesce(pago_ate, now()), now()) + make_interval(days => p_dias) else pago_ate end,
    obs_admin = coalesce(p_obs, obs_admin)
  where id = p_empresa;
end $$;

-- assinatura paga vencida volta a bloquear sozinha
create or replace function public.empresa_liberada(eid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select (status = 'ativa' and (pago_ate is null or pago_ate > now())) or (status = 'teste' and teste_ate > now()) from empresas where id = eid), false)
$$;

-- Funções: só usuário logado executa.
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
-- usadas só por dentro das outras funções
revoke execute on function public.custo_medio(uuid) from authenticated;
revoke execute on function public.tg_sku_cod() from authenticated;

-- A tela de convite mostra o nome da loja antes do login.
grant execute on function public.ver_convite(text) to anon;

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

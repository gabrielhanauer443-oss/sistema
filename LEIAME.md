# Balcão — gestão para lojas de iPhone e eletrônicos

Sistema web com várias lojas (multiempresa). Cada loja vê só os próprios dados.

## Pastas

- `app/` — o site (HTML, CSS e JavaScript puro, sem etapa de build). É o que vai para a Vercel.
  - `config.js` — endereço e chave pública do Supabase, nome do sistema e WhatsApp do suporte.
- `supabase/migrations/0001_sistema.sql` — tabelas, regras de acesso (RLS) e funções. Rodar uma vez no SQL Editor.
- `importar_south.sql` (entregue separado, fora do GitHub: tem dados de clientes) — dados da South. Rodar uma vez no SQL Editor, depois de criar a loja pelo site.
- `dev/` — testes locais (não vão para o ar):
  - `test_rls.py` — 70 testes de segurança e cálculo direto no PostgreSQL.
  - `e2e.py` — teste completo no navegador (cadastro, estoque, venda, convite, vendedor, teste vencido, painel do sistema).
  - `server.js` + `fake-supabase.js` — imitam o Supabase sobre um PostgreSQL local para os testes.

## Papéis

| Papel | Vê custos, lucro e financeiro | Registra vendas | Estoque e SKUs | Convida |
| --- | --- | --- | --- | --- |
| Dono | Sim | Sim | Sim | Sócio e vendedor |
| Sócio | Sim | Sim | Sim | Vendedor |
| Vendedor | Não | Sim | Só consulta | Não |

O custo de cada venda é calculado no banco (custo médio ponderado), nunca no navegador.

## Assinatura

Loja nova: 7 dias de teste. Depois, só leitura até o dono do sistema clicar em “Ativar 30 dias” na tela Lojas do sistema.
Para virar dono do sistema: `insert into public.superadmins (user_id) select id from auth.users where email = 'seu@email';`

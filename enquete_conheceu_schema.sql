-- Tabela para armazenar as respostas da enquete "Como você conheceu a gente?"
create table public.enquete_conheceu (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  resposta text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativa RLS (Row Level Security)
alter table public.enquete_conheceu enable row level security;

-- Política: Usuário pode inserir sua própria resposta
create policy "Usuários podem inserir suas próprias respostas"
  on public.enquete_conheceu for insert
  with check (auth.uid() = user_id);

-- Política: Usuário pode ver sua própria resposta
create policy "Usuários podem ver suas próprias respostas"
  on public.enquete_conheceu for select
  using (auth.uid() = user_id);

-- Política: Admins podem ver todas as respostas
create policy "Admins podem ver todas as respostas"
  on public.enquete_conheceu for select
  using (
    exists (
      select 1 from public.perfis
      where perfis.id = auth.uid() and perfis.role = 'admin'
    )
  );

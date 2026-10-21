-- Push das carteiras: rodar UMA vez no Supabase (projeto dxybmayffxvepmwbyezc)
-- Painel do Supabase → SQL Editor → New query → colar tudo → trocar <SERVICE_ROLE_KEY> → Run.
-- <SERVICE_ROLE_KEY>: Project Settings → API Keys → "service_role" (secreta; NÃO commitar).
-- A tabela membros_push e a chave VAPID (segredo VAPID_JWK) já existem: são as do clubedajuh.

create extension if not exists pg_net;
create index if not exists membros_push_app_email on public.membros_push (app, email);

-- a chave de serviço no Vault: é ela que autoriza o disparo (membros-push acao=enviar)
select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_push', 'chave de serviço usada pelo disparo de push');

-- disparo manual ou por gatilho (email null = todos os inscritos do app)
--   select public.membros_push_enviar('carteiras', null, 'Aula nova!', 'Já está na aba Aulas.', '/#aulas');
create or replace function public.membros_push_enviar(p_app text, p_email text, p_titulo text, p_texto text, p_url text default '/#inicio', p_tag text default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare tok text; req bigint;
begin
  select decrypted_secret into tok from vault.decrypted_secrets where name = 'service_role_push' limit 1;
  select net.http_post(
    url := 'https://dxybmayffxvepmwbyezc.supabase.co/functions/v1/membros-push',
    body := jsonb_build_object('acao','enviar','app',p_app,'email',p_email,'title',p_titulo,'body',p_texto,'url',p_url,'tag',coalesce(p_tag,'novidade')),
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || tok)
  ) into req;
  return req;
end $$;
revoke all on function public.membros_push_enviar(text,text,text,text,text,text) from public, anon, authenticated;

-- suporte: ao preencher a resposta, marca respondido e avisa a cliente no celular
create or replace function public.membros_suporte_respondido() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.resposta is not null and new.resposta <> '' and new.resposta is distinct from old.resposta then
    new.respondido := now();
    if new.status = 'aberto' then new.status := 'respondido'; end if;
    perform public.membros_push_enviar(new.app, new.email, 'Sua mensagem foi respondida',
      'Protocolo ' || new.protocolo || '. Toque pra ler a resposta.', '/#suporte', 'suporte-' || new.protocolo);
  end if;
  return new;
end $$;
drop trigger if exists membros_suporte_respondido on public.membros_suporte;
create trigger membros_suporte_respondido before update on public.membros_suporte
  for each row execute function public.membros_suporte_respondido();

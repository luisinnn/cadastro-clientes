"use server";
// "use server" = estas funções rodam SÓ no servidor. O formulário no navegador
// chama a função, mas o código (e as chaves) nunca vão para o navegador.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Formato da resposta que volta para o formulário mostrar na tela.
export type EstadoAuth = { erro?: string; mensagem?: string };

function lerCampos(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    senha: String(formData.get("senha") ?? ""),
  };
}

export async function entrar(
  _estadoAnterior: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const { email, senha } = lerCampos(formData);
  if (!email || !senha) return { erro: "Preencha e-mail e senha." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    // Mensagem genérica de propósito: não revela se o e-mail existe.
    return { erro: "E-mail ou senha inválidos (ou e-mail ainda não confirmado)." };
  }

  // Login OK: o Supabase já gravou o cookie de sessão. Vai para a lista.
  redirect("/clientes");
}

export async function cadastrar(
  _estadoAnterior: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const { email, senha } = lerCampos(formData);
  if (!email || !senha) return { erro: "Preencha e-mail e senha." };
  if (senha.length < 6) return { erro: "A senha precisa ter pelo menos 6 caracteres." };

  // Endereço do site (ex.: http://localhost:3000), usado no link de confirmação.
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { erro: error.message };

  // Se a confirmação de e-mail estiver DESLIGADA no Supabase, já vem sessão.
  if (data.session) redirect("/clientes");

  // Se estiver LIGADA (padrão), o usuário precisa clicar no link do e-mail.
  return {
    mensagem: "Conta criada! Confira seu e-mail e clique no link para ativar.",
  };
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

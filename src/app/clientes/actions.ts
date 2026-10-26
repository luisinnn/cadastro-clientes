"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUsuario } from "@/lib/auth";
import { UUID } from "@/lib/clientes";
import { createClient } from "@/lib/supabase/server";

export type ValoresCliente = {
  nome: string;
  telefone: string;
  email: string;
  observacoes: string;
};

// O que volta para o formulário quando algo dá errado. "valores" devolve o que
// a pessoa digitou, para o formulário não aparecer vazio depois do erro.
export type EstadoCliente = { erro?: string; valores?: ValoresCliente };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Lê e valida os campos do formulário. Nunca confie só na validação do
// navegador: qualquer um pode mandar uma requisição sem passar pela tela.
function validar(formData: FormData) {
  const valores: ValoresCliente = {
    nome: String(formData.get("nome") ?? "").trim(),
    telefone: String(formData.get("telefone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    observacoes: String(formData.get("observacoes") ?? "").trim(),
  };

  let erro: string | undefined;
  if (!valores.nome) erro = "O nome é obrigatório.";
  else if (valores.nome.length > 200) erro = "O nome pode ter no máximo 200 caracteres.";
  else if (valores.email && !EMAIL.test(valores.email)) erro = "E-mail inválido.";

  // Campos opcionais vazios viram null no banco (em vez de texto vazio).
  const dados = {
    nome: valores.nome,
    telefone: valores.telefone || null,
    email: valores.email || null,
    observacoes: valores.observacoes || null,
  };

  return { valores, dados, erro };
}

export async function criarCliente(
  _estadoAnterior: EstadoCliente,
  formData: FormData,
): Promise<EstadoCliente> {
  await getUsuario(); // não logado -> /login
  const { valores, dados, erro } = validar(formData);
  if (erro) return { erro, valores };

  const supabase = await createClient();
  // user_id não é enviado: o banco preenche com auth.uid() (default da coluna)
  // e o RLS (WITH CHECK) garante que ninguém grave em nome de outro usuário.
  const { error } = await supabase.from("clientes").insert(dados);
  if (error) return { erro: `Não foi possível salvar: ${error.message}`, valores };

  revalidatePath("/clientes"); // lista desatualizada -> recarregar
  redirect("/clientes");
}

// O "id" chega primeiro via .bind() lá no formulário de edição.
export async function atualizarCliente(
  id: string,
  _estadoAnterior: EstadoCliente,
  formData: FormData,
): Promise<EstadoCliente> {
  await getUsuario();
  const { valores, dados, erro } = validar(formData);
  if (erro) return { erro, valores };
  if (!UUID.test(id)) return { erro: "Cliente não encontrado.", valores };

  const supabase = await createClient();
  // .select("id") faz o banco devolver as linhas alteradas. Se vier vazio,
  // o cliente não existe ou é de outro usuário (o RLS bloqueou).
  const { data, error } = await supabase
    .from("clientes")
    .update(dados)
    .eq("id", id)
    .select("id");

  if (error) return { erro: `Não foi possível salvar: ${error.message}`, valores };
  if (!data.length) return { erro: "Cliente não encontrado.", valores };

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function excluirCliente(id: string): Promise<void> {
  await getUsuario();
  if (!UUID.test(id)) return;

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) throw new Error(`Não foi possível excluir: ${error.message}`);

  revalidatePath("/clientes");
}

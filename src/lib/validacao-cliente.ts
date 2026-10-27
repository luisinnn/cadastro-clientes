// Regras de validação do cliente. Arquivo "puro": não acessa banco, cookies
// nem nada do Next.js. Por isso dá para testar sozinho (validacao-cliente.test.ts).

export type ValoresCliente = {
  nome: string;
  telefone: string;
  email: string;
  observacoes: string;
};

// Formato que vai para o banco (campos opcionais vazios viram null).
export type DadosCliente = {
  nome: string;
  telefone: string | null;
  email: string | null;
  observacoes: string | null;
};

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NOME_MAX = 200;

// Lê e valida os campos do formulário. Nunca confie só na validação do
// navegador: qualquer um pode mandar uma requisição sem passar pela tela.
// Retorna: valores (o que foi digitado, já sem espaços nas pontas),
// dados (pronto para o banco) e erro (mensagem, ou undefined se estiver OK).
export function validarCliente(formData: FormData): {
  valores: ValoresCliente;
  dados: DadosCliente;
  erro?: string;
} {
  const valores: ValoresCliente = {
    nome: String(formData.get("nome") ?? "").trim(),
    telefone: String(formData.get("telefone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    observacoes: String(formData.get("observacoes") ?? "").trim(),
  };

  let erro: string | undefined;
  if (!valores.nome) erro = "O nome é obrigatório.";
  else if (valores.nome.length > NOME_MAX)
    erro = `O nome pode ter no máximo ${NOME_MAX} caracteres.`;
  else if (valores.email && !EMAIL.test(valores.email)) erro = "E-mail inválido.";

  const dados: DadosCliente = {
    nome: valores.nome,
    telefone: valores.telefone || null,
    email: valores.email || null,
    observacoes: valores.observacoes || null,
  };

  return { valores, dados, erro };
}

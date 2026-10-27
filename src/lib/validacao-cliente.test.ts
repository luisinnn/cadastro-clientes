import { describe, expect, it } from "vitest";
import { NOME_MAX, UUID, validarCliente } from "./validacao-cliente";

// Monta um FormData igual ao que o navegador envia ao salvar o formulário.
function form(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [chave, valor] of Object.entries(campos)) fd.set(chave, valor);
  return fd;
}

describe("validarCliente", () => {
  it("aceita um cliente com todos os campos válidos", () => {
    const r = validarCliente(
      form({
        nome: "Maria Silva",
        telefone: "(11) 99999-0000",
        email: "maria@exemplo.com",
        observacoes: "Prefere contato à tarde",
      }),
    );

    expect(r.erro).toBeUndefined();
    expect(r.dados).toEqual({
      nome: "Maria Silva",
      telefone: "(11) 99999-0000",
      email: "maria@exemplo.com",
      observacoes: "Prefere contato à tarde",
    });
  });

  it("aceita só o nome; opcionais vazios viram null para o banco", () => {
    const r = validarCliente(form({ nome: "João", telefone: "", email: "", observacoes: "" }));

    expect(r.erro).toBeUndefined();
    expect(r.dados).toEqual({ nome: "João", telefone: null, email: null, observacoes: null });
  });

  it("trata campos ausentes do formulário como vazios", () => {
    const r = validarCliente(form({ nome: "Ana" }));

    expect(r.erro).toBeUndefined();
    expect(r.dados.email).toBeNull();
  });

  it("remove espaços das pontas", () => {
    const r = validarCliente(form({ nome: "  Carlos  ", email: "  c@x.com " }));

    expect(r.dados.nome).toBe("Carlos");
    expect(r.dados.email).toBe("c@x.com");
  });

  it.each([
    ["vazio", ""],
    ["só espaços", "    "],
  ])("rejeita nome %s", (_caso, nome) => {
    expect(validarCliente(form({ nome })).erro).toBe("O nome é obrigatório.");
  });

  it(`aceita nome com exatamente ${NOME_MAX} caracteres e rejeita com ${NOME_MAX + 1}`, () => {
    expect(validarCliente(form({ nome: "a".repeat(NOME_MAX) })).erro).toBeUndefined();
    expect(validarCliente(form({ nome: "a".repeat(NOME_MAX + 1) })).erro).toMatch(/no máximo/);
  });

  it.each(["sem-arroba", "a@b", "a @b.com", "@b.com"])("rejeita e-mail inválido: %s", (email) => {
    expect(validarCliente(form({ nome: "X", email })).erro).toBe("E-mail inválido.");
  });

  it("devolve o que foi digitado junto com o erro (para repreencher a tela)", () => {
    const r = validarCliente(form({ nome: "Bia", email: "errado" }));

    expect(r.erro).toBe("E-mail inválido.");
    expect(r.valores).toEqual({ nome: "Bia", telefone: "", email: "errado", observacoes: "" });
  });
});

describe("UUID", () => {
  it("reconhece um id válido do banco", () => {
    expect(UUID.test("3f2b8c1e-9a4d-4e7f-b123-0a1b2c3d4e5f")).toBe(true);
  });

  it.each(["abc", "123", "", "3f2b8c1e-9a4d-4e7f-b123-0a1b2c3d4e5f-extra"])(
    "rejeita id inválido: %s",
    (id) => {
      expect(UUID.test(id)).toBe(false);
    },
  );
});

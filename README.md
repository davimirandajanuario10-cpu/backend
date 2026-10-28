# API de Usuarios

Backend Node.js com Express e MySQL. A API usa a tabela `usuarios` e a chave primaria `id_usu` definida em `database.sql`.

## Configuracao

O arquivo `.env` fica na raiz do workspace (`c:\www\.env`) e e carregado pelo `app.js`. Preserve os valores que ja estao configurados e confirme que existem as variaveis abaixo. O nome do banco deve ser preenchido pelo responsavel pelo banco; nao foi presumido neste projeto.

```env
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
PORT=5000
```

Execute `database.sql` conectado ao banco correto. O script cria a tabela se ela ainda nao existir e nao cria nem escolhe um banco de dados.

## Execucao

No terminal do VS Code, a partir de `c:\www`:

```powershell
npm --prefix .\backend install
npm --prefix .\backend run dev
```

Para executar sem Nodemon:

```powershell
npm --prefix .\backend start
```

A API fica em `http://localhost:5000` por padrao. A variavel `PORT` pode alterar a porta. A rota antiga `/usuario` continua disponivel, e `/usuarios` e a base recomendada.

## Endpoints

Todas as chamadas de escrita usam `Content-Type: application/json`.

| Metodo | Caminho | Sucesso | Resultado |
| --- | --- | --- | --- |
| GET | `/usuarios` | 200 | Lista usuarios |
| GET | `/usuarios/:id` | 200 | Busca um usuario |
| POST | `/usuarios` | 201 | Cadastra um usuario |
| PATCH | `/usuarios/:id` | 200 | Atualiza os campos enviados |
| DELETE | `/usuarios/:id` | 204 | Exclui um usuario |

Exemplo de cadastro:

```json
{
  "nome": "Maria Silva",
  "email": "maria@example.com",
  "senha": "senha-de-teste",
  "contato": "11999990000",
  "genero": "Nao informado"
}
```

Exemplo de atualizacao parcial:

```json
{
  "nome": "Maria Souza",
  "ativo": false
}
```

Exemplos PowerShell para Postman/Insomnia ou terminal:

```powershell
Invoke-RestMethod http://localhost:5000/usuarios
Invoke-RestMethod http://localhost:5000/usuarios/1
Invoke-RestMethod http://localhost:5000/usuarios -Method Post -ContentType 'application/json' -Body '{"nome":"Maria Silva","email":"maria@example.com","senha":"senha-de-teste"}'
Invoke-RestMethod http://localhost:5000/usuarios/1 -Method Patch -ContentType 'application/json' -Body '{"nome":"Maria Souza"}'
Invoke-WebRequest http://localhost:5000/usuarios/1 -Method Delete
```

IDs invalidos e dados obrigatorios ausentes retornam 400, registros inexistentes retornam 404, e e-mails duplicados retornam 409. As senhas sao armazenadas como hash bcrypt e nunca retornadas pela API.

## Verificacao

O servidor testa a conexao MySQL ao iniciar quando `DB_HOST`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` estao definidos. Sem configuracao completa, o servidor HTTP ainda pode iniciar, mas as operacoes que consultam o banco nao podem ser testadas.
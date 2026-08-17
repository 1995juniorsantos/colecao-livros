const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
  port: process.env.DB_PORT || 5432,
});

pool.query(`
  CREATE TABLE IF NOT EXISTS livros (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    autor VARCHAR(100) NOT NULL,
    ano INT NOT NULL
  );
`).then(() => console.log('Tabela "livros" pronta.'))
  .catch(err => console.error('Erro ao criar tabela:', err));

// Página Principal
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Coleção de Livros</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 30px; background: #f0f2f5; }
        .container { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        input, button { padding: 10px; margin: 5px 0; width: 100%; box-sizing: border-box; }
        button { background: #232f3e; color: white; border: none; cursor: pointer; font-weight: bold; }
        ul { list-style: none; padding: 0; }
        li { background: #f9f9f9; border: 1px solid #ddd; margin: 8px 0; padding: 10px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
        .actions button { width: auto; margin-left: 5px; padding: 5px 10px; font-size: 12px; }
        .btn-del { background: #d9534f; }
        .btn-edit { background: #f0ad4e; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>📚 Minha Coleção de Livros</h2>
        <input type="hidden" id="livro-id">
        <input type="text" id="titulo" placeholder="Título do Livro">
        <input type="text" id="autor" placeholder="Autor">
        <input type="number" id="ano" placeholder="Ano de Lançamento">
        <button id="btn-salvar" onclick="salvar()">Adicionar Livro</button>

        <h3>Livros Na Estante:</h3>
        <ul id="lista"></ul>
      </div>

      <script>
        async function carregar() {
          const res = await fetch('/api/livros');
          const livros = await res.json();
          const lista = document.getElementById('lista');
          lista.innerHTML = '';
          livros.forEach(l => {
            lista.innerHTML += \`
              <li>
                <div>
                  <strong>\${l.titulo}</strong> (\${l.ano})<br>
                  <small>Autor: \${l.autor}</small>
                </div>
                <div class="actions">
                  <button class="btn-edit" onclick="prepararEdicao(\${l.id}, '\${l.titulo}', '\${l.autor}', \${l.ano})">Editar</button>
                  <button class="btn-del" onclick="deletar(\${l.id})">X</button>
                </div>
              </li>
            \`;
          });
        }

        async function salvar() {
          const id = document.getElementById('livro-id').value;
          const titulo = document.getElementById('titulo').value;
          const autor = document.getElementById('autor').value;
          const ano = document.getElementById('ano').value;

          if (!titulo || !autor || !ano) return alert('Preencha todos os campos!');

          if (id) {
            await fetch(\`/api/livros/\${id}\`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ titulo, autor, ano })
            });
          } else {
            await fetch('/api/livros', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ titulo, autor, ano })
            });
          }

          limpar();
          carregar();
        }

        function prepararEdicao(id, titulo, autor, ano) {
          document.getElementById('livro-id').value = id;
          document.getElementById('titulo').value = titulo;
          document.getElementById('autor').value = autor;
          document.getElementById('ano').value = ano;
          document.getElementById('btn-salvar').innerText = 'Atualizar Livro';
        }

        function limpar() {
          document.getElementById('livro-id').value = '';
          document.getElementById('titulo').value = '';
          document.getElementById('autor').value = '';
          document.getElementById('ano').value = '';
          document.getElementById('btn-salvar').innerText = 'Adicionar Livro';
        }

        async function deletar(id) {
          await fetch(\`/api/livros/\${id}\`, { method: 'DELETE' });
          carregar();
        }

        carregar();
      </script>
    </body>
    </html>
  `);
});

// Rotas API CRUD
app.get('/api/livros', async (req, res) => {
  const result = await pool.query('SELECT * FROM livros ORDER BY id DESC');
  res.json(result.rows);
});

app.post('/api/livros', async (req, res) => {
  const { titulo, autor, ano } = req.body;
  const result = await pool.query('INSERT INTO livros (titulo, autor, ano) VALUES ($1, $2, $3) RETURNING *', [titulo, autor, ano]);
  res.status(201).json(result.rows[0]);
});

app.put('/api/livros/:id', async (req, res) => {
  const { id } = req.params;
  const { titulo, autor, ano } = req.body;
  await pool.query('UPDATE livros SET titulo=$1, autor=$2, ano=$3 WHERE id=$4', [titulo, autor, ano, id]);
  res.sendStatus(200);
});

app.delete('/api/livros/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM livros WHERE id = $1', [id]);
  res.sendStatus(204);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
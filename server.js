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
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Coleção de Livros na AWS</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        /* Fundo com Gradiente Azul e Lilás */
        body {
          min-height: 100vh;
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 80%, #581c87 100%);
          background-attachment: fixed;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px 20px;
          color: #ffffff;
        }

        .main-wrapper {
          width: 100%;
          max-width: 700px;
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        /* Estilo Glassmorphism (Container Transparente) */
        .glass-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        h2, h3 {
          font-size: 1.4rem;
          font-weight: 600;
          margin-bottom: 20px;
          color: #f3e8ff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-group label {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        input {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 12px;
          padding: 12px 16px;
          color: #ffffff;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.3s ease;
        }

        input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        input:focus {
          background: rgba(255, 255, 255, 0.22);
          border-color: #c084fc;
          box-shadow: 0 0 12px rgba(192, 132, 252, 0.4);
        }

        /* Botão Principal */
        .btn-primary {
          margin-top: 10px;
          background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 14px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(168, 85, 247, 0.6);
          filter: brightness(1.1);
        }

        .btn-primary:active {
          transform: translateY(0);
        }

        /* Lista de Livros */
        ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        li {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 16px;
          border-radius: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }

        li:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .book-info strong {
          font-size: 1.05rem;
          color: #ffffff;
        }

        .book-info small {
          display: block;
          margin-top: 4px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .actions button {
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-edit {
          background: rgba(251, 191, 36, 0.25);
          color: #fef08a;
          border: 1px solid rgba(251, 191, 36, 0.4);
        }

        .btn-edit:hover {
          background: rgba(251, 191, 36, 0.45);
        }

        .btn-del {
          background: rgba(239, 68, 68, 0.25);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .btn-del:hover {
          background: rgba(239, 68, 68, 0.45);
        }

        .empty-msg {
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          padding: 20px 0;
          font-style: italic;
        }
      </style>
    </head>
    <body>

      <div class="main-wrapper">
        
        <!-- PRIMEIRO CONTAINER: Formulário -->
        <div class="glass-card">
          <h2>📚 Gerenciador de Livros</h2>
          <div class="form-grid">
            <input type="hidden" id="livro-id">
            
            <div class="input-group">
              <label for="titulo">Título do Livro</label>
              <input type="text" id="titulo" placeholder="Ex: O Senhor dos Anéis">
            </div>

            <div class="input-group">
              <label for="autor">Autor</label>
              <input type="text" id="autor" placeholder="Ex: J.R.R. Tolkien">
            </div>

            <div class="input-group">
              <label for="ano">Ano de Lançamento</label>
              <input type="number" id="ano" placeholder="Ex: 1954">
            </div>

            <button id="btn-salvar" class="btn-primary" onclick="salvar()">Adicionar Livro</button>
          </div>
        </div>

        <!-- SEGUNDO CONTAINER: Estante de Livros -->
        <div class="glass-card">
          <h3>📖 Livros na Estante</h3>
          <ul id="lista"></ul>
        </div>

      </div>

      <script>
        async function carregar() {
          const res = await fetch('/api/livros');
          const livros = await res.json();
          const lista = document.getElementById('lista');
          lista.innerHTML = '';
          
          if (livros.length === 0) {
            lista.innerHTML = '<p class="empty-msg">Nenhum livro cadastrado na estante ainda.</p>';
            return;
          }

          livros.forEach(l => {
            lista.innerHTML += \`
              <li>
                <div class="book-info">
                  <strong>\${l.titulo}</strong> (\${l.ano})
                  <small>Autor: \${l.autor}</small>
                </div>
                <div class="actions">
                  <button class="btn-edit" onclick="prepararEdicao(\${l.id}, '\${l.titulo}', '\${l.autor}', \${l.ano})">Editar</button>
                  <button class="btn-del" onclick="deletar(\${l.id})">Excluir</button>
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
          if (confirm('Deseja realmente excluir este livro?')) {
            await fetch(\`/api/livros/\${id}\`, { method: 'DELETE' });
            carregar();
          }
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
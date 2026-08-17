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
      
      <!-- Bootstrap 5.3 CSS -->
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
      <!-- Bootstrap Icons -->
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">

      <style>
        body {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 35%, #312e81 70%, #4c1d95 100%);
          background-attachment: fixed;
          color: #ffffff;
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        }

        /* Glassmorphism customizado */
        .glass-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 1.25rem;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        /* Inputs estilizados para o modo transparente */
        .glass-input {
          background: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.25) !important;
          color: #ffffff !important;
          border-radius: 0.75rem !important;
        }

        .glass-input::placeholder {
          color: rgba(255, 255, 255, 0.5) !important;
        }

        .glass-input:focus {
          background: rgba(255, 255, 255, 0.2) !important;
          border-color: #c084fc !important;
          box-shadow: 0 0 12px rgba(192, 132, 252, 0.4) !important;
        }

        /* Botão Gradiente Principal */
        .btn-gradient {
          background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
          border: none;
          color: #ffffff;
          border-radius: 0.75rem;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
        }

        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(168, 85, 247, 0.6);
          color: #ffffff;
          filter: brightness(1.1);
        }

        /* Itens da lista */
        .glass-item {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 0.85rem;
          transition: all 0.25 ease;
        }

        .glass-item:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
        }
      </style>
    </head>
    <body class="py-4 py-md-5">

      <div class="container" style="max-width: 760px;">
        
        <!-- PRIMEIRO CONTAINER: Formulário -->
        <div class="glass-card p-4 p-md-5 mb-4">
          <h2 class="h4 fw-bold mb-4 text-light d-flex align-items-center gap-2">
            <i class="bi bi-journal-bookmark-fill text-warning"></i> Gerenciador de Livros
          </h2>

          <form onsubmit="event.preventDefault(); salvar();">
            <input type="hidden" id="livro-id">
            
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label for="titulo" class="form-label small text-light opacity-75 fw-medium">Título do Livro</label>
                <input type="text" class="form-control form-control-lg glass-input" id="titulo" placeholder="Ex: O Senhor dos Anéis" required>
              </div>

              <div class="col-12 col-md-6">
                <label for="autor" class="form-label small text-light opacity-75 fw-medium">Autor</label>
                <input type="text" class="form-control form-control-lg glass-input" id="autor" placeholder="Ex: J.R.R. Tolkien" required>
              </div>

              <div class="col-12">
                <label for="ano" class="form-label small text-light opacity-75 fw-medium">Ano de Lançamento</label>
                <input type="number" class="form-control form-control-lg glass-input" id="ano" placeholder="Ex: 1954" required>
              </div>

              <div class="col-12 mt-4">
                <button id="btn-salvar" type="submit" class="btn btn-gradient btn-lg w-100 py-3">
                  <i class="bi bi-plus-circle-fill me-1"></i> Adicionar Livro
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- SEGUNDO CONTAINER: Estante de Livros -->
        <div class="glass-card p-4 p-md-5">
          <h3 class="h5 fw-bold mb-4 text-light d-flex align-items-center gap-2">
            <i class="bi bi-bookshelf text-info"></i> Livros na Estante
          </h3>

          <div id="lista" class="d-flex flex-column gap-3"></div>
        </div>

      </div>

      <!-- Bootstrap JS -->
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

      <script>
        async function carregar() {
          const res = await fetch('/api/livros');
          const livros = await res.json();
          const lista = document.getElementById('lista');
          lista.innerHTML = '';
          
          if (livros.length === 0) {
            lista.innerHTML = \`
              <div class="text-center text-light opacity-50 py-4">
                <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                <p class="mb-0">Nenhum livro cadastrado na estante ainda.</p>
              </div>
            \`;
            return;
          }

          livros.forEach(l => {
            lista.innerHTML += \`
              <div class="glass-item p-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
                <div>
                  <div class="fw-semibold fs-5 text-white">\${l.titulo} <span class="badge bg-white bg-opacity-10 text-light fw-normal fs-6 ms-1">\${l.ano}</span></div>
                  <small class="text-light opacity-75"><i class="bi bi-person me-1"></i>\${l.autor}</small>
                </div>
                <div class="d-flex gap-2">
                  <button class="btn btn-outline-warning btn-sm px-3 rounded-3" onclick="prepararEdicao(\${l.id}, '\${l.titulo}', '\${l.autor}', \${l.ano})">
                    <i class="bi bi-pencil-square me-1"></i> Editar
                  </button>
                  <button class="btn btn-outline-danger btn-sm px-3 rounded-3" onclick="deletar(\${l.id})">
                    <i class="bi bi-trash me-1"></i> Excluir
                  </button>
                </div>
              </div>
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
          document.getElementById('btn-salvar').innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> Atualizar Livro';
        }

        function limpar() {
          document.getElementById('livro-id').value = '';
          document.getElementById('titulo').value = '';
          document.getElementById('autor').value = '';
          document.getElementById('ano').value = '';
          document.getElementById('btn-salvar').innerHTML = '<i class="bi bi-plus-circle-fill me-1"></i> Adicionar Livro';
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
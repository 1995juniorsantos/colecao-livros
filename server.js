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
      <title>Portal de Livros AWS</title>
      
      <!-- Bootstrap 5.3 CSS -->
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
      <!-- Bootstrap Icons -->
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">

      <style>
        :root {
          --sidebar-width: 260px;
        }

        body {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #4c1d95 100%);
          background-attachment: fixed;
          color: #ffffff;
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
          overflow-x: hidden;
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

        .glass-header {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }

        .glass-sidebar {
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(16px);
          border-right: 1px solid rgba(255, 255, 255, 0.12);
          width: var(--sidebar-width);
          min-height: calc(100vh - 70px);
        }

        /* Inputs estilizados */
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

        /* Menu de Navegação Lateral */
        .nav-link-custom {
          color: rgba(255, 255, 255, 0.7);
          padding: 12px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.25s ease;
        }

        .nav-link-custom:hover, .nav-link-custom.active {
          color: #ffffff;
          background: rgba(168, 85, 247, 0.25);
          border: 1px solid rgba(168, 85, 247, 0.4);
          transform: translateX(4px);
        }

        /* Botão Gradiente */
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

        /* Cards da Estante */
        .book-card {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 1rem;
          transition: all 0.25s ease;
        }

        .book-card:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .view-section {
          display: none;
        }

        .view-section.active {
          display: block;
        }
      </style>
    </head>
    <body>

      <!-- CABEÇALHO SUPERIOR -->
      <header class="glass-header sticky-top px-4 py-3 d-flex justify-content-between align-items-center" style="height: 70px;">
        <div class="d-flex align-items-center gap-3">
          <i class="bi bi-book-half text-warning fs-3"></i>
          <span class="fs-4 fw-bold text-white tracking-wide">Portal AWS Livros</span>
        </div>
        <div class="d-flex align-items-center gap-3">
          <span class="badge bg-success bg-opacity-20 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill">
            <i class="bi bi-cloud-check-fill me-1"></i> AWS RDS Conectado
          </span>
          <div class="rounded-circle bg-purple p-2 text-white d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; background: rgba(168, 85, 247, 0.3);">
            <i class="bi bi-person-fill fs-5"></i>
          </div>
        </div>
      </header>

      <div class="d-flex">
        
        <!-- BARRA DE MENU LATERAL (SIDEBAR) -->
        <aside class="glass-sidebar p-3 d-none d-md-block">
          <nav class="d-flex flex-column gap-2">
            <a href="#" class="nav-link-custom active" onclick="navegar('home', event)">
              <i class="bi bi-house-door-fill fs-5"></i> Home
            </a>
            <a href="#" class="nav-link-custom" onclick="navegar('cadastro', event)">
              <i class="bi bi-plus-square-fill fs-5"></i> Cadastrar Livro
            </a>
            <a href="#" class="nav-link-custom" onclick="navegar('estante', event)">
              <i class="bi bi-journals fs-5"></i> Estante
            </a>
          </nav>
        </aside>

        <!-- CONTEÚDO PRINCIPAL (DASHBOARD) -->
        <main class="flex-grow-1 p-4 p-md-5">

          <!-- 1. GUIA HOME -->
          <section id="view-home" class="view-section active">
            <div class="glass-card p-4 p-md-5">
              <h2 class="h3 fw-bold text-white mb-3"><i class="bi bi-speedometer2 text-info me-2"></i> Painel Geral</h2>
              <p class="text-light opacity-75 fs-5">Bem-vindo ao sistema de gerenciamento de acervo hospedado na nuvem AWS.</p>
              
              <div class="row g-4 mt-2">
                <div class="col-12 col-md-6">
                  <div class="p-4 rounded-4 bg-white bg-opacity-10 border border-white border-opacity-10">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <span class="text-light opacity-75 d-block mb-1">Total de Livros Cadastrados</span>
                        <h3 class="display-5 fw-bold text-white mb-0" id="dash-total-count">0</h3>
                      </div>
                      <i class="bi bi-collection-fill fs-1 text-warning"></i>
                    </div>
                  </div>
                </div>

                <div class="col-12 col-md-6">
                  <div class="p-4 rounded-4 bg-white bg-opacity-10 border border-white border-opacity-10">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <span class="text-light opacity-75 d-block mb-1">Status da Infraestrutura</span>
                        <h4 class="fw-bold text-white mb-0">EC2 + PostgreSQL</h4>
                      </div>
                      <i class="bi bi-hdd-network-fill fs-1 text-info"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-3 d-flex gap-3">
                <button class="btn btn-gradient py-2 px-4" onclick="navegar('cadastro', event)">
                  <i class="bi bi-plus-circle me-1"></i> Cadastrar Novo Livro
                </button>
                <button class="btn btn-outline-light py-2 px-4 rounded-3" onclick="navegar('estante', event)">
                  <i class="bi bi-journal-text me-1"></i> Ver Estante
                </button>
              </div>
            </div>
          </section>

          <!-- 2. GUIA CADASTRO DE LIVRO -->
          <section id="view-cadastro" class="view-section">
            <div class="glass-card p-4 p-md-5" style="max-width: 700px; margin: 0 auto;">
              <h2 id="form-title" class="h4 fw-bold mb-4 text-light d-flex align-items-center gap-2">
                <i class="bi bi-journal-plus text-warning"></i> Cadastrar Novo Livro
              </h2>

              <form onsubmit="event.preventDefault(); salvar();">
                <input type="hidden" id="livro-id">
                
                <div class="row g-3">
                  <div class="col-12">
                    <label for="titulo" class="form-label small text-light opacity-75 fw-medium">Título do Livro</label>
                    <input type="text" class="form-control form-control-lg glass-input" id="titulo" placeholder="Ex: O Senhor dos Anéis" required>
                  </div>

                  <div class="col-12 col-md-8">
                    <label for="autor" class="form-label small text-light opacity-75 fw-medium">Autor</label>
                    <input type="text" class="form-control form-control-lg glass-input" id="autor" placeholder="Ex: J.R.R. Tolkien" required>
                  </div>

                  <div class="col-12 col-md-4">
                    <label for="ano" class="form-label small text-light opacity-75 fw-medium">Ano de Lançamento</label>
                    <input type="number" class="form-control form-control-lg glass-input" id="ano" placeholder="Ex: 1954" required>
                  </div>

                  <div class="col-12 mt-4 d-flex gap-2">
                    <button id="btn-salvar" type="submit" class="btn btn-gradient btn-lg flex-grow-1 py-3">
                      <i class="bi bi-check-circle-fill me-1"></i> Salvar Livro
                    </button>
                    <button id="btn-cancelar" type="button" class="btn btn-outline-light btn-lg py-3 px-4 rounded-3 d-none" onclick="limpar()">
                      Cancelar
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </section>

          <!-- 3. GUIA ESTANTE DE LIVROS -->
          <section id="view-estante" class="view-section">
            <div class="glass-card p-4 p-md-5">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h3 class="h4 fw-bold text-light mb-0 d-flex align-items-center gap-2">
                  <i class="bi bi-bookshelf text-info"></i> Estante de Livros
                </h3>
                <button class="btn btn-gradient btn-sm px-3" onclick="navegar('cadastro', event)">
                  <i class="bi bi-plus-lg me-1"></i> Novo Livro
                </button>
              </div>

              <!-- Lista / Grid de Livros -->
              <div id="lista-estante" class="row g-3"></div>
            </div>
          </section>

        </main>
      </div>

      <!-- Bootstrap JS -->
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

      <script>
        // Navegação entre as abas do portal
        function navegar(aba, event) {
          if (event) event.preventDefault();

          document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
          document.querySelectorAll('.nav-link-custom').forEach(link => link.classList.remove('active'));

          document.getElementById('view-' + aba).classList.add('active');

          const activeLink = Array.from(document.querySelectorAll('.nav-link-custom'))
            .find(link => link.getAttribute('onclick').includes(aba));
          if (activeLink) activeLink.classList.add('active');

          if (aba === 'estante' || aba === 'home') carregar();
        }

        async function carregar() {
          const res = await fetch('/api/livros');
          const livros = await res.json();
          
          // Atualiza contador na Home
          document.getElementById('dash-total-count').innerText = livros.length;

          const containerEstante = document.getElementById('lista-estante');
          containerEstante.innerHTML = '';
          
          if (livros.length === 0) {
            containerEstante.innerHTML = \`
              <div class="col-12 text-center text-light opacity-50 py-5">
                <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                <p class="mb-0">Nenhum livro cadastrado na estante ainda.</p>
              </div>
            \`;
            return;
          }

          livros.forEach(l => {
            containerEstante.innerHTML += \`
              <div class="col-12 col-md-6 col-lg-4">
                <div class="book-card p-4 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <h5 class="fw-bold text-white mb-0">\${l.titulo}</h5>
                      
                      <!-- Menu do Botão Editar (Ações ao lado) -->
                      <div class="dropdown">
                        <button class="btn btn-link text-light p-0 opacity-75" type="button" data-bs-toggle="dropdown">
                          <i class="bi bi-three-dots-vertical fs-5"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow">
                          <li>
                            <a class="dropdown-item text-warning d-flex align-items-center gap-2" href="#" onclick="prepararEdicao(\${l.id}, '\${l.titulo}', '\${l.autor}', \${l.ano})">
                              <i class="bi bi-pencil-square"></i> Editar Livro
                            </a>
                          </li>
                          <li><hr class="dropdown-divider"></li>
                          <li>
                            <a class="dropdown-item text-danger d-flex align-items-center gap-2" href="#" onclick="deletar(\${l.id})">
                              <i class="bi bi-trash"></i> Excluir
                            </a>
                          </li>
                        </ul>
                      </div>

                    </div>
                    <p class="text-light opacity-75 mb-3"><i class="bi bi-person me-1"></i>\${l.autor}</p>
                  </div>

                  <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-white border-opacity-10">
                    <span class="badge bg-white bg-opacity-10 text-light fw-normal fs-6">\${l.ano}</span>
                    <button class="btn btn-outline-warning btn-sm px-3 rounded-3" onclick="prepararEdicao(\${l.id}, '\${l.titulo}', '\${l.autor}', \${l.ano})">
                      <i class="bi bi-pencil me-1"></i> Editar
                    </button>
                  </div>
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
          navegar('estante');
        }

        function prepararEdicao(id, titulo, autor, ano) {
          document.getElementById('livro-id').value = id;
          document.getElementById('titulo').value = titulo;
          document.getElementById('autor').value = autor;
          document.getElementById('ano').value = ano;
          
          document.getElementById('form-title').innerHTML = '<i class="bi bi-pencil-square text-warning"></i> Editar Livro';
          document.getElementById('btn-salvar').innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> Atualizar Livro';
          document.getElementById('btn-cancelar').classList.remove('d-none');

          navegar('cadastro');
        }

        function limpar() {
          document.getElementById('livro-id').value = '';
          document.getElementById('titulo').value = '';
          document.getElementById('autor').value = '';
          document.getElementById('ano').value = '';
          
          document.getElementById('form-title').innerHTML = '<i class="bi bi-journal-plus text-warning"></i> Cadastrar Novo Livro';
          document.getElementById('btn-salvar').innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> Salvar Livro';
          document.getElementById('btn-cancelar').classList.add('d-none');
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
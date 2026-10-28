require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

//1. Dependências e Middlewares
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const routerUser = require('./routes/routerUser');
//2. Controle de CORS (Headers & OPTIONS)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//3. Definição de Rotas 
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

app.use('/usuarios', routerUser);
app.use('/usuario', routerUser);

//4. Tratamento de Erros (Fallback & Handler)

app.use((req, res, next) => {
  const error = new Error('Não encontrado!');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  const status = error.code === 'ER_DUP_ENTRY'
    ? 409
    : Number.isInteger(error.status) ? error.status : 500;

  if (status >= 500) console.error(error);
  return res.status(status).json({
    erro: {
      mensagem: error.code === 'ER_DUP_ENTRY'
        ? 'Este e-mail já está cadastrado.'
        : status === 500 ? 'Erro interno do servidor' : error.message
    }
  });
});

module.exports = app
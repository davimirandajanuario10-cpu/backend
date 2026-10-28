const express = require('express');
const bcrypt = require('bcryptjs');
const mysqlPool = require('../mysql').pool;

const router = express.Router();
const publicUserColumns = 'id_usu, nome, email, contato, genero, ativo, criado_em, atualizado_em';

function createHttpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function query(sql, parameters = []) {
    return new Promise((resolve, reject) => {
        mysqlPool.getConnection((connectionError, connection) => {
            if (connectionError) return reject(connectionError);

            try {
                connection.query(sql, parameters, (queryError, result) => {
                    connection.release();
                    if (queryError) return reject(queryError);
                    resolve(result);
                });
            } catch (error) {
                connection.release();
                reject(error);
            }
        });
    });
}

function parseId(value) {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id < 1) throw createHttpError(400, 'ID inválido.');
    return id;
}

function normalizeActive(value) {
    if (value === true || value === 1 || value === '1') return 1;
    if (value === false || value === 0 || value === '0') return 0;
    throw createHttpError(400, 'O campo ativo deve ser booleano ou 0/1.');
}

async function findUser(id) {
    const users = await query(
        `SELECT ${publicUserColumns} FROM usuarios WHERE id_usu = ? LIMIT 1`,
        [id]
    );
    return users[0];
}

router.get('/', async (req, res, next) => {
    try {
        const users = await query(`SELECT ${publicUserColumns} FROM usuarios`);
        res.status(200).json({ usuario: users });
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, senha } = req.body || {};
        if (typeof email !== 'string' || typeof senha !== 'string' || !email.trim() || !senha) {
            return res.status(400).json({ erro: { mensagem: 'Informe e-mail e senha.' } });
        }

        const users = await query(
            `SELECT id_usu, nome, email, senha, contato, genero, ativo, criado_em, atualizado_em
             FROM usuarios WHERE email = ? LIMIT 1`,
            [email.trim()]
        );
        const user = users[0];
        const validPassword = user ? await bcrypt.compare(senha, user.senha) : false;

        if (!validPassword) {
            return res.status(401).json({ erro: { mensagem: 'E-mail ou senha inválidos.' } });
        }

        delete user.senha;
        return res.status(200).json({ mensagem: 'Login realizado com sucesso.', usuario: user });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const user = await findUser(parseId(req.params.id));
        if (!user) return res.status(404).json({ erro: { mensagem: 'Usuário não encontrado.' } });
        return res.status(200).json({ usuario: user });
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const body = req.body || {};
        const { nome, email, senha, contato = null, genero = null } = body;
        if (typeof nome !== 'string' || !nome.trim()
            || typeof email !== 'string' || !email.trim()
            || typeof senha !== 'string' || !senha) {
            return res.status(400).json({ erro: { mensagem: 'Informe nome, e-mail e senha válidos.' } });
        }
        if ((contato !== null && typeof contato !== 'string')
            || (genero !== null && typeof genero !== 'string')) {
            return res.status(400).json({ erro: { mensagem: 'Contato e gênero devem ser texto ou nulos.' } });
        }

        const ativo = body.ativo === undefined ? 1 : normalizeActive(body.ativo);
        const passwordHash = await bcrypt.hash(senha, 10);
        const result = await query(
            'INSERT INTO usuarios (nome, email, senha, contato, genero, ativo) VALUES (?, ?, ?, ?, ?, ?)',
            [nome.trim(), email.trim(), passwordHash, contato, genero, ativo]
        );
        const user = await findUser(result.insertId);
        return res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso.', usuario: user });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id', async (req, res, next) => {
    try {
        const id = parseId(req.params.id);
        const body = req.body;
        const allowedFields = {
            nome: 'nome', email: 'email', senha: 'senha',
            contato: 'contato', genero: 'genero', ativo: 'ativo'
        };

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return res.status(400).json({ erro: { mensagem: 'Envie um objeto JSON com os campos a atualizar.' } });
        }

        const fields = Object.keys(body);
        if (fields.length === 0 || fields.some((field) => !allowedFields[field])) {
            return res.status(400).json({ erro: { mensagem: 'Envie campos válidos para atualizar.' } });
        }

        const assignments = [];
        const parameters = [];
        for (const field of fields) {
            let value = body[field];
            if (field === 'nome' || field === 'email') {
                if (typeof value !== 'string' || !value.trim()) {
                    return res.status(400).json({ erro: { mensagem: `O campo ${field} não pode ficar vazio.` } });
                }
                value = value.trim();
            } else if (field === 'senha') {
                if (typeof value !== 'string' || !value) {
                    return res.status(400).json({ erro: { mensagem: 'A senha não pode ficar vazia.' } });
                }
                value = await bcrypt.hash(value, 10);
            } else if (field === 'ativo') {
                value = normalizeActive(value);
            } else if (value !== null && typeof value !== 'string') {
                return res.status(400).json({ erro: { mensagem: `O campo ${field} deve ser texto ou nulo.` } });
            }

            assignments.push(`${allowedFields[field]} = ?`);
            parameters.push(value);
        }

        parameters.push(id);
        await query(`UPDATE usuarios SET ${assignments.join(', ')} WHERE id_usu = ?`, parameters);
        const user = await findUser(id);
        if (!user) return res.status(404).json({ erro: { mensagem: 'Usuário não encontrado.' } });
        return res.status(200).json({ mensagem: 'Usuário atualizado com sucesso.', usuario: user });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const result = await query('DELETE FROM usuarios WHERE id_usu = ?', [parseId(req.params.id)]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: { mensagem: 'Usuário não encontrado.' } });
        }
        return res.status(204).end();
    } catch (error) {
        next(error);
    }
});

module.exports = router;
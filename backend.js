const http = require('http')
const sqlite3 = require('sqlite3').verbose();

let vendas = []

function getVendas(req, res) {
    db.all(`SELECT * FROM vendas;`, [], (err, rows) =>{
    if(err){
        throw err;
    }
    console.log(rows)
    vendas = rows
    res.statusCode = 200
    res.end(JSON.stringify(vendas))
    })
}

function createVenda(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const venda = JSON.parse(body);
        db.run(
            'INSERT INTO vendas (codVendedor, nome, cargo, codVenda, valorVenda) VALUES (?, ?, ?, ?, ?)',
            [venda.codVendedor, venda.nome, venda.cargo, venda.codVenda, venda.valorVenda],
            function (err) {
                if (err) {
                    console.error(err.message);
                    res.statusCode = 500;
                    res.end(JSON.stringify({ mensagem: 'Erro ao criar a venda.' }));
                } else {
                    venda.id = this.lastID;
                    vendas.push(venda);
                    res.statusCode = 200;
                    res.end(JSON.stringify(venda));
                }
            }
        );
    });
}

function updateVenda(req, res) {
    const vendaSearch = req.url.split('/')[2];
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const novaVenda = JSON.parse(body);

        db.run(
            'UPDATE vendas SET codVendedor=?, nome=?, cargo=?, codVenda=?, valorVenda=? WHERE codVenda=?',
            [novaVenda.codVendedor, novaVenda.nome, novaVenda.cargo, novaVenda.codVenda, novaVenda.valorVenda, vendaSearch],
            function (err) {
                if (err) {
                    console.error(err.message);
                    res.statusCode = 500;
                    res.end(JSON.stringify({ mensagem: 'Erro ao atualizar a venda.' }));
                } else {
                    const index = vendas.findIndex(venda => venda.codVenda == vendaSearch);
                    vendas[index] = novaVenda;
                    res.statusCode = 200;
                    res.end(JSON.stringify(novaVenda));
                }
            }
        );
    });
}

function eraseVenda(req, res) {
    const vendaSearch = req.url.split('/')[2];

    db.run('DELETE FROM vendas WHERE codVenda=?', [vendaSearch], function (err) {
        if (err) {
            console.error(err.message);
            res.statusCode = 500;
            res.end(JSON.stringify({ mensagem: 'Erro ao apagar a venda.' }));
        } else {
            const index = vendas.findIndex(venda => venda.codVenda == vendaSearch);
            vendas.splice(index, 1);
            res.statusCode = 200;
            res.end(JSON.stringify({ mensagem: 'Venda apagada.' }));
        }
    });
}

const servidorWEB = http.createServer(function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.statusCode = 204; // No Content
        res.end();
        return;
    }
    res.setHeader('Content-Type', 'application/json')
    if (req.url === '/api') {
        getVendas(req, res)
    } else if (req.url === '/create' && req.method === 'POST') {
        createVenda(req, res)
    } else if (req.url.startsWith('/update/') && req.method === 'PUT') {
        updateVenda(req, res)
    } else if (req.url.startsWith('/delete/') && req.method === 'DELETE') {
        eraseVenda(req, res)
    } else {
        res.statusCode = 404
        res.end(JSON.stringify({ mensagem: "Rota não encontrada." }))
    }
})

servidorWEB.listen(5000, function(){
    console.log("Abriu")
    db = new sqlite3.Database('./consorcios.sqlite3', (err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('Connected to the in-memory SQlite database.');
    });
})

process.on('SIGINT', () => {
    db.close(() => {
        console.log('db closed')
        process.exit(0)
    })
    console.log('server stop')
})
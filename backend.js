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
    let body = ''
    req.on('data', chunk => {
        body += chunk.toString()
    })
    req.on('end', () => {
        let venda = JSON.parse(body)
        vendas.push(venda)
        res.statusCode = 200
        res.end(JSON.stringify(venda))
    })
}

function updateVenda(req, res) {
    const vendaSearch = req.url.split('/')[2]
    let body = ''
    req.on('data', chunk => {
        body += chunk.toString()
    })
    req.on('end', () => {
        const index = vendas.findIndex(venda => venda.codVenda == vendaSearch)
        if (index >= 0) {
            vendas[index] = JSON.parse(body)
            res.statusCode = 200
            res.end(JSON.stringify(vendas[index]))
        } else {
            res.statusCode = 404
            res.end(JSON.stringify({ mensagem: 'Rota não encontrada.' }))
        }
    })
}

function eraseVenda(req, res) {
    const vendaSearch = req.url.split('/')[2]
    const index = vendas.findIndex(venda => venda.codVenda == vendaSearch)
    if (index >= 0) {
        vendas.splice(index, 1);
        res.statusCode = 200
        res.end(JSON.stringify({ mensagem: "Venda apagada." }))
    } else {
        res.statusCode = 404
        res.end(JSON.stringify({ mensagem: 'Rota não encontrada.' }))
    }
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
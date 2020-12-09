const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const handlebars = require('express-handlebars')

const app = express()

const urlencodeParser = bodyParser.urlencoded({extended: false});

const sql = mysql.createConnection({host: 'localhost',
                                    user: 'root',
                                    password: '',
                                    port: 3308})
sql.query('use morangando')

app.use('/css', express.static('css'))
app.use('/img', express.static('img'))

//Template engine
app.engine('handlebars', handlebars({defaultLayout: 'main'}))
app.set('view engine', 'handlebars')

//Loading index
app.get('/', function(req, res){
    res.render('index')
})

//--------------------------------------- Routes Employee ----------------------------------------

app.get('/addEmployee', function(req, res){
    res.render('addEmployee')
})
app.post('/controllerEmp', urlencodeParser, function(req, res){
    sql.query('INSERT INTO funcionarios (username, senha, status) VALUES (?, ?, ?)', [req.body.username, req.body.passw, req.body.employeeType])
    res.render('controllerEmp', {username: req.body.username})
})

//---------------------------------------- Routes Provider ----------------------------------------
var colabIdForProvider;
var cpfProvider;
app.get('/addProvider', function(req, res){
    res.render('addProvider')
})
app.post('/controllerAdd', urlencodeParser, function(req, res){
    sql.query('INSERT INTO colabs (nome, cidade, bairro, email, telefone) VALUES (?, ?, ?, ?, ?)', [req.body.name, req.body.city, req.body.neighborhood, req.body.email, req.body.phone])
    sql.query('SELECT idColab FROM colabs WHERE nome=? AND email=? ORDER BY idColab ASC', [req.body.name, req.body.email], function(err, results, fields){
        colabIdForProvider = results[0].idColab;
        sql.query('INSERT INTO fornecedor VALUES (?, ?)', [colabIdForProvider, req.body.cpf])
    })
    res.render('controllerAdd', {name: req.body.name})
})
app.get('/listProviders/:id?', function(req, res){
    if(!req.params.id){
        sql.query('SELECT DISTINCT idColab, nome, cidade, bairro, email, telefone, cpf FROM colabs INNER JOIN fornecedor WHERE idColab = colabFornecedorId ORDER BY idColab ASC', function(err, results, fields){
            res.render('listProviders', {data: results})
        })
    }
    else{
        sql.query('SELECT DISTINCT idColab, nome, cidade, bairro, email, telefone, cpf FROM colabs INNER JOIN fornecedor WHERE idColab = colabFornecedorId AND idColab = ? ORDER BY idColab ASC', [req.params.id], function(err, results, fields){
            res.render('listProviders', {data: results})
        })
    }
})
// app.get('/listProviders/:id?', function(req, res){
//     if(!req.params.id){
//         sql.query('SELECT * FROM colabs WHERE tipo like "fornecedor" ORDER BY idColab ASC', function(err, results, fields){
//             res.render('listProviders', {data: results})
//         })
//     }
//     else{
//         sql.query('SELECT * FROM colabs WHERE idColab=? ORDER BY idColab ASC', [req.params.id], function(err, results, fields){
//             res.render('listProviders', {data: results})
//         })
//     }
// })
app.get('/listClients/:id?', function(req, res){
    if(!req.params.id){
        sql.query('SELECT * FROM colabs WHERE tipo like "cliente" ORDER BY idColab ASC', function(err, results, fields){
            res.render('listClients', {data: results})
        })
    }
    else{
        sql.query('SELECT * FROM colabs WHERE idColab=? AND tipo like "cliente" ORDER BY idColab ASC', [req.params.id], function(err, results, fields){
            res.render('listClients', {data: results})
        })
    }
})
app.get('/deleteColab/:id', function(req, res){
    sql.query('DELETE FROM colabs WHERE idColab = ?', [req.params.id])
    res.render('controllerDeleteColabs')
})

//----------------------------------------- Routes Product -----------------------------------------
app.get('/addProduct', function(req, res){
    res.render('addProduct')
})

app.post('/controllerAddProduct', urlencodeParser, function(req, res){
    sql.query('INSERT INTO produto (nome) VALUES (?)', [req.body.nameProduto])
    res.render('controllerAddProduct')
})

app.get('/listProducts/:id?', function(req, res){
    if(!req.params.id){
        sql.query('SELECT * FROM produto', function(err, results, fields){
            res.render('listProducts', {data: results})
        })
    }
    else{
        sql.query('SELECT * FROM produto WHERE idProduto = ?', [req.params.id], function(err, results, fields){
            res.render('listProducts', {data: results})
        })
    }
})

//---------------------------------- Routes Colab-Product Relation ----------------------------------
var providerId;
var nomeProvider;
app.get('/addProductToProvider/:id', function(req, res){
    sql.query('SELECT nome FROM colabs WHERE idColab = ?', [req.params.id], function(err, results, fields){
        nomeProvider = results;
    })
    sql.query('SELECT * FROM produto', function(err, results, fields){
        res.render('addProductToProvider', {data: results, idProvider: req.params.id, nomeP: nomeProvider})
        providerId = req.params.id;
    })
})
app.get('/confirmAssociation/:id', function(req, res){
    // res.send("idProvider: " + providerId + "\nidProduto: " + req.params.id)
    sql.query('SELECT * FROM colaborador_tem_produto', function(err, results, fields){
        if(results.colabId==providerId && results.produtoId==req.params.id){
            
        }
    })
    sql.query('INSERT INTO colaborador_tem_produto VALUES (?,?)', [providerId, req.params.id])

})

//Start Server
app.listen(3001, function(req, res){
    console.log('O pai tá on')
})
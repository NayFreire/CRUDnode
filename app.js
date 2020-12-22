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
app.use('/js', express.static('js'))

//Template engine
app.engine('handlebars', handlebars({defaultLayout: 'main'}))
app.set('view engine', 'handlebars')

//Loading index
var username, passw;
app.get('/', function(req, res){
    res.render('index')
})
app.post('/menu', urlencodeParser, function(req, res){ 
    sql.query('SELECT username, senha FROM funcionarios WHERE username = ? AND senha = ?', [req.body.nomeFunc, req.body.senhaFunc], function(err, results, fields){
        if(results.length>0){
            res.render('menu')
        }
        else{
            res.send('O nome de usuário e/ou a senha estão incorretos')
        }
    })
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
var provId;
var provNome;

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
app.get('/addProductToProvider/:id', function(req, res){
    provId = req.params.id;
    sql.query('SELECT * FROM produto', function(err, result, fields){
        sql.query('SELECT idColab, nome FROM colabs WHERE idColab = ?', [req.params.id], function(err, results, fiels){
            provNome = results[0].nome;
            res.render('addProductToProvider', {data: result, idP: results[0].idColab, nome: results[0].nome})
        })
    })
    console.log(provId)
})
app.get('/updateProvider/:id', urlencodeParser, function(req, res){
    sql.query('SELECT idColab, nome, cidade, bairro, email, cpf, telefone FROM colabs JOIN fornecedor WHERE idColab = ? AND colabFornecedorId = idColab', [req.params.id], function(err, results, fields){
        res.render('updateProvider', {data: results})    
        console.log(results)
    })
})


app.post('/controllerUpdateProvider/:id', urlencodeParser, function(req, res){
    sql.query('UPDATE colabs SET nome = ?, cidade = ?, email = ?, telefone = ?, bairro = ? WHERE idColab = ?', [req.body.name, req.body.city, req.body.email, req.body.phone, req.body.neighborhood, req.params.id], function(err, results, fields){
        console.log('id: ', req.params.id)
        sql.query('UPDATE fornecedor SET cpf = ? WHERE colabFornecedorId = ?', [req.body.cpf, req.params.id], function(err, results, fields){
            res.render('controllerUpdateProvider') 
        })
    })
})

app.get('/deleteProvider/:id', function(req, res){
    sql.query('DELETE FROM colabs WHERE idColab = ?', [req.params.id])
    sql.query('DELETE FROM fornecedor WHERE colabFornecedorId = ?', [req.params.id])
    res.render('deleteProvider')
})

//---------------------------------------- Routes Client ----------------------------------------
var colabIdForClient;

app.get('/addClient', function(req, res){
    res.render('addClient')
})
app.post('/controllerAddCliente', urlencodeParser, function(req, res){
    sql.query('INSERT INTO colabs (nome, cidade, bairro, email, telefone) VALUES (?, ?, ?, ?, ?)', [req.body.name, req.body.city, req.body.neighborhood, req.body.email, req.body.phone])
    sql.query('SELECT idColab FROM colabs WHERE nome=? AND email=? ORDER BY idColab ASC', [req.body.name, req.body.email], function(err, results, fields){
        console.log(results)
        colabIdForClient = results[0].idColab;
        sql.query('INSERT INTO cliente VALUES (?, ?)', [colabIdForClient, req.body.cnpj])
    })
    res.render('controllerAddClient', {name: req.body.name})
})
app.get('/listClients/:id?', function(req, res){
    if(!req.params.id){
        sql.query('SELECT DISTINCT idColab, nome, cidade, bairro, email, telefone, cnpj FROM colabs JOIN cliente WHERE idColab = colabClienteId ORDER BY idColab ASC', function(err, results, fields){
            res.render('listClients', {data: results})
        })
    }
    else{
        sql.query('SELECT DISTINCT idColab, nome, cidade, bairro, email, telefone, cnpj FROM colabs JOIN cliente WHERE idColab = colabClienteId AND idColab = ? ORDER BY idColab ASC', [req.params.id], function(err, results, fields){
            res.render('listClients', {data: results})
        })
    }
})
app.get('/updateClient/:id', function(req, res){
    sql.query('SELECT idColab, nome, cidade, bairro, email, telefone, cnpj FROM colabs JOIN cliente WHERE idColab = ? AND colabClienteId = idColab', [req.params.id], function(err, results, fields){
        res.render('updateClient', {data: results})
    })
})
app.post('/controllerUpdateClient/:id', urlencodeParser, function(req, res){
    sql.query('UPDATE colabs SET nome = ?, cidade = ?, email = ?, telefone = ?, bairro = ? WHERE idColab = ?', [req.body.name, req.body.city, req.body.email, req.body.phone, req.body.neighborhood, req.params.id])
    sql.query('UPDATE cliente SET cnpj = ? WHERE colabClienteId = ?', [req.body.cnpj, req.params.id])
    res.render('controllerUpdateClient')
    console.log('name: ', req.body.name)
})

app.get('/controllerDeleteColabs/:id', function(req, res){
    sql.query('DELETE FROM colabs WHERE idColab = ?', [req.params.id])
    sql.query('DELETE FROM cliente WHERE colabClienteId = ?', [req.params.id])
    res.render('controllerDeleteColabs')   
})

//--------------------------------------- Routes Product ---------------------------------------
app.get('/addProduct', function(req, res){
    res.render('addProduct')
})

app.post('/controllerAddProduct', urlencodeParser, function(req, res){
    sql.query('SELECT * FROM produto WHERE nome = ? AND tipo = ?', [req.body.nameProduto, req.body.typeProduto], function(err, results, fields){
        console.log(results)
        if(results.length>0){
            res.send('Este produto já foi cadastrado')
        }
        else{
            if(req.body.option == 'sim'){
                if(req.body.qtdProduto == 0){
                    res.send('Você não indicou uma quantidade do produtos válida')
                }
                else{
                    sql.query('INSERT INTO produto (nome, tipo, qtdEstoque) VALUES (?,?,?)', [req.body.nameProduto, req.body.typeProduto, req.body.qtdProduto])
                    res.render('controllerAddProduct')            
                }
            }
            else if(req.body.option == 'nao'){
                var none = 0;
                sql.query('INSERT INTO produto (nome, tipo, qtdEstoque) VALUES (?,?,?)', [req.body.nameProduto, req.body.typeProduto, none])
                res.render('controllerAddProduct')
            }
        }
    })    
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

app.get('/updateProduct/:id', function(req, res){
    sql.query('SELECT * FROM produto WHERE idProduto = ?', [req.params.id], function(err, results, fields){
        res.render('updateProduct', {data: results})
    })
})

app.post('/controllerUpdateProduct/:id', urlencodeParser, function(req, res){
    sql.query('UPDATE produto SET nome = ?, tipo = ?, qtdEstoque = ? WHERE idProduto = ?', [req.body.nameProduto, req.body.typeProduto, req.body.qtdProduto, req.params.id])
    res.render('controllerUpdateProduct')
})

//-------------------------------- Routes Provider-Product Relation --------------------------------
var providerId = provId;
var nomeProvider;
app.get('/confirmAssociation/:id', urlencodeParser, function(req, res){

    sql.query('INSERT INTO fornecedor_tem_produto VALUES (?,?)', [provId, req.params.id], function(err, results, fields){
        if(err.errno==1062){ //Se o erro que retornar tem número 1062, então esses items já foram cadastrados juntos
            res.send('Esse produto já foi associado à esse fornecedor')
        }
        else{            
            res.render('confirmAssociation')
        }        
    })
})

//Start Server
app.listen(3001, function(req, res){
    console.log('O pai tá on')
})
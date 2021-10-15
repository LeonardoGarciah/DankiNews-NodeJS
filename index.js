const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const fs = require('fs');

const app = express();

const Posts = require('./Posts.js');

mongoose.connect('mongodb+srv://root:senhadobanco@cluster0.gfhnd.mongodb.net/dankicode?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log("Conectado com sucesso")
}).catch((err) => {
    console.log(err.message);
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

app.use(session({
    secret: 'SHAUH67ST673HG7SA577#',
    cookie: { maxAge: 60000 }
}));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/views'));

app.get('/', function(req, res) {
    if (req.query.busca == null) {
        Posts.find({}).sort({ '_id': -1 }).exec(function(err, posts) {
            posts = posts.map((val) => {
                return {
                    titulo: val.titulo,
                    img: val.img,
                    categoria: val.categoria,
                    descricaoCurta: val.conteudo.substr(0, 100),
                    conteudo: val.conteudo,
                    slug: val.slug,
                    autor: val.autor,
                    views: val.views
                }
            })
            Posts.find({}).sort({ 'views': -1 }).limit(3).exec(function(err, postsTop) {
                // console.log(posts[0]);
                postsTop = postsTop.map(function(val) {
                    return {
                        titulo: val.titulo,
                        conteudo: val.conteudo,
                        descricaoCurta: val.conteudo.substr(0, 100),
                        img: val.img,
                        slug: val.slug,
                        categoria: val.categoria,
                        views: val.views
                    }
                })
                res.render('home', { posts: posts, postsTop: postsTop });
            })
        })

    } else {
        Posts.find({ titulo: { $regex: req.query.busca, $options: "i" } }).sort({ '_id': -1 }).exec(function(err, posts) {
            posts = posts.map((val) => {
                return {
                    titulo: val.titulo,
                    img: val.img,
                    categoria: val.categoria,
                    descricaoCurta: val.conteudo.substr(0, 100),
                    conteudo: val.conteudo,
                    slug: val.slug,
                    autor: val.autor,
                    views: val.views
                }
            })

            console.log(posts[0]);
            res.render("busca", { posts: posts, contagem: posts.length });
        })
    }
})

app.get('/:slug', function(req, res) {
    Posts.findOneAndUpdate({ slug: req.params.slug }, { $inc: { views: 1 } }, { new: true }, (err, resposta) => {
        if (resposta != null) {
            Posts.find({}).sort({ 'views': -1 }).limit(3).exec(function(err, postsTop) {
                // console.log(posts[0]);
                postsTop = postsTop.map(function(val) {
                    return {
                        titulo: val.titulo,
                        conteudo: val.conteudo,
                        descricaoCurta: val.conteudo.substr(0, 100),
                        img: val.imagem,
                        slug: val.slug,
                        categoria: val.categoria,
                        views: val.views
                    }
                })
                res.render('single', { noticia: resposta, postsTop: postsTop });
            })
        } else {
            res.redirect("/");
        }
    })
})

var usuarios = [{
    login: 'Leonardo',
    senha: '123456'
}];

app.post('/admin/login', (req, res) => {
    usuarios.map((val) => {
        if (val.login == req.body.login && val.senha == req.body.senha) {
            req.session.login = val.login;
        }
        res.redirect('/admin/login');
    })

});

app.post('/admin/cadastro', (req, res) => {

    let formato = req.files.arquivo.name.split('.');
    var imagem = +new Date().getTime() + ".jpg";
    if (formato[formato.length - 1] == "jpg" || formato[formato.length - 1] == "png") {
        req.files.arquivo.mv(__dirname + "/public/img/" + imagem);
    } else {
        fs.unlinkSync('req.files.arquivo.tempFilePath');
    }
    Posts.create({
        titulo: req.body.titulo_noticia,
        img: 'http://localhost:5000/public/img/' + imagem,
        categoria: "",
        conteudo: req.body.noticia,
        slug: req.body.slug,
        autor: "admin",
        views: 0
    });
    res.redirect('/admin/login');
})
app.get('/admin/deletar/:id', (req, res) => {
    Posts.deleteOne({ _id: req.params.id }).then(() => {
        res.redirect('/admin/login');
    })
})

app.get('/admin/login', (req, res) => {
    if (req.session.login == null) {
        res.render('admin-login');
    } else {
        Posts.find({}).sort({ '_id': -1 }).exec(function(err, posts) {
            posts = posts.map((val) => {
                return {
                    id: val._id,
                    titulo: val.titulo,
                    img: val.img,
                    categoria: val.categoria,
                    descricaoCurta: val.conteudo.substr(0, 100),
                    conteudo: val.conteudo,
                    slug: val.slug,
                    autor: val.autor,
                    views: val.views
                }
            })
            res.render('admin-painel', { posts: posts });
        })
    }
})


app.listen(5000, () => {
    console.log("Server rodando");
})
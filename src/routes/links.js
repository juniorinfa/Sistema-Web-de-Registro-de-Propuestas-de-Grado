const express = require('express');
const router = express.Router();
// Importacion de handlebars para realizar helpers
const Handlebars = require('handlebars');
// Impotacion de Multer (Libreria para subir archivos al servidor)
const multer = require('multer');
// Funcion interna de Nodejs
const fs = require('node:fs');
const path = require('path');

const { isLoggedIn, isNotAnStudentApproved } = require('../lib/auth');


const pool = require('../database');


// Helper que agrega la funcion 'add' que muestra el numero de titulos que hay
Handlebars.registerHelper('add', function (a, b) {
    return a + b;
});


// Numero para los nombres de los archivos
function generarNumero20Cifras() {
    let numero = '';

    // Primer dígito: 1-9 (evita ceros al inicio)
    numero += Math.floor(Math.random() * 9) + 1;

    // Resto: 19 dígitos entre 0-9
    for (let i = 0; i < 19; i++) {
        numero += Math.floor(Math.random() * 10);
    }

    return numero;
}


// Configuracion de Multer
const storage = multer.diskStorage({
    destination: path.join(__dirname, '../public/uploads'),
    filename: (req, file, cb) => {
        const filename = generarNumero20Cifras() + '.' + file.originalname.split('.')[1];
        cb(null, filename);
    }
})

const upload = multer({
    storage,
    dest: path.join(__dirname, 'public/uploads'),
    fileFilter: (req, file, cb) => {
        const filetypes = /pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLocaleLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }

        cb(null, false);
        req.fileRejected = true;
    }
}).single('archivo')


// Get y Post de la vista titulos (Vista para agregar titulos).
router.get('/titulos', isLoggedIn, isNotAnStudentApproved, async (req, res) => {
    const titulos = await pool.query('SELECT * FROM titulos WHERE usuario_id = ?', [req.user.id]);
    res.render('links/titulos', { titulos, userType: req.user ? req.user.userType : null});
});

router.post('/titulos', async (req, res) => {
    const { id } = req.user;
    const titulos = await pool.query('SELECT * FROM titulos WHERE usuario_id = ?', [id]);
    const { titulo } = req.body;
    const titulo_num = titulos.length + 1;

    console.log(titulo);
    if (titulo_num <= 3) {
        const newTitulo = {
            titulo,
            seccion: req.user.seccion,
            usuario_id: req.user.id
        };
        await pool.query('INSERT INTO titulos set ?', [newTitulo]);
        req.flash('success', 'Titulo Añadido Correctamente');
    } else {
        req.flash('danger', 'Limite de Titulos Alcanzado');
    }

    res.redirect(req.get('referer'));
});



router.get('/titulosProfesor/:id', isLoggedIn, async (req, res) => {
    const titulos = await pool.query('SELECT * FROM titulos WHERE usuario_id = ?', [req.params.id]);
    const usuarios = await pool.query('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);

    res.render('links/titulosProfesor', { usuarios: usuarios[0], titulos, userType: req.user ? req.user.userType : null});
});


// Vista para Agregar Capitulos de tesis.
router.get('/capitulos', isLoggedIn, isNotAnStudentApproved, async (req, res) => {
    const capituloI = await pool.query('SELECT * FROM capitulos WHERE num_cap = "CapituloI" AND usuario_id = ?', [req.user.id]);
    const capituloII = await pool.query('SELECT * FROM capitulos WHERE num_cap = "CapituloII" AND usuario_id = ?', [req.user.id]);
    const capituloIII = await pool.query('SELECT * FROM capitulos WHERE num_cap = "CapituloIII" AND usuario_id = ?', [req.user.id]);
    const comentariosI = await pool.query('SELECT * FROM comentarios WHERE num_cap = "CapituloI" AND usuario_id = ?', [req.user.id]);
    const comentariosII = await pool.query('SELECT * FROM comentarios WHERE num_cap = "CapituloII" AND usuario_id = ?', [req.user.id]);
    const comentariosIII = await pool.query('SELECT * FROM comentarios WHERE num_cap = "CapituloIII" AND usuario_id = ?', [req.user.id]);

    console.log(comentariosI)

    res.render('links/capitulos', { comentariosI, comentariosII, comentariosIII, capituloI: capituloI[0], capituloII: capituloII[0], capituloIII: capituloIII[0], userType: req.user ? req.user.userType : null });
});

router.post('/capitulos', upload, async (req, res, err) => {
    if (!req.file) {
        if (req.fileRejected) {
            req.flash('danger', 'El Archivo debe ser PDF');
            res.redirect(req.get('referer'));
        }
    }
    const { num_cap } = req.body;
    const capitulo = req.file.filename;
    const originalname = req.file.originalname;

    const newCap = {
        capitulo,
        originalname,
        num_cap,
        seccion: req.user.seccion,
        usuario_id: req.user.id
    }

    try {
        const id = await pool.query('SELECT id FROM capitulos WHERE num_cap = ? AND usuario_id = ?', [num_cap, req.user.id]);
        if (id.length > 0) {
            const x = id[0].id;
            await pool.query('UPDATE capitulos set ? WHERE id = ?', [newCap, x]);
            req.flash('success', 'Capitulo Actualizado Correctamente');
        } else {
            await pool.query('INSERT INTO capitulos set ?', [newCap]);
            req.flash('success', 'Capitulo Guardado Correctamente');
        }
    } catch (error) {
    }
    res.redirect(req.get('referer'));
});

router.get('/capitulosProfesor/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;

    const capituloI = await pool.query('SELECT * FROM capitulos WHERE num_cap = "CapituloI" AND usuario_id = ?', [id]);
    const capituloII = await pool.query('SELECT * FROM capitulos WHERE num_cap = "CapituloII" AND usuario_id = ?', [id]);
    const capituloIII = await pool.query('SELECT * FROM capitulos WHERE num_cap = "CapituloIII" AND usuario_id = ?', [id]);
    const comentariosI = await pool.query('SELECT * FROM comentarios WHERE num_cap = "CapituloI" AND usuario_id = ?', [id]);
    const comentariosII = await pool.query('SELECT * FROM comentarios WHERE num_cap = "CapituloII" AND usuario_id = ?', [id]);
    const comentariosIII = await pool.query('SELECT * FROM comentarios WHERE num_cap = "CapituloIII" AND usuario_id = ?', [id]);

    const usuarios = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);


    res.render('links/capitulosProfesor', { usuarios: usuarios[0], comentariosI, comentariosII, comentariosIII, capituloI: capituloI[0], capituloII: capituloII[0], capituloIII: capituloIII[0], userType: req.user ? req.user.userType : null });
});

router.post('/capitulosProfesor/:id', async (req, res) => {
    const { id } = req.params;
    const { comentarios } = req.body;
    const profesor_id = req.user.id; 
    const datos = await pool.query('SELECT * FROM capitulos WHERE id = ?', [id]);

    const newComment = {
        comentarios,
        num_cap: datos[0].num_cap,
        usuario_id: datos[0].usuario_id,
        profesor_id
    }

    await pool.query('INSERT INTO comentarios set ?', [newComment]);
    
    req.flash('success', 'Comentario Subido');
    res.redirect(req.get('referer'));
});


router.get('/solicitudes/:id', isLoggedIn, async (req, res) => {

    const estudiantes = await pool.query('SELECT * FROM usuarios WHERE seccion = ? AND id <> ? AND estatus <> ? AND userType = "estudiante"', [req.user.seccion, req.user.id, 'Aprobado']);


    res.render('links/solicitudes', { estudiantes, userType: req.user ? req.user.userType : null});
}); 

router.get('/administrar', async (req, res) => {

    const administrar = await pool.query('SELECT * FROM usuarios WHERE userType <> "estudiante" AND id <> ?', [req.user.id]);

    res.render('links/administrar', { administrar, userType: req.user ? req.user.userType : null });
});

router.get('/chatbot', async (req, res) =>{
    res.render('links/chatbot', {userType: req.user ? req.user.userType : null});
});






// Eliminar los titutlos previamente creados
router.get('/delete/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM titulos WHERE id = ?', [id]);
    req.flash('danger', 'Titulo Eliminado');

    res.redirect(req.get('referer'));
});

router.get('/deleteComment/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM comentarios WHERE id = ?', [id]);
    req.flash('danger', 'Comentario Eliminado');
    res.redirect(req.get('referer'));
});

router.get('/tituloAprobado/:id', async (req, res) => {
    const estatus = 'Aprobado';
    const { id } = req.params;

    const newUpdate = {
        estatus
    }

    const titulo = await pool.query('SELECT titulo FROM titulos WHERE id = ?', [id]);

    await pool.query('UPDATE titulos set ? WHERE id = ?', [newUpdate, id]);

    req.flash('success', 'Titulo Aprobado: '+ titulo[0].titulo);
    res.redirect(req.get('referer'));
});

router.get('/solicitudAprobada/:id', async (req, res) => {
    const estatus = 'Aprobado';

    const newUpdate = {
        estatus
    }

    const estudiantes = await pool.query('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    await pool.query('UPDATE usuarios set ? WHERE id = ?', [newUpdate, req.params.id])

    req.flash('success', 'Usuario '+ estudiantes[0].nombre +' '+ estudiantes[0].apellido + ' ha sido Aceptado');
    res.redirect(req.get('referer'));
});

router.get('/solicitudRechazada/:id', async (req, res) => {
    const estudiantes = await pool.query('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    await pool.query('DELETE FROM usuarios WHERE id = ?', [req.params.id])

    req.flash('danger', 'Usuario ' + estudiantes[0].nombre +' '+ estudiantes[0].apellido + ' ha sido Rechazado');
    res.redirect(req.get('referer'));
});

router.post('/cambioSeccion', async (req, res) => {
    const { seccion } = req.body;
    const newSection = {
        seccion
    }

    await pool.query('UPDATE usuarios set ? WHERE id = ?', [newSection, req.user.id]);
    res.redirect(req.get('referer'));
});


module.exports = router;
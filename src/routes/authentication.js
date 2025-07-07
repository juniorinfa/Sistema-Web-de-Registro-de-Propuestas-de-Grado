const express = require('express');
const router = express.Router();

const nodemailer = require('nodemailer');

const passport = require('passport');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
const pool = require('../database');
const helpers = require('../lib/helpers');


enviarMail = async (correo, codigo) => {
	
	const config = {
		host: 'smtp.gmail.com',
		port: 587,
		auth:{
			user: 'proyectodegradoa3@gmail.com',
			pass: 'xahe mjpc rleh vfjs'
		}
	}

	const textoEnviar = 'Sú código de verificación es: '+codigo;

	const mensaje = {
		from: 'proyectodegradoa3@gmail.com',
		to: correo,
		subject: 'Código de Verificación - Propuesta de Grado',
		text: textoEnviar
	}

	const transport = nodemailer.createTransport(config);
	const info = await transport.sendMail(mensaje);
	console.log(info);
}



//Signin
router.get('/signin', isNotLoggedIn, (req, res) => {
    res.render('auth/signin');
});

router.post('/signin', (req, res, next) => {
	passport.authenticate('local.signin', {
		successRedirect: '/profile',
		failureRedirect: '/signin',
		failureFlash: true
	})(req, res, next); 

});

router.get('/signup', isNotLoggedIn, (req, res) =>{
	res.render('auth/signup')
});

//Signup
router.post('/signup', async (req, res, done) => {
	const { nombre, apellido, cedula, correo, seccion, password, confirmarPassword, userType } = req.body;
	
	if (password != confirmarPassword) {
		req.flash('danger', 'La Contraseña no Coincide');
		res.redirect(req.get('referer'));
	} else {
		const newUser = {
			nombre,
			apellido,
			cedula,
			correo,
			seccion,
			password,
			userType
		};

		const userFound = await pool.query('SELECT * FROM usuarios WHERE cedula = ?', [cedula]);

		if (userFound.length > 0) {
			done(null, false, req.flash('danger', 'Este Usuario ya tiene una Cuenta Existente'));
			res.redirect('/signup');
		}else {
			newUser.password = await helpers.encryptPassword(password);
			const result = await pool.query('INSERT INTO usuarios set ?', [newUser]);
			newUser.id = result.insertId;
			res.redirect('/profile');
		}
	}
});


router.get('/profile', isLoggedIn, async (req, res) => {
	const estudiantes = await pool.query('SELECT * FROM usuarios WHERE seccion = ? AND id <> ? AND estatus = "Aprobado"', [req.user.seccion, req.user.id]);
	const estatus = await pool.query('SELECT * FROM usuarios WHERE seccion = ? AND id = ? AND estatus = "Aprobado"', [req.user.seccion, req.user.id]);
	
	const totalEstudiantes = await pool.query('SELECT * FROM usuarios WHERE seccion = ? AND id <> ? AND userType = "estudiante" AND estatus = "Aprobado"', [req.user.seccion, req.user.id]);
	const totalCapI = await pool.query('SELECT * FROM capitulos WHERE seccion = ? AND num_cap = "CapituloI"', [req.user.seccion]);
	const totalCapII = await pool.query('SELECT * FROM capitulos WHERE seccion = ? AND num_cap = "CapituloII"', [req.user.seccion]);
	const totalCapIII = await pool.query('SELECT * FROM capitulos WHERE seccion = ? AND num_cap = "CapituloIII"', [req.user.seccion]);
	const totalTitulos = await pool.query(`
		SELECT id, titulo, seccion, estatus, usuario_id
		FROM (
			SELECT *,
			ROW_NUMBER() OVER (
				PARTITION BY usuario_id
				ORDER BY id DESC
			) AS row_num
			FROM titulos
			WHERE estatus = "Aprobado"
			AND seccion = ?
		) AS ranked
		WHERE row_num = 1
		`, [req.user.seccion]);
	
	var estadisticaTitulo = totalTitulos.length/totalEstudiantes.length*100;
	var estadisticaCapI = totalCapI.length/totalEstudiantes.length*100;
	var estadisticaCapII = totalCapII.length/totalEstudiantes.length*100;
	var estadisticaCapIII = totalCapIII.length/totalEstudiantes.length*100;

	var estadisticaTitulo = estadisticaTitulo.toFixed(2);
	var estadisticaCapI = estadisticaCapI.toFixed(2);
	var estadisticaCapII = estadisticaCapII.toFixed(2);
	var estadisticaCapIII = estadisticaCapIII.toFixed(2);
	
	var seccion;

	switch (req.user.seccion) {
		case 'M01':
			seccion = 1;
			break;
		case 'M02':
			seccion = 2;
			break;
		case 'T01':
			seccion = 3;
			break;
		case 'T02':
			seccion = 4;
			break;
		case 'F01':
			seccion = 5;
			break;
		case 'F02':
			seccion = 6;
			break;
		case 'SP01':
			seccion = 7;
			break;
		case 'SP02':
			seccion = 8;
			break;
	}

	res.render('profile', {userType: req.user ? req.user.userType : null, estudiantes, estatus, totalEstudiantes: totalEstudiantes.length, totalTitulos: totalTitulos.length, estadisticaTitulo, totalCapI: totalCapI.length, totalCapII: totalCapII.length, totalCapIII: totalCapIII.length, estadisticaCapI, estadisticaCapII, estadisticaCapIII, seccion});
});

router.post('/profile', (req, res) => {
	const filtrado = req.body.buscador;
	const cifras = filtrado / 1000000;

	if (cifras < 1 || cifras >= 100) {
		console.log(cifras);
		req.flash('danger', 'Inserta un numero de cedula Valido');
	}else{

	}

	res.redirect('/profile');
});

router.get('/crearUser', (req, res) => {

	res.render('links/crearUser', { userType: req.user ? req.user.userType : null });

});

router.post('/crearUser', async (req, res, done) => {
	const { nombre, apellido, cedula, correo, seccion, password, confirmarPassword, userType } = req.body;
	
	if (password != confirmarPassword) {
		req.flash('danger', 'La Contraseña no Coincide');
		res.redirect(req.get('referer'));
	} else {
		const newUser = {
			nombre,
			apellido,
			cedula,
			correo,
			seccion,
			password,
			userType
		};

		const userFound = await pool.query('SELECT * FROM usuarios WHERE cedula = ?', [cedula]);

		
		if (userFound.length > 0) {
			const userFoundId = userFound[0].id;
			newUser.password = await helpers.encryptPassword(password);
			await pool.query('UPDATE usuarios set ? WHERE id = ?', [newUser, userFoundId]);
			req.flash('success', 'Un Usuario se ha Actualizado');

		}else {
			newUser.password = await helpers.encryptPassword(password);
			await pool.query('INSERT INTO usuarios set ?', [newUser]);
			req.flash('success', 'Un Usuario ha sido Creado');
		}
		res.redirect('/profile');
	}
});

router.get('/administrarEdit/:id', async (req, res) => {
	const { id } = req.params;
	const datos = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
	var notStudent;

	if (datos[0].userType !== 'estudiante') {
		notStudent = true;
	}
	
	res.render('links/administrarEdit', { notStudent, userType: req.user ? req.user.userType : null, datos: datos[0]});

});

router.post('/administrarEdit/:id', async (req, res, done) => {
	const { nombre, apellido, cedula, correo, seccion, password, confirmarPassword, userType } = req.body;
	
	if (password != confirmarPassword) {
		req.flash('danger', 'La Contraseña no Coincide');
		res.redirect(req.get('referer'));
	} else {
		const newUser = {
			nombre,
			apellido,
			cedula,
			correo,
			seccion,
			password,
			userType
		};
		
		newUser.password = await helpers.encryptPassword(password);
		await pool.query('UPDATE usuarios set ? WHERE id = ?', [newUser, req.params.id]);
		req.flash('success', 'Usuario Actualizado');


		res.redirect('/profile');
	}
});


router.get('/recuperarCedula', (req, res) => {
	res.render('auth/recuperarCedula');
});

router.post('/recuperarCedula', async (req, res) => {
	const { cedula } = req.body;
	let codigo = '';

	for (let i = 0; i < 8; i++) {
		codigo += Math.floor(Math.random() * 10);
	}

	const newCod = {
		cedula,
		codigo
	}
	
	const userCedula = await pool.query('SELECT * FROM usuarios WHERE cedula = ?', [cedula]);

	
	if (userCedula.length > 0) {
		const correo = userCedula[0].correo;
		enviarMail(correo, codigo);
		
		const rows = await pool.query('SELECT * FROM recuperacion WHERE cedula = ?', [cedula]);

		if (rows.length > 0) {
			await pool.query('UPDATE recuperacion set ? WHERE cedula = ?', [newCod, cedula]);
		} else {
			await pool.query('INSERT INTO recuperacion set ?', [newCod]);
		}
	
		res.redirect('/insertCod');
	}else{
		req.flash('danger', 'Cédula no Registrada');
		res.redirect('/signup');
	}
});

let cedulaRecuperarPassword = '';

router.get('/insertCod', (req, res) => {
	res.render('auth/insertCod');
});

router.post('/insertCod', async (req, res) => {
	const { codigo } = req.body;

	const rows = await pool.query('SELECT * FROM recuperacion WHERE codigo = ?', [codigo]);

	if (rows.length > 0){
		cedulaRecuperarPassword = rows[0].cedula;
		res.redirect('/cambioPassword');
	}else{
		req.flash('danger', 'Código Incorrecto');
	}

	res.redirect(req.get('referer'));
});

router.get('/cambioPassword', async (req, res) => {
	res.render('auth/cambioPassword');
});

router.post('/cambioPassword', async (req, res) => {
	const { password, confirmarPassword } = req.body;

	if (password != confirmarPassword) {
		req.flash('danger', 'La Contraseña no Coincide');
		res.redirect(req.get('referer'));
	} else {
		const newUser = {
			password
		};
		newUser.password = await helpers.encryptPassword(password);
		await pool.query('UPDATE usuarios set ? WHERE cedula = ?', [newUser, cedulaRecuperarPassword]);
		await pool.query('DELETE FROM recuperacion WHERE cedula = ?', [cedulaRecuperarPassword]);
		req.flash('success', 'Contraseña Actualizada');
		res.redirect('/profile');
	}

});





router.get('/deleteUser/:id', async (req, res) => {
	const usuario = await pool.query('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
	await pool.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
	
	try {await pool.query('DELETE FROM titulos WHERE usuario_id = ?', [req.params.id]);} catch (e) {}
	try {await pool.query('DELETE FROM comentarios WHERE usuario_id = ?', [req.params.id]);} catch (e) {}
	try {await pool.query('DELETE FROM capitulos WHERE usuario_id = ?', [req.params.id]);} catch (e) {}

	req.flash('danger', 'Usuario ' + usuario[0].nombre +' '+ usuario[0].apellido + ' ha sido Eliminado');
	res.redirect(req.get('referer'));

});


router.get('/logout', (req, res) => {
	req.logOut(req.user, err => {
		if (err) {return next(err)};
		res.redirect('/signin');
	});
});

module.exports = router;

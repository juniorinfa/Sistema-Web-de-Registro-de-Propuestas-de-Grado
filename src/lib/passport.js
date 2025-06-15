const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('../lib/helpers');

passport.use('local.signin', new LocalStrategy({
    cedulaField: 'cedula',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, cedula, password, done) => {
    const rows = await pool.query('SELECT * FROM usuarios WHERE cedula = ?', [cedula]);
    if (rows.length > 0) {
        const user = rows[0];
        const validPassword = await helpers.matchPassword(password, user.password);
        if (validPassword) {
            done(null, user, req.flash('success', 'Bienvenido ' + user.nombre + ' ' + user.apellido));
        } else {
            done(null, false, req.flash('danger', 'Usuario o Contraseña Invalida'));
        }
    }else{
        return done(null, false, req.flash('danger', 'Este Usuario no Existe'));
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const rows = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    done(null, rows[0]);
});

const express = require('express');
const morgan = require('morgan');
const { engine } = require('express-handlebars');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const MySQLStore =  require('express-mysql-session')(session);
const passport = require('passport');

const {database} = require('./keys');

// Initializations
const app = express();
require('./lib/passport')

// Settings
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', engine({
    defautLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: require('./lib/handlebars'),
    helpers: {
        // Helper para verificar si es estudiante
        isStudent: (userType) => userType === 'estudiante',
        
        // Helper para verificar si es docente
        isTeacher: (userType) => userType === 'profesor',
        
        // Helper para verificar si es directivo
        isAdmin: (userType) => userType === 'administrador',

        combinados: (userType) => userType === 'profesor' || userType === 'administrador'
    }
}));
app.set('view engine', '.hbs');

// Middlewares
app.use(session({
    secret:'juniortesis',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(database)
}));
app.use(flash());
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());



// Globals Variables
app.use((req, res, next) => {
    app.locals.success = req.flash('success');
    app.locals.danger = req.flash('danger');
    app.locals.user = req.user;
    next();
});

//Routes
app.use(require('./routes'));
app.use(require('./routes/authentication'));
app.use('/links', require('./routes/links'));


// Static Files
app.use(express.static(path.join(__dirname, 'public')));

//Public
app.use(express.static(path.join(__dirname, 'public')))

//Starting the server
app.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'));
});



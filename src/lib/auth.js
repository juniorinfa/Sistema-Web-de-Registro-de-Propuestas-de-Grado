module.exports = {

    isLoggedIn(req, res, next){
        if (req.isAuthenticated()) {
            return next();
        }else{
            return res.redirect('/signin');
        }
    },
    
    isNotLoggedIn(req, res, next){
        if (!req.isAuthenticated()) {
            return next();
        }else{
            return res.redirect('/profile');
        }
    },

    isNotAnStudentApproved(req, res, next){
        if (req.user.estatus) {
            return next();
        }else{
            req.flash('danger', 'Tu Solicitud aun no ha sido Aceptada');
            return res.redirect('/profile');
        }
    },

    isNotAnStudent(req, res, next){
        if (req.user.estatus) {
            return next();
        }else{
            return res.redirect('/profile');
        }
    }

    

};
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Default error status and message
    const status = err.status || 500;
    const message = err.message || 'Erreur interne du serveur';

    res.status(status).json({
        error: process.env.NODE_ENV === 'production' ? 'Une erreur est survenue' : message
    });
};

module.exports = errorHandler;

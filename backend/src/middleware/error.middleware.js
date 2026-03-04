// Centralized Error Handling Middleware
// This prevents raw Database or Internal Server errors from leaking to the frontend connection.
const errorHandler = (err, req, res, next) => {
    // Determine the status code (default to 500 Internal Server Error if not provided)
    const statusCode = err.statusCode || 500;

    // In development mode, we expose the full error stack for debugging
    // In production, we ONLY send a clean generic message.
    const isDevelopment = process.env.NODE_ENV === "development";

    const response = {
        message: statusCode === 500 ? "Internal Server Error" : err.message,
        // Stack trace is extremely sensitive, hide it otherwise
        ...(isDevelopment && { stack: err.stack }),
    };

    // Log actual error on the backend server for developers securely
    console.error(`[❌ ERROR] ${req.method} ${req.url} - ${err.message}`);
    if (statusCode === 500) {
        console.error(err.stack);
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;


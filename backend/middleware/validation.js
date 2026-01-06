const Joi = require('joi');

// Validation schemas for production
const schemas = {
    register: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .max(255)
            .messages({
                'string.email': 'Invalid email format',
                'string.max': 'Email too long',
                'any.required': 'Email is required'
            }),
        password: Joi.string()
            .min(8)
            .max(128)
            .required()
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
            .messages({
                'string.min': 'Password must be at least 8 characters',
                'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
                'any.required': 'Password is required'
            }),
        name: Joi.string()
            .min(2)
            .max(100)
            .required()
            .trim()
            .messages({
                'string.min': 'Name must be at least 2 characters',
                'string.max': 'Name too long',
                'any.required': 'Name is required'
            }),
        isStudent: Joi.boolean().default(false)
    }),

    login: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Invalid email format',
                'any.required': 'Email is required'
            }),
        password: Joi.string()
            .required()
            .messages({
                'any.required': 'Password is required'
            })
    }),

    addToCart: Joi.object({
        sessionId: Joi.string().required(),
        userId: Joi.string().required(),
        product: Joi.object({
            productId: Joi.string().required(),
            name: Joi.string().required(),
            price: Joi.number().positive().required(),
            quantity: Joi.number().integer().positive().required(),
            category: Joi.string().required(),
            tags: Joi.array().items(Joi.string())
        }).required()
    }),

    updateCart: Joi.object({
        sessionId: Joi.string().required(),
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(0).required()
    }),

    createOrder: Joi.object({
        sessionId: Joi.string().required(),
        paymentInfo: Joi.object({
            method: Joi.string().valid('credit_card', 'debit_card', 'paypal').required(),
            lastFourDigits: Joi.string().length(4).required()
        }).required()
    })
};

// Validation middleware factory
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const messages = error.details.map(d => ({
                field: d.path.join('.'),
                message: d.message
            }));
            return res.status(400).json({
                error: 'Validation failed',
                details: messages
            });
        }

        req.body = value;
        next();
    };
};

module.exports = {
    schemas,
    validate
};

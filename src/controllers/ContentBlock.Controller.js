// src/controllers/Content/Block.Controller.js
const db = require('../models');
const ApiError = require('../utils/apiError');
const ContentBlock = db.ContentBlock;

const ContentBlockController = {
    /**
     * Obtiene todos los bloques de contenido para un idioma específico 
     * y los formatea como un diccionario para el frontend.
     * GET /api-resplandor/content/:locale
     */
    async getDictionaryByLocale(req, res, next) {
        try {
            // 1. Extraemos el idioma de la URL (ej: 'es' o 'en')
            const { locale } = req.params;

            // 2. Buscamos en la base de datos
            const blocks = await ContentBlock.findAll({
                where: {
                    locale: locale,
                    isActive: true
                },
                attributes: ['section', 'payload'] // Optimizamos: solo traemos lo necesario
            });

            // 3. Manejo de caso vacío (404)
            if (!blocks || blocks.length === 0) {
                // dejamos que app.js resuelva el manejo del error
                return next(new ApiError(404, `No se encontró contenido para el idioma: ${locale}`));
            }

            // 4. Transformación de datos (Data Shaping)
            // Convertimos el array de la BD en un objeto simple para React
            // De: [{ section: 'hero', payload: { title: 'Hola' } }]
            // A: { hero: { title: 'Hola' } }
            const dictionary = {};
            blocks.forEach(block => {
                dictionary[block.section] = block.payload;
            });

            // 5. Respuesta exitosa
            return res.status(200).json(dictionary);

        } catch (error) {
            console.error(`❌ Error en getDictionaryByLocale (${req.params.locale}):`, error);
            // Delegamos el error al middleware global de app.js
            next(error);
        }
    },


    /**
     * Crea un nuevo bloque de contenido en la base de datos.
     * POST /api-resplandor/content
     */
    async createBlock(req, res, next) {
        try {
            const { section, locale, payload, isActive } = req.body;

            // 1. Validación básica
            if (!section || !locale || !payload) {
                return next(new ApiError(400, 'Los campos section, locale y payload son obligatorios.'));
            }

            // 2. Creación del registro
            const newBlock = await ContentBlock.create({
                section,
                locale,
                payload,
                // Si isActive no viene en el body, por defecto será true
                isActive: isActive !== undefined ? isActive : true 
            });

            // 3. Respuesta exitosa (201 Created)
            return res.status(201).json({
                status: 'success',
                message: 'Bloque de contenido creado exitosamente',
                data: newBlock
            });

        } catch (error) {
            // Interceptamos el error de restricción única (Unique Constraint) de Sequelize
            if (error.name === 'SequelizeUniqueConstraintError') {
                return next(new ApiError(409, `Conflicto: Ya existe un bloque '${req.body.section}' para el idioma '${req.body.locale}'.`));
            }
            
            console.error('❌ Error en createBlock:', error);
            next(error); // Cualquier otro error va al 500 global
        }
    },

    /**
     * Actualiza parcialmente un bloque de contenido (PATCH).
     * Permite fusionar nuevos datos en el JSONB sin borrar los anteriores.
     * PATCH /api-resplandor/content/:id
     */
    async updateBlock(req, res, next) {
        try {
            const { id } = req.params; // Sacamos el ID de la URL
            const updates = req.body;  // Lo que el usuario quiere cambiar

            // 1. Buscamos el registro original
            const block = await ContentBlock.findByPk(id);

            if (!block) {
                return next(new ApiError(404, `No se encontró el bloque con ID: ${id}`));
            }

            // 2. La Magia del JSONB (Fusión / Merge)
            // Si el usuario envió un nuevo 'payload', lo fusionamos con el existente.
            if (updates.payload) {
                updates.payload = {
                    ...block.payload, // Mantenemos todo lo que ya existía
                    ...updates.payload // Sobrescribimos o agregamos solo lo nuevo
                };
            }

            // 3. Actualizamos la base de datos
            // Sequelize es inteligente: si updates solo trae { isActive: false }, 
            // solo actualizará esa columna.
            await block.update(updates);

            return res.status(200).json({
                status: 'success',
                message: 'Bloque actualizado correctamente',
                data: block
            });

        } catch (error) {
            // Manejo de error si intentan poner una sección/idioma que ya existe
            if (error.name === 'SequelizeUniqueConstraintError') {
                return next(new ApiError(409, 'Conflicto: Ya existe otro bloque con esa sección y ese idioma.'));
            }
            
            console.error(`❌ Error en updateBlock (${req.params.id}):`, error);
            next(error);
        }
    },

    /**
     * Realiza un borrado lógico (Soft Delete) de un bloque de contenido.
     * Cambia el estado isActive a false en lugar de destruirlo físicamente.
     */
    async deleteBlock(req, res, next) {
        try {
            const { id } = req.params;

            // 1. Buscamos el registro
            const block = await ContentBlock.findByPk(id);

            if (!block) {
                return next(new ApiError(404, `No se encontró el bloque con ID: ${id}`));
            }

            // 2. Ejecutamos el Soft Delete
            await block.update({ isActive: false });

            // 3. Respuesta exitosa
            return res.status(200).json({
                status: 'success',
                message: 'Bloque desactivado (Soft Delete) exitosamente',
                data: { 
                    id: block.id, 
                    section: block.section, 
                    isActive: block.isActive 
                }
            });

        } catch (error) {
            console.error(`❌ Error en deleteBlock (${req.params.id}):`, error);
            next(error);
        }
    },

    /**
     * Obtiene todos los registros en bruto (Para uso de CMS/Admin).
     * GET /api-resplandor/content
     */
    async getAllBlocks(req, res, next) {
        try {
            const blocks = await ContentBlock.findAll({
                order: [
                    ['locale', 'ASC'],
                    ['section', 'ASC'] // Ordenamos alfabéticamente para que sea fácil leer en Postman
                ]
            });

            return res.status(200).json({
                status: 'success',
                results: blocks.length,
                data: blocks
            });
        } catch (error) {
            console.error('❌ Error en getAllBlocks:', error);
            next(error);
        }
    },
};

module.exports = ContentBlockController;
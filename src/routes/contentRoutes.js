const express = require('express');
const router = express.Router();
const ContentBlockController = require('../controllers/ContentBlock.Controller');
const requireApiKey = require('../middlewares/requireApiKey');

// ===================================================================
// RUTAS PARA BLOQUES DE CONTENIDO (i18n CMS)
// ===================================================================

// ==========================================
//  RUTAS PÚBLICAS (Solo lectura)

/**
 * @route   GET /api-resplandor/content/:locale
 * @desc    Obtiene el diccionario de traducciones completo para un idioma (ej: 'es', 'en')
 * @access  Public
 */
router.get('/:locale', ContentBlockController.getDictionaryByLocale);

/**
 * @route   GET /api-resplandor/content/
 * @desc Obtiene todos los registros en bruto (Para uso de CMS/Admin).
 * @access Public
 */
router.get('/', ContentBlockController.getAllBlocks);


// ==========================================
//  RUTAS PROTEGIDAS (Escritura/Modificación)

/**
 * @route   POST /api-resplandor/content
 * @desc    Crea un nuevo bloque de contenido
 * @access  Public (Temporalmente, luego agregaremos JWT)
 */
router.post('/', requireApiKey, ContentBlockController.createBlock);

/**
 * @route   PATCH /api-resplandor/content/:id
 * @desc    Actualiza parcialmente un bloque (incluyendo fusión de JSONB)
 * @access  Public (Temporalmente)
 */
router.patch('/:id', requireApiKey, ContentBlockController.updateBlock);

/**
 * @route   DELETE /api-resplandor/content/:id
 * @desc    Realiza un borrado lógico (Soft Delete) de un bloque
 * @access  Public (Temporalmente)
 */
router.delete('/:id', requireApiKey, ContentBlockController.deleteBlock);

module.exports = router;
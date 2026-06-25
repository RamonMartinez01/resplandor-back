const express = require('express');
const router = express.Router();
const ContentBlockController = require('../controllers/ContentBlock.Controller');

// ===================================================================
// RUTAS PARA BLOQUES DE CONTENIDO (i18n CMS)
// ===================================================================

/**
 * @route   GET /api-resplandor/content/:locale
 * @desc    Obtiene el diccionario de traducciones completo para un idioma (ej: 'es', 'en')
 * @access  Public
 */
router.get('/:locale', ContentBlockController.getDictionaryByLocale);

/**
 * @route   POST /api-resplandor/content
 * @desc    Crea un nuevo bloque de contenido
 * @access  Public (Temporalmente, luego agregaremos JWT)
 */
router.post('/', ContentBlockController.createBlock);

/**
 * @route   GET /api-resplandor/content/
 * @desc Obtiene todos los registros en bruto (Para uso de CMS/Admin).
 * @access Public
 */
router.get('/', ContentBlockController.getAllBlocks);

/**
 * @route   PATCH /api-resplandor/content/:id
 * @desc    Actualiza parcialmente un bloque (incluyendo fusión de JSONB)
 * @access  Public (Temporalmente)
 */
router.patch('/:id', ContentBlockController.updateBlock);

/**
 * @route   DELETE /api-resplandor/content/:id
 * @desc    Realiza un borrado lógico (Soft Delete) de un bloque
 * @access  Public (Temporalmente)
 */
router.delete('/:id', ContentBlockController.deleteBlock);

module.exports = router;
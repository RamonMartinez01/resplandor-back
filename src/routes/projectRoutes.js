const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/Project.Controller');
const requireApiKey = require('../middlewares/requireApiKey');

// ===================================================================
// RUTAS PARA PROYECTOS (Portfolio Showcase)
// ===================================================================

/**
 * @route   GET /api-resplandor/projects
 * @desc    Obtiene todos los proyectos activos (soporta ?locale=es|en)
 * @access  Public
 */
router.get('/', ProjectController.getAllProjects);

/**
 * @route   POST /api-resplandor/projects
 * @desc    Crea un nuevo proyecto
 * @access  Public (Temporalmente)
 */
router.post('/', requireApiKey, ProjectController.createProject);

/**
 * @route   PATCH /api-resplandor/projects/:id
 * @desc    Actualiza parcialmente un proyecto
 * @access  Public (Temporalmente)
 */
router.patch('/:id', requireApiKey, ProjectController.updateProject);

/**
 * @route   DELETE /api-resplandor/projects/:id
 * @desc    Realiza un borrado lógico (Soft Delete)
 * @access  Public (Temporalmente)
 */
router.delete('/:id', requireApiKey, ProjectController.deleteProject);

module.exports = router;
const db = require('../models');
const ApiError = require('../utils/apiError');
const Project = db.Project;

const ProjectController = {
    /**
     * Obtiene todos los proyectos activos y formatea la descripción
     * según el idioma solicitado mediante query params (?locale=es).
     * GET /api-resplandor/projects?locale=en || ?locale=es
     */
    async getAllProjects(req, res, next) {
        try {
            // 1. Capturamos el idioma de la URL. Por defecto será 'es' si no se envía.
            const locale = req.query.locale || 'es';

            // 2. Buscamos todos los proyectos activos
            const projects = await Project.findAll({
                where: { isActive: true },
                order: [['createdAt', 'DESC']] // Ordenamos: los más recientes primero
            });

            if (!projects || projects.length === 0) {
                return next(new ApiError(404, 'No se encontraron proyectos activos.'));
            }

            // 3. Data Shaping: Transformamos el array para el frontend
            const formattedProjects = projects.map(project => {
                // Intentamos sacar el contenido en el idioma pedido, si no existe, usamos español, si no, vacío
                const localData = project.localizedContent[locale] || project.localizedContent['es'] || {};
                
                return {
                    id: project.id,
                    title: project.title,
                    slug: project.slug,
                    description: localData.description || '', // Extraemos la descripción plana
                    tags: project.tags,
                    imageUrl: project.imageUrl,
                    githubUrl: project.githubUrl,
                    liveDemoUrl: project.liveDemoUrl,
                    isFeatured: project.isFeatured
                };
            });

            // 4. Respuesta exitosa
            return res.status(200).json({
                status: 'success',
                results: formattedProjects.length,
                data: formattedProjects
            });

        } catch (error) {
            console.error('❌ Error en getAllProjects:', error);
            next(error);
        }
    },

    /**
     * Crea un nuevo proyecto en la base de datos.
     * POST /api-resplandor/projects
     */
    async createProject(req, res, next) {
        try {
            const { 
                title, slug, tags, imageUrl, githubUrl, 
                liveDemoUrl, isFeatured, localizedContent, isActive 
            } = req.body;

            // 1. Validación de campos críticos
            if (!title || !slug || !localizedContent) {
                return next(new ApiError(400, 'Los campos title, slug y localizedContent son obligatorios.'));
            }

            // 2. Creación del registro
            const newProject = await Project.create({
                title,
                slug,
                tags,
                imageUrl,
                githubUrl,
                liveDemoUrl,
                isFeatured: isFeatured || false,
                localizedContent,
                isActive: isActive !== undefined ? isActive : true
            });

            return res.status(201).json({
                status: 'success',
                message: 'Proyecto creado exitosamente',
                data: newProject
            });

        } catch (error) {
            // Manejo del error si el slug ya existe (restricción UNIQUE)
            if (error.name === 'SequelizeUniqueConstraintError') {
                return next(new ApiError(409, `Conflicto: El slug '${req.body.slug}' ya está en uso por otro proyecto.`));
            }
            
            console.error('❌ Error en createProject:', error);
            next(error);
        }
    },

    /**
     * Actualiza parcialmente un proyecto (PATCH).
     * Soporta la fusión inteligente del JSONB para localizedContent.
     * PATCH /api-resplandor/projects/:id
     */
    async updateProject(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // 1. Buscamos el proyecto
            const project = await Project.findByPk(id);

            if (!project) {
                return next(new ApiError(404, `No se encontró el proyecto con ID: ${id}`));
            }

            // 2. Fusión de JSONB (Merge) si se envían actualizaciones de contenido
            if (updates.localizedContent) {
                updates.localizedContent = {
                    ...project.localizedContent,
                    ...updates.localizedContent
                };
            }

            // 3. Ejecutamos la actualización
            await project.update(updates);

            return res.status(200).json({
                status: 'success',
                message: 'Proyecto actualizado correctamente',
                data: project
            });

        } catch (error) {
            // Interceptamos si intentan poner un slug que ya le pertenece a otro proyecto
            if (error.name === 'SequelizeUniqueConstraintError') {
                return next(new ApiError(409, 'Conflicto: El slug proporcionado ya está en uso.'));
            }
            console.error(`❌ Error en updateProject (${req.params.id}):`, error);
            next(error);
        }
    },

    /**
     * Realiza un borrado lógico (Soft Delete) del proyecto.
     * DELETE /api-resplandor/projects/:id
     */
    async deleteProject(req, res, next) {
        try {
            const { id } = req.params;

            const project = await Project.findByPk(id);

            if (!project) {
                return next(new ApiError(404, `No se encontró el proyecto con ID: ${id}`));
            }

            // Aplicamos el borrado lógico
            await project.update({ isActive: false });

            return res.status(200).json({
                status: 'success',
                message: 'Proyecto desactivado (Soft Delete) exitosamente',
                data: {
                    id: project.id,
                    title: project.title,
                    isActive: project.isActive
                }
            });

        } catch (error) {
            console.error(`❌ Error en deleteProject (${req.params.id}):`, error);
            next(error);
        }
    }


};

module.exports = ProjectController;
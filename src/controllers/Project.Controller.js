// src/controllers/Project.Controller.js
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
            // 1. Captura el idioma de la URL. Por defecto será 'en' si no se envía.
            const locale = req.query.locale || 'en';

            // 2. Busca todos los proyectos activos
            const projects = await Project.findAll({
                where: { isActive: true },
                order: [['createdAt', 'DESC']] // Ordena: los más recientes primero
            });

            // 3. Data Shaping: Transforma el array para el frontend
            // Si projects es [], formattedProjects simplemente será []
            const formattedProjects = projects.map(project => {
                // Intenta sacar el contenido en el idioma pedido, si no existe, usamos inglés, si no, vacío
                const localData = project.localizedContent[locale] || project.localizedContent['en'] || {};

                return {
                    id: project.id,
                    title: project.title,
                    slug: project.slug,
                    description: localData.description || '', 
                    tags: project.tags,
                    imageUrl: project.imageUrl,
                    repositories: project.repositories,
                    liveDemoUrl: project.liveDemoUrl,
                    isFeatured: project.isFeatured
                };
            });

            // 4. Respuesta exitosa (maneja colecciones con valores, o vacías)
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
     * Obtiene un proyecto específico por su ID o Slug.
     * Extrae el contenido localizado (description, architecture, devops, etc.)
     * GET /api-resplandor/projects/:identifier?locale=es
     */
    async getProjectByIdOrSlug(req, res, next) {
        try {
            const { id } = req.params; // Usamos 'id' asumiendo que tu ruta es /:id, pero internamente actuará como 'identifier'
            const locale = req.query.locale || 'en';

            // 1. Expresión regular para detectar si el parámetro es un UUIDv4
            const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);

            // 2. Construimos la condición de búsqueda dinámicamente
            const searchCondition = isUUID ? { id: id } : { slug: id };
            
            // Añadimos la regla de negocio: el proyecto debe estar activo
            searchCondition.isActive = true;

            // 3. Ejecutamos la consulta
            const project = await Project.findOne({
                where: searchCondition
            });

            // 4. Manejo de error si no existe
            if (!project) {
                return next(new ApiError(404, `No se encontró el proyecto activo con identificador: ${id}`));
            }

            // 5. Data Shaping: Extraemos el contenido en el idioma solicitado
            // ¡Aquí brilla tu campo JSONB!
            const localData = project.localizedContent[locale] || project.localizedContent['en'] || {};

            const formattedProject = {
                id: project.id,
                title: project.title,
                slug: project.slug,
                // Mapeamos los campos que vivirán dentro del JSONB
                description: localData.description || '',
                architecture: localData.architecture || '', 
                devops: localData.devops || '',             
                tags: project.tags,
                imageUrl: project.imageUrl,
                repositories: project.repositories,
                liveDemoUrl: project.liveDemoUrl,
                isFeatured: project.isFeatured
                // No enviamos isActive ni localizedContent crudo por seguridad/limpieza
            };

            // 6. Respuesta exitosa
            return res.status(200).json({
                status: 'success',
                data: formattedProject
            });

        } catch (error) {
            console.error(`❌ Error en getProjectByIdOrSlug (${req.params.id}):`, error);
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
                title, slug, tags, imageUrl, repositories,
                liveDemoUrl, isFeatured, localizedContent, isActive
            } = req.body;

            // 1. Validación de campos críticos
            if (!title || !slug || !localizedContent) {
                return next(new ApiError(400, 'Los campos title, slug y localizedContent son obligatorios.'));
            }

            if (repositories && !Array.isArray(repositories)) {
                return next(new ApiError(400, "El campo 'repositories' debe ser un arreglo de objetos."));
            }

            // 2. Creación del registro
            const newProject = await Project.create({
                title,
                slug,
                tags,
                imageUrl,
                repositories,
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

            const allowedUpdates = [
                'title', 'slug', 'tags', 'imageUrl',
                'repositories',
                'liveDemoUrl', 'isFeatured', 'localizedContent', 'isActive'
            ];

            Object.keys(req.body).forEach((key) => {
                if (allowedUpdates.includes(key)) {
                    updates[key] = req.body[key];
                }
            });

            
            // Y validamos igual antes de hacer el update
            if (updates.repositories && !Array.isArray(updates.repositories)) {
                return next(new ApiError(400, "El campo 'repositories' debe ser un arreglo de objetos."));
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
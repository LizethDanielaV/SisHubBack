class ProgressService {
    constructor() {
        this.progress = new Map();
    }

    /**
     * Crear un nuevo progreso
     */
    createProgress(id, total) {
        this.progress.set(id, {
            id,
            total,
            current: 0,
            status: 'processing',
            message: 'Iniciando proceso...',
            errors: [],
            success: [],
            startTime: Date.now()
        });
        return this.progress.get(id);
    }

    /**
     * Actualizar progreso
     */
    updateProgress(id, current, message, data = {}) {
        const progress = this.progress.get(id);
        if (progress) {
            progress.current = current;
            progress.message = message;
            progress.updatedAt = Date.now();
            Object.assign(progress, data);
            this.progress.set(id, progress);
        }
        return progress;
    }

    /**
     * Agregar un éxito
     */
    addSuccess(id, item) {
        const progress = this.progress.get(id);
        if (progress) {
            // Evitar duplicados según el campo identificador del estudiante
            const exists = progress.success.some(s => s.codigo === item.codigo);

            if (!exists) {
                progress.success.push({
                    ...item,
                    timestamp: Date.now()
                });
                this.progress.set(id, progress);
            }
        }
        return progress;
    }

    /**
     * Agregar un error
     */
    addError(id, item) {
        const progress = this.progress.get(id);
        if (progress) {
            progress.errors.push({
                ...item,
                timestamp: Date.now()
            });
            this.progress.set(id, progress);
        }
        return progress;
    }

    /**
     * Completar progreso exitosamente
     */
    completeProgress(id, message) {
        const progress = this.progress.get(id);
        if (progress) {
            progress.status = 'completed';
            progress.message = message || '✓ Proceso completado exitosamente';
            progress.current = progress.total;
            progress.completedAt = Date.now();
            progress.duration = progress.completedAt - progress.startTime;
            this.progress.set(id, progress);

            // Limpiar después de 10 minutos
            setTimeout(() => {
                this.progress.delete(id);
            }, 10 * 60 * 1000);
        }
        return progress;
    }

    /**
     * Marcar progreso como fallido
     */
    failProgress(id, message) {
        const progress = this.progress.get(id);
        if (progress) {
            progress.status = 'failed';
            progress.message = message || 'Error en el proceso';
            progress.failedAt = Date.now();
            progress.duration = progress.failedAt - progress.startTime;
            this.progress.set(id, progress);

            // Limpiar después de 10 minutos
            setTimeout(() => {
                this.progress.delete(id);
            }, 10 * 60 * 1000);
        }
        return progress;
    }

    /**
     * Obtener progreso por ID
     */
    getProgress(id) {
        return this.progress.get(id);
    }

    /**
     * Eliminar progreso
     */
    deleteProgress(id) {
        return this.progress.delete(id);
    }

    /**
     * Limpiar todos los progresos
     */
    clearAll() {
        this.progress.clear();
    }

    /**
     * Obtener todos los progresos (útil para debug)
     */
    getAllProgress() {
        return Array.from(this.progress.values());
    }
}

export const progressService = new ProgressService();
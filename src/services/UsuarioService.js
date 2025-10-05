import Usuario from '../models/Usuario.js';

async function listarDocentes() {
    try {
        const docentes = await Usuario.findAll({
            where: { id_rol: '2' },
            attributes: ['id_usuario', 'nombre', 'correo']
        });
        return docentes;
    } catch (error) {
        throw new Error("Error al listar docentes: " + error.message);
    }
}

export default { listarDocentes };
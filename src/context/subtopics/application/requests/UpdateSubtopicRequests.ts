export class UpdateSubtopicRequest {
	constructor(
		public readonly id: string,
		public readonly title?: string,
		public readonly order?: number,
		public readonly description?: string
	) {
		this.validate();
	}

	private validate(): void {
		if (!this.id || this.id.trim().length === 0) {
			throw new Error('ID del subtema es requerido');
		}

		if (
      this.title === undefined &&
      this.order === undefined &&
      this.description === undefined
    ) {
      throw new Error('Debe proporcionar al menos un campo para actualizar (title, description, order, subtopics)');
    }

		if (this.title !== undefined) {
			if (this.title.trim().length === 0) {
				throw new Error('El título del subtema no puede estar vacío');
			}
			if (this.title.trim().length < 3) {
        throw new Error('El título debe tener al menos 3 caracteres');
      }
      if (this.title.trim().length > 200) {
        throw new Error('El título no puede exceder los 200 caracteres');
      }
		}

		if (this.order !== undefined) {
			if (!Number.isInteger(this.order)) {
        throw new Error('El orden debe ser un número entero');
      }
      if (this.order < 1) {
        throw new Error('El orden debe ser mayor o igual a 1');
      }
		}
	}
}
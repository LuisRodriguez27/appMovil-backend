export interface SubtopicUpdate {
  subtopicId: string;
  title?: string;
  description?: string;
  order?: number;
}

export class UpdateSubtopicsRequest {
  constructor(
    public readonly topicId: string,
    public readonly data: SubtopicUpdate | SubtopicUpdate[]
  ) {
    this.validate();
  }

  private validate(): void {
    // Validar topicId
    if (!this.topicId || this.topicId.trim().length === 0) {
      throw new Error('ID del tema es requerido');
    }

    // Normalizar data a array para validar
    const updates = this.asArray();

    if (updates.length === 0) {
      throw new Error('Debe proporcionar al menos un subtema para actualizar');
    }

    // Validar cada update
    for (const update of updates) {
      this.validateUpdate(update);
    }
  }

  private validateUpdate(update: SubtopicUpdate): void {
    // Validar subtopicId
    if (!update.subtopicId || update.subtopicId.trim().length === 0) {
      throw new Error('ID del subtema es requerido');
    }

    // Validar que al menos un campo esté presente
    if (
      update.title === undefined &&
      update.description === undefined &&
      update.order === undefined
    ) {
      throw new Error('Debe proporcionar al menos un campo para actualizar (title, description, order)');
    }

    // Validar título si se proporciona
    if (update.title !== undefined) {
      if (update.title.trim().length === 0) {
        throw new Error('El título no puede estar vacío');
      }
      if (update.title.trim().length < 3) {
        throw new Error('El título debe tener al menos 3 caracteres');
      }
      if (update.title.trim().length > 200) {
        throw new Error('El título no puede exceder los 200 caracteres');
      }
    }

    // Validar descripción si se proporciona
    if (update.description !== undefined) {
      if (update.description.trim().length === 0) {
        throw new Error('La descripción no puede estar vacía');
      }
      if (update.description.trim().length < 10) {
        throw new Error('La descripción debe tener al menos 10 caracteres');
      }
      if (update.description.trim().length > 1000) {
        throw new Error('La descripción no puede exceder los 1000 caracteres');
      }
    }

    // Validar orden si se proporciona
    if (update.order !== undefined) {
      if (!Number.isInteger(update.order)) {
        throw new Error('El orden debe ser un número entero');
      }
      if (update.order < 1) {
        throw new Error('El orden debe ser mayor o igual a 1');
      }
    }
  }

  // Helper para saber si es un solo item o array
  isSingle(): boolean {
    return !Array.isArray(this.data);
  }

  // Helper para obtener como array
  asArray(): SubtopicUpdate[] {
    return Array.isArray(this.data) ? this.data : [this.data];
  }
}

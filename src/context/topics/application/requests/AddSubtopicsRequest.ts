export interface SubtopicData {
  title: string;
  description: string;
  order?: number;
}

export class AddSubtopicsRequest {
  constructor(
    public readonly topicId: string,
    public readonly data: SubtopicData | SubtopicData[]
  ) {
    this.validate();
  }

  private validate(): void {
    // Validar topicId
    if (!this.topicId || this.topicId.trim().length === 0) {
      throw new Error('ID del tema es requerido');
    }

    // Normalizar data a array para validar
    const subtopics = this.asArray();

    if (subtopics.length === 0) {
      throw new Error('Debe proporcionar al menos un subtema');
    }

    // Validar cada subtopic
    for (const subtopic of subtopics) {
      this.validateSubtopic(subtopic);
    }
  }

  private validateSubtopic(subtopic: SubtopicData): void {
    // Validar título
    if (!subtopic.title || subtopic.title.trim().length === 0) {
      throw new Error('El título del subtema es requerido');
    }
    if (subtopic.title.trim().length < 3) {
      throw new Error('El título debe tener al menos 3 caracteres');
    }
    if (subtopic.title.trim().length > 200) {
      throw new Error('El título no puede exceder los 200 caracteres');
    }

    // Validar descripción
    if (!subtopic.description || subtopic.description.trim().length === 0) {
      throw new Error('La descripción del subtema es requerida');
    }
    if (subtopic.description.trim().length < 10) {
      throw new Error('La descripción debe tener al menos 10 caracteres');
    }
    if (subtopic.description.trim().length > 1000) {
      throw new Error('La descripción no puede exceder los 1000 caracteres');
    }

    // Validar orden si se proporciona
    if (subtopic.order !== undefined) {
      if (!Number.isInteger(subtopic.order)) {
        throw new Error('El orden debe ser un número entero');
      }
      if (subtopic.order < 1) {
        throw new Error('El orden debe ser mayor o igual a 1');
      }
    }
  }

  // Helper para saber si es un solo item o array
  isSingle(): boolean {
    return !Array.isArray(this.data);
  }

  // Helper para obtener como array
  asArray(): SubtopicData[] {
    return Array.isArray(this.data) ? this.data : [this.data];
  }
}

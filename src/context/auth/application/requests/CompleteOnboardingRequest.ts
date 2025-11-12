/**
 * Request para completar el proceso de onboarding de un nuevo usuario
 */
export class CompleteOnboardingRequest {
  constructor(
    public readonly userId: string,
    public readonly name: string,
    public readonly selectedCourseIds: string[]
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.userId || this.userId.trim() === '') {
      throw new Error('El ID de usuario es requerido');
    }

    if (!this.name || this.name.trim() === '') {
      throw new Error('El nombre es requerido');
    }

    if (this.name.length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }

    if (this.name.length > 100) {
      throw new Error('El nombre no puede exceder 100 caracteres');
    }

    if (!this.selectedCourseIds || !Array.isArray(this.selectedCourseIds)) {
      throw new Error('Los cursos seleccionados son requeridos');
    }

    if (this.selectedCourseIds.length === 0) {
      throw new Error('Debes seleccionar al menos un curso');
    }

    if (this.selectedCourseIds.length > 10) {
      throw new Error('No puedes seleccionar más de 10 cursos');
    }

    // Validar que no haya IDs duplicados
    const uniqueCourses = new Set(this.selectedCourseIds);
    if (uniqueCourses.size !== this.selectedCourseIds.length) {
      throw new Error('No puedes seleccionar el mismo curso múltiples veces');
    }

    // Validar que todos los IDs sean strings no vacíos
    for (const courseId of this.selectedCourseIds) {
      if (!courseId || typeof courseId !== 'string' || courseId.trim() === '') {
        throw new Error('Todos los IDs de curso deben ser válidos');
      }
    }
  }
}

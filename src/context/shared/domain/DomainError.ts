export class DomainError {
    constructor(
        public readonly title: string,
        public readonly detail: string,
        public readonly code: number,
    ) {
    }

    public toJSON() {
        return {
            title: this.title,
            detail: this.detail,
            code: this.code,
        }
    }
}
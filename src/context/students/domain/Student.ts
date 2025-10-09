import {uid} from 'uid';

export class Student {
  constructor(
    public readonly id: string,
    private name: string,
  ) {
  }

  static create({
    name
  }: Omit<StudentPrimitives, 'id'>) {
    return new Student(
      uid(), 
      name
    );
  }

  public update(data: Partial<StudentPrimitives>) {
    if (data.name) this.name = data.name;
  }

  public getName() {
    return this.name;
  }

  toPrimitives(): StudentPrimitives {
    return {
      id: this.id,
      name: this.name,
    };
  }
}

export type StudentPrimitives = {
  id: string;
  name: string;
}
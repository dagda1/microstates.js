import 'jest';
import { create } from 'microstates';

class Person {
  name = String;
};

it('has stable root state', () => {
  let person = create(Person, { name: 'Taras Mankovski' });
  expect(person.state).toBe(person.state);
});
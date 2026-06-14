import fs from 'fs';

const content = fs.readFileSync('c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\src\\pages\\pharmacy\\financial\\APPLAllocationPage.tsx', 'utf8');

const count = (char: string) => content.split(char).length - 1;

console.log('{ }', count('{'), count('}'));
console.log('( )', count('('), count(')'));
console.log('[ ]', count('['), count(']'));
console.log('< >', count('<'), count('>'));

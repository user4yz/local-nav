const { greet } = require('../dist/index');
test('greet returns correct message', () => {
 expect(greet('Tom')).toBe('Hello, Tom!');
});

import Variables from "../lib/Variables"

jest.mock('fs-sync')

const varsStr = `
FOO=123
ABC=456
PORT=$PORT
`


describe('variables test', () => {

    test('create env vars object list', () => {
      expect(new Variables({varsStr}).getObjList()).toMatchSnapshot()      
    })

    test('write var file', () => {
      new Variables({varsStr}).writeFile(`app-a/.env.tmp`)
      const variables = new Variables({file: "app-a/.env.tmp"})
      expect(new Variables({varsStr}).getObjList()).toEqual(variables.getObjList())
    })

    test('replace vars', () => {
      const expectedResult = new Variables({varsStr}).replaceVariables([
        {key: "PORT", value: "8080"},
        {key: "HOST", value: "meister1.com"}
      ]).getObjList()
      expect(expectedResult).toMatchSnapshot()
    })
})
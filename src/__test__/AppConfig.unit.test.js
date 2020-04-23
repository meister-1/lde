import AppConfig from "../lib/AppConfig"

const appsWithCustomValuesMock = [
    {
        name: "app-a",
        variables: `
FOO=123
ABC=456
`,
        ldeConfig: {
            domain: "www.lokalleads.de",
            port: 8000,
            volumes: "/foo:/bar"
        }
    }
]

const appsWithDefaultValuesMock = [
    {
        name: "app-a",
        variables: `
FOO=123
ABC=456
`,
        ldeConfig: {}
    }
]

describe('app config test', () => {
    test('create config with custom values', async () => {
      expect(await AppConfig.create(appsWithCustomValuesMock, {out: ""})).toMatchSnapshot()
    })

    test('create config with default values', async () => {
        expect(await AppConfig.create(appsWithDefaultValuesMock, {host: "app.com", out: ""})).toMatchSnapshot()
      })
})
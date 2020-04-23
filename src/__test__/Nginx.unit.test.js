import Nginx from "../lib/Nginx"

const mockOneApp = [{
    ip: "10.5.0.10",
    domain: "a.meister1.com",
    port: "8000",
    sourceDir: "out/a/src",
    name: "a",
    version: "latest",
    gitUrl: "git@bitbucket.org:lokalleads/a.git",
    volumes: ["maven-data:/.m2"]
}]

const mockMultiApp = [{
  ip: "10.5.0.10",
  domain: "a.meister1.com",
  port: "8000",
  sourceDir: "out/a/src",
  name: "a",
  certs: {
    crt: "wildcard-meister1.com.pem",
    key: "wildcard-meister1-key.com.pem"
  },
  version: "latest",
  gitUrl: "git@bitbucket.org:lokalleads/a.git",
  volumes: ["maven-data:/.m2"]
},
{
  ip: "10.5.0.11",
  domain: "b.meister1.com",
  port: "8001",
  sourceDir: "out/b/src",
  name: "b",
  version: "latest",
  gitUrl: "git@bitbucket.org:lokalleads/b.git",
  volumes: ["maven-data:/.m2"],
  variables: `PORT=8001\nFOO=ABC`
}]


describe('nginx test', () => {
    test('create server config with one app', () => {
      expect(new Nginx(mockOneApp).createConfig().getConfig()).toMatchSnapshot()
    })
    test('create server config with multi apps', () => {
      expect(new Nginx(mockMultiApp).createConfig().getConfig()).toMatchSnapshot()
    })
})
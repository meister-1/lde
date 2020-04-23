import DockerCompose from "../lib/DockerCompose"

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
  variables: `PORT=8001`
}]

describe('docker compose test', () => {
    test('create config yml with one app', () => {
      expect(new DockerCompose(mockOneApp).createConfig().getConfig()).toMatchSnapshot()
    })
    test('create config yml with multi apps', () => {
      expect(new DockerCompose(mockMultiApp).createConfig().getConfig()).toMatchSnapshot()
    })
})
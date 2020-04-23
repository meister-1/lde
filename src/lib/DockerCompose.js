import yml from "yaml"
import fs from "fs-sync"

export default class DockerCompose {

    constructor(apps, outPath) {
        this.apps = apps
        this.outPath = outPath
        this.config = DockerCompose.getDefaultConfig()
    }

    static getDefaultConfig() {
        const dockerComposeConfig = {
            "version": "3.6",
            "services": {
                "nginx": {
                    "image": "nginx:latest",
                    "ports": [ "80:80", "443:443"]
                }
            },
            "networks": {
                "llnet": {
                    "driver": "overlay",
                    "ipam": {
                        "config": [
                            {
                                "subnet": "10.5.0.0/24"
                            }
                        ]
                    }
                }
            },
            "volumes": {}
        }

        return dockerComposeConfig
    }  

    createConfig() {

        const dockerComposeConfig = DockerCompose.getDefaultConfig()

        const dockerServerConfigs = this.apps.map(({domain, name, port, ip, version, volumes, attributes, variables}) => {
            
            const serverConfig = {
                "name": name,
                "domain": domain,
                "config": {
                    "image": `${name}:${version}`,
                    "ports": [`${port}:${port}`],
                    "networks": {
                        "llnet": {
                            "ipv4_address": `${ip}`
                        }
                    }
                }
            }
    
            if(volumes) {
    
                serverConfig["config"]["volumes"] = volumes
    
                volumes.map((el) => {
                    const source = el.split(":")[0]
    
                    if(source.indexOf("/") == -1) {
                        dockerComposeConfig["volumes"][source] = {}
                    }
                })
                
            }
            
            if(attributes) {
            
                Object.keys(attributes).forEach(key => {
                    serverConfig["config"][key] = attributes[key]
                })

            }
            
            if (variables) {    
    
                serverConfig["config"]["env_file"] = [`${name}/.env.tmp`]           
    
            }
    
            
            return serverConfig
    
        })
    
        dockerComposeConfig.services["nginx"]["depends_on"] = dockerServerConfigs.map(element => element.name)
        dockerComposeConfig.services["nginx"]["networks"] = {
            llnet: {
                aliases: dockerServerConfigs.map(element => element.domain)
            }
        }
        
        dockerServerConfigs.forEach((element) => {
            dockerComposeConfig.services[element.name] = element.config    
        })
        
        this.config = dockerComposeConfig

        return this
    }

    getConfig() {
        return yml.stringify(this.config)
    }

    writeFile() {
        if(this.config) {

            fs.write(`${this.outPath}/docker-compose.yml`, this.getConfig(), function(err) {
                if(err) {
                    console.log(err)
                }
            })

        }
    }

    static readConfigFile(outPath) {
        // console.log(`${outPath}/docker-compose.yml`)
        const dockerCompose = fs.read(`${outPath}/docker-compose.yml`)
        const dockerComposeConfig = yml.parse(dockerCompose)
        const apps = []
        
        for (const name in dockerComposeConfig.services) {
            
            const path = `${outPath}/${name}/.env`
            
            if(fs.exists(path)) {
                console.log(path)
            }
            
            apps.push({
                name,
                port: dockerComposeConfig.services[name].ports[0],
                image: dockerComposeConfig.services[name].image,
                envVarFilePath: fs.exists(path) ? path : null
            })
        }
    
        return apps
    
    }
}
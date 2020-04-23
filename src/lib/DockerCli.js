import exec from "exec-sh"
import fs from "fs-sync"
import logSymbols from "log-symbols"
import readline from "readline"
import path from "path"

import Nginx from "./Nginx"
import DockerCompose from "./DockerCompose"
import Repository from "./Repository"
import AppConfig from "./AppConfig"
import Variables from "./Variables"

const isJson = (str) => {
    try 
    { 
        return JSON.stringify(str).startsWith("{")
    } catch(e) {
        return false
    }
}

export default class DockerCli {

    constructor(scriptName, config) {

        this.scriptName = scriptName
        this.config = config

    }

    run(outputPath) {
        switch (this.scriptName) {
            case "create":
                this.create(this.config)
                break
            case "build":
                this.create(this.config)
                break                
            case "init":
                this.init(outputPath)
                break
            case "start":
                this.restart(this.config)
                break
            case "restart":
                this.restart(this.config)
                break
            case "cleanup":
                this.cleanup()
                break
            default:
                console.log(logSymbols.error, `Sorry, '${this.scriptName}' is not a valid command. Try create, start, rebuild or cleanup`)
            }
    }

    async create({apps, templates, out, gitUrlPattern, certs, host}) {

        // console.log(logSymbols.info, `Copy resources from ${templates} to ${out}`)
        fs.copy(templates, out)

        const certPath = certs ? path.dirname(certs.crt) : null
        const certNginx = certs ? {
            crt: certs.crt.replace(new RegExp(certPath, 'g'), "").replace(/\//, ""),
            key: certs.key.replace(new RegExp(certPath, 'g'), "").replace(/\//, "")
        } : null

        if(certs) {
            fs.copy(certPath, `${out}/nginx/certs`)            
        }


        const appRepositoryConfigs = apps.map((app) => {
        
            if(isJson(app)) {
                const appConfig = JSON.parse(JSON.stringify(app))
                return {name: appConfig.name, branch: appConfig.branch ? appConfig.branch : "release", url: appConfig.gitUrl}
            } else {

                if(!gitUrlPattern) {
                    console.log(logSymbols.error, `gitUrlPattern is missing in your project config!`)
                    process.exit(1)
                }
                
                return {name: app, branch: "release", url: gitUrlPattern.replace(/\$appName/g, app)}
            }
            
        })
    
        const repository = new Repository(appRepositoryConfigs, out)
        await repository.checkoutAll()
        const appEnvConfigs = repository.getConfigs()
        const appConfigs = await AppConfig.create(appEnvConfigs, {certs: certNginx, host, out})
        
        console.log(logSymbols.info, `Creating nginx config: ${out}/nginx/default.conf`)
        new Nginx(appConfigs, out).createConfig().writeFile()

        console.log(logSymbols.info, `Creating docker-compose config: ${out}/docker-compose.yml`)
        new DockerCompose(appConfigs, out).createConfig().writeFile()

        console.log(logSymbols.success, "Congratulation! Run 'lde start <path>' to build and run apps.")
    
    }

    init(outputPathInitial) {
        // .lde.json
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })

        rl.question(`Name of your project? ${outputPathInitial}`, (outputPath) => {

            if(!outputPathInitial && !outputPath) {
                console.log(logSymbols.error, `project name missing`)
                process.exit(1)
            }

            if(outputPathInitial && !outputPath) {
                outputPath = outputPathInitial
            }

            
            rl.question('Which applications do you want to create (comma-separated)? ', (apps) => {
            
                if(!apps) {
                    console.log(logSymbols.error, `apps missing`)
                    process.exit(1)
                }

                const appsArr = apps.split(',').map(el => el.trim())
                
                rl.question('What is the GIT base url (eg. git@github.com:meister-1)? (OPTIONAL)', (gitBaseUrl) => {
            
                    rl.question('What is your host name? ', (host) => {

                        if(!host) {
                            console.log(logSymbols.error, `host missing`)
                            process.exit(1)
                        }
            
                        rl.question('Where are your certs (folder path) for this project? (OPTIONAL) ', (certs) => {
                
                            const certConfig = certs ? {"certs": {
                                "crt": "${certs}/wildcard-${host}.pem",
                                "key": "${certs}/wildcard-${host}-key.pem"
                            }} : {}
        
                            if(certs) {
                                console.log(logSymbols.info, `Expected cert file names: wildcard-${host}.pem, wildcard-${host}-key.pem`)
                            }
    
                            const command = {
                                "version": "1.0",
                                "apps": appsArr,
                                host,
                                ...certConfig
                            }

                            if(gitBaseUrl && gitBaseUrl.trim() !== "") {
                                command["gitUrlPattern"] = gitBaseUrl
                            }
        
                            const projectPath = `${path.resolve(outputPath)}`
        
                            if(!fs.exists(projectPath)) {
                                fs.mkdir(projectPath)
                            }
                            
                            fs.write(`${projectPath}/.lde.json`, JSON.stringify(command, null, 2), function(err) {
                                if(err) {
                                    console.log(err)
                                } else {
                                    console.log(logSymbols.info, `Write project config file: ${projectPath}/.lde.json`)
                                }
                            })
        
                            rl.close()
        
                        })
    
                    })

                })
                
            })
            
        })

    }

    cleanup() {

        const command = `    
            docker rmi $(docker images -q) --force \
            && docker system prune`
    
        exec(command, {}, function(err){
            if (err) {
                console.log("Exit code: ", err.code)
            }
        })  
    
    }

    restart({out, globalVars, host}) {
    
        const duckerBuildCommandList = DockerCompose.readConfigFile(out).map((app) => {
            const {name, port, image, envVarFilePath} = app
            const ports = port.split(":")

            if (envVarFilePath) {
                const vars = globalVars.concat([
                    {key: "PORT", value: ports.length > 1 ? ports[1] : port},
                    {key: "HOST", value: host}
                ])
                const variables = new Variables({file: envVarFilePath})
                variables.replaceVariables(vars)
                variables.writeFile(`${envVarFilePath}.tmp`)
            }
            
            return `docker build -t ${image} -f ${out}/${name}/Dockerfile ${out}/${name}`
    
        })

        const command = `
            pushd ${out} \
            && ${duckerBuildCommandList.join("\n")} \
            && docker swarm leave --force || /usr/bin/true \
            && docker swarm init \
            && docker-compose -f docker-compose.yml down \
            && yes | docker network prune \
            && docker-compose -f docker-compose.yml up --remove-orphans \
            && popd`

        exec(command, {}, function(err){
            if (err) {
                console.log("Exit code: ", err.code)
            }
        })   
    
    }
}
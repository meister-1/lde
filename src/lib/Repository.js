import git from "simple-git/promise"
import fs from "fs-sync"
import logSymbols from "log-symbols"

export default class Repository {

    constructor(apps, out) {
        this.apps = apps,
        this.out = out
    }

    async checkoutAll() {
        
        await Promise.all(this.apps.map(async ({name, branch, url}) => {

            const projectPath = `${this.out}/${name}`
            
            if (!fs.exists(projectPath)) {

                console.log(logSymbols.info, `Cloning GIT project: ${name}`)    
                await git(this.out).clone(url)
                await git(projectPath).checkout(branch)

            } else {

                console.log(logSymbols.warning, `GIT clone skipped. Project "${name}" already exists`)    

            }

        }))

        return this

    }

    getConfigs() {

        return this.apps.map(({name}) => {

            const envVarFilePath = `${this.out}/${name}/.env`
            const envVarFile = fs.exists(envVarFilePath) ? fs.read(envVarFilePath) : null
            
            const ldeConfigFilePath = `${this.out}/${name}/.lde.json`
            const ldeConfigFile = fs.exists(ldeConfigFilePath) ? fs.read(ldeConfigFilePath) : null

            return {
                name,
                variables: envVarFile,
                ldeConfig: ldeConfigFile ? JSON.parse(ldeConfigFile) : {}
            }

        })

    }
}
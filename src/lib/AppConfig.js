import os from "os"
import path from "path"
import fs from "fs-sync"
import logSymbols from "log-symbols"
import getUuid from "uuid-by-string"

export default class AppConfig {

    constructor(opts) {
        this.ip = opts.ip
        this.domain = opts.domain
        this.port = opts.port
        this.certs = opts.certs
        this.name = opts.name
        this.version = opts.version
        this.volumes = opts.volumes
        this.variables = opts.variables
        this.attributes = opts.attributes
    }

    static async create(apps, {certs, host, out}) {

        const globalLDEFilename = ".lde.json"

        const homeDir = os.homedir()
        const globalLDEFilepath = path.join(homeDir, `./${globalLDEFilename}`)
        const outPath = path.resolve(out)

        const versionPrefix = getUuid(outPath)
        
        let IPOffset = 11
        let IPCount = 19

        if(fs.exists(globalLDEFilepath)) {
            const globalLDEFile = fs.read(globalLDEFilepath)
            console.log(logSymbols.info, `Read global lde config: ${globalLDEFilepath}`)
            const globalLDEConfig = JSON.parse(globalLDEFile)
            
            Object.keys(globalLDEConfig).map((key) => {
                if(key === outPath) {
                    const ipRange = globalLDEConfig[key]["ip-range"] && globalLDEConfig[key]["ip-range"].trim()
                    
                    if(ipRange && ipRange !== "") {
                        const ipRangeParts = ipRange.split("-")

                        if(ipRangeParts.length > 1) {

                            console.log(logSymbols.info, `IP range for docker-compose network: 10.5.0.${ipRange}`)
                            IPOffset = Number.parseInt(ipRangeParts[0])
                            IPCount = Number.parseInt(ipRangeParts[1])

                        } else {
                            console.log(logSymbols.warning, `IP range for docker-compose network is not valid: ${ipRange}`)

                            // TODO console.log(logSymbols.warning, `New IP range calculated: ${ipRange}`)
                        }

                    }

                }
                
            })

        } else {
            const ipRange = `${IPOffset}-${IPOffset+apps.length}`
            fs.write(globalLDEFilepath, JSON.stringify({
                [outPath]: ipRange
            }, null, 2), function(err) {
                if(err) {
                    console.log(err)
                }

                console.log(logSymbols.info, `IP range for docker-compose network created: 10.5.0.${ipRange}`)
            })
        }
        
        if(IPOffset === 0) {
            console.log(logSymbols.error, `IP-Range 0-10 is reserved. Your IP-Range must be greater than 10`)
            process.exit(1)
        }

        let IP = IPOffset
        let appCount = 0
        
        const appConfigObjList = await Promise.all(apps.map(async ({name, variables, ldeConfig}, idx) => {
            
            const ip = `10.5.0.${IP}`
            const domain = ldeConfig.domain ? ldeConfig.domain : `${name}.${host}`
            const port = ldeConfig.port ? ldeConfig.port : `800${idx}`
            const version = `${versionPrefix}_latest`
            const volumes = ldeConfig.volumes ? ldeConfig.volumes : null
            const attributes = ldeConfig.attributes ? ldeConfig.attributes : null
            
            const config = new AppConfig({
                ip,
                domain,
                port,
                certs,
                name,
                version,
                volumes,
                variables,
                attributes
            })

            IP += 1
            appCount += 1
            
            return config
        }))

        if(appCount > IPCount) {
            console.log(logSymbols.error, `Max-App limit [${IPCount}] reached!`)
            process.exit(1)
        }

        return appConfigObjList
    
    }
}
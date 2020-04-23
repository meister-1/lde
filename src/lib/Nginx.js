import fs from "fs-sync"

export default class Nginx {

    constructor(apps, outPath) {
        this.apps = apps.map(el => {
           const ports = el.port.split(":")
           return {
               ...el,
               port: ports.length > 1 ? ports[1] : el.port
            }
        })
        this.outPath = outPath
        this.config = Nginx.getDefaultConfig()
    }

    static getDefaultConfig() {
        const defaultServerConfig = `server {
            listen       80;
            
            location / {
                return 301 https://$host$request_uri;
            }
        }`

        return defaultServerConfig
    } 

    createConfig() {
        
        const nginxServerConfigs = this.apps.map(({domain, port, ip, certs}) => {

            const listenConfig = certs ? `listen      443 ssl;
            ssl_certificate     /etc/nginx/${certs.crt};
            ssl_certificate_key /etc/nginx/${certs.key};` : "listen      80"

                return `server {
            ${listenConfig}
            server_name  ${domain};
        
            location / {
                proxy_pass "http://${ip}:${port}";
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
            }
        }`
        
        })
        
        this.config = `${Nginx.getDefaultConfig()}\n${nginxServerConfigs.join("\n")}\n`

        return this
        
    }

    getConfig() {
        return this.config
    }

    writeFile() {
        if(this.config) {
            fs.write(`${this.outPath}/nginx/default.conf`, this.getConfig(), function(err) {
                if(err) {
                    console.log(err)
                }
            })
        }
    }
}
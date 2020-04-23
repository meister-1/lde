import fs from "fs-sync"

export default class Variables {

    constructor(opts) {

        this.variables = []

        if(opts.file) {

            this.variables = fs.exists(opts.file) ? Variables.createObjList(fs.read(opts.file)) : []
            this.file = opts.file

        } else if (opts.vars) {

            this.variables = opts.vars ? opts.vars : []

        } else if (opts.varsStr) {

            this.variables = opts.varsStr ? Variables.createObjList(opts.varsStr) : []

        }

    }

    static createObjList(variableFile) {

        if(!variableFile) {
            return []
        }

        return variableFile.split("\n").map((varLine) => {
            const varParts = varLine.split("=")
    
            return {key: varParts[0].toUpperCase(), value: varParts[1]}
        }).filter(v => v.key !== undefined && v.key != "")
    
    }

    getObjList() {

        return this.variables
    
    }

    replaceVariables(vars) {

        if(!vars) {
            return this
        }

        this.variables = this.variables.map(({key, value}) => {
            let newValue = value
            vars.forEach(({key, value}) => {
                newValue = newValue.replace(new RegExp(`\\$${key}`, 'g'), value)
            })

            return {key, value: newValue}
        })

        return this

    }

    writeFile(fileName) {

        const varFile = this.variables.map(({key, value}) => `${key}=${value}`).join("\n")

        fs.write(fileName ? fileName : this.file, varFile, function(err) {
            if(err) {
                return console.log(err)
            }
        })
    }
}
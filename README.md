# lde

### "local docker environment" helps you to create a docker-compose environment for development.

## Migration 0.9 -> 1.0

lde config files
```
lde.json > .lde.json
```

env variable files
```
variables.env > .env
```


## Requirements

```
Node.js: > 8.x
iOS
```


## Step-by-Step

### Install lde

```
npm i lde -g
```

### SSL (optional)
To use SSL connections you have to create your certificates. You can do it by your own or by mkcert tool.

**mkcert (recommanded)** (https://github.com/FiloSottile/mkcert)

Install:
```
brew install mkcert
brew install nss
```

Create certs:
```
mkdir ~/ssl
cd ssl
mkcert "*.mydomain.com"
```

Check your cert config. Maybe you have to rename the file names!


### Create project config

You can use the init script or configure your project manually.

**Init function**

```
lde init
```

**Manual creation**

Create a folder which you want to use for your docker-compose environment.

```
mkdir <project-folder>
cd <project-folder>
```

Next, you need a config file in your project folder. 

```
nano .lde.json
```

Project file with one reposititory and name matching:
```javascript
{
    "version": "1.0",
    "apps": ["app1", "app2"],
    "gitUrlPattern": "git@bitbucket.org:myRepository/$appName.git",
    "certs": {
        "crt": "/path/to/certificate.pem",
        "key": "/path/to/certificate-key.pem",
    },
    "host": "mydomain.com"
}
```

Custom git repositories:
```javascript
{
    "version": "1.0",
    "apps": [
        {"name": "app1", "gitUrl": "git@bitbucket.org:myRepository1/app1.git"}
        {"name": "app2", "gitUrl": "git@bitbucket.org:myRepository2/app2.git"}
        ],
    "gitUrlPattern": "git@bitbucket.org:myRepository/$appName.git",
    "certs": {
        "crt": "/path/to/certificate.pem",
        "key": "/path/to/certificate-key.pem",
    },
    "host": "mydomain.com"
}
```

The name in "apps" is used for different tasks:

Where | What for
----- | --------
lde.json | "gitUrlPattern" will replace $appName 
nginx | domain mapping: $appName.mydomain.com 
docker-compose | image name: $appName:latest


You have to setup ssh-key authorization. Otherwise GIT commands wouldn't work.


### Create project environement

This will create the cluster configuration. This command must be run when an application is added or removed from the cluster.

*You need a git account with ssh key* alternatively clone your projects manually inside the project folder. application folder needs to match your application names. 

```
lde create <path>
```



### DNS

Add your domains to your /etc/hosts. You can use tools like Gas Mask (http://clockwise.ee/)

```
127.0.0.1	app1.mydomain.com
127.0.0.1	app2.mydomain.com

127.0.0.1	postgres
127.0.0.1	mongo
127.0.0.1	memcached
```

### ENV variables

To set environment variables for an application, you have to create a file named .env at the root level of the project. 

```
GATEWAY_XYZ=http://domain.com
PORT_XYZ=8080
```

**The values must be written without quotation marks.**

You can set globally variables and use them in a specific project. Create a .env file at root level of your lde and set some variables:

```
POSTGRES_URL=postgres://domain.com/abc
```

Now, use that variables in specific projects:

```
DATABASE_URL=$POSTGRES_URL
```


### Run docker-compose

```
lde start <path>
```



## Install
Easy to install the package with command (It requires NodeJS 8+):
```
npm install --save tomobridge-sdk
```

## How to use

```javascript
const BridgeJS = require('tomobridge-sdk')
const bridgejs = await BridgeJS.setProvider()

// get network information
let info = await BridgeJS.networkInformation()
console.log(info)

// wait for new deposit
let tokenSymbol = 'BTC'
bridgejs.wrapWatch({ tokenSymbol }).then((ev) => {
    ev.on('message', (data) => {
        console.log('new data', data)
    })
})
```

Read more [BridgeJS Document](https://tomochain.github.io/bridgejs/BridgeJS.html)

Or you can use `bridge-cli` binary:
```
cd /tmp && wget https://github.com/tomochain/bridgejs/releases/download/[VERSION]/bridge-cli.[VERSION].linux-x64 -O bridge-cli
chmod +x bridge-cli && sudo mv bridge-cli /usr/local/bin/
```
[Download Latest](https://github.com/tomochain/bridgejs/releases/latest)

## Command Line
You need to init enviroment or create `.env` file to setup `ENDPOINT` and `USER_PKEY` before using the tool.

```
./bridge-cli init
```
Or:

```
cp .env.example .env
```

Help:
```
./bridge-cli -h
Usage: bridge-cli [options] [command]

TomoChain CLI

Options:
  -V, --version               output the version number
  -C --config <path>          set config path. defaults to $HOME/.bridgejs
  -h, --help                  output usage information

Commands:
  init [options]              setup/init environment
  info                        show environment
  wrap-get-address [options]  get address for wrapping
  wrap-watch [options]        watch wrap
```

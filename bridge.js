
const ethers = require('ethers')
const request = require('request')
const urljoin = require('url-join');
const BigNumber = require('bignumber.js')
const WebSocket = require('ws')
const events = require('events')

const WrapperAbi = require('./abis/WrapperAbi.json')

let network = {}
const sleep = m => new Promise(res => setTimeout(res, m))

function string2bytes (str) {
    let byteArray = []
    for (let j = 0; j < str.length; j++) {
        byteArray.push(str.charCodeAt(j))
    }

    return byteArray
}

/**
 * The SDK works with TomoChain protocols
 * @constructor
 * @param {string} endpoint - The Url to the node
 * @param {string} pkey - The private key of the wallet
 */
class BridgeJS {

    constructor (config = {}) {
        this.endpoint = config.endpoint

        let pkey = config.pkey

        if (!pkey) {
            let randomWallet = ethers.Wallet.createRandom()
            pkey = randomWallet.privateKey
        }
        
        let rpcEndpoint = (config.blockchain || {}).rpc || 'https://rpc.tomochain.com'
        if (rpcEndpoint.endsWith('.ipc')) {
            this.provider = new ethers.providers.IpcProvider(rpcEndpoint)
        } else {
            this.provider = new ethers.providers.JsonRpcProvider(rpcEndpoint)
        }

        if (config.swapCoin) {
            const coin = {}
            config.swapCoin.forEach(c => {
                coin[c.name.toLowerCase()] = c
            })
            this.swapCoin = coin
        }
        this.wallet = new ethers.Wallet(pkey, this.provider)
        this.coinbase = this.wallet.address

    }

    /**
	 * Initial the SDK
	 * @param {string} endpoint - The Url to the node
	 * @param {string} pkey - The private key of the coinbase
	 */
    static setProvider(endpoint = 'https://bridge.tomochain.com', pkey = '') {
        return BridgeJS.networkInformation(endpoint).then((config) => {
            config.endpoint = endpoint
            config.pkey = pkey
            return new BridgeJS(config)
        }).catch((e) => {
            throw e
        })
    }

    static networkInformation (endpoint) {
        return new Promise(async (resolve, reject) => {

            try {
                let url = urljoin(endpoint || this.endpoint, 'api/config')
                let options = {
                    method: 'GET',
                    url: url,
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: {}
                }
                request(options, (error, response, body) => {
                    if (error) {
                        return reject(error)
                    }
                    if (response.statusCode !== 200 && response.statusCode !== 201) {
                        return reject(body)
                    }

                    return resolve(body)

                })
            } catch(e) {
                return reject(e)
            }
        })
    }
    /**
     * Get depositing address
     * @param {object} wrap - The wrap information
	 * @param {string} wrap.tokenSymbol - The token symbol
	 * @param {string} wrap.userAddress - The user address
     * 
     * @returns {Object} Depositing information object
     */
    async wrapGetAddress ({ tokenSymbol, userAddress = this.coinbase }) {
        return new Promise(async (resolve, reject) => {

            try {
                let url = urljoin(this.endpoint, 'api/wrap/getAddress')
                let body = {
                    receiveAddress: userAddress,
                    wrapCoin: tokenSymbol
                }
                let options = {
                    method: 'POST',
                    url: url,
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: body
                }
                request(options, (error, response, body) => {
                    if (error) {
                        return reject(error)
                    }
                    if (response.statusCode !== 200 && response.statusCode !== 201) {
                        return reject(body)
                    }

                    return resolve(body)

                })
            } catch(e) {
                return reject(e)
            }
        })
    }

    /**
     * Get latest deposit transaction
     * @param {Object} wrap The wrap information
     * @param {string} wrap.tokenSymbol - The token symbol
     * 
     * @returns {Object} Transaction object(inner and outter networks)
     */
    async getDepositTransaction ({ tokenSymbol }) {
        return new Promise((resolve, reject) => {
            try {
                let url = urljoin(this.endpoint, 'api/wrap/getTransaction/deposit/', tokenSymbol, this.coinbase)
                let options = {
                    method: 'GET',
                    url: url,
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: {}
                }
                request(options, (error, response, body) => {
                    if (error) {
                        return reject(error)
                    }
                    if (response.statusCode !== 200 && response.statusCode !== 201) {
                        return reject(body)
                    }

                    return resolve(body)

                })
            } catch(e) {
                return reject(e)
            }
        })
    }

    /**
     * Get latest withdraw transction
     * @param {Object} unwrap The unwrap information
     * @param {String} unwrap.tokenSymbol Token symbol
     * 
     * @returns {Object} Transaction object(inner and outter networks)
     */
    async getWithdrawTransaction ({ tokenSymbol }) {
        return new Promise((resolve, reject) => {
            try {
                let url = urljoin(this.endpoint, 'api/wrap/getTransaction/withdraw/', tokenSymbol, this.coinbase)
                let options = {
                    method: 'GET',
                    url: url,
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: {}
                }
                request(options, (error, response, body) => {
                    if (error) {
                        return reject(error)
                    }
                    if (response.statusCode !== 200 && response.statusCode !== 201) {
                        return reject(body)
                    }

                    return resolve(body)

                })
            } catch(e) {
                return reject(e)
            }
        })
    }

    /**
     * Watch depositing transaction
     * @param {Object} object Input object
     * @param {String} object.tokenSymbol Token symbol
     * 
     * @returns {Object} Transaction object(inner and outter networks)
     */
    async wrapWatch ({ tokenSymbol }) {
        return new Promise((resolve, reject) => {
            const ev = new events.EventEmitter()
            let tomojs = this

            function wait () {
                let it = setInterval(async () => {
                    try {
                        let data = await tomojs.getDepositTransaction({ tokenSymbol })
                        if (data && data.transaction) {
                            ev.emit('message', data.transaction)
                        }
                    } catch(e) {
                        clearInterval(it)
                        ev.emit('close')
                    }
                }, 2000)
            }

            ev.addListener('wait', wait)

            ev.on('close', () => { 
                resolve()
            })

            ev.on('open', () => {
                ev.emit('wait')
                resolve(ev)
            })

            ev.emit('open')

        })
    }

    /**
     * Watch withdrawal transaction
     * @param {Object} object Input object
     * @param {String} object.tokenSymbol Token symbol
     * 
     * @returns {Object} Transaction object(inner and outter networks)
     */
    async unwrapWatch ({ tokenSymbol }) {
        return new Promise((resolve, reject) => {
            const ev = new events.EventEmitter()
            let tomojs = this

            function wait () {
                let it = setInterval(async () => {
                    try {
                        let data = await tomojs.getWithdrawTransaction({ tokenSymbol })
                        if (data && data.transaction) {
                            ev.emit('message', data.transaction)
                        }
                    } catch(e) {
                        clearInterval(it)
                        ev.emit('close')
                    }
                }, 2000)
            }

            ev.addListener('wait', wait)

            ev.on('close', () => { 
                resolve()
            })

            ev.on('open', () => {
                ev.emit('wait')
                resolve(ev)
            })

            ev.emit('open')

        })
    }

    /**
     * Get depositing transactions
     * @param {Object} object Input object
     * @param {Number} object.limit Limit number of records per page
     * @param {Number} object.page Page number
     * 
     * @returns {Object} Transaction object(inner and outter networks)
     */
    async getWrapTransactions ({ limit, page }) {
        return new Promise((resolve, reject) => {
            try {
                let url = urljoin(
                    this.endpoint, 'api/transactions/getWrapTxs/',
                    `?address=${this.coinbase}`,
                    `&page=${page}`,
                    `&limit=${limit}`
                )
                let options = {
                    method: 'GET',
                    url: url,
                    json: true,
                    headers: {
                        'Accept': 'application/json',
                        'content-type': 'application/json'
                    },
                    body: {}
                }
                request(options, (error, response, body) => {
                    if (error) {
                        return reject(error)
                    }
                    if (response.statusCode !== 200 && response.statusCode !== 201) {
                        return reject(body)
                    }

                    return resolve(JSON.stringify(body, null, 2))

                })
            } catch(e) {
                return reject(e)
            }
        })
    }

    /**
     * Get withdrawal transactions
     * @param {Object} object Input object
     * @param {Number} object.limit Limit number of records per page
     * @param {Number} object.page Page number
     * 
     * @returns {Object} Transaction object(inner and outter networks)
     */
    async getUnwrapTransactions ({ tokenSymbol, limit, page }) {
        return new Promise((resolve, reject) => {
            try {
                let url = urljoin(
                    this.endpoint, 'api/transactions/getUnwrapTxs/',
                    `?address=${this.coinbase}`,
                    `&page=${page}`,
                    `&limit=${limit}`
                )
                let options = {
                    method: 'GET',
                    url: url,
                    json: true,
                    headers: {
                        'Accept': 'application/json',
                        'content-type': 'application/json'
                    },
                    body: {}
                }
                request(options, (error, response, body) => {
                    if (error) {
                        return reject(error)
                    }
                    if (response.statusCode !== 200 && response.statusCode !== 201) {
                        return reject(body)
                    }

                    return resolve(JSON.stringify(body, null, 2))

                })
            } catch(e) {
                return reject(e)
            }
        })
    }

    /**
     * Get depositing and withdrawal transactions filtering by tokenSymbol
     * @param {Object} object Input object
     * @param {String} object.tokenSymbol Token symbol
     * @param {Number} object.limit Limit number of records per page
     * @param {Number} object.page Page number
     * 
     * @returns {Object} Transaction object(inner and outter networks)
     */
    async getTransactions ({ tokenSymbol, limit, page }) {
        return new Promise((resolve, reject) => {
            try {
                let url = urljoin(
                    this.endpoint, 'api/transactions/',
                    `?coin=${tokenSymbol}`,
                    `&page=${page}`,
                    `&limit=${limit}`
                )
                let options = {
                    method: 'GET',
                    url: url,
                    json: true,
                    headers: {
                        'Accept': 'application/json',
                        'content-type': 'application/json'
                    },
                    body: {}
                }
                request(options, (error, response, body) => {
                    if (error) {
                        return reject(error)
                    }
                    if (response.statusCode !== 200 && response.statusCode !== 201) {
                        return reject(body)
                    }

                    return resolve(JSON.stringify(body, null, 2))

                })
            } catch(e) {
                return reject(e)
            }
        })
    }

    /**
	 * Unwrap TRC21 TOKEN
	 * @param {object} unwrap - The unwrap information
	 * @param {string} unwrap.tokenSymbol - The token symbol
	 * @param {string} unwrap.amount - The amount for unwrapping
	 * @param {string} unwrap.dest - The destination address
	 */
    async unwrap ({ tokenSymbol, amount, dest }) {
        try {
            const coin = this.swapCoin[tokenSymbol.toLowerCase()]
            const contract = new ethers.Contract(
                coin.wrapperAddress,
                WrapperAbi.abi,
                this.wallet
            )
            let txParams = {
                gasPrice: await this.provider.getGasPrice(),
                gasLimit: ethers.utils.hexlify(2000000),
                nonce: await this.provider.getTransactionCount(this.coinbase)
            }
            const withdrawAmountBN = new BigNumber(amount).multipliedBy(10 ** coin.decimals).toString(10)
            const result = await contract.functions.burn(
                withdrawAmountBN.toString(10),
                string2bytes(dest),
                txParams
            )
            let check = true, receipt
            console.log('Verify tx...')
            await sleep(5000)
            while (check) {
                receipt = await this.provider.getTransactionReceipt(result.hash || '')
                if (receipt.status) {
                    check = false
                } else {
                    check = false
                    throw new Error('Something went wrong \n txHash: ' + result.hash || '')
                }
            }
            return receipt
        } catch (error) {
            throw error    
        }
    }

}

module.exports = BridgeJS

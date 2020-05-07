
const ethers = require('ethers')
const request = require('request')
const urljoin = require('url-join');
const BigNumber = require('bignumber.js')
const WebSocket = require('ws')

const validatorAddress = '0x0000000000000000000000000000000000000088'

let network = {}

/**
 * The SDK works with TomoChain protocols
 * @constructor
 * @param {string} endpoint - The Url to the node
 * @param {string} pkey - The private key of the wallet
 */
class BridgeJS {
    constructor (
    ) { }

	/**
	 * Initial the SDK
	 * @param {string} endpoint - The Url to the node
	 */
    static setProvider(endpoint = 'https://bridge.tomochain.com') {

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
	 * Unwrap TRC21 TOKEN
	 * @param {object} unwrap - The unwrap information
	 * @param {string} unwrap.tokenAddress - The token address
	 * @param {string} unwrap.amount - The amount for unwrapping
	 * @param {string} unwrap.dest - The destination address
	 */
    async unwrap ({ tokenAddress, amount, dest }) {
        try {
            const voteAmountBN = new BigNumber(amount).multipliedBy(10 ** 18).toString(10)
            const nonce = this.provider.getTransactionCount(this.coinbase)
            const gasPrice = await this.provider.getGasPrice()

            let txParams = {
                value: ethers.utils.hexlify(ethers.utils.bigNumberify(voteAmountBN)),
                gasPrice: ethers.utils.hexlify(ethers.utils.bigNumberify(gasPrice)),
                gasLimit: ethers.utils.hexlify(this.gasLimit),
                chainId: this.chainId,
                nonce: await nonce
            }

            const result = await this.contract.functions.vote(node, txParams)
            return result
        } catch (error) {
            throw error
        }
    }

}

module.exports = BridgeJS

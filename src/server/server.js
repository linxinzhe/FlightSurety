import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';

import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];

let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

let registeredOracles = [];

// Oracle Initialization:Upon startup, 20+ oracles are registered and their assigned indexes are persisted in memory
web3.eth.getAccounts(async (error, accounts) => {

    flightSuretyApp.methods.REGISTRATION_FEE().call({from: accounts[0]}, async (error, result) => {
        let registrationFee = result.toString();

        //Register 20 oracles
        let oracle = [];
        let indexes = [];
        for (let i = 10; i < 40; i++) {
            let accountOra = accounts[i];
            await flightSuretyApp.methods
                .registerOracle().send({
                    from: accountOra,
                    value: registrationFee,
                    gas: 3000000
                }, async (error, result) => {
                    await flightSuretyApp.methods
                        .getMyIndexes()
                        .call({from: accountOra}, (error, result3) => {
                            indexes = result3;
                            oracle.push(accountOra);
                            oracle.push(indexes);
                            registeredOracles.push(oracle);
                            oracle = [];
                        });
                });
        }
    });

});

flightSuretyApp.events.OracleRequest({
    fromBlock: 0
}, function (error, event) {
    if (error) console.log(error);

    let statusCodes = [0, 10, 20, 30, 40, 50];
    //random choice code
    let statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];

});

const app = express();
app.get('/api', (req, res) => {
    res.send({
        message: 'An API for use with your Dapp!'
    });
});

export default app;



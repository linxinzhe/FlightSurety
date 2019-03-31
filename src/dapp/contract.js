import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts(async (error, accts) => {
            this.owner = accts[0];

            let fakeAirline = ['AAA', 'BBB', 'CCC', 'DDD'];
            let fakeFlight = ['AA111', 'BB222', 'CC333', 'DD444'];
            let fakeFlightOrigin = ['A1', 'B1', 'C1', 'D1'];
            let fakeFlightDest = ['A2', 'B2', 'C2', 'D2'];
            let fakeFlightTime = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM'];


            for (let i = 0; i < 4; i++) {
                this.airlines.push({address: accts[i], name: fakeAirline[i], fundBalance: 0});
            }
            this.registerAirlines(accts, (error, result) => {});


            for (let i = 0; i < 4; i++) {
                this.passengers.push(accts[i]);
            }

            callback();
        });
    }

    isOperational(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .isOperational()
            .call({from: self.owner}, callback);
    }

    async getContractBalance(callback) {
        let self = this;

        await self.flightSuretyApp.methods
            .getContractBalance()
            .call({from: self.owner}, callback);
    }

    async registerAirlines(accts, callback) {
        for (let i = 0; i < this.airlines.length; i++) {
            if (i === 0) {
                continue;
            }
            await this.flightSuretyApp.methods.registerAirline(accts[i + 1]).call({from: accts[1]}, callback);
        }
    }


    async fundAirline(airline, fundAmount, callback) {
        let self = this;
        let sendAmt = self.web3.utils.toWei(fundAmount, "ether").toString();

        await self.flightSuretyApp.methods
            .fundAirline(airline)
            .send({from: self.owner, value: sendAmt, gas: 3000000}, (error, result) => {
                if (error) {
                    console.log(error);
                } else {
                    let airlineName;
                    for (let i = 0; i < this.airlines.length; i++) {
                        if (self.airlines[i].address === airline) {
                            self.airlines[i].fundBalance += sendAmt;
                            airlineName = self.airlines[i].name;
                        }
                    }
                    callback(result, airlineName);
                }
            });
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        };
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }
}
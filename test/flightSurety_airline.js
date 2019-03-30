var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

    var config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        // await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

    it('(Airlines: Multiparty Consensus) Only existing airline may register a new airline until there are at least four airlines registered', async () => {

        // ARRANGE
        let airline2 = accounts[2];
        let airline3 = accounts[3];
        let airline4 = accounts[4];

        await config.flightSuretyApp.registerAirline(airline2, {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline(airline3, {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline(airline4, {from: config.firstAirline});

        let register1 = await config.flightSuretyData.isAirlineRegistered.call(config.firstAirline);
        let register2 = await config.flightSuretyData.isAirlineRegistered.call(airline2);
        let register3 = await config.flightSuretyData.isAirlineRegistered.call(airline3);
        let register4 = await config.flightSuretyData.isAirlineRegistered.call(airline4);

        // ASSERT
        assert.equal(register1, true, "airline1 register failed");
        assert.equal(register2, true, "airline2 register failed");
        assert.equal(register3, true, "airline3 register failed");
        assert.equal(register4, true, "airline3 register failed");

    });

    it('(Airlines: Multiparty Consensus) Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines', async () => {

        // ARRANGE
        let airline2 = accounts[2];
        let airline3 = accounts[3];
        let airline4 = accounts[4];

        let airline5 = accounts[5];

        await config.flightSuretyApp.registerAirline(airline5, {from: airline3});
        await config.flightSuretyApp.registerAirline(airline5, {from: airline2});

        let register2 = await config.flightSuretyData.isAirlineRegistered.call(airline2);
        let register3 = await config.flightSuretyData.isAirlineRegistered.call(airline3);
        let register4 = await config.flightSuretyData.isAirlineRegistered.call(airline4);
        let register5 = await config.flightSuretyData.isAirlineRegistered.call(airline5);

        // ASSERT
        assert.equal(register2, true, "register2 call failed");
        assert.equal(register3, true, "register3 call failed");
        assert.equal(register4, true, "register4 call failed");

        assert.equal(register5, true, "register5 call failed");
    });

    it('(Airline: Airline Ante) Airline can be registered, but does not participate in contract until it submits funding of 10 ether', async () => {

        // ARRANGE
        let newAirline = accounts[2];

        // ACT
        try {
            await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
        } catch (e) {

        }
        let registered = await config.flightSuretyData.isAirlineRegistered.call(newAirline);
        let funded = await config.flightSuretyData.isAirlineFunded.call(newAirline);

        // ASSERT
        assert.equal(registered === true && funded === false, true, "Airline can be registered, but does not participate in contract until it submits funding of 10 ether");

    });

});

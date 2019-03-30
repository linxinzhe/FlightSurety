var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

    var config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        // await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

    /****************************************************************************************/
    /* Operations and Settings                                                              */
    /****************************************************************************************/

    it(`(multiparty) has correct initial isOperational() value`, async function () {

        // Get operating status
        let status = await config.flightSuretyData.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");

    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

        // Ensure that access is denied for non-Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false, {from: config.testAddresses[2]});
        } catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

        // Ensure that access is allowed for Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false);
        } catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

    });

    it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

        await config.flightSuretyData.setOperatingStatus(false);

        let reverted = false;
        try {
            await config.flightSurety.setTestingMode(true);
        } catch (e) {
            reverted = true;
        }
        assert.equal(reverted, true, "Access not blocked for requireIsOperational");

        // Set it back for other tests to work
        await config.flightSuretyData.setOperatingStatus(true);

    });

    it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

        // ARRANGE
        let newAirline = accounts[2];

        // ACT
        try {
            await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
        } catch (e) {

        }
        let result = await config.flightSuretyData.isAirlineFunded.call(newAirline);

        // ASSERT
        assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

    });

    it('(Airlines Multiparty Consensus) Only existing airline may register a new airline until there are at least four airlines registered', async () => {

        // ARRANGE
        let airline2 = accounts[2];
        let airline3 = accounts[3];

        //TODO: funded

        await config.flightSuretyApp.registerAirline(airline2, {from: config.owner});
        await config.flightSuretyApp.registerAirline(airline3, {from: config.owner});

        let register2 = await config.flightSuretyData.isAirlineRegistered.call(airline2);
        let register3 = await config.flightSuretyData.isAirlineRegistered.call(airline3);

        // ASSERT
        assert.equal(register2, true, "Multi-party call failed");
        assert.equal(register3, true, "Multi-party call failed");

    });

    it('(Airlines Multiparty Consensus) Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines', async () => {

        // ARRANGE
        let airline2 = accounts[2];
        let airline3 = accounts[3];
        let airline4 = accounts[4];

        let airline5 = accounts[5];

        //TODO: funded

        await config.flightSuretyApp.registerAirline(airline2, {from: config.owner});
        await config.flightSuretyApp.registerAirline(airline3, {from: config.owner});
        await config.flightSuretyApp.registerAirline(airline4, {from: config.owner});

        await config.flightSuretyApp.registerAirline(airline5, {from: config.owner});


        let register2 = await config.flightSuretyData.isAirlineRegistered.call(airline2);
        let register3 = await config.flightSuretyData.isAirlineRegistered.call(airline3);
        let register4 = await config.flightSuretyData.isAirlineRegistered.call(airline4);


        //check

        // ASSERT
        assert.equal(register2, true, "Multi-party call failed");
        assert.equal(register3, true, "Multi-party call failed");

    });

});

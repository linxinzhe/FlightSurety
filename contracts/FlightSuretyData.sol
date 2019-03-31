pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    uint256 private contractBalance = 0 ether;

    // Airlines
    struct Airline {
        bool registered;
        uint256 fundBalance;
    }

    mapping(address => Airline) private airlines;
    address[] private registeredAirlines;
    uint256 public constant REGISTRATION_FEE_AIRLINES = 10 ether;


    struct Passenger {   //Passenger Struct
        bool isInsured;
        bool[] isPaid;
        uint256[] insurancePaid;
        string[] flights;
    }

    //Passenger mapping
    mapping(address => Passenger) public insurancePassengers;

    //Flight mapping Passenger
    mapping(string => address[]) private flightPassengers;

    //Flight mapping Amount
    mapping(string => uint256) private flightInsuranceTotalAmount;

    //Passenger address to insurance payment. Stores Insurance payouts for passengers
    mapping(address => uint256) private insurancePayment;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor(address _airline) public
    {
        contractOwner = msg.sender;
        initialFirstAirline(_airline);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;
        // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational() public view returns (bool)
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus(bool mode) external requireContractOwner
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/
    function getContractBalance() external view requireIsOperational returns(uint256 balance)
    {
        return contractBalance;
    }

    function getAirlineFund(address _airline) external view requireIsOperational returns(uint256 balance)
    {
        return airlines[_airline].fundBalance;
    }

    function initialFirstAirline(address _airline) internal requireIsOperational{
        airlines[_airline] = Airline({registered : true, fundBalance : 0});
        registeredAirlines.push(_airline);
    }
    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(address _airline) external requireIsOperational
    {
        airlines[_airline] = Airline({registered : true, fundBalance : 0});
        registeredAirlines.push(_airline);
    }

    function isAirlineRegistered(address _airline) view requireIsOperational returns (bool success) {
        return airlines[_airline].registered;
    }

    function isAirlineFunded(address _airline) view requireIsOperational returns (bool success) {
        return airlines[_airline].fundBalance >= REGISTRATION_FEE_AIRLINES;
    }

    function getAirlineNum() view requireIsOperational returns (uint num){
        return registeredAirlines.length;
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy(string memory _flight,uint256 _time,address _passenger,address _sender,uint256 _amount) public requireIsOperational
    {
        string[] memory _flights = new string[](5);
        bool[] memory paid = new bool[](5);
        uint256[] memory insurance = new uint[](5);
        uint index;

        if(insurancePassengers[_passenger].isInsured == true){
            index = getFlightIndex(_passenger, _flight) ;

            require(index == 0, "Passenger don't insure the same flight");

            //otherwise input another insurance
            insurancePassengers[_passenger].isPaid.push(false);
            insurancePassengers[_passenger].insurancePaid.push(_amount);
            insurancePassengers[_passenger].flights.push(_flight);

        }else {
            // initial insurance
            paid[0] = false;
            insurance[0] = _amount;
            _flights[0] = _flight;
            insurancePassengers[_passenger] = Passenger({isInsured: true, isPaid: paid, insurancePaid: insurance, flights: _flights});
        }

        // insurance amount cal
        contractBalance = contractBalance.add(_amount);
        flightPassengers[_flight].push(_passenger);
        flightInsuranceTotalAmount[_flight] = flightInsuranceTotalAmount[_flight].add(_amount);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(string _flight)external requireIsOperational
    {
        address[] memory passengers = new address[](flightPassengers[_flight].length);
        uint index;
        uint amount = 0;
        passengers = flightPassengers[_flight];

        for(uint i = 0; i < passengers.length; i++){
            index = getFlightIndex(passengers[i], _flight) - 1;
            if(insurancePassengers[passengers[i]].isPaid[index] == false){
                insurancePassengers[passengers[i]].isPaid[index] = true;
                amount = (insurancePassengers[passengers[i]].insurancePaid[index]).mul(15).div(10);
                insurancePayment[passengers[i]] = insurancePayment[passengers[i]].add(amount);
            }
        }
    }

    function getPassengersInsured(string flight) external requireIsOperational returns(address[] passengers)
    {
        return flightPassengers[flight];
    }

    function getInsuredAmount(string  flight,address passenger) external requireIsOperational returns(uint amount)
    {
        amount = 0;
        uint index = getFlightIndex(passenger, flight) - 1;
        if(insurancePassengers[passenger].isPaid[index] == false)
        {
            amount = insurancePassengers[passenger].insurancePaid[index];
        }
        return amount;
    }

    function setInsuredAmount(string  flight,address passenger,uint amount) external requireIsOperational
    {
        uint index = getFlightIndex(passenger, flight) - 1;
        insurancePassengers[passenger].isPaid[index] = true;
        insurancePayment[passenger] = insurancePayment[passenger].add(amount);
    }

    function withdraw(address payee) external payable requireIsOperational
    {
        require(insurancePayment[payee] > 0, "There is no payout.");
        uint amount  = insurancePayment[payee];
        insurancePayment[payee] = 0;
        contractBalance = contractBalance.sub(amount);
        payee.send(amount);
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund(uint256 fundAmt, address sender) public payable requireIsOperational
    {
        airlines[sender].fundBalance = airlines[sender].fundBalance.add(fundAmt);
        contractBalance = contractBalance.add(fundAmt);
    }

    function getFlightKey(address airline,string memory flight,uint256 timestamp) pure internal returns (bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function getFlightIndex(address _passenger, string memory _flight) public view returns(uint index)
    {
        string[] memory flights = new string[](5);
        flights = insurancePassengers[_passenger].flights;

        for(uint i = 0; i < flights.length; i++){
            if(uint(keccak256(abi.encodePacked(flights[i]))) == uint(keccak256(abi.encodePacked(_flight)))) {
                return(i + 1);
            }
        }

        return(0);
    }

    function getPassengerCredits(address passenger)external view requireIsOperational returns(uint256 amount)
    {
        return insurancePayment[passenger];
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable
    {
        contractBalance = contractBalance.add(msg.value);
    }


}


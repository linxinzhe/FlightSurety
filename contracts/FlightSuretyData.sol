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
    mapping(address => Passenger) public InsuredPassengers; //Passenger mapping

    //Flight mapping Passenger
    mapping(string => address[]) private FlightPassengers;

    //Flight to totalInsured Amount mapping e.g. UA047 => 5 ETH
    mapping(string => uint256) private FlightInsuredAmount;

    //Passenger address to insurance payment. Stores Insurance payouts for passengers
    mapping(address => uint256) private InsurancePayment;

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
    function buy()external payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees()external pure
    {
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay() external pure
    {
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

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable
    {
        contractBalance = contractBalance.add(msg.value);
    }


}


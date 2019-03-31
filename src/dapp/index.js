import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async () => {
    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            displayOpeartionalStatus('Operational Status', 'Check if contract is operational', [{
                label: 'Operational Status',
                error: error,
                value: result
            }]);
        });

        async function getBalance() {
            await contract.getContractBalance((error, result) => {
                displayContractBal('Contract Balance:', result);
            })
        }

        getBalance();

        populateSelect("airline", contract.airlines, 1);

        DOM.elid('fund').addEventListener('click', () => {
            let airline = DOM.elid('airline1').value;
            let fundAmount = DOM.elid('fundAmount').value;
            // Write transaction
            if (fundAmount > 0) {
                contract.fundAirline(airline, fundAmount, (tx, result) => {
                    displayFund('Airline funding', [{
                        label: 'Funding status : ',
                        TXid: tx,
                        airline: result,
                        amount: fundAmount
                    }]);
                    getBalance();
                });
            } else {
                alert("Airlines need to pay >0 ETH.");
            }
        });

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [{
                    label: 'Fetch Flight Status',
                    error: error,
                    value: result.flight + ' ' + result.timestamp
                }]);
            });
        })

    });


})();

function populateSelect(type, selectOpts, el) {
    let select = DOM.elid(type + el);
    selectOpts.forEach(opt => {
        if (type === 'airline') {
            select.appendChild(DOM.option({value: opt.address}, opt.name));
        } else if (type === 'flights') {
            select.appendChild(DOM.option({value: opt.flightNumber}, opt.name));
        }
    });
}

function displayContractBal(description, balance) {
    let displayDiv = DOM.elid("display-contract-balance");
    displayDiv.innerHTML = "";
    let section = DOM.section();
    section.appendChild(DOM.h5(description));
    section.appendChild(DOM.div({className: 'col-sm-8 field-value'}, balance));
    displayDiv.append(section);
}

function displayFund(title, results) {
    let displayDiv = DOM.elid("display-wrapper-funding-status");
    let section = DOM.section();
    section.appendChild(DOM.h5(title));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className: 'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, String(result.airline) + " Funded."));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.TXid ? ("TX Id : " + String(result.TXid)) : ("Funded : TX: " + String(result.airline))));
        section.appendChild(row);
    });
    displayDiv.append(section);
}

function displayOpeartionalStatus(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper-operational-status");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className: 'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    });
    displayDiv.append(section);

}








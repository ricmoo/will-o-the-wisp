Wisp Springboard
================

Tired of the init code safely preventing you from having contract code
addresses collide during deployment?

It is only active when no one can look at it.

Idea
----

Create a *Springboard Contract*, which will facilitate using CREATE2 to
create an on-chain Wallet Contract, which, outside of its own transactions,
has no code on-chain.


Features
--------

- Always costs 21000 gas to send to
- No multi-sig code to be hacked
- Atomically execute an arbitrary number of transactions
- Multi-party atomic and consistent execution of an arbitrary number of transactions


Command Line Interface
----------------------

```
Usage
    wisp [ OPTIONS ] info [ ADDRESS ] [ --name ENS_NAME ]
    wisp [ OPTIONS ] execute FILENAME [ --name ENS_NAME ]

Commands
    info                       Show the Wisp address for the ADDRESS or ENS Name
    execute                    Compile and execute the Wisp file in the Wisp Contract   

Options

    --network NETWORK          Which network to connect to

    --account FILENAME         Use a JSON Wallet as the account
    --account KEY              Use a private key as the account
    --account MNEMONIC         Use a mnemonic backup seed phrase as the account

    --value ETHER              Send ETHER to the Wisp from the EOA
```


Springboard Contract Interface
------------------------------

The Springboard contract is responsible for creating (and re-creating) the ephemeral
Wisp contract, which self-destructs at the end of its execution.

And ether passed to `execute` or `executeNamed` is immediately passed along to the
Wisp as an endowment, so using `this.balance` can be used within the Wisp Contract
execute.

```
// Executes a transaction using an EOA
function execute(bytes bytecode) payable;

// Executes a transaction that is managed by an ENS Name
function executeNamed(bytes32 nodehash, bytes bytecode) payable;
```


Wisp Template
-------------

```
///////////////////////
// Put Interfaces here

interface ERC20 {
    function transfer(address to, uint256 amount) external;
}

contract Wisp {

    ///////////////////////
    // Put Events here

    event TestEvent(string);


    ///////////////////////
    // Put Transaction operations here

    function execute() public {

        // Emit events...
        emit TestEvent("Hello World! From a Wisp!");

        // Call external contracts...
        ERC20(someErc20ContractAddress).transfer(toAddress, amount);

        // Transfer ether... (requires --value to wisp CLI or for
        // the Wisp to have received funds)
        someAddress.transfer(0.01 ether);
    }



    ///////////////////////
    // Do NOT use a constructor, it is dropped and not run

    // Do NOT modify below here; there will eventually not be
    // necessary as the bootstrap will include them.

    function die(address sender) public {
        // @TODO: Make sure the Springboard called this and no-one else
        selfdestruct(address(uint160(sender)));
    }

    function () external payable { }
}
```

///////////////////////
// Put Interfaces here

interface ERC20 {
    function transfer(address to, uint256 amount) external;
}

contract Wisp {

    ///////////////////////
    // Put Events here

    event Testing(string);


    ///////////////////////
    // Put Transaction operations here

    function execute() public {


        emit Testing("Hello ENS World");
        (0x30bc5920A76B483080523482D7FC2B64c9D5bd80).transfer(0.01 ether);

    }



    ///////////////////////
    // Do NOT use a constructor, it is dropped and not run


    ////////////////////////
    // Eventually these will be built into the bootstrap

    function die(address sender) public {
        selfdestruct(address(uint160(sender)));
    }

    function () external payable { }
}


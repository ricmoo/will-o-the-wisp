interface ERC20 {
    function transfer(address to, uint256 amount) external;
}

contract Wisp {

    event TestEvent(string);

    function execute() public {

        emit TestEvent("Hello World");
        (0x30bc5920A76B483080523482D7FC2B64c9D5bd80).transfer(0.01 ether);
    }


    // Boiler-plate; going away in the future

    function die(address sender) public {
        selfdestruct(address(uint160(sender)));
    }

    function () external payable { }
}


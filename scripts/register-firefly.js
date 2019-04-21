"use strict";

// Quick script to register Firefly ENS names on Ropsten.

let abi = [
    "function register(string label) payable"
];

let contract = new Contract("registrar.firefly.eth", abi, accounts[0]);
(async function() {
    let tx = await contract.register("wisp", {
        value: parseEther("0.1")
    });

    console.log(tx);

    let receipt = await tx.wait();

    console.log(receipt);
})();

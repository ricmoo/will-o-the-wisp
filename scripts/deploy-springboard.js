"use strict";

const fs = require("fs");
const {resolve } = require("path");

const { compile } = require("@ethersproject/cli/solc");
const { ethers } = require("ethers");

function assemble(ASM) {
    let opcodes = [];
    ASM.split("\n").filter((l) => (l.substring(0, 1) !== ";" && l.trim() !== "")).forEach((line) => {
        line.split(" ").forEach((opcode) => {
            opcodes.push(opcode);
        });
    });
    return ethers.utils.hexlify(ethers.utils.concat(opcodes));
}


let BootstrapAsm = `

; sighash("getPendingRuntimeCode()") => 0x94198df1

; mstore(0x00, 0x94198df1) (sighash("getPendingRuntimeCode()"))
0x63
0x94198df1

0x60
0x00

0x52

; push 0x03ff (returnLength)
0x61
0x03ff

; push 0x20 (returnOffset)
0x60
0x20

; push 0x04 (argsLength)
0x60
0x04

; push 0x1c (argsOffset)
0x60
0x1c

; caller (address)
0x33

; gas
0x5a

; staticcall(gas, addr, argsOffset, argsLength, returnOffset, returnLength);
0xfa


; mload(0x40) (return length)
0x60
0x40

0x51

; push 0x60 (0x20 + 0x20 + 0x20) (return offset);
0x60
0x60

; return
0xf3
`;


let bootstrap = assemble(BootstrapAsm);

console.log(bootstrap);

(async function() {
    try {
        let code = compile(fs.readFileSync("./contracts/Springboard.sol").toString(), {
            optimize: true
        }).filter((c) => (c.name === "Springboard"))[0];

        let factory = new ContractFactory(code.interface, code.bytecode, accounts[0]);

        let network = await provider.getNetwork();

        let contract = await factory.deploy(network.ensAddress, bootstrap)
        console.log(contract);

        let receipt = contract.deployed();
        console.log(receipt);
    } catch (error) {
        console.log(error);
    }
})();

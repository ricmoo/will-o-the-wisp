#!/usr/bin/env node

"use strict";

const fs = require("fs");
const { resolve } = require("path");
const { inherits } = require("util");

const { ethers } = require("ethers");
const { CLI, dump, Plugin } = require("@ethersproject/cli/cli");
const { compile } = require("@ethersproject/cli/solc");


const Springboard = "0xa37Cb4dE1bAEA4aC91106877a017C7C34B634413";
const ABI = [
    "function execute(bytes runtimeCode) public payable",
    "function executeNamed(bytes32 nodehash, bytes runtimeCode) public payable",
    "function getWispAddress(address addr) view returns (address wisp)",
    "function getWispNamedAddress(bytes32 nodehash) view returns (address wisp)",
    "event Deployed(address addr)"
];


let cli = new CLI();


function InfoPlugin() { }
inherits(InfoPlugin, Plugin);

InfoPlugin.prototype.getHelp = function() {
    return {
        name: "info [ ADDRESS ]",
        help: "Show the Wisp address"
    }
};

InfoPlugin.prototype.getOptionHelp = function() {
    return [
        {
            name: "[ --name ENS_NAME ]",
            help: "Use the Wisp for ENS_NAME"
        }
    ];
};

InfoPlugin.prototype.prepareOptions = async function(argParser) {
    await Plugin.prototype.prepareOptions.call(this, argParser);
    this.ensName = argParser.consumeOption("name");
}

InfoPlugin.prototype.prepareArgs = async function(args) {
    await Plugin.prototype.prepareArgs.call(this, args);
    if (this.ensName == null) {
        if (args.length > 1) {
            this.throwUsageError("info requiers at most 1 ADDRESS");
        } else if (args.length === 1) {
            this.address = args[0];
        } else {
            if (this.accounts.length !== 1) {
                this.throwError("missing account");
            }
            this.address = await this.accounts[0].getAddress();
        }
    }
}

InfoPlugin.prototype.run = async function(a) {
    await Plugin.prototype.run.call(this);

    let contract = new ethers.Contract(Springboard, ABI, this.provider);

    if (this.ensName) {
        dump("ENS Name: " + this.ensName, {
            "Wisp Address": await contract.getWispNamedAddress(ethers.utils.namehash(this.ensName))
        });
    } else {
        dump("Address: " + this.address, {
            "Wisp Address": await contract.getWispAddress(this.address)
        });
    }
}


cli.addPlugin("info", InfoPlugin);


function ExecutePlugin() { }
inherits(ExecutePlugin, Plugin);

ExecutePlugin.prototype.getHelp = function() {
    return {
        name: "execute FILENAME",
        help: "execute a Wisp contract"
    }
};

ExecutePlugin.prototype.getOptionHelp = function() {
    return [
        {
            name: "[ --name ENS_NAME ]",
            help: "Use the Wisp for ENS_NAME"
        }
    ];
};

ExecutePlugin.prototype.prepareOptions = async function(argParser) {
    await Plugin.prototype.prepareOptions.call(this, argParser);
    this.ensName = argParser.consumeOption("name");
}

ExecutePlugin.prototype.prepareArgs = async function(args) {
    await Plugin.prototype.prepareArgs.call(this, args);

    if (args.length !== 1) {
        this.throwUsageError("execute requires exactly FILENAME");
    }
    this.filename = args[0];

    if (this.accounts.length !== 1) {
        this.throwError("execute requires exactly 1 account");
    }

    if (this.ensName == null) {
        this.address = await this.accounts[0].getAddress();
    }
}

ExecutePlugin.prototype.run = async function(a) {
    await Plugin.prototype.run.call(this);

    let source = null;
    try {
        source = fs.readFileSync(resolve(this.filename)).toString();
    } catch (error) {
        this.throwError("Could not read Wisp.");
    }

    let code = null;
    try {
        let codes = compile(source, { optimize: true });
        code = codes.filter((c) => (c.name === "Wisp"))[0];
    } catch (error) {
        console.log(error);
        this.throwError("Wisp syntax errors");
    }

    if (!code) {
        this.throwError("No Wisp found.");
    }

    let contract = new ethers.Contract(Springboard, ABI, this.accounts[0]);

    let overrides = {
        gasLimit: 1000000,
        value: this.value
    };

    let tx = null;
    if (this.ensName) {
        tx = await contract.executeNamed(ethers.utils.namehash(this.ensName), code.runtime, overrides);
    } else {
        tx = await contract.execute(code.runtime, overrides);
    }
}


cli.addPlugin("execute", ExecutePlugin);

/*
function PreparePlugin() { }
inherits(PreparePlugin, Plugin);

PreparePlugin.prototype.getHelp = function() {
    return {
        name: "prepare FILENAME",
        help: "preapre a Wisp transaction"
    }
};

PreparePlugin.prototype.getOptionHelp = function() {
    return [
        {
            name: "[ --name ENS_NAME ]",
            help: "Use the Wisp for ENS_NAME"
        }
    ];
};

PreparePlugin.prototype.prepareOptions = async function(argParser) {
    await Plugin.prototype.prepareOptions.call(this, argParser);
    this.ensName = argParser.consumeOption("name");
}

PreparePlugin.prototype.prepareArgs = async function(args) {
    await Plugin.prototype.prepareArgs.call(this, args);

    if (args.length !== 1) {
        this.throwUsageError("prepare requires exactly FILENAME");
    }
    this.filename = args[0];

    if (this.accounts.length !== 1) {
        this.throwError("prepare requires exactly 1 account");
    }

    if (this.ensName == null) {
        this.address = await this.accounts[0].getAddress();
    }
}

PreparePlugin.prototype.run = async function(a) {
    await Plugin.prototype.run.call(this);

    let source = null;
    try {
        source = fs.readFileSync(resolve(this.filename)).toString();
    } catch (error) {
        this.throwError("Could not read Wisp.");
    }

    let code = null;
    try {
        let codes = compile(source, { optimize: true });
        code = codes.filter((c) => (c.name === "Wisp"))[0];
    } catch (error) {
        console.log(error);
        this.throwError("Wisp syntax errors");
    }

    if (!code) {
        this.throwError("No Wisp found.");
    }

    let struct = [ code.runtime, ethers.constants.AddressZero, ethers.constants.HashZero, false ];
    if (this.ensName != null) {
        struct[2] = ethers.utils.namehahs(this.ensName);
        struct[3] = true;
    } else {
        struct[1] = this.address;
    }

    let wispTx = ethers.utils.defaultAbiCoder.encode([ "tuple(bytes, address, bytes32, bool)" ], [ struct ] );

    let prepared = ethers.utils.RLP.encode([ "0x01", wispTx ]);

    console.log(prepared);
}


cli.addPlugin("prepare", PreparePlugin);
*/

cli.run(process.argv.slice(2));

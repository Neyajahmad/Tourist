// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Identity {
    struct Tourist {
        string name;
        string passportHash; // Hash of passport/ID
        bool isVerified;
        address walletAddress;
    }

    mapping(address => Tourist) public tourists;
    mapping(string => bool) public passportUsed;
    
    event TouristRegistered(address indexed wallet, string name);
    event IncidentLogged(address indexed wallet, string details, uint256 timestamp);

    function registerTourist(string memory _name, string memory _passportHash) public {
        require(bytes(tourists[msg.sender].name).length == 0, "Already registered");
        require(!passportUsed[_passportHash], "Passport already used");

        tourists[msg.sender] = Tourist(_name, _passportHash, true, msg.sender);
        passportUsed[_passportHash] = true;

        emit TouristRegistered(msg.sender, _name);
    }

    function verifyTourist(address _tourist) public view returns (bool, string memory) {
        return (tourists[_tourist].isVerified, tourists[_tourist].name);
    }

    function logIncident(string memory _details) public {
        require(tourists[msg.sender].isVerified, "Not a registered tourist");
        emit IncidentLogged(msg.sender, _details, block.timestamp);
    }
}

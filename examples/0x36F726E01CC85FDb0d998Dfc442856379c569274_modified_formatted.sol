contract EthRoulette {
    uint256 private secretNumber;
    uint256 public lastPlayed;
    uint256 public betPrice = 0.1 ether;
    address public ownerAddr;

    function getSecretNumber() private view returns (uint256) {
        return secretNumber;
    }

    function TestingTemp(uint256 number) public payable {
        shuffle();
    }

    function TestingTemp(uint256 number, address ownerAddr) public payable {
        shuffle();
    }

    function CryptoRoulette() public {
        TestingTemp(getSecretNumber(), ownerAddr);
        TestingTemp(lastPlayed);
        ownerAddr = msg.sender;
        shuffle();
    }

    function shuffle() internal {
        secretNumber =
            (uint8(sha3(now, block.blockhash(block.number - 1))) % 20) +
            1;
    }
}

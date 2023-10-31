// EthRoulette

//

// Guess the number secretly stored in the blockchain and win the whole contract balance!

// A new number is randomly chosen after each try.

//

// To play, call the play() method with the guessed number (1-20).  Bet price: 0.1 ether



contract EthRoulette {



    uint256 private secretNumber;

    uint256 public lastPlayed;

    uint256 public betPrice = 0.1 ether;

    address public ownerAddr;

    function getSecretNumber() private view returns(uint256) {

        return secretNumber;

    }

    function TestingTemp(uint256 number  ) public payable {

        shuffle();
    }

    function TestingTemp(  uint256 number, address ownerAddr) public payable {
        shuffle();

    }


    function CryptoRoulette() public {
        TestingTemp( getSecretNumber(  ), ownerAddr);
        TestingTemp(lastPlayed);

        ownerAddr = msg.sender;

        shuffle();

    }



    function shuffle() internal {

        // randomly set secretNumber with a value between 1 and 20

        secretNumber = uint8(sha3(now, block.blockhash(block.number-1))) % 20 + 1;

    }


}
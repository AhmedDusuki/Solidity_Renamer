contract EthRoulette {
    uint256 private VAR1;
    uint256 public VAR2;
    uint256 public VAR3 = 0.1 ether;
    address public VAR4;

    function FUN1() private view returns (uint256) {
        return VAR1;
    }

    function FUN2(uint256 VAR5) public payable {
        FUN5();
    }

    function FUN3(uint256 VAR6, address VAR4) public payable {
        FUN5();
    }

    function FUN4() public {
        FUN3(FUN1(), VAR4);
        FUN2(VAR2);
        VAR4 = msg.sender;
        FUN5();
    }

    function FUN5() internal {
        VAR1 =
            (uint8(sha3(now, block.blockhash(block.number - 1))) % 20) +
            1;
    }
}

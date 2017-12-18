pragma solidity ^0.4.0;
import "./Haltable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract EmploymentAgreement is Haltable {

  using SafeMath for uint;

  enum ContractPeriods {FixedPeriod, PermanentAgreement}

  uint256 public contractDate;
  address public employer;
  address public employee;

  ContractPeriods public contractPeriod;
  uint256 public startDate;
  uint256 public endDate; //Should be set if only FixedPeriod was chosen
  uint256 private lastPayment;
  uint256 public compensation;
  uint256 public startCompensation; //When we want the first compensation to be send

  mapping (address => bool) public signatures;

  uint256 public collected;

  modifier paymentAvailable(uint256 _date) {
    require(startCompensation <= _date);
    require(contractPeriod == ContractPeriods.PermanentAgreement || (_date >= startDate && _date <= endDate));
    require(_date > lastPayment);
    if (lastPayment != 0) {
      require((_date - lastPayment) / 1 days >= 28);
    }

    assert(signatures[employer]);
    assert(signatures[employee]);
    _;
  }

  modifier onlyEmployer() {
    require(msg.sender == employer);
    _;
  }

  modifier notFinished(uint256 _date) {
    assert(contractPeriod != ContractPeriods.FixedPeriod);
    _;
  }

  modifier notSignedByEmployee() {
    require(!signatures[employee]);
    _;
  }

  function EmploymentAgreement(
    uint256 date,
    address _employee,
    uint8 period,
    uint256 start,
    uint256 end,
    uint256 _startCompensation,
    uint256 _compensation
  ) {
    require(period <= 1);
    require(_startCompensation >= startDate);
    startCompensation = _startCompensation;
    contractPeriod = ContractPeriods(period);
    contractDate = date;
    employer = msg.sender;
    employee = _employee;
    signatures[msg.sender] = true;
    startDate = start;
    endDate = end;
    compensation = _compensation;
    collected = 0;
  }

  function sign() external notSignedByEmployee {
    require(msg.sender == employee);
    signatures[msg.sender] = true;
  }

  function signedByEmployer() public constant returns(bool) {
    return signatures[employer];
  }

  function signedByEmployee() public constant returns(bool) {
    return signatures[employee];
  }

  function () payable paymentAvailable(now) {
    require(msg.value >= compensation);
    lastPayment = now;
    if (msg.value > compensation) {
      collected = collected.add(msg.value.sub(compensation));
    }
    employee.transfer(compensation);
  }

  function withdraw() public onlyEmployer() {
    uint256 toSend = collected;
    collected = 0;
    employer.transfer(toSend);
  }
}

const EmploymentAgreement = artifacts.require("EmploymentAgreement");
const assertJump = function(error) {
  assert.isAbove(error.message.search('VM Exception while processing transaction'), -1, 'Invalid opcode error must be returned');
};

contract('EmploymentAgreement', function(accounts) {

  beforeEach(async function () {
    const date = 1511897802;
    this.employee = accounts[1] ;
    const period = 0;
    const start = 1511897802;
    const end = 1544572800;
    const startCompensation = 1511740800;
    this.compensation = web3.toWei(1, "ether");

    this.agreement = await EmploymentAgreement.new(date, this.employee, period, start, end, startCompensation, this.compensation);

  });

  it("Disallows to send ETH to unsigned contract", async function () {
    try {
      await this.agreement.sendTransaction({value: 1 * 10 ** 18, from: accounts[0]});
    } catch(error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });

  it("Allows employee to sign contract", async function () {
    assert.equal(await this.agreement.signedByEmployee(), false);
    await this.agreement.sign({from: this.employee});
    assert.equal(await this.agreement.signedByEmployee(), true);
  });

  it("Allows to send ETH to signed contract", async function () {
    const balanceBefore = await web3.eth.getBalance(accounts[0]);
    await this.agreement.sign({from: this.employee});
    await this.agreement.sendTransaction({value: web3.toWei(1, "ether"), from: accounts[0]});
    const balanceAfter = await web3.eth.getBalance(accounts[0]);
    assert.isBelow(balanceAfter, balanceBefore);
  });

  it("Sends funds to employee", async function () {
    const balanceBefore = await web3.eth.getBalance(this.employee);
    await this.agreement.sign({from: this.employee});
    await this.agreement.sendTransaction({value: web3.toWei(1, "ether"), from: accounts[0]});
    const balanceAfter = await web3.eth.getBalance(this.employee);
    assert.isAbove(balanceAfter, balanceBefore);
  });

  it("Collects change on the balance correctly", async function () {
    await this.agreement.sign({from: this.employee});
    const value = web3.toWei(2, "ether");
    await this.agreement.sendTransaction({value: value, from: accounts[0]});
    const collected = parseInt(await this.agreement.collected(), 10);
    assert.equal(collected, value - this.compensation);
  });

  it("Allows to withdraw change for employer", async function () {
    await this.agreement.sign({from: this.employee});
    const value = web3.toWei(2, "ether");
    await this.agreement.sendTransaction({value: value, from: accounts[0]});
    const balanceBefore = await web3.eth.getBalance(accounts[0]);
    await this.agreement.withdraw();
    const balanceAfter = await web3.eth.getBalance(accounts[0]);
    assert.isAbove(balanceAfter, balanceBefore);
    assert.equal(parseInt(await this.agreement.collected(),10), 0);
  });

  it("Don't allow to withdraw employee and 3rd parties", async function () {
    await this.agreement.sign({from: this.employee});
    await this.agreement.sendTransaction({value: web3.toWei(2, "ether"), from: accounts[0]});
    try {
      await this.agreement.withdraw({from: this.employee});
    } catch(error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');

    try {
      await this.agreement.withdraw({from: accounts[2]});
    } catch(error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });

  it("Prevents from sending salary too frequently", async function() {
    await this.agreement.sign({from: this.employee});
    const value = web3.toWei(2, "ether");
    await this.agreement.sendTransaction({value: value, from: accounts[0]});
    try {
      await this.agreement.sendTransaction({value: value, from: accounts[0]});
    } catch(error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });

  it("Should not allow to send funds before start of the contract", async function() {
    const date = 1511897802;
    const period = 0;
    const start = 1544572800;
    const end = 1544572800;
    const startCompensation = 1511740800;

    const agreement = await EmploymentAgreement.new(date, this.employee, period, start, end, startCompensation, this.compensation);

    await agreement.sign({from: this.employee});
    const value = web3.toWei(2, "ether");
    try {
      await agreement.sendTransaction({value: value, from: accounts[0]});
    } catch(error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');

  });

  it("Should not allow to send funds after end of the contract", async function() {
    const date = 1511897802;
    const period = 0;
    const start = 1511897802;
    const end = 1513337113;
    const startCompensation = 1511897802;

    const agreement = await EmploymentAgreement.new(date, this.employee, period, start, end, startCompensation, this.compensation);

    await agreement.sign({from: this.employee});
    const value = web3.toWei(2, "ether");
    try {
      await agreement.sendTransaction({value: value, from: accounts[0]});
    } catch(error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');

  });

});
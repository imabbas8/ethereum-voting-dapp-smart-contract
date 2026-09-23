import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
const { viem } = await network.create();
describe("Voting", function () {
  async function setup() {
    const [admin, ali, sara, bilal] = await viem.getWalletClients();
    const voting = await viem.deployContract("Voting", [
      ["Team Red", "Team Blue"],
    ]);
    return { admin, ali, sara, bilal, voting };
  }
  it("constructor candidates banata hai", async function () {
    const { voting } = await setup();
    assert.equal(await voting.read.candidateCount(), 2n);
    const [name, votes] = await voting.read.candidates([1n]);
    assert.equal(name, "Team Blue");
    assert.equal(votes, 0n);
  });
  it("sirf admin candidate add / voter register kar sakta hai", async function () {
    const { ali, voting } = await setup();
    await viem.assertions.revertWithCustomError(
      voting.write.addCandidate(["Team Green"], { account: ali.account }),
      voting,
      "NotAdmin",
    );
    await voting.write.addCandidate(["Team Green"]);
    assert.equal(await voting.read.candidateCount(), 3n);
    await voting.write.registerVoter([ali.account.address]);
    const [registered, voted] = await voting.read.voters([ali.account.address]);
    assert.equal(registered, true);
    assert.equal(voted, false);
    assert.equal(await voting.read.voterCount(), 1n);
    await viem.assertions.revertWithCustomError(
      voting.write.registerVoter([ali.account.address]),
      voting,
      "AlreadyRegistered",
    );
  });
  it("mapping default: anjaan address registered nahi", async function () {
    const { bilal, voting } = await setup();
    const [registered, voted, votedFor] = await voting.read.voters([
      bilal.account.address,
    ]);
    assert.equal(registered, false);
    assert.equal(voted, false);
    assert.equal(votedFor, 0n); // default 0 -- "koi nahi" nahi, bas
    0;
  });
  it("poora election", async function () {
    const { ali, sara, bilal, voting } = await setup();
    await voting.write.registerVoter([ali.account.address]);
    await voting.write.registerVoter([sara.account.address]);
    await voting.write.registerVoter([bilal.account.address]);
    // Band hai
    await viem.assertions.revertWithCustomError(
      voting.write.vote([0n], { account: ali.account }),
      voting,
      "VotingClosed",
    );
    await voting.write.openVoting();
    // Band hone ke baad candidate add nahi
    await viem.assertions.revertWithCustomError(
      voting.write.addCandidate(["Late"]),
      voting,
      "VotingStillOpen",
    );
    await voting.write.vote([0n], { account: ali.account });
    await voting.write.vote([1n], { account: sara.account });
    await voting.write.vote([1n], { account: bilal.account });
    // Doosri baar nahi
    await viem.assertions.revertWithCustomError(
      voting.write.vote([0n], { account: ali.account }),
      voting,
      "AlreadyVoted",
    );
    assert.equal(await voting.read.totalVotes(), 3n);
    assert.equal(await voting.read.hasVoted([ali.account.address]), true);
    // Natija sirf band hone ke baad
    await viem.assertions.revertWithCustomError(
      voting.read.winner(),
      voting,
      "VotingStillOpen",
    );
    await voting.write.closeVoting();
    const [name, votes] = await voting.read.winner();
    assert.equal(name, "Team Blue");
    assert.equal(votes, 2n);
  });
  it("unregistered aur bad candidate", async function () {
    const { ali, sara, voting } = await setup();
    await voting.write.registerVoter([ali.account.address]);
    await voting.write.openVoting();
    await viem.assertions.revertWithCustomError(
      voting.write.vote([0n], { account: sara.account }),
      voting,
      "NotRegistered",
    );
    await viem.assertions.revertWithCustomErrorWithArgs(
      voting.write.vote([7n], { account: ali.account }),
      voting,
      "BadCandidate",
      [7n],
    );
  });
});

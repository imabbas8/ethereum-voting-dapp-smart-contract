// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;
contract Voting {
    struct Candidate {
        string name;
        uint256 votes;
    }
    struct Voter {
        bool registered;
        bool voted;
        uint256 votedFor;
    }
    address public admin;
    bool public votingOpen;
    Candidate[] public candidates;
    mapping(address => Voter) public voters;
    address[] public voterList;
    uint256 public totalVotes;
    error NotAdmin();
    error VotingClosed();
    error VotingStillOpen();

    error NotRegistered();
    error AlreadyVoted();
    error AlreadyRegistered();
    error BadCandidate(uint256 index);
    constructor(string[] memory names) {
        admin = msg.sender;
        for (uint256 i = 0; i < names.length; i++) {
            candidates.push(Candidate({name: names[i], votes: 0}));
        }
    }
    // ---- Admin ----
    function addCandidate(string memory name) public {
        if (msg.sender != admin) revert NotAdmin();
        if (votingOpen) revert VotingStillOpen();
        candidates.push(Candidate({name: name, votes: 0}));
    }
    function registerVoter(address who) public {
        if (msg.sender != admin) revert NotAdmin();
        if (voters[who].registered) revert AlreadyRegistered();
        voters[who].registered = true;
        voterList.push(who);
    }
    function openVoting() public {
        if (msg.sender != admin) revert NotAdmin();
        votingOpen = true;
    }
    function closeVoting() public {
        if (msg.sender != admin) revert NotAdmin();
        votingOpen = false;
    }
    // ---- Voter ----
    function vote(uint256 candidateIndex) public {
        if (!votingOpen) revert VotingClosed();
        Voter storage v = voters[msg.sender]; // storage pointer
        if (!v.registered) revert NotRegistered();
        if (v.voted) revert AlreadyVoted();
        if (candidateIndex >= candidates.length)
            revert BadCandidate(candidateIndex);
        v.voted = true;
        v.votedFor = candidateIndex;
        candidates[candidateIndex].votes += 1;
        totalVotes += 1;
    }

    function candidateCount() public view returns (uint256) {
        return candidates.length;
    }
    function voterCount() public view returns (uint256) {
        return voterList.length;
    }
    function hasVoted(address who) public view returns (bool) {
        return voters[who].voted;
    }
    function winner() public view returns (string memory name, uint256 votes) {
        if (votingOpen) revert VotingStillOpen();
        uint256 best = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].votes > best) {
                best = candidates[i].votes;
                name = candidates[i].name;
            }
        }
        votes = best;
    }
}

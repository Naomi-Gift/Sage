// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SageAgent
/// @notice On-chain registry for the Sage agent identity.
/// The deployed address of this contract is used as a human-readable anchor;
/// the vault uses `profile.executor` (the hot wallet) as its authorized caller.
contract SageAgent {
    struct AgentProfile {
        string name;
        string endpoint;
        string metadataURI;
        address executor;
        bool active;
    }

    address public owner;
    AgentProfile public profile;

    event AgentRegistered(string name, address indexed executor, string endpoint, string metadataURI);
    event ExecutorUpdated(address indexed oldExecutor, address indexed newExecutor);
    event AgentStatusUpdated(bool active);
    event EndpointUpdated(string oldEndpoint, string newEndpoint);
    event MetadataUpdated(string oldMetadataURI, string newMetadataURI);

    modifier onlyOwner() {
        require(msg.sender == owner, "SageAgent: not owner");
        _;
    }

    constructor(string memory endpoint, string memory metadataURI, address executor) {
        require(executor != address(0), "SageAgent: zero executor");
        owner = msg.sender;
        profile = AgentProfile({
            name: "Sage",
            endpoint: endpoint,
            metadataURI: metadataURI,
            executor: executor,
            active: true
        });

        emit AgentRegistered("Sage", executor, endpoint, metadataURI);
    }

    // ─── Owner actions ────────────────────────────────────────────────────────

    function updateExecutor(address newExecutor) external onlyOwner {
        require(newExecutor != address(0), "SageAgent: zero executor");
        address oldExecutor = profile.executor;
        profile.executor = newExecutor;
        emit ExecutorUpdated(oldExecutor, newExecutor);
    }

    function setActive(bool active) external onlyOwner {
        profile.active = active;
        emit AgentStatusUpdated(active);
    }

    function updateEndpoint(string calldata newEndpoint) external onlyOwner {
        string memory old = profile.endpoint;
        profile.endpoint = newEndpoint;
        emit EndpointUpdated(old, newEndpoint);
    }

    function updateMetadata(string calldata newMetadataURI) external onlyOwner {
        string memory old = profile.metadataURI;
        profile.metadataURI = newMetadataURI;
        emit MetadataUpdated(old, newMetadataURI);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /// @notice Convenience getter — returns the hot-wallet address the vault
    /// should authorise as `agentExecutor`. Use this after deployment to
    /// confirm the vault and agent are in sync.
    function executorAddress() external view returns (address) {
        return profile.executor;
    }

    /// @notice Returns true if the agent is active and the given address is
    /// the registered executor. Useful for vault-side pre-flight checks.
    function isAuthorized(address caller) external view returns (bool) {
        return profile.active && profile.executor == caller;
    }
}

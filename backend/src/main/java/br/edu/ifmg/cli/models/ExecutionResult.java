package br.edu.ifmg.cli.models;

public record ExecutionResult(String stdout, String stderr, int exitCode) {
}

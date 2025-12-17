package br.edu.ifmg.cli.models;

import org.jetbrains.annotations.Nullable;

import br.edu.ifmg.cli.models.ast.AstNode;

public record RunRequest(AstNode ast, @Nullable Level level) {
}
package br.edu.ifmg.cli.models;

import br.edu.ifmg.cli.models.ast.AstNode;

public record RunRequest(AstNode ast, Level level) {
}
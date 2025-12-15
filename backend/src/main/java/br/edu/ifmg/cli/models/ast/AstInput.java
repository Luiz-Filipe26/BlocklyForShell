package br.edu.ifmg.cli.models.ast;

import java.util.List;

public record AstInput(String name, List<AstNode> children) {
}
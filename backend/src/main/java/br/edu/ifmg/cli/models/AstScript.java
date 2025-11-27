package br.edu.ifmg.cli.models;

import java.util.List;

public record AstScript(String type, List<AstNode> commands) {
}

package br.edu.ifmg.cli.models;

import java.util.Map;
import java.util.List;

public record AstNode(String id, String nodeType, String commandName, String operandName, String relatedCommand,
		Map<String, String> fields, Map<String, List<AstNode>> inputs) {
}

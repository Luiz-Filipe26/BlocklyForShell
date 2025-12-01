package br.edu.ifmg.cli.models;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

public record AstNode(String nodeType, List<AstField> fields, List<AstInput> inputs, SemanticData semanticData) {

	public AstNode {
		nodeType = nodeType != null ? nodeType : "unknown";
		fields = fields != null ? fields : Collections.emptyList();
		inputs = inputs != null ? inputs : Collections.emptyList();
	}

	public record AstField(String name, String value) {
	}

	public record AstInput(String name, List<AstNode> children) {
	}

	public record SemanticData(String commandName, String operandName, String relatedCommand) {
	}

	public Optional<String> getField(String fieldName) {
		return fields.stream().filter(field -> field.name().equals(fieldName)).findFirst().map(AstField::value);
	}

	public List<AstNode> getChildren(String inputName) {
		return inputs.stream().filter(input -> input.name().equals(inputName)).findFirst().map(AstInput::children)
				.orElse(Collections.emptyList());
	}

	public String getType() {
		return nodeType;
	}
}
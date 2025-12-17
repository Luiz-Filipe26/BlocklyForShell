package br.edu.ifmg.cli.models.ast;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.jetbrains.annotations.Nullable;

public record AstNode(String nodeType, List<AstField> fields, List<AstInput> inputs,
		@Nullable SemanticData semanticData) {
	public AstNode {
		nodeType = nodeType != null ? nodeType : "unknown";
		fields = fields != null ? fields : Collections.emptyList();
		inputs = inputs != null ? inputs : Collections.emptyList();
	}

	public Optional<String> getRawFieldValue(String technicalName) {
		return fields.stream().filter(f -> f.name().equals(technicalName)).findFirst().map(AstField::value);
	}

	public List<AstNode> getRawInputChildren(String technicalName) {
		return inputs.stream().filter(i -> i.name().equals(technicalName)).findFirst().map(AstInput::children)
				.orElse(Collections.emptyList());
	}
}
package br.edu.ifmg.cli.services;

import br.edu.ifmg.cli.models.ast.AstNode;
import br.edu.ifmg.cli.models.ast.SemanticBinding;

import br.edu.ifmg.cli.models.ast.AstVocabulary.Sources;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

public class AstNavigator {
	public List<AstNode> getNodesFromBinding(AstNode node, SemanticBinding binding) {
		if (Sources.INPUT.equals(binding.source())) {
			return node.getRawInputChildren(binding.name());
		}
		return Collections.emptyList();
	}

	public Optional<String> getValueFromBinding(AstNode node, SemanticBinding binding) {
		if (Sources.FIELD.equals(binding.source())) {
			return node.getRawFieldValue(binding.name());
		}
		return Optional.empty();
	}

	public List<AstNode> extractChildren(AstNode node, String key) {
		if (node.semanticData() == null)
			return Collections.emptyList();

		return node.semanticData().bindings().stream().filter(binding -> binding.key().equals(key)).findFirst()
				.map(binding -> getNodesFromBinding(node, binding)).orElse(Collections.emptyList());
	}

	public Optional<String> extractValue(AstNode node, String key) {
		if (node.semanticData() == null)
			return Optional.empty();

		return node.semanticData().bindings().stream().filter(binding -> binding.key().equals(key)).findFirst()
				.flatMap(binding -> getValueFromBinding(node, binding));
	}
}
package br.edu.ifmg.cli.models.ast;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.jetbrains.annotations.Nullable;

public record AstNode(String type, String name, List<AstParameter> parameters, @Nullable AstControlConfig controlConfig,
		@Nullable AstOperatorConfig operatorConfig) {
	public AstNode {
		parameters = parameters != null ? parameters : Collections.emptyList();
	}

	public Optional<AstParameter> getParameter(String key) {
		return parameters.stream().filter(p -> p.key().equals(key)).findFirst();
	}
}
package br.edu.ifmg.cli.models.ast;

import org.jetbrains.annotations.Nullable;

public record SemanticDefinition(@Nullable SemanticControlDefinition control,
		@Nullable SemanticOperatorDefinition operator) {
}
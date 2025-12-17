package br.edu.ifmg.cli.models.ast;

import org.jetbrains.annotations.Nullable;

public record SemanticOperatorSlot(String name, @Nullable String symbol, @Nullable String symbolPlacement) {
}
package br.edu.ifmg.cli.models.ast;

import org.jetbrains.annotations.Nullable;

public record SemanticControlSlot(String name, @Nullable String syntaxPrefix, boolean obligatory) {
}
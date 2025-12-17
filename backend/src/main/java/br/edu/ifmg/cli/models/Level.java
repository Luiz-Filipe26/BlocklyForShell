package br.edu.ifmg.cli.models;

import java.util.List;

import org.jetbrains.annotations.Nullable;

public record Level(String id, String title, @Nullable String summary, @Nullable String fullGuideHtml,
		@Nullable List<String> setupCommands, @Nullable String verificationScript, @Nullable String difficulty) {
}
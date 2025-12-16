package br.edu.ifmg.cli.models;

import java.util.List;

public record Level(String id, String title, String summary, String fullGuideHtml, List<String> setupCommands,
		String verificationScript, String difficulty) {
}
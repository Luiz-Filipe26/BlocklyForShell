package br.edu.ifmg.cli.models.ast;

public class AstVocabulary {

	private AstVocabulary() {
	}

	public static class Nodes {
		public static final String SCRIPT = "script";
		public static final String COMMAND = "command";
		public static final String CONTROL = "control";
		public static final String OPERATOR = "operator";
		public static final String OPTION = "option";
		public static final String OPERAND = "operand";
	}

	public static class Keys {
		public static final String OPTIONS = "options";
		public static final String OPERANDS = "operands";
		public static final String FLAG = "flag";
		public static final String VALUE = "value";
	}

	public static class Values {
		public static final String PLACEMENT_BEFORE = "before";
		public static final String PLACEMENT_AFTER = "after";
	}
}
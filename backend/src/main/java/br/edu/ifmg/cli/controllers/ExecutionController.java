package br.edu.ifmg.cli.controllers;

import java.util.Collections;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import br.edu.ifmg.cli.models.ExecutionResult;
import br.edu.ifmg.cli.models.RunRequest;
import br.edu.ifmg.cli.services.SandboxRunner;
import br.edu.ifmg.cli.services.ScriptGenerator;
import io.javalin.Javalin;
import io.javalin.http.Context;

public class ExecutionController {

	private static final Logger logger = LoggerFactory.getLogger(ExecutionController.class);
	private final ScriptGenerator generator;
	private final SandboxRunner runner;

	public ExecutionController(ScriptGenerator gen, SandboxRunner run) {
		this.generator = gen;
		this.runner = run;
	}

	public void registerRoutes(Javalin app) {
		app.post("/api/run", this::run);
	}

	private void run(Context ctx) {
		try {
			RunRequest request = ctx.bodyAsClass(RunRequest.class);
			String userScript = generator.generate(request.ast());

			List<String> setupCmds = Collections.emptyList();
			String verifyScript = "";

			if (request.level() != null) {
				if (request.level().setupCommands() != null) {
					setupCmds = request.level().setupCommands();
				}

				if (request.level().verificationScript() != null) {
					verifyScript = request.level().verificationScript();
				}
			}

			ExecutionResult result = runner.run(userScript, setupCmds, verifyScript);
			ctx.json(result);

		} catch (Exception e) {
			logger.error("Erro na execução stateless com instância de Level", e);
			ctx.status(400).json(new ExecutionResult("", "Erro: " + e.getMessage(), 1));
		}
	}
}
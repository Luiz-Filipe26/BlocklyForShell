package br.edu.ifmg.cli.controllers;

import java.util.Collections;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import br.edu.ifmg.cli.models.ExecutionResult;
import br.edu.ifmg.cli.models.Level;
import br.edu.ifmg.cli.models.RunRequest;
import br.edu.ifmg.cli.services.LevelService;
import br.edu.ifmg.cli.services.SandboxRunner;
import br.edu.ifmg.cli.services.ScriptGenerator;
import io.javalin.Javalin;
import io.javalin.http.Context;

public class ExecutionController {

	private static final Logger logger = LoggerFactory.getLogger(ExecutionController.class);

	private final ScriptGenerator generator;
	private final SandboxRunner runner;
	private final LevelService levelService;

	public ExecutionController(ScriptGenerator gen, SandboxRunner run, LevelService lvl) {
		this.generator = gen;
		this.runner = run;
		this.levelService = lvl;
	}

	public void registerRoutes(Javalin app) {
		app.post("/api/run", this::run);
		app.get("/api/game-data", this::getGameData);
	}

	private void getGameData(Context ctx) {
		ctx.json(levelService.getGameData());
	}

	private void run(Context ctx) {
		try {
			RunRequest request = ctx.bodyAsClass(RunRequest.class);

			String userScript = generator.generate(request.ast());

			var setupCmds = Collections.<String>emptyList();
			String verifyScript = "";

			if (request.levelId() != null && !request.levelId().isEmpty()) {
				Level level = levelService.getLevel(request.levelId())
						.orElseThrow(() -> new RuntimeException("Nível não encontrado"));

				setupCmds = level.setupCommands();
				verifyScript = level.verificationScript();
			}

			ExecutionResult result = runner.run(userScript, setupCmds, verifyScript);

			ctx.json(result);

		} catch (Exception e) {
			logger.error("Erro ao processar requisição", e);
			ctx.status(400).json(new ExecutionResult("", "Erro: " + e.getMessage(), 1));
		}
	}
}
package br.edu.ifmg.cli.controllers;

import io.javalin.Javalin;
import io.javalin.http.Context;
import br.edu.ifmg.cli.models.AstNode;
import br.edu.ifmg.cli.models.ExecutionResult;
import br.edu.ifmg.cli.models.Level;
import br.edu.ifmg.cli.models.RunRequest; // <--- Novo DTO
import br.edu.ifmg.cli.services.ScriptGenerator;
import br.edu.ifmg.cli.services.SandboxRunner;
import br.edu.ifmg.cli.services.LevelService; // <--- Novo Service
import java.util.Collections;

public class ExecutionController {

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
        app.get("/api/game-data", this::getGameData); // Mudança de nome para clareza
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
            e.printStackTrace();
            ctx.status(400).json(new ExecutionResult("", "Erro: " + e.getMessage(), 1));
        }
    }
}
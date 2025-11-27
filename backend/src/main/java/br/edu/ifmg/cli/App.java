package br.edu.ifmg.cli;

import br.edu.ifmg.cli.controllers.DefinitionController;
import br.edu.ifmg.cli.controllers.ExecutionController;
import br.edu.ifmg.cli.services.SandboxRunner;
import br.edu.ifmg.cli.services.ScriptGenerator;
import io.javalin.Javalin;

public class App {
	private static final String[] CORS_ALLOWED_HOSTS = {"http://localhost:5173"};
	private static int APP_PORT = 7000;

    public static void main(String[] args) {
        var app = Javalin.create(config -> {
            config.bundledPlugins.enableCors(cors -> {
                cors.addRule(it -> {
                	for(var host : CORS_ALLOWED_HOSTS) {
                		it.allowHost(host);
                	}
                });
            });
            config.http.defaultContentType = "application/json";
        });
        
        var scriptGenerator = new ScriptGenerator();
        var sandboxRunner = new SandboxRunner();

        new DefinitionController().registerRoutes(app);
        new ExecutionController(scriptGenerator, sandboxRunner).registerRoutes(app);

        app.start(APP_PORT);
    }
}
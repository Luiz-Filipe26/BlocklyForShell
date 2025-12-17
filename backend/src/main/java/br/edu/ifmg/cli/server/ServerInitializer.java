package br.edu.ifmg.cli.server;

import java.lang.reflect.Type;

import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.gson.GsonBuilder;

import br.edu.ifmg.cli.config.ServerConfig;
import br.edu.ifmg.cli.controllers.DefinitionController;
import br.edu.ifmg.cli.controllers.ExecutionController;
import br.edu.ifmg.cli.controllers.LevelController;
import br.edu.ifmg.cli.controllers.ScriptController;
import br.edu.ifmg.cli.services.DockerService;
import br.edu.ifmg.cli.services.LevelService;
import br.edu.ifmg.cli.services.SandboxRunner;
import br.edu.ifmg.cli.services.ScriptGenerator;
import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;
import io.javalin.json.JsonMapper;

public class ServerInitializer {

	private static final String PUBLIC_FOLDER = "/public";
	private static final Logger logger = LoggerFactory.getLogger(ServerInitializer.class);

	public void start(ServerConfig config) {
		var jsonMapper = createJsonMapper();
		Javalin app = createJavalinApp(config, jsonMapper);
		String dockerPrefix = prepareDockerEnvironment();
		registerControllers(app, dockerPrefix);
		startServer(app, config.port());
	}

	private JsonMapper createJsonMapper() {
		var gson = new GsonBuilder().create();
		return new JsonMapper() {
			@Override
			public String toJsonString(@NotNull Object obj, @NotNull Type type) {
				return gson.toJson(obj, type);
			}

			@Override
			public <T> T fromJsonString(@NotNull String json, @NotNull Type targetType) {
				return gson.fromJson(json, targetType);
			}
		};
	}

	private Javalin createJavalinApp(ServerConfig config, JsonMapper jsonMapper) {
		return Javalin.create(javalinConfig -> {
			javalinConfig.staticFiles.add(PUBLIC_FOLDER, Location.CLASSPATH);
			javalinConfig.jsonMapper(jsonMapper);

			javalinConfig.bundledPlugins.enableCors(cors -> {
				cors.addRule(it -> {
					it.allowHost(config.devFrontendUrl());
					it.allowHost("http://localhost:" + config.port());
				});
			});
			javalinConfig.http.defaultContentType = "application/json";
		});
	}

	private String prepareDockerEnvironment() {
		var dockerService = new DockerService();
		dockerService.ensureImageExists();
		return dockerService.getCommandPrefix();
	}

	private void registerControllers(Javalin app, String dockerPrefix) {
		var scriptGenerator = new ScriptGenerator();
		var sandboxRunner = new SandboxRunner(dockerPrefix);
		var levelService = new LevelService();
		new DefinitionController().registerRoutes(app);
		new LevelController(levelService).registerRoutes(app);
		new ExecutionController(scriptGenerator, sandboxRunner, levelService).registerRoutes(app);
		new ScriptController(scriptGenerator).registerRoutes(app);
	}

	private void startServer(Javalin app, int port) {
		app.start(port);
		logger.info("Servidor Backend iniciado na porta {}", port);
		logger.info("Clique em \"Abrir Navegador\" para começar.");
	}
}
package br.edu.ifmg.cli;

import java.awt.Desktop;
import java.awt.Image;
import java.lang.reflect.Type;
import java.net.URI;
import java.util.Arrays;
import java.util.List;

import javax.imageio.ImageIO;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.SwingConstants;
import javax.swing.SwingUtilities;

import org.jetbrains.annotations.NotNull;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import br.edu.ifmg.cli.controllers.DefinitionController;
import br.edu.ifmg.cli.controllers.ExecutionController;
import br.edu.ifmg.cli.controllers.ScriptController;
import br.edu.ifmg.cli.services.DockerService;
import br.edu.ifmg.cli.services.LevelService;
import br.edu.ifmg.cli.services.SandboxRunner;
import br.edu.ifmg.cli.services.ScriptGenerator;
import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;
import io.javalin.json.JsonMapper;

public class App {
	private static final String[] CORS_ALLOWED_HOSTS = { "http://localhost:5173" };
	private static final int APP_PORT = 7000;
	private static final String APP_URL = "http://localhost:" + APP_PORT;

	public static void main(String[] args) {
		new DockerService().ensureImageExists();
		var serverThread = new Thread(App::startServer);
		serverThread.setName("JavalinServerThread");
		serverThread.start();

		SwingUtilities.invokeLater(App::createLauncherGUI);
	}

	private static void startServer() {
		Gson gson = new GsonBuilder().create();
		JsonMapper gsonMapper = new JsonMapper() {
			@Override
			public String toJsonString(@NotNull Object obj, @NotNull Type type) {
				return gson.toJson(obj, type);
			}

			@Override
			public <T> T fromJsonString(@NotNull String json, @NotNull Type targetType) {
				return gson.fromJson(json, targetType);
			}
		};

		var app = Javalin.create(config -> {
			config.staticFiles.add("/public", Location.CLASSPATH);

			config.jsonMapper(gsonMapper);

			config.bundledPlugins.enableCors(cors -> {
				cors.addRule(it -> {
					Arrays.stream(CORS_ALLOWED_HOSTS).forEach(it::allowHost);
					it.allowHost(APP_URL);
				});
			});

			config.http.defaultContentType = "application/json";
		});

		var scriptGenerator = new ScriptGenerator();
		var sandboxRunner = new SandboxRunner();
		var levelService = new LevelService();

		new DefinitionController().registerRoutes(app);
		new ExecutionController(scriptGenerator, sandboxRunner, levelService).registerRoutes(app);
		new ScriptController(scriptGenerator).registerRoutes(app);

		app.start(APP_PORT);
	}

	private static void createLauncherGUI() {
		var frame = new JFrame("TCC Launcher");
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		frame.setSize(300, 150);
		frame.setLocationRelativeTo(null);
		frame.setLayout(null);

		try (var stream = App.class.getResourceAsStream("/launcher_icon.png")) {
			if (stream != null) {
				Image icon = ImageIO.read(stream);
				frame.setIconImages(List.of(icon));
			}
		} catch (Exception e) {
			System.err.println("Aviso: Falha ao carregar o ícone da aplicação. " + e.getMessage());
		}

		var label = new JLabel("Servidor rodando em: " + APP_PORT);
		label.setBounds(0, 20, 280, 20);
		label.setHorizontalAlignment(SwingConstants.CENTER);
		frame.add(label);

		var openOnBrowserButton = new JButton("Abrir Navegador");
		openOnBrowserButton.setBounds(50, 60, 180, 30);
		openOnBrowserButton.addActionListener(e -> {
			try {
				Desktop.getDesktop().browse(new URI(APP_URL));
			} catch (Exception ex) {
				ex.printStackTrace();
			}
		});
		frame.add(openOnBrowserButton);

		frame.setVisible(true);
	}
}
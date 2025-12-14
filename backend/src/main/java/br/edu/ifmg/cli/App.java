package br.edu.ifmg.cli;

import java.io.InputStream;
import java.util.Optional;
import java.util.Properties;

import javax.swing.SwingUtilities;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import br.edu.ifmg.cli.config.ServerConfig;
import br.edu.ifmg.cli.server.ServerInitializer;
import br.edu.ifmg.cli.services.DockerService;
import br.edu.ifmg.cli.ui.LauncherWindow;

public class App {
	private static final Logger logger = LoggerFactory.getLogger(App.class);

	public static void main(String[] args) {
		SwingUtilities.invokeLater(() -> {
			LauncherWindow window = new LauncherWindow();
			window.startLogRedirection();
			window.setVisible(true);
			new Thread(() -> startBackendLogic(window), "BackendInitThread").start();
		});
	}

	private static void startBackendLogic(LauncherWindow window) {
		Optional<ServerConfig> optionalConfig = loadConfiguration();

		if (optionalConfig.isEmpty()) {
			logger.error("❌ ERRO FATAL: Inicialização abortada devido a falha na configuração.");
			logger.error("👉 Verifique se o arquivo 'application.properties' existe e está correto.");
			return;
		}

		ServerConfig config = optionalConfig.get();

		try {
			logger.info("✅ Configuração carregada.");
			logger.info("   Porta: {}", config.port());
			logger.info("   Ambiente DEV (CORS): {}", config.devFrontendUrl());
			window.setWebAppUrl("http://localhost:" + config.port());

			new DockerService().ensureImageExists();
			new ServerInitializer().start(config);
			window.enableBrowserButton();

		} catch (Exception e) {
			logger.error("❌ ERRO FATAL NA INICIALIZAÇÃO");
			logger.error("Motivo: {}", e.getMessage());

			if (e.getCause() != null) {
				logger.error("Detalhes: {}", e.getCause().getMessage());
			}
		}
	}

	private static Optional<ServerConfig> loadConfiguration() {
		try (InputStream input = App.class.getClassLoader().getResourceAsStream("application.properties")) {

			if (input == null) {
				logger.error("❌ Arquivo 'application.properties' não encontrado no classpath.");
				return Optional.empty();
			}

			Properties properties = new Properties();
			properties.load(input);

			String portString = properties.getProperty("server.port");
			String devFrontEndUrl = properties.getProperty("server.dev.frontend-url");

			if (portString == null || portString.isBlank()) {
				logger.error("❌ Chave 'server.port' ausente em application.properties.");
				return Optional.empty();
			}
			if (devFrontEndUrl == null || devFrontEndUrl.isBlank()) {
				logger.error("❌ Chave 'server.dev.frontend-url' ausente em application.properties.");
				return Optional.empty();
			}

			int port = Integer.parseInt(portString);
			return Optional.of(new ServerConfig(port, devFrontEndUrl));

		} catch (NumberFormatException e) {
			logger.error("❌ 'server.port' não é um número válido.");
			return Optional.empty();
		} catch (Exception e) {
			logger.error("❌ Falha de I/O ao ler application.properties: {}", e.getMessage());
			return Optional.empty();
		}
	}
}
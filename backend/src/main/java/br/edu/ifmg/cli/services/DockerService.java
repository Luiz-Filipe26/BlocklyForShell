package br.edu.ifmg.cli.services;

import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DockerService {

	public static final String IMAGE_NAME = "blockly-shell-env";
	public static final String DOCKERFILE_RESOURCE = "/docker/Dockerfile";

	private static final Logger logger = LoggerFactory.getLogger(DockerService.class);

	private String commandPrefix = "docker";

	public String getCommandPrefix() {
		return commandPrefix;
	}

	public void ensureImageExists() {
		logger.info("[DockerService] Verificando ambiente...");
		try {
			if (!checkDockerBinary())
				return;
			if (!checkDockerPermissions())
				return;
			buildImage();
		} catch (Exception e) {
			logger.error("[DockerService] Erro crítico: ", e);
		}
	}

	private boolean checkDockerBinary() {
		try {
			int exitCode = new ProcessBuilder("docker", "--version").start().waitFor();
			if (exitCode != 0) {
				logger.error("[DockerService] Docker não encontrado.");
				return false;
			}
			return true;
		} catch (Exception e) {
			logger.error("[DockerService] Binário 'docker' não achado no PATH.");
			return false;
		}
	}

	private boolean checkDockerPermissions() {
		try {
			if (new ProcessBuilder("docker", "ps").start().waitFor() == 0) {
				logger.info("[DockerService] Permissão direta OK.");
				this.commandPrefix = "docker";
				return true;
			}

			logger.warn("[DockerService] Tentando sudo...");
			if (new ProcessBuilder("sudo", "-n", "docker", "ps").start().waitFor() == 0) {
				logger.info("[DockerService] Permissão via sudo OK.");
				this.commandPrefix = "sudo -n docker";
				return true;
			}

			logger.error("[DockerService] Sem permissão (nem direto, nem sudo sem senha).");
			return false;
		} catch (Exception e) {
			logger.error("[DockerService] Erro checando permissões: ", e);
			return false;
		}
	}

	private void buildImage() throws Exception {
		Path tempDir = Files.createTempDirectory("blockly_docker_build");
		try {
			logger.info("[DockerService] Buildando imagem...");
			extractResource(DOCKERFILE_RESOURCE, tempDir.resolve("Dockerfile"));

			var cmd = new ArrayList<String>(Arrays.asList(commandPrefix.split("\\s+")));
			cmd.addAll(List.of("build", "-t", IMAGE_NAME, "."));

			ProcessBuilder pb = new ProcessBuilder(cmd);
			pb.directory(tempDir.toFile());
			pb.redirectErrorStream(true);

			Process process = pb.start();
			process.getInputStream().transferTo(System.out);

			if (process.waitFor() == 0) {
				logger.info("[DockerService] Imagem pronta.");
			} else {
				logger.error("[DockerService] Falha no build.");
			}
		} finally {
			deleteDirectory(tempDir);
		}
	}

	private void extractResource(String resource, Path directory) throws IOException {
		URL url = getClass().getResource(resource);
		if (url == null)
			throw new IOException("Not found: " + resource);
		try (var inputStream = url.openStream()) {
			Files.copy(inputStream, directory, StandardCopyOption.REPLACE_EXISTING);
		}
	}

	private void deleteDirectory(Path path) {
		try {
			Files.walk(path).sorted(Comparator.reverseOrder()).forEach(file -> {
				try {
					Files.delete(file);
				} catch (IOException e) {
				}
			});
		} catch (IOException e) {
		}
	}
}
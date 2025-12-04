package br.edu.ifmg.cli.services;

import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;

public class DockerService {

	public static final String IMAGE_NAME = "blockly-shell-env";

	public static final String DOCKERFILE_RESOURCE = "/docker/Dockerfile";

	public void ensureImageExists() {
		System.out.println("🐳 [DockerService] Verificando ambiente...");

		try {
			if (!checkDockerBinary())
				return;
			if (!checkDockerPermissions())
				return;

			// Se chegou aqui, tenta buildar
			buildImage();

		} catch (Exception e) {
			System.err.println("❌ [DockerService] Erro crítico não tratado: " + e.getMessage());
			e.printStackTrace();
		}
	}

	private boolean checkDockerBinary() {
		try {
			int exitCode = new ProcessBuilder("docker", "--version").start().waitFor();
			if (exitCode != 0) {
				System.err.println("❌ [DockerService] 'docker --version' retornou erro. O Docker está instalado?");
				return false;
			}
			return true;
		} catch (Exception e) {
			System.err.println("❌ [DockerService] Não foi possível encontrar o binário 'docker' no PATH.");
			return false;
		}
	}

	private boolean checkDockerPermissions() {
		try {
			int exitCode = new ProcessBuilder("docker", "ps").start().waitFor();
			if (exitCode != 0) {
				System.err.println("❌ [DockerService] Permissão negada ao acessar o Docker Daemon.");
				System.err.println("   -> Execute: sudo usermod -aG docker $USER");
				System.err.println("   -> Depois faça Logout/Login.");
				return false;
			}
			return true;
		} catch (Exception e) {
			System.err.println("❌ [DockerService] Erro ao verificar permissões: " + e.getMessage());
			return false;
		}
	}

	private void buildImage() throws Exception {
		Path tempDir = Files.createTempDirectory("blockly_docker_build");
		try {
			System.out.println("🔨 [DockerService] Iniciando build da imagem '" + IMAGE_NAME + "'...");

			extractResource(DOCKERFILE_RESOURCE, tempDir.resolve("Dockerfile"));

			ProcessBuilder pb = new ProcessBuilder("docker", "build", "-t", IMAGE_NAME, ".");
			pb.directory(tempDir.toFile());
			pb.redirectErrorStream(true);

			Process process = pb.start();

			process.getInputStream().transferTo(System.out);

			int exitCode = process.waitFor();

			if (exitCode == 0) {
				System.out.println("✅ [DockerService] Imagem pronta com sucesso!");
			} else {
				System.err.println("❌ [DockerService] Falha no 'docker build'. Código de saída: " + exitCode);
			}

		} finally {
			deleteDirectory(tempDir);
		}
	}

	private void extractResource(String resourcePath, Path destination) throws IOException {
		URL url = getClass().getResource(resourcePath);
		if (url == null)
			throw new IOException("Resource not found: " + resourcePath);
		try (var stream = url.openStream()) {
			Files.copy(stream, destination, StandardCopyOption.REPLACE_EXISTING);
		}
	}

	private void deleteDirectory(Path path) {
		try {
			Files.walk(path).sorted(Comparator.reverseOrder()).forEach(p -> {
				try {
					Files.delete(p);
				} catch (IOException ignored) {
				}
			});
		} catch (IOException e) {
		}
	}
}
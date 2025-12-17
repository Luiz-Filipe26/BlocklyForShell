package br.edu.ifmg.cli.services;

import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DockerService {

    public static final String IMAGE_NAME = "blockly-shell-env";
    public static final String DOCKERFILE_RESOURCE = "/docker/Dockerfile";
    
    private static final Logger logger = LoggerFactory.getLogger(DockerService.class);

    // Armazena o comando base: ["docker"] ou ["sudo", "docker"]
    private static List<String> dockerCommandPrefix = new ArrayList<>();

    /**
     * Retorna o comando base determinado durante a verificação.
     * Ex: ["docker"] ou ["sudo", "docker"]
     */
    public static List<String> getDockerCommand() {
        if (dockerCommandPrefix.isEmpty()) {
            return List.of("docker"); // Default
        }
        return new ArrayList<>(dockerCommandPrefix);
    }

    public void ensureImageExists() {
        logger.info("[DockerService] Verificando ambiente...");

        try {
            if (!checkDockerBinary()) return;
            if (!checkDockerPermissions()) return;
            
            buildImage();

        } catch (Exception e) {
            logger.error("[DockerService] Erro crítico não tratado: ", e);
        }
    }

    private boolean checkDockerBinary() {
        try {
            int exitCode = new ProcessBuilder("docker", "--version").start().waitFor();
            if (exitCode != 0) {
                logger.error("[DockerService] \"docker --version\" retornou erro. O Docker está instalado?");
                return false;
            }
            return true;
        } catch (Exception e) {
            logger.error("[DockerService] Não foi possível encontrar o binário \"docker\" no PATH.");
            return false;
        }
    }

    private boolean checkDockerPermissions() {
        try {
            // TENTATIVA 1: Docker direto (sem sudo) - Ideal para quem adicionou o user ao grupo docker
            int exitCode = new ProcessBuilder("docker", "ps").start().waitFor();
            if (exitCode == 0) {
                logger.info("[DockerService] Docker detectado com permissões de usuário (sem sudo).");
                dockerCommandPrefix = List.of("docker");
                return true;
            }

            // TENTATIVA 2: Docker com sudo (non-interactive)
            logger.warn("[DockerService] Acesso direto negado. Tentando via sudo...");
            int sudoExitCode = new ProcessBuilder("sudo", "-n", "docker", "ps").start().waitFor();
            
            if (sudoExitCode == 0) {
                logger.info("[DockerService] Permissão obtida via sudo.");
                dockerCommandPrefix = List.of("sudo", "docker");
                return true;
            }

            // Se falhar ambos
            logger.error("[DockerService] Permissão negada ao acessar o Docker Daemon (mesmo com sudo).");
            logger.error("   -> Certifique-se de que o usuário está no grupo docker OU tem permissão de sudo sem senha.");
            logger.error("   -> Execute: sudo usermod -aG docker $USER e faça Logout/Login.");
            return false;

        } catch (Exception e) {
            logger.error("[DockerService] Erro ao verificar permissões: ", e);
            return false;
        }
    }

    private void buildImage() throws Exception {
        Path tempDir = Files.createTempDirectory("blockly_docker_build");
        try {
            logger.info("[DockerService] Iniciando build da imagem \"{}\"...", IMAGE_NAME);

            extractResource(DOCKERFILE_RESOURCE, tempDir.resolve("Dockerfile"));

            // Constrói o comando dinamicamente baseada no prefixo (com ou sem sudo)
            List<String> cmd = new ArrayList<>(getDockerCommand());
            cmd.add("build");
            cmd.add("-t");
            cmd.add(IMAGE_NAME);
            cmd.add(".");

            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.directory(tempDir.toFile());
            pb.redirectErrorStream(true);

            Process process = pb.start();
            process.getInputStream().transferTo(System.out);

            int exitCode = process.waitFor();

            if (exitCode == 0) {
                logger.info("[DockerService] Imagem pronta com sucesso!");
            } else {
                logger.error("[DockerService] Falha no \"docker build\". Código de saída: {}", exitCode);
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

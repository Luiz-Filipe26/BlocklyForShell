package br.edu.ifmg.cli.services;

import br.edu.ifmg.cli.models.ExecutionResult;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class SandboxRunner {

    private static final int TIMEOUT_SECONDS = 5;

    public ExecutionResult run(String userScript, List<String> setupCommands, String verificationScript) {
        Path volumeDir = null;
        try {
            volumeDir = Files.createTempDirectory("sandbox_vol_");

            StringBuilder fullScript = new StringBuilder();
            if (setupCommands != null && !setupCommands.isEmpty()) {
                for (String cmd : setupCommands) fullScript.append(cmd).append(" && ");
            }
            fullScript.append("echo '--- INICIO DA EXECUÇÃO ---';\n");
            fullScript.append(userScript).append(" ;\n");
            fullScript.append("echo '--- VERIFICACAO ---';\n");
            String verify = (verificationScript != null && !verificationScript.isBlank()) ? verificationScript : "exit 0";
            fullScript.append(verify);

            ProcessBuilder pb = new ProcessBuilder(
                "docker", "run", 
                "--rm", "--net", "none", "--memory", "100m",
                "-v", volumeDir.toAbsolutePath().toString() + ":/home/aluno",
                DockerService.IMAGE_NAME,
                "bash", "-c", fullScript.toString()
            );

            Process process = pb.start();
            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            String stdout;
            String stderr;
            int exitCode;

            if (!finished) {
                process.destroyForcibly();
                stdout = "";
                stderr = "⏱️ Tempo limite excedido (" + TIMEOUT_SECONDS + "s).";
                exitCode = 124;
            } else {
                stdout = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
                exitCode = process.exitValue();

                if (exitCode == 125 || exitCode == 126 || exitCode == 127) {
                    stderr = "\n[ERRO CRÍTICO DOCKER] O container falhou ao iniciar (Código " + exitCode + ").\n" + stderr;
                }
            }

            return new ExecutionResult(stdout, stderr, exitCode);

        } catch (Exception e) {
            e.printStackTrace();
            return new ExecutionResult("", "Erro interno no SandboxRunner: " + e.getMessage(), 1);
        } finally {
            if (volumeDir != null) deleteDirectory(volumeDir);
        }
    }

    private void deleteDirectory(Path path) {
        try {
            Files.walk(path)
                .sorted(Comparator.reverseOrder())
                .forEach(p -> {
                    try { Files.delete(p); } catch (IOException ignored) {}
                });
        } catch (IOException e) {
            System.err.println("Aviso: Falha ao limpar temp dir: " + e.getMessage());
        }
    }
}
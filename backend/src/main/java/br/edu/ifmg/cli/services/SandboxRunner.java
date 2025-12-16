package br.edu.ifmg.cli.services;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import br.edu.ifmg.cli.models.ExecutionResult;

public class SandboxRunner {

    private static final int TIMEOUT_SECONDS = 8;
    private static final Logger logger = LoggerFactory.getLogger(SandboxRunner.class);

    public ExecutionResult run(String userScript, List<String> setupCommands, String verificationScript) {
        
        try {
            StringBuilder fullScript = new StringBuilder();

            if (setupCommands != null && !setupCommands.isEmpty()) {
                fullScript.append("{ ");
                for (String cmd : setupCommands) {
                    fullScript.append(cmd).append(" ; ");
                }
                fullScript.append(" } > /dev/null 2>&1 && ");
            }

            fullScript.append(" ( ");
            fullScript.append(userScript);
            fullScript.append(" ) | tee .last_cmd_out && ");

            String verify = (verificationScript != null && !verificationScript.isBlank()) 
                            ? verificationScript 
                            : "exit 0";
            
            fullScript.append("\n").append(verify);

            ProcessBuilder pb = new ProcessBuilder(
                "docker", "run", 
                "--rm",
                "--net", "none",
                "--memory", "100m",
                "--cpus", "0.5",
                DockerService.IMAGE_NAME, 
                "bash", "-c", 
                fullScript.toString()
            );

            Process process = pb.start();
            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            String stdout;
            String stderr;
            int exitCode;

            if (!finished) {
                process.destroyForcibly();
                stdout = "";
                stderr = "⏱️ Tempo limite excedido (" + TIMEOUT_SECONDS + "s). Loop infinito ou comando travado?";
                exitCode = 124;
            } else {
                stdout = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
                exitCode = process.exitValue();

                if (exitCode == 125 || exitCode == 126 || exitCode == 127) {
                    stderr = "\n[ERRO SISTEMA] Falha no container (Exit " + exitCode + ").\n" + stderr;
                }
            }

            return new ExecutionResult(stdout, stderr, exitCode);

        } catch (Exception e) {
            logger.error("Erro interno no SandboxRunner", e);
            return new ExecutionResult("", "Erro interno: " + e.getMessage(), 1);
        }
        // REMOVIDO: finally { deleteDirectory... } -> O Docker --rm já faz a limpeza!
    }
}
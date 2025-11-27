package br.edu.ifmg.cli.services;

import br.edu.ifmg.cli.models.ExecutionResult;

/**
 * Stub de execução segura.
 * FUTURAMENTE:
 *   - Criar container isolado
 *   - Montar diretório temporário
 *   - Executar script com limites
 *   - Coletar stdout, stderr e saída
 */
public class SandboxRunner {

    public ExecutionResult run(String script) {

        // Por enquanto: apenas simula execução
        String fakeOut = "Simulação de execução:\n" + script;
        String fakeErr = "";
        int fakeCode = 0;

        return new ExecutionResult(fakeOut, fakeErr, fakeCode);
    }
}
